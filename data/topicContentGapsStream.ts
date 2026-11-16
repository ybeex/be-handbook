// Gap content: Streaming, Messaging & Data Pipelines
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_GAPS_STREAM: Record<string, TopicContent> = {
  // ─── MESSAGING ──────────────────────────────────────────────────────────

  "kafka-internals": {
    slug: "kafka-internals",
    title: "Kafka Internals",
    tagline: "A distributed append-only log disguised as a message broker",
    sections: [
      {
        type: "text",
        heading: "Kafka Is a Log, Not a Queue",
        content:
          "Kafka calls itself a message broker, but its real primitive is a **partitioned, replicated, append-only log**. A topic is split into partitions; each partition is an ordered, immutable sequence of records on disk. Records are never removed on read — they expire by time or size, or are compacted by key.\n\nThat single design decision cascades into everything else. Because readers do not delete, many consumers can read the same data independently, each tracking its own position. Because the log is ordered per partition, Kafka gives you ordering guarantees that a classic queue cannot without serialising everything.",
      },
      {
        type: "analogy",
        heading: "A Bank Ledger Everyone Can Read",
        content:
          "Think of a bank's transaction ledger. Entries are appended in order and never erased or re-numbered. Different departments — fraud, statements, analytics — each read the ledger independently at their own pace, bookmarking where they last stopped.\n\nA partition is one ledger; a topic is a set of ledgers split by customer so no single book is too large. The bookmark is the **offset**. Nobody deletes a line just because someone read it, so a slow reader never holds up a fast one.",
      },
      {
        type: "text",
        heading: "Partitions, Offsets, and Ordering",
        content:
          "A record is assigned to a partition, and within that partition it gets a monotonically increasing **offset**. Ordering is guaranteed **within a partition only** — across partitions, records have no defined order.\n\nThis is why the **partition key matters**. If you key by order_id, all events for one order land in the same partition and are processed in order. If you key by nothing (round-robin), throughput is maximal but you lose per-entity ordering. More partitions mean more parallelism, but also more open file handles, longer leader elections, and higher rebalance cost.",
      },
      {
        type: "code",
        heading: "Creating a Durable Topic",
        language: "bash",
        label: "create-topic.sh",
        code: `# 6 partitions -> up to 6 parallel consumers in a group.
# replication-factor 3 -> each partition lives on 3 brokers.
# min.insync.replicas 2 -> a produce with acks=all needs 2 in-sync copies.
kafka-topics.sh --bootstrap-server broker:9092 --create \\
  --topic orders.events \\
  --partitions 6 \\
  --replication-factor 3 \\
  --config min.insync.replicas=2 \\
  --config retention.ms=604800000 \\
  --config cleanup.policy=delete

# Inspect who leads each partition and who is in sync (ISR)
kafka-topics.sh --bootstrap-server broker:9092 --describe --topic orders.events`,
      },
      {
        type: "text",
        heading: "Replication and the In-Sync Replica Set",
        content:
          "Each partition has one **leader** (handles all reads and writes) and zero or more **followers** that fetch from the leader. The **ISR** is the set of replicas — leader plus followers — that are fully caught up. A follower falling behind (network lag, slow disk, GC pause) is removed from the ISR until it catches up.\n\nDurability lives at the intersection of two configs. **acks** controls how many replicas must acknowledge a write; **min.insync.replicas** sets the minimum ISR size for that write to succeed. With acks=all and min.insync.replicas=2, a produce succeeds only if two replicas confirm — so you can lose one broker without losing data. Set min.insync.replicas=1 and you can lose acknowledged writes when the leader dies before followers replicate.",
      },
      {
        type: "comparison",
        heading: "Producer acks Levels",
        headers: ["acks=0", "acks=1", "acks=all"],
        rows: [
          {
            aspect: "Wait for",
            "acks=0": "Nothing — fire and forget",
            "acks=1": "Leader writes to its log",
            "acks=all": "All in-sync replicas write",
          },
          {
            aspect: "Throughput",
            "acks=0": "Highest",
            "acks=1": "High",
            "acks=all": "Lowest",
          },
          {
            aspect: "Latency",
            "acks=0": "Lowest",
            "acks=1": "Low",
            "acks=all": "Highest",
          },
          {
            aspect: "Data loss risk",
            "acks=0": "Any broker restart loses data",
            "acks=1": "Leader death can lose un-replicated writes",
            "acks=all": "No loss unless the whole ISR dies",
          },
          {
            aspect: "Typical use",
            "acks=0": "Metrics you can afford to drop",
            "acks=1": "Non-critical, latency-sensitive logs",
            "acks=all": "Money, orders, anything authoritative",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "acks=all Does Not Guarantee Durability By Itself",
        content:
          "acks=all with min.insync.replicas=1 is a trap. If the ISR shrinks to just the leader — because followers lagged — an acks=all produce is satisfied by the leader alone, and a subsequent broker crash loses the write. Always pair acks=all with min.insync.replicas >= 2 and replication-factor >= 3. When the ISR cannot reach the minimum, the broker rejects the produce rather than silently degrade durability.",
      },
      {
        type: "text",
        heading: "Consumer Groups and Rebalancing",
        content:
          "Consumers join a **consumer group**. Kafka assigns each partition to exactly one consumer in the group, so a 6-partition topic supports at most 6 active consumers per group — extra consumers sit idle. Different groups are fully independent: one group can be a real-time service, another a batch archive, each with its own offsets.\n\nOffsets are committed back to an internal topic (__consumer_offsets). Kafka does not track read state per consumer beyond this, which is why **rebalances** matter: when a consumer joins, leaves, or dies, partitions are reassigned. Cooperative rebalancing reassigns incrementally; the older eager protocol revokes everything and pauses the whole group, and a slow rebalance on a large group can stall consumption for seconds.",
      },
      {
        type: "steps",
        heading: "Tuning a Topic for Throughput and Safety",
        steps: [
          {
            title: "Pick partitions from your target parallelism",
            detail:
              "Partitions cap consumer parallelism within a group and cannot be reduced — only increased, which changes key routing. Start at the consumer count you realistically need.",
          },
          {
            title: "Set replication-factor to 3",
            detail:
              "Three copies tolerate one broker failure while keeping a quorum. Two copies tolerate zero failures during maintenance without risking the ISR.",
          },
          {
            title: "Set min.insync.replicas to 2",
            detail:
              "This is the durability floor. Combined with acks=all on the producer, one broker can die without losing acknowledged writes.",
          },
          {
            title: "Choose the cleanup policy",
            detail:
              "delete for event streams that expire; compact for keyed state such as the latest value per user.",
          },
          {
            title: "Enable idempotent producers",
            detail:
              "enable.idempotence=true assigns sequence numbers so retries do not create duplicates within a partition.",
          },
        ],
      },
      {
        type: "text",
        heading: "Log Compaction: Keeping the Latest Value",
        content:
          "Retention by time or size deletes old records wholesale. **Log compaction** keeps only the newest record per key (plus tombstones for deletes), so a topic can act as a durable, replayable table. Consumers replaying from the start see the latest value for every key, not the full history.\n\nCompaction makes Kafka a source of truth for keyed state — configuration, user profiles, join-side tables — that downstream services rebuild on restart. Combine delete and compact (cleanup.policy=compact,delete) to keep latest values while still expiring truly inactive keys.",
      },
      {
        type: "code",
        heading: "A Compacted Topic for Keyed State",
        language: "bash",
        label: "compact-topic.sh",
        code: `# One key per user; compaction keeps the latest profile per user.
kafka-configs.sh --bootstrap-server broker:9092 --alter \\
  --entity-type topics --entity-name user.profiles \\
  --add-config cleanup.policy=compact,delete \\
  --add-config min.cleanable.dirty.ratio=0.5 \\
  --add-config delete.retention.ms=86400000 \\
  --add-config segment.ms=3600000

# A tombstone (value = null) marks a key as deleted.
# Consumers must handle null values to honor deletions during replay.`,
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Kafka is a partitioned append-only log; consumers track offsets, not deletions",
          "Ordering holds within a partition only — the partition key decides which events stay ordered together",
          "Consumers scale up to the partition count per group; extra members sit idle",
          "Durability requires acks=all AND min.insync.replicas=2 with replication-factor 3",
          "The ISR shrinks when followers lag; a shrunken ISR is a durability warning, not normal",
          "Rebalances pause consumption — prefer cooperative rebalancing and stable group membership",
          "Compaction keeps the latest record per key, turning a topic into a replayable table",
        ],
      },
    ],
    quiz: [
      {
        question: "Where does Kafka guarantee record ordering?",
        options: [
          "Across the whole topic",
          "Within a single partition",
          "Across all partitions for a given key range",
          "Only within one consumer group",
        ],
        correctIndex: 1,
        explanation:
          "Kafka preserves order only within a partition. Records spread across partitions have no defined relative order, which is why keying by an entity id keeps that entity's events ordered in one partition.",
      },
      {
        question:
          "A cluster runs with acks=all and min.insync.replicas=1. What is the durability risk?",
        options: [
          "Producers cannot write at all",
          "An acknowledged write can be lost if the leader dies with no synced follower",
          "Consumers cannot commit offsets",
          "Log compaction is disabled",
        ],
        correctIndex: 1,
        explanation:
          "acks=all only means 'all in-sync replicas acknowledged'. If the ISR has shrunk to just the leader, that is one replica, and losing it loses the write. Pair acks=all with min.insync.replicas of at least 2.",
      },
      {
        question:
          "A 6-partition topic has a consumer group with 10 members. What happens?",
        options: [
          "Each partition is split across two consumers",
          "Four consumers stay idle because there are only 6 partitions",
          "Kafka automatically adds 4 more partitions",
          "The group fails to start",
        ],
        correctIndex: 1,
        explanation:
          "Each partition is assigned to exactly one consumer within a group, so parallelism is capped at the partition count. With 6 partitions and 10 members, 4 members remain idle.",
      },
      {
        question: "What does log compaction preserve in a topic?",
        options: [
          "Every record ever produced, in order",
          "Only the latest record for each key (plus tombstones)",
          "Only records from the last 24 hours",
          "Only records that a consumer has not yet read",
        ],
        correctIndex: 1,
        explanation:
          "Compaction retains the newest record per key and drops older versions, using null-value tombstones to represent deletes. This lets the topic behave like a durable, replayable keyed table.",
      },
    ],
  },

  "managed-queues": {
    slug: "managed-queues",
    title: "Managed Messaging (SQS/SNS)",
    tagline: "Decoupling services with queues, topics, and event buses",
    sections: [
      {
        type: "text",
        heading: "Three Shapes of Managed Messaging",
        content:
          "Managed messaging removes the brokers you have to operate and hands you three primitives. **SQS** is a queue: point-to-point, one message delivered to one competing consumer, then deleted. **SNS** is a pub/sub topic: one message fans out to many subscriptions. **EventBridge** is an event bus: content-based routing across accounts and services, with schema discovery and rules.\n\nEach fits a different job. SQS for work distribution and buffering, SNS for fan-out notifications, EventBridge when routing decisions depend on the event's contents or when you need a central bus that many producers publish to and many rules filter.",
      },
      {
        type: "analogy",
        heading: "Mailbox, Megaphone, and Dispatch Desk",
        content:
          "SQS is a mailbox: whoever empties it first takes the letter, and once delivered it is gone. It buffers work so a slow worker does not crash the sender.\n\nSNS is a megaphone: one announcement, every subscriber hears it, and the sender does not care how many listen. EventBridge is a dispatch desk: every event is posted to the same board, and a clerk reads the label and routes it — only alert-oncall events go to PagerDuty, only order events go to fulfilment.",
      },
      {
        type: "comparison",
        heading: "SQS vs SNS vs EventBridge",
        headers: ["SQS (queue)", "SNS (topic)", "EventBridge (bus)"],
        rows: [
          {
            aspect: "Delivery model",
            "SQS (queue)": "Point-to-point, competing consumers",
            "SNS (topic)": "Pub/sub fan-out to all subscribers",
            "EventBridge (bus)": "Content-based routing to matched rules",
          },
          {
            aspect: "Consumers per message",
            "SQS (queue)": "Exactly one",
            "SNS (topic)": "Every subscription",
            "EventBridge (bus)": "Every rule that matches",
          },
          {
            aspect: "Retention",
            "SQS (queue)": "Up to 14 days",
            "SNS (topic)": "None — push only, with retries",
            "EventBridge (bus)": "None — retries, then a DLQ",
          },
          {
            aspect: "Filtering",
            "SQS (queue)": "None (inspect after receipt)",
            "SNS (topic)": "Subscription filter policies",
            "EventBridge (bus)": "Rich JSON event patterns",
          },
          {
            aspect: "Ordering",
            "SQS (queue)": "Best-effort; FIFO queues are strict",
            "SNS (topic)": "Best-effort; FIFO topics for fan-in",
            "EventBridge (bus)": "Best-effort",
          },
          {
            aspect: "Best for",
            "SQS (queue)": "Work queues and buffering",
            "SNS (topic)": "Broadcast to many endpoints",
            "EventBridge (bus)": "Central event routing and SaaS integration",
          },
        ],
      },
      {
        type: "text",
        heading: "Visibility Timeout and At-Least-Once Delivery",
        content:
          "SQS delivers **at least once**. When a consumer receives a message, the message is not deleted — it becomes invisible for the **visibility timeout** window. If the consumer processes and deletes it in time, done. If the consumer crashes or exceeds the timeout, the message becomes visible again and is redelivered.\n\nTwo failure modes follow. Set the timeout **too short** and a slow-but-successful job is redelivered, causing duplicate work. Set it **too long** and genuinely failed messages wait ages before retrying. The right value is at least the p99 processing time plus a safety margin, and long jobs should call ChangeMessageVisibility to extend the window mid-flight. Because redelivery is expected, consumers must be **idempotent**.",
      },
      {
        type: "code",
        heading: "A Queue With a Dead-Letter Queue",
        language: "yaml",
        label: "sqs.yaml",
        code: `# Dead-letter queue: poison messages land here instead of looping forever.
# Pipeline: after 5 failed receives, SQS moves the message to the DLQ.
Resources:
  OrdersDLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: orders-dlq
      MessageRetentionPeriod: 1209600   # 14 days

  OrdersQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: orders
      VisibilityTimeout: 60             # >= p99 processing time
      MessageRetentionPeriod: 345600    # 4 days
      RedrivePolicy:
        maxReceiveCount: "5"
        deadLetterTargetArn: !GetAtt OrdersDLQ.Arn`,
      },
      {
        type: "text",
        heading: "Dead-Letter Queues and Redrive",
        content:
          "A **DLQ** is where messages go after **maxReceiveCount** failed delivery attempts. Without one, a single malformed message can be received, fail, return, and be received again in an endless loop — a **poison message** that starves all other work in the queue.\n\nA DLQ isolates those messages for inspection and replay. Alarm on the DLQ depth: any non-zero value means something is silently failing. Once the bug is fixed, redrive the DLQ messages back to the source queue. The redrive policy is the single most important queue setting, and it is easy to forget.",
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "FIFO Queues Trade Throughput for Ordering",
        content:
          "Standard SQS queues are nearly unlimited throughput but may deliver out of order and at least once. FIFO queues guarantee order within a message group and deduplicate within a 5-minute window, but historically cap at 300 TPS per queue and 3000 with batching. Ordering is per **MessageGroupId**, not global, so pick a group id that matches the entity whose ordering matters — a group id of a constant value serialises the whole queue and destroys throughput.",
      },
      {
        type: "text",
        heading: "Fan-Out with SNS",
        content:
          "SNS **fan-out** publishes one message to a topic and delivers it to every subscription: SQS queues, Lambda functions, HTTP endpoints, email, and mobile push. The canonical pattern is SNS-to-multiple-SQS: a producer publishes one event to an SNS topic, and several SQS queues each subscribe, so multiple independent consumers process the same event without the producer knowing about any of them.\n\nEach subscription can carry a **filter policy**, so a subscriber receives only the events it cares about. This keeps the producer simple — it publishes everything — while subscribers stay focused. Note that SNS itself has no retention: if a subscriber endpoint is down and retries are exhausted, that copy is lost, so pair SNS with an SQS queue when durability matters.",
      },
      {
        type: "steps",
        heading: "Designing a Reliable Consumer",
        steps: [
          {
            title: "Make processing idempotent",
            detail:
              "At-least-once delivery means duplicates. Key your side effects on a message id or business key so reprocessing is a no-op.",
          },
          {
            title: "Set the visibility timeout above p99",
            detail:
              "Measure real processing time and add margin; extend with ChangeMessageVisibility for long jobs rather than guessing high.",
          },
          {
            title: "Delete only after success",
            detail:
              "Delete the message once the side effect is committed. Deleting before processing silently drops work on failure.",
          },
          {
            title: "Attach a dead-letter queue",
            detail:
              "Set maxReceiveCount so poison messages are quarantined instead of looping, and alarm on DLQ depth.",
          },
          {
            title: "Use long polling",
            detail:
              "Set WaitTimeSeconds up to 20 to cut empty receives, reduce cost, and lower latency versus short polling.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "SQS is a point-to-point queue; SNS is fan-out pub/sub; EventBridge routes by event content",
          "SQS delivers at least once — consumers must be idempotent to survive redelivery",
          "Visibility timeout should exceed p99 processing time, or work gets duplicated",
          "Always configure a DLQ with maxReceiveCount and alarm on its depth",
          "FIFO queues give per-MessageGroupId ordering and dedup at the cost of throughput",
          "Use long polling (WaitTimeSeconds) to reduce empty receives and cost",
          "SNS has no retention — pair it with SQS queues when durability matters",
        ],
      },
    ],
    quiz: [
      {
        question: "What does the visibility timeout control in SQS?",
        options: [
          "How long a message is retained before deletion",
          "How long a received message is hidden from other consumers before being redelivered",
          "The maximum message size",
          "The number of consumers that can read a message",
        ],
        correctIndex: 1,
        explanation:
          "After a consumer receives a message, SQS hides it for the visibility timeout. If the consumer does not delete it in that window — because it crashed or was too slow — the message becomes visible again and is redelivered.",
      },
      {
        question: "Why does a dead-letter queue matter for a work queue?",
        options: [
          "It increases the queue's throughput",
          "It quarantines poison messages after repeated failed receives so they do not loop forever",
          "It guarantees exactly-once delivery",
          "It encrypts messages at rest",
        ],
        correctIndex: 1,
        explanation:
          "Without a DLQ, a message that always fails is received, fails, and returns to the queue indefinitely, starving other work. The redrive policy moves it to the DLQ after maxReceiveCount attempts for inspection and replay.",
      },
      {
        question:
          "A team needs one event processed by three independent services without the producer knowing about them. Which pattern fits?",
        options: [
          "A single SQS queue with three consumers",
          "An SNS topic with three SQS queues subscribed (fan-out)",
          "A FIFO queue with three message groups",
          "A single consumer that calls all three services",
        ],
        correctIndex: 1,
        explanation:
          "SNS fan-out to multiple SQS queues lets each service consume the same event independently. A single SQS queue would give the event to only one consumer, and direct calls couple the producer to every downstream service.",
      },
      {
        question:
          "In a FIFO queue, what determines which messages are guaranteed to stay in order?",
        options: [
          "The queue name",
          "The MessageGroupId",
          "The message size",
          "The visibility timeout",
        ],
        correctIndex: 1,
        explanation:
          "FIFO ordering is guaranteed within a MessageGroupId, not across the whole queue. Using a constant group id for everything serialises the queue and destroys throughput, so the group id should identify the entity whose ordering matters.",
      },
    ],
  },

  "stream-processing": {
    slug: "stream-processing",
    title: "Stream Processing",
    tagline: "Turning unbounded event streams into correct, stateful results",
    sections: [
      {
        type: "text",
        heading: "Bounded vs Unbounded Data",
        content:
          "A batch job sees a **bounded** dataset: it has a beginning and an end, so it can sort, count, and join freely. A stream is **unbounded**: it never ends, so you cannot wait for 'all' the data before producing a result.\n\nStream processors answer this by scoping work into **windows** over time and emitting results incrementally. Kafka Streams and Apache Flink are the two dominant engines; both manage state, handle out-of-order events via watermarks, and offer exactly-once processing. The hard part is never the arithmetic — it is deciding when a window is complete and what to do with data that arrives late.",
      },
      {
        type: "analogy",
        heading: "Counting Cars as They Pass",
        content:
          "A batch job is like reviewing yesterday's traffic-camera footage: you have the whole day in hand and can count every car. A stream is like standing on the bridge counting cars as they drive by — you never see 'the end', so you report counts per minute and keep going.\n\nA car that drives past at 12:01 but whose camera timestamp says 11:59 arrives **late**. How long do you wait before finalising the 11:59 minute? Wait forever and you never publish; wait too little and you miss cars. That tension is exactly the watermark problem.",
      },
      {
        type: "text",
        heading: "Event Time vs Processing Time",
        content:
          "Every event has two clocks. **Event time** is when it actually happened, embedded by the producer. **Processing time** is when the engine observes it. They diverge because of network delays, retries, mobile clients coming back online, and buffered producers.\n\nEvent time is what your business means — a sale counts on the day it happened, not the day the log caught up. Processing time is simpler and lower-latency but produces wrong answers whenever events skew. Correct stream processing works on event time and uses watermarks to decide how long to wait.",
      },
      {
        type: "comparison",
        heading: "Tumbling vs Sliding vs Session Windows",
        headers: ["Tumbling", "Sliding", "Session"],
        rows: [
          {
            aspect: "Shape",
            Tumbling: "Fixed, non-overlapping buckets",
            Sliding: "Fixed size, overlapping by a step",
            Session: "Gap-based, activity-driven",
          },
          {
            aspect: "Example",
            Tumbling: "Every 1 minute",
            Sliding: "Every 10s over the last 60s",
            Session: "30s of inactivity closes a window",
          },
          {
            aspect: "Overlap",
            Tumbling: "None",
            Sliding: "Events belong to several windows",
            Session: "None, but sizes vary",
          },
          {
            aspect: "Cost",
            Tumbling: "Lowest",
            Sliding: "Higher — window count multiplies",
            Session: "State grows with open sessions",
          },
          {
            aspect: "Common use",
            Tumbling: "Per-minute metrics",
            Sliding: "Rolling averages, anomaly checks",
            Session: "User activity, click sessions",
          },
        ],
      },
      {
        type: "text",
        heading: "Watermarks and Late Data",
        content:
          "A **watermark** is the engine's assertion: 'I have probably seen all events with an event time earlier than T.' It lets a windowed operator fire when the watermark passes the window's end, rather than waiting forever.\n\nWatermarks are a heuristic, not a guarantee. A common configuration is a fixed out-of-orderness bound — the watermark trails the max observed event time by, say, 5 minutes. Events arriving after that are **late**. You then choose: drop them (fastest, cheapest, lossy), allow a bounded lateness window so late events still update the result and emit a correction, or route them to a side output for separate handling. Late-data policy is a business decision, not an engine detail.",
      },
      {
        type: "code",
        heading: "A Windowed Aggregate in Flink SQL",
        language: "sql",
        label: "flink-window.sql",
        code: `-- Tumble events into 1-minute event-time windows.
-- A 5s watermark tolerance allows some out-of-order arrival.
SELECT
  window_start,
  window_end,
  region,
  COUNT(*)                AS orders,
  SUM(amount_cents)       AS revenue_cents
FROM TABLE(
  TUMBLE(TABLE orders, DESCRIPTOR(event_time), INTERVAL '1' MINUTE)
)
GROUP BY window_start, window_end, region;

-- Source declares event time and allowed lateness:
-- CREATE TABLE orders (...) WITH (
--   'connector' = 'kafka',
--   'scan.watermark.emit.strategy' = 'on-event',
--   'scan.watermark.idle-timeout'  = '30s'
-- );`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Exactly-Once Is Only As Strong As the Whole Chain",
        content:
          "Exactly-once in Kafka Streams or Flink means exactly-once within the engine and its sinks, via transactions or two-phase commit. Step outside — send an email, POST to an external API — and you are back to at-least-once. The honest pattern is exactly-once state with **idempotent or transactional sinks**: the engine guarantees no duplicates inside the pipeline, and your side effect is written so a replay is harmless. Never assume an external system participates in the engine's transaction.",
      },
      {
        type: "text",
        heading: "State and Checkpointing",
        content:
          "Stateful operators — joins, aggregations, deduplication — keep working state in the engine, backed by a state store (often RocksDB) and, for large state, by a changelog topic. **Checkpoints** snapshot that state periodically to durable storage so a failed task restarts from the last snapshot instead of the beginning of time.\n\nState size is the operational bottleneck. Unbounded key spaces (per-user, per-device) grow forever, and a checkpoint that must copy gigabytes of state per minute will eventually stall the job. **TTL** on state entries, **keyed** operations to keep state shardable, and **incremental checkpoints** for large LSM state are the standard levers. Watch checkpoint duration and size as first-class metrics — rising values predict a job that will not survive a restart.",
      },
      {
        type: "steps",
        heading: "Designing an Event-Time Pipeline",
        steps: [
          {
            title: "Ensure event time is set at the source",
            detail:
              "Embed a trustworthy timestamp in the producer. If only processing time exists, downstream windows are systematically wrong.",
          },
          {
            title: "Declare a watermark strategy",
            detail:
              "Choose a bounded out-of-orderness delay tuned to your sources; use idle-source detection so one quiet partition does not freeze the watermark.",
          },
          {
            title: "Pick the window and allowed lateness",
            detail:
              "Match the window to the metric, and set allowed lateness to how long corrections may still arrive.",
          },
          {
            title: "Decide the late-data policy",
            detail:
              "Drop, correct within lateness, or side-output to a dead-letter stream — and make the choice deliberately.",
          },
          {
            title: "Bound state and checkpoint",
            detail:
              "Apply state TTL, use keyed operations, and enable incremental checkpoints; alarm on checkpoint duration and size.",
          },
          {
            title: "Make sinks idempotent",
            detail:
              "Use transactional sinks where supported, or upsert on a business key so replays overwrite instead of duplicate.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Streams are unbounded; scoping work into time windows is what makes results possible",
          "Process on event time, not processing time, or results are wrong whenever events skew",
          "Watermarks decide when a window fires and define what counts as late data",
          "Windows come in three shapes: tumbling, sliding, and session",
          "Late-data policy — drop, correct, or side-output — is a business choice",
          "Exactly-once holds only inside the engine; external side effects need idempotent sinks",
          "Bound your state with TTL and keying, and treat checkpoint duration as a health signal",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why should stream windows be computed on event time rather than processing time?",
        options: [
          "Event time is faster to compute",
          "It reflects when events actually happened, so results stay correct despite delays and reordering",
          "Processing time cannot be represented in state",
          "Event time uses less memory",
        ],
        correctIndex: 1,
        explanation:
          "Processing time is when the engine sees an event, which drifts with network delays and retries. Event time is when the event actually occurred, so grouping by it produces business-correct results even when events arrive late or out of order.",
      },
      {
        question: "What is a watermark in stream processing?",
        options: [
          "A limit on memory usage",
          "A signal that all events up to a given event time have probably been seen",
          "A type of window",
          "A checkpoint interval",
        ],
        correctIndex: 1,
        explanation:
          "A watermark is the engine's estimate that no more events with an event time earlier than T will arrive. It lets windowed operators decide when to fire without waiting forever, though it is a heuristic and some events may still arrive later as late data.",
      },
      {
        question:
          "A pipeline reads from Kafka, does a stateful aggregation, and calls an external HTTP API. Where can 'exactly-once' actually be claimed?",
        options: [
          "End to end, including the HTTP call",
          "Only within the engine and its transactional Kafka sinks",
          "Nowhere — Kafka Streams is always at-most-once",
          "Only on the external API",
        ],
        correctIndex: 1,
        explanation:
          "Engine-level exactly-once covers the processing and transactional sinks. The moment you perform a non-transactional external side effect like an HTTP call, that step is at-least-once and must be made idempotent to avoid duplicates.",
      },
      {
        question:
          "Which window type closes based on a period of inactivity rather than fixed boundaries?",
        options: ["Tumbling", "Sliding", "Session", "Hopping"],
        correctIndex: 2,
        explanation:
          "Session windows group events that occur close together and close after a gap of inactivity. Their size is driven by activity, so they neither overlap like sliding windows nor have fixed, uniform boundaries like tumbling windows.",
      },
    ],
  },

  "batch-processing": {
    slug: "batch-processing",
    title: "Batch Processing",
    tagline: "Divide-and-conquer over datasets too large for one machine",
    sections: [
      {
        type: "text",
        heading: "Why Batch Still Matters",
        content:
          "Streaming gets the headlines, but most large-scale computation is still batch: nightly revenue rollups, model training sets, index rebuilds, and historical backfills. Batch is where you can afford to read the entire dataset, sort it, and compute exact answers that a streaming approximation cannot.\n\nThe core idea is **divide and conquer** across many machines. Split the input into chunks, process each independently, then combine partial results. The entire field is essentially a study of how to split, how to move data between splits, and how to recover when a worker dies mid-job.",
      },
      {
        type: "analogy",
        heading: "Counting a Stadium's Votes by Section",
        content:
          "To tally 80,000 votes, you do not run one ballot through one machine. You hand each of 200 sections to a steward; each steward counts their pile and reports a partial total; you sum the 200 partials. Every steward works in parallel and independent of the others.\n\nThe expensive part is not the counting — it is gathering ballots for the same candidate from every section so they can be summed together. That gathering step is the **shuffle**, and in real systems it is where nearly all the time and failure live.",
      },
      {
        type: "text",
        heading: "MapReduce: Map, Shuffle, Reduce",
        content:
          "The MapReduce model has three phases. **Map** applies a function to each input record, emitting key-value pairs. **Shuffle** groups all values by key and moves them to the reducer that owns that key. **Reduce** collapses each key's values into a result.\n\nMap is embarrassingly parallel — no coordination needed. Reduce is parallel per key. The shuffle is the bottleneck: it is where data crosses the network, spills to disk, and where a straggler or a hot key stalls everything downstream. Even in Spark, which markets itself as beyond MapReduce, the fundamental phases are the same; Spark just keeps intermediates in memory.",
      },
      {
        type: "code",
        heading: "A Grouped Aggregate and Its Physical Plan",
        language: "sql",
        label: "batch-aggregate.sql",
        code: `-- Logically: group by region, sum revenue. Physically: map + shuffle + reduce.
SELECT region, sum(revenue_cents) AS revenue_cents
FROM orders
WHERE order_date >= DATE '2026-01-01'
GROUP BY region;

-- What the engine does:
-- 1. Scan/parse   -> read only needed columns (partition pruning on order_date)
-- 2. Map          -> partial sums per region within each input split
-- 3. Shuffle      -> repartition partial sums by region across the cluster
-- 4. Reduce       -> merge partials for each region into the final total
--
-- Broadcast the small side of a join instead of shuffling both:
SELECT /*+ BROADCAST(dim) */ f.order_id, dim.name
FROM fact_orders f JOIN dim_region dim ON f.region_id = dim.region_id;`,
      },
      {
        type: "text",
        heading: "The Shuffle Is the Cost",
        content:
          "Everything expensive in distributed batch is the shuffle. It writes intermediate data to disk, sends it across the network, and re-reads it on the other side. A job's stage boundaries are exactly its shuffle boundaries — Spark stages are split wherever a repartition is required.\n\nReducing shuffles is the primary performance lever. **Partition pruning** reads less input. **Predicate pushdown** filters before moving data. **Broadcast joins** send a small dimension table to every executor instead of shuffling the large fact table. **Bucketing** pre-partitions data on a join key so the shuffle can be skipped entirely. Each of these removes a network crossing, and network is the slowest, least reliable resource in the cluster.",
      },
      {
        type: "comparison",
        heading: "MapReduce vs Spark vs Distributed SQL",
        headers: [
          "MapReduce (Hadoop)",
          "Spark",
          "Distributed SQL (Trino/Spark SQL)",
        ],
        rows: [
          {
            aspect: "Intermediate storage",
            "MapReduce (Hadoop)": "Disk between every stage",
            Spark: "In-memory, spills to disk",
            "Distributed SQL (Trino/Spark SQL)": "In-memory with pipelining",
          },
          {
            aspect: "Iterative work (ML)",
            "MapReduce (Hadoop)": "Very slow — re-reads disk each pass",
            Spark: "Fast — cached RDDs/DataFrames",
            "Distributed SQL (Trino/Spark SQL)": "Not the primary use case",
          },
          {
            aspect: "Programming model",
            "MapReduce (Hadoop)": "Low-level map/reduce functions",
            Spark: "Rich DataFrame/Dataset APIs",
            "Distributed SQL (Trino/Spark SQL)": "Declarative SQL",
          },
          {
            aspect: "Optimizer",
            "MapReduce (Hadoop)": "Manual tuning",
            Spark: "Catalyst plan optimizer",
            "Distributed SQL (Trino/Spark SQL)": "Cost-based query planner",
          },
          {
            aspect: "Typical use",
            "MapReduce (Hadoop)": "Legacy ETL pipelines",
            Spark: "General ETL and ML pipelines",
            "Distributed SQL (Trino/Spark SQL)":
              "Interactive analytics on the lake",
          },
        ],
      },
      {
        type: "text",
        heading: "Partitioning and Data Skew",
        content:
          "A good partition key spreads work evenly and keeps related rows together. Partition by date and you prune whole days cheaply; partition by a high-cardinality id and you get even parallelism. Partitioning by the join key can eliminate a shuffle by co-locating matching rows.\n\n**Skew** is the enemy. If one key holds a huge share of rows — a null customer_id, a default region, a whale tenant — one task processes most of the data while the rest idle. Symptoms: one task in a stage takes 10x the median, the shuffle spill is enormous, or the job has a long tail. Fixes include salting the hot key (append a random suffix, aggregate in two passes), broadcasting the small side, splitting the skewed key into its own path, or enabling adaptive query execution that detects and splits large partitions at runtime.",
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Backfills Break Naive Pipelines",
        content:
          "Reprocessing 90 days of history on a pipeline designed for a daily slice routinely melts clusters: 90x the data, 90x the shuffle, and often a partition-per-day assumption that no longer holds. Before any backfill, size the work, check that tasks are idempotent and safely re-runnable for past dates, throttle concurrency, and write to a staging location before swapping it in. A backfill is a production workload, not a one-off script.",
      },
      {
        type: "steps",
        heading: "Running a Safe Backfill",
        steps: [
          {
            title: "Confirm the job is idempotent",
            detail:
              "Re-running a date must overwrite that partition cleanly, not append duplicates. Verify the write mode (overwrite-by-partition, not append).",
          },
          {
            title: "Size the blast radius",
            detail:
              "Estimate input volume and shuffle size for the full range; if it is 90x a daily run, plan resource and cost accordingly.",
          },
          {
            title: "Throttle concurrency",
            detail:
              "Run a limited number of days in parallel so the backfill does not starve the regular scheduled jobs sharing the cluster.",
          },
          {
            title: "Write to staging, then swap",
            detail:
              "Land results in a temporary partition set, validate row counts and key metrics, then atomically promote them to the live tables.",
          },
          {
            title: "Validate and reconcile",
            detail:
              "Compare totals against a trusted source for a sample of days before declaring the backfill complete.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Batch splits data across machines, processes in parallel, then combines partial results",
          "Map is embarrassingly parallel; reduce is parallel per key; the shuffle is the bottleneck",
          "Stage boundaries are shuffle boundaries — fewer shuffles mean faster jobs",
          "Broadcast joins, partition pruning, and bucketing each remove a network crossing",
          "Skew makes one task carry most of the load; salt hot keys or split them out",
          "Backfills are production workloads — verify idempotency, throttle, and stage the output",
        ],
      },
    ],
    quiz: [
      {
        question:
          "In MapReduce, which phase is typically the performance bottleneck?",
        options: [
          "Map, because it reads all input",
          "Shuffle, because it writes and moves intermediate data across the network",
          "Reduce, because it must sort the final output",
          "There is no bottleneck; all phases are equally fast",
        ],
        correctIndex: 1,
        explanation:
          "The shuffle groups values by key and moves them between machines, incurring disk writes and network transfer. Map is embarrassingly parallel and reduce is parallel per key, but the shuffle is where time and failures concentrate.",
      },
      {
        question:
          "A stage has one task running 10x longer than the rest. What is the most likely cause?",
        options: [
          "Too many partitions",
          "Data skew — one key holds a disproportionate share of rows",
          "The broadcast join is too large",
          "The cluster has too much memory",
        ],
        correctIndex: 1,
        explanation:
          "A single slow task while others idle is the classic signature of skew: a hot key such as a null or default value funnels most rows to one reducer. Salting the key, broadcasting, or splitting the hot key fixes it.",
      },
      {
        question:
          "Why can a broadcast join be faster than a standard shuffle join?",
        options: [
          "It sorts both tables before joining",
          "It sends the small table to every executor, avoiding a shuffle of the large table",
          "It always produces fewer rows",
          "It disables the query optimizer",
        ],
        correctIndex: 1,
        explanation:
          "A broadcast join replicates the small table to all executors so each can join locally without repartitioning the large table. That eliminates the expensive shuffle of the big side, provided the broadcast side fits in memory.",
      },
      {
        question:
          "What is the most important property a job must have before running a large backfill?",
        options: [
          "It must stream results in real time",
          "It must be idempotent, so re-running a past partition overwrites cleanly",
          "It must use acks=all",
          "It must run on a single machine",
        ],
        correctIndex: 1,
        explanation:
          "Backfills reprocess past data and may be retried after failure. If the job appends instead of overwriting per partition, re-runs create duplicate rows. Idempotent, partition-overwriting writes make backfills safe and repeatable.",
      },
    ],
  },

  "data-pipelines": {
    slug: "data-pipelines",
    title: "Data Pipelines & Orchestration",
    tagline: "Orchestrating reliable, idempotent, backfill-safe DAGs",
    sections: [
      {
        type: "text",
        heading: "Orchestration Is Not Transformation",
        content:
          "A data pipeline moves data from sources to a destination through a series of steps, and an **orchestrator** decides when each step runs, in what order, and what to do when one fails. Airflow and Dagster are the two most common orchestrators; dbt handles the SQL transformation layer; tools like Spark and Flink do the heavy compute.\n\nSeparate the concerns: the orchestrator schedules and retries, the compute engine transforms, and a storage layer persists. Teams that blur these end up with brittle DAGs that mix scheduling logic with business logic and cannot be tested, backfilled, or reasoned about in isolation.",
      },
      {
        type: "analogy",
        heading: "Air Traffic Control vs the Flights",
        content:
          "An airport's control tower does not fly the planes — it sequences them. It decides which plane takes off when, holds planes when a runway is blocked, and reroutes around weather. The pilots fly; the tower coordinates.\n\nAn orchestrator is the tower. The tasks are the flights. A good tower knows the dependency graph (this plane cannot land until that gate clears), retries safely (a go-around is fine), and can replan the whole schedule after a storm — which is exactly what a **backfill** is: re-running a past schedule deliberately.",
      },
      {
        type: "text",
        heading: "DAGs and Task Dependencies",
        content:
          "Pipelines are expressed as a **DAG** — a directed acyclic graph. Each node is a task; each edge is a dependency meaning 'must complete before'. Acyclic matters: a cycle would mean a step waiting on itself, which can never start.\n\nThe DAG encodes parallelism. Independent branches run concurrently; dependent branches wait. Crucially, tasks should be **idempotent** and the DAG should be **deterministic per run** — a task must produce the same result for the same logical interval whether it is the first run or a retry. Parameterise tasks by interval (the date range they process), not by wall-clock 'now', so a backfill can replay any period.",
      },
      {
        type: "code",
        heading: "A Parameterised, Idempotent DAG",
        language: "yaml",
        label: "pipeline.yaml",
        code: `# Each task is scoped to a logical interval, not "now".
# Re-running this job for 2026-11-01 overwrites that partition cleanly.
name: daily_orders_rollup
schedule: "0 3 * * *"       # 03:00 daily
catchup: true               # allow historical runs / backfills

tasks:
  extract_orders:
    inputs:  { interval: "{{ ds }}" }         # ds = logical date
    output:  s3://lake/bronze/orders/dt={{ ds }}
    retries: 3
    retry_delay: "5m"

  transform_rollup:
    depends_on: [extract_orders]
    inputs:  { partition: "s3://lake/bronze/orders/dt={{ ds }}" }
    output:  s3://lake/gold/orders_rollup/dt={{ ds }}
    mode: overwrite_partition    # idempotent: replace, never append

  validate:
    depends_on: [transform_rollup]
    check: "row_count > 0 AND null_rate(order_id) == 0"`,
      },
      {
        type: "text",
        heading: "Idempotency: The Single Most Important Property",
        content:
          "A task is **idempotent** if running it twice with the same input yields the same result as running it once. Orchestrators retry failed tasks by design, so every task will eventually run more than once — after a timeout, a worker crash, or an ambiguous failure where the work succeeded but the acknowledgement was lost.\n\nNon-idempotent tasks are the source of silent data corruption. An `INSERT` that should be an `UPSERT` doubles rows on retry. A counter increment that should be a set drifts. An append that should be an overwrite duplicates a partition. The idiom is to make every write **replace-by-key or replace-by-partition**: delete the target slice then write, use MERGE/UPSERT, or write to a new location and atomically swap it in.",
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "The Silent Double-Write",
        content:
          "The nastiest failure is not a crash — it is a task that succeeds but is retried. The orchestrator sees a timeout, reruns the task, and the side effect happens twice: two payment records, two partition appends, doubled metrics. Because a timeout does not tell you whether the work completed, you must assume it did. Idempotent writes turn this from a data incident into a harmless no-op. If a downstream step truly cannot be made idempotent, isolate it, make it last, and gate it behind an explicit one-shot marker.",
      },
      {
        type: "comparison",
        heading: "ETL vs ELT",
        headers: ["ETL (transform before load)", "ELT (load then transform)"],
        rows: [
          {
            aspect: "Order",
            "ETL (transform before load)": "Extract, transform, then load",
            "ELT (load then transform)":
              "Extract, load raw, then transform in place",
          },
          {
            aspect: "Engine doing the work",
            "ETL (transform before load)": "A separate processing server",
            "ELT (load then transform)": "The warehouse or lakehouse itself",
          },
          {
            aspect: "Raw data retained",
            "ETL (transform before load)": "Often not — transformed only",
            "ELT (load then transform)":
              "Yes — raw is preserved for reprocessing",
          },
          {
            aspect: "Reprocessing",
            "ETL (transform before load)": "Requires re-extracting from source",
            "ELT (load then transform)":
              "Re-run transforms against stored raw data",
          },
          {
            aspect: "Fit",
            "ETL (transform before load)":
              "Legacy, strict data quality, limited warehouse compute",
            "ELT (load then transform)":
              "Modern cloud warehouses with cheap, elastic compute",
          },
        ],
      },
      {
        type: "text",
        heading: "Backfills and Catch-up",
        content:
          "A **backfill** re-runs a pipeline for a past interval — after a bug fix, a new metric, or a late source. The scheduler must support it without colliding with the live schedule: catchup runs every missed interval in order, while backfill lets you replay a specific range on demand.\n\nBackfills expose every hidden assumption. If a task reads 'today' instead of the interval, a backfill silently reprocesses the wrong data. If writes append, replaying duplicates. If the pipeline reads from a source that only holds 30 days, older backfills find nothing. Design for it up front: interval-parameterised tasks, idempotent writes, immutable raw storage, and a way to run a range in a separate namespace before promoting it.",
      },
      {
        type: "steps",
        heading: "Making a Task Idempotent",
        steps: [
          {
            title: "Scope the task to a logical interval",
            detail:
              "Pass the date range or partition as a parameter. Never read 'now' inside the task body.",
          },
          {
            title: "Write by replace, not append",
            detail:
              "Delete-then-insert the target slice, use MERGE/UPSERT on a business key, or write to a temp location and swap it in.",
          },
          {
            title: "Make side effects deterministic",
            detail:
              "Given the same interval, the task must emit identical output — no random ids, no timestamps that change per run.",
          },
          {
            title: "Record completion markers",
            detail:
              "For steps that cannot be idempotent, write a one-shot marker so a retry can detect the work already happened.",
          },
          {
            title: "Test by running twice",
            detail:
              "Run the task, run it again, and assert the outputs match exactly. If the second run changes anything, it is not idempotent.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Separate orchestration from transformation: the orchestrator schedules and retries, engines compute",
          "Model pipelines as DAGs; acyclic dependencies define what can run in parallel",
          "Parameterise tasks by logical interval, never by wall-clock 'now'",
          "Idempotency is non-negotiable — retries are inevitable, so re-runs must be no-ops",
          "Write by replace (partition or key), not append, to survive retries and backfills",
          "ELT keeps raw data so transforms can be re-run without re-extracting from source",
          "Design for backfills up front: catchup, replay ranges, and immutable raw storage",
        ],
      },
    ],
    quiz: [
      {
        question: "Why must data pipeline tasks be idempotent?",
        options: [
          "To reduce the compute cost of each run",
          "Because orchestrators retry tasks, so each may run more than once and must not double-write",
          "Because DAGs cannot contain retries",
          "Because SQL requires it",
        ],
        correctIndex: 1,
        explanation:
          "Orchestrators retry on timeouts and crashes, and a failed task may have actually succeeded. Idempotent writes — replace-by-partition or upsert — make a re-run produce the same result rather than duplicating rows.",
      },
      {
        question:
          "Why should a task be parameterised by a logical interval rather than reading the current time?",
        options: [
          "It uses less memory",
          "So backfills and retries process the correct historical range instead of reprocessing 'today'",
          "So the DAG becomes acyclic",
          "So tasks run in parallel",
        ],
        correctIndex: 1,
        explanation:
          "A task that reads 'now' always processes the current period, so replaying it for a past date does the wrong thing. Passing the interval explicitly lets the same task reprocess any period correctly.",
      },
      {
        question: "What is the key difference between ELT and ETL?",
        options: [
          "ELT transforms in the warehouse after loading raw data; ETL transforms before loading",
          "ELT cannot use SQL",
          "ETL keeps raw data while ELT discards it",
          "They are identical",
        ],
        correctIndex: 0,
        explanation:
          "ELT loads raw data into the target (typically a cloud warehouse or lakehouse) and transforms it there, keeping raw for reprocessing. ETL transforms data on a separate engine before loading it into the target.",
      },
      {
        question: "What makes a DAG structurally invalid?",
        options: [
          "It has many tasks",
          "It contains a cycle, meaning a task transitively depends on itself",
          "It runs on a schedule",
          "It has parallel branches",
        ],
        correctIndex: 1,
        explanation:
          "A DAG must be acyclic. A cycle means a task can never start because it waits on itself, directly or transitively. Parallel branches and large task counts are perfectly valid.",
      },
    ],
  },

  // ─── DATA ENGINES ───────────────────────────────────────────────────────

  lakehouse: {
    slug: "lakehouse",
    title: "Data Lake & Lakehouse",
    tagline:
      "Warehouse semantics on cheap object storage, with open table formats",
    sections: [
      {
        type: "text",
        heading: "From Data Warehouse to Lakehouse",
        content:
          "A **data warehouse** stores structured data in a proprietary format and gives you ACID transactions, schemas, and fast SQL — but at a cost premium and with vendor lock-in. A **data lake** is cheap object storage (S3, GCS, ADLS) holding files in any format — flexible and inexpensive, but with no transactions, no schema enforcement, and a tendency to degrade into a 'data swamp'.\n\nThe **lakehouse** bets you can have both: open columnar files on cheap storage, wrapped by a **table format** (Iceberg, Delta Lake, Hudi) that adds ACID transactions, schema evolution, time travel, and efficient metadata. Compute can then be swapped freely because the data format is open.",
      },
      {
        type: "analogy",
        heading: "Shipping Containers",
        content:
          "Before containerisation, every port loaded cargo by hand, in its own way, and goods were damaged in transit. The standardised steel container changed everything: any crane, any ship, any truck could move any container.\n\nA lakehouse table format is the shipping container for data. Parquet is the standard box; the table format is the standard way to stack, label, and track those boxes so any engine can read them consistently and safely. Open formats mean you are not locked to one port.",
      },
      {
        type: "text",
        heading: "Columnar Files: Parquet",
        content:
          "**Parquet** is the default file format of the lake. It stores data column by column, compresses each column with encodings tuned to its type, and keeps per-column statistics (min/max) in the footer. Those statistics enable **predicate pushdown**: an engine reads the footer, sees that a row group cannot contain matching values, and skips it entirely.\n\nParquet files should be reasonably large — a good target is 128 MB to 1 GB per file. Too many tiny files crush metadata operations and listing time; too few giant files limit parallelism. **Row groups** (roughly 128 MB, the unit of skipping) and **compression** (Snappy for speed, ZSTD for ratio) are the two knobs you tune most.",
      },
      {
        type: "text",
        heading: "Table Formats Add the Missing ACID",
        content:
          "Object storage is not a filesystem: it has no rename, no atomic multi-file commit, and eventual consistency quirks. A table format solves this by keeping a **transaction log** of metadata — which files comprise the table at each version — and committing changes by atomically writing a new metadata pointer.\n\nThat metadata log is what enables the lakehouse guarantees. **Snapshot isolation** gives readers a consistent view even while writers commit. **Time travel** reads the table as of any prior version. **Schema evolution** adds or renames columns without rewriting data. **Row-level deletes** handle upserts. Old files are not overwritten in place — commits are immutable, and a maintenance job compacts small files and expires old snapshots.",
      },
      {
        type: "comparison",
        heading: "Iceberg vs Delta Lake vs Hudi",
        headers: ["Apache Iceberg", "Delta Lake", "Apache Hudi"],
        rows: [
          {
            aspect: "Origin",
            "Apache Iceberg": "Netflix, then Apache",
            "Delta Lake": "Databricks, then Linux Foundation",
            "Apache Hudi": "Uber, then Apache",
          },
          {
            aspect: "Metadata model",
            "Apache Iceberg": "Manifest tree + snapshot log",
            "Delta Lake": "JSON log + Parquet checkpoints",
            "Apache Hudi": "Timeline of commits + metadata table",
          },
          {
            aspect: "Hidden partitioning",
            "Apache Iceberg": "Yes — partition transforms hidden from queries",
            "Delta Lake": "Explicit partition columns",
            "Apache Hudi": "Partitioning plus clustering",
          },
          {
            aspect: "Strengths",
            "Apache Iceberg": "Engine-neutral, best-in-class evolution",
            "Delta Lake": "Deep Spark/Databricks integration",
            "Apache Hudi": "Fast upserts and incremental pulls",
          },
          {
            aspect: "Typical use",
            "Apache Iceberg": "Multi-engine open lakehouse",
            "Delta Lake": "Lakehouse within a Spark ecosystem",
            "Apache Hudi": "Streaming ingest with frequent updates",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "The Small-Files Problem",
        content:
          "Streaming writers create a new file per micro-batch, so within days a table can hold millions of tiny files. Queries then spend most of their time opening files rather than reading data, and metadata grows unbounded. Table formats hide the pain with background compaction (rewriting many small files into few large ones) and snapshot expiry, but you must actually run those maintenance jobs. Alarm on average file size and file count per partition; a healthy lakehouse has files measured in the hundreds of megabytes, not kilobytes.",
      },
      {
        type: "text",
        heading: "Medallion Architecture: Bronze, Silver, Gold",
        content:
          "The **medallion** pattern organises a lakehouse into progressive layers of increasing quality. **Bronze** is raw, append-only data exactly as received — never transformed, so it can always be reprocessed. **Silver** is cleaned, deduplicated, conformed data: typed, validated, joined into entities. **Gold** is business-level aggregates and wide tables shaped for dashboards and ML.\n\nEach layer adds trust and subtracts detail. Because bronze is immutable raw, a bug in the silver transform can be fixed and silver rebuilt without asking sources for data again. This is the lakehouse's superpower: keep the raw layer forever, and every downstream layer is reproducible.",
      },
      {
        type: "steps",
        heading: "Layers of a Medallion Pipeline",
        steps: [
          {
            title: "Land raw into bronze",
            detail:
              "Append source data unchanged, partitioned by ingest date. Never mutate or delete — this is your replayable source of truth.",
          },
          {
            title: "Clean and conform into silver",
            detail:
              "Cast types, deduplicate on a business key, enforce schema, and join reference data into trustworthy entities.",
          },
          {
            title: "Aggregate into gold",
            detail:
              "Build business metrics and wide tables shaped for BI and ML consumers, refreshed from silver.",
          },
          {
            title: "Run maintenance",
            detail:
              "Compact small files, expire old snapshots, and rewrite manifests so metadata stays small and reads stay fast.",
          },
        ],
      },
      {
        type: "text",
        heading: "Catalogs: The Missing Directory",
        content:
          "A table format stores a table's metadata, but something still has to answer 'which tables exist and where is each one's metadata?' That is the **catalog**. Hive Metastore is the legacy answer; the **REST catalog** spec and AWS Glue are the modern ones, and a catalog is what lets multiple engines — Spark, Trino, Flink — see the same tables.\n\nWithout a shared catalog you get fragmentation: each engine has its own idea of the tables, and 'the same table' means two different things. Governance also hangs off the catalog: fine-grained access control, tagging, lineage, and audit all attach to catalog entries. Choosing an open, shared catalog is what makes the 'open lakehouse' actually open.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "A lakehouse adds warehouse guarantees (ACID, schema, time travel) to open columnar files on cheap storage",
          "Parquet is columnar with per-column stats, enabling predicate pushdown and skipping",
          "Target file sizes of roughly 128 MB to 1 GB — tiny files wreck read performance",
          "Iceberg, Delta, and Hudi wrap files with an atomic metadata log for transactions and snapshots",
          "Run compaction and snapshot expiry, or the small-files problem will bury your queries",
          "Medallion layers (bronze, silver, gold) preserve raw data so every downstream layer is reproducible",
          "A shared open catalog is what lets multiple engines agree on the same tables",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What does a table format like Iceberg or Delta add on top of Parquet files?",
        options: [
          "Faster compression of Parquet",
          "An atomic metadata transaction log giving ACID guarantees, time travel, and schema evolution",
          "A new columnar encoding",
          "A replacement for object storage",
        ],
        correctIndex: 1,
        explanation:
          "Parquet provides columnar storage and stats but no transactions. The table format adds a metadata log committed atomically, which enables snapshot isolation, time travel, schema evolution, and row-level operations without rewriting data.",
      },
      {
        question: "Why is the small-files problem damaging in a lakehouse?",
        options: [
          "It increases storage cost only",
          "Queries spend their time opening files and listing metadata instead of reading data",
          "It prevents Parquet compression",
          "It makes time travel impossible",
        ],
        correctIndex: 1,
        explanation:
          "Millions of tiny files mean high per-file overhead and bloated metadata, so query time goes to opening files rather than reading data. Background compaction rewrites many small files into fewer large ones.",
      },
      {
        question:
          "In the medallion architecture, why is the bronze layer kept raw and immutable?",
        options: [
          "Because it is the fastest to query",
          "So that downstream layers can be rebuilt from raw data without re-extracting from sources",
          "Because raw data cannot be partitioned",
          "Because bronze must be columnar",
        ],
        correctIndex: 1,
        explanation:
          "Keeping an immutable raw layer means a bug in a silver or gold transform can be fixed and the layer rebuilt by reprocessing bronze. Raw data becomes the replayable source of truth for the whole pipeline.",
      },
      {
        question: "What is the role of a catalog in a lakehouse?",
        options: [
          "It compresses Parquet files",
          "It tracks which tables exist and where their metadata lives, so multiple engines agree",
          "It replaces the object store",
          "It runs the SQL queries",
        ],
        correctIndex: 1,
        explanation:
          "The catalog maps table names to their metadata locations and is the shared point of truth that lets Spark, Trino, and Flink see the same tables. Governance features like access control and lineage also attach to catalog entries.",
      },
    ],
  },

  "schema-registry": {
    slug: "schema-registry",
    title: "Schema Registry & Governance",
    tagline: "Evolving data contracts without breaking every consumer",
    sections: [
      {
        type: "text",
        heading: "Why a Schema Registry Exists",
        content:
          "Producers and consumers of an event stream must agree on the shape of the data. If a producer renames a field, drops a field, or changes a type, every consumer breaks — silently, if they are parsing loosely. A **schema registry** is a central service that stores versioned schemas and enforces compatibility rules so changes cannot break existing readers.\n\nKafka does not ship with one; you deploy a registry (Confluent Schema Registry is the common choice) and producers register a schema, receive an id, and embed that id in each message. Consumers fetch the schema by id and deserialize. The registry is the contract enforcement point for the whole stream.",
      },
      {
        type: "analogy",
        heading: "Contracts, Not Handshakes",
        content:
          "Two businesses can cooperate on a handshake — until one changes the deal and the other never hears about it. A written contract fixes the terms, requires agreement before changes, and lets either side hold the other to what was signed.\n\nSchemas in a registry are that contract. The registry is the notary: it will not notarise a new version that violates the agreed compatibility rules. Producers change the contract only in ways existing consumers can still honour, and consumers always know which version they are reading.",
      },
      {
        type: "text",
        heading: "Compatibility Modes",
        content:
          "The registry decides whether a new schema is allowed based on a **compatibility mode**.\n\n**Backward** (the default) means new consumers can read old data — you may add optional fields or delete fields. **Forward** means old consumers can read new data — you may add fields (that old readers ignore) or delete optional ones, but not reorder or retype. **Full** means both backward and forward: only add or remove optional fields with defaults. **None** disables checks, which is fine in a sandbox and dangerous in production. The right choice depends on whether you upgrade consumers or producers first.",
      },
      {
        type: "comparison",
        heading: "Compatibility Modes",
        headers: ["Backward", "Forward", "Full"],
        rows: [
          {
            aspect: "New consumer reads old data",
            Backward: "Yes",
            Forward: "No",
            Full: "Yes",
          },
          {
            aspect: "Old consumer reads new data",
            Backward: "No",
            Forward: "Yes",
            Full: "Yes",
          },
          {
            aspect: "Upgrade order",
            Backward: "Consumers first",
            Forward: "Producers first",
            Full: "Either order",
          },
          {
            aspect: "Allowed changes",
            Backward: "Add optional or delete fields",
            Forward: "Add or delete optional fields",
            Full: "Add or delete optional fields with defaults",
          },
          {
            aspect: "Strictness",
            Backward: "Moderate",
            Forward: "Moderate",
            Full: "Strictest",
          },
        ],
      },
      {
        type: "text",
        heading: "Avro vs Protobuf vs JSON Schema",
        content:
          "**Avro** is compact and schema-driven: the schema travels separately (in the registry) and the binary payload carries only values, so messages are small and evolution is well-defined field-by-field. It is the traditional Kafka choice.\n\n**Protobuf** is schema-driven too, with numbered fields, but ships generated code and is dominant for gRPC service contracts and cross-language APIs. Its numbered fields give strong, explicit evolution rules. **JSON Schema** is human-readable and universal but verbose on the wire and slower to parse; it is common in web-facing event buses. The trade: Avro and Protobuf are binary and efficient with rigorous evolution; JSON is transparent and easy to debug.",
      },
      {
        type: "code",
        heading: "An Evolving Avro Schema",
        language: "json",
        label: "order-event.avsc",
        code: `{
  "type": "record",
  "name": "OrderEvent",
  "namespace": "com.example.orders",
  "fields": [
    { "name": "order_id", "type": "string" },
    { "name": "amount_cents", "type": "long" },
    { "name": "currency", "type": "string" },
    { "name": "coupon_code", "type": ["null", "string"], "default": null },
    { "name": "channel", "type": "string", "default": "web" }
  ]
}
`,
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Renames and Retypes Break Everything",
        content:
          "Adding an optional field with a default is safe in every mode. Renaming a field is not: it looks like a delete plus an add, and in Avro it breaks readers unless you use an explicit alias. Changing a type from int to string, or making a previously optional field required, breaks compatibility. Required fields must never be added without a default, or old data becomes unreadable. The registry will reject these — do not run with compatibility set to NONE to bypass it.",
      },
      {
        type: "text",
        heading: "Data Contracts and Governance",
        content:
          "A **data contract** is a schema plus the agreements around it: who owns the stream, what the fields mean, what the quality guarantees are, and how changes are announced. The registry enforces the structural part; governance covers the human part.\n\nGovernance asks: who may publish to this topic, who may read it, which fields are PII, and what is the retention policy? A registry with compatibility rules but no ownership metadata degrades into a schema dump. Mature platforms attach owner, description, SLA, and classification to each schema, version-quarantine breaking changes, and require approval before promoting them — treating data as a product with consumers who must not be broken by surprise.",
      },
      {
        type: "steps",
        heading: "Evolving a Schema Safely",
        steps: [
          {
            title: "Change only in a compatible direction",
            detail:
              "Add optional fields with defaults, or remove fields no longer needed. Never rename or retype in place.",
          },
          {
            title: "Set the compatibility mode deliberately",
            detail:
              "Backward if consumers upgrade first, Forward if producers do, Full when you want either order to be safe.",
          },
          {
            title: "Register and validate before deploying",
            detail:
              "Push the new schema to the registry in CI; a rejected schema fails the build, not production at 3 a.m.",
          },
          {
            title: "Migrate gradually",
            detail:
              "Produce both old and new fields during a transition, backfill the new field, then remove the old one in a later version.",
          },
          {
            title: "Record ownership and meaning",
            detail:
              "Attach owner, description, and PII classification so the contract is a governed artifact, not just a file.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "A schema registry stores versioned schemas and enforces compatibility so changes cannot silently break consumers",
          "Producers embed a schema id; consumers fetch the schema by id to deserialize",
          "Backward = new readers read old data; Forward = old readers read new data; Full = both",
          "Adding optional fields with defaults is safe; renaming or retyping fields is not",
          "Avro and Protobuf are compact binary formats with rigorous evolution; JSON Schema is readable but verbose",
          "Compatibility NONE is a sandbox escape hatch, not a production setting",
          "A data contract adds ownership, meaning, and quality guarantees on top of the schema",
        ],
      },
    ],
    quiz: [
      {
        question:
          "In BACKWARD compatibility mode, what may a schema change do?",
        options: [
          "Rename a field freely",
          "Add optional fields or delete fields, so new consumers can read old data",
          "Change a field's type",
          "Nothing at all",
        ],
        correctIndex: 1,
        explanation:
          "Backward compatibility means a new consumer can read data written with the old schema, achieved by adding optional fields or deleting fields. Renaming or retyping breaks it, which is why the registry rejects such changes.",
      },
      {
        question:
          "A producer must change first, before any consumer is upgraded. Which compatibility mode fits?",
        options: ["Backward", "Forward", "None", "Full"],
        correctIndex: 1,
        explanation:
          "Forward compatibility means old consumers can read new data, which is required when the producer upgrades before consumers. Full is a stronger choice that allows either upgrade order but is more restrictive on allowed changes.",
      },
      {
        question:
          "Which change is generally safe under most compatibility modes?",
        options: [
          "Renaming a field",
          "Adding an optional field with a default value",
          "Changing a field's type from int to string",
          "Making an optional field required",
        ],
        correctIndex: 1,
        explanation:
          "Adding an optional field with a default is safe because existing data can omit it and readers supply the default. Renames, retypes, and newly required fields break compatibility and are rejected by the registry.",
      },
      {
        question: "What does a data contract add beyond the schema itself?",
        options: [
          "Faster serialization",
          "Ownership, field meaning, quality guarantees, and change process around the schema",
          "Automatic schema conversion",
          "Less storage usage",
        ],
        correctIndex: 1,
        explanation:
          "A schema defines structure; a data contract adds the human and operational agreements: who owns the stream, what fields mean, what quality is promised, and how changes are governed and announced.",
      },
    ],
  },
};

