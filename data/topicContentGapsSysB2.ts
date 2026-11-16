// Gap content: System Design case studies (part B2)
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_GAPS_SYS_B2: Record<string, TopicContent> = {
  "design-ad-click-aggregator": {
    slug: "design-ad-click-aggregator",
    title: "Design an Ad Click Aggregator",
    tagline:
      "Millions of clicks per second, counted once, queryable in seconds",
    sections: [
      {
        type: "text",
        heading: "Defining the Problem",
        content:
          "Design a system that ingests a firehose of ad click and impression events — hundreds of thousands to millions per second — and answers questions like: how many clicks did campaign 88213 get in the last 60 seconds, and how many impressions converted to clicks by region today? The visible product is a near-real-time dashboard. The invisible product is a distributed counting system.\n\nThe hard parts are not storing clicks. They are deduplicating retried events by click ID, counting each click exactly once even though the pipeline delivers at least once, and serving correct time-windowed aggregates fast enough to drive billing and reporting.",
      },
      {
        type: "text",
        heading: "Functional and Non-Functional Requirements",
        content:
          "**Functional:** ingest click and impression events at high volume; deduplicate by click ID; aggregate counts by ad, campaign, and dimensions such as region and device; answer time-windowed queries over the last minute, hour, and day; retain raw events for reprocessing and audit; expose aggregates through a low-latency query API.\n\n**Non-functional:** absorb millions of events per second at peak; a few seconds of end-to-end freshness for real-time dashboards; exactly-once effect so counts never over- or under-report; horizontal scalability; durability so no billed click is lost; and cheap long-term storage for raw history.",
      },
      {
        type: "analogy",
        heading: "The Stadium Turnstiles",
        content:
          "Picture a stadium with hundreds of turnstiles. Each turnstile clicks a counter every time a fan passes through, and every few seconds a runner walks the concourse collecting the numbers into a single total.\n\nNow imagine one fan scans their ticket, the gate hesitates, and they scan again — the turnstile clicks twice for one person and the total is wrong. A click aggregator is those turnstiles plus a runner who recognises the same ticket and refuses to count it a second time, no matter how many times the pipeline replays the scan.",
      },
      {
        type: "text",
        heading: "Back-of-the-Envelope Estimation",
        content:
          "Assume an ad network sees 500,000 clicks a second on an ordinary day and 2,000,000 during a major event — a 4x peak factor. At roughly 200 bytes per event that is about 400 MB/s of ingest at peak, and roughly 43 billion events a day.\n\nRaw events at 200 bytes each are around 8.6 TB a day: cheap to store, expensive to query directly. The value comes from rollups. One row per ad per minute collapses a firehose into something a dashboard can scan in milliseconds, and the raw stream is kept only for replay and audit.",
      },
      {
        type: "code",
        heading: "Sizing the Ingest Path",
        language: "typescript",
        label: "ad-click-sizing.ts",
        code: `// Back-of-the-envelope sizing for an ad click aggregator
const avgClicksPerSec = 500_000;
const peakClicksPerSec = 2_000_000;        // 4x peak during a major event
const bytesPerClick = 200;                 // clickId, adId, userId, ts, campaign

// Raw ingest bandwidth at peak
const peakIngestMbps = (peakClicksPerSec * bytesPerClick) / 1e6;   // ~400 MB/s

// Daily raw volume
const clicksPerDay = avgClicksPerSec * 86_400;                     // ~43.2B events/day
const rawTbPerDay = (clicksPerDay * bytesPerClick) / 1e12;         // ~8.6 TB/day

// Rollups: one row per ad per minute (upper bound assumes every ad is active)
const ads = 10_000_000;
const minutesPerDay = 1_440;
const rollupBytes = 48;                    // key + counts
const rollupGbPerDay = (ads * minutesPerDay * rollupBytes) / 1e9;  // ~690 GB

console.log({ peakIngestMbps, rawTbPerDay, rollupGbPerDay });`,
      },
      {
        type: "code",
        heading: "Click Ingest API",
        language: "http",
        label: "ad-ingest-api.http",
        code: `POST /v1/events/clicks HTTP/1.1
Host: ingest.example.com
Content-Type: application/json

{
  "clickId": "c_9f3a2b1c",
  "adId": "ad_88213",
  "campaignId": "cmp_551",
  "userId": "u_42",
  "occurredAt": "2026-11-15T10:03:04.512Z",
  "region": "EU",
  "device": "mobile"
}

HTTP/1.1 202 Accepted
{ "accepted": true }

GET /v1/stats/clicks?adId=ad_88213&window=1m HTTP/1.1
Host: query.example.com

HTTP/1.1 200 OK
Content-Type: application/json

{
  "adId": "ad_88213",
  "windowStart": "2026-11-15T10:03:00Z",
  "clicks": 1284,
  "impressions": 40211,
  "ctr": 0.0319
}`,
      },
      {
        type: "text",
        heading: "High-Level Architecture",
        content:
          "A firehose of click events hits a fleet of stateless ingest nodes behind a load balancer. Each node validates the event, deduplicates by click ID, and produces to a partitioned Kafka topic **keyed by ad ID**, so every click for one ad lands on the same partition and preserves per-ad ordering.\n\nA stream processor — Flink or Kafka Streams — consumes the topic, keeps per-(ad, window) counters in keyed state, and writes rollups into a columnar OLAP store such as ClickHouse or Druid. A query service reads that store and answers windowed queries. In parallel, raw events are sunk to object storage for replay, backfill, and audit. The ingest tier, the streaming tier, and the query tier each scale independently.",
      },
      {
        type: "comparison",
        heading: "Streaming Aggregation vs Batch Aggregation",
        headers: ["Streaming (Kappa)", "Batch (Lambda)"],
        rows: [
          {
            aspect: "Data freshness",
            "Streaming (Kappa)": "Seconds — drives real-time dashboards",
            "Batch (Lambda)": "Minutes to hours after the window closes",
          },
          {
            aspect: "Throughput handling",
            "Streaming (Kappa)":
              "Kafka partitions plus backpressure absorb the firehose",
            "Batch (Lambda)":
              "Scheduled Spark jobs scan object storage in bulk",
          },
          {
            aspect: "Correctness under replay",
            "Streaming (Kappa)":
              "Idempotent upserts keyed by window make replays safe",
            "Batch (Lambda)": "Recompute the whole window from raw logs",
          },
          {
            aspect: "Reprocessing history",
            "Streaming (Kappa)": "Replay the topic from a stored offset",
            "Batch (Lambda)": "Natural — jobs read raw history directly",
          },
          {
            aspect: "Operational complexity",
            "Streaming (Kappa)":
              "Higher — checkpoints, watermarks, state stores",
            "Batch (Lambda)": "Simpler — cron and a job runner",
          },
          {
            aspect: "Cost at the same volume",
            "Streaming (Kappa)": "An always-on cluster, even when idle",
            "Batch (Lambda)": "Bursty, cheaper when nothing is running",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "At-Least-Once Delivery Demands Idempotency",
        content:
          "Kafka, Flink, and most network clients only guarantee **at-least-once** delivery. A producer retry, a consumer rebalance, or a checkpoint rollback all replay events, so a naive `count += 1` will over-count clicks and inflate campaigns. Exactly-once is never a switch you flip; it is two mechanisms working together.\n\nFirst, **deduplicate by click ID** at the edge so a replayed event is recognised and dropped. Second, make the aggregation sink **idempotent**: write rollups keyed by `(ad_id, window_start)` as an upsert, so replaying the same window overwrites the row with the same totals instead of adding to it. Dedup at the front door, idempotency at the back door.",
      },
      {
        type: "code",
        heading: "Deduplicating by Click ID",
        language: "typescript",
        label: "dedup-click.ts",
        code: `async function ingestClick(click: ClickEvent): Promise<void> {
  // Front line: a Bloom filter cheaply rejects the obvious duplicates.
  if (await bloom.mightContain(click.clickId)) {
    if (await seenStore.exists(click.clickId)) {
      metrics.inc("clicks.duplicate");
      return; // Already counted — drop it.
    }
  }

  // Atomic claim: exactly one producer wins the NX. The TTL must outlive
  // the longest possible client retry window.
  const claimed = await redis.set("click:" + click.clickId, "1", {
    NX: true,
    EX: 24 * 60 * 60,
  });
  if (!claimed) {
    metrics.inc("clicks.duplicate");
    return;
  }

  await bloom.add(click.clickId);
  // Key by adId so all of an ad's events share a partition and stay ordered.
  await stream.send("clicks", { key: click.adId, value: click });
}`,
      },
      {
        type: "code",
        heading: "Idempotent Rollup Upsert",
        language: "sql",
        label: "rollup-upsert.sql",
        code: `-- The aggregation sink is idempotent: replaying a window rewrites the
-- same row with the same totals rather than adding to it again.
INSERT INTO clicks_by_minute (ad_id, window_start, clicks, impressions)
VALUES (88213, '2026-11-15 10:03:00', 1284, 40211)
ON CONFLICT (ad_id, window_start)
DO UPDATE SET
  clicks = EXCLUDED.clicks,
  impressions = EXCLUDED.impressions;

-- Windowed read: sum the last 15 one-minute buckets for a rolling view.
SELECT
  sum(clicks) AS clicks,
  sum(impressions) AS impressions,
  sum(clicks)::float / nullif(sum(impressions), 0) AS ctr
FROM clicks_by_minute
WHERE ad_id = 88213
  AND window_start >= now() - interval '15 minutes';`,
      },
      {
        type: "steps",
        heading: "A Click's Journey End to End",
        steps: [
          {
            title: "Ingest and validate",
            detail:
              "Stateless edge nodes accept the event, validate it, and stamp an arrival time.",
          },
          {
            title: "Deduplicate",
            detail:
              "The click ID is claimed atomically; duplicates are dropped before they reach the pipeline.",
          },
          {
            title: "Publish to the stream",
            detail:
              "Events are produced to Kafka partitioned by ad ID so per-ad ordering is preserved.",
          },
          {
            title: "Aggregate in flight",
            detail:
              "The stream processor holds per-window counters in keyed state and emits rollups.",
          },
          {
            title: "Upsert into the OLAP store",
            detail:
              "Rollups are written idempotently keyed by ad and window, so replays overwrite, not double-count.",
          },
          {
            title: "Serve and archive",
            detail:
              "The query service answers windowed reads; raw events land in object storage for reprocessing.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Partition the stream by ad ID so every event for an ad is processed in order on one partition",
          "Deduplicate by click ID at ingest and make the aggregation sink idempotent keyed by window",
          "At-least-once delivery is unavoidable; exactly-once effect comes from dedup plus idempotent writes",
          "Serve dashboards from pre-aggregated rollups, not from raw events, to keep queries in milliseconds",
          "Keep raw events in object storage for replay, backfill, and audit",
          "Bloom filters cheaply reject obvious duplicates before the expensive exact check",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why does a naive `count += 1` aggregation over a Kafka stream over-count clicks?",
        options: [
          "Kafka stores events in duplicate partitions",
          "Streaming pipelines deliver at least once, so retries and reprocessing replay events",
          "Click events are larger than the buffer",
          "Timestamps are stored in seconds",
        ],
        correctIndex: 1,
        explanation:
          "At-least-once delivery means an event can be processed more than once after a producer retry, consumer rebalance, or checkpoint rollback. Each replay re-applies the increment unless the event is deduplicated or the write is made idempotent.",
      },
      {
        question:
          "How do you get exactly-once effect in an at-least-once pipeline?",
        options: [
          "Turn on a flag in the broker",
          "Deduplicate by click ID and write rollups as idempotent upserts keyed by the window",
          "Use a single partition for all traffic",
          "Disable producer retries",
        ],
        correctIndex: 1,
        explanation:
          "There is no single switch. Deduplicating by click ID drops replayed events at the front door, and writing rollups keyed by (ad, window) as upserts means reprocessing the same window overwrites the row with identical totals instead of adding to it.",
      },
      {
        question:
          "Why is the Kafka topic partitioned by ad ID rather than randomly?",
        options: [
          "It reduces storage cost",
          "It guarantees all events for one ad land on the same partition, preserving per-ad ordering",
          "It increases the number of consumers",
          "It avoids the need for deduplication",
        ],
        correctIndex: 1,
        explanation:
          "Ordering is only guaranteed within a partition. Keying by ad ID puts every event for an ad on one partition, so per-ad counts are processed sequentially and a single processor owns that ad's state.",
      },
    ],
  },

  "design-metrics-system": {
    slug: "design-metrics-system",
    title: "Design a Metrics System",
    tagline: "Time-series ingest, rollups, and cardinality at Prometheus scale",
    sections: [
      {
        type: "text",
        heading: "Defining the Problem",
        content:
          "Design the backend behind a monitoring product — a Prometheus or Datadog style system. Services and hosts emit numeric measurements over time, each tagged with labels, and engineers query them to draw dashboards and fire alerts: error rate over five minutes, p99 latency by endpoint, CPU by pod.\n\nThe visible product is a graph. The invisible product is a time-series database with an ingest path, a compaction and rollup pipeline, and a query engine. The three forces that shape every decision are ingest volume, **label cardinality**, and the query latency budget.",
      },
      {
        type: "text",
        heading: "Functional and Non-Functional Requirements",
        content:
          "**Functional:** ingest samples identified by a metric name plus a set of key-value labels; store them with millisecond timestamps; support range queries and rate and percentile functions over a window; automatically roll up raw samples into coarser resolutions; expire old data by retention policy.\n\n**Non-functional:** handle millions of samples per second; keep the newest samples queryable within seconds; keep the query latency for a dashboard panel under a second; bound memory and disk so a single noisy metric cannot take down the cluster; and remain correct when a scrape is missed or a timestamp arrives out of order.",
      },
      {
        type: "analogy",
        heading: "The Hospital Chart and the Annual Summary",
        content:
          "A patient on a monitor has a vital sign recorded every second — high resolution, useful for the minute-by-minute decision in the room. But nobody reads a year of every-second readings. They read a weekly average, because the detail is irrelevant at that distance.\n\nA metrics system does the same thing. It keeps high-resolution samples for recent windows and progressively **downsamples** older data into coarser buckets. Storage stays bounded, and an old query that would otherwise scan billions of points scans a handful of rollups — at the resolution that question actually needs.",
      },
      {
        type: "text",
        heading: "Back-of-the-Envelope Estimation",
        content:
          "Assume 50,000 hosts, each exporting 500 series — a moderate figure once you count every endpoint and status code. That is 25 million active series. With a 15-second scrape interval that is about 1.67 million samples per second.\n\nRaw samples are a timestamp and a value, but good time-series compression (delta-of-delta timestamps, XOR floats) lands near two bytes per sample, roughly 288 GB a day of stored series data. The number that actually hurts is not volume — it is **cardinality**: 25 million series each need an in-memory index entry, so label discipline is a memory-budget problem, not a formatting preference.",
      },
      {
        type: "code",
        heading: "Sizing the Series Space",
        language: "typescript",
        label: "metrics-sizing.ts",
        code: `// Back-of-the-envelope sizing for a Prometheus-style metrics system
const hosts = 50_000;
const seriesPerHost = 500;
const activeSeries = hosts * seriesPerHost;                 // 25M series

const scrapeIntervalSec = 15;
const samplesPerSec = activeSeries / scrapeIntervalSec;    // ~1.67M samples/s

// Gorilla-style compression (delta-of-delta + XOR) lands near 2 bytes/sample
const compressedBytesPerSample = 2;
const ingestionMbps = (samplesPerSec * compressedBytesPerSample) / 1e6;
const storedGbPerDay = (samplesPerSec * 86_400 * compressedBytesPerSample) / 1e9;

// Every active series costs an in-memory index entry (name + sorted labels)
const indexBytesPerSeries = 400;
const indexGb = (activeSeries * indexBytesPerSeries) / 1e9;  // ~10 GB resident

console.log({ activeSeries, samplesPerSec, ingestionMbps, storedGbPerDay, indexGb });`,
      },
      {
        type: "code",
        heading: "Ingest Endpoints",
        language: "http",
        label: "metrics-ingest-api.http",
        code: `# Pull model: the server scrapes a plain-text exposition endpoint
GET /metrics HTTP/1.1
Host: pod-7f2a.internal:9100

HTTP/1.1 200 OK
Content-Type: text/plain; version=0.0.4

# HELP http_requests_total Total HTTP requests.
# TYPE http_requests_total counter
http_requests_total{method="GET",endpoint="/v1/feed",status="200"} 184223
http_requests_total{method="GET",endpoint="/v1/feed",status="500"} 17

# Push model: agents ship over remote write to a long-term store
POST /api/v1/write HTTP/1.1
Host: metrics.example.com
Content-Type: application/x-protobuf
Content-Encoding: snappy

<snappy-compressed protobuf TimeSeries batch>`,
      },
      {
        type: "text",
        heading: "High-Level Architecture",
        content:
          "Ingest is split by role. A short-retention server (Prometheus, Mimir) scrapes targets every 15 seconds, stores recent samples in an in-memory **head block**, and appends them to a write-ahead log so a crash loses nothing. Every couple of hours the head block is compacted and flushed to immutable, time-partitioned blocks on object storage in a columnar format (Parquet or its own encoding).\n\nA remote-write path lets agents or a federation layer push to a horizontally sharded long-term store, hashed by series so a given series always lands on the same shard. Background **recording and rollup jobs** pre-compute expensive aggregates at coarser resolutions. The query layer picks the finest resolution that satisfies the requested step, merges the matching series, and evaluates the function over the window.",
      },
      {
        type: "comparison",
        heading: "Pull (Scrape) vs Push",
        headers: ["Pull (Prometheus)", "Push (StatsD / agent)"],
        rows: [
          {
            aspect: "Who initiates",
            "Pull (Prometheus)": "The server scrapes each target on a schedule",
            "Push (StatsD / agent)": "The client sends samples to a receiver",
          },
          {
            aspect: "Target discovery",
            "Pull (Prometheus)": "Targets discovered from Kubernetes or Consul",
            "Push (StatsD / agent)": "Clients are configured with an endpoint",
          },
          {
            aspect: "Short-lived jobs",
            "Pull (Prometheus)": "Hard — the job may exit before a scrape",
            "Push (StatsD / agent)": "Natural — push right before exit",
          },
          {
            aspect: "Backpressure",
            "Pull (Prometheus)": "The server controls the scrape rate",
            "Push (StatsD / agent)": "Clients can overwhelm the receiver",
          },
          {
            aspect: "Firewalled networks",
            "Pull (Prometheus)": "The server must reach every target",
            "Push (StatsD / agent)": "Only client egress is required",
          },
          {
            aspect: "Detecting a dead target",
            "Pull (Prometheus)": "A missing scrape is immediately obvious",
            "Push (StatsD / agent)":
              "Silence is ambiguous — dead or just quiet",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Cardinality Is the Real Limit",
        content:
          "A metric is not one series; it is one series **per unique label combination**. Add a `user_id` or `request_id` label and a single counter fans out into millions of series — each with a timestamp list, a memory index, and storage. This is the classic way a metrics backend falls over: not because of throughput, but because one engineer added a high-cardinality label.\n\nThe defences are boring and effective. Cap the number of series per metric at ingest and reject or aggregate beyond it. Never label by unbounded dimensions — IDs, emails, free-text paths. Template dynamic path segments (`/users/{id}` rather than `/users/42`). Track **series churn** as a first-class metric, because a burst of short-lived series exhausts memory even if the steady-state count looks fine.",
      },
      {
        type: "code",
        heading: "Downsampling Raw Samples into Rollups",
        language: "sql",
        label: "rollup-job.sql",
        code: `-- Collapse raw 15s samples into 5-minute buckets.
-- avg, min, max, and count are kept so percentiles survive downsampling.
INSERT INTO series_5m (series_id, bucket_start, avg_v, min_v, max_v, sample_count)
SELECT
  series_id,
  time_bucket('5 minutes', ts) AS bucket_start,
  avg(value)  AS avg_v,
  min(value)  AS min_v,
  max(value)  AS max_v,
  count(*)    AS sample_count
FROM samples_raw
WHERE ts >= now() - interval '6 hours'
GROUP BY series_id, bucket_start
ON CONFLICT (series_id, bucket_start)
DO UPDATE SET
  avg_v = EXCLUDED.avg_v,
  min_v = EXCLUDED.min_v,
  max_v = EXCLUDED.max_v,
  sample_count = EXCLUDED.sample_count;

-- Retention: drop raw data far older than the rollups that replace it.
DELETE FROM samples_raw WHERE ts < now() - interval '15 days';`,
      },
      {
        type: "code",
        heading: "Efficient Query Patterns",
        language: "plaintext",
        label: "queries.promql",
        code: `# Range query: per-second rate over a 5-minute window, graphed at a 30s step
rate(http_requests_total{status="500"}[5m])

# p99 latency using a histogram — the reason histograms beat averaged gauges
histogram_quantile(
  0.99,
  sum by (le, endpoint) (rate(http_request_duration_seconds_bucket[5m]))
)

# A shortsighted query: stepping a raw counter over 30 days forces the
# engine to load billions of raw points. Downsampled rollups answer
# the same question in milliseconds because avg, min, max survive.`,
      },
      {
        type: "steps",
        heading: "The Life of a Sample",
        steps: [
          {
            title: "Scrape or receive",
            detail:
              "Agents scrape targets every 15 seconds, or clients push samples to the receiver.",
          },
          {
            title: "Validate and index",
            detail:
              "The metric name and labels are hashed into a series ID and the timestamp is checked.",
          },
          {
            title: "Write to the head block",
            detail:
              "Recent samples land in an in-memory head block and are appended to a write-ahead log.",
          },
          {
            title: "Roll up asynchronously",
            detail:
              "Background jobs downsample raw samples into 5-minute and 1-hour buckets.",
          },
          {
            title: "Persist and expire",
            detail:
              "Head blocks flush to compacted, time-partitioned files; retention drops what rollups replace.",
          },
          {
            title: "Query",
            detail:
              "The query layer picks the finest resolution that fits the step, merges series, and evaluates.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "A metric is one series per unique label combination, so cardinality, not volume, is the binding constraint",
          "Bound the series count at ingest and never label by unbounded values like user or request IDs",
          "Keep recent samples in an in-memory head block with a write-ahead log for crash safety",
          "Roll raw samples up into coarser buckets and keep avg, min, max, and count so percentiles survive",
          "Pull suits long-lived targets and dead-target detection; push suits short-lived batch jobs",
          "Have the query layer pick the resolution that fits the requested step instead of scanning raw history",
        ],
      },
    ],
    quiz: [
      {
        question: "Which change is most likely to take down a metrics backend?",
        options: [
          "Doubling the scrape interval",
          "Adding a high-cardinality label such as user_id to a widely used counter",
          "Compressing samples with a delta encoding",
          "Storing samples in object storage",
        ],
        correctIndex: 1,
        explanation:
          "Each unique label combination is a distinct series with its own memory index and storage. A label like user_id multiplies one metric into millions of series, exhausting memory and ingest capacity even when total sample volume looks unchanged.",
      },
      {
        question:
          "Why keep min, max, and count alongside the average in a rollup?",
        options: [
          "They compress better",
          "Percentiles and p99 cannot be recovered from an average alone",
          "They reduce cardinality",
          "They are required by the write-ahead log",
        ],
        correctIndex: 1,
        explanation:
          "An average destroys the distribution. By retaining min, max, and count (and histograms where percentiles are needed), the rollup preserves enough information to answer range and quantile queries that the raw average would silently distort.",
      },
      {
        question:
          "Why is a push model often preferred for short-lived batch jobs?",
        options: [
          "It reduces storage cost",
          "The job may exit before the next scheduled scrape, so it pushes its final metrics before finishing",
          "It removes the need for labels",
          "It lowers cardinality",
        ],
        correctIndex: 1,
        explanation:
          "A pull system only collects data when it scrapes. A batch job that runs for ten seconds and exits may never be scraped, so it pushes its metrics to a gateway just before it terminates — the standard pattern for ephemeral jobs.",
      },
      {
        question:
          "How should a metrics system serve a query over a 30-day window?",
        options: [
          "Load every raw sample and aggregate in memory",
          "Read the pre-computed rollups at the coarsest resolution that still answers the question",
          "Refuse the query",
          "Scrape the targets again for the historical window",
        ],
        correctIndex: 1,
        explanation:
          "Raw samples are only retained for a short window. Long-range queries scan downsampled rollups, which are far smaller and already aggregated — the resolution a 30-day view needs, as fine detail would be invisible at that scale.",
      },
    ],
  },

  "design-id-generator": {
    slug: "design-id-generator",
    title: "Design a Distributed ID Generator",
    tagline:
      "Snowflake bits, clock skew, and monotonic IDs without a coordinator",
    sections: [
      {
        type: "text",
        heading: "Defining the Problem",
        content:
          "Design a service that mints unique identifiers for records created across hundreds of machines — orders, events, posts — at high volume, without a round trip to a central sequence for every ID. The identifiers must be unique across the whole fleet, preferably roughly sortable by time so they index well and paginate naturally, and generated in-process fast enough never to be the bottleneck.\n\nThe interview turns on the tension between **uniqueness**, **monotonicity**, and **availability**. Any two are easy; all three together, across independent processes with imperfect clocks, is where the design lives.",
      },
      {
        type: "text",
        heading: "Functional and Non-Functional Requirements",
        content:
          "**Functional:** generate a globally unique ID on demand; IDs are 64-bit integers that fit in a signed bigint; IDs are roughly ordered by creation time; encode the generating worker so IDs are traceable; work without a per-ID network call.\n\n**Non-functional:** no collision ever, even under retries; generate millions of IDs per second cluster-wide; single-digit-microsecond latency in-process; tolerate worker restarts and wall-clock adjustments (NTP steps, leap handling); and never block the producing service — an ID generator that is down must not stop writes.",
      },
      {
        type: "analogy",
        heading: "The Bank Teller's Receipt Roll",
        content:
          "Every bank branch has its own roll of pre-numbered receipts, and each roll is stamped with a branch code. Two branches never issue the same receipt number because the branch code is part of the number. Within a branch the numbers increase one at a time, so receipts sort by when they were issued.\n\nSnowflake is that receipt roll. The **worker ID** is the branch code, the **timestamp** is the moment of issuance, and the **sequence** is the position on the roll. Two branches never collide, only the *branch* competes for its own sequence, and no central office needs to hand out every number.",
      },
      {
        type: "text",
        heading: "Back-of-the-Envelope Estimation",
        content:
          "The 64-bit Snowflake layout is a fixed budget: one sign bit (always zero, to keep IDs positive), 41 bits of milliseconds, 10 bits of worker ID, and 12 bits of sequence per millisecond. 41 bits of milliseconds is about 69 years from a chosen custom epoch, and 10 worker bits give 1024 distinct workers (often split into 5 datacenter bits plus 5 machine bits).\n\nThat means each worker emits up to 4096 IDs per millisecond, and the whole fleet up to about 4.19 million IDs per millisecond — billions per second — with zero coordination on the hot path. The only coordination is the one-time assignment of a unique worker ID.",
      },
      {
        type: "code",
        heading: "The Bit Budget",
        language: "typescript",
        label: "snowflake-bits.ts",
        code: `// A 64-bit Snowflake id is a fixed bit budget
const signBit = 1;            // always 0, keeps the id positive
const timestampBits = 41;     // milliseconds since a custom epoch
const workerBits = 10;        // 1024 workers (5 datacenter + 5 machine bits)
const sequenceBits = 12;      // ids per worker per millisecond

const workers = 1 << workerBits;                       // 1024
const idsPerMsPerWorker = 1 << sequenceBits;           // 4096
const maxIdsPerMs = workers * idsPerMsPerWorker;       // ~4.19M ids/ms fleet-wide
const yearsOfIds = 2 ** timestampBits / (1000 * 60 * 60 * 24 * 365); // ~69 years
const totalBits = signBit + timestampBits + workerBits + sequenceBits; // 64

console.log({ workers, idsPerMsPerWorker, maxIdsPerMs, yearsOfIds, totalBits });`,
      },
      {
        type: "code",
        heading: "A Snowflake Generator",
        language: "typescript",
        label: "snowflake.ts",
        code: `class Snowflake {
  private static readonly EPOCH = 1_700_000_000_000; // custom epoch in ms
  private static readonly WORKER_BITS = 10;
  private static readonly SEQ_BITS = 12;
  private static readonly MAX_SEQ = (1 << Snowflake.SEQ_BITS) - 1; // 4095
  private static readonly MAX_SKEW_MS = 5;

  private lastTimestamp = -1;
  private sequence = 0;

  constructor(private readonly workerId: number) {
    if (workerId < 0 || workerId > 1023) {
      throw new Error("workerId must be in [0, 1023]");
    }
  }

  nextId(): bigint {
    let ts = Date.now();

    // Clock moved backwards: never emit a duplicate, wait the skew out.
    if (ts < this.lastTimestamp) {
      const skew = this.lastTimestamp - ts;
      if (skew > Snowflake.MAX_SKEW_MS) {
        throw new Error("clock skew exceeds tolerance");
      }
      while ((ts = Date.now()) < this.lastTimestamp) {
        /* busy-wait a few milliseconds for the clock to catch up */
      }
    }

    if (ts === this.lastTimestamp) {
      // Same millisecond: advance the sequence, overflow into the next ms.
      this.sequence = (this.sequence + 1) & Snowflake.MAX_SEQ;
      if (this.sequence === 0) {
        while ((ts = Date.now()) <= this.lastTimestamp) {
          /* sequence exhausted: wait for the next millisecond */
        }
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = ts;

    return (
      (BigInt(ts - Snowflake.EPOCH) << BigInt(Snowflake.WORKER_BITS + Snowflake.SEQ_BITS)) |
      (BigInt(this.workerId) << BigInt(Snowflake.SEQ_BITS)) |
      BigInt(this.sequence)
    );
  }
}`,
      },
      {
        type: "code",
        heading: "Lease-Based Worker ID Assignment",
        language: "bash",
        label: "register-worker.sh",
        code: `# Every process acquires a lease on a unique 10-bit worker id.
# The lease expires if the process dies, freeing the id for reuse,
# so a restarted process never inherits a stale id and collides.
etcdctl put /snowflake/workers/$WORKER_ID "$HOSTNAME" \\
  --lease=$(etcdctl lease grant 30 | awk '{print $2}')

# A supervisor keeps the lease alive for as long as the process runs
etcdctl lease keep-alive <lease-id>

# Never reuse an id without a gap: bump the epoch or wait out the
# previous clock so an old timestamp can never be re-emitted.`,
      },
      {
        type: "comparison",
        heading: "Choosing an ID Scheme",
        headers: ["UUIDv4", "DB Auto-Increment", "Snowflake"],
        rows: [
          {
            aspect: "Uniqueness",
            UUIDv4: "Statistically certain, zero coordination",
            "DB Auto-Increment": "Guaranteed within one database",
            Snowflake: "Guaranteed by worker id plus sequence",
          },
          {
            aspect: "Sortability",
            UUIDv4: "None — fully random",
            "DB Auto-Increment": "Strictly increasing, one global sequence",
            Snowflake: "Roughly time-sortable",
          },
          {
            aspect: "Coordination needed",
            UUIDv4: "None",
            "DB Auto-Increment": "A central database per sequence",
            Snowflake: "A unique worker id per process",
          },
          {
            aspect: "Throughput",
            UUIDv4: "Effectively unlimited locally",
            "DB Auto-Increment": "Bounded by the database",
            Snowflake: "~4M ids/ms fleet-wide",
          },
          {
            aspect: "Size",
            UUIDv4: "128 bits",
            "DB Auto-Increment": "8 bytes or less",
            Snowflake: "64 bits",
          },
          {
            aspect: "Index and storage cost",
            UUIDv4: "Large, random keys fragment B-tree indexes",
            "DB Auto-Increment": "Compact, sequential inserts",
            Snowflake: "Compact and append-friendly",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "A Clock That Moves Backward Mints Duplicates",
        content:
          "Snowflake leans on wall-clock time. If NTP steps the clock backward by a few milliseconds, the generator can regenerate a timestamp it already used, and with the sequence reset it emits an **exact duplicate** ID — corrupting data silently. Virtual machines that are live-migrated or restored from a snapshot are notorious for this.\n\nThe defences: detect that the clock moved backward and **refuse to emit** until time catches up, or, more safely, use a monotonic clock source for the sequence logic while still stamping wall-clock time. On a bad rollback — a skew of minutes or hours — fail the process rather than risk collisions, and require a fresh worker ID after restart. Never trade uniqueness for availability on the ID path; a brief outage beats a duplicate key.",
      },
      {
        type: "steps",
        heading: "Generating an ID",
        steps: [
          {
            title: "Register a worker",
            detail:
              "Each process acquires a lease on a unique worker ID from etcd or ZooKeeper.",
          },
          {
            title: "Read the clock",
            detail:
              "The generator reads the current wall-clock millisecond against a fixed custom epoch.",
          },
          {
            title: "Guard the clock",
            detail:
              "If time moved backward, the generator waits out the skew instead of risking a duplicate.",
          },
          {
            title: "Pack the bits",
            detail:
              "Timestamp, worker ID, and a per-millisecond sequence are OR-ed into one 64-bit integer.",
          },
          {
            title: "Handle overflow",
            detail:
              "When 4096 IDs in a millisecond are exhausted, the generator waits for the next millisecond.",
          },
          {
            title: "Encode for JSON",
            detail:
              "The ID is returned as a string so 64-bit precision survives JavaScript number parsing.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Snowflake packs timestamp, worker ID, and sequence into 64 bits: unique without a per-ID network call",
          "Worker IDs must be unique across the fleet; assign them via a lease so restarts reclaim safely",
          "A backward clock step can mint duplicate IDs — wait out small skew and fail fast on large skew",
          "IDs are only roughly time-sortable; the sequence within a millisecond is not globally ordered",
          "Always serialize 64-bit IDs as strings — JavaScript numbers lose precision beyond 2^53",
          "Choose the scheme by requirement: UUIDv4 for zero coordination, Snowflake for sortable and compact",
        ],
      },
    ],
    quiz: [
      {
        question:
          "In a 64-bit Snowflake ID, what role does the worker ID play?",
        options: [
          "It stores the sequence counter",
          "It guarantees uniqueness across processes that may share the same timestamp",
          "It compresses the timestamp",
          "It encrypts the ID",
        ],
        correctIndex: 1,
        explanation:
          "Two workers can read the same millisecond and start their sequences at the same value. Embedding a distinct worker ID in each ID ensures that (timestamp, sequence) collisions across workers still produce different final IDs.",
      },
      {
        question:
          "What happens if the wall clock steps backward on a Snowflake generator?",
        options: [
          "IDs become longer",
          "The generator may re-emit a timestamp and sequence pair, producing a duplicate ID",
          "The worker ID changes automatically",
          "Nothing; the sequence compensates",
        ],
        correctIndex: 1,
        explanation:
          "A backward clock step can revisit a timestamp already used. If the sequence also resets, the same (timestamp, worker, sequence) triple is generated again. The generator must detect the regression and wait it out rather than emit.",
      },
      {
        question: "Why is Snowflake described as only roughly time-sortable?",
        options: [
          "Timestamps are stored in seconds",
          "The high bits are time, so IDs sort by millisecond, but workers and sequences interleave within a millisecond",
          "It uses random bits for the sequence",
          "Timestamps are encrypted",
        ],
        correctIndex: 1,
        explanation:
          "The timestamp occupies the most significant bits, so ordering is correct at millisecond granularity. Within the same millisecond, different workers and sequence values interleave, so the total order is only approximately by creation time.",
      },
      {
        question:
          "Why return a Snowflake ID as a string rather than a JSON number?",
        options: [
          "Strings compress better",
          "JavaScript numbers are IEEE-754 doubles and lose precision above 2^53",
          "The ID contains letters",
          "Strings sort faster",
        ],
        correctIndex: 1,
        explanation:
          "A 63-bit ID exceeds the 53-bit safe integer range of a JavaScript double, so parsing it as a number silently rounds it. Serializing as a string preserves all 64 bits for the client.",
      },
    ],
  },
};

export default TOPIC_CONTENT_GAPS_SYS_B2;
