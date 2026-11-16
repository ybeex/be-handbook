// Part 8: Distributed Systems, Reliability, Infrastructure, and Operations topics

import type { TopicContent } from './contentTypes';

export const TOPIC_CONTENT_PART8: Record<string, TopicContent> = {

  // ─── DISTRIBUTED SYSTEMS ────────────────────────────────────────────────

  'consistent-hashing': {
    slug: 'consistent-hashing',
    title: 'Consistent Hashing',
    tagline: 'Stable key distribution across nodes',
    sections: [
      { type: 'text', heading: 'The Rehashing Problem', content: 'A distributed cache or sharded database must answer one question for every key: which node owns it? The obvious answer is modulo hashing — compute `hash(key) % N` where N is the number of nodes. This spreads keys evenly and requires no coordination between nodes.\n\nIt falls apart the moment N changes. Going from 4 nodes to 5 remaps roughly 80% of all keys, because almost every key now lands on a different node. In a cache this is a self-inflicted outage: billions of keys become misses at once, every miss hits the database, and the database — sized for a 5% miss rate — collapses under the full read load.' },
      { type: 'analogy', heading: 'The Library Analogy', content: 'Imagine a library with shelves labelled A-Z and a rule that books are filed by the first letter of the title. Add one new shelf and not a single book has to move — the filing rule still works.\n\nNow imagine a library that files books by a computed position: shelf 1 holds a quarter of all books, and every position is assigned by taking the book number modulo the shelf count. Add one shelf and nearly every book must be relocated. Consistent hashing is the A-Z rule: it assigns ownership by a stable mapping that survives changes to the set of shelves.' },
      { type: 'text', heading: 'The Hash Ring', content: 'Consistent hashing maps both nodes and keys onto the same circular space of size 2^32 (0 to 4,294,967,295). Hash each node identifier onto the ring, hash each key onto the ring, then walk clockwise from the key until you hit the first node. That node owns the key.\n\nWhen a node is added, it only takes over the keys in the arc between itself and its predecessor. On average, adding or removing a node moves only 1/N of the keys, where N is the node count, instead of nearly all of them.' },
      { type: 'code', heading: 'Building a Hash Ring', language: 'typescript', label: 'hash-ring.ts', code: `import crypto from 'crypto';

function hashKey(key: string): number {
  const digest = crypto.createHash('sha256').update(key).digest();
  return digest.readUInt32BE(0);
}

class HashRing {
  private ring: { hash: number; node: string }[] = [];

  addNode(node: string, vnodes = 150): void {
    for (let i = 0; i < vnodes; i++) {
      const hash = hashKey(node + '#' + i);
      this.ring.push({ hash, node });
    }
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  getNode(key: string): string | undefined {
    if (this.ring.length === 0) return undefined;
    const hash = hashKey(key);

    // Binary search for the first node clockwise on the ring
    let lo = 0;
    let hi = this.ring.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.ring[mid].hash < hash) lo = mid + 1;
      else hi = mid;
    }
    const idx = this.ring[lo].hash >= hash ? lo : 0; // wrap around
    return this.ring[idx].node;
  }
}

const ring = new HashRing();
['cache-a', 'cache-b', 'cache-c'].forEach((n) => ring.addNode(n));
console.log(ring.getNode('user:1001')); // stable node assignment` },
      { type: 'text', heading: 'Virtual Nodes Fix Skew', content: 'A single hash point per node produces an uneven ring. With three nodes placed at random, one node can end up owning 60-70% of the ring while another owns 10%. Removing that unlucky node dumps 70% of the traffic onto a single survivor.\n\nThe fix is virtual nodes (vnodes): each physical node is hashed onto the ring many times, typically 100-256 times. The arcs now interleave, so load spreads evenly and a failed node redistributes its keys across all remaining nodes. Cassandra defaults to 256 tokens per node, and Riak and DynamoDB use the same virtual-node technique.' },
      { type: 'comparison', heading: 'Modulo Hashing vs Consistent Hashing', headers: ['Modulo Hashing', 'Consistent Hashing'], rows: [
        { aspect: 'Key remap when N changes', 'Modulo Hashing': 'Roughly (N-1)/N of all keys', 'Consistent Hashing': 'Roughly 1/N of all keys' },
        { aspect: 'Adding a node', 'Modulo Hashing': 'Almost every key moves', 'Consistent Hashing': 'Only the new node arc moves' },
        { aspect: 'Load distribution', 'Modulo Hashing': 'Even only while N is fixed', 'Consistent Hashing': 'Even with vnodes, self-balancing' },
        { aspect: 'Node failure impact', 'Modulo Hashing': 'Remaps nearly everything, causing a stampede', 'Consistent Hashing': 'Only that node arc is redistributed' },
        { aspect: 'Coordination needed', 'Modulo Hashing': 'Every client must agree on N', 'Consistent Hashing': 'Clients share the same ring definition' },
        { aspect: 'Used by', 'Modulo Hashing': 'Simple caches and static clusters', 'Consistent Hashing': 'Cassandra, DynamoDB, Riak, Envoy, Maglev' },
      ]},
      { type: 'callout', calloutType: 'info', heading: 'Who Runs Consistent Hashing in Production', content: 'Cassandra, ScyllaDB, and DynamoDB partition data with a consistent hash ring and a configurable replication factor, commonly 3. Redis Cluster uses a fixed variant — 16,384 hash slots assigned to nodes — which behaves like consistent hashing at coarse granularity. Envoy and HAProxy implement Maglev and ring hashing to pin sessions to upstreams. Memcached clients use the ketama algorithm, the original open-source consistent-hash implementation.' },
      { type: 'steps', heading: 'Adding a Node to the Ring', steps: [
        { title: 'Hash the new node', detail: 'Compute the new node vnode positions and insert them into the ring.' },
        { title: 'Find the affected arcs', detail: 'For each vnode, the keys between the new vnode and its predecessor now belong to the new node.' },
        { title: 'Warm the new node', detail: 'Stream or re-fetch the affected keys before announcing the node, so it does not serve cold misses.' },
        { title: 'Update the client ring', detail: 'Distribute the updated ring or topology to all clients and nodes.' },
        { title: 'Verify balance', detail: 'Check that key distribution across nodes is within a few percent of the ideal 1/N share.' },
      ]},
      { type: 'code', heading: 'Replication with a Preference List', language: 'typescript', label: 'preference-list.ts', code: `// Replication factor: walk the ring clockwise and pick N distinct physical nodes
getPreferenceList(key: string, replicas = 3): string[] {
  const hash = hashKey(key);
  const start = this.findIndex(hash);
  const picked: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < this.ring.length && picked.length < replicas; i++) {
    const entry = this.ring[(start + i) % this.ring.length];
    // Skip duplicate physical nodes when several vnodes of the same node appear
    if (seen.has(entry.node)) continue;
    seen.add(entry.node);
    picked.push(entry.node);
  }
  return picked;
}` },
      { type: 'callout', calloutType: 'gold', heading: 'Bounded Loads Prevent Hotspots', content: 'Pure consistent hashing offers no hot-key protection: a single popular key always lands on one node. Google Bounded Loads caps any node at (1 + epsilon) times the average load; once a node reaches the cap, the request overflows to the next node clockwise. It is implemented in Envoy and HAProxy and cut cache miss rates significantly in Google front-end caches. Combine it with a small per-key cache for the genuinely hot keys that no hashing scheme can spread.' },
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'Consistent hashing bounds key movement to about 1/N when nodes join or leave',
        'Keys and nodes are both hashed onto a ring; the first node clockwise owns the key',
        'Virtual nodes (100-256 per physical node) even out distribution and failure redistribution',
        'Modulo hashing remaps nearly all keys on resize and is unsafe for elastic clusters',
        'Replication uses a preference list — the first N distinct nodes clockwise from the key',
        'Bounded loads and per-key caching handle hot keys that pure hashing cannot spread',
      ]},
    ],
    quiz: [
      { question: 'You run a 10-node cache cluster using modulo hashing. What fraction of keys is remapped when you add one node?', options: ['About 10%', 'About 50%', 'About 90%', 'None — modulo stays stable'], correctIndex: 2, explanation: 'Adding a node changes the divisor from 10 to 11. For almost every key, hash(key) % 11 no longer equals hash(key) % 10, so roughly 9 of 10 keys move. Consistent hashing would move only about 1/11, around 9%.' },
      { question: 'What problem do virtual nodes solve?', options: ['They encrypt keys before hashing', 'They place each physical node at many ring positions so load spreads evenly', 'They remove the need for a hash function', 'They copy every key to every node'], correctIndex: 1, explanation: 'A single hash point per node leaves the ring uneven — one node can own most of the keyspace. Virtual nodes hash each physical node many times (often 256), so arcs interleave, load evens out, and a failed node redistributes its keys across all survivors.' },
      { question: 'In a consistent hash ring with replication factor 3, how are the three replicas chosen?', options: ['The three physically nearest servers in the data centre', 'The next three distinct physical nodes clockwise from the key', 'Three uniformly random nodes', 'The three nodes with the most free memory'], correctIndex: 1, explanation: 'Replicas are the first N distinct physical nodes encountered walking clockwise from the key on the ring. This placement is deterministic and stable, so every client independently computes the same replica set.' },
    ]
  },

  // ─── RELIABILITY ────────────────────────────────────────────────────────

  'resilience-patterns': {
    slug: 'resilience-patterns',
    title: 'Resilience Patterns',
    tagline: 'Timeouts, retries, bulkheads, and load shedding',
    sections: [
      { type: 'text', heading: 'Everything Distant Fails', content: 'In a single process, a function call either returns or throws. Across the network, a call can hang forever, return after 30 seconds, succeed while the response is lost, or succeed on the server while reporting failure to the client. Distributed systems do not have clean errors — they have ambiguous outcomes.\n\nResilience patterns exist to bound that ambiguity: cap how long you wait, cap how often you retry, cap how much of your capacity one dependency can consume, and shed load you cannot serve.' },
      { type: 'analogy', heading: 'The Electrical Circuit Breaker', content: 'A house circuit breaker trips when current exceeds a safe threshold, cutting power before the wiring melts. When the fault clears, you reset it. Without it, one short circuit burns the whole house.\n\nA software circuit breaker works identically. After enough failures to a dependency it trips open and fails fast — every call returns an error immediately instead of waiting for a timeout. After a cooldown it enters half-open and lets a few probe requests through. If they succeed the circuit closes; if not it opens again.' },
      { type: 'text', heading: 'Timeouts Are Non-Negotiable', content: 'Every network call must have a deadline. Without one, a slow dependency converts into unbounded concurrency: worker threads or event-loop slots accumulate on hung sockets until the process runs out of memory or connections. One slow service takes down its callers.\n\nSet two numbers, not one: a connect timeout (how long to establish the TCP and TLS connection, typically 250ms-1s) and a request timeout (how long the full response may take, typically 1-5s). Make the client deadline strictly shorter than the caller own deadline so the timeout trips first, leaving budget to return a clean error.' },
      { type: 'code', heading: 'A Hard Deadline on Every Request', language: 'typescript', label: 'timeout.ts', code: `async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error('Request timed out after ' + ms + 'ms');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Per-request deadline well below the caller own timeout budget
await fetchWithTimeout('https://payments.internal/charge', 2000);` },
      { type: 'text', heading: 'Retries with Backoff and Jitter', content: 'Retries turn a transient blip into a success, but naive retries turn an outage into an avalanche. Rules that keep retries safe: only retry idempotent operations; cap attempts at 2-3; increase delay exponentially; and always add jitter so retries do not synchronize.\n\nThe golden formula from the AWS Architecture Blog is full jitter: sleep = random(0, min(cap, base * 2^attempt)). After three attempts with base 100ms and cap 5s, a caller waits a random amount up to 800ms, breaking the convoy that otherwise forms when thousands of clients retry on the same schedule.' },
      { type: 'code', heading: 'Retry with Full Jitter', language: 'typescript', label: 'retry.ts', code: `const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function retry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      // Full jitter: sleep = random(0, min(cap, base * 2^attempt))
      const base = 100;
      const cap = 5000;
      const max = Math.min(cap, base * 2 ** attempt);
      await sleep(Math.random() * max);
    }
  }
  throw lastError;
}` },
      { type: 'comparison', heading: 'Resilience Patterns Compared', headers: ['Timeout', 'Retry', 'Circuit Breaker', 'Bulkhead', 'Load Shedding'], rows: [
        { aspect: 'Problem it solves', Timeout: 'A call that never returns', Retry: 'A transient one-off failure', 'Circuit Breaker': 'A dependency that is down for a while', Bulkhead: 'One slow dependency consuming all capacity', 'Load Shedding': 'More incoming load than you can serve' },
        { aspect: 'Trigger', Timeout: 'Deadline elapsed', Retry: 'Call failed, after jitter delay', 'Circuit Breaker': 'Failure rate above a threshold', Bulkhead: 'Pool saturation', 'Load Shedding': 'Concurrency or queue limit reached' },
        { aspect: 'Action', Timeout: 'Abort the call', Retry: 'Attempt again, bounded', 'Circuit Breaker': 'Fail fast without calling', Bulkhead: 'Reject or queue within the pool only', 'Load Shedding': 'Return 503 immediately' },
        { aspect: 'Risk if misused', Timeout: 'Too short causes false failures', Retry: 'Retry storms and amplification', 'Circuit Breaker': 'Premature trip blocks healthy traffic', Bulkhead: 'Over-partitioning wastes capacity', 'Load Shedding': 'Dropping important requests' },
        { aspect: 'Typical config', Timeout: 'Connect 250ms, request 2s', Retry: '3 attempts, full jitter, cap 5s', 'Circuit Breaker': 'Open at 50% errors over 20 requests', Bulkhead: 'Per-dependency pool of 50', 'Load Shedding': 'Concurrency limit 300 per instance' },
      ]},
      { type: 'callout', calloutType: 'danger', heading: 'Retry Amplification and Storms', content: 'Retries multiply. If service A retries 3 times to B and B retries 3 times to C, a single user request can generate up to 9 calls to C, and deeper chains explode further — Google SRE calls this retry amplification. When a dependency degrades, synchronized retries (a thundering herd) add load exactly when the system is weakest. Defences: full jitter, a retry budget such as retries adding at most 10% to total volume, retrying only on connection errors and 503s rather than deterministic 400s, and letting the circuit breaker stop retries entirely once a dependency is known down.' },
      { type: 'code', heading: 'Circuit Breaking and Outlier Detection in Envoy', language: 'yaml', label: 'envoy-resilience.yaml', code: `static_resources:
  clusters:
    - name: payments
      connect_timeout: 0.25s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      circuit_breakers:
        thresholds:
          - max_connections: 512
            max_pending_requests: 256
            max_requests: 1024
            max_retries: 3
      outlier_detection:
        consecutive_5xx: 5
        interval: 10s
        base_ejection_time: 30s
        max_ejection_percent: 50` },
      { type: 'text', heading: 'Bulkheads, Load Shedding, and Backpressure', content: 'A bulkhead isolates resources so one dependency cannot starve the rest. Instead of one shared thread or connection pool, give each dependency its own: payments gets 50 connections, search gets 20, recommendations gets 10. If recommendations degrades, only its bulkhead saturates and checkout keeps running.\n\nLoad shedding is the admission-control counterpart. When concurrency or queue depth hits a ceiling, reject fast with a 503 and a Retry-After header rather than accepting work you cannot finish; queuing past the point of usefulness only increases latency for everyone. Netflix concurrency limits library applies one limit per instance derived from Little Law — limiting in-flight requests rather than requests per second — and automatically lowers the limit when latency rises.' },
      { type: 'callout', calloutType: 'gold', heading: 'Battle-Tested Defaults', content: 'The AWS SDKs retry 3 times with exponential backoff and full jitter, and only on throttling and 5xx errors. gRPC propagates a single deadline across the whole call chain, so a timeout at the edge cancels work downstream. Netflix built Hystrix — since replaced by resilience4j and built-in concurrency limits — to trip circuits and fall back gracefully, serving cached recommendations instead of failing a whole page. Envoy outlier detection ejects an unhealthy upstream host after 5 consecutive 5xx responses for 30 seconds.' },
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'Every network call needs a deadline; without one a slow dependency causes unbounded concurrency',
        'Set separate connect and request timeouts, and always shorter than the caller budget',
        'Retry only idempotent operations, at most 2-3 times, with exponential backoff and jitter',
        'Full jitter breaks the synchronized retry waves that turn incidents into avalanches',
        'Circuit breakers fail fast when a dependency is down; bulkheads stop one dependency starving the rest',
        'Load shedding returns 503 quickly instead of queueing work you cannot finish',
      ]},
    ],
    quiz: [
      { question: 'Why is a timeout mandatory on every network call?', options: ['To reduce bandwidth usage', 'Without a deadline, a slow dependency causes unbounded concurrency and exhausts resources', 'To encrypt the connection', 'To enable retries'], correctIndex: 1, explanation: 'An unbounded wait lets hung sockets accumulate until the process runs out of threads, connections, or memory. A deadline bounds how long your capacity can be held by a dependency and lets the caller fail cleanly instead of cascading.' },
      { question: 'What is the purpose of jitter in retry backoff?', options: ['To make retries faster', 'To randomize retry timing so clients do not retry in synchronized waves', 'To encrypt the retry payload', 'To prioritize retries by user tier'], correctIndex: 1, explanation: 'Without jitter, thousands of clients that fail at the same moment retry at the same moment, producing a thundering herd that hammers a struggling dependency. Randomizing the delay spreads retries over time.' },
      { question: 'What are the three states of a circuit breaker?', options: ['Open, closed, and half-open', 'On, off, and standby', 'Green, yellow, and red', 'Idle, active, and done'], correctIndex: 0, explanation: 'Closed passes traffic normally. Open fails fast without calling the dependency. Half-open lets a few probe requests through to test recovery; success closes the circuit, failure reopens it.' },
    ]
  },

  // ─── CAPACITY AND PERFORMANCE ───────────────────────────────────────────

  'capacity-planning': {
    slug: 'capacity-planning',
    title: 'Capacity Planning',
    tagline: 'Sizing systems for real traffic',
    sections: [
      { type: 'text', heading: 'What Capacity Planning Solves', content: 'Capacity planning answers three questions before an incident forces them: how much load will we receive at peak, how much infrastructure can we afford, and what headroom keeps us safe when something fails? Guessing low means outages; guessing high means paying for idle servers. The goal is a defensible number, not a precise one.\n\nIt applies to every layer — request-serving instances, database connections, queue consumers, cache memory — and each layer has a different bottleneck. The tier you can scale in seconds is rarely the one that runs out first; the stateful database usually is.' },
      { type: 'text', heading: 'Little Law Is the Whole Model', content: 'Little Law states that the average number of items in a system equals the arrival rate times the average time each item spends there: L = lambda x W. In backend terms, concurrency = requests per second x latency in seconds.\n\nThis single equation sizes almost everything. Need to serve 5,000 rps at 80ms? You must support 400 requests in flight. If one worker handles 20 concurrent requests, you need at least 20 workers, and more once you leave headroom. Database connection pools follow the same rule: pool size should cover peak throughput x average query time.' },
      { type: 'code', heading: 'Applying Little Law', language: 'typescript', label: 'little-law.ts', code: `// Little Law: L = lambda * W
// L = concurrent requests, lambda = arrivals per second, W = latency in seconds

const arrivalRate = 5000;      // 5,000 requests per second
const latencySeconds = 0.08;   // 80ms average response time
const concurrency = arrivalRate * latencySeconds; // 400 requests in flight

// Each worker handles about 20 concurrent requests; target 60% utilization
const perWorker = 20;
const targetUtilization = 0.6;
const workers = Math.ceil(concurrency / (perWorker * targetUtilization));
console.log(workers); // 34 workers to serve 5k rps at 80ms with headroom` },
      { type: 'text', heading: 'Why 100% Utilization Is a Trap', content: 'Queueing theory is unforgiving near saturation. As utilization approaches 100%, queue length and waiting time grow without bound — the Kingman formula shows latency rising roughly with utilization divided by (1 minus utilization). A server at 90% utilization has far more latency than one at 50%.\n\nThat is why latency-sensitive services target 50-70% steady-state utilization. The headroom is not waste: it absorbs traffic spikes, gives slow requests room to drain, and keeps the system in the linear region where a 2x traffic increase does not become a 50x latency increase. The same principle applies to database connections, queue depth, and thread pools.' },
      { type: 'analogy', heading: 'The Restaurant Analogy', content: 'A restaurant with 20 tables is not staffed for 20 simultaneous seatings. It plans for a Friday-night peak, keeps a couple of tables free for walk-ins, and knows that if one waiter calls in sick the kitchen still runs. Staffing for the average Tuesday guarantees failure on Friday.\n\nCapacity planning is exactly this: size for peak, not average; keep spare tables (headroom) for the unexpected; and ensure that losing one chef — one availability zone — does not close the restaurant.' },
      { type: 'steps', heading: 'A Capacity Planning Process', steps: [
        { title: 'Measure the baseline', detail: 'Record current rps, latency percentiles, CPU, memory, and connection-pool usage per service over weeks, not minutes.' },
        { title: 'Model the peak', detail: 'Multiply average load by the expected peak factor, often 2-5x for daily peaks and 10x or more for events, then add next-quarter growth.' },
        { title: 'Find the bottleneck', detail: 'Identify the first component to saturate under projected load — usually the database, then the cache, then stateless compute.' },
        { title: 'Load test to confirm', detail: 'Run a load test at and above peak to validate the model and find the real breaking point.' },
        { title: 'Size with headroom', detail: 'Provision so peak fits within 60-70% utilization, leaving room for one zone to fail.' },
        { title: 'Set scaling triggers', detail: 'Configure autoscaling and alerts on the leading indicators you just identified.' },
        { title: 'Review after changes', detail: 'Re-measure after every major feature or traffic shift; the model decays quickly.' },
      ]},
      { type: 'comparison', heading: 'Steady-State Utilization Targets', headers: ['Target utilization', 'Headroom', 'Scaling trigger'], rows: [
        { aspect: 'Stateless API instances', 'Target utilization': '50-70% CPU', Headroom: '2x peak', 'Scaling trigger': 'HPA at 60% CPU' },
        { aspect: 'Database primary', 'Target utilization': '40-60% CPU, under 70% connections', Headroom: 'Room for failover and backups', 'Scaling trigger': 'Manual — vertical scale' },
        { aspect: 'Cache (Redis)', 'Target utilization': 'About 70% memory', Headroom: 'Eviction safety margin', 'Scaling trigger': 'Add shards before 70%' },
        { aspect: 'Queue consumers', 'Target utilization': 'Near-zero lag at peak', Headroom: '2x consumer capacity', 'Scaling trigger': 'KEDA on queue depth' },
        { aspect: 'Object storage and CDN', 'Target utilization': 'Effectively unlimited', Headroom: 'Not applicable', 'Scaling trigger': 'Not applicable' },
      ]},
      { type: 'code', heading: 'Back-of-the-Envelope Estimate', language: 'typescript', label: 'envelope.ts', code: `// Estimate peak QPS from product metrics
const dau = 10_000_000;              // 10M daily active users
const sessionsPerUser = 2.5;
const requestsPerSession = 40;
const peakFactor = 3;                // peak hour is about 3x the daily average

const dailyRequests = dau * sessionsPerUser * requestsPerSession; // about 1.0B
const avgRps = dailyRequests / 86_400;                            // about 11,574 rps
const peakRps = avgRps * peakFactor;                              // about 34,722 rps

// With a 20:1 read to write ratio, size replicas for reads and the primary for writes
const writeRps = peakRps / 21;                                    // about 1,653 rps
console.log({ avgRps, peakRps, writeRps });` },
      { type: 'callout', calloutType: 'warning', heading: 'Provision for N+1, Not N', content: 'Size for N+1, where N is the number of failure domains you must survive. For a three-AZ deployment that means each remaining AZ must handle the full load when one AZ fails, so size every AZ for the whole system or accept documented degradation. AWS and Google both recommend running comfortably below capacity to absorb zone loss and rolling deploys without dropping traffic. If losing one of three nodes pushes the others past 100%, you do not have a redundant system — you have a slower single point of failure.' },
      { type: 'callout', calloutType: 'gold', heading: 'Real Peaks Are Planned, Not Discovered', content: 'Black Friday and Cyber Monday routinely push e-commerce traffic to 5-10x a normal day. Shopify processes billions of requests across the BFCM weekend and pre-scales infrastructure days ahead of the event. Netflix provisions regional failover capacity so an entire cloud region can go dark without an outage. The lesson from every one is the same: the peak is known in advance, so it should be planned, load-tested, and paid for deliberately rather than discovered during an incident.' },
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'Little Law (concurrency = rps x latency) sizes workers, pools, and queues',
        'Target 50-70% steady-state utilization for latency-sensitive services',
        'Sizing for the average guarantees failure at peak — size for peak with headroom',
        'The database is usually the first component to saturate, not the stateless tier',
        'Plan N+1 capacity so one zone failure does not exhaust the remaining zones',
        'Validate every capacity model with a load test at and above projected peak',
      ]},
    ],
    quiz: [
      { question: 'Using Little Law, what does concurrency equal?', options: ['Requests per second divided by latency', 'Requests per second multiplied by latency in seconds', 'Total requests divided by number of servers', 'Latency divided by error rate'], correctIndex: 1, explanation: 'Little Law gives L = lambda x W: the number of items in the system (concurrent requests) equals the arrival rate (rps) times the time each spends in the system (latency in seconds). At 5,000 rps and 80ms, that is 400 requests in flight.' },
      { question: 'Why is running a latency-sensitive service at 100% CPU utilization dangerous?', options: ['CPU burn damages the hardware', 'Queueing theory says latency grows without bound as utilization nears 100%', 'Cloud providers charge double above 90%', 'The kernel throttles all processes'], correctIndex: 1, explanation: 'Near saturation, queueing effects dominate: waiting time scales roughly with utilization divided by (1 minus utilization), so 90% utilization has far more latency than 50%. Headroom keeps the system in the linear region.' },
      { question: 'What does provisioning N+1 capacity mean for a three-AZ deployment?', options: ['Add one extra server in total', 'Each remaining zone can handle the full load if one zone fails', 'Run at 101% of capacity', 'Keep one spare instance per zone only'], correctIndex: 1, explanation: 'N+1 means the system survives losing one failure domain. With three AZs, each AZ must be able to carry the full load when one is down — otherwise the remaining two are overloaded and you have no real redundancy.' },
    ]
  },

  'load-testing': {
    slug: 'load-testing',
    title: 'Performance & Load Testing',
    tagline: 'k6, benchmarks, and interpreting results',
    sections: [
      { type: 'text', heading: 'Why Load Test', content: 'Performance claims without measurement are guesses. A load test answers concrete questions: how many requests per second can one instance serve, where does latency bend upward, and what happens at 2x the expected peak? Benchmarks turn those into numbers you can capacity-plan against.\n\nLoad testing also validates resilience behaviour that unit tests cannot: does the autoscaler keep up, does the connection pool exhaust, does p99 latency stay bounded, and does the system recover cleanly after the load stops.' },
      { type: 'comparison', heading: 'Types of Load Test', headers: ['Load profile', 'Goal', 'Typical duration'], rows: [
        { aspect: 'Smoke test', 'Load profile': '1-5 users', Goal: 'Verify the script and environment work', 'Typical duration': '1-2 minutes' },
        { aspect: 'Load test', 'Load profile': 'Expected peak', Goal: 'Confirm the system meets SLOs at peak', 'Typical duration': '10-30 minutes' },
        { aspect: 'Stress test', 'Load profile': 'Ramp past peak until failure', Goal: 'Find the breaking point and failure mode', 'Typical duration': 'Until failure' },
        { aspect: 'Spike test', 'Load profile': 'Sudden jump to 3x peak', Goal: 'Test autoscaling and recovery', 'Typical duration': 'A few minutes' },
        { aspect: 'Soak test', 'Load profile': 'Sustained moderate load', Goal: 'Reveal memory leaks and connection exhaustion', 'Typical duration': '2-24 hours' },
        { aspect: 'Breakpoint test', 'Load profile': 'Slow ramp to extreme', Goal: 'Map the capacity curve and degradation', 'Typical duration': 'Extended' },
      ]},
      { type: 'code', heading: 'A k6 Load Test', language: 'javascript', label: 'load-test.js', code: `import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // ramp up to 50 virtual users
    { duration: '5m', target: 50 },   // hold steady
    { duration: '1m', target: 0 },    // ramp down
  ],
};

export default function () {
  const res = http.get('https://api.example.com/v1/products?limit=20');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body is small': (r) => r.body.length < 50000,
  });
  sleep(1);
}` },
      { type: 'steps', heading: 'Running a k6 Test', steps: [
        { title: 'Write the script', detail: 'Define stages, the request, and checks in a k6 JavaScript file.' },
        { title: 'Smoke test first', detail: 'Run with a single virtual user to confirm the endpoint and data are correct.' },
        { title: 'Use a production-like environment', detail: 'Match instance sizes and data volume; a laptop or a tiny staging box invalidates the results.' },
        { title: 'Scale the load generator', detail: 'Run distributed (k6 Cloud or multiple generators) so the generator is never the bottleneck.' },
        { title: 'Watch server-side metrics', detail: 'Correlate k6 latency with CPU, memory, database connections, and queue depth in Grafana.' },
        { title: 'Break it deliberately', detail: 'Push past the limit to see whether the service degrades gracefully or fails hard.' },
        { title: 'Record results', detail: 'Save the report so future runs are comparable.' },
      ]},
      { type: 'text', heading: 'Interpreting Percentiles', content: 'An average hides the requests users actually feel. If 99 of 100 requests take 10ms and one takes 1 second, the average is a cheerful 20ms while one user waited a full second. Always look at percentiles: p50 (median), p95, and p99.\n\nTail latency matters because users make many requests per page. If each request has a 1% chance of being slow and a page fans out to 50 backend calls, the chance that at least one is slow is roughly 40%. Keep p99 bounded, and watch the p99 to p50 ratio — a widening tail signals resource contention such as GC pauses, lock contention, or connection-pool waits long before the average moves.' },
      { type: 'code', heading: 'Encoding SLOs as k6 Thresholds', language: 'javascript', label: 'thresholds.js', code: `export const options = {
  vus: 100,
  duration: '10m',
  thresholds: {
    // 95% of requests must complete below 250ms, 99% below 500ms
    'http_req_duration': ['p(95)<250', 'p(99)<500'],
    // fewer than 1% of requests may fail
    'http_req_failed': ['rate<0.01'],
    // checks must pass 99% of the time
    'checks': ['rate>0.99'],
  },
};` },
      { type: 'callout', calloutType: 'warning', heading: 'Coordinated Omission', content: 'Naive load generators hide the worst latency. If each virtual user sends a request, waits for the response, then sends the next, and the server stalls for 5 seconds, the generator simply sends fewer requests during the stall and never records the requests that should have been sent. This is coordinated omission, named by Gil Tene. k6 and wrk2 correct for it by pacing requests at a fixed rate regardless of responses. If your tool waits for responses before issuing the next request, your p99 is fiction and your reported capacity is too high.' },
      { type: 'callout', calloutType: 'info', heading: 'Do Not Load Test Production by Accident', content: 'Load tests against production can be a real outage. Test in an environment that matches production topology and data size, or in production behind a strict rate limit and a kill switch. Never run unthrottled load tests against third-party APIs — you will get the account banned. Remember the load generator has limits too: a single k6 instance tops out around tens of thousands of rps depending on script complexity, so monitor the generator own CPU.' },
      { type: 'text', heading: 'Benchmarking Discipline', content: 'Comparable results require controlled conditions. Warm up first — JIT compilation, connection pools, and caches need time to reach steady state. Fix the dataset and request mix so runs are identical. Pin the test to one instance size and note the exact build. Run each test at least three times and report the median, not the best run. Separate the steady-state phase from ramp-up and ramp-down when computing percentiles, or the ramps will distort them.' },
      { type: 'callout', calloutType: 'gold', heading: 'What Good Looks Like', content: 'Concrete targets give the test meaning. For a typical read API, aim for p50 under 50ms, p95 under 150ms, p99 under 300ms, and an error rate below 0.1% at peak. Indexed database reads should be sub-10ms. If a page needs 500ms at p99, users perceive it as sluggish regardless of a healthy average. Define these numbers as k6 thresholds so a regression fails CI rather than surprising someone in production.' },
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'Load tests replace performance guesses with measured capacity numbers',
        'Run smoke, load, stress, spike, soak, and breakpoint tests for different questions',
        'Judge performance by p95 and p99, never by the average',
        'Coordinated omission inflates results — use a tool that paces requests independently',
        'Match the test environment to production; the load generator itself can be the bottleneck',
        'Encode SLOs as k6 thresholds so regressions fail the build',
        'Warm up, fix the data, and repeat runs before trusting a number',
      ]},
    ],
    quiz: [
      { question: 'Which percentile best captures the worst experience most users could hit?', options: ['p50', 'The average', 'p99', 'The mean of all requests'], correctIndex: 2, explanation: 'p99 shows the latency at the 99th percentile — the slow tail that a meaningful fraction of users will hit, especially when a page fans out to many requests. The average hides this tail entirely.' },
      { question: 'What is coordinated omission?', options: ['Load generators that pace requests independently of responses', 'Load generators that wait for each response before sending the next, hiding slow latency', 'Running a test from multiple regions at once', 'Omitting the ramp-up phase of a test'], correctIndex: 1, explanation: 'When the generator waits for each response before sending the next, a server stall simply reduces the number of requests sent, so the missing (slow) requests are never measured. The reported latency looks healthy while real users wait.' },
      { question: 'Which test type is designed to reveal memory leaks and connection exhaustion?', options: ['Smoke test', 'Spike test', 'Soak test', 'Breakpoint test'], correctIndex: 2, explanation: 'A soak test runs sustained moderate load for hours (2-24), which is long enough for leaks, growing heaps, and exhausted connection pools to surface — problems that a short load test never triggers.' },
    ]
  },

  // ─── INFRASTRUCTURE ─────────────────────────────────────────────────────

  'iac': {
    slug: 'iac',
    title: 'Infrastructure as Code',
    tagline: 'Terraform, state, and reproducible infrastructure',
    sections: [
      { type: 'text', heading: 'What Is Infrastructure as Code', content: 'Infrastructure as Code (IaC) means defining servers, networks, databases, and their configuration in version-controlled files instead of clicking through a cloud console. The infrastructure becomes reproducible: the same files produce the same environment, and every change is a reviewable pull request.\n\nThe payoff is not tidiness. It is eliminating configuration drift — production quietly diverging from what anyone remembers — making disaster recovery a single apply command rather than a week of archaeology, and letting a new region or a new team stand up an identical stack in minutes.' },
      { type: 'analogy', heading: 'The Architect Blueprint', content: 'A building is not constructed from a verbal description; it is built from a blueprint any qualified crew can follow to produce the same structure. Change the building, change the blueprint first.\n\nIaC is the blueprint for infrastructure. The cloud is the construction site and the Terraform files are the drawings. Hand-building servers in a console is like having no blueprint at all — the result works until you need to rebuild it, at which point nobody knows what was actually built.' },
      { type: 'text', heading: 'Declarative vs Imperative', content: 'Imperative tools such as shell scripts and Ansible tasks describe the steps to reach a state: create this, then that. Declarative tools such as Terraform, CloudFormation, and Kubernetes describe the desired end state and let the tool compute the diff. Declarative wins for infrastructure because it is idempotent — running it twice produces the same result, not two of everything.\n\nTerraform stores what it believes exists in a state file, compares it to your configuration and to the real cloud, then produces a plan of the changes needed. You review the plan before anything is applied.' },
      { type: 'code', heading: 'A Terraform Stack', language: 'hcl', label: 'main.tf', code: `terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {
    bucket         = "acme-terraform-state"
    key            = "prod/network/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags                 = { Name = "prod-vpc" }
}

resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index)
  availability_zone = element(["eu-west-1a", "eu-west-1b", "eu-west-1c"], count.index)
}` },
      { type: 'steps', heading: 'The Terraform Workflow', steps: [
        { title: 'Write configuration', detail: 'Describe resources in .tf files using providers for AWS, GCP, Cloudflare, and so on.' },
        { title: 'terraform init', detail: 'Download provider plugins and configure the remote state backend.' },
        { title: 'terraform plan', detail: 'Compare desired config, state, and real infrastructure; print the exact create, update, and destroy diff.' },
        { title: 'Review the plan', detail: 'A human reads the plan in the pull request — destroying a database by accident is caught here.' },
        { title: 'terraform apply', detail: 'Execute the reviewed plan and update state.' },
        { title: 'Commit and review', detail: 'Merge the configuration through normal code review; CI applies it to production.' },
      ]},
      { type: 'text', heading: 'State Is the Hard Part', content: 'Terraform state maps your configuration to real cloud resource IDs and stores metadata such as dependencies. It is the source of truth for what Terraform manages — and also the most common source of pain.\n\nState must live in a shared remote backend such as S3, GCS, or Terraform Cloud, never on a laptop, and it must be locked so two pipelines cannot apply at once. It can contain secrets in plaintext, so the bucket needs encryption and tight access control. Losing state means Terraform no longer knows what it created; you must either import every resource back or risk orphaning infrastructure you are still paying for.' },
      { type: 'callout', calloutType: 'danger', heading: 'Never Keep State Local or Unlocked', content: 'A local terraform.tfstate on an engineer machine means the next person to run apply has stale state and will try to recreate or destroy everything. Two concurrent applies corrupt the state file. Always configure a remote backend with state locking — DynamoDB for S3, or the backend built-in lock — encrypted at rest, with versioning enabled so a bad apply can be rolled back to the previous state object.' },
      { type: 'comparison', heading: 'IaC Tool Comparison', headers: ['Terraform', 'CloudFormation', 'Pulumi', 'Ansible'], rows: [
        { aspect: 'Language', Terraform: 'HCL', CloudFormation: 'JSON or YAML', Pulumi: 'TypeScript, Go, Python, C#', Ansible: 'YAML playbooks' },
        { aspect: 'State handling', Terraform: 'Explicit state file in a remote backend', CloudFormation: 'Managed by AWS', Pulumi: 'Managed by the Pulumi backend', Ansible: 'Stateless — checks each run' },
        { aspect: 'Cloud coverage', Terraform: 'Multi-cloud plus third parties', CloudFormation: 'AWS only', Pulumi: 'Multi-cloud, provider-based', Ansible: 'Any target: servers, network, cloud' },
        { aspect: 'Best for', Terraform: 'Multi-cloud infrastructure', CloudFormation: 'AWS-native shops', Pulumi: 'Teams that want real programming languages', Ansible: 'Configuration management on existing hosts' },
      ]},
      { type: 'code', heading: 'Day-to-Day Terraform Commands', language: 'bash', label: 'terraform-cli.sh', code: `terraform init                     # download providers, configure remote state
terraform validate                 # syntax and type checking
terraform plan -out=tfplan         # show the exact diff of intended changes
terraform apply tfplan             # apply the reviewed plan
terraform state list               # list managed resources
terraform import aws_vpc.main vpc-0abc123   # adopt existing resources` },
      { type: 'callout', calloutType: 'gold', heading: 'Production Practices', content: 'Treat infrastructure code like application code: small reusable modules (network, database, service), one workspace or directory per environment (dev, staging, prod) so blast radius is contained, and no manual edits to managed resources. Run terraform plan in CI on every pull request and apply only after approval. Pin provider and module versions so an upstream release cannot silently change your infrastructure. Tag every resource with owner, environment, and cost centre — it is how you find what a runaway bill belongs to.' },
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'IaC makes infrastructure reproducible, reviewable, and recoverable',
        'Declarative tools are idempotent; you describe the desired state, not the steps',
        'Terraform state maps config to real resources and must live in a locked, encrypted remote backend',
        'Always review terraform plan output before applying — it prevents accidental destroys',
        'Modules and per-environment directories contain blast radius and enable reuse',
        'Pin provider and module versions; never let upstream releases change infrastructure silently',
      ]},
    ],
    quiz: [
      { question: 'What is the Terraform state file?', options: ['The compiled output of the configuration', 'A mapping between configuration and real cloud resources plus metadata', 'The provider plugin cache', 'A list of all cloud accounts'], correctIndex: 1, explanation: 'State records the mapping from your configuration to the actual resource IDs in the cloud, along with dependency metadata. Terraform uses it to compute plans. Losing it means Terraform no longer knows what it manages.' },
      { question: 'Why must Terraform state live in a remote backend with locking?', options: ['It makes applying faster', 'Shared, locked state prevents concurrent applies from corrupting it or creating duplicates', 'It encrypts secrets automatically', 'It removes the need for a plan step'], correctIndex: 1, explanation: 'A shared backend gives every engineer and pipeline the same state, and locking stops two applies running at once — which would otherwise corrupt the state file and cause resources to be duplicated or destroyed.' },
      { question: 'What is the difference between declarative and imperative IaC?', options: ['Declarative describes the desired end state; imperative describes the steps', 'Declarative is always cloud-native', 'Imperative tools cannot be version-controlled', 'Declarative tools cannot be idempotent'], correctIndex: 0, explanation: 'Declarative tools (Terraform, Kubernetes) take a desired end state and compute the diff, which makes them idempotent. Imperative tools run a sequence of steps and may repeat side effects if run twice.' },
    ]
  },

  'gitops': {
    slug: 'gitops',
    title: 'GitOps & Progressive Delivery',
    tagline: 'Argo CD, blue-green, and canary releases',
    sections: [
      { type: 'text', heading: 'What Is GitOps', content: 'GitOps is an operating model where Git is the single source of truth for both application code and the desired state of the running system. A controller inside the cluster continuously compares live state to what Git declares and reconciles any difference. Deploying is a commit; rolling back is a revert.\n\nArgo CD and Flux are the two dominant implementations. Argo CD watches Git repositories full of Kubernetes manifests and keeps clusters in sync with them, pulling changes rather than letting CI push into the cluster — so the cluster needs no inbound access from CI and every change has an audit trail in Git history.' },
      { type: 'analogy', heading: 'Instrument Flight Rules', content: 'Airlines do not fly by feel. Instruments report the aircraft actual state, pilots declare the intended state, and automated systems continuously correct the gap. If the plane drifts, the system pulls it back to the declared path without waiting for a human.\n\nGitOps is autopilot for infrastructure. Git declares the desired state, the controller observes the actual state, and reconciliation closes any gap — including when someone edits the cluster by hand. Drift is not tolerated; it is corrected back to what Git says.' },
      { type: 'steps', heading: 'The GitOps Workflow', steps: [
        { title: 'Declare state in Git', detail: 'All Kubernetes manifests, Helm releases, and environment overlays live in a repository.' },
        { title: 'Open a pull request', detail: 'A change to the desired state is proposed and reviewed like any code change.' },
        { title: 'Merge triggers reconciliation', detail: 'Argo CD detects the new commit and computes the diff against the live cluster.' },
        { title: 'OutOfSync is surfaced', detail: 'The application shows as OutOfSync until the controller applies the manifests.' },
        { title: 'Controller applies and syncs', detail: 'With automated sync enabled, the manifests are applied and the app returns to Synced.' },
        { title: 'Health is verified', detail: 'Resource health checks confirm pods become Ready, not merely created.' },
        { title: 'Rollback is a revert', detail: 'If the deploy degrades, reverting the commit restores the previous desired state.' },
      ]},
      { type: 'code', heading: 'An Argo CD Application', language: 'yaml', label: 'argocd-app.yaml', code: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: payments-api
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/acme/k8s-manifests.git
    targetRevision: main
    path: apps/payments-api/overlays/prod
  destination:
    server: https://kubernetes.default.svc
    namespace: payments
  syncPolicy:
    automated:
      prune: true       # delete resources removed from Git
      selfHeal: true    # revert manual cluster edits to match Git
    syncOptions:
      - CreateNamespace=true` },
      { type: 'text', heading: 'Drift Detection and Reconciliation', content: 'Two properties make GitOps powerful. First, pull-based deployment: the controller runs inside the cluster and fetches from Git, so CI never needs cluster credentials and the cluster never exposes an ingress for deploys. Second, continuous reconciliation: the controller re-checks every few minutes, so a manual edit that diverges from Git is detected and, with selfHeal enabled, reverted.\n\nThat same reconciliation is the rollback mechanism. Because the desired state is declarative, going back is just pointing at the previous commit. There is no imperative rollback script to maintain and no partial state to clean up.' },
      { type: 'comparison', heading: 'Progressive Delivery Strategies', headers: ['Rolling Update', 'Blue-Green', 'Canary'], rows: [
        { aspect: 'Mechanism', 'Rolling Update': 'Replace pods in batches', 'Blue-Green': 'Run two full environments, switch traffic', Canary: 'Route a small traffic share to the new version' },
        { aspect: 'Resource cost', 'Rolling Update': 'Low — reuses capacity', 'Blue-Green': '2x during cutover', Canary: 'Slightly above normal' },
        { aspect: 'Rollback speed', 'Rolling Update': 'Re-roll the deployment over minutes', 'Blue-Green': 'Instant — flip traffic back', Canary: 'Instant — set weight to 0' },
        { aspect: 'Blast radius', 'Rolling Update': 'Widening during the rollout', 'Blue-Green': 'All-or-nothing at cutover', Canary: 'Limited to the canary percentage' },
        { aspect: 'Best for', 'Rolling Update': 'Stateless services with fast startup', 'Blue-Green': 'Releases needing instant rollback', Canary: 'High-risk changes with metrics to judge' },
      ]},
      { type: 'code', heading: 'A Canary Rollout with Argo Rollouts', language: 'yaml', label: 'rollouts.yaml', code: `apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payments-api
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 10             # send 10% of traffic to the new version
        - pause: { duration: 5m }
        - setWeight: 50
        - pause: { duration: 10m }
        - setWeight: 100
      analysis:
        templates:
          - templateName: success-rate
        startingStep: 1             # begin analysis once the canary is live` },
      { type: 'callout', calloutType: 'info', heading: 'Sync Policies Decide How Aggressive Git Is', content: 'Automated sync with prune set to true deletes resources removed from Git, and selfHeal true reverts manual cluster changes — aggressive but true GitOps. Many teams start with manual sync in production: Argo CD shows OutOfSync and a human approves the sync, trading full automation for a last human checkpoint. Either way, never let CI both build the image and mutate the cluster directly, which reintroduces the push-based access GitOps exists to remove.' },
      { type: 'text', heading: 'Automated Analysis and Promotion', content: 'Progressive delivery becomes trustworthy when the decision to promote is data-driven. Flagger with Flux and Argo Rollouts integrate with Prometheus: a canary or blue-green step advances only if success rate, latency, and error metrics stay within thresholds for a defined period. If metrics regress, the rollout automatically aborts and traffic returns to the stable version.\n\nThis turns deployment from a manual judgement call into a closed loop: route 10% of traffic, measure for 5 minutes, then either advance to 50% or roll back — with no human polling dashboards at 2am.' },
      { type: 'callout', calloutType: 'gold', heading: 'Rollback Is the Feature', content: 'The real value of GitOps is that recovery is trivial and auditable. In a push-based pipeline, rolling back means finding the previous image tag, re-running a deploy, and hoping nothing else changed. In GitOps you revert one commit and the controller reconciles the cluster back to the prior state — and the rollback itself is a reviewed, timestamped commit. Argo CD keeps a full history of synced revisions, so you can see exactly what was deployed, when, and by whom.' },
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'GitOps makes Git the single source of truth for both code and running infrastructure',
        'Argo CD and Flux reconcile the cluster to Git continuously, pulling changes in',
        'Drift detection plus self-heal reverts manual cluster edits automatically',
        'Rollback is a commit revert — declarative, fast, and auditable',
        'Blue-green gives instant rollback; canary limits blast radius to a traffic share',
        'Automated analysis with Prometheus metrics advances or aborts rollouts without a human',
        'Never mix push-based CI deploys with GitOps reconciliation',
      ]},
    ],
    quiz: [
      { question: 'In GitOps, what is the source of truth for the desired state?', options: ['The running cluster', 'A Git repository', 'The CI server', 'The cloud console'], correctIndex: 1, explanation: 'Git holds the declared desired state. A controller reconciles the live cluster to match Git, and every change is a reviewable, auditable commit. The cluster is an observation target, not the source of truth.' },
      { question: 'What happens when someone edits a resource directly and selfHeal is enabled?', options: ['The change is kept permanently', 'Argo CD detects drift and reverts it to match Git', 'The cluster crashes', 'Git is updated automatically'], correctIndex: 1, explanation: 'Self-heal makes reconciliation corrective. The controller notices the live state diverges from Git and applies the declared state again, undoing the manual edit — which is why Git remains the single source of truth.' },
      { question: 'Which deployment strategy limits the blast radius to a small share of traffic?', options: ['Rolling update', 'Blue-green', 'Canary', 'Recreate'], correctIndex: 2, explanation: 'A canary sends only a small percentage of traffic — often 5-10% — to the new version while the rest stays on the stable version, so a faulty release affects few users and can be reverted by setting the weight to zero.' },
    ]
  },

  'k8s-advanced': {
    slug: 'k8s-advanced',
    title: 'Kubernetes Workloads & Autoscaling',
    tagline: 'StatefulSets, Jobs, Helm, and HPA',
    sections: [
      { type: 'text', heading: 'Kubernetes Workload Types', content: 'Kubernetes ships several workload controllers, each suited to a different lifecycle. A Deployment manages stateless pods that are interchangeable and can be created or destroyed freely. A StatefulSet gives each pod a stable identity, ordinal name, and its own persistent volume. A DaemonSet runs one pod per node. A Job runs a task to completion, and a CronJob runs it on a schedule.\n\nPicking the right controller is the first design decision, because it dictates how the workload scales, restarts, and persists data.' },
      { type: 'comparison', heading: 'Workload Controllers', headers: ['Deployment', 'StatefulSet', 'DaemonSet', 'Job/CronJob'], rows: [
        { aspect: 'Pod identity', Deployment: 'Random names, interchangeable', StatefulSet: 'Stable ordinal such as db-0, db-1', DaemonSet: 'One per node', 'Job/CronJob': 'One or N completions' },
        { aspect: 'Storage', Deployment: 'Shared or none', StatefulSet: 'Per-pod PersistentVolume', DaemonSet: 'Node-local or mounted host path', 'Job/CronJob': 'Usually none' },
        { aspect: 'Scaling', Deployment: 'Horizontally, freely', StatefulSet: 'Ordered, one at a time', DaemonSet: 'Follows node count', 'Job/CronJob': 'Fixed parallelism or completions' },
        { aspect: 'Typical use', Deployment: 'Stateless APIs, web servers', StatefulSet: 'Databases, Kafka, Elasticsearch', DaemonSet: 'Log shippers, node exporters', 'Job/CronJob': 'Migrations, batch, cleanup' },
        { aspect: 'Ordering', Deployment: 'None required', StatefulSet: 'Ordered create and delete', DaemonSet: 'Independent', 'Job/CronJob': 'Parallel or serial' },
      ]},
      { type: 'code', heading: 'A StatefulSet with Persistent Storage', language: 'yaml', label: 'statefulset.yaml', code: `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres-headless
  replicas: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 100Gi` },
      { type: 'text', heading: 'StatefulSets and Stable Identity', content: 'A StatefulSet guarantees that pod db-0 keeps its name, its DNS record, and its PersistentVolume across restarts and rescheduling. A headless Service (clusterIP: None) gives each pod a stable DNS name like db-0.postgres-headless, so peers address each other by identity rather than by ephemeral IP.\n\nPods are created and deleted in order, one at a time. This is exactly what stateful systems need — a database knows which replica is the primary, a Kafka broker knows its broker ID and data directory. It is also why StatefulSets scale slowly and why you do not use them for stateless workloads that want to scale up in seconds.' },
      { type: 'code', heading: 'A HorizontalPodAutoscaler', language: 'yaml', label: 'hpa.yaml', code: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: payments-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: payments-api
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 65
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "200"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300` },
      { type: 'text', heading: 'The Four Autoscalers', content: 'Kubernetes autoscaling has four independent layers. The HorizontalPodAutoscaler (HPA) changes the number of pod replicas based on metrics. The VerticalPodAutoscaler (VPA) adjusts each pod CPU and memory requests and limits instead. The Cluster Autoscaler adds or removes nodes when pods cannot be scheduled. KEDA scales workloads — including to zero — based on external events such as queue depth or Kafka lag.\n\nHPA scales on CPU and memory by default, or on custom and external metrics through the metrics API. Many teams install KEDA precisely because business signals, such as messages waiting in a queue, are a far better scaling signal than CPU for worker workloads.' },
      { type: 'callout', calloutType: 'warning', heading: 'HPA Needs Metrics and Requests', content: 'The HPA computes utilisation as a percentage of the container CPU request. If your containers do not set a CPU request, the HPA cannot calculate utilization and will refuse to scale — this is the single most common HPA failure. It also requires metrics-server or a metrics adapter to be installed and healthy. And remember HPA scales pods, not nodes: without the Cluster Autoscaler, extra pods sit Pending when the cluster has no room, so pair them.' },
      { type: 'text', heading: 'Adopting Helm', content: 'Helm packages Kubernetes manifests into versioned charts with values-driven templates, so the same chart deploys to dev, staging, and prod with different values. Instead of copying YAML across environments, you override a handful of values.\n\nHelm also gives you releases: a named, versioned installation you can list, upgrade, and roll back with a single command. Rolling back to revision 3 restores the previous revision. Use it for third-party software — the community charts for Prometheus, Postgres, and Redis are mature — and for your own services when you want templated, environment-parameterized manifests without writing a custom tool.' },
      { type: 'code', heading: 'Environment Values in a Helm Chart', language: 'yaml', label: 'values-prod.yaml', code: `replicaCount: 6
image:
  repository: ghcr.io/acme/payments-api
  tag: "1.14.2"          # immutable tag, never latest
resources:
  requests: { cpu: 250m, memory: 256Mi }
  limits:   { cpu: 1000m, memory: 512Mi }
autoscaling:
  enabled: true
  minReplicas: 6
  maxReplicas: 40
env:
  LOG_LEVEL: info
  DATABASE_URL: secret://payments/db-url` },
      { type: 'steps', heading: 'Rolling Out Safely', steps: [
        { title: 'Set resource requests and limits', detail: 'Without requests the scheduler misplaces pods; without limits a single pod can starve a node.' },
        { title: 'Define readiness probes', detail: 'A pod should receive traffic only when it can serve; readiness controls Service endpoints.' },
        { title: 'Configure liveness probes carefully', detail: 'An over-eager liveness probe restarts a healthy but slow pod, causing restart loops.' },
        { title: 'Add a PodDisruptionBudget', detail: 'Keep a minimum number available during voluntary disruptions such as node drains.' },
        { title: 'Choose a rollout strategy', detail: 'maxSurge and maxUnavailable control how aggressive a Deployment rollout is.' },
        { title: 'Watch the rollout', detail: 'kubectl rollout status blocks until the new ReplicaSet is fully available or fails.' },
      ]},
      { type: 'callout', calloutType: 'gold', heading: 'Autoscaling in Practice', content: 'Production clusters layer all four autoscalers. A typical setup: HPA scales API pods on CPU with a 65% target and a five-minute scale-down stabilization window; KEDA scales queue workers on SQS depth and down to zero when the queue is empty; VPA recommends right-sized requests that were often set by guesswork; and the Cluster Autoscaler provisions nodes for the pods those scalers create. Getting them to cooperate rather than fight is the real work.' },
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'Pick the workload type by lifecycle: Deployment, StatefulSet, DaemonSet, Job, or CronJob',
        'StatefulSets give stable pod identity, ordered rollouts, and per-pod volumes',
        'HPA scales replicas on metrics; VPA resizes pods; Cluster Autoscaler adds nodes; KEDA scales on events',
        'HPA requires metrics-server and CPU requests — missing requests silently block scaling',
        'Helm templates manifests and makes releases versioned and rollback-able',
        'Readiness probes, resource limits, and PodDisruptionBudgets protect availability during rollouts',
      ]},
    ],
    quiz: [
      { question: 'Which workload gives each pod a stable identity and its own persistent volume?', options: ['Deployment', 'StatefulSet', 'DaemonSet', 'CronJob'], correctIndex: 1, explanation: 'StatefulSets assign stable ordinal names (db-0, db-1), stable DNS, and a dedicated PersistentVolume per pod, and they create and delete pods in order — the properties stateful systems like databases and Kafka need.' },
      { question: 'Why does a HorizontalPodAutoscaler sometimes refuse to scale?', options: ['Because autoscaling is disabled by default', 'Because the containers have no CPU request, so utilization cannot be computed', 'Because HPA only works with GPUs', 'Because it requires a second HPA as a backup'], correctIndex: 1, explanation: 'HPA measures utilization as a percentage of the CPU request. With no request set, it cannot compute the percentage and reports an unknown metric, so no scaling occurs. Setting CPU requests fixes it.' },
      { question: 'What does the Cluster Autoscaler do that the HPA does not?', options: ['Adds and removes nodes when pods cannot be scheduled', 'Resizes pod memory requests', 'Scales deployments to zero', 'Rotates secrets'], correctIndex: 0, explanation: 'HPA changes replica counts, not node count. When more replicas are needed than the cluster can schedule, the Cluster Autoscaler provisions extra nodes — and removes them again when they go idle. The two are usually paired.' },
    ]
  },

  // ─── OPERATIONS AND OS ──────────────────────────────────────────────────

  'linux-fundamentals': {
    slug: 'linux-fundamentals',
    title: 'Linux & OS for Backend',
    tagline: 'Processes, signals, file descriptors, and tooling',
    sections: [
      { type: 'text', heading: 'Processes and the Kernel', content: 'A process is a running program with its own virtual address space, file descriptors, and signal handlers, scheduled onto CPU cores by the kernel. The kernel mediates everything — memory allocation, filesystem access, networking — so understanding a few kernel concepts makes debugging production issues dramatically faster.\n\nKey tools map directly to kernel structures: ps and /proc expose process state, lsof exposes open file descriptors, ss exposes sockets, and strace exposes system calls. Most mysterious backend hangs are visible through one of these.' },
      { type: 'analogy', heading: 'The Office Building', content: 'An operating system is an office building. Processes are employees working in their own offices (isolated memory). The kernel is the building manager who owns the shared resources — the elevators (CPU), the mail room (network), the filing room (disk). Employees cannot grab the elevator directly; they ask the manager, who schedules fair access.\n\nSignals are the manager knocking on your door to deliver a message. Some messages say please wrap up (SIGTERM); some cannot be refused and mean you are out immediately (SIGKILL).' },
      { type: 'steps', heading: 'Process Lifecycle', steps: [
        { title: 'fork', detail: 'The kernel clones the calling process, creating a child with a new PID and a copy-on-write copy of memory.' },
        { title: 'exec', detail: 'The child replaces its memory image with a new program — this is how a shell launches a binary.' },
        { title: 'wait', detail: 'The parent waits for the child to exit and reaps its exit status, preventing a zombie process.' },
        { title: 'exit', detail: 'The process terminates; the kernel frees its memory and closes its file descriptors.' },
        { title: 'reap', detail: 'If the parent never calls wait, the exited process remains a zombie until the parent exits.' },
      ]},
      { type: 'code', heading: 'Inspecting Processes', language: 'bash', label: 'processes.sh', code: `ps aux --sort=-%mem | head -n 10      # top memory consumers
pgrep -a node                          # find processes by name
top -b -n 1 -o %CPU                    # one-shot CPU snapshot
strace -f -p 4521 -T -e trace=network  # attach, show syscalls with timing
pidstat -p 4521 1                      # per-process CPU and memory every second` },
      { type: 'text', heading: 'Signals', content: 'Signals are asynchronous notifications to a process. A backend service should handle the ones it can and understand the one it cannot. SIGTERM (15) politely asks a process to terminate — this is what Kubernetes and systemd send first, and the process should stop accepting new work, drain in-flight requests, and exit. SIGKILL (9) cannot be caught or ignored; the kernel terminates the process immediately with no cleanup, which is why abrupt restarts leave connections half-open.\n\nSIGINT (2) is Ctrl-C. SIGHUP (1) traditionally means the terminal hung up or reload configuration. SIGQUIT (3) dumps a core. SIGUSR1 and SIGUSR2 are reserved for application-defined uses — Node.js, for example, starts its debugger on SIGUSR1.' },
      { type: 'comparison', heading: 'Common Signals', headers: ['Signal', 'Number', 'Catchable', 'Typical use'], rows: [
        { aspect: 'SIGHUP', Signal: 'SIGHUP', Number: '1', Catchable: 'Yes', 'Typical use': 'Reload configuration on many daemons' },
        { aspect: 'SIGINT', Signal: 'SIGINT', Number: '2', Catchable: 'Yes', 'Typical use': 'Ctrl-C, request a graceful stop' },
        { aspect: 'SIGQUIT', Signal: 'SIGQUIT', Number: '3', Catchable: 'Yes', 'Typical use': 'Quit and dump core' },
        { aspect: 'SIGKILL', Signal: 'SIGKILL', Number: '9', Catchable: 'No', 'Typical use': 'Forced termination with no cleanup' },
        { aspect: 'SIGTERM', Signal: 'SIGTERM', Number: '15', Catchable: 'Yes', 'Typical use': 'Graceful shutdown request' },
        { aspect: 'SIGCHLD', Signal: 'SIGCHLD', Number: '17', Catchable: 'Yes', 'Typical use': 'A child process changed state' },
      ]},
      { type: 'text', heading: 'File Descriptors and Limits', content: 'On Linux almost everything is a file: sockets, pipes, and the standard streams are all file descriptors (FDs) — small integers indexing a per-process table. A busy server holds thousands of FDs: one per client connection, plus database connections, log files, and epoll handles.\n\nEvery process has a soft and a hard limit on open FDs, set by ulimit -n, often 1024 by default. A server that reaches 1024 concurrent connections starts failing accept() with EMFILE — the infamous too many open files error. Fixing it means raising the limit in the process systemd unit or container spec (LimitNOFILE or ulimits) and in the kernel, not just running ulimit in an interactive shell.' },
      { type: 'code', heading: 'Diagnosing Resource Limits', language: 'bash', label: 'diagnostics.sh', code: `ulimit -n                  # open file descriptor limit for this shell, often 1024
lsof -p 4521 | wc -l       # descriptors currently held by a process
ss -tunap                  # all TCP and UDP sockets with owning processes
cat /proc/4521/limits      # hard and soft limits the kernel enforces
sysctl net.core.somaxconn  # listen backlog the kernel allows
dmesg | tail               # kernel messages, including OOM killer activity` },
      { type: 'callout', calloutType: 'gold', heading: 'Graceful Shutdown Is a Signal Contract', content: 'A production service must treat SIGTERM as a deadline, not an instant stop. The correct sequence: stop accepting new connections, finish in-flight requests, close the listener, flush logs and metrics, then exit — all within the grace period, which Kubernetes defaults to 30 seconds. If the process ignores SIGTERM, the orchestrator escalates to SIGKILL after the grace period and everything in flight dies. Node services register a SIGTERM handler; Go services catch os.Interrupt and syscall.SIGTERM. Handling the signal correctly is the difference between a zero-downtime deploy and dropped requests.' },
      { type: 'text', heading: 'systemd and cgroups', content: 'Modern Linux services are managed by systemd, which supervises unit files, restarts failed processes, and enforces resource limits. systemd also places every service into a cgroup, the same isolation primitive Kubernetes uses for CPU and memory limits. systemctl status, journalctl -u payments, and systemd-analyze are the day-to-day tools.\n\nBecause cgroups enforce limits at the kernel level, a container with a memory limit is killed with an out-of-memory error when it exceeds it — visible in dmesg and as container exit code 137. Understanding cgroups explains why a service that ran fine on a laptop dies in a container: the limit changed, not the code.' },
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'Processes are isolated address spaces scheduled by the kernel; /proc, ps, lsof, ss, and strace expose them',
        'Signals are the OS messaging system — SIGTERM asks, SIGKILL forces, SIGHUP often reloads',
        'Handle SIGTERM to drain gracefully within the orchestrator grace period',
        'File descriptors are per-process handles for sockets, pipes, and files, bounded by ulimit',
        'EMFILE means the FD limit was hit — raise it in the service or container spec, not just a shell',
        'systemd manages services and cgroups enforce CPU and memory limits at the kernel level',
        'Exit code 137 means the process was killed, often by the OOM killer',
      ]},
    ],
    quiz: [
      { question: 'Which signal cannot be caught or ignored and terminates a process immediately?', options: ['SIGTERM', 'SIGINT', 'SIGKILL', 'SIGHUP'], correctIndex: 2, explanation: 'SIGKILL (9) is handled by the kernel itself and cannot be caught, blocked, or ignored. It terminates the process with no chance to clean up, which is why orchestrators send SIGTERM first and only escalate to SIGKILL after the grace period.' },
      { question: 'What does the EMFILE error indicate?', options: ['Out of memory', 'Too many open file descriptors', 'Permission denied on a file', 'The disk is full'], correctIndex: 1, explanation: 'EMFILE is returned when a process tries to open more file descriptors than its limit allows — commonly hit by servers with 1024 connections. Raising the soft and hard FD limits (LimitNOFILE) resolves it.' },
      { question: 'What should a service do on receiving SIGTERM?', options: ['Exit immediately without cleanup', 'Stop accepting new connections, drain in-flight requests, then exit', 'Ignore it and keep running', 'Reload its configuration'], correctIndex: 1, explanation: 'SIGTERM is a request for graceful shutdown. The service should stop taking new work, finish what is in flight, flush telemetry, and exit before the grace period expires — otherwise the orchestrator escalates to SIGKILL and drops requests.' },
    ]
  },

  'cloud-networking': {
    slug: 'cloud-networking',
    title: 'Cloud Networking',
    tagline: 'VPCs, subnets, security groups, and NAT',
    sections: [
      { type: 'text', heading: 'VPC Fundamentals', content: 'A Virtual Private Cloud (VPC) is an isolated private network inside a cloud provider, defined by a CIDR block such as 10.0.0.0/16. It is your own slice of the cloud network: resources inside can talk to each other, and you control precisely what can reach the internet and what the internet can reach.\n\nIn AWS a VPC spans all availability zones in a region, but each subnet is pinned to a single AZ. A three-tier VPC uses public subnets for load balancers and a private subnet per AZ for application servers and databases, with no direct inbound internet access to the private tier.' },
      { type: 'analogy', heading: 'The Gated Community', content: 'A VPC is a gated community. The perimeter wall (the VPC boundary) blocks outside traffic by default. Inside there are public areas — the lobby where visitors enter (public subnets with the internet gateway) — and private homes that only residents and approved guests reach (private subnets). A guard station checks who may enter each gate (security groups and network ACLs).\n\nA NAT gateway is the concierge who lets residents make outbound calls to the outside world without letting anyone call in. Nobody outside can dial a private home directly.' },
      { type: 'text', heading: 'Public vs Private Subnets', content: 'The only thing that makes a subnet public or private is its route table. A public subnet has a route 0.0.0.0/0 pointing to an internet gateway, so resources with public IPs are reachable from the internet. A private subnet routes 0.0.0.0/0 to a NAT gateway, which allows outbound traffic but no inbound connections.\n\nBest practice: expose only load balancers and bastion hosts in public subnets. Application servers, databases, caches, and queues live in private subnets and are reached through the load balancer or a VPN. This removes the entire class of attacks that begin with a directly reachable server.' },
      { type: 'comparison', heading: 'Security Groups vs Network ACLs', headers: ['Security Group', 'Network ACL'], rows: [
        { aspect: 'Applies to', 'Security Group': 'Elastic network interfaces (instances)', 'Network ACL': 'Subnets' },
        { aspect: 'Statefulness', 'Security Group': 'Stateful — return traffic is automatic', 'Network ACL': 'Stateless — both directions must be allowed' },
        { aspect: 'Rules', 'Security Group': 'Allow rules only', 'Network ACL': 'Allow and deny rules' },
        { aspect: 'Evaluation', 'Security Group': 'All rules evaluated together', 'Network ACL': 'Rules evaluated in number order, first match wins' },
        { aspect: 'Default behaviour', 'Security Group': 'Deny all inbound, allow all outbound', 'Network ACL': 'The default ACL allows all' },
        { aspect: 'Typical use', 'Security Group': 'Primary instance-level firewall', 'Network ACL': 'Coarse subnet-level guardrails' },
      ]},
      { type: 'code', heading: 'A Three-AZ VPC Layout', language: 'hcl', label: 'vpc.tf', code: `resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(aws_vpc.main.cidr_block, 4, count.index)
  availability_zone       = element(data.aws_availability_zones.available.names, count.index)
  map_public_ip_on_launch = true
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
}

resource "aws_nat_gateway" "nat" {
  count         = 3                          # one per AZ so a single AZ failure keeps egress alive
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  depends_on    = [aws_internet_gateway.igw]
}

resource "aws_route" "private_egress" {
  count                  = 3
  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat[count.index].id
}` },
      { type: 'steps', heading: 'How a Private Instance Reaches the Internet', steps: [
        { title: 'Private subnet route table', detail: 'The instance default route points 0.0.0.0/0 at a NAT gateway in the public subnet.' },
        { title: 'NAT gateway', detail: 'It translates the private source IP to its own Elastic IP and forwards the packet to the internet gateway.' },
        { title: 'Internet gateway', detail: 'The IGW provides the connection between the VPC and the internet, performing the final hop.' },
        { title: 'Return traffic', detail: 'Replies return to the NAT gateway, which maps them back to the private instance connection.' },
        { title: 'Inbound still blocked', detail: 'No route or rule allows the internet to initiate a connection to the private instance.' },
      ]},
      { type: 'callout', calloutType: 'warning', heading: 'NAT Gateways Cost Real Money', content: 'A NAT gateway bills both an hourly charge and a per-gigabyte data-processing fee, and the data charge is where bills explode — pulling container images, streaming logs, and large S3 transfers through NAT add up fast. Two mitigations: create a NAT gateway per AZ so a single AZ failure does not cut egress, accepting the extra hourly cost; and use VPC endpoints (PrivateLink gateway endpoints) for S3 and DynamoDB so that traffic never traverses the NAT gateway at all.' },
      { type: 'text', heading: 'Connecting VPCs', content: 'As you grow beyond one VPC, three mechanisms connect them. VPC peering is a direct, private, one-to-one link between two VPCs — simple and cheap but non-transitive, so ten fully meshed VPCs need 45 peering connections. AWS Transit Gateway is a hub that connects many VPCs and on-premises networks with a single attachment each, at the cost of a per-attachment hourly fee and data charges; it is the standard for larger organizations.\n\nPrivateLink exposes a specific service — an endpoint, not a whole network — to other VPCs or accounts over private IPs, so a SaaS provider can offer its API without sharing any network. It is how most cross-account service consumption works on AWS today.' },
      { type: 'callout', calloutType: 'gold', heading: 'Networking Is Where Most Cloud Breaches Start', content: 'Two misconfigurations cause a disproportionate share of cloud incidents: a database in a public subnet behind a permissive security group, and an object-storage bucket left publicly readable. Both are avoided by a default-deny posture — private subnets for data stores, security groups that reference other security groups rather than 0.0.0.0/0, and Block Public Access enabled on every bucket. Cloudflare, sitting in front of so many production applications, provides a global anycast edge, TLS termination, and DDoS absorption before traffic ever reaches your VPC, so your origin only accepts connections from the provider edge IPs.' },
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'A VPC is an isolated network defined by a CIDR block, subdivided into AZ-pinned subnets',
        'Route tables — not names — determine whether a subnet is public or private',
        'Security groups are stateful, instance-level, allow-only; NACLs are stateless and subnet-level',
        'NAT gateways give private resources outbound internet access without inbound exposure',
        'NAT data-processing charges are a common cost surprise; VPC endpoints bypass them for S3 and DynamoDB',
        'Peering is simple but non-transitive; Transit Gateway is the hub for many VPCs; PrivateLink exposes single services',
        'Default-deny and private subnets for data stores eliminate the most common cloud breaches',
      ]},
    ],
    quiz: [
      { question: 'What makes a subnet public?', options: ['Its name', 'A route table entry for 0.0.0.0/0 pointing to an internet gateway', 'A security group with port 80 open', 'Being in the default VPC'], correctIndex: 1, explanation: 'Public and private are defined entirely by routing. A subnet whose route table sends 0.0.0.0/0 to an internet gateway is public; one that sends it to a NAT gateway is private. Names are only labels.' },
      { question: 'Which is stateful and supports allow rules only?', options: ['Network ACL', 'Security group', 'Route table', 'NAT gateway'], correctIndex: 1, explanation: 'Security groups are stateful — return traffic is automatically permitted — and support only allow rules, relying on an implicit deny. Network ACLs are stateless and support both allow and deny rules per subnet.' },
      { question: 'What does a NAT gateway allow?', options: ['Inbound connections from the internet', 'Outbound internet access for private subnets without inbound exposure', 'Bidirectional traffic from anywhere', 'Direct database access from the internet'], correctIndex: 1, explanation: 'A NAT gateway lets resources in private subnets initiate outbound connections while blocking inbound connections. The internet can never open a connection to the private instance, only receive replies to connections it did not start.' },
    ]
  },

  'observability-alerting': {
    slug: 'observability-alerting',
    title: 'Alerting & Log Aggregation',
    tagline: 'Centralized logs and actionable alerts',
    sections: [
      { type: 'text', heading: 'Why Centralized Logging', content: 'Logs spread across dozens of instances are useless during an incident. When a request fails, you need to follow it across every service it touched, and grepping into a single container while a deploy replaces it is a losing game. Centralized logging ships logs off every node into a single queryable store.\n\nA request ID (correlation ID) is the thread that ties it all together: the edge generates it, every service logs it on every line, and you search by that ID to reconstruct the whole path. Without a correlation ID, distributed logs are just noise.' },
      { type: 'text', heading: 'Structured Logging and Levels', content: 'Logs should be machine-parseable events, not prose. Emit JSON with stable field names — timestamp, level, service, trace_id, message, and relevant context — so you can filter, aggregate, and alert on fields without brittle regex. Levels carry meaning: debug for development, info for normal operations, warn for recoverable problems, error for failed operations needing attention, fatal for process-ending failures.\n\nTwo rules keep logs useful: never log secrets, tokens, or full card numbers, because they end up in a shared store; and always include the trace and span IDs so a log line can be joined to a distributed trace.' },
      { type: 'code', heading: 'A Structured Log Line', language: 'json', label: 'structured-log.json', code: `{"timestamp":"2026-11-15T09:14:22.481Z","level":"error","service":"payments-api","trace_id":"4f1c9a2e8b7d6c10","span_id":"a1b2c3d4","user_id":88421,"http":{"method":"POST","path":"/v1/charges","status":502},"dependency":"stripe","error":"upstream timeout after 2000ms","duration_ms":2014}` },
      { type: 'text', heading: 'The Log Pipeline', content: 'The standard pipeline has four stages. Collectors — Fluent Bit or the OpenTelemetry Collector — run as a DaemonSet on every node and tail container logs. They ship and buffer to a backend. Loki or Elasticsearch stores and indexes. Grafana or Kibana queries it.\n\nLoki takes a different approach from Elasticsearch: it indexes only labels such as service, level, and namespace, and stores log bodies compressed, making it far cheaper for high-volume logs while pairing naturally with Prometheus and Grafana. Fluent Bit is written in C and uses roughly 10-20MB of memory per node, which is why it replaced the heavier Fluentd in many clusters.' },
      { type: 'comparison', heading: 'Log Backends', headers: ['Loki', 'Elasticsearch', 'CloudWatch Logs'], rows: [
        { aspect: 'Indexing model', Loki: 'Labels only; bodies compressed', Elasticsearch: 'Full-text inverted index', 'CloudWatch Logs': 'Managed, query-based' },
        { aspect: 'Cost profile', Loki: 'Low for high volume', Elasticsearch: 'Higher — index storage and nodes', 'CloudWatch Logs': 'Ingest, storage, and scan charges' },
        { aspect: 'Query language', Loki: 'LogQL', Elasticsearch: 'Lucene or KQL', 'CloudWatch Logs': 'CloudWatch Logs Insights' },
        { aspect: 'Best for', Loki: 'Kubernetes-native Grafana shops', Elasticsearch: 'Rich full-text search and analytics', 'CloudWatch Logs': 'All-AWS shops wanting no operations' },
      ]},
      { type: 'code', heading: 'An SLO Burn-Rate Alert', language: 'yaml', label: 'prometheus-rules.yaml', code: `groups:
  - name: slo-payments
    rules:
      - alert: PaymentsHighErrorBudgetBurn
        expr: |
          sum(rate(http_requests_total{service="payments",status=~"5.."}[5m]))
            / sum(rate(http_requests_total{service="payments"}[5m])) > 0.02
        for: 10m
        labels:
          severity: page
        annotations:
          summary: "Payments error rate above 2% for 10 minutes"
          runbook_url: "https://runbooks.acme.dev/payments-error-budget"` },
      { type: 'text', heading: 'Alert on Symptoms, Not Causes', content: 'A page should mean users are affected. Alerting on causes — high CPU, a single 5xx, disk at 70% — produces noise, because most of those conditions resolve themselves and none is a user-facing problem until it manifests. Alert on symptoms: elevated error rate, latency above the SLO, or an error budget burning too fast.\n\nSLO burn-rate alerting is the disciplined form of this. If the objective is 99.9% availability, page when the error budget is consumed at 14.4x the sustainable rate over 1 hour, which predicts exhaustion within days and leaves time to act. Pair a fast-burn page with a slow-burn ticket so slow leaks are caught without waking anyone at night.' },
      { type: 'callout', calloutType: 'warning', heading: 'Alert Fatigue Kills Reliability', content: 'If a team is paged ten times a night and nine alerts self-resolve, they will start ignoring the pager — and miss the real outage. Rule of thumb: every page must be urgent, actionable, and about real user impact. If an alert cannot be acted on, it belongs on a dashboard or a ticket, not on a pager. Google SRE guidance caps alert volume so that a team handles at most a couple of incidents per on-call shift. Cut noise aggressively; delete or downgrade any alert that does not change someone behaviour.' },
      { type: 'steps', heading: 'Writing an Actionable Alert', steps: [
        { title: 'Name the symptom, not the metric', detail: 'Prefer PaymentsErrorRateHigh over CPUAbove80.' },
        { title: 'Tie the threshold to an SLO', detail: 'Alert when the error budget burn rate crosses a defined level, not at an arbitrary number.' },
        { title: 'Add a for: duration', detail: 'Require the condition to persist before firing so transient blips do not page.' },
        { title: 'Attach a runbook link', detail: 'Every alert links to a document saying what to check and what to do.' },
        { title: 'Route by severity', detail: 'Page for fast-burn user impact, create a ticket for slow-burn conditions.' },
        { title: 'Record the outcome', detail: 'After each page, ask whether it was actionable; if not, fix or delete it.' },
      ]},
      { type: 'callout', calloutType: 'gold', heading: 'The Three Pillars, Connected', content: 'Metrics, logs, and traces solve different problems. Metrics with Prometheus are cheap, aggregated, and ideal for alerting and dashboards. Logs with Loki carry rich per-event detail for investigation. Traces with Jaeger or Tempo show the path a request took across services. Link them with a shared trace_id so an alert can jump to the offending trace, and the trace to its logs. Grafana unifies all three in one pane. The goal is answering what is broken, why, and where, in minutes rather than hours.' },
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'Centralized logging makes distributed incidents investigable; a correlation ID ties requests together',
        'Emit structured JSON with stable fields and never log secrets',
        'A standard pipeline is Fluent Bit or the OTel Collector into Loki or Elasticsearch, queried in Grafana',
        'Alert on user-facing symptoms and SLO burn rate, not raw resource causes',
        'Every page must be urgent and actionable with a runbook; cut alert noise aggressively',
        'Metrics, logs, and traces answer different questions — link them with trace_id',
        'Cap on-call load: if an alert does not change behaviour, delete or downgrade it',
      ]},
    ],
    quiz: [
      { question: 'What ties log lines from different services into one request?', options: ['The timestamp', 'A shared correlation or trace ID', 'The log level', 'The hostname'], correctIndex: 1, explanation: 'A correlation (trace) ID generated at the edge and logged by every service on every line lets you search one identifier and reconstruct the full path a request took across the distributed system.' },
      { question: 'Why should you alert on symptoms rather than causes?', options: ['Symptoms are easier to measure', 'Causes like high CPU often self-resolve and do not always affect users, creating noise', 'Symptom alerts are cheaper to run', 'Causes cannot be measured'], correctIndex: 1, explanation: 'Causes such as high CPU or a single 5xx frequently resolve on their own without user impact, so alerting on them produces noise and alert fatigue. Symptom-based alerts on error rate, latency, or SLO burn page you only when users are actually affected.' },
      { question: 'What does an SLO burn-rate alert detect?', options: ['Disk usage growth', 'How fast the error budget is being consumed relative to the SLO', 'The number of running pods', 'The size of log files'], correctIndex: 1, explanation: 'Burn rate measures how quickly you are spending your allowed error budget. A fast burn (for example 14.4x the sustainable rate over an hour) predicts imminent SLO breach and pages before users experience a prolonged outage.' },
    ]
  },

};

export default TOPIC_CONTENT_PART8;
