// Gap content: System Design case studies (part A)
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_GAPS_SYS_A: Record<string, TopicContent> = {
  "design-rate-limiter": {
    slug: "design-rate-limiter",
    title: "Design a Rate Limiter",
    tagline: "Token buckets, Redis Lua atomicity, and 429s at the edge",
    sections: [
      {
        type: "text",
        heading: "Defining the Problem",
        content:
          "Design a rate limiter: a component that caps how many requests a client may make in a window of time, returning an error once the budget is spent. Every serious API has one — it protects downstream services from abuse and accidental overload, enforces fair use across tenants, and underpins paid tiers.\n\nThe interviewer is not asking for an `if` statement. They are asking how you make a limiter that stays correct when hundreds of stateless app servers share the same counter, how it behaves under a distributed burst, and where in the request path you place it so it fails safely.",
      },
      {
        type: "text",
        heading: "Functional and Non-Functional Requirements",
        content:
          "**Functional:** limit requests by key (API key, user ID, or IP); support multiple rules, e.g. 100 requests/minute and 10,000/day; return HTTP 429 with a Retry-After header when exceeded; expose remaining quota via X-RateLimit headers; allow different limits per tier; degrade gracefully if the limiter itself is unavailable.\n\n**Non-functional:** extremely low latency (the check must add single-digit milliseconds, ideally under 1ms); high throughput (it sits in every request path); correct under concurrency so two simultaneous requests cannot both slip past the last token; available, since a dead limiter that blocks all traffic is worse than one that lets some through; and eventually consistent counters across a cluster.",
      },
      {
        type: "analogy",
        heading: "The Bouncer with a Rope",
        content:
          "Picture a club with a velvet rope. The bouncer holds a fixed number of wristbands and hands one out per guest. When the wristbands run out, guests wait. Wristbands are handed back over time, so the door refills steadily rather than all at once.\n\nA **token bucket** is that bouncer. Tokens drip into the bucket at a fixed rate, each request spends one, and an empty bucket means wait. The bucket's size is the bouncer's willingness to tolerate a rush before the very first guest is ever turned away — the burst capacity.",
      },
      {
        type: "text",
        heading: "Back-of-the-Envelope Estimation",
        content:
          "Assume 200 API gateway instances, each handling 5,000 requests per second at peak, so roughly 1,000,000 requests per second cluster-wide. Every request needs one limiter check, and a token-bucket check is a single keyed read-modify-write plus a refill calculation.\n\nAt 1M checks per second, a single Redis instance (comfortably 100k–200k ops/sec for scripted operations) is not enough, so you shard the counter keyspace across a Redis cluster. The keys, not the requests, determine placement: all requests for one API key must hit the same shard so the decrement is atomic. That is the central constraint.",
      },
      {
        type: "code",
        heading: "Sizing the Limiter",
        language: "typescript",
        label: "limiter-sizing.ts",
        code: `// Back-of-the-envelope sizing for a distributed rate limiter
const gateways = 200;
const peakRpsPerGateway = 5_000;
const clusterRps = gateways * peakRpsPerGateway;      // ~1,000,000 rps

// Each check is one scripted Redis op plus a small amount of overhead
const opsPerCheck = 1.2;
const redisOpsPerSec = clusterRps * opsPerCheck;      // ~1.2M ops/sec

// A Redis shard sustains roughly 100k scripted ops/sec at safe headroom
const opsPerShard = 100_000;
const shardsNeeded = Math.ceil(redisOpsPerSec / opsPerShard); // ~12 shards

// One bucket per API key, keyed so all of a key's traffic lands on one shard
const activeKeys = 10_000_000;
const bucketBytes = 128;                               // tokens + timestamp + TTL
const memoryGb = (activeKeys * bucketBytes) / 1e9;     // ~1.3 GB
console.log({ clusterRps, shardsNeeded, memoryGb });`,
      },
      {
        type: "text",
        heading: "The Algorithms",
        content:
          '**Fixed window** divides time into buckets (say each minute) and counts requests per bucket. It is trivial and memory-light but allows a burst of up to 2x the limit across a window boundary — 100 requests in the last second of one minute and 100 in the first second of the next.\n\n**Sliding window log** stores the timestamp of every request and counts those within the trailing window. Exact, but memory grows with the limit since you keep one entry per request. **Sliding window counter** approximates the exact count by weighting the previous and current fixed windows — cheap and smooth, at the cost of a small approximation error.\n\n**Token bucket** refills at a steady rate and allows bursts up to the bucket capacity; it is the default choice because it maps naturally to "sustained rate plus burst allowance." **Leaky bucket** drains at a fixed rate, smoothing output — ideal when downstream systems need a constant flow rather than bursts.',
      },
      {
        type: "comparison",
        heading: "Token Bucket vs Sliding Window Counter",
        headers: ["Token Bucket", "Sliding Window Counter"],
        rows: [
          {
            aspect: "State per key",
            "Token Bucket": "Tokens remaining + last refill time",
            "Sliding Window Counter": "Two counters + window start",
          },
          {
            aspect: "Bursts",
            "Token Bucket": "Allowed up to bucket capacity",
            "Sliding Window Counter": "Smoothly bounded, no sharp burst",
          },
          {
            aspect: "Accuracy",
            "Token Bucket": "Exact rate, exact burst ceiling",
            "Sliding Window Counter": "Approximate (weighted estimate)",
          },
          {
            aspect: "Memory",
            "Token Bucket": "O(1)",
            "Sliding Window Counter": "O(1)",
          },
          {
            aspect: "Boundary artifact",
            "Token Bucket": "None",
            "Sliding Window Counter": "None (unlike fixed window)",
          },
          {
            aspect: "Best for",
            "Token Bucket": "Public APIs with burst tolerance",
            "Sliding Window Counter":
              "Tight quotas where a smooth count matters",
          },
        ],
      },
      {
        type: "code",
        heading: "Atomic Token Bucket in Redis",
        language: "typescript",
        label: "token-bucket.lua",
        code: `// Token bucket evaluated atomically in Redis via a Lua script.
// The entire read-modify-write runs server-side, so concurrent requests
// from different app servers cannot interleave and overspend the bucket.

// The Lua script is stored once and loaded into Redis at startup.
const TOKEN_BUCKET_LUA = [
  "local key = KEYS[1]",
  "local capacity = tonumber(ARGV[1])",
  "local refillPerSec = tonumber(ARGV[2])",
  "local now = tonumber(ARGV[3])",
  "local cost = tonumber(ARGV[4])",
  "",
  "local state = redis.call('HMGET', key, 'tokens', 'ts')",
  "local tokens = tonumber(state[1])",
  "local ts = tonumber(state[2])",
  "if tokens == nil then tokens = capacity end",
  "if ts == nil then ts = now end",
  "",
  "local delta = now - ts",
  "if delta < 0 then delta = 0 end",
  "tokens = tokens + delta * refillPerSec",
  "if tokens > capacity then tokens = capacity end",
  "",
  "local allowed = 0",
  "if tokens >= cost then allowed = 1; tokens = tokens - cost end",
  "",
  "redis.call('HMSET', key, 'tokens', tokens, 'ts', now)",
  "redis.call('PEXPIRE', key, math.floor((capacity / refillPerSec) * 1000))",
  "return { allowed, math.floor(tokens) }",
].join("\\n");

async function check(key: string, capacity: number, refillPerSec: number, cost = 1) {
  const now = Date.now() / 1000;
  const [allowed, remaining] = (await redis.eval(
    TOKEN_BUCKET_LUA, 1, key, capacity, refillPerSec, now, cost,
  )) as [number, number];
  return { allowed: allowed === 1, remaining };
}`,
      },
      {
        type: "code",
        heading: "Rejecting with 429",
        language: "http",
        label: "too-many-requests.http",
        code: `POST /v1/payments HTTP/1.1
Host: api.example.com
Authorization: Bearer <token>

HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 2
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1731680000

{ "error": "rate_limit_exceeded", "retryAfterSeconds": 2 }`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "The Read-Modify-Write Race",
        content:
          "A naive limiter does GET, decides in application code, then SET. Two app servers handling two concurrent requests can both read the same token count, both conclude they are allowed, and both write back — letting a burst of N in-flight requests all spend the same last token.\n\nThe fix is to make the decision and the mutation a single atomic unit. Running the token-bucket logic as a **Redis Lua script** (or the equivalent transaction) guarantees the read, compute, and write happen without interleaving. Any limiter that keeps its counter in application memory across multiple servers is approximate at best; the shared store must own the atomic step.",
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Edge vs Application",
        content:
          "Run a coarse limit at the **edge** (CDN or API gateway) to shed floods before they consume application resources, and a fine-grained, business-aware limit in the **application** where you know the tenant, tier, and endpoint cost. Edge limiting keys on IP and is cheap and fast; it also protects the limiter store from being hammered by junk traffic. Application limiting keys on user or API key and can weight requests by cost — a bulk export may count as 100 units while a single read counts as 1. Most production systems do both.",
      },
      {
        type: "steps",
        heading: "A Request Through the Limiter",
        steps: [
          {
            title: "Identify the key",
            detail:
              "Derive the limit key from the API key or user ID, falling back to IP for unauthenticated traffic.",
          },
          {
            title: "Resolve the rules",
            detail:
              "Look up the tier's limits (per-minute and per-day) from config or a cached policy store.",
          },
          {
            title: "Check and spend atomically",
            detail:
              "Run the token-bucket Lua script against the shard that owns the key, decrementing tokens on allow.",
          },
          {
            title: "Decorate the response",
            detail:
              "Attach X-RateLimit headers with the remaining count and reset time to every response.",
          },
          {
            title: "Reject or pass",
            detail:
              "On rejection return 429 with Retry-After; on allow forward to the handler.",
          },
          {
            title: "Fail open on store outage",
            detail:
              "If the limiter store is unreachable, allow the request (subject to a global safety valve) rather than blocking all traffic.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Token bucket is the default: a steady refill rate plus a burst ceiling equal to the bucket capacity",
          "Make the check-and-spend a single atomic operation — a Redis Lua script — to survive concurrent requests",
          "Shard counters by key so one key's traffic is always evaluated on the same node",
          "Return 429 with Retry-After and X-RateLimit headers so well-behaved clients can back off",
          "Limit coarsely at the edge and finely in the application where tenant and cost are known",
          "Fail open on limiter-store outages: over-admitting is safer than a total outage",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why is a naive GET-then-SET rate limiter incorrect under concurrency?",
        options: [
          "It uses too much memory",
          "Two concurrent requests can read the same token count and both be allowed, overspending the last token",
          "It cannot return a 429 status code",
          "Redis does not support GET or SET",
        ],
        correctIndex: 1,
        explanation:
          "Without atomicity, the read, decision, and write can interleave across app servers. Both requests observe enough tokens, both proceed, and the bucket is overspent. Running the logic as a single Redis Lua script makes the read-modify-write indivisible.",
      },
      {
        question:
          "What is the key advantage of a token bucket over a fixed window counter?",
        options: [
          "It stores less state",
          "It allows controlled bursts and has no boundary doubling artifact",
          "It never rejects requests",
          "It requires no shared store",
        ],
        correctIndex: 1,
        explanation:
          "A fixed window can admit up to twice the limit around a window boundary. A token bucket refills continuously and permits bursts only up to its capacity, giving an exact sustained rate without the boundary spike.",
      },
      {
        question:
          "Why must all requests for one API key route to the same limiter shard?",
        options: [
          "To reduce network bandwidth",
          "So the counter mutation for that key is serialized on a single node and stays consistent",
          "Because Redis cannot store multiple keys",
          "To improve compression",
        ],
        correctIndex: 1,
        explanation:
          "If a key's counter were split across shards, each shard would see only part of the traffic and the limit would be enforced per shard, effectively multiplying the allowance. Key-based sharding keeps one authoritative counter per key.",
      },
      {
        question:
          "What is the safest behavior when the limiter's backing store is unavailable?",
        options: [
          "Reject every request with 429",
          "Fail open and allow requests, ideally under a global safety limit",
          "Crash the service",
          "Silently drop requests",
        ],
        correctIndex: 1,
        explanation:
          "A limiter that blocks all traffic when its store is down turns a partial failure into a total outage. Failing open preserves availability; a coarse global safety valve bounds the risk of overload.",
      },
    ],
  },

  "design-kv-store": {
    slug: "design-kv-store",
    title: "Design a Key-Value Store",
    tagline: "Consistent hashing, quorums, and Dynamo-style convergence",
    sections: [
      {
        type: "text",
        heading: "Defining the Problem",
        content:
          "Design a distributed key-value store like Amazon Dynamo or Cassandra: a `get(key)` and `put(key, value)` interface that stays available and scales horizontally across thousands of commodity nodes, with no single point of failure. The API is trivial; the guarantees behind it are not.\n\nThe real question is how you keep data alive and reachable when nodes fail, disks die, and networks partition — without a master that becomes the thing you cannot lose.",
      },
      {
        type: "text",
        heading: "Functional and Non-Functional Requirements",
        content:
          "**Functional:** put and get by key; support values from bytes to megabytes; automatic partitioning and rebalancing as nodes join and leave; tunable replication; conflict detection and resolution for concurrent writes.\n\n**Non-functional:** high availability and partition tolerance (AP under CAP); horizontal scalability to petabytes; low single-digit-millisecond latency for hot keys; durability so an acknowledged write is not lost even if a replica dies right after; and eventual consistency with a knob (quorum) to dial it toward stronger reads. There is no join, no range scan across keys required at minimum, and no cross-key transactions.",
      },
      {
        type: "analogy",
        heading: "The Data Center as a Ring of Warehouses",
        content:
          "Imagine assigning every item to a numbered warehouse on a ring, where the number comes from hashing the item's name. To find an item you hash its name and walk clockwise to the first warehouse. Adding a warehouse inserts it into one spot on the ring and takes over only the sliver of items between it and its neighbour — everyone else's items stay put. Removing a warehouse pushes its sliver onto the next one.\n\nThat is **consistent hashing**. Without it, plain `hash(key) % N` remaps nearly every key whenever N changes, forcing you to move almost the entire dataset to add one machine. The ring moves only the keys that must move.",
      },
      {
        type: "text",
        heading: "Back-of-the-Envelope Estimation",
        content:
          "Assume 1,000 nodes, 100 million keys per node, and an average value of 5 KB. That is 100 billion keys and roughly 500 TB of logical data.\n\nWith a replication factor of three, physical storage triples to about 1.5 PB. The quorum math is what matters operationally: with N=3, choosing R=2 and W=2 means read and write sets always overlap by at least one replica (R + W > N), so a read sees the latest acknowledged write. Choosing W=1 maximizes write availability at the cost of read consistency.",
      },
      {
        type: "code",
        heading: "Sizing the Store",
        language: "typescript",
        label: "kv-sizing.ts",
        code: `// Back-of-the-envelope sizing for a Dynamo-style key-value store
const nodes = 1_000;
const keysPerNode = 100_000_000;
const avgValueBytes = 5 * 1024;    // 5 KB average value
const replicationFactor = 3;       // N = 3

const logicalKeys = nodes * keysPerNode;                       // 100B keys
const logicalBytes = logicalKeys * avgValueBytes;              // ~500 TB logical
const physicalBytes = logicalBytes * replicationFactor;        // ~1.5 PB on disk

// Quorum: with N=3, R=2, W=2 gives R + W > N -> strong read-your-write
const n = 3, r = 2, w = 2;
const strongReads = r + w > n;
// With W=1 the write survives one node failure but reads may miss the newest value
console.log({ logicalKeys, physicalTb: physicalBytes / 1e12, strongReads });`,
      },
      {
        type: "text",
        heading: "Partitioning, Replication, and Quorum",
        content:
          "Keys are hashed onto a ring, and each key is stored on the first N distinct physical nodes clockwise from its position — the **preference list**, walking past already-visited nodes to spread replicas across racks and availability zones. Partitions are assigned with virtual nodes (vnodes): each physical node owns many small ring tokens, which smooths load and speeds rebalancing when membership changes.\n\nA write is acknowledged once W replicas confirm it; a read queries R replicas and returns the freshest version it sees. With R + W > N the read and write sets intersect, giving read-your-writes consistency. A **sloppy quorum** relaxes this under failure: if a target replica is down, the write goes to any healthy node (a hinted handoff), to be delivered later — trading strict consistency for availability.",
      },
      {
        type: "comparison",
        heading: "Quorum Reads vs Sloppy Quorum",
        headers: ["Strict Quorum", "Sloppy Quorum"],
        rows: [
          {
            aspect: "Write target",
            "Strict Quorum": "The N replicas in the preference list",
            "Sloppy Quorum": "The first N healthy nodes, even outside the list",
          },
          {
            aspect: "Availability during failure",
            "Strict Quorum": "Writes fail if fewer than W replicas are up",
            "Sloppy Quorum": "Writes succeed on any healthy nodes",
          },
          {
            aspect: "Consistency",
            "Strict Quorum": "R + W > N means reads see the latest write",
            "Sloppy Quorum": "Weaker — hinted replicas lag until handoff",
          },
          {
            aspect: "Recovery",
            "Strict Quorum": "Anti-entropy plus read repair",
            "Sloppy Quorum": "Hinted handoff replays to the true owner",
          },
          {
            aspect: "When to use",
            "Strict Quorum": "Correctness-critical metadata",
            "Sloppy Quorum": "Shopping carts and always-writable data",
          },
        ],
      },
      {
        type: "code",
        heading: "The LSM-Tree Write Path",
        language: "typescript",
        label: "lsm.ts",
        code: `// LSM-tree write path: append-only and sequential, never in-place.
// Writes land in the memtable (in memory) plus a write-ahead log for durability.
// When the memtable fills it flushes to an immutable, sorted SSTable on disk.
// Reads check memtable -> newest SSTables -> older ones; Bloom filters skip misses.
// Background compaction merges SSTables to bound read amplification and drop tombstones.

class LsmEngine {
  private memtable = new Map<string, string | null>(); // null is a tombstone
  private wal: string[] = [];

  put(key: string, value: string): void {
    this.wal.push(key + "=" + value);   // durability first, sequential append
    this.memtable.set(key, value);
    if (this.memtable.size >= 10_000) this.flush();
  }

  delete(key: string): void {
    this.memtable.set(key, null);       // tombstone hides older values on read
  }

  private flush(): void {
    // Sort and write an immutable SSTable, then clear memtable and WAL
    const sorted = [...this.memtable.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    this.writeSstable(sorted);
    this.memtable.clear();
    this.wal = [];
  }

  private writeSstable(_entries: [string, string | null][]): void { /* fsync to disk */ }
}`,
      },
      {
        type: "text",
        heading: "Conflict Resolution: Vector Clocks",
        content:
          "Because any replica can accept a write, two clients can update the same key concurrently on different replicas. You need to detect that these are **concurrent**, not just ordered by wall-clock time — clocks across machines cannot be trusted to agree. A **vector clock** is a list of (node, counter) pairs attached to each value. If one clock dominates another element-wise, that version is newer. If neither dominates, the versions are concurrent siblings and must be reconciled.\n\nUnlike Dynamo, which hands sibling versions back to the application, Cassandra uses a simpler last-write-wins rule based on timestamps — easy to implement but it can silently discard a concurrent write. The choice is between application burden and data loss.",
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Vector Clock Growth",
        content:
          "A vector clock carries one counter per node that has ever written the key. On a constantly changing 1,000-node cluster these clocks grow unbounded, bloating every stored value and slowing comparison.\n\nThe standard mitigation is to cap clock size and truncate the oldest entries, accepting a small window of ambiguous ordering. In practice most systems bound clock length (say 10 entries) and rely on an anti-entropy process like **Merkle-tree repair** to reconcile replicas periodically, rather than trusting per-key clocks to stay complete forever.",
      },
      {
        type: "steps",
        heading: "A Write End to End",
        steps: [
          {
            title: "Hash the key",
            detail:
              "Hash the key onto the ring to find its coordinator and preference list.",
          },
          {
            title: "Replicate to N nodes",
            detail:
              "The coordinator forwards the write to the N replicas, each storing value plus vector clock.",
          },
          {
            title: "Wait for W acks",
            detail:
              "Once W replicas confirm the write (or a hinted handoff accepts it), the coordinator acknowledges the client.",
          },
          {
            title: "Read from R replicas",
            detail:
              "On read the coordinator queries R replicas and compares vector clocks to pick the freshest value.",
          },
          {
            title: "Read repair",
            detail:
              "If replicas disagree, the coordinator returns the newest version and pushes it back to stale replicas.",
          },
          {
            title: "Anti-entropy",
            detail:
              "A background Merkle-tree comparison reconciles replicas that missed writes without a read.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Consistent hashing moves only the keys between neighbours when nodes join or leave",
          "Virtual nodes spread a physical node's load and speed rebalancing",
          "Quorum R + W > N guarantees a read sees the latest acknowledged write",
          "Sloppy quorums with hinted handoff trade consistency for availability during failures",
          "An LSM tree turns random writes into sequential appends: memtable, WAL, SSTables, compaction",
          "Detect concurrent writes with vector clocks; either surface siblings or accept last-write-wins data loss",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What problem does consistent hashing solve compared to hash(key) modulo N?",
        options: [
          "It makes hashing faster",
          "It avoids remapping nearly all keys when the number of nodes changes",
          "It removes the need for replication",
          "It guarantees strong consistency",
        ],
        correctIndex: 1,
        explanation:
          "Modulo hashing remaps almost every key when N changes, forcing a full reshuffle. Consistent hashing places nodes and keys on a ring so adding or removing a node only moves the keys owned by the affected arc.",
      },
      {
        question:
          "With N=3, R=2, W=2, why do reads see the latest acknowledged write?",
        options: [
          "Because R + W > N guarantees the read and write sets overlap",
          "Because Redis is single-threaded",
          "Because replicas use wall-clock timestamps",
          "Because writes are broadcast to all nodes",
        ],
        correctIndex: 0,
        explanation:
          "A write confirmed by 2 of 3 replicas and a read sent to 2 of 3 replicas must intersect in at least one replica. That overlap is what lets the read observe the newest version.",
      },
      {
        question:
          "What does a vector clock detect that a wall-clock timestamp cannot?",
        options: [
          "The size of the value",
          "Whether two updates are genuinely concurrent rather than causally ordered",
          "The physical location of a replica",
          "The read latency",
        ],
        correctIndex: 1,
        explanation:
          "Wall clocks across machines can disagree, so they cannot reliably order concurrent writes. Vector clocks reveal causality: if neither version dominates, the updates were concurrent and need reconciliation.",
      },
      {
        question:
          "Why do LSM stores use a write-ahead log alongside the in-memory memtable?",
        options: [
          "To compress data",
          "To guarantee durability of writes that have not yet been flushed to disk",
          "To enforce quorum consistency",
          "To route keys to partitions",
        ],
        correctIndex: 1,
        explanation:
          "The memtable is volatile. Appending each write to the WAL first means an acknowledged write survives a crash; on restart the WAL is replayed to rebuild the memtable before it is eventually flushed to SSTables.",
      },
    ],
  },

  "design-web-crawler": {
    slug: "design-web-crawler",
    title: "Design a Web Crawler",
    tagline: "Frontier scheduling, politeness, and dedup with Bloom filters",
    sections: [
      {
        type: "text",
        heading: "Defining the Problem",
        content:
          "Design a web crawler that starts from a set of seed URLs, fetches pages, extracts links, and repeats — building a corpus for a search index or an analytics pipeline. The interviewer is not asking for a for-loop that follows links. They are asking how you crawl billions of pages without hammering any single site, without downloading the same page twice, without falling into infinite traps, and while staying fast enough to keep the corpus fresh.\n\nThe policy layer — politeness, robots rules, canonicalization — is where the interesting engineering lives.",
      },
      {
        type: "text",
        heading: "Functional and Non-Functional Requirements",
        content:
          "**Functional:** crawl from seeds and follow links; extract and normalize links; respect robots.txt and crawl-delay; deduplicate both URLs and page content; store raw pages and metadata; prioritize fresh or important pages; support recrawl of pages that change.\n\n**Non-functional:** scale to billions of pages; be polite — limit request rate per host; be robust to malformed HTML, redirect loops, and spider traps; be distributed across many machines with no duplicate work; refresh content on a schedule proportional to how often it changes; and be resumable after a crash without losing the frontier.",
      },
      {
        type: "analogy",
        heading: "The Librarian with a Reading List",
        content:
          "A librarian wants to catalog every book in a network of libraries. She keeps a to-do list of shelves to visit, but never rushes a single library — she respects its opening hours and visits at a pace the librarian there can handle. Before shelving a book she checks whether it is already cataloged, and she ignores notices and duplicates that just point back to shelves she has seen.\n\nThe **frontier** is that to-do list. **Politeness** is respecting each library's pace. **Deduplication** is checking the catalog before shelving. **robots.txt** is the house rules posted at the door.",
      },
      {
        type: "text",
        heading: "Back-of-the-Envelope Estimation",
        content:
          "Target one billion pages per month. At roughly 100 KB per page of HTML that is about 100 TB of raw storage per month before compression, and servers a little under 400 pages per second on average — comfortably parallelizable across hundreds of fetchers when each is polite to its own set of hosts.\n\nDeduplication is the memory-relevant number. With 50 links per page, one billion pages yield 50 billion discovered URLs. A Bloom filter sized for a 1% false-positive rate costs about 9.6 bits per URL — on the order of 60 GB — far cheaper than storing every seen URL as a full string in a hash set.",
      },
      {
        type: "code",
        heading: "Sizing the Crawler",
        language: "typescript",
        label: "crawler-sizing.ts",
        code: `// Back-of-the-envelope sizing for a web crawler
const pagesPerMonth = 1_000_000_000;             // 1B pages/month
const avgPageBytes = 100 * 1024;                 // 100 KB HTML
const avgLinksPerPage = 50;
const secondsPerMonth = 30 * 86_400;

const pagesPerSec = pagesPerMonth / secondsPerMonth;             // ~386 pages/sec
const storagePerMonthTb = (pagesPerMonth * avgPageBytes) / 1e12; // ~100 TB/month
const discoveredUrls = pagesPerMonth * avgLinksPerPage;          // 50B URLs

// Dedup 50B seen URLs with a Bloom filter at ~1% false positive rate:
// bits per element ~= -ln(p) / (ln 2)^2 ~= 9.6 bits
const bitsPerUrl = 9.6;
const bloomGb = (discoveredUrls * bitsPerUrl) / 8 / 1e9;         // ~60 GB
console.log({ pagesPerSec, storagePerMonthTb, bloomGb });`,
      },
      {
        type: "text",
        heading: "Frontier, Politeness, and robots.txt",
        content:
          "The **frontier** is a priority queue of URLs yet to fetch. Priority balances recency (a news site's homepage changes hourly) and importance (PageRank or link popularity). A common design keeps several queues — a high-priority queue for important and fresh pages, and per-host queues so the scheduler can pick work without waiting on a slow site.\n\n**Politeness** means never hitting one host faster than it allows: a minimum delay between requests to the same host, honoring `Crawl-delay` in robots.txt, and backing off on 429 or 5xx responses. A per-host token bucket plus a host-to-worker affinity keeps a single host served by one polite worker instead of a thundering herd. **robots.txt** is fetched once per host, cached with its TTL, and parsed into allow/disallow rules matched against the URL path before any fetch happens.",
      },
      {
        type: "comparison",
        heading: "Bloom Filter vs Hash Set for Dedup",
        headers: ["Bloom Filter", "Hash Set"],
        rows: [
          {
            aspect: "Memory",
            "Bloom Filter": "~9.6 bits per URL regardless of the URL length",
            "Hash Set": "Full URL or a long digest stored per entry",
          },
          {
            aspect: "False negatives",
            "Bloom Filter": "Never",
            "Hash Set": "Never",
          },
          {
            aspect: "False positives",
            "Bloom Filter": "Possible, tunable at ~1%",
            "Hash Set": "None",
          },
          {
            aspect: "Deletes",
            "Bloom Filter": "Not supported (needs counting variant)",
            "Hash Set": "Supported",
          },
          {
            aspect: "Failure mode",
            "Bloom Filter": "Might skip a first-time URL (false positive)",
            "Hash Set": "None",
          },
          {
            aspect: "Best for",
            "Bloom Filter": "Billions of seen URLs in limited RAM",
            "Hash Set": "Exact membership over a smaller keyspace",
          },
        ],
      },
      {
        type: "code",
        heading: "URL Normalization and a Bloom Filter",
        language: "typescript",
        label: "dedup.ts",
        code: `// Normalize a URL to a canonical form before deduplication, so
// "HTTP://Example.com/a?b=2&a=1#top" and "http://example.com/a?a=1&b=2"
// collapse to the same key and are not crawled twice.
function normalizeUrl(raw: string, base: string): string {
  const url = new URL(raw, base);
  url.hash = "";                                          // drop the fragment
  url.hostname = url.hostname.toLowerCase();
  url.protocol = url.protocol.toLowerCase();
  if ((url.protocol === "https:" && url.port === "443") ||
      (url.protocol === "http:" && url.port === "80")) url.port = "";
  url.searchParams.sort();                                // canonical query order
  for (const p of ["utm_source", "utm_medium", "ref", "fbclid"]) url.searchParams.delete(p);
  let path = url.pathname.replace(/\\/+$/, "");           // strip trailing slashes
  if (path === "") path = "/";
  url.pathname = path;
  return url.toString();
}

// Bloom filter: O(k) membership test, tiny memory, tunable false-positive rate.
class BloomFilter {
  private bits: Uint8Array;
  constructor(private mBits: number, private k: number) {
    this.bits = new Uint8Array(Math.ceil(mBits / 8));
  }
  add(item: string): void {
    for (const h of this.hashes(item)) this.bits[h >> 3] |= 1 << (h & 7);
  }
  mightContain(item: string): boolean {
    for (const h of this.hashes(item)) {
      if ((this.bits[h >> 3] & (1 << (h & 7))) === 0) return false;
    }
    return true; // "probably seen"; false positives waste a fetch, never a miss
  }
  private hashes(_item: string): number[] { /* k independent modulo-mBits hashes */ return []; }
}`,
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Spider Traps and Infinite Loops",
        content:
          'A calendar that links "next month" forever, or an infinite pagination of session IDs, will keep a naive crawler busy forever on one host. The defenses are threefold: normalize and dedup so trivial variants collapse; cap crawl **depth** and **pages per host**; and track per-host URL counts so a suspicious explosion pauses that host for review.\n\nAlso guard against redirect loops (cap redirect chains) and against content that is byte-identical under different URLs (a `robots` meta tag or a canonical link element should mark the preferred URL). Left unchecked, one trap can consume a disproportionate share of the entire crawl budget.',
      },
      {
        type: "steps",
        heading: "The Crawl Pipeline",
        steps: [
          {
            title: "Seed the frontier",
            detail:
              "Load seed URLs into the priority frontier, grouped into per-host queues.",
          },
          {
            title: "Schedule politely",
            detail:
              "The scheduler picks a host that is due under its rate limit and dispatches its next URL.",
          },
          {
            title: "Check rules and dedup",
            detail:
              "Fetch and evaluate cached robots.txt; test the normalized URL against the Bloom filter before fetching.",
          },
          {
            title: "Fetch and store",
            detail:
              "Download the page with timeouts and redirect caps; store the raw bytes and metadata.",
          },
          {
            title: "Parse and extract",
            detail:
              "Parse HTML, extract and normalize links, and discard URLs already seen.",
          },
          {
            title: "Enqueue new links",
            detail:
              "Score new URLs by priority and host, apply per-host caps, and push them into the frontier.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "A priority frontier plus per-host queues lets the scheduler stay busy without violating politeness",
          "Respect robots.txt and a per-host rate limit; back off on 429s and 5xxs",
          "Normalize URLs to a canonical form before deduplicating so trivial variants collapse",
          "Use a Bloom filter for cheap, memory-efficient seen-URL dedup with a tunable false-positive rate",
          "Defend against spider traps with depth caps, per-host page limits, and redirect-chain limits",
          "Make the frontier durable so a crashed crawler resumes without re-crawling or losing work",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why is a Bloom filter preferable to a hash set for tracking seen URLs at billions of pages?",
        options: [
          "It never has false positives",
          "It uses a small, fixed number of bits per URL regardless of URL length",
          "It supports deletions",
          "It returns exact counts",
        ],
        correctIndex: 1,
        explanation:
          "Storing billions of full URLs (or long digests) needs enormous memory. A Bloom filter costs roughly 9.6 bits per URL at a 1% false-positive rate, so the whole seen-set fits in tens of gigabytes. Its trade-offs are possible false positives and no deletions.",
      },
      {
        question:
          "What is the purpose of URL normalization before deduplication?",
        options: [
          "To compress the URL",
          "To turn syntactic variants of the same page into one canonical key",
          "To rank pages by importance",
          "To fetch robots.txt",
        ],
        correctIndex: 1,
        explanation:
          "Fragments, parameter order, tracking parameters, and trailing slashes create many strings for one page. Normalizing collapses them so the crawler does not fetch and index duplicates.",
      },
      {
        question: "How should a crawler stay polite to a single host?",
        options: [
          "Fetch all of its pages as fast as possible",
          "Limit request rate per host, honor Crawl-delay, and back off on 429/5xx",
          "Ignore robots.txt for speed",
          "Distribute its pages across many workers simultaneously",
        ],
        correctIndex: 1,
        explanation:
          "Politeness means one host is never overwhelmed: enforce a minimum delay between requests to it, respect robots.txt and Crawl-delay, and back off when it signals overload. Per-host rates also protect the crawler from being blocked.",
      },
      {
        question: "Why does a crawler need protection against spider traps?",
        options: [
          "They consume bandwidth on the crawler's own network",
          "An infinitely linkable site can consume the entire crawl budget on one host",
          "They violate robots.txt",
          "They break the Bloom filter",
        ],
        correctIndex: 1,
        explanation:
          "Traps like endless calendars generate unbounded URLs that a naive crawler keeps following, starving the rest of the crawl. Depth caps, per-host page limits, and normalization bound the damage.",
      },
    ],
  },

  "design-message-queue": {
    slug: "design-message-queue",
    title: "Design a Message Queue",
    tagline: "Partitioned logs, delivery guarantees, and dead-letter queues",
    sections: [
      {
        type: "text",
        heading: "Defining the Problem",
        content:
          "Design a distributed message queue that decouples producers from consumers: producers publish messages, consumers process them asynchronously, and the system buffers the difference in rate. It is the backbone of event-driven architecture and of streaming pipes like Kafka and RabbitMQ.\n\nThe interviewer is not asking for a FIFO in memory. They are asking how you partition for throughput, what delivery guarantee you promise, how consumers coordinate without processing the same message twice, and what happens to messages that can never be handled.",
      },
      {
        type: "text",
        heading: "Functional and Non-Functional Requirements",
        content:
          "**Functional:** publish messages to a topic; subscribe consumers to a topic; support multiple independent consumer groups; route messages by key to preserve per-key order; retain messages for a configurable window; acknowledge processed messages; route repeatedly failing messages to a dead-letter queue.\n\n**Non-functional:** high throughput (millions of messages per second); durability so an acknowledged message is not lost; at-least-once delivery by default (exactly-once is a per-partition optimization); horizontal scalability by adding partitions and brokers; ordered delivery within a partition; and lower latency than a batch job while still batching for efficiency.",
      },
      {
        type: "analogy",
        heading: "The Conveyor Belt with Tubs",
        content:
          "A factory line has a conveyor belt split into many parallel lanes. Each item carries a label and always rides the same lane, so items with the same label arrive in order. Workers stand at the end of a lane and pull items; when they finish one, they mark their place on the belt. Adding lanes multiplies throughput; adding workers on a lane lets them share the load of that lane.\n\nA **partition** is a lane. The **offset** is a worker's bookmark on the belt. A **consumer group** is a team of workers dividing the lanes among themselves without two workers taking the same item.",
      },
      {
        type: "text",
        heading: "Back-of-the-Envelope Estimation",
        content:
          "Assume 2 million events per second at peak, each averaging 1 KB. That is about 2 GB per second of raw throughput and roughly 170 TB written per day — before replication and retention multiply it further.\n\nRetention is what makes storage huge. Keeping seven days at a replication factor of three pushes toward the petabyte range. Partition count follows throughput: if one partition sustains about 10 MB per second on a broker, 2 GB per second needs on the order of 200 partitions across the cluster, sized so no single partition becomes a hot spot.",
      },
      {
        type: "code",
        heading: "Sizing the Queue",
        language: "typescript",
        label: "queue-sizing.ts",
        code: `// Back-of-the-envelope sizing for a log-based message queue
const eventsPerSec = 2_000_000;            // 2M events/sec at peak
const avgEventBytes = 1 * 1024;            // 1 KB per event
const replicationFactor = 3;
const retentionDays = 7;

const throughputMbPerSec = (eventsPerSec * avgEventBytes) / 1e6;        // ~2 GB/sec
const onDiskPerDayTb = (eventsPerSec * avgEventBytes * 86_400) / 1e12;  // ~170 TB/day
const retainedPb = (onDiskPerDayTb * retentionDays * replicationFactor) / 1000;

// Each partition sustains ~10 MB/sec on one broker; scale out by partitions
const partitions = Math.ceil(throughputMbPerSec / 10);                  // ~200 partitions
console.log({ throughputMbPerSec, onDiskPerDayTb, retainedPb, partitions });`,
      },
      {
        type: "text",
        heading: "Log vs Queue, Partitions, and Consumer Groups",
        content:
          "Two mental models compete. A classic **queue** (RabbitMQ) is a mailbox: a message is delivered to one consumer and then removed — the broker tracks per-message state, which is expensive at scale but gives fine-grained routing. A **log** (Kafka) is an append-only ledger: messages are never removed on read; a consumer merely advances its **offset**. Retention deletes whole segments by time or size, not individual messages. The log model scales because the broker does no per-consumer bookkeeping.\n\n**Partitions** are the unit of parallelism and ordering. A topic is split into partitions; each is an independent append-only log. A message's key determines its partition (hash of the key modulo partition count), so all events with the same key are ordered. A **consumer group** distributes partitions across its members — each partition is owned by exactly one consumer in the group — so adding consumers scales processing up to the partition count, and beyond that a consumer sits idle.",
      },
      {
        type: "comparison",
        heading: "Queue vs Log",
        headers: ["Queue (RabbitMQ-style)", "Log (Kafka-style)"],
        rows: [
          {
            aspect: "Message lifecycle",
            "Queue (RabbitMQ-style)": "Removed once acknowledged",
            "Log (Kafka-style)": "Retained; consumers advance an offset",
          },
          {
            aspect: "Broker state",
            "Queue (RabbitMQ-style)": "Per-message delivery state",
            "Log (Kafka-style)": "Just the append log and consumer offsets",
          },
          {
            aspect: "Replay",
            "Queue (RabbitMQ-style)": "Not possible once consumed",
            "Log (Kafka-style)": "Reset the offset and replay",
          },
          {
            aspect: "Ordering",
            "Queue (RabbitMQ-style)":
              "Per-queue, but multiple consumers break order",
            "Log (Kafka-style)": "Guaranteed within a partition",
          },
          {
            aspect: "Fan-out",
            "Queue (RabbitMQ-style)": "Exchanges route to many queues",
            "Log (Kafka-style)": "Every consumer group reads independently",
          },
          {
            aspect: "Best for",
            "Queue (RabbitMQ-style)": "Complex routing, task distribution",
            "Log (Kafka-style)": "High-throughput streams and event sourcing",
          },
        ],
      },
      {
        type: "code",
        heading: "A Partition Log and Consumer Offsets",
        language: "typescript",
        label: "partition.ts",
        code: `// A partition is an append-only log: each record gets a monotonically
// increasing offset. Consumers never remove records; they advance a committed
// offset. Retention deletes whole segments by time or size, not by count.

interface Record { offset: number; key: string | null; value: string; ts: number; }

class Partition {
  private log: Record[] = [];
  private nextOffset = 0;

  append(key: string | null, value: string, ts: number): number {
    const offset = this.nextOffset++;
    this.log.push({ offset, key, value, ts });
    return offset;                        // the producer ack returns this offset
  }

  read(from: number, max: number): Record[] {
    return this.log.slice(from, from + max);
  }

  // Same key must always route to the same partition to preserve key ordering
  static partitionFor(key: string, partitionCount: number): number {
    return hash32(key) % partitionCount;
  }
}

// A consumer group assigns each partition to exactly one consumer.
class ConsumerGroup {
  private committed = new Map<string, number>(); // "topic:partition" -> next offset

  poll(partition: Partition, id: string, max: number): Record[] {
    const from = this.committed.get(id) ?? 0;
    this.committed.set(id, from + max);
    return partition.read(from, max);
  }
}

declare function hash32(key: string): number;`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Delivery Guarantees and Duplicates",
        content:
          "**At-most-once** sends and forgets — fast, but a crash loses the message. **At-least-once** acknowledges only after processing succeeds, so a consumer that crashes after processing but before committing its offset reprocesses the message: duplicates are possible, and consumers must be **idempotent**. **Exactly-once** eliminates duplicates only within a partition boundary, using idempotent producers and transactional offset commits, and it does not extend across partitions or external systems.\n\nThe practical rule: design consumers to be idempotent (dedupe on a message key or an idempotency token), accept at-least-once on the hot path, and reserve exactly-once for cases where a duplicate would corrupt state. Messages that exhaust their retry budget go to a **dead-letter queue** with the failure reason so a human can inspect and replay them.",
      },
      {
        type: "steps",
        heading: "Produce to Consume End to End",
        steps: [
          {
            title: "Key the message",
            detail:
              "The producer hashes the message key to pick a partition, preserving per-key order.",
          },
          {
            title: "Append to the log",
            detail:
              "The broker appends the record to the partition, returns its offset, and replicates it to followers.",
          },
          {
            title: "Assign partitions",
            detail:
              "A consumer group's coordinator assigns each partition to exactly one consumer in the group.",
          },
          {
            title: "Fetch a batch",
            detail:
              "A consumer polls its partitions starting from its committed offset and processes the batch.",
          },
          {
            title: "Commit the offset",
            detail:
              "After successful processing the consumer commits the offset; on failure it retries or dead-letters.",
          },
          {
            title: "Expire by retention",
            detail:
              "Old segments are deleted by time or size regardless of whether every group has read them.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "A log retains messages and consumers advance offsets; a queue removes messages on ack",
          "Partitions are the unit of parallelism and ordering — same key always maps to the same partition",
          "A consumer group owns each partition exactly once, scaling up to the partition count",
          "At-least-once plus idempotent consumers is the pragmatic default; exactly-once is per-partition only",
          "Retention by time or size, not per-message deletion, is what makes the log scalable",
          "Route messages that exhaust retries to a dead-letter queue with the failure reason",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What is the fundamental difference between a log-based and a queue-based broker?",
        options: [
          "Logs are faster to write",
          "A log retains messages and consumers advance offsets; a queue removes each message on acknowledgement",
          "Queues cannot be distributed",
          "Logs do not support ordering",
        ],
        correctIndex: 1,
        explanation:
          "In a log, records stay until retention deletes a segment and consumers track their own read position, which enables replay and cheap fan-out. In a queue, the broker removes a message once it is acked and tracks delivery state per message.",
      },
      {
        question:
          "Why must messages with the same key go to the same partition?",
        options: [
          "To reduce storage",
          "Because ordering is only guaranteed within a partition, so key affinity preserves per-key order",
          "Because hashing is required by the protocol",
          "To enable compression",
        ],
        correctIndex: 1,
        explanation:
          "Partitions are ordered independently. If two events for the same key landed on different partitions they could be processed out of order, so the producer hashes the key to pin the key's events to one partition.",
      },
      {
        question:
          "What does exactly-once delivery actually guarantee in a partitioned log?",
        options: [
          "Exactly-once across all partitions and external systems",
          "Exactly-once only within a partition, using idempotent producers and transactional commits",
          "Exactly-once only if there is one consumer group",
          "That no duplicates ever occur anywhere",
        ],
        correctIndex: 1,
        explanation:
          "Exactly-once in systems like Kafka is scoped to a partition boundary via idempotent producers and transactions. It does not extend across partitions or into external systems, where idempotent consumer logic is still required.",
      },
      {
        question:
          "Why should consumers generally be idempotent under at-least-once delivery?",
        options: [
          "To reduce latency",
          "Because a crash between processing and committing the offset causes redelivery and possible duplicates",
          "Because brokers enforce it",
          "Because it enables compression",
        ],
        correctIndex: 1,
        explanation:
          "At-least-once guarantees delivery, not single delivery. If a consumer processes a message but fails before committing its offset, the message is delivered again, so the consumer must handle duplicates without corrupting state.",
      },
    ],
  },

  "design-proximity-service": {
    slug: "design-proximity-service",
    title: "Design a Proximity Service",
    tagline: "Geohash, quadtree, and H3 indexes for Yelp-style search",
    sections: [
      {
        type: "text",
        heading: "Defining the Problem",
        content:
          'Design a proximity service like Yelp or Google Maps: given a location and a radius, return nearby businesses ranked by distance and relevance. It is a read-heavy, geo-indexed search problem where the queries are the easy part and the index is the hard part.\n\nThe interviewer wants to see how you index two-dimensional spatial data so that "find everything within 2 km" does not scan the entire planet, and how you keep that index fast for hundreds of millions of places.',
      },
      {
        type: "text",
        heading: "Functional and Non-Functional Requirements",
        content:
          "**Functional:** search for businesses near a location within a radius; filter by category, rating, and open hours; rank by a blend of distance and quality; support pagination; let owners add or update a business; return results fast on both map pans and explicit searches.\n\n**Non-functional:** extremely read-heavy (orders of magnitude more searches than updates); sub-100ms p99 latency; availability over strict consistency (a slightly stale business list is fine); scalability to hundreds of millions of places worldwide; and correctness at cell boundaries, where a naive grid index drops neighbours that straddle two cells.",
      },
      {
        type: "analogy",
        heading: "The Subdivided City Map",
        content:
          'Imagine a paper map you keep folding into smaller tiles. Zoom out and one tile covers a whole city; zoom in and the same area splits into many neighbourhood tiles. To find bakeries near you, you look only at your tile and the tiles touching it — never the whole map.\n\nA spatial index is that folding. **Geohash, quadtree, and H3** are different ways to fold the globe into cells, each with its own trade-off between uniform cell size and simplicity. The search always reduces to "my cell plus its neighbours."',
      },
      {
        type: "text",
        heading: "Back-of-the-Envelope Estimation",
        content:
          "Assume 200 million businesses worldwide and 50 million daily users doing 10 searches a day — 500 million searches per day, peaking around 17,000 requests per second. At roughly 20 KB of results per search, that is about 10 TB per day of egress, which caching and CDNs must absorb.\n\nIndex size drives memory. A grid at half-degree resolution is only about 260,000 cells, each caching a small list of businesses; that comfortably fits in memory. The read path is what dominates, so the whole design leans on precomputed per-cell caches and read replicas.",
      },
      {
        type: "code",
        heading: "Sizing the Service",
        language: "typescript",
        label: "proximity-sizing.ts",
        code: `// Back-of-the-envelope sizing for a Yelp-style proximity service
const businesses = 200_000_000;              // 200M places worldwide
const dau = 50_000_000;
const readsPerUserPerDay = 10;
const avgResultBytes = 20 * 1024;            // 20 KB of results per search

const searchesPerDay = dau * readsPerUserPerDay;                 // 500M searches/day
const peakRps = Math.ceil((searchesPerDay / 86_400) * 3);        // ~17k rps peak
const egressTbPerDay = (searchesPerDay * avgResultBytes) / 1e12; // ~10 TB/day

// Precompute a grid; each cell caches its places plus those of its neighbours
const cellDegrees = 0.5;                                         // ~55 km at the equator
const cells = (360 / cellDegrees) * (180 / cellDegrees);         // ~259k cells
console.log({ searchesPerDay, peakRps, egressTbPerDay, cells });`,
      },
      {
        type: "text",
        heading: "Geospatial Indexing",
        content:
          "A **geohash** encodes a latitude and longitude into a short base-32 string by repeatedly bisecting the coordinate space. A shared prefix means spatial proximity, and the prefix length sets the cell size, so a geohash doubles as an index key and a zoom level. Its weakness is boundary effects: two points can be metres apart yet land in different cells, so you must always query the cell and its eight neighbours.\n\nA **quadtree** recursively subdivides space, splitting only cells that exceed a capacity, so dense cities get fine cells and oceans stay coarse. This adaptivity is its strength and its cost — the tree is harder to shard across machines because its shape depends on the data distribution. **Uber's H3** indexes the globe into a hierarchy of hexagonal cells; hexagons have uniform distance to all six neighbours, which removes the corner-neighbour ambiguity of square grids and makes ring queries cleaner.",
      },
      {
        type: "comparison",
        heading: "Geohash vs Quadtree vs H3",
        headers: ["Geohash", "Quadtree", "H3"],
        rows: [
          {
            aspect: "Cell shape",
            Geohash: "Rectangular grid cells",
            Quadtree: "Adaptive squares",
            H3: "Hexagons",
          },
          {
            aspect: "Uniformity",
            Geohash: "Different edge lengths per cell",
            Quadtree: "Varies with density",
            H3: "Near-uniform hexagonal cells",
          },
          {
            aspect: "Neighbour query",
            Geohash: "Cell plus 8 neighbours (boundary care)",
            Quadtree: "Walk the tree and its branches",
            H3: "Uniform ring of 6 neighbours",
          },
          {
            aspect: "Sharding",
            Geohash: "Easy — the prefix is the shard key",
            Quadtree: "Harder — tree shape depends on data",
            H3: "Easy — the cell ID is the shard key",
          },
          {
            aspect: "Implementation",
            Geohash: "Simplest, string prefix",
            Quadtree: "Recursive tree structure",
            H3: "Library-based integer cell IDs",
          },
          {
            aspect: "Best for",
            Geohash: "Simple grid closest-neighbour lookups",
            Quadtree: "Highly concentrated data with adaptive density",
            H3: "Uniform spatial analysis and ring queries",
          },
        ],
      },
      {
        type: "code",
        heading: "Geohash Encoding and Neighbour Search",
        language: "javascript",
        label: "geohash.js",
        code: `// A geohash encodes latitude and longitude into a base-32 string by
// repeatedly bisecting the space. Longer prefix = smaller cell.
// Neighbours can straddle a boundary, so always query the cell plus its 8 neighbours.

const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

function encodeGeohash(lat, lng, precision) {
  let isLng = true, bit = 0, ch = 0, out = "";
  let latMin = -90, latMax = 90, lngMin = -180, lngMax = 180;
  while (out.length < precision) {
    if (isLng) {
      const mid = (lngMin + lngMax) / 2;
      if (lng >= mid) { ch = (ch << 1) | 1; lngMin = mid; } else { ch <<= 1; lngMax = mid; }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) { ch = (ch << 1) | 1; latMin = mid; } else { ch <<= 1; latMax = mid; }
    }
    isLng = !isLng;
    if (++bit === 5) { out += BASE32[ch]; bit = 0; ch = 0; }
  }
  return out;
}

// Query the centre cell and its 8 neighbours, then filter precisely by distance.
function searchNearby(lat, lng, radiusMeters) {
  const precision = radiusMeters > 5000 ? 4 : radiusMeters > 1000 ? 5 : 6;
  const cells = [encodeGeohash(lat, lng, precision), ...neighbors(encodeGeohash(lat, lng, precision))];
  const candidates = cells.flatMap((c) => index.get(c) || []);
  return candidates
    .map((b) => ({ ...b, distance: haversine(lat, lng, b.lat, b.lng) }))
    .filter((b) => b.distance <= radiusMeters)
    .sort((a, b) => a.distance - b.distance);
}

function neighbors(_hash) { return []; }           // base-32 neighbour math
function haversine(_a, _b, _c, _d) { return 0; }   // great-circle distance`,
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Read-Heavy Optimization",
        content:
          "Search traffic dwarfs writes by orders of magnitude, so optimize the read path aggressively. Cache the ranked results for a popular cell plus radius in Redis, keyed by the geohash cell and query parameters, with a short TTL — most users searching downtown at lunch all want the same list. Serve map panning from a coarse grid cache so the common view is a single lookup.\n\nOnly the tail of unusual queries falls through to the live index. Precompute, for each cell, the businesses in that cell and its neighbours so a search is a merge of a handful of small lists rather than a scan. Read replicas scale the query volume, and a CDN absorbs repeated identical searches at the edge.",
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Boundary and Density Pitfalls",
        content:
          "Square grids drop neighbours that straddle a cell edge, so a business 10 metres across the line vanishes unless you query all eight neighbours — and even then a very small radius may need a finer cell. Near the poles, longitude lines converge and geohash cells distort badly, so distance filtering must always be done with true haversine distance, not cell membership alone.\n\nDense cities are the opposite failure: one cell may hold thousands of businesses, so a quadtree that keeps splitting is attractive, but the tree's shape is data-dependent and hard to shard. A practical hybrid is a uniform geohash for sharding plus per-cell precomputed lists, with the true distance filter applied last.",
      },
      {
        type: "steps",
        heading: "A Search Request End to End",
        steps: [
          {
            title: "Receive the query",
            detail:
              "Parse the location, radius, and filters such as category and rating.",
          },
          {
            title: "Pick a precision",
            detail:
              "Choose a geohash precision matched to the radius so the cell is a bit smaller than the search area.",
          },
          {
            title: "Collect candidate cells",
            detail:
              "Take the centre cell plus its eight neighbours to avoid dropping boundary matches.",
          },
          {
            title: "Fetch candidates",
            detail:
              "Read each cell's precomputed business list from cache, falling back to the index on a miss.",
          },
          {
            title: "Filter and rank",
            detail:
              "Compute true haversine distance, apply filters, and rank by distance blended with quality.",
          },
          {
            title: "Cache and return",
            detail:
              "Store the result for the cell and query, then return a paginated page to the client.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Spatial indexes reduce a global search to one cell plus its neighbours",
          "Geohash is simplest but has boundary effects, so always query all eight neighbours",
          "Quadtrees adapt to density but are harder to shard; H3's hexagons give uniform neighbours",
          "Filter by true great-circle distance, never by cell membership alone",
          "This workload is read-heavy, so cache per-cell results and serve pans from a coarse grid",
          "Watch density: a single city cell can hold thousands of places, requiring adaptive or finer indexing",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why must a geohash search query the cell AND its eight neighbours?",
        options: [
          "To improve accuracy of ratings",
          "Because two nearby points can fall in adjacent cells, so only querying neighbours avoids dropping them",
          "Because Redis requires it",
          "To reduce memory usage",
        ],
        correctIndex: 1,
        explanation:
          "Geohash cells are rectangular buckets. A point just across a cell boundary is spatially close but in a different cell, so a search that reads only the centre cell would miss it. The eight neighbours close that gap.",
      },
      {
        question:
          "What is a key advantage of hexagonal H3 cells over square grids?",
        options: [
          "They use less memory",
          "All six neighbours are equidistant, removing corner-neighbour ambiguity",
          "They support more zoom levels",
          "They do not need an index",
        ],
        correctIndex: 1,
        explanation:
          "On a square grid, edge-neighbours and corner-neighbours are at different distances, complicating ring queries. Hexagons have uniform adjacency in every direction, which makes neighbourhood and ring operations cleaner.",
      },
      {
        question:
          "Given a read-heavy proximity workload, where should optimization focus?",
        options: [
          "Faster writes for business updates",
          "Caching per-cell results and serving the read path from memory",
          "Storing more raw fields per business",
          "Reducing the number of index cells",
        ],
        correctIndex: 1,
        explanation:
          "Searches vastly outnumber updates. Precomputing per-cell candidate lists and caching ranked results per cell and query turns the common search into a few in-memory lookups, which is far more effective than optimizing rare writes.",
      },
      {
        question:
          "Why must distance be verified with haversine even after picking candidate cells?",
        options: [
          "Because geohashes are not deterministic",
          "Cell membership is a coarse filter; true great-circle distance is needed to respect the radius, especially near the poles",
          "Because it is faster to compute",
          "Because cells store ratings",
        ],
        correctIndex: 1,
        explanation:
          "Cell membership only says a point is broadly nearby and cells distort with latitude. Distance filtering with the haversine formula is what actually enforces the radius and yields correct nearest results.",
      },
    ],
  },

  "design-collaborative-editor": {
    slug: "design-collaborative-editor",
    title: "Design a Collaborative Editor",
    tagline: "OT vs CRDT, live presence, and offline reconciliation",
    sections: [
      {
        type: "text",
        heading: "Defining the Problem",
        content:
          "Design a collaborative rich-text editor like Google Docs: many people edit the same document at once, each sees the others' changes in near real time, cursors and selections are visible, and edits made offline merge cleanly when a client reconnects.\n\nThe interviewer is not asking for a textarea with WebSockets. They are asking how concurrent edits to the same position are reconciled so that every replica converges to the same document — the hardest part of live collaboration.",
      },
      {
        type: "text",
        heading: "Functional and Non-Functional Requirements",
        content:
          "**Functional:** multiple users edit the same document simultaneously; changes appear on all clients within a second; show each participant's cursor and selection; support rich formatting; persist history and support undo; allow editing while offline and merge on reconnect; restrict access by permission.\n\n**Non-functional:** converge to identical state on all replicas regardless of delivery order; low latency (edits feel instant, so optimistic local application is required); tolerate out-of-order and duplicated network delivery; scale to many documents with many concurrent editors each; and merge edits without a central lock, since locking a document destroys the collaborative experience.",
      },
      {
        type: "analogy",
        heading: "Two Editors, One Manuscript",
        content:
          "Two editors mark up the same manuscript. Editor A inserts a sentence at line 10; Editor B, unaware, deletes the paragraph at line 10. If you apply both operations by their original line numbers, the results disagree — one inserts before the deletion lands, the other after.\n\nThe reconciliation problem is deciding what each operation means once the other has already applied. **Operational Transformation** rewrites the second operation against the first. **CRDTs** make the operations commutative by construction, so order no longer matters.",
      },
      {
        type: "text",
        heading: "Back-of-the-Envelope Estimation",
        content:
          "Assume 2 million concurrent editors at peak and about one edit operation per second per active user — that is roughly 2 million operations per second. Each operation is tiny, on the order of 200 bytes, so bandwidth is around 400 MB per second across the fleet.\n\nThe state and fan-out numbers matter more. At roughly ten editors per active document, about 200,000 documents are live, and if each holds about 100 KB of document state in memory, that is on the order of 20 GB of hot state — small enough to keep resident, but the per-document fan-out of every operation to every collaborator is the real load.",
      },
      {
        type: "code",
        heading: "Sizing the Editor",
        language: "typescript",
        label: "editor-sizing.ts",
        code: `// Back-of-the-envelope sizing for a Google-Docs-style editor
const concurrentEditors = 2_000_000;     // 2M people typing at peak
const opsPerEditorPerSec = 1;            // ~1 edit op/sec while active
const docSizeKb = 100;                   // 100 KB of text plus structure
const editorsPerDoc = 10;

const opsPerSec = concurrentEditors * opsPerEditorPerSec;         // ~2M ops/sec
const bytesPerOp = 200;                                           // tiny op payloads
const bandwidthMbPerSec = (opsPerSec * bytesPerOp) / 1e6;         // ~400 MB/sec

// Fan-out: each op goes to every other editor on the same document
const fanoutOpsPerSec = opsPerSec * (editorsPerDoc - 1);          // ~18M fan-out sends/sec

// Live documents held in memory
const activeDocs = concurrentEditors / editorsPerDoc;             // ~200k docs
const inMemoryGb = (activeDocs * docSizeKb) / 1e6;                // ~20 GB
console.log({ opsPerSec, bandwidthMbPerSec, fanoutOpsPerSec, inMemoryGb });`,
      },
      {
        type: "text",
        heading: "OT vs CRDT",
        content:
          "**Operational Transformation (OT)** represents an edit as an operation (insert `text` at position `p`, or delete a range). When a client receives a concurrent operation, it *transforms* its own pending operation against it so positions stay valid. Google Docs uses OT: it is compact and battle-tested, but transformation functions are notoriously tricky to get right, and OT classically assumes a central server to define the total order of operations.\n\n**Conflict-free Replicated Data Types (CRDTs)** attach metadata to every character or element (a unique identifier, plus ordering information) so that operations **commute** — applying them in any order yields the same document. This makes them ideal for peer-to-peer and offline-first systems and they remove the need for a central ordering authority, at the cost of larger metadata per element and tombstones for deleted content. Automerge and Yjs are popular CRDT libraries.",
      },
      {
        type: "comparison",
        heading: "OT vs CRDT",
        headers: ["Operational Transformation", "CRDT"],
        rows: [
          {
            aspect: "Convergence mechanism",
            "Operational Transformation":
              "Transform operations against each other",
            CRDT: "Commutative operations merge by design",
          },
          {
            aspect: "Central server",
            "Operational Transformation": "Typically required for ordering",
            CRDT: "Optional — works peer to peer",
          },
          {
            aspect: "Metadata overhead",
            "Operational Transformation": "Small — ops carry positions",
            CRDT: "Larger — per-element IDs and tombstones",
          },
          {
            aspect: "Offline support",
            "Operational Transformation":
              "Harder to reconcile long offline edits",
            CRDT: "Natural — merge on reconnect",
          },
          {
            aspect: "Complexity",
            "Operational Transformation":
              "Transform functions are subtle and error-prone",
            CRDT: "Merge logic is well-defined but memory-heavy",
          },
          {
            aspect: "Used by",
            "Operational Transformation":
              "Google Docs and similar server-authoritative editors",
            CRDT: "Automerge, Yjs, Figma-style multiplayer",
          },
        ],
      },
      {
        type: "code",
        heading: "A WebSocket Sync Protocol",
        language: "typescript",
        label: "sync-protocol.ts",
        code: `// Collaborative sync over WebSockets. Every keystroke becomes an operation
// with a site id and a monotonic counter. The server orders ops and broadcasts
// them; clients transform or merge against local state. On reconnect the client
// sends its last seen server sequence and replays the diff.

interface Op {
  siteId: string;                     // unique per client session
  seq: number;                        // per-site monotonic counter
  type: "insert" | "delete";
  pos: number;                        // position in the document
  text?: string;
}

interface ServerMessage {
  type: "sync" | "op" | "ack" | "presence";
  serverSeq?: number;
  op?: Op;
  ops?: Op[];                         // ops missed since the client's last serverSeq
  peers?: { userId: string; cursor: number }[];
}

class EditorSession {
  private serverSeq = 0;
  private pending: Op[] = [];

  constructor(private socket: WebSocket, private siteId: string) {
    socket.onmessage = (e) => this.onMessage(JSON.parse(e.data) as ServerMessage);
  }

  localEdit(op: Op): void {
    this.pending.push(op);            // apply optimistically to local state first
    this.socket.send(JSON.stringify({ type: "op", op }));
  }

  reconnect(): void {
    // Ask the server for everything after our last known sequence number
    this.socket.send(JSON.stringify({ type: "sync", serverSeq: this.serverSeq }));
  }

  private onMessage(msg: ServerMessage): void {
    if (msg.type === "ack" && msg.serverSeq !== undefined) {
      this.serverSeq = msg.serverSeq;
      this.pending = this.pending.filter((o) => o.seq > msg.serverSeq!);
    } else if (msg.type === "op" && msg.op) {
      this.applyRemote(msg.op);      // transform (OT) or merge (CRDT) into local state
    }
  }

  private applyRemote(_op: Op): void { /* OT transform or CRDT merge */ }
}`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Presence and Offline Reconciliation",
        content:
          "**Presence** — cursors, selections, who is online — should be treated as ephemeral and best-effort. Broadcast it on a fast, lossy channel with a short TTL and let it expire; never let a stale cursor block or corrupt document state. Presence is not part of the durable operation log.\n\n**Offline editing** is where guarantees get real. A client that edits for hours offline accumulates a long operation history; on reconnect it must be replayed and merged. With OT the server has to transform that backlog against everything committed meanwhile, which grows expensive and fragile. With a CRDT the backlog merges by design regardless of how long it has been pending — the reason offline-first products lean toward CRDTs. Persist the merged document as a checkpoint so a reload does not replay the entire history.",
      },
      {
        type: "steps",
        heading: "An Edit End to End",
        steps: [
          {
            title: "Apply locally first",
            detail:
              "The client applies its edit optimistically so typing feels instant, and records the operation.",
          },
          {
            title: "Send over WebSocket",
            detail:
              "The operation travels to the server tagged with the client's site id and sequence number.",
          },
          {
            title: "Order on the server",
            detail:
              "The server assigns a global sequence, persists the operation, and appends it to the document history.",
          },
          {
            title: "Broadcast to peers",
            detail:
              "The server fans the operation out to every other editor on the same document.",
          },
          {
            title: "Rebase or merge",
            detail:
              "Each client transforms (OT) or merges (CRDT) the remote operation against its own pending edits.",
          },
          {
            title: "Acknowledge and reconcile",
            detail:
              "The server acks the sender's sequence; on reconnect the client requests everything after its last seen sequence.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Convergence is the core problem: all replicas must reach identical state regardless of delivery order",
          "OT transforms operations against each other and usually needs a central server to order them",
          "CRDTs make operations commutative, enabling peer-to-peer and offline-first editing at higher metadata cost",
          "Apply edits optimistically on the client so typing feels instant, then reconcile with the server",
          "Treat presence (cursors, selections) as ephemeral and lossy, never as durable document state",
          "Reconcile offline backlogs on reconnect and checkpoint the merged document to avoid replaying full history",
        ],
      },
    ],
    quiz: [
      {
        question: "What problem do both OT and CRDTs ultimately solve?",
        options: [
          "Encrypting documents",
          "Ensuring all replicas converge to the same document despite concurrent edits",
          "Compressing text",
          "Routing WebSocket connections",
        ],
        correctIndex: 1,
        explanation:
          "Concurrent edits to the same positions can produce divergent results. OT reconciles by transforming operations against one another; CRDTs make operations commute. Both guarantee that every replica ends in the same state.",
      },
      {
        question: "What is a key advantage of CRDTs for offline-first editing?",
        options: [
          "They require less metadata",
          "Operations commute, so a long offline backlog merges on reconnect regardless of ordering",
          "They need a central server",
          "They never allocate tombstones",
        ],
        correctIndex: 1,
        explanation:
          "Because CRDT operations are order-independent by construction, an offline client's accumulated edits merge cleanly when it reconnects. OT instead must transform that backlog against everything else committed, which is harder to get right.",
      },
      {
        question: "How should presence information like cursors be handled?",
        options: [
          "Stored durably in the operation log",
          "Broadcast best-effort with a short TTL and allowed to expire",
          "Used to block conflicting edits",
          "Encrypted per keystroke",
        ],
        correctIndex: 1,
        explanation:
          "Presence is ephemeral. It should ride a fast, lossy channel with a short TTL so a disconnected client's stale cursor disappears, and it must never gate or corrupt the durable document state.",
      },
      {
        question:
          "Why do clients apply edits locally before the server acknowledges them?",
        options: [
          "To reduce server load",
          "So typing feels instantaneous, with reconciliation happening afterward",
          "Because the server cannot order operations",
          "To avoid using WebSockets",
        ],
        correctIndex: 1,
        explanation:
          "Waiting for a round trip per keystroke would feel laggy. Optimistic local application keeps editing responsive; the client then rebases or merges the authoritative operations when the server echoes them back.",
      },
    ],
  },
};

