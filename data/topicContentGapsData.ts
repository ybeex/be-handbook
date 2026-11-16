// Gap content: Databases — storage models and data operations
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_GAPS_DATA: Record<string, TopicContent> = {
  // ─── GRAPH DATABASES ────────────────────────────────────────────────────

  "graph-databases": {
    slug: "graph-databases",
    title: "Graph Databases",
    tagline: "Modeling connected data as nodes and edges, not joins",
    sections: [
      {
        type: "text",
        heading: "What Makes a Graph Database Different",
        content:
          "A graph database stores two things and one thing only: **nodes** (also called vertices) and **edges** (relationships) between them, both of which can carry properties. The engine treats the connection as a first-class citizen, not as a value you reconstruct at query time.\n\nThat single design decision changes everything. In a relational database a relationship is a foreign key baked into a row; to traverse it you join. In a graph database an edge is a stored pointer, so following it is a memory dereference rather than an index lookup. For deeply connected data — fraud rings, social graphs, recommendations, dependency trees — that difference decides whether a query answers in milliseconds or melts the cluster.",
      },
      {
        type: "analogy",
        heading: "Six Degrees at a Dinner Party",
        content:
          "Picture finding out how two guests at a large dinner party know each other. If you had a spreadsheet of every friendship, you would hunt row by row: find person A, check each of A's friends, then each of their friends, expanding outward — a join for every hop.\n\nA graph database is the party itself. Each guest simply points at the friends they came with. Asking who is connected to whom, and through whom, means walking those pointed fingers between people — three hops is three steps whether the room holds fifty guests or fifty million.",
      },
      {
        type: "text",
        heading: "Labeled Property Graph vs RDF",
        content:
          "Two families dominate. The **labeled property graph** (Neo4j, Memgraph, Amazon Neptune) gives every node and edge a label such as Person or BOUGHT plus a bag of key-value properties, and is queried with Cypher or Gremlin using ASCII-art patterns like (a)-[:FOLLOWS]->(b).\n\nThe **RDF triples** model (Apache Jena, AllegroGraph, some Neptune workloads) represents everything as subject-predicate-object statements queried with SPARQL. RDF shines when you need formal, schema-flexible ontologies and standardized inference. Property graphs are more ergonomic for application developers and usually faster for straightforward traversal.",
      },
      {
        type: "code",
        heading: "A Variable-Depth Traversal in Cypher",
        language: "plaintext",
        label: "fof.cypher",
        code: `// Friends-of-friends that Ada does not already follow,
// ranked by how many mutual friends they share.
// The hop depth lives in the pattern, not in the query shape.
MATCH (ada:Person {name: 'Ada'})-[:FOLLOWS]->(friend)-[:FOLLOWS]->(candidate)
WHERE NOT (ada)-[:FOLLOWS]->(candidate)
  AND candidate <> ada
RETURN candidate.name AS suggestion, count(friend) AS mutual
ORDER BY mutual DESC
LIMIT 10;`,
      },
      {
        type: "code",
        heading: "The Same Question in a Relational Store",
        language: "sql",
        label: "fof.sql",
        code: `-- A recursive CTE encodes the hop count directly into the SQL.
-- Raising the depth means editing the query; the data never changes shape.
WITH RECURSIVE fof AS (
  SELECT followee_id AS person_id, 1 AS hops
  FROM follows
  WHERE follower_id = :ada
  UNION ALL
  SELECT f.followee_id, fof.hops + 1
  FROM fof
  JOIN follows f ON f.follower_id = fof.person_id
  WHERE fof.hops < 2
)
SELECT person_id, count(*) AS mutual
FROM fof
WHERE hops = 2
  AND person_id NOT IN (
    SELECT followee_id FROM follows WHERE follower_id = :ada
  )
GROUP BY person_id
ORDER BY mutual DESC
LIMIT 10;`,
      },
      {
        type: "text",
        heading: "Index-Free Adjacency",
        content:
          "The phrase **index-free adjacency** describes the core performance property: each node stores direct references to its adjacent edges, so the cost of moving across an edge is proportional to the number of edges attached to that node, not to the total number of nodes in the database.\n\nIn a relational engine every join hop must consult an index or scan a table, and cost grows with table size. In a graph engine the traversal cost grows only with the size of the local neighbourhood. This is why a five-hop query that is instant on ten thousand nodes is still instant on ten million; the engine never looks at data it is not walking.",
      },
      {
        type: "comparison",
        heading: "Relational vs Graph",
        headers: ["Relational (SQL)", "Graph"],
        rows: [
          {
            aspect: "Data model",
            "Relational (SQL)": "Tables, rows, foreign keys",
            Graph: "Nodes, edges, properties",
          },
          {
            aspect: "Traversal cost",
            "Relational (SQL)": "Grows with table size per join",
            Graph: "Grows with neighbourhood size per hop",
          },
          {
            aspect: "Query language",
            "Relational (SQL)": "SQL",
            Graph: "Cypher, Gremlin, or SPARQL",
          },
          {
            aspect: "Best at",
            "Relational (SQL)": "Set operations, aggregates, reporting",
            Graph: "Deep, variable-depth relationships",
          },
          {
            aspect: "Schema",
            "Relational (SQL)": "Rigid, declared up front",
            Graph: "Flexible labels and properties",
          },
          {
            aspect: "Failure mode",
            "Relational (SQL)": "Deep joins explode in cost",
            Graph: "Supernodes and unbounded traversals",
          },
        ],
      },
      {
        type: "text",
        heading: "The Supernode Problem",
        content:
          "A **supernode** is a node with an enormous number of edges — a celebrity account followed by fifty million people, or a country node connected to every address. Traversing into a supernode forces the engine to enumerate a huge adjacency list, so a step that is O(1) for an ordinary node becomes a scan of millions of edges.\n\nThe classic symptom is one slow query that ruins p99 latency for everyone. Mitigations include filtering edges by type or property early, splitting popular nodes into buckets, capping traversal breadth with LIMIT and timeouts, or maintaining precomputed frontiers. Design your labels and edge types so that hot nodes never sit on the critical traversal path.",
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Graphs Are a Specialised Tool",
        content:
          "A graph database is not a general-purpose replacement for a relational store. It lacks the mature transactional guarantees, ad-hoc aggregation, and reporting ecosystem that SQL provides, and analytical scans over the entire graph are usually slower than a columnar warehouse. Choose a graph engine when relationship traversal is the dominant, repeated access pattern — not merely because the data happens to contain foreign keys, which is true of almost every dataset.",
      },
      {
        type: "steps",
        heading: "When to Reach for a Graph",
        steps: [
          {
            title: "Check the query shape",
            detail:
              "If the hard questions are how X is connected to Y with variable depth, a graph is a candidate.",
          },
          {
            title: "Measure hop counts",
            detail:
              "Traversals of three or more recurring hops are where relational joins start to hurt.",
          },
          {
            title: "Watch schema churn",
            detail:
              "If relationship types change often, a schema-flexible model saves migrations.",
          },
          {
            title: "Estimate supernodes",
            detail:
              "Identify high-degree entities up front; if the critical path crosses one, plan partitioning.",
          },
          {
            title: "Validate with the real workload",
            detail:
              "Prototype the top five queries and compare latency and cost against your existing store.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Graphs store relationships as first-class pointers, not reconstructable foreign keys",
          "Index-free adjacency makes traversal cost depend on neighbourhood size, not total data size",
          "Labeled property graphs (Cypher) are developer-friendly; RDF/SPARQL fits formal ontologies",
          "Relational stores can traverse, but join cost grows with table size and hard-coded hop count",
          "Supernodes are the top performance hazard — filter edges, cap breadth, or partition hot nodes",
          "Reach for a graph only when deep, repeated traversal is the core access pattern",
        ],
      },
    ],
    quiz: [
      {
        question: "What does 'index-free adjacency' mean in a graph database?",
        options: [
          "Edges are stored as direct references on nodes, so hop cost is independent of total data size",
          "The database maintains no indexes of any kind",
          "Queries never touch disk",
          "Nodes are located only through a single global hash table",
        ],
        correctIndex: 0,
        explanation:
          "Index-free adjacency means each node holds direct pointers to its adjacent edges, so crossing an edge costs the size of that node's neighbourhood rather than the size of the whole database. Global indexes still exist to locate the starting node.",
      },
      {
        question:
          "Which performance hazard is characteristic of graph traversal at scale?",
        options: [
          "Foreign key violations during writes",
          "Supernodes with millions of edges",
          "Cross-shard joins in SQL",
          "Slow UPDATE statements on wide tables",
        ],
        correctIndex: 1,
        explanation:
          "A supernode — a node with an enormous degree such as a celebrity account — forces the engine to enumerate a huge adjacency list, turning an O(1) step into a scan of millions of edges. It is the most common cause of graph query latency spikes.",
      },
      {
        question:
          "The hardest analytical question a team asks is total revenue per region last quarter. Should they adopt a graph database?",
        options: [
          "Yes, graph databases are always faster",
          "Yes, because regions are connected to each other",
          "No, that is a set aggregation better served by a relational or columnar store",
          "No, graph databases cannot store numeric values",
        ],
        correctIndex: 2,
        explanation:
          "That query is a scan and aggregation, not a traversal. Graph engines are optimised for following relationships at variable depth; large scans and aggregates are typically faster in a relational or columnar warehouse.",
      },
      {
        question:
          "Which statement best distinguishes the RDF model from a labeled property graph?",
        options: [
          "RDF models data as subject-predicate-object triples queried with SPARQL",
          "RDF has no concept of edges",
          "Property graphs cannot attach properties to relationships",
          "RDF can represent only attributes, never relationships",
        ],
        correctIndex: 0,
        explanation:
          "RDF represents everything as triples (subject, predicate, object) and is queried with SPARQL, favouring formal ontologies and inference. A labeled property graph attaches labels and key-value properties to nodes and edges and is usually queried with Cypher or Gremlin.",
      },
    ],
  },

  // ─── WIDE-COLUMN STORES ─────────────────────────────────────────────────

  "wide-column-stores": {
    slug: "wide-column-stores",
    title: "Wide-Column Stores",
    tagline: "Query-first tables built on partition keys for massive scale",
    sections: [
      {
        type: "text",
        heading: "Rows Are Sorted Maps",
        content:
          "A wide-column store — Apache Cassandra, ScyllaDB, HBase, Google Bigtable, and the Bigtable-style backends behind many managed services — organises data differently from a relational engine. Each row is a sorted map of columns, and rows are distributed across many nodes by a **partition key**.\n\nThe table defines the key structure and the typed columns, but the engine is built for enormous write throughput and linear horizontal scaling rather than for ad-hoc querying. That is why wide-column stores power time-series, messaging, activity feeds, and IoT ingestion, where the access patterns are known in advance and the write volume is relentless.",
      },
      {
        type: "analogy",
        heading: "The Regional Phone Book",
        content:
          "Imagine a national phone book that is not sorted by surname but by district. Each district's pages live in its own office; within a district, entries are sorted by street and then by house number. To find someone you must know the district first — you never scan the whole country.\n\nA wide-column store works this way. The partition key is the district and decides which machine holds the data; the clustering columns are the street and house number and decide the ordering within that machine. Ask for a district and the query hits exactly one office. Ask for a person with no district and the system must ask every office — slow, and strongly discouraged.",
      },
      {
        type: "text",
        heading: "Partition Key and Clustering Columns",
        content:
          "The **partition key** determines placement: a hash of it selects the node, and its replica set, that owns the data. The **clustering columns** determine the sort order of rows within a partition, and together they form the primary key.\n\nBecause the partition key selects which node answers, a query that omits it must fan out to every node — an anti-pattern the engine may technically allow but will punish with latency and timeouts. A well-chosen partition key spreads data evenly and keeps each partition small; a poorly chosen one creates **hot partitions** that concentrate load on a single node.",
      },
      {
        type: "code",
        heading: "A Table Shaped for One Query",
        language: "plaintext",
        label: "messages.cql",
        code: `-- Partition by conversation (bucketed by day for wide threads),
-- cluster by time descending so reads come back pre-sorted.
CREATE TABLE messages (
  conversation_id uuid,
  bucket          date,
  message_id      timeuuid,
  sender_id       uuid,
  body            text,
  PRIMARY KEY ((conversation_id, bucket), message_id)
) WITH CLUSTERING ORDER BY (message_id DESC)
  AND default_time_to_live = 7776000;   -- 90 days, in seconds

-- Efficient: partition key fully specified, results already ordered.
SELECT sender_id, body
FROM messages
WHERE conversation_id = :conversation AND bucket = :day
LIMIT 50;`,
      },
      {
        type: "text",
        heading: "The Query-First Data Model",
        content:
          "Relational modeling starts from entities and normalizes; wide-column modeling starts from queries and denormalizes. You ask: what is the read pattern, in what order, and how will I identify the partition? Then you build a table shaped exactly for that query.\n\nThe same fact is often duplicated across several tables, each keyed for a different access path — for instance one table keyed by user for the list of messages and another keyed by conversation for the thread view. There are no joins, so the application or a shared write path keeps the copies consistent. Storage is treated as cheap; the goal is that every read is a single-partition lookup.",
      },
      {
        type: "comparison",
        heading: "Wide-Column vs Relational",
        headers: ["Wide-Column", "Relational"],
        rows: [
          {
            aspect: "Primary key",
            "Wide-Column": "Partition key plus clustering columns",
            Relational: "Any unique column(s), plus indexes",
          },
          {
            aspect: "Query pattern",
            "Wide-Column": "Single-partition lookups, pre-sorted",
            Relational: "Ad-hoc joins and filters",
          },
          {
            aspect: "Joins",
            "Wide-Column": "Not supported; denormalize instead",
            Relational: "First-class and mature",
          },
          {
            aspect: "Scaling",
            "Wide-Column": "Linear; add nodes for throughput",
            Relational: "Mostly vertical; sharding is manual",
          },
          {
            aspect: "Writes",
            "Wide-Column": "Append-oriented, no read-before-write",
            Relational: "In-place updates with locking",
          },
          {
            aspect: "Consistency",
            "Wide-Column": "Tunable, often eventually consistent",
            Relational: "Strong, ACID by default",
          },
          {
            aspect: "Failure mode",
            "Wide-Column": "Hot partitions and costly full scans",
            Relational: "Deep joins and index bloat",
          },
        ],
      },
      {
        type: "text",
        heading: "Hot Partitions, Tombstones, and Last-Write-Wins",
        content:
          "Three operational realities define wide-column databases.\n\n**Hot partitions**: if a partition key is low-cardinality — a status value, a single device — all traffic for that key funnels through one node. Salting the key or adding a time bucket spreads the load. **Tombstones**: a delete writes a marker, not a removal; tombstones accumulate, and a read that must skip many of them can slow down or fail, so delete-heavy patterns are best avoided. **Last-write-wins**: each cell carries a write timestamp and conflicts are resolved by the highest one, which means clock skew between nodes can silently drop a write that merely looked older.",
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Model Around Queries, Not Entities",
        content:
          "The most common mistake is porting a normalized relational schema straight into Cassandra or ScyllaDB and expecting joins and ad-hoc WHERE clauses to work. They will not. Full-table scans are effectively forbidden — they must touch every node and will time out under load. Before writing a single table, enumerate the exact queries your service will run, then design one table per query. If you cannot name the partition key for a query, you do not yet have a viable model.",
      },
      {
        type: "steps",
        heading: "Designing a Table",
        steps: [
          {
            title: "List the queries",
            detail:
              "Write down every read your service performs, including sort order and filters.",
          },
          {
            title: "Pick the partition key",
            detail:
              "Choose a high-cardinality key that spreads load and keeps each partition small.",
          },
          {
            title: "Choose clustering columns",
            detail:
              "Order rows within the partition to match the required sort and range filters.",
          },
          {
            title: "Denormalize per query",
            detail:
              "Create one table per access path and accept that writes fan out to several tables.",
          },
          {
            title: "Validate even loading",
            detail:
              "Confirm no partition holds a disproportionate share of data or traffic; add buckets if needed.",
          },
          {
            title: "Set TTLs deliberately",
            detail:
              "Expire data by default so partitions cannot grow without bound.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "A wide-column row is a sorted map; the partition key decides which node holds it",
          "The partition key selects the node, the clustering columns order rows within it",
          "There are no joins — model one table per query and denormalize aggressively",
          "Never query without the partition key; full scans hit every node and time out",
          "Guard against hot partitions, tombstone buildup, and clock-skew last-write-wins",
          "Scaling is linear and write-oriented; trade ad-hoc querying for predictable throughput",
        ],
      },
    ],
    quiz: [
      {
        question:
          "In a wide-column store, what does the partition key determine?",
        options: [
          "The sort order of rows within a node",
          "Which node and replica set store the row",
          "The data type assigned to each column",
          "The compression ratio of the table",
        ],
        correctIndex: 1,
        explanation:
          "A hash of the partition key selects the node (and its replicas) that own the data. Ordering within a partition is the job of the clustering columns, not the partition key.",
      },
      {
        question: "Why is a query that omits the partition key discouraged?",
        options: [
          "It returns duplicate rows",
          "The engine must fan out to every node, which is slow and may time out",
          "It permanently corrupts the table",
          "It disables replication for that table",
        ],
        correctIndex: 1,
        explanation:
          "Because the partition key decides which node holds the data, a query without it has no way to target a single node and must ask every node. That fan-out is slow and will not survive load.",
      },
      {
        question:
          "A team partitions an events table by a status column holding only 'online' and 'offline'. What will happen?",
        options: [
          "Perfectly even load across the cluster",
          "Hot partitions concentrate nearly all traffic onto two nodes",
          "The table refuses to be created",
          "Writes become strongly consistent",
        ],
        correctIndex: 1,
        explanation:
          "A low-cardinality partition key produces hot partitions: almost all data and traffic land on the few nodes that own those two key values, overloading them while the rest of the cluster idles.",
      },
      {
        question: "How does a wide-column store typically represent a delete?",
        options: [
          "The row is physically removed immediately",
          "A tombstone marker is written and resolved later during compaction",
          "The row is moved to a trash table",
          "A foreign key cascades the removal",
        ],
        correctIndex: 1,
        explanation:
          "Deletes write tombstone markers because the engine appends rather than updates in place. Tombstones are reconciled during compaction, and a heavy accumulation of them can slow reads until they are cleared.",
      },
    ],
  },

  // ─── PROBABILISTIC DATA STRUCTURES ──────────────────────────────────────

  "probabilistic-structures": {
    slug: "probabilistic-structures",
    title: "Probabilistic Data Structures",
    tagline: "Tiny memory, bounded error, and fixed-time answers",
    sections: [
      {
        type: "text",
        heading: "Exact Answers Cost Space",
        content:
          "Some questions simply do not need exact answers. Has this user already seen this article? Roughly how many unique visitors hit this endpoint today? Which IP addresses are sending far more requests than everyone else? Answering those precisely means storing every element or every distinct value, so memory and time grow with the data.\n\n**Probabilistic data structures** trade a small, bounded error for a dramatic reduction in memory and a fixed cost per operation. This is not sloppiness: the error is quantified and tunable, which makes these structures predictable enough to run in production. Databases use Bloom filters to skip disk reads, and analytics pipelines use HyperLogLog to count uniques across billions of events.",
      },
      {
        type: "analogy",
        heading: "The Bouncer and the Guest List",
        content:
          "A nightclub door admits members only. Keeping the full membership list is a fat book that takes seconds to search, so the bouncer instead memorises a compact sketch of every member. When a guest arrives, the bouncer checks the sketch.\n\nIf the sketch says the guest is definitely not a member, they are turned away — always correct. If it says maybe a member, they are let in and verified. Occasionally a non-member slips through, a false positive, but no real member is ever wrongly rejected. That trade — a few impostors for a tiny, fast list — is exactly what a Bloom filter buys.",
      },
      {
        type: "text",
        heading: "Bloom Filters and Cuckoo Filters",
        content:
          "A **Bloom filter** is a bit array with k hash functions. Inserting an element sets k bits; a membership check asks whether all k bits are set. If any bit is clear, the element is definitely absent; if all are set, it is probably present. The false-positive rate is tunable through the bit budget per element. Its fatal limitation is deletion: clearing bits would affect other elements that hashed to them.\n\nA **cuckoo filter** stores partial fingerprints in a cuckoo hash table, which permits deletion and often achieves a lower false-positive rate per bit than a Bloom filter at higher load factors. Cuckoo filters are the modern choice when the membership set mutates; Bloom filters remain the standard when the data is append-only.",
      },
      {
        type: "code",
        heading: "Membership in a Bloom Filter",
        language: "typescript",
        label: "bloom-filter.ts",
        code: `// A Bloom filter: k bits set per item; membership needs every bit present.
class BloomFilter {
  private bits: Uint8Array;

  constructor(private readonly m: number, private readonly k: number) {
    this.bits = new Uint8Array(Math.ceil(m / 8));
  }

  private positions(item: string): number[] {
    // Double hashing: h1 + i * h2 mod m derives k positions from one 128-bit hash.
    const h1 = fnv1a(item);
    const h2 = fnv1a(item + ":salt");
    return Array.from({ length: this.k }, (_, i) => (h1 + i * h2) % this.m);
  }

  add(item: string): void {
    for (const p of this.positions(item)) {
      this.bits[p >> 3] |= 1 << (p & 7);
    }
  }

  mightContain(item: string): boolean {
    return this.positions(item).every(
      (p) => (this.bits[p >> 3] & (1 << (p & 7))) !== 0,
    );
  }
}

// mightContain -> false means definitely absent; true means probably present.`,
      },
      {
        type: "text",
        heading: "HyperLogLog: Counting Uniques in Kilobytes",
        content:
          "**HyperLogLog (HLL)** estimates the cardinality of a set — how many distinct elements it contains — using fixed memory regardless of how many elements are added. It watches the longest run of leading zeros in the hash of each element: a long run is rare and implies a large set, which a harmonic mean over many registers turns into a stable estimate.\n\nThe classic implementation uses 2^14 = 16,384 registers of six bits each, roughly 12 KB, and reports cardinality with a standard error near 0.81%. Redis exposes it as PFADD and PFCOUNT, and it underpins unique-visitor counts, distinct-query analytics, and count-distinct stages in big-data pipelines. It cannot tell you which elements were seen, only approximately how many distinct ones.",
      },
      {
        type: "comparison",
        heading: "Choosing a Sketch",
        headers: [
          "Bloom filter",
          "Cuckoo filter",
          "Count-Min sketch",
          "HyperLogLog",
        ],
        rows: [
          {
            aspect: "Answers",
            "Bloom filter": "Membership",
            "Cuckoo filter": "Membership",
            "Count-Min sketch": "Frequency",
            HyperLogLog: "Cardinality",
          },
          {
            aspect: "Deletions",
            "Bloom filter": "No",
            "Cuckoo filter": "Yes",
            "Count-Min sketch": "No (counting variant can)",
            HyperLogLog: "No",
          },
          {
            aspect: "Error direction",
            "Bloom filter": "False positives only",
            "Cuckoo filter": "False positives only",
            "Count-Min sketch": "Overestimates only",
            HyperLogLog: "Approximate in both directions",
          },
          {
            aspect: "Typical size",
            "Bloom filter": "~10 bits per element for 1%",
            "Cuckoo filter": "Similar, higher load factor",
            "Count-Min sketch": "Width times depth counters",
            HyperLogLog: "Fixed ~12 KB",
          },
          {
            aspect: "Mergeable",
            "Bloom filter": "Yes, bitwise OR",
            "Cuckoo filter": "Limited",
            "Count-Min sketch": "Yes, element-wise sum",
            HyperLogLog: "Yes, max per register",
          },
          {
            aspect: "Typical use",
            "Bloom filter": "Skip disk reads (LSM, CDN)",
            "Cuckoo filter": "Dynamic membership sets",
            "Count-Min sketch": "Heavy hitters, rate limiting",
            HyperLogLog: "Unique counts",
          },
        ],
      },
      {
        type: "text",
        heading: "Count-Min Sketch: Finding Heavy Hitters",
        content:
          "A **Count-Min sketch** estimates how often each element has been seen. It is a 2D grid of counters: each of d rows has its own hash function mapping an element to a column, and an update increments all d counters. The estimate for an element is the **minimum** of its d counters.\n\nBecause counters only ever increment, the sketch can only overestimate — never underestimate — and the error is bounded by the total count divided by the grid width. That makes it ideal for heavy hitters: the top talkers in DDoS mitigation, the most frequent search terms, or which IPs to rate-limit. A refinement called conservative update increments only the smallest counters to reduce overestimation.",
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Bloom Filters Never Lie About Absence",
        content:
          "The defining guarantee of a Bloom filter — and the reason databases and CDNs depend on it — is that a negative answer is always correct. If the filter says an element is absent, it truly is absent; only positive answers carry a tunable false-positive rate. So the safe pattern is to treat a negative as an authoritative skip and a positive as worth checking. LSM engines use exactly this to avoid reading an SSTable that cannot contain the key, and CDNs use it to avoid a cache lookup for URLs that were never cached.",
      },
      {
        type: "text",
        heading: "Sizing the Structure to the Error",
        content:
          "Every sketch has a size-versus-error dial. For a Bloom filter the false-positive rate p relates to the number of bits per element m/n as m/n = -ln(p) / (ln 2)^2, and the optimal number of hash functions is k = (m/n) ln 2. Hitting a 1% false-positive rate needs about 9.6 bits per element and 7 hashes.\n\nHyperLogLog's error is set by its register count: the standard error is roughly 1.04 / sqrt(m), so 16,384 registers give about 0.81%. Count-Min's error scales inversely with the grid width. Choose the error you can tolerate first, then size the structure to meet it — sizing by feel is how a cheap sketch ends up using more memory than the exact structure it replaced.",
      },
      {
        type: "steps",
        heading: "Picking the Right Sketch",
        steps: [
          {
            title: "State the question",
            detail:
              "Membership, frequency, or cardinality? Each maps to a different family of structure.",
          },
          {
            title: "Decide if deletes are needed",
            detail:
              "Append-only data favours a Bloom filter; mutating sets favour a cuckoo filter.",
          },
          {
            title: "Set the error budget",
            detail:
              "Pick the tolerable false-positive rate or relative error before sizing anything.",
          },
          {
            title: "Size the structure",
            detail:
              "Use the bit-per-element or register formulas to hit the budget exactly.",
          },
          {
            title: "Plan for merging",
            detail:
              "If you shard, choose a sketch whose union operation is cheap and correct.",
          },
          {
            title: "Confirm positives exactly",
            detail:
              "Use the sketch as a filter and verify positive answers against the source of truth.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Probabilistic structures trade a bounded, tunable error for tiny memory and fixed-time work",
          "Bloom filters give no false negatives — absence is always correct; only positives are approximate",
          "Bloom filters cannot delete; cuckoo filters support deletion and lower false-positive rates",
          "HyperLogLog counts distinct elements in fixed memory (~12 KB for ~0.81% error)",
          "Count-Min sketches estimate frequencies and only overestimate; ideal for heavy hitters",
          "Choose the error first, then size using the bit-per-element or register formulas",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Which guarantee does a Bloom filter provide about a negative membership result?",
        options: [
          "It is correct with probability p",
          "It is always correct — the element is definitely absent",
          "It is only correct for small sets",
          "It means the element was inserted but deleted later",
        ],
        correctIndex: 1,
        explanation:
          "A Bloom filter can only produce false positives, never false negatives. If any of the k bits is clear, the element was definitely never inserted, so a negative answer is authoritative.",
      },
      {
        question:
          "Which structure estimates the number of distinct visitors using roughly 12 KB no matter how much traffic arrives?",
        options: [
          "Bloom filter",
          "Cuckoo filter",
          "HyperLogLog",
          "B-tree index",
        ],
        correctIndex: 2,
        explanation:
          "HyperLogLog estimates set cardinality with fixed memory — the standard configuration uses 2^14 registers, about 12 KB, and reports distinct counts with roughly 0.81% error regardless of volume.",
      },
      {
        question: "Why can a standard Bloom filter not support deletion?",
        options: [
          "Deletion would require a lock on the whole filter",
          "Clearing bits would also affect other elements that hashed to the same bits",
          "The bit array is write-once by design",
          "It has no way to compute the hash of a deleted item",
        ],
        correctIndex: 1,
        explanation:
          "Bits are shared across elements by hash collisions, so clearing a bit for one element may clear it for others that set it. Cuckoo filters store per-item fingerprints and therefore allow deletion.",
      },
      {
        question: "In which direction can a Count-Min sketch be wrong?",
        options: [
          "It can underestimate the true frequency",
          "It can overestimate the true frequency, never underestimate",
          "It can report negative counts",
          "It can return a different item entirely",
        ],
        correctIndex: 1,
        explanation:
          "Counters only increment and hash collisions add extra counts, so the minimum-of-rows estimate can only be too high. That makes it safe for heavy-hitter detection, where overestimation is the tolerable direction of error.",
      },
    ],
  },

  // ─── DISTRIBUTED ID GENERATION ──────────────────────────────────────────

  "distributed-id-generation": {
    slug: "distributed-id-generation",
    title: "Distributed ID Generation",
    tagline: "Unique, roughly sortable keys generated without coordination",
    sections: [
      {
        type: "text",
        heading: "Why Auto-Increment Fails at Scale",
        content:
          "A single auto-incrementing counter is simple and dense — until there is more than one writer. Two databases each starting at 1 will eventually collide; coordinating one global counter reintroduces a bottleneck and a single point of failure across regions. Sharding the counter, odds on one node and evens on another, is a classic fix but is brittle and hard to change later.\n\nAt scale you need identifiers that are **generated locally without coordination**, are **globally unique**, and are ideally **roughly time-ordered** so they index efficiently. That is the distributed ID problem, and the tension between uniqueness, ordering, size, and coordination cost shapes every solution.",
      },
      {
        type: "analogy",
        heading: "Number Plates Across Provinces",
        content:
          "Consider vehicle licence plates. If every province issued plain sequential numbers, two provinces would soon mint the same plate. So each province prefixes its own code, and within a province a counter increments. Every plate is now unique nationwide without the provinces ever talking to each other.\n\nDistributed ID schemes work the same way. A machine id or a random node component plays the role of the province prefix, a timestamp supplies natural ordering, and a per-millisecond counter handles several IDs minted in the same instant. Coordination is avoided; uniqueness comes from partitioning the identifier space up front.",
      },
      {
        type: "text",
        heading: "UUIDs: v4, v7, and the Sortability Gap",
        content:
          "**UUIDv4** is 128 random bits — collision-free in practice and trivially generated anywhere, but completely unordered, so random inserts scatter across B-tree pages and fragment indexes. **UUIDv7** keeps the 128 bits but places a 48-bit Unix millisecond timestamp first, followed by random bits: unique like v4, but k-sortable, so new rows append near the end of an index instead of splattering across it.\n\n**ULID** expresses the same idea in a different encoding: 48 bits of millisecond time plus 80 random bits, usually rendered as 26-character Crockford Base32 that is case-insensitive and sorts lexicographically. **KSUID** is 20 bytes — a 32-bit second-precision timestamp plus 128 random bits — giving compact, sortable IDs when a single second of precision is enough.",
      },
      {
        type: "code",
        heading: "Snowflake in 64 Bits",
        language: "typescript",
        label: "snowflake.ts",
        code: `// Snowflake id = timestamp | machine | sequence, packed into 64 bits.
// 41 bits of ms since a custom epoch + 10 bits of machine id + 12 bits of sequence.
const EPOCH = 1_700_000_000_000n;
const MACHINE_BITS = 10n;
const SEQUENCE_BITS = 12n;
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n;

export class Snowflake {
  private lastMs = -1n;
  private sequence = 0n;

  constructor(private readonly machineId: bigint) {
    if (machineId < 0n || machineId >= 1n << MACHINE_BITS) {
      throw new Error("machineId out of range");
    }
  }

  next(): bigint {
    let now = BigInt(Date.now());
    if (now === this.lastMs) {
      this.sequence = (this.sequence + 1n) & MAX_SEQUENCE;
      if (this.sequence === 0n) now = this.waitNextMs(now); // sequence exhausted
    } else {
      this.sequence = 0n;
    }
    if (now < this.lastMs) throw new Error("clock moved backwards");
    this.lastMs = now;
    return (
      ((now - EPOCH) << (MACHINE_BITS + SEQUENCE_BITS)) |
      (this.machineId << SEQUENCE_BITS) |
      this.sequence
    );
  }

  private waitNextMs(now: bigint): bigint {
    let t = now;
    while (t <= this.lastMs) t = BigInt(Date.now());
    return t;
  }
}`,
      },
      {
        type: "text",
        heading: "The Snowflake Layout",
        content:
          "Twitter's **Snowflake** is the canonical 64-bit scheme. The bits are partitioned: a timestamp of typically 41 bits of milliseconds since a custom epoch, giving about 69 years; a machine or node id of 10 bits, good for 1024 nodes; and a per-millisecond sequence of 12 bits, good for 4096 ids per millisecond per node. The pieces are combined with bit shifts, so the resulting integer sorts by creation time and fits in a signed 64-bit column.\n\nThe design assumes reasonably synchronised clocks and a machine id that is unique per process. If the clock jumps backwards the generator must either wait or throw, because reusing a timestamp can mint a duplicate id.",
      },
      {
        type: "comparison",
        heading: "Comparing ID Schemes",
        headers: ["Snowflake", "ULID", "UUIDv7", "KSUID"],
        rows: [
          {
            aspect: "Size",
            Snowflake: "64-bit integer",
            ULID: "128-bit, 26-char text",
            UUIDv7: "128-bit",
            KSUID: "160-bit, 27-char text",
          },
          {
            aspect: "Ordering",
            Snowflake: "Time-sortable, ms precision",
            ULID: "Lexicographically sortable, ms",
            UUIDv7: "Time-sortable, ms",
            KSUID: "Sortable, second precision",
          },
          {
            aspect: "Coordination",
            Snowflake: "Needs a unique machine id",
            ULID: "None",
            UUIDv7: "None",
            KSUID: "None",
          },
          {
            aspect: "Clock sensitivity",
            Snowflake: "High; must block on rollback",
            ULID: "Low; random tiebreak",
            UUIDv7: "Low; monotonic variants exist",
            KSUID: "Low; random tiebreak",
          },
          {
            aspect: "Collision risk",
            Snowflake: "None if ids and clocks behave",
            ULID: "Negligible (80 random bits)",
            UUIDv7: "Negligible (74 random bits)",
            KSUID: "Negligible (128 random bits)",
          },
          {
            aspect: "Best fit",
            Snowflake: "High-throughput internal ids",
            ULID: "Human-friendly sortable ids",
            UUIDv7: "Standard database keys",
            KSUID: "Compact sortable ids",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Clock Skew Breaks Monotonicity",
        content:
          "Every time-ordered ID scheme inherits the weakness of wall-clock time. NTP stepping the clock backwards, a leap second, or a container migration can make a node emit a timestamp earlier than one it already used, producing a duplicate Snowflake id or an out-of-order UUIDv7. Production generators guard against this: Snowflake servers block for the skew duration or refuse to emit, and UUIDv7 implementations offer a monotonic mode that bumps a counter instead of reusing the timestamp. Never trust raw Date.now() in an id generator without a monotonicity check.",
      },
      {
        type: "text",
        heading: "Sortability and Index Locality",
        content:
          "Randomly ordered primary keys — UUIDv4 being the worst offender — ruin B-tree insert performance. Every new row lands in a random leaf page, causing page splits, cache misses, and a bloated index. Time-ordered keys such as UUIDv7, ULID, Snowflake, and KSUID keep inserts at the right edge of the tree, so pages fill sequentially and the working set stays hot.\n\nThe catch is that strict time ordering can create hot spots in distributed systems: if all new writes share a leading timestamp, they may target the same partition. Some engines therefore hash or randomise a small suffix, or advise against monotonically increasing partition keys altogether. Choose ordering deliberately — it is good for a single-node index and potentially bad for a sharded one.",
      },
      {
        type: "steps",
        heading: "Choosing an ID Scheme",
        steps: [
          {
            title: "Check coordination constraints",
            detail:
              "If nodes cannot talk, rule out shared counters and lean on UUIDv7, ULID, or Snowflake.",
          },
          {
            title: "Decide if ordering matters",
            detail:
              "Time-ordered ids help index locality; random ids hide hot spots in sharded stores.",
          },
          {
            title: "Fix the encoding",
            detail:
              "Integers are compact and fast; text forms are human-friendly but larger.",
          },
          {
            title: "Plan the machine identity",
            detail:
              "Snowflake needs a reliable, unique node id, which is a coordination problem of its own.",
          },
          {
            title: "Handle clock rollback",
            detail:
              "Choose a library with monotonic behaviour or add explicit guard logic.",
          },
          {
            title: "Test at the edges",
            detail:
              "Verify uniqueness under retries, restarts, and skewed clocks before shipping.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "A single auto-increment counter does not survive multiple writers or regions",
          "UUIDv4 is unique but unordered; UUIDv7 and ULID add a sortable timestamp prefix",
          "Snowflake packs timestamp, machine, and sequence into one 64-bit integer",
          "Time-ordered keys give great index locality but can create write hot spots when sharded",
          "Every time-based scheme must guard against backward clock jumps",
          "Pick the scheme from your coordination, ordering, and size constraints — not by habit",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What is the main advantage of UUIDv7 over UUIDv4 when used as a database primary key?",
        options: [
          "It is shorter and fits in 64 bits",
          "It is time-sortable, keeping inserts near the end of the index",
          "It requires no random bits at all",
          "It removes the need for a machine id",
        ],
        correctIndex: 1,
        explanation:
          "UUIDv7 prefixes a 48-bit millisecond timestamp, so ids are roughly time-ordered. That improves B-tree insert locality compared with the fully random UUIDv4, which scatters inserts across index pages.",
      },
      {
        question:
          "In a standard 64-bit Snowflake id, what do the bit-field groups represent?",
        options: [
          "Random, checksum, and version bits",
          "Timestamp, machine id, and per-millisecond sequence",
          "Region, tenant, and shard",
          "Node id, process id, and thread id",
        ],
        correctIndex: 1,
        explanation:
          "Snowflake partitions the 64 bits into a millisecond timestamp, a machine/node id, and a per-millisecond sequence. Combined with shifts, they yield a time-sortable, unique integer.",
      },
      {
        question:
          "What must a Snowflake generator do when the system clock jumps backwards?",
        options: [
          "Ignore it and keep issuing ids",
          "Block for the skew duration or refuse to emit, to avoid duplicate ids",
          "Reset the sequence to zero and continue",
          "Switch permanently to UUIDv4",
        ],
        correctIndex: 1,
        explanation:
          "Reusing a timestamp that was already used for earlier ids would collide. A correct generator waits until the clock catches up, or throws, rather than emitting an id with a non-monotonic timestamp.",
      },
      {
        question:
          "Why might a strictly increasing timestamp be a poor partition key in a sharded store?",
        options: [
          "It cannot be indexed",
          "All new writes pile onto the same hot partition",
          "It overflows 64 bits immediately",
          "It cannot be represented in JSON",
        ],
        correctIndex: 1,
        explanation:
          "If every new row shares the leading timestamp, the writes target a single partition, creating a hot spot. Some engines mitigate this by hashing or randomising part of the key.",
      },
    ],
  },

  // ─── REPLICATION TOPOLOGIES ─────────────────────────────────────────────

  "replication-topologies": {
    slug: "replication-topologies",
    title: "Replication Topologies",
    tagline: "Single-leader, multi-leader, leaderless, and quorum tuning",
    sections: [
      {
        type: "text",
        heading: "Why Replicate at All",
        content:
          "Replication keeps copies of the same data on multiple nodes. It buys three things: **durability**, so a disk failure does not lose data; **availability**, so reads and writes continue when a node dies; and **latency**, so a replica near the user answers faster.\n\nBut copies must be kept in sync, and physics does not permit that instantly across a network. Every replication design is a different answer to how many nodes must agree, how quickly, and what happens when they disagree. The topology — who accepts writes and who follows — determines your consistency, your failure behaviour, and your conflict story.",
      },
      {
        type: "analogy",
        heading: "Branch Offices and Head Office",
        content:
          "A single-leader system is a company where only head office may change the official records. Branch offices keep their own copies to answer questions quickly, but every change is mailed to head office first and then broadcast back. Ask a branch about a change you just mailed and you may be told it has not arrived yet — replication lag.\n\nA multi-leader system lets each regional office update its own records and sync with the others later: faster locally, but two offices can edit the same record differently and someone must resolve the clash. A leaderless system is a committee: to change a record you must convince a majority of members, and there is no single chair.",
      },
      {
        type: "text",
        heading: "Single-Leader (Primary/Replica)",
        content:
          "In **single-leader** replication one node accepts all writes and streams a replication log — statement-based, row-based, or the physical WAL — to replicas that apply it in order. This is the default in PostgreSQL streaming replication, MySQL binlog replication, and most managed relational services.\n\nBecause writes flow through one point, the log defines a total order and conflicts are impossible. The cost is that the leader is a write bottleneck and a failover risk: promoting a replica on leader failure takes time, and asynchronous replicas may lag, so recently committed writes can be lost if the leader dies before the log ships. Synchronous replication avoids that loss but stalls writes whenever a replica is slow.",
      },
      {
        type: "comparison",
        heading: "Single-Leader vs Multi-Leader vs Leaderless",
        headers: ["Single-leader", "Multi-leader", "Leaderless"],
        rows: [
          {
            aspect: "Who writes",
            "Single-leader": "One leader",
            "Multi-leader": "Several leaders",
            Leaderless: "Client writes to many replicas",
          },
          {
            aspect: "Conflict risk",
            "Single-leader": "None at write time",
            "Multi-leader": "Frequent; needs resolution",
            Leaderless: "Possible; handled by quorum and versioning",
          },
          {
            aspect: "Write latency",
            "Single-leader": "Round trip to the leader",
            "Multi-leader": "Local region accepts writes",
            Leaderless: "Write to a quorum (e.g. 3 of 5)",
          },
          {
            aspect: "Failover",
            "Single-leader": "Promote a replica; brief pause",
            "Multi-leader": "Any leader keeps serving",
            Leaderless: "No leader to promote; clients reroute",
          },
          {
            aspect: "Consistency",
            "Single-leader": "Strong if synchronous, else eventual",
            "Multi-leader": "Eventual and convergent",
            Leaderless: "Tunable via R and W",
          },
          {
            aspect: "Typical systems",
            "Single-leader": "PostgreSQL, MySQL, managed SQL",
            "Multi-leader": "BDR, multi-master MySQL, CouchDB",
            Leaderless: "DynamoDB, Cassandra, Riak",
          },
        ],
      },
      {
        type: "text",
        heading: "Quorum Reads and Writes",
        content:
          "Leaderless systems such as DynamoDB and Cassandra make consistency a per-request dial through **quorums**. With N replicas, a write waits for W acknowledgements and a read for R responses. When W + R > N, at least one replica in the read set also holds the latest write, so the read can detect it and consistency strengthens. When W + R <= N, reads may miss recent writes but stay fast and available.\n\nThe tunable setting is powerful and dangerous: the same table can run quorum writes with fast local reads, then serve a stale value during a network partition. It is also worth remembering that Dynamo-style quorums may be \u201csloppy\u201d — hinted handoff routes writes to fallback nodes during a failure, restoring availability but weakening the read-your-latest guarantee until the hints are reconciled.",
      },
      {
        type: "code",
        heading: "Quorum Arithmetic",
        language: "plaintext",
        label: "quorum.txt",
        code: `N = replicas holding a key        (e.g. 5)
W = replicas that must acknowledge a write
R = replicas that must respond to a read

Overlap (W + R > N) => a read sees the latest write:
  N=5, W=3, R=3  ->  3 + 3 > 5  -> every read overlaps the write set
  N=5, W=4, R=2  ->  4 + 2 > 5  -> faster reads, slower writes
  N=5, W=1, R=1  ->  1 + 1 < 5  -> fast but reads may miss recent writes

Latency is set by the SLOWEST replica in the quorum, not the fastest:
the request waits for the Wth (or Rth) response to arrive.`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Replication Lag Breaks Read-Your-Writes",
        content:
          "The most common replication bug is read-your-writes inconsistency. A user updates their profile through the leader, the page reloads, and the request lands on an asynchronous replica that has not applied the write yet, so the old value flashes back. The fix is to route a user's reads to the leader, or a synchronous replica, for a short window after their own write, or to track the write's log position and read only replicas caught up to it. Without one of these, 'I saved it but it reverted' bug reports are inevitable.",
      },
      {
        type: "text",
        heading: "Conflict Resolution",
        content:
          "Multi-leader and leaderless topologies can accept conflicting writes concurrently, so they must converge to a single value. Common strategies: **last-write-wins**, which is simple but silently drops data based on timestamps and clock skew; **version vectors**, which detect concurrent edits and surface them to the application; **CRDTs**, conflict-free replicated data types that merge deterministically and suit counters, sets, and collaborative text; and **application-level merge**, which presents both versions for a user or rule to decide.\n\nThere is no free lunch: the more availability and write locality you gain, the more conflict handling you must design. Choose the strategy that matches how much you can afford to lose or to defer.",
      },
      {
        type: "steps",
        heading: "Choosing a Topology",
        steps: [
          {
            title: "Classify the workload",
            detail:
              "Is it read-heavy, write-heavy, or write-anywhere across regions?",
          },
          {
            title: "Set the consistency requirement",
            detail:
              "Strong, read-your-writes, or eventual — this rules most topologies out immediately.",
          },
          {
            title: "Pick write locations",
            detail:
              "One region writes (single-leader) or many (multi-leader, leaderless).",
          },
          {
            title: "Plan failover",
            detail:
              "Know how a leader is promoted, or how clients reroute, when a node fails.",
          },
          {
            title: "Define conflict handling",
            detail:
              "For multi-writer systems, choose last-write-wins, version vectors, or CRDTs up front.",
          },
          {
            title: "Verify with failure drills",
            detail:
              "Kill a leader and a replica in staging and confirm the promised behaviour holds.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Replication buys durability, availability, and latency — at the cost of keeping copies in sync",
          "Single-leader avoids write conflicts but bottlenecks writes and complicates failover",
          "Multi-leader accepts local writes everywhere but demands conflict resolution",
          "Leaderless systems tune consistency with quorums: W + R > N for read-write overlap",
          "Asynchronous replication causes read-your-writes anomalies unless you route around it",
          "Pick the topology from your consistency requirement, not from fashion",
        ],
      },
    ],
    quiz: [
      {
        question:
          "In a leaderless store with N = 3 replicas, which W and R guarantee that every read overlaps the latest write?",
        options: ["W=1, R=1", "W=2, R=1", "W=2, R=2", "W=1, R=2"],
        correctIndex: 2,
        explanation:
          "The overlap rule is W + R > N. Only W=2, R=2 satisfies 2 + 2 > 3. The others sum to 3 or less, so a read may not intersect the replica set that acknowledged the most recent write.",
      },
      {
        question: "What is the primary advantage of single-leader replication?",
        options: [
          "Writes can be accepted in every region",
          "There are no write conflicts because the log defines a total order",
          "It never loses data on failover",
          "It requires no replication log",
        ],
        correctIndex: 1,
        explanation:
          "With a single write path, the replication log imposes one total order, so concurrent conflicting writes cannot occur. The tradeoff is a write bottleneck and a more involved failover.",
      },
      {
        question:
          "A user reports that after saving their profile the old value briefly reappeared. What is the most likely cause?",
        options: [
          "The write was rejected by the leader",
          "The read was served by a lagging asynchronous replica",
          "The primary key collided",
          "The row was soft-deleted",
        ],
        correctIndex: 1,
        explanation:
          "This is the classic read-your-writes anomaly: the write reached the leader, but a subsequent read hit a replica that had not yet applied the replication log, so it returned the stale value.",
      },
      {
        question:
          "Which topology inherently requires a conflict-resolution strategy?",
        options: [
          "Single-leader replication",
          "Multi-leader replication",
          "Read-only replicas",
          "Synchronous single-leader with a standby",
        ],
        correctIndex: 1,
        explanation:
          "Multi-leader replication accepts writes at more than one node concurrently, so the same record can be edited differently on different leaders. The system must converge, which requires an explicit conflict-resolution strategy such as LWW, version vectors, or CRDTs.",
      },
    ],
  },

  // ─── DATA LIFECYCLE & RETENTION ─────────────────────────────────────────

  "data-lifecycle": {
    slug: "data-lifecycle",
    title: "Data Lifecycle & Retention",
    tagline: "Tiering, TTLs, archival, and the right to be forgotten",
    sections: [
      {
        type: "text",
        heading: "Data Has a Lifetime",
        content:
          "Every record has a point where it stops being useful: logs older than the investigation window, sessions past their expiry, orders kept only as long as tax law requires. Treating all data as eternal is itself a choice — and an expensive one. Storage, backups, index size, and query cost all grow with data you never read.\n\nA **data lifecycle** is the explicit set of rules describing how each class of data is created, used, moved to cheaper storage, and finally deleted or archived. Done well it cuts cost, keeps queries fast, and satisfies legal obligations. Done implicitly, or not at all, it accumulates into a liability that is hard to untangle later.",
      },
      {
        type: "analogy",
        heading: "The Records Office",
        content:
          "A records office does not file every document in the same cabinet forever. Recent files sit on the desk for easy access. Older ones move to shelving elsewhere in the building. Historic ones are boxed and sent to an off-site warehouse that retrieves them in hours, not seconds. Truly obsolete ones are shredded on a schedule the law prescribes.\n\nData lifecycle management is that office policy, automated. Hot storage is the desk, warm storage is the shelf, cold storage is the warehouse, and a retention schedule decides when each document moves or is destroyed. The mistake is keeping everything on the desk and calling the resulting mess the source of truth.",
      },
      {
        type: "text",
        heading: "Storage Tiers",
        content:
          "Object storage makes tiering concrete. **Hot** tiers (S3 Standard) serve data with low latency and high request cost. **Warm** tiers (S3 Standard-IA, Infrequent Access) lower the storage price but add retrieval fees and a minimum storage duration. **Cold** tiers (Glacier Instant Retrieval) trade slower access for a fraction of the price. **Archive** tiers (Glacier Deep Archive) cost cents per terabyte but take hours to restore.\n\nThe design principle is to let age drive the tier: new data lands hot, a lifecycle policy transitions it as it ages, and only genuinely cold data reaches deep archive. In databases the same idea appears as time-based table partitioning, tablespaces on different disks, and separate analytical stores fed from the hot source.",
      },
      {
        type: "comparison",
        heading: "Comparing Storage Tiers",
        headers: ["Hot", "Warm", "Cold", "Archive"],
        rows: [
          {
            aspect: "Access latency",
            Hot: "Milliseconds",
            Warm: "Milliseconds, with a retrieval fee",
            Cold: "Minutes",
            Archive: "Hours",
          },
          {
            aspect: "Relative cost",
            Hot: "Highest storage cost",
            Warm: "Lower storage, fee on read",
            Cold: "Low storage",
            Archive: "Lowest storage",
          },
          {
            aspect: "Typical age",
            Hot: "Days to weeks",
            Warm: "Weeks to months",
            Cold: "Months to a year",
            Archive: "Years",
          },
          {
            aspect: "Good for",
            Hot: "Active queries on recent data",
            Warm: "Occasional lookups",
            Cold: "Compliance and rare history",
            Archive: "Legal hold and minimum retention",
          },
          {
            aspect: "Main risk",
            Hot: "Cost balloons as data grows",
            Warm: "Minimum-duration charges",
            Cold: "Slow restore surprises users",
            Archive: "Restores take hours",
          },
        ],
      },
      {
        type: "code",
        heading: "Retention by Partition Drop",
        language: "sql",
        label: "retention.sql",
        code: `-- Partition by month so retention is a metadata operation,
-- not a row-by-row DELETE that bloats the table and needs vacuuming.
CREATE TABLE events (
  id          BIGINT GENERATED ALWAYS AS IDENTITY,
  occurred_at TIMESTAMPTZ NOT NULL,
  payload     JSONB NOT NULL,
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE TABLE events_2026_01 PARTITION OF events
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Expiry is instant: detach and drop the whole old partition.
ALTER TABLE events DETACH PARTITION events_2025_01;
DROP TABLE events_2025_01;`,
      },
      {
        type: "text",
        heading: "TTL and Expiration",
        content:
          "Many stores expire data natively. Redis supports per-key TTL; Cassandra accepts default_time_to_live; DynamoDB has a TTL attribute; S3 lifecycle rules delete or transition objects by age. Native expiry is cheaper and more reliable than a cron job running DELETE statements, because it happens inside the engine and leaves no room for a forgotten cleanup.\n\nThe subtlety is how deletion actually happens. Redis evicts lazily and through a background sample, so a TTL means expire by rather than expire at. Cassandra TTLs become **tombstones** that must be compacted away, and heavy TTL churn can slow reads. Partition-drop retention — removing a whole old time partition — is by far the most efficient expiry, because it deletes metadata rather than millions of rows.",
      },
      {
        type: "text",
        heading: "Archival and Cold Storage",
        content:
          "Archival moves data out of the operational store into a cheap, durable home, usually object storage holding columnar files such as Parquet or ORC. The pattern that scales is to stream new events to a data lake or warehouse continuously, so the transaction database only ever holds the working set; archival then becomes the natural consequence of not loading old data back.\n\nWhen you do need to look back, a columnar engine such as BigQuery, Athena, or Snowflake can query the archive directly, or you can restore specific partitions. The design rule is to keep the archive self-describing — schema, partitioning, and a manifest — so a restore never requires archaeology.",
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Erasure vs Immutable Backups",
        content:
          "The right to be forgotten collides with backups. A user demands deletion, but the row also sits in last night's immutable snapshot, a tape archive, and a downstream analytics table. You cannot rewrite a WORM backup. The practical approach is consistent: delete from the live system and every queryable downstream store immediately, then either let backups age out on their defined retention window and document that behaviour, or use crypto-shredding — encrypt each subject's data with a per-subject key and destroy the key, rendering the copies unreadable. What you must not do is promise instant erasure from systems that cannot deliver it.",
      },
      {
        type: "steps",
        heading: "Implementing a Retention Policy",
        steps: [
          {
            title: "Classify the data",
            detail:
              "Group records by type and by the legal, product, and analytical need for each.",
          },
          {
            title: "Set retention windows",
            detail: "Decide how long each class lives and who owns that rule.",
          },
          {
            title: "Choose expiry mechanics",
            detail:
              "Prefer native TTLs or partition drops over scheduled row deletes.",
          },
          {
            title: "Define the tiers",
            detail:
              "Map age to hot, warm, cold, and archive storage with automated transitions.",
          },
          {
            title: "Handle erasure requests",
            detail:
              "Cover the live store, replicas, caches, search indexes, and downstream sinks.",
          },
          {
            title: "Monitor and test",
            detail:
              "Alert on lagging jobs, verify deletions actually happened, and review windows on a schedule.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Every dataset has a useful lifetime — make it explicit instead of keeping everything",
          "Tier by age: hot, warm, cold, and archive each trade latency for storage cost",
          "Prefer native TTLs and partition drops over row-by-row DELETE jobs",
          "Stream data to a warehouse so the operational store holds only the working set",
          "Erasure must reach replicas, caches, indexes, and downstream copies — not just the primary",
          "Reconcile the right to be forgotten with backups via aging-out or crypto-shredding",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Which retention mechanism is most efficient for large time-series tables?",
        options: [
          "A nightly DELETE with a WHERE clause on the date column",
          "Dropping whole old time partitions",
          "Updating a status column to mark rows expired",
          "Moving each row individually to another table",
        ],
        correctIndex: 1,
        explanation:
          "Dropping an old partition removes a whole block of data as a metadata operation, avoiding the row-by-row work, locking, and vacuuming that a large DELETE entails. It is the cheapest way to expire time-partitioned data.",
      },
      {
        question:
          "What is crypto-shredding and why is it used with immutable backups?",
        options: [
          "Encrypting the whole database and discarding the schema",
          "Encrypting each subject's data with a per-subject key and destroying that key to render copies unreadable",
          "Overwriting backup tapes multiple times",
          "Compressing backups so much that data is lost",
        ],
        correctIndex: 1,
        explanation:
          "Immutable backups cannot be edited, so to honour erasure you encrypt each subject's data under a unique key and destroy the key. The copied ciphertext remains but becomes undecryptable, effectively erasing the subject's data.",
      },
      {
        question:
          "In Cassandra, what does an expired TTL leave behind that can slow reads?",
        options: [
          "A foreign key violation",
          "A tombstone that must be cleared during compaction",
          "An orphaned index entry",
          "A soft-delete flag on every row",
        ],
        correctIndex: 1,
        explanation:
          "Cassandra writes a tombstone to mark an expired cell, and that marker must be removed during compaction. Heavy TTL churn creates many tombstones, which accumulate and can degrade read performance until compaction clears them.",
      },
      {
        question:
          "Data is accessed a few times a year purely to satisfy a compliance requirement. Which tier fits best?",
        options: [
          "Hot, for instant access",
          "Warm, since access is occasional",
          "Archive, accepting hours to restore",
          "It should be deleted immediately",
        ],
        correctIndex: 2,
        explanation:
          "Rare, compliance-driven access that tolerates slow restore is the definition of an archive tier. Keeping it hot would waste storage cost on data that is almost never read.",
      },
    ],
  },
};

