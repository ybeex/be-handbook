// Gap content: Observability + Testing & Quality
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_GAPS_OBS: Record<string, TopicContent> = {
  // ─── OBSERVABILITY ────────────────────────────────────────────────────────

  "distributed-tracing": {
    slug: "distributed-tracing",
    title: "Distributed Tracing (OpenTelemetry)",
    tagline:
      "Follow one request across every service with spans and trace context",
    sections: [
      {
        type: "text",
        heading: "Why a Single Request Crosses Many Services",
        content:
          "A single checkout might touch an API gateway, an auth service, a pricing service, an inventory service, a payment provider, and a database — each one a separate process, often a separate team. When the request takes 2.4 seconds, logs from six services tell you six local stories but never the one you need: **where did the time actually go**.\n\nMetrics tell you a rate is up; logs tell you a component complained. Only a trace stitches the causal chain back together, showing that 1.9 of those 2.4 seconds were spent waiting on a downstream call that itself waited on a slow query.",
      },
      {
        type: "text",
        heading: "Spans, Traces, and Parent-Child Relationships",
        content:
          "A **span** is a single unit of work with a name, a start time, a duration, and key-value attributes. It can carry events and an error status. Spans nest: a parent span represents a bigger operation and its children represent the work done inside it.\n\nA **trace** is the tree of spans that share one trace ID — the full journey of one request. When a service calls another, it sends the current context so the callee's spans become children of the caller's span. That parent-child link is what turns a pile of timings into a waterfall.",
      },
      {
        type: "analogy",
        heading: "The Parcel Tracking Number",
        content:
          "Think of a shipment that passes through a warehouse, an airline, a customs broker, and a courier van. Each handler scans the parcel and records a leg of the journey against one tracking number.\n\nAt the end you open the tracking page and see every hop with timestamps — where the parcel sat for three days, which leg was delayed. A trace is exactly that tracking page for a request: one trace ID, one row per hop (span), and the duration of each leg. Without the tracking number you would have four unrelated scans at four locations and no way to link them.",
      },
      {
        type: "code",
        heading: "Creating a Span with OpenTelemetry",
        language: "typescript",
        label: "checkout.ts",
        code: `import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('checkout-service');

export async function chargeOrder(orderId: string) {
  // startActiveSpan makes this span the parent of everything called inside.
  return tracer.startActiveSpan('chargeOrder', async (span) => {
    span.setAttribute('order.id', orderId);
    try {
      const result = await paymentClient.charge(orderId);
      span.setAttribute('payment.status', result.status);
      return result;
    } catch (err) {
      // Record the stack trace and mark the span failed so it appears in error views.
      span.recordException(err as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw err;
    } finally {
      span.end();
    }
  });
}`,
      },
      {
        type: "text",
        heading: "Context Propagation: The Part People Get Wrong",
        content:
          "OTel is standardised on the W3C Trace Context format. When a service makes an outbound call it injects a **traceparent** header; the receiving service extracts it and continues the trace. The header encodes the version, the 16-byte trace ID, the parent span ID, and trace flags.\n\nThe two failure modes are silent and common. If a service talks to a queue or a non-HTTP protocol and forgets to inject context into the message, the trace **breaks** into two disconnected trees. If a service extracts context but spawns work on a detached thread or a fire-and-forget promise without the context, child spans land in the wrong place. Instrumentation libraries handle HTTP, gRPC, and common brokers automatically — but always verify the clock skew and the edges.",
      },
      {
        type: "code",
        heading: "The traceparent Header on the Wire",
        language: "http",
        label: "outbound request",
        code: `GET /api/inventory/reserve HTTP/1.1
Host: inventory.svc.cluster.local
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
tracestate: acme=region-lag

# 00        -> version
# 4bf92f... -> 128-bit trace id (shared across the whole trace)
# 00f067..  -> 64-bit parent span id (this caller's current span)
# 01        -> trace flags: sampled`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "A Broken Trace Is Worse Than No Trace",
        content:
          "Teams often sample at the edge of one service and assume the whole trace is captured. If that service calls three others that sample independently, you get partial trees with missing children, and the waterfall lies about where time went. Make the sampling decision once at the root and propagate it via the sampled flag, or use a random-trace-id source of truth shared across services.",
      },
      {
        type: "text",
        heading: "Sampling: Head-Based vs Tail-Based",
        content:
          "You cannot keep 100% of traces at high traffic — the storage and network cost is enormous. **Head-based sampling** decides whether to keep a trace at its very start, before any work happens. It is cheap and deterministic but blind: you cannot know in advance that this particular trace will be the one that errors or crawls.\n\n**Tail-based sampling** buffers all spans of a trace and decides at the end, so you can keep every trace that errored, exceeded a latency threshold, or touched a specific customer. The trade-off is memory: the collector must hold spans until the trace completes, which requires a robust collector tier.",
      },
      {
        type: "comparison",
        heading: "Head-Based vs Tail-Based Sampling",
        headers: ["Head-Based", "Tail-Based"],
        rows: [
          {
            aspect: "Where the decision is made",
            "Head-Based": "At the root, before any spans run",
            "Tail-Based": "At the collector, after the trace finishes",
          },
          {
            aspect: "Cost",
            "Head-Based": "Very cheap; a coin flip at ingress",
            "Tail-Based": "Expensive; collectors buffer whole traces",
          },
          {
            aspect: "Visibility of rare events",
            "Head-Based": "Blind; may drop the only failing trace",
            "Tail-Based": "Excellent; keep all errors and slow traces",
          },
          {
            aspect: "Complexity",
            "Head-Based": "Trivial to deploy",
            "Tail-Based": "Needs a collector tier and free-disk headroom",
          },
          {
            aspect: "Typical use",
            "Head-Based": "Baseline capture, e.g. 1-5% of all traffic",
            "Tail-Based": "Keeping 100% of errors on top of a sampled base",
          },
        ],
      },
      {
        type: "steps",
        heading: "Instrumenting a Distributed System",
        steps: [
          {
            title: "Adopt OpenTelemetry, not a vendor SDK",
            detail:
              "Instrument once with OTel APIs and export via the OTLP protocol. Backends (Jaeger, Tempo, vendors) become swappable configuration instead of a rewrite.",
          },
          {
            title: "Turn on auto-instrumentation first",
            detail:
              "The OTel agent covers HTTP, gRPC, database drivers, and popular frameworks out of the box. Get broad coverage before writing custom spans.",
          },
          {
            title: "Add manual spans at business boundaries",
            detail:
              "Wrap meaningful operations (charge payment, score risk) with names and attributes you can filter on later. Do not instrument trivia.",
          },
          {
            title: "Verify propagation across every edge",
            detail:
              "Trace one request end to end and confirm the waterfall is a single tree. Check queues, cron jobs, and any non-HTTP hop.",
          },
          {
            title: "Start with head sampling, add tail for errors",
            detail:
              "Sample a small percentage at the root for cost, and run a tail-based collector policy that keeps all errors and high-latency traces.",
          },
        ],
      },
      {
        type: "text",
        heading: "Backends: Jaeger, Tempo, and What to Store",
        content:
          "**Jaeger** is the classic open-source tracing backend: a UI with a service map, span search, and dependency graphs. **Grafana Tempo** takes a different stance — it stores traces cheaply in object storage and leans on trace IDs as the join key with metrics and logs, rather than building a search index over every attribute.\n\nThe practical pattern is trace-to-metrics and exemplars: keep a sampled trace store for deep dives, but attach **exemplars** (a sample trace ID) to your latency histograms so a spike on a dashboard links straight to the exact slow trace that caused it. That connection — a metric spike that opens the trace that explains it — is the payoff of doing observability as one system instead of three.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "A trace is the causal waterfall of one request; spans are the timed, nested units of work",
          "Propagate W3C traceparent context across every edge, or traces fragment into disconnected trees",
          "Decide sampling once at the root; head-based is cheap but blind, tail-based is powerful but costly",
          "Instrument with OpenTelemetry so your backend (Jaeger, Tempo, vendor) stays swappable",
          "Do not stop at auto-instrumentation — add named spans at real business boundaries",
          "Link metrics to traces with exemplars so a spike opens the trace that explains it",
        ],
      },
    ],
    quiz: [
      {
        question: "What exactly is a span in distributed tracing?",
        options: [
          "A single log line emitted during a request",
          "One unit of work with a name, timing, and attributes, which nests inside a parent span",
          "A counter that counts requests per second",
          "A snapshot of the process heap",
        ],
        correctIndex: 1,
        explanation:
          "A span represents one operation — with start time, duration, attributes, events, and status. Spans nest via parent-child links, and the tree they form for one request is the trace.",
      },
      {
        question:
          "A service calls a message queue but does not inject trace context into the message. What is the consequence?",
        options: [
          "The trace ID changes but everything still links",
          "The trace breaks; the consumer's spans form a separate tree disconnected from the producer",
          "Sampling automatically increases",
          "The collector drops all spans",
        ],
        correctIndex: 1,
        explanation:
          "Propagation must cross every hop. Without injecting context into the message, the consumer cannot recover the parent span, so its work lands in a new, disconnected trace and the end-to-end waterfall is lost.",
      },
      {
        question: "Which best describes tail-based sampling?",
        options: [
          "A coin flip at the root before any work happens",
          "Dropping all spans older than one hour",
          "Buffering a full trace and deciding at the collector whether to keep it",
          "Sampling only the first span of each trace",
        ],
        correctIndex: 2,
        explanation:
          "Tail-based sampling holds complete traces in the collector and then decides, which lets you keep every errored or slow trace. The cost is memory and collector complexity, since whole traces must be buffered before the decision.",
      },
      {
        question:
          "What is the main advantage of instrumenting with OpenTelemetry rather than a single vendor SDK?",
        options: [
          "It removes the need for sampling",
          "Instrument once, then switch backends (Jaeger, Tempo, a vendor) via OTLP configuration",
          "It makes every trace 100% sampled for free",
          "It eliminates the need for context propagation",
        ],
        correctIndex: 1,
        explanation:
          "OTel is a vendor-neutral API plus the OTLP wire protocol. You instrument code once and export to whichever backend you choose, avoiding a rewrite when you change or add vendors.",
      },
    ],
  },

  "metrics-methods": {
    slug: "metrics-methods",
    title: "Metrics & RED/USE Methods",
    tagline:
      "Counters, gauges, histograms, and the metrics that actually matter",
    sections: [
      {
        type: "text",
        heading: "Metrics Are Cheap, Aggregate, and Always On",
        content:
          "A metric is a numeric measurement sampled over time and stored as a time series. Where a log is a discrete event and a trace is one request's journey, a metric is an aggregation: how many, how fast, how full. That aggregation is why metrics cost a tiny fraction of logs and traces and can be recorded for every request on every host indefinitely.\n\nThe flip side is that metrics lose detail. You can see that the error rate tripled, but not which customer or which payload triggered it. That is fine — metrics are for **detection and alerting**; logs and traces are for diagnosis. Use each for what it is good at.",
      },
      {
        type: "text",
        heading: "The Four Metric Types",
        content:
          "**Counter** — a value that only ever goes up (requests served, errors thrown). You never read a counter's absolute value; you compute its rate over a window.\n\n**Gauge** — a value that goes up and down (queue depth, in-flight requests, temperature). Gauges are snapshots.\n\n**Histogram** — a distribution of observations bucketed into ranges, used for latencies and sizes. From a histogram you derive percentiles across all instances without pre-averaging.\n\n**Summary** — client-side quantiles computed before export. Summaries cannot be aggregated across instances, which makes them a poor fit for distributed dashboards; prefer histograms.",
      },
      {
        type: "analogy",
        heading: "The Car Dashboard",
        content:
          "A dashboard does not show you every engine revolution — it shows a speedometer (a gauge), an odometer (a counter that only increases), and a fuel gauge (a gauge that falls). You glance at a few needles to know whether to act.\n\nNobody drives while reading a stream of raw sensor logs. The dashboard is deliberately aggregated and lossy because its job is to answer one question fast: is something wrong right now? Metrics are your system's dashboard; logs and traces are the mechanic's diagnostic laptop you plug in when a needle looks wrong.",
      },
      {
        type: "code",
        heading: "Counters and Histograms with prom-client",
        language: "typescript",
        label: "metrics.ts",
        code: `import { Counter, Histogram, register } from 'prom-client';

export const httpRequests = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests handled',
  labelNames: ['method', 'route', 'status'] as const,
});

export const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  // Buckets are the whole game: they decide which percentiles you can trust.
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  labelNames: ['method', 'route', 'status'] as const,
});

// In your request middleware:
httpRequests.inc({ method: 'GET', route: '/orders', status: '200' });
requestDuration.observe(
  { method: 'GET', route: '/orders', status: '200' },
  0.184,
);`,
      },
      {
        type: "text",
        heading: "The RED Method: For Services",
        content:
          "Coined by Tom Wilkie, **RED** answers 'is this request-serving service healthy?' with three signals per endpoint:\n\n**Rate** — requests per second. **Errors** — the count or fraction of requests failing. **Duration** — the distribution of how long successful requests take, usually the 95th or 99th percentile rather than the average.\n\nRED maps directly to user experience: every service either serves requests fast, serves them slowly, or fails them. That is the entire surface that matters for a service, and it is only three queries to build per route.",
      },
      {
        type: "text",
        heading: "The USE Method: For Resources",
        content:
          "Brendan Gregg's **USE** method targets resources rather than requests: CPU, memory, disk, network, connection pools, thread pools.\n\n**Utilization** — what percentage of the resource is busy. **Saturation** — how much work is queued waiting for it (the run queue, the pending connections). **Errors** — the count of error events tied to that resource.\n\nUtilization tells you how busy something is; saturation tells you whether work is being delayed. A CPU at 70% with a growing run queue is a problem; a CPU at 70% with an empty queue is not. That is why you need both.",
      },
      {
        type: "comparison",
        heading: "RED vs USE",
        headers: ["RED", "USE"],
        rows: [
          {
            aspect: "Target",
            RED: "Services and endpoints (request-oriented)",
            USE: "Hardware and bounded resources (resource-oriented)",
          },
          {
            aspect: "Question answered",
            RED: "Are users being served quickly and successfully?",
            USE: "Is this resource a bottleneck?",
          },
          {
            aspect: "Metrics",
            RED: "Rate, Errors, Duration",
            USE: "Utilization, Saturation, Errors",
          },
          {
            aspect: "Where it is collected",
            RED: "In the application, per route",
            USE: "At the host, container, and OS layer",
          },
          {
            aspect: "Best paired with",
            RED: "SLOs and error budgets on user journeys",
            USE: "Capacity planning and saturation alerts",
          },
        ],
      },
      {
        type: "code",
        heading: "RED and USE in PromQL",
        language: "plaintext",
        label: "queries.promql",
        code: `# RED - Rate: requests per second per route
sum(rate(http_requests_total[5m])) by (route)

# RED - Errors: 5xx ratio
sum(rate(http_requests_total{status=~"5.."}[5m])) by (route)
  / sum(rate(http_requests_total[5m])) by (route)

# RED - Duration: 95th percentile from a histogram
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route))

# USE - Utilization: fraction of time CPUs are busy
1 - avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) by (instance)

# USE - Saturation: runnable threads waiting for CPU
node_load1 / count(node_cpu_seconds_total{mode="idle"}) by (instance)`,
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Cardinality Explosion Will Take Down Prometheus",
        content:
          "Every unique combination of label values is a separate time series held in memory. Putting `user_id`, `request_id`, `email`, or a raw URL path into a label creates unbounded series — millions of them — and the metrics server runs out of memory or falls over. Keep label value sets small and bounded: route templates (not raw paths), status classes, region, instance. If you need to slice by a high-cardinality dimension, that is a job for logs or traces, not metrics.",
      },
      {
        type: "text",
        heading: "Histograms, Buckets, and Percentiles",
        content:
          "A histogram stores counts in fixed buckets, so a percentile is estimated by interpolation within the bucket that contains it. The bucket layout decides what you can measure: if your slowest bucket is 5s but p99 is 8s, you will only learn 'over 5 seconds', which is useless for a latency SLO.\n\nChoose buckets around your objectives — if your SLO is p99 under 300ms, you need buckets at 0.1, 0.25, 0.3, and 0.5 at minimum. Also beware averaging: the mean latency hides the tail entirely. A service averaging 40ms can still be timing out one request in a thousand, and it is that tail the slowest users feel. Track percentiles, not averages.",
      },
      {
        type: "steps",
        heading: "Choosing What to Measure",
        steps: [
          {
            title: "Start from the user journey",
            detail:
              "Pick the outcomes that define success — checkout completes, feed loads, payment authorises — and measure those at the edge before instrumenting internals.",
          },
          {
            title: "Apply RED to every service",
            detail:
              "For each request-serving service, add Rate, Errors, and Duration at the route level with bounded labels.",
          },
          {
            title: "Apply USE to every shared resource",
            detail:
              "For CPU, memory, disk, and your pools, expose utilization, saturation, and errors so you can find the bottleneck fast.",
          },
          {
            title: "Keep labels bounded, always",
            detail:
              "Before adding a label, ask whether its value set has a ceiling. If it is unbounded, it belongs in logs, not metrics.",
          },
          {
            title: "Alert on symptoms, not causes",
            detail:
              "Page on user-facing SLOs (error rate, latency). Use resource metrics to explain an alert, not to page by themselves.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Metrics are aggregated and cheap: use them to detect and alert, then drop into logs and traces to diagnose",
          "Counters only increase and rate() them; gauges snapshots; prefer histograms over summaries for portability",
          "RED (Rate, Errors, Duration) monitors services; USE (Utilization, Saturation, Errors) monitors resources",
          "Saturation is the alert-worthy signal: busy with no queue is fine, busy with a growing queue is not",
          "Unbounded labels cause cardinality explosions that take down the metrics server",
          "Bucket boundaries decide which percentiles are measurable; alert on p95/p99, never the average",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why should you alert on a counter's rate over a window rather than its absolute value?",
        options: [
          "Counters reset to zero on every scrape",
          "A counter only ever increases, so its absolute value is meaningless; the rate of change is the signal",
          "Absolute values are always too large to store",
          "Prometheus forbids reading counters directly",
        ],
        correctIndex: 1,
        explanation:
          "Counters monotonically increase (and reset on restart), so you transform them with rate() over a window to get requests-per-second. The absolute number just reflects how long the process has been running.",
      },
      {
        question: "What does the USE method measure for a resource?",
        options: [
          "Rate, Errors, Duration",
          "Utilization, Saturation, Errors",
          "Requests, Endpoints, Timeouts",
          "Reads, Writes, Deletes",
        ],
        correctIndex: 1,
        explanation:
          "USE is Utilization (how busy the resource is), Saturation (work queued waiting for it), and Errors. It targets resources like CPU, disk, and connection pools, complementing RED which targets services.",
      },
      {
        question:
          "You add a `user_id` label to a request counter. What is the most likely outcome?",
        options: [
          "Better dashboards with no downside",
          "A cardinality explosion — one time series per user — that exhausts the metrics server's memory",
          "The counter stops incrementing",
          "Sampling automatically drops the label",
        ],
        correctIndex: 1,
        explanation:
          "Each unique label combination is a distinct time series. A high-cardinality label like user_id creates millions of series, consuming memory until the metrics backend falls over. High-cardinality slicing belongs in logs or traces.",
      },
      {
        question: "Why is the average request latency a poor latency signal?",
        options: [
          "Averages are always too high",
          "The mean hides the tail; a service can average 40ms while p99 requests time out",
          "Averages cannot be computed from histograms",
          "Averages require tail-based sampling",
        ],
        correctIndex: 1,
        explanation:
          "The mean is dominated by the many fast requests and conceals the slow tail that your worst-off users experience. Track percentiles (p95, p99) so the slowest requests, which drive timeouts and abandonment, stay visible.",
      },
    ],
  },

  "continuous-profiling": {
    slug: "continuous-profiling",
    title: "Continuous Profiling",
    tagline: "Always-on flame graphs that pinpoint production hotspots",
    sections: [
      {
        type: "text",
        heading: "The Problem With Ad-Hoc Profiling",
        content:
          "Traditionally you profile only when something is slow: you reproduce the issue locally, attach a profiler, and hunt. But production rarely reproduces locally — the bug depends on a specific data shape, a particular request mix, or a contention pattern that only appears at scale. By the time you go to profile, the incident is over and the culprit is gone.\n\n**Continuous profiling** runs a low-overhead sampler on every instance, all the time, and aggregates results by time window. The incident you debugged last Tuesday is still recorded: you can open the CPU flame graph for the exact minute the latency spiked and see the function that was burning cycles.",
      },
      {
        type: "text",
        heading: "What You Can Profile",
        content:
          "**CPU** — which functions consumed processor time. The classic flame graph use case.\n\n**Allocation and heap** — where memory is allocated and what is retained, the key to chasing leaks and reducing GC pressure.\n\n**Wall-clock / off-CPU** — where threads were blocked waiting (locks, I/O) rather than running. The thing that is really slow is often not burning CPU at all; it just cannot proceed.\n\n**Goroutines / threads** — how many exist and what they are stuck on, which exposes leaks in concurrency-heavy services.",
      },
      {
        type: "analogy",
        heading: "The Security Camera vs the Detective",
        content:
          "An ad-hoc profiler is a detective you call after a burglary — by the time they arrive, the scene has changed and witnesses have gone home. A continuous profiler is a security camera recording every room, every minute, whether or not anything is wrong.\n\nWhen something goes missing you do not reconstruct the story from memory; you rewind the footage to the exact minute and watch what actually happened. The camera costs almost nothing to run (a small fraction of one core), and it means every incident is already recorded before you know it matters.",
      },
      {
        type: "code",
        heading: "Sampling a Live Process",
        language: "bash",
        label: "profiling.sh",
        code: `# Go services expose net/http/pprof on a private port (never public!).
# Capture 30 seconds of CPU samples from a running production process.
curl -s "http://localhost:6060/debug/pprof/profile?seconds=30" -o cpu.pb.gz

# Snapshot the heap to hunt an allocation leak.
curl -s "http://localhost:6060/debug/pprof/heap" -o heap.pb.gz

# Read the profile locally, or open the interactive flame-graph UI.
go tool pprof -http=:8080 cpu.pb.gz

# Top functions by cumulative CPU, straight from the terminal.
go tool pprof -top -nodecount=15 cpu.pb.gz`,
      },
      {
        type: "text",
        heading: "Reading a Flame Graph",
        content:
          "A flame graph is a stack trace histogram. Each box is a function; its **width** is the share of samples where it was on the stack — that is the time cost. Boxes are stacked into the call tree: a function sits directly above its caller, and the top edge of a stack is the function actually executing.\n\nYou read it by looking for **wide boxes**, not tall ones. A tall, thin tower means deep recursion or long call chains that each cost little. A wide plate means real time spent. The flame graph deliberately hides time ordering — it is an aggregate, not a timeline — so use it to find the expensive code, then use a trace or the time-filtered view to find when and why.",
      },
      {
        type: "comparison",
        heading: "In-Process Agent vs eBPF",
        headers: ["In-Process Agent", "eBPF"],
        rows: [
          {
            aspect: "How it works",
            "In-Process Agent":
              "The runtime/library samples its own stacks (e.g. pprof, Pyroscope SDK)",
            eBPF: "The kernel samples stacks for all processes without code changes",
          },
          {
            aspect: "Code changes",
            "In-Process Agent":
              "Requires a library or the runtime's built-in profiler",
            eBPF: "None; works on unmodified binaries",
          },
          {
            aspect: "Symbol quality",
            "In-Process Agent":
              "Excellent; native function names and line numbers",
            eBPF: "Good, but needs symbols and can miss inlined frames",
          },
          {
            aspect: "Language support",
            "In-Process Agent": "Per-ecosystem (Go, JVM, Python, Node, .NET)",
            eBPF: "Language-agnostic, including mixed-language hosts",
          },
          {
            aspect: "Best for",
            "In-Process Agent":
              "Deep per-language insight, labelled by service/version",
            eBPF: "Whole-host fleet coverage with zero instrumenting",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Continuous Profiling Is Cheap — Cheap Enough to Always Run",
        content:
          "Sampling profilers capture a few hundred stack traces per second per process, which typically costs around 1-2% of one CPU core and tens of megabytes of memory. The samples are compressed and small — a service emitting millions of trace spans can still emit a tiny fraction of that as profiles. The whole point of continuous profiling over ad-hoc profiling is that the overhead is low enough to leave on permanently, so you never again lose the evidence for a past incident.",
      },
      {
        type: "text",
        heading: "Pyroscope, Parca, and the Profiling Backends",
        content:
          "**Pyroscope** (now part of Grafana) and **Parca** are open-source continuous-profiling backends. They ingest profiles from many instances, label them with service name, version, region, and pod, and let you compare any two time ranges — so you can diff the flame graph before and after a deploy and see exactly which function got slower.\n\nThe comparison view is the real superpower. Combined with labels on Git SHA or deployment version, it answers 'did this release regress performance?' with a visual diff of the code that changed, pinpointing the newly hot function in seconds.",
      },
      {
        type: "text",
        heading: "Linking Profiles to Traces and Metrics",
        content:
          "Modern observability ties profiles to traces. A **span profile** (a.k.a. trace-linked profiling) attaches the profile samples active during a specific span, so from a slow trace you can jump to the flame graph of exactly the work that span did. This collapses the debugging path: a duration spike on a dashboard opens the trace, and the trace opens the profile of the hot function.\n\nKeep the three pillars connected by the same identifiers — service name, version, and trace ID — and troubleshooting becomes drilling down rather than guessing which tool to reach for next.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Continuous profiling samples production permanently, so past incidents stay diagnosable",
          "Profile CPU, allocations, wall-clock/off-CPU, and goroutines — the slow part is often blocked, not busy",
          "Read flame graphs by width, not height: wide boxes are the time cost",
          "In-process agents give the best symbols; eBPF covers unmodified binaries host-wide",
          "The overhead is ~1-2% of a core, low enough to run always-on",
          "Diff profiles across deploy versions to catch performance regressions and link them to traces",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What is the main advantage of continuous profiling over ad-hoc profiling?",
        options: [
          "It uses no CPU at all",
          "Every incident is already recorded, so you can profile the exact past window instead of trying to reproduce it",
          "It eliminates the need for metrics",
          "It replaces distributed tracing",
        ],
        correctIndex: 1,
        explanation:
          "Ad-hoc profiling happens after the fact, when production conditions are gone. Continuous profiling samples all the time, so the flame graph for the exact minute of a past slowdown is still available to inspect.",
      },
      {
        question: "In a flame graph, what does the width of a box represent?",
        options: [
          "How many lines of code the function has",
          "The share of samples in which that function was on the stack — its time cost",
          "The number of times the function was called synchronously",
          "The function's recursion depth",
        ],
        correctIndex: 1,
        explanation:
          "Flame graph width is proportional to how often a function appeared in sampled stacks, i.e. its share of time. You hunt for wide boxes; tall thin towers are deep call chains that are individually cheap.",
      },
      {
        question:
          "When is a wall-clock / off-CPU profile more useful than a CPU profile?",
        options: [
          "When the workload is pure computation",
          "When the slow code is largely blocked on I/O or locks rather than burning CPU",
          "When you want to reduce binary size",
          "When the service has no threads",
        ],
        correctIndex: 1,
        explanation:
          "A CPU profile only shows time spent executing. If the slowness comes from waiting on a lock, a socket, or a downstream call, an off-CPU / wall-clock profile reveals where threads were blocked — invisible to a CPU profile.",
      },
    ],
  },

  // ─── TESTING & QUALITY ────────────────────────────────────────────────────

  "e2e-testing": {
    slug: "e2e-testing",
    title: "End-to-End Testing",
    tagline: "Playwright and Cypress against real journeys, without the flakes",
    sections: [
      {
        type: "text",
        heading: "What E2E Tests Actually Prove",
        content:
          "An end-to-end test drives the deployed system the way a user would — through the browser or the public API — across every layer: frontend, backend, database, cache, queue, and any third-party integration. It is the only test that can catch a break in the wiring that every unit and integration test missed, because it is the only one exercising the whole assembly.\n\nThat power costs speed and stability. E2E tests are seconds-to-minutes each, need a real environment, and are the most flaky layer in the suite. So you write **few** of them, aimed at the journeys that matter most: sign in, checkout, the primary money path. They are a smoke alarm, not the whole fire-prevention strategy.",
      },
      {
        type: "text",
        heading: "Pick a Runner: Playwright or Cypress",
        content:
          "**Playwright** drives Chromium, Firefox, and WebKit through a single API, runs tests in parallel across workers, and supports multiple browser contexts and origins in one test. Its auto-waiting and web-first assertions are built in.\n\n**Cypress** runs inside the browser's event loop, giving an excellent interactive time-travel debugger and a very approachable API, but historically was limited to Chromium-family and single-tab, single-origin flows. For new suites, the default is usually Playwright; Cypress remains a strong choice when its debugging experience matters more than cross-browser breadth.",
      },
      {
        type: "analogy",
        heading: "Test-Piloting the Real Aircraft",
        content:
          "Unit and integration tests are the simulator: fast, safe, repeatable, and they let you practise specific manoeuvres cheaply. An end-to-end test is a test flight in the actual aircraft, on the actual runway, with the actual fuel and weather.\n\nA simulator cannot tell you the door won't seal at altitude or the radio fails in a real sky. So you do not fly the real plane for every check — that would be absurdly expensive — but you do a small number of full test flights before every release, precisely because only they can surface the integration failures the simulator never will.",
      },
      {
        type: "code",
        heading: "A Playwright Test on a Real Journey",
        language: "typescript",
        label: "checkout.spec.ts",
        code: `import { test, expect } from '@playwright/test';

test('a customer can add an item and complete checkout', async ({ page }) => {
  await page.goto('/products/widget');

  // Locate by role and accessible name, not brittle CSS classes.
  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.getByRole('link', { name: 'Checkout' }).click();

  await page.getByLabel('Email').fill('buyer+test@acme.dev');
  await page.getByLabel('Card number').fill('4242424242424242');
  await page.getByRole('button', { name: 'Pay now' }).click();

  // Web-first assertion: Playwright retries until visible or times out.
  await expect(page.getByRole('heading', { name: 'Order confirmed' }))
    .toBeVisible();

  await expect(page).toHaveURL(/\\/orders\\/[A-Z0-9]+$/);
});`,
      },
      {
        type: "text",
        heading: "Locators: Prefer What Users See",
        content:
          "The most common cause of a test that breaks on every UI refactor is a CSS or XPath locator tied to implementation details (`.btn-primary`, `div > div:nth-child(2)`). Playwright and Cypress both encourage locating by **role, label, text, and test ID** — the things a user or assistive technology perceives.\n\nLocating by accessible role also doubles as a lightweight accessibility check: if `getByRole('button', { name: 'Pay now' })` cannot find the button, a screen reader probably cannot either. Reserve a dedicated `data-testid` for elements with no natural role, functional name, or stable visible text.",
      },
      {
        type: "text",
        heading: "Killing Flakiness: Auto-Wait, Never Sleep",
        content:
          "Flakiness in E2E almost always comes from racing the application. The test clicks before an element is ready, or asserts before the network response lands. The naive fix — `await page.waitForTimeout(2000)` — is a disaster: it slows every run and still fails under load, because a fixed sleep is a guess.\n\nInstead, use the runner's built-in waiting. Playwright auto-waits for elements to be actionable and its web-first assertions retry until the condition holds or a timeout expires. Wait on **conditions** (a response, a visible element, a URL), never on the clock. A test that passes only because of a generous sleep is a test that will fail on a slow CI runner.",
      },
      {
        type: "comparison",
        heading: "Playwright vs Cypress",
        headers: ["Playwright", "Cypress"],
        rows: [
          {
            aspect: "Browsers",
            Playwright: "Chromium, Firefox, WebKit from one API",
            Cypress: "Chromium-family and Firefox; WebKit support is limited",
          },
          {
            aspect: "Execution model",
            Playwright: "Out-of-process, driving browsers over a protocol",
            Cypress: "Runs inside the browser's event loop",
          },
          {
            aspect: "Parallelism",
            Playwright: "Built-in sharding and workers across browsers",
            Cypress: "Parallelism via Cypress Cloud or manual sharding",
          },
          {
            aspect: "Debugging",
            Playwright: "Trace viewer, videos, and rich retry traces",
            Cypress: "Excellent interactive time-travel UI",
          },
          {
            aspect: "Multi-origin / multi-tab",
            Playwright: "Supported in one test with multiple contexts",
            Cypress: "Historically constrained; needs workarounds",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "A Sleep Is a Bug, Not a Wait",
        content:
          "`waitForTimeout` and friends make the suite slower and no more reliable. A 2-second sleep that passes 99% of the time locally fails on a congested CI box, and now you have a flaky test plus a slow test. If a test needs a sleep to pass, the real question is which event you forgot to wait for — a specific network response, a loading spinner disappearing, or an element becoming enabled. Wait on that condition and the sleep disappears.",
      },
      {
        type: "text",
        heading: "Test Data and Environment Strategy",
        content:
          "E2E tests need data and an environment, and both can wreck reliability. Never rely on shared production-like data that other tests mutate — that produces order-dependent flakiness. Instead, **create the data each test needs** through a seeding API or direct fixture insert, and clean it up (or use a unique namespace per run so cleanup is unnecessary).\n\nFor the environment, run against a **dedicated, isolated stack** brought up per pipeline — often via containers (Docker Compose or Testcontainers) or a preview environment per pull request. Reset the database to a known state before the suite. If tests must hit a third-party service, stub it at the network layer so the run does not depend on an external system being up and fast.",
      },
      {
        type: "steps",
        heading: "Structuring a Reliable E2E Suite",
        steps: [
          {
            title: "Cover only critical journeys",
            detail:
              "Choose the handful of flows where a break costs money or blocks all users — auth, checkout, signup. Leave the long tail to integration tests.",
          },
          {
            title: "Fake auth, seed data per test",
            detail:
              "Authenticate via a programmatic API or storage state, and create the exact data each test needs with a unique identifier so runs cannot collide.",
          },
          {
            title: "Wait on conditions, never the clock",
            detail:
              "Use auto-waiting locators and web-first assertions. Ban fixed sleeps in review and in a lint rule.",
          },
          {
            title: "Run isolated stacks in CI",
            detail:
              "Bring up the app and its datastores per pipeline, reset to a known state, and stub external services at the network boundary.",
          },
          {
            title: "Capture artifacts on failure",
            detail:
              "Record video, screenshots, and a Playwright trace for every failed run so debugging does not require a local reproduction.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "E2E is the only layer that proves the whole system works, so keep it small and aimed at money paths",
          "Prefer Playwright for cross-browser breadth and built-in parallelism; Cypress for its debugger",
          "Locate by role, label, and test ID — implementation-detail selectors rot on every refactor",
          "Wait on conditions (response, visibility, URL), never on fixed sleeps",
          "Create isolated per-test data and run against a dedicated, resettable environment",
          "Record video, screenshots, and traces on failure; debug from artifacts, not local repros",
        ],
      },
    ],
    quiz: [
      {
        question: "Why should an E2E suite be small rather than comprehensive?",
        options: [
          "E2E tests cannot catch integrations",
          "E2E tests are slow and flaky, so you reserve them for a few critical journeys and push detail down to faster layers",
          "Runners only allow ten tests",
          "Playwright charges per test",
        ],
        correctIndex: 1,
        explanation:
          "E2E tests are the slowest and most flaky layer, needing a real environment. Their value is verifying the whole assembly on the most critical flows, so you write few and keep the broad coverage in fast unit and integration tests.",
      },
      {
        question:
          "Why is `await page.waitForTimeout(2000)` considered harmful?",
        options: [
          "It is not supported by Playwright",
          "It guesses at timing: it slows every run and still flakes under load, instead of waiting on the real condition",
          "It blocks the browser's event loop permanently",
          "It disables auto-waiting for the rest of the test",
        ],
        correctIndex: 1,
        explanation:
          "A fixed sleep adds latency unconditionally and is still a guess — on a slow CI box two seconds may not be enough. Waiting on a condition (a response, a visible element, a URL) is both faster and reliable.",
      },
      {
        question:
          "What is the recommended way to locate an element a user clicks?",
        options: [
          "A deep CSS selector like `div > div:nth-child(2) > .btn`",
          "By accessible role and name, e.g. `getByRole('button', { name: 'Pay now' })`",
          "By the element's pixel coordinates",
          "By executing arbitrary JavaScript in the page",
        ],
        correctIndex: 1,
        explanation:
          "Role- and label-based locators track what users and assistive technology perceive, so they survive refactors and double as a lightweight accessibility signal. Deep CSS selectors break whenever the markup changes.",
      },
      {
        question: "What is the safest source of test data for an E2E test?",
        options: [
          "Rows shared with the staging environment that other tests also use",
          "A production database snapshot",
          "Data the test creates itself for a unique namespace, then discards or ignores",
          "Whatever happens to be in the database when CI runs",
        ],
        correctIndex: 2,
        explanation:
          "Shared mutable data creates order-dependent flakiness: another test or a manual change can corrupt it. Creating per-test data in a unique namespace makes each run independent and repeatable.",
      },
    ],
  },

  "property-based-testing": {
    slug: "property-based-testing",
    title: "Property-Based & Fuzz Testing",
    tagline:
      "Let generators falsify your invariants and shrink the counterexample",
    sections: [
      {
        type: "text",
        heading: "Example-Based vs Property-Based",
        content:
          "An example-based test asserts a specific output for a specific input: `add(2, 3)` returns `5`. You wrote both the input and the expected output, so the test can only ever find the bugs you already thought of.\n\nA **property-based test** asserts a relationship that must hold for **all** inputs, and the framework generates inputs trying to break it. You never enumerate cases; you state the invariant and let the machine search. This finds the off-by-one, the empty-input, and the Unicode edge cases you would never have typed by hand.",
      },
      {
        type: "text",
        heading: "The Properties That Pay Off",
        content:
          "**Round-trip** — encode then decode returns the original; serialize then parse is identity. Great for codecs, compression, and serialization.\n\n**Idempotence** — applying an operation twice equals applying it once (deduplication, PUT endpoints, cache invalidation).\n\n**Commutativity / order-independence** — the result does not depend on the order of independent operations (set union, summing a collection).\n\n**Oracle** — compare a fast, tricky implementation against a slow, obviously-correct one on the same input (a hash map against a linear scan).\n\n**Invariants** — a sorted list is non-decreasing; the output length is bounded by the input; no element is dropped or duplicated.",
      },
      {
        type: "analogy",
        heading: "The Adversarial Tester You Hire",
        content:
          "An example-based test is you checking your own homework: you test the cases you happen to think of, which are exactly the cases your code already handles. A property-based test is hiring a tireless, slightly malicious tester whose only job is to find an input that breaks your claim.\n\nThe tester does not care about your happy path. She tries zero, negative numbers, empty strings, enormous values, and random bytes, and when she finds a failure she does not just report it — she **simplifies it to the smallest possible counterexample** and hands you that. That last part, shrinking, is what makes the failure instantly understandable instead of a 4,000-character wall of noise.",
      },
      {
        type: "code",
        heading: "Properties with fast-check",
        language: "typescript",
        label: "codec.prop.spec.ts",
        code: `import { test, expect } from 'vitest';
import fc from 'fast-check';
import { encode, decode } from './codec';

// Round-trip: for ANY payload, decoding what we encoded must return it.
test('decode inverts encode for any payload', () => {
  fc.assert(
    fc.property(fc.dictionary(fc.string(), fc.jsonValue()), (payload) => {
      expect(decode(encode(payload))).toEqual(payload);
    }),
  );
});

// Invariants: sorting is idempotent and preserves the number of elements.
test('sort is idempotent and length-preserving', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (xs) => {
      const once = [...xs].sort((a, b) => a - b);
      const twice = [...once].sort((a, b) => a - b);
      expect(twice).toEqual(once);          // idempotent
      expect(once).toHaveLength(xs.length); // no elements lost
    }),
  );
});`,
      },
      {
        type: "text",
        heading: "Generators: Shaping the Input Space",
        content:
          "A good test is only as good as the inputs it explores. Generators (called **arbitraries** in fast-check, **strategies** in Hypothesis) describe how to build values: arbitrary integers, strings, arrays, maps, and compositions of these. You can constrain them — integers within a range, strings matching a pattern — and you can compose custom ones for your domain types.\n\nBias the generators toward the nasty edges. Most implementations of 'arbitrary integer' already include zero, negatives, and the min/max boundaries, because those are where bugs live. A generator that only produces nice positive numbers gives false confidence; a good one produces the values that make developers wince.",
      },
      {
        type: "text",
        heading: "Shrinking: The Feature You Cannot Live Without",
        content:
          "When a property fails on a random 60-element array, the raw counterexample is unreadable. **Shrinking** is the framework's automated minimisation: after finding any failure, it repeatedly tries simpler inputs — shorter arrays, smaller numbers, simpler strings — keeping any that still fail, until it reaches a minimal case.\n\nYou do not get `[847, -3, 0, 9921, ...]`; you get `[0, 0]` and an immediate insight that the bug is with duplicate or zero values. Shrinking turns a random fuzz into a precise, reproducible regression case, and the shrunk input is exactly what you paste into an example-based test as a permanent guard.",
      },
      {
        type: "comparison",
        heading: "Property-Based vs Example-Based vs Fuzz Testing",
        headers: ["Property-Based", "Example-Based", "Fuzz Testing"],
        rows: [
          {
            aspect: "Inputs",
            "Property-Based": "Generated from rules, biased to edges",
            "Example-Based": "Hand-picked by the author",
            "Fuzz Testing": "Generated or mutated, often raw bytes",
          },
          {
            aspect: "What you write",
            "Property-Based": "An invariant that must always hold",
            "Example-Based": "A specific input and expected output",
            "Fuzz Testing": "A target that only checks for crashes or hangs",
          },
          {
            aspect: "Shrinking",
            "Property-Based": "Automatic, to a minimal counterexample",
            "Example-Based": "Not applicable",
            "Fuzz Testing": "Varies; some minimisers, often none",
          },
          {
            aspect: "Typical target",
            "Property-Based": "Pure logic, codecs, algorithms",
            "Example-Based": "Known behaviours and regressions",
            "Fuzz Testing": "Parsers, decoders, untrusted input",
          },
          {
            aspect: "On failure you get",
            "Property-Based": "A small, reproducible counterexample",
            "Example-Based": "A pass or a fixed assertion failure",
            "Fuzz Testing": "A crashing input to reproduce under a debugger",
          },
        ],
      },
      {
        type: "steps",
        heading: "Writing a Useful Property",
        steps: [
          {
            title: "Name the invariant, not the example",
            detail:
              "Ask what must be true no matter the input — 'decode(encode(x)) == x' — rather than what this one input returns.",
          },
          {
            title: "Choose or build the right generator",
            detail:
              "Use arbitrary values for primitives and compose domain generators. Make sure edge values (zero, empty, min, max) are reachable.",
          },
          {
            title: "Assert the property with clear expectations",
            detail:
              "Express the invariant directly so a failure message reads as the broken claim, not an opaque diff.",
          },
          {
            title: "Let it shrink, then paste the minimal case",
            detail:
              "Reproduce the shrunk counterexample and add it as a permanent example-based regression test alongside the property.",
          },
          {
            title: "Watch for weak properties",
            detail:
              "A property so loose that it passes for a broken implementation is worse than none. Strengthen it until it would catch a realistic bug.",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "A Weak Property Gives False Confidence",
        content:
          "The danger of property testing is a property that is technically true but proves nothing — e.g. asserting only that the output 'is an array' when the real claim is about its contents. Such a property passes for correct and broken code alike. Before trusting a property, deliberately break the implementation and confirm the property fails. If it still passes, the property is too weak to keep.",
      },
      {
        type: "text",
        heading: "Fuzzing: Coverage-Guided Search for Crashes",
        content:
          "Fuzzing pushes the same idea toward untrusted input and crash-finding. **Coverage-guided** fuzzers (AFL, libFuzzer, Go's native fuzzing, Jazzer for the JVM) mutate inputs and keep those that reach new code paths, so the search learns to explore deeper into a parser or decoder.\n\nFuzzing shines on security-critical surfaces: JSON and protobuf decoders, URL and date parsers, image codecs, anything handling data from outside your trust boundary. A fuzzer's job is not to check correctness but to find the input that crashes, hangs, or blows up memory — often the input a human would never construct. Run fuzzers continuously in CI (short sessions) and on dedicated machines (long sessions), and turn every crash into a regression test.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Property-based tests state an invariant for all inputs and let generators search for a counterexample",
          "High-value properties: round-trip, idempotence, order-independence, oracle, and invariants",
          "Generators should reach the nasty edges — zero, empty, negative, min/max, Unicode",
          "Shrinking reduces a random failure to a minimal, readable, reproducible case",
          "Prove a property is strong by breaking the code and confirming the property fails",
          "Fuzzing hunts crashes on untrusted input; run it continuously and keep every crash as a regression test",
        ],
      },
    ],
    quiz: [
      {
        question: "What is a property in property-based testing?",
        options: [
          "A specific input and its expected output",
          "A relationship or invariant that must hold for every generated input",
          "A performance benchmark for a function",
          "A configuration setting for the test runner",
        ],
        correctIndex: 1,
        explanation:
          "A property is a universally-quantified claim — e.g. decode(encode(x)) equals x for all x. The framework generates inputs to try to falsify it, rather than you enumerating example cases.",
      },
      {
        question: "What does shrinking do when a property is falsified?",
        options: [
          "It deletes the failing test",
          "It automatically minimises the failing input to the smallest counterexample that still fails",
          "It reduces the number of iterations to speed up the run",
          "It compresses the source code",
        ],
        correctIndex: 1,
        explanation:
          "After finding a failure, the framework repeatedly tries simpler inputs and keeps any that still fail, converging on a minimal counterexample. That small input makes the bug immediately readable and easy to turn into a regression test.",
      },
      {
        question:
          "Which is a classic property for an encode/decode function pair?",
        options: [
          "The output is always a string",
          "Round-trip: decoding the encoded value returns the original value",
          "The function runs in constant time",
          "The output is longer than the input",
        ],
        correctIndex: 1,
        explanation:
          "The round-trip (inverse) property — decode(encode(x)) == x for all x — is the canonical property for codecs and serializers. It verifies behaviour across the whole input space without enumerating cases.",
      },
      {
        question:
          "How can you tell a property-based test is actually meaningful?",
        options: [
          "It runs many iterations",
          "It uses a random seed",
          "Deliberately breaking the implementation makes the property fail",
          "It passes on the first run",
        ],
        correctIndex: 2,
        explanation:
          "A strong property catches a realistic bug. If you inject a fault and the property still passes, the property is too weak to provide confidence. Mutation-style checking confirms the property has teeth.",
      },
    ],
  },

  "test-strategy": {
    slug: "test-strategy",
    title: "Test Strategy & Flakiness",
    tagline: "The pyramid, coverage, and quarantining flakes before they rot",
    sections: [
      {
        type: "text",
        heading: "Strategy Is About Allocation, Not Volume",
        content:
          "A test strategy is a budget decision: given finite time and CI capacity, where do you place each test to maximise the signal you get per minute of maintenance and runtime? More tests is not the goal — the goal is the smallest suite that makes you confident to ship and refactor.\n\nStart from your **risk surface**: which failures would hurt users and cost money, and what is the cheapest test that would catch each. Then choose the layer. A pricing bug caught by a unit test costs milliseconds; the same bug caught by an E2E test in staging costs a ten-minute pipeline. Same bug, wildly different price — strategy is putting it at the cheap layer.",
      },
      {
        type: "text",
        heading: "Pyramid vs Trophy",
        content:
          "The **test pyramid** (Mike Cohn) puts many unit tests at the base, fewer integration tests in the middle, and a few E2E tests on top. Cheap and precise at the bottom, expensive and broad at the top.\n\nThe **testing trophy** (Kent C. Dodds) argues for a wide middle of integration tests, with static analysis and unit tests below and few E2E tests above, on the theory that most real bugs live in the wiring between components. Neither shape is dogma; both are heuristics for spending your budget where bugs actually occur in your system. If most of your incidents come from integration seams, widen the middle; if they come from business-logic edge cases, widen the base.",
      },
      {
        type: "comparison",
        heading: "Pyramid vs Trophy",
        headers: ["Test Pyramid", "Testing Trophy"],
        rows: [
          {
            aspect: "Dominant layer",
            "Test Pyramid": "Unit tests (the wide base)",
            "Testing Trophy": "Integration tests (the wide middle)",
          },
          {
            aspect: "Central assumption",
            "Test Pyramid": "Logic bugs are the main risk",
            "Testing Trophy":
              "Wiring bugs between components are the main risk",
          },
          {
            aspect: "E2E share",
            "Test Pyramid": "Small, at the very top",
            "Testing Trophy": "Small, at the very top",
          },
          {
            aspect: "Static analysis",
            "Test Pyramid": "Implicit, not emphasised",
            "Testing Trophy": "Explicit foundation layer",
          },
          {
            aspect: "Best when",
            "Test Pyramid": "Rich domain logic, pure functions",
            "Testing Trophy":
              "Component-heavy apps with real databases and HTTP",
          },
        ],
      },
      {
        type: "analogy",
        heading: "An Insurance Portfolio",
        content:
          "A test strategy is like an insurance portfolio. You do not buy one giant policy or a thousand tiny ones; you cover risks in proportion to how likely and how costly they are. Cheap, frequent risks get cheap coverage (unit tests), and the rare catastrophic risks get targeted, expensive coverage (an E2E test on the checkout journey) — but only the few that genuinely matter.\n\nFlaky tests are the policies you keep paying for that never pay out and occasionally scream false alarms. You do not keep re-reading them every week; you resolve them: fix, rewrite, or cancel. A portfolio full of unreliable policies is worse than a smaller, trustworthy one.",
      },
      {
        type: "code",
        heading: "CI That Gates on Real Signal",
        language: "yaml",
        label: ".github/workflows/ci.yml",
        code: `name: ci
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint          # cheapest signal first
      - run: npm run typecheck
      - run: npm run test -- --coverage
      - run: npm run test:e2e
        env:
          CI: "true"
          # Never mask flakes with retries; surface them honestly.
          RETRIES: "0"`,
      },
      {
        type: "text",
        heading: "Coverage and Mutation Testing",
        content:
          "**Coverage** measures execution, not verification. A suite can run every line while asserting almost nothing, so a high coverage number can coexist with a fragile, bug-prone codebase. Use coverage as a map of the untested and as a ratchet that prevents the number from slipping — never as a target to be maximised.\n\n**Mutation testing** is the honest metric. Tools like Stryker or PIT deliberately introduce small faults (flip a comparison, delete a statement, change a boundary) and count how many the suite catches. The **mutation score** — the fraction of injected faults that caused a test to fail — measures whether your assertions actually have teeth. It is slower than coverage, so run it on critical modules rather than the whole repo.",
      },
      {
        type: "text",
        heading: "Determinism: Eliminating the Sources of Flakiness",
        content:
          "A flaky test passes and fails on the same code — and it is the most corrosive thing in a suite, because it trains people to distrust red. The root causes are predictable. **Shared mutable state** between tests leaks behaviour across cases. **Wall-clock and timezone dependence** breaks at month boundaries or in UTC-vs-local confusion. **Real network calls** fail when a dependency is slow or down. **Unawaited async work** lets a test finish before effects land. **Randomness without a fixed seed** makes failures unreproducible. **Resource collisions** (ports, temp files, database rows) appear only under parallel execution.\n\nThe cure is the same in every case: control the input. Inject a clock instead of reading the system time; fix the random seed; isolate each test's data with a unique namespace; mock or stub at the network boundary; await every promise; and allocate ephemeral ports and containers per worker.",
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Retries Convert Flakes Into Silent Bugs",
        content:
          "The tempting fix for a flaky test is automatic retry. But a retry makes the suite green while the underlying race remains, and worse, a genuine intermittent production bug now looks like a test that occasionally needs a second try. Retries are acceptable only in a last-resort E2E layer with hard limits and alerting on retry counts — never as a blanket policy that hides the problem. Every flake is a real defect in either the code or the test; the job is to find out which.",
      },
      {
        type: "steps",
        heading: "Responding to a Flaky Test",
        steps: [
          {
            title: "Detect it automatically",
            detail:
              "Track pass/fail history per test over the last N runs. Any test that both passed and failed on unchanged code is flaky — flag it before a human has to.",
          },
          {
            title: "Quarantine immediately",
            detail:
              "Move the test to a quarantined set that does not gate the build, so it stops blocking others while keeping its history visible. Add an owner and a deadline.",
          },
          {
            title: "Reproduce with repeat and a fixed seed",
            detail:
              "Run the test hundreds of times locally and in CI to force the race. Use the failing seed to make the run deterministic and bubble the bug to the surface.",
          },
          {
            title: "Fix the cause, not the symptom",
            detail:
              "Identify whether the defect is in the test (bad wait, shared state) or the code (a real race). If it is the code, you have just caught a production bug early.",
          },
          {
            title: "Re-arm or delete",
            detail:
              "Return the fixed test to the gating suite within the deadline, or delete it if it delivers no value. Never let quarantined tests rot indefinitely.",
          },
        ],
      },
      {
        type: "text",
        heading: "CI Gating: Making Green Mean Something",
        content:
          "CI gating decides which checks must pass before a change merges, and it must be fast enough that developers run it and cheap enough to run on every push. Order the stages from cheapest and most deterministic to most expensive: lint, typecheck, unit tests, then integration, then E2E. Fail fast so a broken build does not waste ten minutes on the slow layer.\n\nUse a **merge queue** to serialise merges against the latest main and run the required checks on the combined result, so two individually-green branches cannot break main together. Keep the suite parallelised and shard the slow layers. And keep one hard rule: gating checks are deterministic, and anything flaky is quarantined rather than retried into silence.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Strategy is a budget: place each test at the cheapest layer that still catches the risk",
          "Pyramid suits logic-heavy code; the trophy suits integration-heavy apps — pick by where your bugs come from",
          "Coverage measures execution, not verification; mutation score measures whether assertions have teeth",
          "Flakiness comes from shared state, clocks, real network calls, unawaited work, and resource collisions",
          "Detect, quarantine, reproduce, and fix flakes fast; retries hide real bugs and erode trust",
          "Gate merges on deterministic checks, run them cheapest-first, and use a merge queue to protect main",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why is mutation testing a better measure of test quality than line coverage?",
        options: [
          "It runs faster than coverage tools",
          "It injects deliberate faults and checks whether the suite fails, measuring whether assertions actually verify behaviour",
          "It counts the number of test files",
          "It reports the percentage of lines executed",
        ],
        correctIndex: 1,
        explanation:
          "Coverage only shows which lines ran, so assertion-free tests can score highly. Mutation testing introduces small faults and measures how many are caught — the mutation score — proving the suite has real detection power.",
      },
      {
        question: "Which of these is a common root cause of flaky tests?",
        options: [
          "Using descriptive test names",
          "Depending on wall-clock time or real network calls without controlling them",
          "Running tests in parallel with unique data per worker",
          "Asserting on the return value of a function",
        ],
        correctIndex: 1,
        explanation:
          "Dependence on the system clock, real network calls, shared mutable state, unawaited async work, unfixed randomness, and resource collisions are the classic flake sources. The fix is to control these inputs — inject a clock, stub the network, seed randomness, isolate data.",
      },
      {
        question:
          "What does the testing trophy emphasise compared with the pyramid?",
        options: [
          "Many more E2E tests",
          "A wide middle of integration tests, with static analysis as a foundation",
          "No tests at all above the unit layer",
          "Only snapshot tests",
        ],
        correctIndex: 1,
        explanation:
          "The trophy argues that most real bugs live in the wiring between components, so integration tests (hitting real HTTP handlers and databases) form the wide middle, with static analysis and unit tests below and few E2E tests above.",
      },
      {
        question: "Why is blanket automatic retry of flaky tests harmful?",
        options: [
          "It increases build time only",
          "It turns the suite green while the underlying race or bug persists, hiding real defects behind a passing run",
          "It disables parallelisation",
          "It changes the test's assertions",
        ],
        correctIndex: 1,
        explanation:
          "Retries mask the failure rather than fixing it. A genuine intermittent bug then looks like a test needing a second attempt, and nobody investigates. Flakes should be quarantined and fixed, not retried into silence.",
      },
    ],
  },
};

