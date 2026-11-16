// Gap content: System Design case studies (part B1)
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_GAPS_SYS_B1: Record<string, TopicContent> = {
  "design-leaderboard": {
    slug: "design-leaderboard",
    title: "Design a Leaderboard",
    tagline: "Redis sorted sets, ranking, and time-windowed boards at scale",
    sections: [
      {
        type: "text",
        heading: "Defining the Problem",
        content:
          "Design the ranking system behind a game or app: players submit scores, and the service instantly answers three questions — a player's rank, the top-N entries, and the entries around a player on the board. The interviewer is not asking for a sorted array in memory; they are asking how you keep a global ranking correct and fresh for tens of millions of players who are all scoring at once.\n\nThe hard parts are ranking at scale (a full sort per read is impossible), breaking ties deterministically, and supporting time-windowed boards — daily, weekly, all-time — without scanning history on every request.",
      },
      {
        type: "text",
        heading: "Functional and Non-Functional Requirements",
        content:
          "**Functional:** submit a score for a player; keep only a player's best score per board; return a player's global rank; return the top-N entries; return a window of entries around a player (neighbours); support time-windowed boards (daily, weekly, all-time); roll up and expire boards on a schedule.\n\n**Non-functional:** reads must be very fast (p99 under 10ms) because they happen constantly; writes must be cheap and atomic under contention; ranking must be deterministic so equal scores have a stable, fair order; the system must scale to tens of millions of players per board; and it must survive hot boards where a single key is read and written millions of times a minute.",
      },
      {
        type: "analogy",
        heading: "The Stadium Scoreboard",
        content:
          "A stadium scoreboard shows the top scorers on a big board. When a player scores, an usher does not reprint the whole board; they update one line and the board re-sorts itself. Finding your rank is a glance at the order, and finding your neighbours is reading the lines just above and below you.\n\nA Redis **sorted set** is that self-sorting scoreboard: every player is a line, scores keep it ordered automatically, and the structure reports a rank in logarithmic time without ever sorting the whole board.",
      },
      {
        type: "text",
        heading: "Back-of-the-Envelope Estimation",
        content:
          "Assume 50 million daily players, each submitting about 10 score updates a day — 500 million writes daily, roughly 6,000 writes per second on average and several times that in peak evening hours. Reads (rank lookups, top-N, neighbours) happen even more often, on the order of 100 million a day.\n\nThe saving grace is that a board is bounded work: even with 50 million members, a sorted set answers a rank or top-N query in microseconds, and the entire board fits in memory in a few gigabytes. The design problem is throughput and time windows, not storage size.",
      },
      {
        type: "code",
        heading: "Sizing the Leaderboard",
        language: "typescript",
        label: "leaderboard-sizing.ts",
        code: `// Back-of-the-envelope sizing for a global leaderboard
const dau = 50_000_000;
const scoreUpdatesPerUserPerDay = 10;
const topNReadsPerDay = 100_000_000;

const dailyUpdates = dau * scoreUpdatesPerUserPerDay;   // 500M updates/day
const avgWriteRps = dailyUpdates / 86_400;               // ~5.8k/s
const peakWriteRps = avgWriteRps * 5;                    // ~29k/s at peak

// A sorted-set member holds the id plus an 8-byte double score and node overhead
const bytesPerMember = 56;
const memoryPerBoardGb = (dau * bytesPerMember) / 1e9;   // ~2.8 GB per board

console.log({ dailyUpdates, peakWriteRps, memoryPerBoardGb });`,
      },
      {
        type: "code",
        heading: "Leaderboard API",
        language: "http",
        label: "leaderboard-api.http",
        code: `POST /v1/leaderboards/global/scores HTTP/1.1
Host: api.example.com
Content-Type: application/json

{ "playerId": "p_9f3", "score": 4200 }

HTTP/1.1 200 OK
{ "playerId": "p_9f3", "best": 4200, "rank": 18342 }

GET /v1/leaderboards/global/top?limit=10 HTTP/1.1
HTTP/1.1 200 OK
{ "entries": [ { "rank": 1, "playerId": "p_42", "score": 99120 } ] }

GET /v1/leaderboards/global/players/p_9f3/neighbours?radius=5 HTTP/1.1
HTTP/1.1 200 OK
{ "rank": 18342, "entries": [ { "rank": 18340, "playerId": "p_11", "score": 4205 } ] }`,
      },
      {
        type: "text",
        heading: "High-Level Architecture",
        content:
          "The score service validates a submission, applies rate limiting and anti-cheat, and writes to the board store with a single atomic best-score update. The board store is a Redis cluster of sorted sets — one key per board (global, daily, weekly) — optionally sharded by player for the largest boards. A thin read path answers rank, top-N, and neighbour queries directly against those keys.\n\nTime windows are separate keys with a TTL, and a scheduled rollup job merges daily keys into weekly and all-time keys so the all-time board is never rebuilt from the full history on each request. The read path is one or two in-memory operations; the write path is one atomic update fanned out to the relevant windowed keys.",
      },
      {
        type: "comparison",
        heading: "Ranking Store Options",
        headers: ["Redis Sorted Set", "SQL ORDER BY", "In-Memory Heap"],
        rows: [
          {
            aspect: "Rank lookup",
            "Redis Sorted Set": "O(log n) via ZREVRANK",
            "SQL ORDER BY": "O(n) scan or a fragile rank index",
            "In-Memory Heap": "O(n) — a heap cannot rank arbitrary items",
          },
          {
            aspect: "Top-N query",
            "Redis Sorted Set": "ZREVRANGE, O(log n + N)",
            "SQL ORDER BY": "ORDER BY ... LIMIT pays a sort cost",
            "In-Memory Heap": "O(N log n) pops that mutate the heap",
          },
          {
            aspect: "Updating a score",
            "Redis Sorted Set": "ZADD in O(log n)",
            "SQL ORDER BY": "UPDATE plus index maintenance",
            "In-Memory Heap": "Re-heapify, and finding the item is hard",
          },
          {
            aspect: "Storage location",
            "Redis Sorted Set": "In memory, ~56 bytes per member",
            "SQL ORDER BY": "On disk with page I/O",
            "In-Memory Heap": "In memory, fixed size only",
          },
          {
            aspect: "Tie handling",
            "Redis Sorted Set": "Broken lexicographically by member",
            "SQL ORDER BY": "Define an explicit secondary ORDER BY",
            "In-Memory Heap": "No stable order guaranteed",
          },
          {
            aspect: "Best for",
            "Redis Sorted Set": "Real-time boards of any size",
            "SQL ORDER BY": "Low-traffic boards you already store relationally",
            "In-Memory Heap": "A tiny single-process top-K with no rank queries",
          },
        ],
      },
      {
        type: "code",
        heading: "Storing and Reading a Board",
        language: "typescript",
        label: "leaderboard-store.ts",
        code: `// ZADD with the GT flag updates only when the new score is higher
await redis.zadd("lb:global", "GT", score, playerId);

// Rank is 0-based; add 1 for a human-facing position
const rank = await redis.zrevrank("lb:global", playerId);

// Top-N and a window of neighbours around a player
const top = await redis.zrevrange("lb:global", 0, 9, "WITHSCORES");
const window = await redis.zrevrange("lb:global", Math.max(0, rank - 5), rank + 5, "WITHSCORES");

// Sorted-set ties are broken lexicographically by member, not by arrival time.
// Encode a zero-padded timestamp into the member for a stable, fair tiebreak.
const member = String(createdAtMs).padStart(13, "0") + ":" + playerId;
await redis.zadd("lb:global", score, member);`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Time Windows and the Hot Key",
        content:
          "Computing a weekly rank from the all-time board is wrong: an all-time score accumulates forever, so a player who was inactive this week still ranks high. Time windows must be their own keys, written on each submission, rolled up on a schedule, and expired with a TTL.\n\nAt extreme scale a single board key becomes a hot key and a memory bottleneck. Shard the board by player across N sorted sets, answer top-N by scatter-gather (fetch the top of each shard and merge), and keep a small precomputed global top-100 for the common case so the fan-out stays rare.",
      },
      {
        type: "steps",
        heading: "Submitting a Score End to End",
        steps: [
          { title: "Submit and validate", detail: "The score service rate-limits the submission and applies anti-cheat checks." },
          { title: "Atomic best-score write", detail: "ZADD with GT stores the new score only if it beats the player's existing best." },
          { title: "Fan out to windows", detail: "The same update lands in the daily, weekly, and all-time keys." },
          { title: "Serve reads", detail: "Rank, top-N, and neighbour queries hit the appropriate key directly." },
          { title: "Roll up", detail: "A scheduled job merges daily keys into weekly and all-time keys." },
          { title: "Expire", detail: "Old window keys drop away automatically via their TTL." },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "A Redis sorted set is the natural store: automatic ordering and O(log n) rank lookups",
          "Use ZADD with the GT flag so only a player's best score is kept",
          "Equal scores tie-break lexicographically by member; encode a timestamp for fair ordering",
          "Time-windowed boards are separate keys, rolled up on a schedule and expired with a TTL",
          "Shard the largest boards by player and merge the top of each shard for a global view",
          "Keep a precomputed hot top-N so the most common read never fans out",
        ],
      },
    ],
    quiz: [
      {
        question: "Which Redis data structure is the natural fit for a leaderboard?",
        options: ["A hash", "A sorted set", "A list", "A string"],
        correctIndex: 1,
        explanation:
          "A sorted set keeps members ordered by a numeric score and supports ZREVRANK for rank and ZREVRANGE for top-N, both in logarithmic or better time. A hash or list would require a full sort on every read.",
      },
      {
        question: "Why write scores with ZADD using the GT flag?",
        options: [
          "It makes the key expire automatically",
          "It stores the new score only if it is higher than the player's current best",
          "It sorts members lexicographically",
          "It shards the score across nodes",
        ],
        correctIndex: 1,
        explanation:
          "GT (greater-than) means the member is updated only when the incoming score exceeds the stored one, which is exactly the rule for a best-score leaderboard. Without it a lower score would overwrite a higher one.",
      },
      {
        question: "How should a weekly leaderboard be computed correctly?",
        options: [
          "Filter the all-time board by date on every read",
          "Maintain a separate weekly key written on each score, then roll it up and expire it",
          "Scan the event log for the last seven days on demand",
          "Recompute from the database each night",
        ],
        correctIndex: 1,
        explanation:
          "An all-time board accumulates scores and cannot be filtered by date. Each window needs its own key, updated as scores arrive, rolled into longer windows on a schedule, and expired so storage stays bounded.",
      },
      {
        question: "A board is sharded by player across 16 sorted sets. How do you answer a global top-10 request?",
        options: [
          "Query all 16 shards for their top 10 and merge the results",
          "Query the first shard only",
          "Load every shard fully into memory",
          "Disable sharding for that request",
        ],
        correctIndex: 0,
        explanation:
          "The global top-10 must come from the best entries of every shard, so you fetch the top 10 of each shard (scatter) and merge them by score (gather). A precomputed global top-N cache avoids this fan-out for the hottest reads.",
      },
    ],
  },

  "design-stock-exchange": {
    slug: "design-stock-exchange",
    title: "Design a Stock Exchange",
    tagline: "Order books, deterministic matching, and microsecond latency",
    sections: [
      {
        type: "text",
        heading: "Defining the Problem",
        content:
          "Design a stock exchange: clients submit buy and sell orders, an engine matches them by price and time priority, trades are published to market-data subscribers, and every participant observes the same sequence of events. The deliverable is not a CRUD service. A matching engine is a deterministic state machine that must produce identical results every time the same ordered stream of orders is applied.\n\nThe defining constraints are determinism, strict ordering, and latency measured in microseconds to low milliseconds, because the difference between being first or second at a price level decides real money.",
      },
      {
        type: "text",
        heading: "Functional and Non-Functional Requirements",
        content:
          "**Functional:** submit limit, market, IOC, and FOK orders; cancel and replace orders; maintain a per-symbol order book; match incoming orders against resting orders by price-time priority; publish trades and top-of-book quotes; run risk and self-trade checks; handle market open, close, and auctions.\n\n**Non-functional:** deterministic (the same input sequence yields byte-identical output, enabling replay and recovery); strictly ordered (one monotonic sequence number per event); ultra-low latency (single-digit microseconds inside the engine, sub-millisecond end to end); very high throughput (hundreds of thousands of messages per second); fault-tolerant, with hot standbys that replay the same journal; and fair, auditable price-time priority.",
      },
      {
        type: "analogy",
        heading: "The Auction Hall",
        content:
          "An exchange is a very fast, very disciplined auction hall. Buyers call out the highest price they will pay, sellers call out the lowest they will accept, and when the two cross a trade happens at the resting order's price. The clerk writes every bid and offer into a single ledger in the exact order they arrived, because that order is what makes the outcome fair and reproducible.\n\nThe order book is that ledger split into two columns — bids descending, asks ascending — with the earliest order at each price at the front of the queue. Price-time priority simply means: the best price wins, and among equal prices the earliest arrival wins.",
      },
      {
        type: "text",
        heading: "Back-of-the-Envelope Estimation",
        content:
          "A busy venue processes millions of messages a second in aggregate, but each individual symbol is matched by one engine. If a symbol peaks at 200,000 messages a second and each match is a handful of book operations, that is low millions of tiny in-memory operations per second — trivial for one CPU as long as nothing locks and nothing hits disk on the hot path.\n\nThe book for one symbol fits easily in memory: even 100,000 resting orders at about 100 bytes each is roughly 10 MB. Market-data fanout, not matching, is the scaling pressure — every book update must be delivered to thousands of subscribers.",
      },
      {
        type: "code",
        heading: "Sizing the Engine",
        language: "typescript",
        label: "exchange-sizing.ts",
        code: `// Sizing a matching engine and its market-data fanout
const messagesPerSecPerSymbol = 200_000;   // peak order flow for one symbol
const bookOpsPerMessage = 3;               // lookup, insert or pop, emit
const engineOpsPerSec = messagesPerSecPerSymbol * bookOpsPerMessage; // 600k

const restingOrders = 100_000;
const bytesPerOrder = 100;
const bookMb = (restingOrders * bytesPerOrder) / 1e6;                // ~10 MB

const mdSubscribers = 5_000;
const updatesPerSec = 50_000;
const mdMessagesPerSec = mdSubscribers * updatesPerSec;              // 250M/s fanout
console.log({ engineOpsPerSec, bookMb, mdMessagesPerSec });`,
      },
      {
        type: "code",
        heading: "Order and Market-Data API",
        language: "http",
        label: "exchange-api.http",
        code: `POST /v1/orders HTTP/1.1
Host: api.exchange.example.com
Content-Type: application/json

{ "clientId": "c_42", "symbol": "ACME", "side": "buy", "type": "limit", "priceTicks": 10125, "qty": 500, "tif": "DAY" }

HTTP/1.1 201 Created
{ "orderId": "o_7f2a", "seq": 918273645, "status": "accepted" }

POST /v1/orders/o_7f2a/cancel HTTP/1.1
Content-Type: application/json

HTTP/1.1 200 OK
{ "orderId": "o_7f2a", "status": "cancelled", "seq": 918273702 }

# Market-data push: top of book for one symbol
{ "symbol": "ACME", "seq": 918273702, "bids": [ [10124, 300] ], "asks": [ [10126, 800] ] }`,
      },
      {
        type: "text",
        heading: "High-Level Architecture",
        content:
          "Order flow is a pipeline with exactly one ordering point. A gateway authenticates the client and applies risk and self-trade checks. Accepted orders go to a sequencer that stamps each command with a monotonic sequence number and appends it to a journal (write-ahead log). The matching engine for a symbol consumes that ordered stream single-threaded and deterministically, mutating its in-memory order book and emitting trades and book deltas.\n\nBecause each symbol is owned by exactly one engine thread, there are no locks on the hot path and no cross-symbol interference; symbols run in parallel. The journal enables recovery: a standby engine replays the same commands and reaches an identical state. A market-data publisher turns book deltas into a multicast feed, and downstream services handle clearing and settlement.",
      },
      {
        type: "comparison",
        heading: "Matching Engine Concurrency Models",
        headers: ["Single-Threaded Per Symbol", "Shared Book with Locks", "Replicated Deterministic"],
        rows: [
          {
            aspect: "Determinism",
            "Single-Threaded Per Symbol": "Guaranteed by one ordered thread per book",
            "Shared Book with Locks": "Hard — lock interleavings vary run to run",
            "Replicated Deterministic": "Guaranteed by identical input order on every replica",
          },
          {
            aspect: "Latency",
            "Single-Threaded Per Symbol": "Very low, no lock contention",
            "Shared Book with Locks": "Spiky, driven by contention",
            "Replicated Deterministic": "Low, plus the replication hop",
          },
          {
            aspect: "Throughput",
            "Single-Threaded Per Symbol": "Bounded by one core per symbol",
            "Shared Book with Locks": "Higher in theory, unpredictable",
            "Replicated Deterministic": "Same as the primary, applied N times",
          },
          {
            aspect: "Complexity",
            "Single-Threaded Per Symbol": "Low and easy to reason about",
            "Shared Book with Locks": "High — deadlocks and ordering bugs",
            "Replicated Deterministic": "Medium — journaling, replay, fencing",
          },
          {
            aspect: "Failure recovery",
            "Single-Threaded Per Symbol": "Replay the journal",
            "Shared Book with Locks": "Hard to capture a consistent state",
            "Replicated Deterministic": "Standby is already warm and current",
          },
          {
            aspect: "Best for",
            "Single-Threaded Per Symbol": "Per-symbol books — the common real design",
            "Shared Book with Locks": "Rare; usually avoided for matching",
            "Replicated Deterministic": "High availability and full audit",
          },
        ],
      },
      {
        type: "code",
        heading: "The Matching Loop",
        language: "typescript",
        label: "matching-engine.ts",
        code: `type Side = "buy" | "sell";
interface Order { id: string; side: Side; priceTicks: number; qty: number; seq: number; }
interface Level { priceTicks: number; orders: Order[]; } // FIFO queue per price level
interface Trade { priceTicks: number; qty: number; maker: string; taker: string; }

// Price-time priority: the best price first, then the earliest sequence at that level.
function match(taker: Order, book: Book): Trade[] {
  const trades: Trade[] = [];
  while (taker.qty > 0) {
    const level = taker.side === "buy" ? book.bestAsk() : book.bestBid();
    if (!level) break;

    const crosses = taker.side === "buy"
      ? taker.priceTicks >= level.priceTicks
      : taker.priceTicks <= level.priceTicks;
    if (!crosses) break;

    const maker = level.orders[0];                    // front of the FIFO queue
    const fill = Math.min(taker.qty, maker.qty);
    taker.qty -= fill;
    maker.qty -= fill;
    trades.push({ priceTicks: level.priceTicks, qty: fill, maker: maker.id, taker: taker.id });

    if (maker.qty === 0) level.orders.shift();
    if (level.orders.length === 0) {
      book.removeLevel(taker.side === "buy" ? "ask" : "bid", level.priceTicks);
    }
  }
  return trades;
}`,
      },
      {
        type: "code",
        heading: "Sequencing for Determinism and Replay",
        language: "typescript",
        label: "sequencing.ts",
        code: `// One sequencer, one journal, one deterministic consumer.
const cmd = journal.append({ type: "newOrder", order });  // monotonic seq, fsync'd
const trades = engine.apply(cmd);                          // pure: no clock, no RNG, no I/O

// Recovery works because the engine is a pure function of an ordered stream:
// replay the journal from the start on a standby and reach byte-identical state.
// Floating-point prices, wall-clock time, and hash-map iteration order would
// each break this guarantee, which is why prices are integer ticks and every
// timestamp is attached upstream, before sequencing.`,
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Determinism Is the Whole Game",
        content:
          "The single easiest way to break an exchange is to introduce nondeterminism into the matching engine. Using wall-clock time, random identifiers, floating-point prices, or an unordered hash-map iteration inside the engine means a replayed journal can produce a different state than the live run, and recovery silently diverges from reality.\n\nKeep the engine a pure function of an ordered command stream: integer tick prices, sequence numbers assigned upstream, no I/O on the hot path, and a defined iteration order. Everything volatile — timestamps, client identifiers — is attached before sequencing, never inside the engine.",
      },
      {
        type: "steps",
        heading: "Order Lifecycle",
        steps: [
          { title: "Gateway checks", detail: "The gateway authenticates the client and runs risk and self-trade checks." },
          { title: "Sequence", detail: "A sequencer assigns a monotonic sequence number to the command." },
          { title: "Journal", detail: "The command is appended to the write-ahead log — the durability point." },
          { title: "Match", detail: "The single-threaded engine applies the command deterministically to the book." },
          { title: "Emit", detail: "Trades and book deltas are produced as output of the match." },
          { title: "Publish and replicate", detail: "Market data is multicast and the journal is shipped to warm standbys." },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "A matching engine is a deterministic state machine; the same ordered input must always yield the same state",
          "One thread per symbol removes locks and gives clean, fair price-time priority",
          "Price-time priority means best price first, then earliest arrival within a price level",
          "Sequence and journal every command before matching so recovery replays exactly",
          "Use integer tick prices; floating point and wall-clock time silently break replay",
          "Market-data fanout, not matching, is usually the scaling bottleneck",
        ],
      },
    ],
    quiz: [
      {
        question: "Why is a single thread per symbol the standard matching-engine design?",
        options: [
          "It uses less memory",
          "It gives determinism and removes lock contention on the hot path",
          "It allows floating-point prices",
          "It avoids the need for a journal",
        ],
        correctIndex: 1,
        explanation:
          "One thread owning a symbol's book applies commands in a strict order with no locks, so results are deterministic and latency is predictable. Different symbols run on different threads and match in parallel.",
      },
      {
        question: "How is price-time priority implemented in the order book?",
        options: [
          "A single queue ordered by arrival across all prices",
          "Price levels kept in sorted order, with a FIFO queue of orders within each level",
          "A random shuffle that guarantees fairness",
          "Sorting all resting orders on every incoming order",
        ],
        correctIndex: 1,
        explanation:
          "Price levels are held in a sorted structure (best bid and best ask at the ends), and orders at the same price sit in a first-in-first-out queue. Matching takes the best price and, within it, the earliest order.",
      },
      {
        question: "Why are prices represented as integer ticks rather than floating-point numbers?",
        options: [
          "Integers sort more slowly",
          "Floating-point arithmetic is not deterministic across runs, which breaks replay",
          "Integers allow more decimal places",
          "Floats cannot be stored in memory",
        ],
        correctIndex: 1,
        explanation:
          "Floating-point operations can produce subtly different results across platforms and orderings, so a replayed journal might diverge from the live state. Integer ticks make arithmetic exact and reproducible.",
      },
      {
        question: "What is the role of the sequencer in the order pipeline?",
        options: [
          "It charges the trading fee",
          "It assigns a monotonic sequence number and orders commands so the journal can be replayed exactly",
          "It publishes market data to subscribers",
          "It stores the order book on disk",
        ],
        correctIndex: 1,
        explanation:
          "The sequencer is the single ordering point: it stamps every command with a monotonic sequence number before the engine sees it. That total order is what makes deterministic replay and warm-standby recovery possible.",
      },
    ],
  },

  "design-ride-sharing": {
    slug: "design-ride-sharing",
    title: "Design a Ride-Sharing Service",
    tagline: "Geospatial matching, dispatch, and the trip state machine",
    sections: [
      {
        type: "text",
        heading: "Defining the Problem",
        content:
          "Design a ride-hailing service like Uber or Lyft: a rider requests a trip from pickup to dropoff, the system finds nearby available drivers, dispatches one that accepts, and tracks the trip through its lifecycle while streaming live locations to the rider. The visible product is a map with a moving car. The invisible product is a real-time geospatial matching and dispatch engine handling an enormous stream of location updates.\n\nThe hard parts are matching riders to the right driver by ETA rather than straight-line distance, absorbing a firehose of driver location pings, and keeping a trip's state consistent across the rider app, the driver app, and the dispatch service.",
      },
      {
        type: "text",
        heading: "Functional and Non-Functional Requirements",
        content:
          "**Functional:** request a trip with pickup and dropoff; match and dispatch a nearby driver; let the driver accept or decline; track the trip through states from requested to completed or cancelled; stream live location to the rider; estimate fare and ETA; support cancellation and rating.\n\n**Non-functional:** dispatch within a few seconds; handle very high write throughput from driver pings (every few seconds per active driver); low-latency geospatial queries; strong consistency of trip state so a trip is never double-assigned; high availability; and graceful behavior under supply-demand imbalance.",
      },
      {
        type: "analogy",
        heading: "The Taxi-Rank Dispatcher",
        content:
          "A taxi rank has a dispatcher who can see every cab waiting nearby. When a fare arrives, the dispatcher does not pick the cab that happens to be closest as the crow flies; they pick the one that can actually reach the fare soonest, given the roads. As cabs drive around, they radio their position so the dispatcher's picture stays current.\n\nGeospatial matching is that dispatcher. A geographic index answers who is nearby in milliseconds, ETA ranking decides who is truly best, and a steady stream of location updates keeps the map honest.",
      },
      {
        type: "text",
        heading: "Back-of-the-Envelope Estimation",
        content:
          "Assume 1 million active drivers sending a location ping every 4 seconds — 250,000 writes per second, just for locations. Handling that means the locational index lives in memory and is updated in place; writing every ping to a relational database is out of the question.\n\nTrips are far rarer: 10 million trips a day is about 115 per second, with sharp peaks. The design is therefore extremely write-heavy and read-light on locations, yet every trip must still be matched quickly and consistently.",
      },
      {
        type: "code",
        heading: "Sizing the Location Firehose",
        language: "typescript",
        label: "ride-sizing.ts",
        code: `// Sizing the location firehose and dispatch load
const activeDrivers = 1_000_000;
const pingIntervalSec = 4;
const locationWritesPerSec = activeDrivers / pingIntervalSec;   // 250k/s

const tripsPerDay = 10_000_000;
const tripsPerSec = tripsPerDay / 86_400;                        // ~116/s average
const peakTripsPerSec = tripsPerSec * 5;                         // ~580/s at peak

// Driver -> last known location, kept in memory, not in the database
const locBytes = 64;
const driverIndexGb = (activeDrivers * locBytes) / 1e9;          // ~0.06 GB
console.log({ locationWritesPerSec, peakTripsPerSec, driverIndexGb });`,
      },
      {
        type: "code",
        heading: "Trip and Location API",
        language: "http",
        label: "ride-api.http",
        code: `POST /v1/trips HTTP/1.1
Host: api.example.com
Idempotency-Key: 3b1f0c6e-7a2d-4b1e-9c40-2f6a1d8e5b70
Content-Type: application/json

{ "riderId": "r_42", "pickup": { "lat": 6.5244, "lng": 3.3792 }, "dropoff": { "lat": 6.6018, "lng": 3.3515 } }

HTTP/1.1 201 Created
{ "tripId": "t_9f3", "status": "requested", "fareEstimateCents": 1850 }

# Driver app streams its location every few seconds
POST /v1/drivers/d_7/location HTTP/1.1
Content-Type: application/json

{ "lat": 6.5250, "lng": 3.3801, "heading": 90, "ts": 1763212800000 }

HTTP/1.1 204 No Content`,
      },
      {
        type: "text",
        heading: "High-Level Architecture",
        content:
          "Driver locations flow into a location service that updates an in-memory geospatial index (geohash, quadtree, or H3 cells) and asynchronously persists only recent history. A trip request goes to the dispatch service, which runs a geospatial query for nearby available drivers, ranks candidates by ETA, and offers the trip to the best one with an accept timeout, widening the search radius if nobody accepts.\n\nThe trip service owns the trip state machine and writes it durably with a compare-and-set so a trip is never assigned to two drivers. Rider and driver apps subscribe to a streaming channel (websocket) for live location and status updates. ETA comes from a routing service backed by road-graph data, not straight-line distance.",
      },
      {
        type: "comparison",
        heading: "Geospatial Indexing Approaches",
        headers: ["Geohash / Redis GEO", "Quadtree", "H3 Hexagons"],
        rows: [
          {
            aspect: "Cell shape",
            "Geohash / Redis GEO": "Rectangular cells at mixed sizes",
            "Quadtree": "Adaptive squares that subdivide with density",
            "H3 Hexagons": "Hexagons with uniform area",
          },
          {
            aspect: "Neighbour query",
            "Geohash / Redis GEO": "Prefix neighbours; edges need care",
            "Quadtree": "Walk up and down the tree",
            "H3 Hexagons": "k-ring neighbours, always six or more",
          },
          {
            aspect: "Boundary problem",
            "Geohash / Redis GEO": "Points a metre apart can hash fully apart",
            "Quadtree": "Handled by tree descent",
            "H3 Hexagons": "Lower distortion and cleaner adjacency",
          },
          {
            aspect: "Updates",
            "Geohash / Redis GEO": "Cheap — recompute the cell string",
            "Quadtree": "Rebalances as density shifts",
            "H3 Hexagons": "Cheap — recompute the cell id",
          },
          {
            aspect: "Off-the-shelf support",
            "Geohash / Redis GEO": "Redis GEO commands built in",
            "Quadtree": "Build it or use a library",
            "H3 Hexagons": "Library; Uber's production choice",
          },
          {
            aspect: "Best for",
            "Geohash / Redis GEO": "Simple radius search over a key-value store",
            "Quadtree": "Skewed densities in a single process",
            "H3 Hexagons": "Uniform coverage and supply-demand analysis",
          },
        ],
      },
      {
        type: "code",
        heading: "Nearby-Driver Matching by ETA",
        language: "typescript",
        label: "dispatch.ts",
        code: `// 1. Geo query: find candidate drivers near the pickup using a cell index.
const cell = h3.latLngToCell(pickup.lat, pickup.lng, 9); // ~0.1 km^2 cells
const nearby = await geoIndex.neighbours(cell, /* rings */ 2);

// 2. Filter to available drivers and rank by road ETA, not straight-line distance.
const candidates = nearby
  .filter((d) => d.status === "available")
  .map((d) => ({ driverId: d.id, etaSec: roadEta(pickup, d.location) }))
  .sort((a, b) => a.etaSec - b.etaSec)
  .slice(0, 5);

// 3. Offer to the best driver with an accept timeout; widen the ring on decline.
await dispatch.offer(tripId, candidates[0].driverId, { timeoutMs: 15_000 });`,
      },
      {
        type: "code",
        heading: "The Trip State Machine",
        language: "typescript",
        label: "trip-state.ts",
        code: `type TripState =
  | "requested"
  | "matched"
  | "driver_arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

// Every legal transition is declared explicitly; anything else is rejected.
const allowed: Record<TripState, TripState[]> = {
  requested: ["matched", "cancelled"],
  matched: ["driver_arrived", "cancelled"],
  driver_arrived: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
};

function transition(from: TripState, to: TripState): TripState {
  if (!allowed[from].includes(to)) {
    throw new Error("illegal trip transition: " + from + " -> " + to);
  }
  return to;
}`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "ETA Beats Distance, and Pings Are Not Trips",
        content:
          "The classic mistake is to treat nearest-driver-by-distance as correct. In a city, the geometrically closest driver may be across a river or stuck in traffic; only ETA ranking reflects real pickup time. Matching must rank by road ETA and can also weigh the driver's heading and accept rate.\n\nEqually, never write every location ping to a durable database. Drivers ping every few seconds, so that firehose belongs in an in-memory geospatial index with only lightweight, asynchronous persistence. The durable store holds trips and their state, not the constant churn of positions.",
      },
      {
        type: "steps",
        heading: "Trip Lifecycle",
        steps: [
          { title: "Requested", detail: "The rider submits pickup and dropoff; a durable trip record is created." },
          { title: "Matching", detail: "Dispatch queries the geo index, ranks candidates by ETA, and offers to the best driver." },
          { title: "Matched", detail: "A driver accepts and the trip is assigned with a compare-and-set so it cannot be double-assigned." },
          { title: "Driver arrived", detail: "The driver reaches the pickup point." },
          { title: "In progress", detail: "The trip starts and locations stream to the rider over a websocket." },
          { title: "Completed or cancelled", detail: "The trip ends, the fare is charged, and the driver returns to the available pool." },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Match by ETA from road data, not straight-line distance",
          "Keep driver locations in an in-memory geospatial index; never write every ping to a database",
          "A geographic index — geohash, quadtree, or H3 — answers nearby queries in milliseconds",
          "Dispatch offers to the best driver with a timeout and widens the radius on a decline",
          "Model the trip as an explicit state machine and assign it with a compare-and-set to avoid double assignment",
          "Stream live location and status to clients over websockets rather than polling",
        ],
      },
    ],
    quiz: [
      {
        question: "Why should dispatch rank candidate drivers by ETA instead of straight-line distance?",
        options: [
          "ETA is cheaper to compute",
          "The road network means the closest driver may not be the fastest to reach the pickup",
          "Distance is not available from the geo index",
          "ETA uses less memory",
        ],
        correctIndex: 1,
        explanation:
          "Straight-line distance ignores rivers, highways, and traffic. Two drivers at the same great-circle distance can have very different real pickup times, so only road-network ETA reflects who should get the trip.",
      },
      {
        question: "How should 250,000 driver location writes per second be handled?",
        options: [
          "Write each ping to a relational database",
          "Update an in-memory geospatial index and persist only recent history asynchronously",
          "Batch pings into a nightly job",
          "Store pings in the trip record",
        ],
        correctIndex: 1,
        explanation:
          "At that rate a database write per ping is infeasible. Locations live in an in-memory index that is updated in place for fast queries, with only lightweight, asynchronous persistence of recent history.",
      },
      {
        question: "What prevents a trip from being assigned to two drivers at once?",
        options: [
          "A long polling interval",
          "Assigning the trip with an atomic compare-and-set on the trip record",
          "Storing the trip only in memory",
          "Sending the offer to all drivers simultaneously",
        ],
        correctIndex: 1,
        explanation:
          "Concurrent offers could otherwise each succeed. The trip service transitions the trip state atomically (a compare-and-set), so exactly one offer wins and the others are rejected — no double assignment.",
      },
      {
        question: "Which indexing approach uses uniform-area hexagonal cells and is a common production choice for ride-hailing?",
        options: ["Geohash", "Quadtree", "H3", "Z-order curve"],
        correctIndex: 2,
        explanation:
          "H3 tiles the globe in hexagons of uniform area, which makes neighbour queries and supply-demand analysis cleaner than rectangular geohash cells or density-dependent quadtrees. Uber developed and uses it in production.",
      },
    ],
  },
};
