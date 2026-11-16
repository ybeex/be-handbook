'use client';

import { useState } from 'react';
import { Server, Globe, Database, Zap, Scale, BarChart2, Link, MessageSquare, ChevronRight, LayoutDashboard, Activity, Bell, Boxes, Cloud, Cpu, CreditCard, FileStack, Gauge, GitBranch, HardDrive, KeyRound, Layers, ListTree, Lock, MapPin, Network, RefreshCw, Search, Shuffle, Timer, TrendingUp } from 'lucide-react';

type NodeId = string;

interface ArchNode {
  id: NodeId;
  label: string;
  IconComp: React.ComponentType<any>;
  color: string;
  x: number;
  y: number;
  desc: string;
  tech: string[];
}

interface Connection {
  from: NodeId;
  to: NodeId;
  label?: string;
  async?: boolean;
}

interface DesignSystem {
  id: string;
  title: string;
  description: string;
  nodes: ArchNode[];
  connections: Connection[];
  keyDecisions: string[];
  scaleFactors: { label: string; value: string }[];
}

const URL_SHORTENER: DesignSystem = {
  id: 'url-shortener',
  title: 'URL Shortener',
  description: 'Design a bit.ly clone handling 100M redirects/day with sub-10ms p99 latency',
  nodes: [
    { id: 'client',    label: 'Clients',          IconComp: Globe,     color: '#4F8EF7', x: 30,  y: 200, desc: 'Web and mobile clients making requests to shorten URLs or follow redirects', tech: [] },
    { id: 'lb',        label: 'Load Balancer',     IconComp: Scale,     color: '#C9A84C', x: 180, y: 200, desc: 'Layer 7 load balancer distributing traffic across API and redirect servers. Handles SSL termination.', tech: ['Nginx', 'AWS ALB'] },
    { id: 'api',       label: 'API Servers',        IconComp: Server,    color: '#9B5DE5', x: 340, y: 110, desc: 'Handle URL creation (POST /shorten), validation, and short code generation. Stateless — any instance handles any request.', tech: ['Node.js', 'Express'] },
    { id: 'redirect',  label: 'Redirect Service',  IconComp: Link,      color: '#9B5DE5', x: 340, y: 290, desc: 'Handle redirects (GET /:code → 301). Highest traffic path — optimized purely for read speed.', tech: ['Go', 'Node.js'] },
    { id: 'cache',     label: 'Redis Cache',        IconComp: Zap,       color: '#22C55E', x: 530, y: 200, desc: 'Stores popular short_code → long_url mappings. 99% of redirects served here without hitting the database.', tech: ['Redis', 'LRU eviction', 'TTL: 24h'] },
    { id: 'db',        label: 'PostgreSQL',         IconComp: Database,  color: '#F97316', x: 700, y: 200, desc: 'Source of truth for all URL mappings. Read replicas serve redirect queries. Primary handles writes only.', tech: ['PostgreSQL', 'Read replicas'] },
    { id: 'analytics', label: 'Analytics',          IconComp: BarChart2, color: '#EF4444', x: 340, y: 400, desc: 'Async click tracking queued via Kafka. Never blocks the redirect path — eventual consistency is fine for analytics.', tech: ['Kafka', 'ClickHouse'] },
  ],
  connections: [
    { from: 'client',   to: 'lb',        label: 'HTTPS' },
    { from: 'lb',       to: 'api',       label: 'POST /shorten' },
    { from: 'lb',       to: 'redirect',  label: 'GET /:code' },
    { from: 'redirect', to: 'cache',     label: 'lookup' },
    { from: 'cache',    to: 'db',        label: 'miss only' },
    { from: 'api',      to: 'db',        label: 'write' },
    { from: 'redirect', to: 'analytics', label: 'click event', async: true },
  ],
  keyDecisions: [
    'Short code: Base62-encode auto-increment DB ID (no collision risk, guaranteed unique, compact)',
    'Cache-aside: redirect service checks Redis first; 99% hit rate on popular URLs means DB rarely touched',
    'Read replicas: all redirect queries go to replicas; only writes touch the primary',
    'Analytics async via Kafka: never adds latency to the critical redirect path',
    'Custom domain support requires an additional routing layer mapping CNAMEs to accounts',
  ],
  scaleFactors: [
    { label: 'Daily redirects', value: '100M/day — ~1,200 RPS avg, 10K RPS peak' },
    { label: 'Cache hit rate',  value: '99%+ — Pareto: top 20% of URLs = 80% of traffic' },
    { label: 'DB reads',        value: '<1% of redirects — only cache misses reach DB' },
    { label: 'p99 latency',     value: '<10ms for redirects (Redis hit ~0.5ms)' },
  ]
};

const CHAT_APP: DesignSystem = {
  id: 'chat-app',
  title: 'Real-Time Chat',
  description: 'Design a WhatsApp-scale messaging system with 1M concurrent WebSocket connections',
  nodes: [
    { id: 'clients',   label: 'Clients',           IconComp: Globe,        color: '#4F8EF7', x: 20,  y: 200, desc: 'Mobile and web clients maintaining persistent WebSocket connections to chat servers', tech: [] },
    { id: 'ws-lb',     label: 'WS Load Balancer',  IconComp: Scale,        color: '#C9A84C', x: 170, y: 200, desc: 'Layer 4 load balancer for WebSockets. Must use IP hash for session affinity — WebSocket state is server-local.', tech: ['HAProxy', 'Nginx stream'] },
    { id: 'ws-server', label: 'Chat Servers',       IconComp: Server,       color: '#9B5DE5', x: 330, y: 200, desc: 'Each server holds N WebSocket connections in memory. Node.js handles thousands per instance due to the event loop.', tech: ['Node.js', 'ws library'] },
    { id: 'presence',  label: 'Presence Service',  IconComp: Zap,          color: '#22C55E', x: 490, y: 100, desc: 'Tracks which users are online and which chat server they are connected to. Critical for routing messages cross-server.', tech: ['Redis', 'Heartbeat TTL: 30s'] },
    { id: 'pubsub',    label: 'Message Broker',    IconComp: MessageSquare, color: '#C9A84C', x: 490, y: 220, desc: 'Fan-out messages between chat servers. When Alice (server 1) sends to Bob (server 2), the broker routes it.', tech: ['Redis Pub/Sub', 'Kafka'] },
    { id: 'msg-db',    label: 'Message Store',     IconComp: Database,     color: '#F97316', x: 660, y: 200, desc: 'Persistent message history. Wide-column database partitioned by (chat_id, timestamp) — perfect for time-series chat queries.', tech: ['Cassandra', 'DynamoDB'] },
    { id: 'push',      label: 'Push Notifications', IconComp: Server,      color: '#4F8EF7', x: 490, y: 320, desc: 'Delivers messages to offline users. Integrates with APNs (Apple) and FCM (Android/Web).', tech: ['APNs', 'FCM', 'Expo'] },
  ],
  connections: [
    { from: 'clients',   to: 'ws-lb',    label: 'WSS' },
    { from: 'ws-lb',     to: 'ws-server', label: 'IP hash sticky' },
    { from: 'ws-server', to: 'presence',  label: 'heartbeat', async: true },
    { from: 'ws-server', to: 'pubsub',    label: 'publish', async: true },
    { from: 'pubsub',    to: 'ws-server', label: 'subscribe', async: true },
    { from: 'ws-server', to: 'msg-db',    label: 'persist', async: true },
    { from: 'ws-server', to: 'push',      label: 'offline user', async: true },
  ],
  keyDecisions: [
    'WebSocket sticky sessions via IP hash — connection state is in-process, cannot roam between servers',
    'Redis Pub/Sub routes messages between servers in the same data center (<0.5ms routing)',
    'Cassandra for messages: partition by (chat_id, timestamp) for O(1) history queries',
    'Presence tracked in Redis with TTL — clients heartbeat every 30s, silence = offline',
    'Offline messages queued and pushed via APNs/FCM — do not wait for connection',
  ],
  scaleFactors: [
    { label: 'Concurrent connections', value: '1M WebSocket connections across ~500 servers' },
    { label: 'Message throughput',     value: '100K messages/sec at peak load' },
    { label: 'Delivery latency',       value: '<100ms end-to-end in same data center' },
    { label: 'Storage',                value: '7-day hot retention, tiered to cold storage' },
  ]
};

const NEWS_FEED: DesignSystem = {
  id: 'news-feed',
  title: 'News Feed',
  description: 'Design a Twitter/Instagram-scale feed serving 500M users with fresh, ranked timelines',
  nodes: [
    { id: 'client', label: 'Clients',         IconComp: Globe,      color: '#4F8EF7', x: 30,  y: 200, desc: 'Web and mobile clients requesting their personalized, ranked home timeline', tech: [] },
    { id: 'lb',     label: 'API Gateway',     IconComp: Scale,      color: '#C9A84C', x: 180, y: 200, desc: 'Terminates TLS, authenticates the user, and routes feed reads and post writes to the right services.', tech: ['Nginx', 'Envoy'] },
    { id: 'feed',   label: 'Feed Service',    IconComp: Server,     color: '#9B5DE5', x: 340, y: 90,  desc: 'Serves GET /feed by reading precomputed timelines from cache and hydrating posts. Stateless and horizontally scalable.', tech: ['Go', 'Node.js'] },
    { id: 'rank',   label: 'Ranking Service', IconComp: TrendingUp, color: '#EF4444', x: 340, y: 310, desc: 'Scores candidate posts by affinity, recency, and engagement. Runs after candidate retrieval so models can change independently.', tech: ['Python', 'ML models'] },
    { id: 'fanout', label: 'Fan-out Workers', IconComp: Layers,     color: '#9B5DE5', x: 520, y: 90,  desc: 'On a new post, push the post ID into each follower timeline in the cache. Off the critical path, driven by a queue.', tech: ['Kafka', 'Workers'] },
    { id: 'cache',  label: 'Feed Cache',      IconComp: Zap,        color: '#22C55E', x: 520, y: 200, desc: 'Stores the latest ~500 post IDs per user as a sorted list. 99% of feed reads are served here without touching storage.', tech: ['Redis', 'Sorted sets'] },
    { id: 'graph',  label: 'Posts + Graph',   IconComp: Database,   color: '#F97316', x: 660, y: 200, desc: 'Source of truth for posts and the follower graph. Partitioned by user so follower lookups scale independently.', tech: ['Cassandra', 'Postgres'] },
  ],
  connections: [
    { from: 'client', to: 'lb',     label: 'HTTPS' },
    { from: 'lb',     to: 'feed',   label: 'GET /feed' },
    { from: 'feed',   to: 'cache',  label: 'read timeline' },
    { from: 'cache',  to: 'graph',  label: 'cache miss' },
    { from: 'feed',   to: 'rank',   label: 'candidates' },
    { from: 'rank',   to: 'graph',  label: 'signals' },
    { from: 'feed',   to: 'fanout', label: 'new post', async: true },
    { from: 'fanout', to: 'cache',  label: 'push id', async: true },
    { from: 'fanout', to: 'graph',  label: 'followers', async: true },
  ],
  keyDecisions: [
    'Fan-out on write for normal users: pre-compute the timeline into cache on each post so 99% of reads hit cache',
    'Hybrid fan-out: switch to fan-out on read (pull) for accounts with >100K followers to avoid write amplification',
    'Feed cache stores only the latest ~500 post IDs; full post bodies are hydrated from the post store on read',
    'Ranking service is stateless and runs after candidate retrieval — swap models without touching storage',
    'Social graph stored separately from posts so follower lookups scale independently of content',
    'New posts are pushed at the head of the cached timeline list, avoiding a full rebuild on every read',
  ],
  scaleFactors: [
    { label: 'Daily active users',  value: '500M DAU — ~50K RPS reads, ~5K RPS writes at peak' },
    { label: 'Fan-out amplification', value: '1 post → N follower timelines; celebrities need the pull model' },
    { label: 'Feed read latency',   value: '<50ms p99 for timeline reads served from Redis' },
    { label: 'Timeline size',       value: 'Cache latest 500 IDs per user (~800 bytes compressed)' },
  ]
};

const RIDE_SHARING: DesignSystem = {
  id: 'ride-sharing',
  title: 'Ride Sharing',
  description: 'Design an Uber-like dispatch system matching riders to nearby drivers in under two seconds',
  nodes: [
    { id: 'rider',  label: 'Rider App',        IconComp: Globe,    color: '#4F8EF7', x: 30,  y: 90,  desc: 'Riders request a trip, see the assigned driver, and track the car in real time on the map.', tech: [] },
    { id: 'driver', label: 'Driver App',       IconComp: MapPin,   color: '#4F8EF7', x: 30,  y: 310, desc: 'Drivers stream GPS pings every ~4s and receive/accept trip offers. Runs in the background on mobile.', tech: ['WebSocket', 'gRPC'] },
    { id: 'gw',     label: 'API Gateway',      IconComp: Scale,    color: '#C9A84C', x: 180, y: 200, desc: 'Fronts all rider and driver traffic, handles auth, and fans requests to the location, matching, and trip services.', tech: ['Envoy', 'Nginx'] },
    { id: 'loc',    label: 'Location Service', IconComp: Activity, color: '#EF4444', x: 340, y: 90,  desc: 'Ingests high-volume driver GPS pings and writes them to the geo index. Rejects stale or low-accuracy points.', tech: ['Go', 'Kafka'] },
    { id: 'match',  label: 'Matching Engine',  IconComp: Network,  color: '#9B5DE5', x: 340, y: 200, desc: 'Finds the best nearby driver for a request using geo queries plus scoring on ETA, rating, and acceptance rate.', tech: ['Go', 'Redis Geo'] },
    { id: 'geo',    label: 'Geo Index',        IconComp: Database, color: '#F97316', x: 520, y: 90,  desc: 'In-memory geospatial index of live driver positions. Supports radius and nearest-neighbour queries in O(log N).', tech: ['Redis GEO', 'Uber H3'] },
    { id: 'trip',   label: 'Trip Service',     IconComp: Server,   color: '#9B5DE5', x: 520, y: 200, desc: 'Owns the trip lifecycle as an explicit state machine from requested to completed, persisted for audit and billing.', tech: ['Go', 'Postgres'] },
  ],
  connections: [
    { from: 'rider',  to: 'gw',     label: 'request ride' },
    { from: 'driver', to: 'gw',     label: 'GPS ping', async: true },
    { from: 'gw',     to: 'loc',    label: 'location update', async: true },
    { from: 'loc',    to: 'geo',    label: 'GEOADD', async: true },
    { from: 'gw',     to: 'match',  label: 'match request' },
    { from: 'match',  to: 'geo',    label: 'GEORADIUS' },
    { from: 'match',  to: 'trip',   label: 'create trip' },
    { from: 'trip',   to: 'driver', label: 'dispatch offer', async: true },
    { from: 'trip',   to: 'gw',     label: 'trip state', async: true },
  ],
  keyDecisions: [
    'Geospatial index in Redis (GEOADD/GEORADIUS) for O(log N) nearest-driver queries instead of scanning every driver',
    'Driver locations streamed every ~4s and stored ephemerally — staleness beyond 15s excludes a driver from matching',
    'Matching engine scores candidates by ETA, rating, and acceptance rate, then offers sequentially with a timeout',
    'Trip service is an explicit state machine (requested→matched→arrived→in-trip→completed) persisted for audit',
    'Driver offers are locked per-driver with a TTL so two riders cannot claim the same driver',
    'Surge pricing computed from the supply/demand ratio per geohash cell and refreshed every minute',
  ],
  scaleFactors: [
    { label: 'Concurrent drivers', value: '1M online drivers emitting a location ping every ~4s' },
    { label: 'Location writes',    value: '~250K writes/sec, handled in-memory by sharded Redis Geo' },
    { label: 'Match latency',      value: '<2s p95 from request to first driver offer' },
    { label: 'Geo cell size',      value: '~600m geohash cells balance query cost vs empty results' },
  ]
};

const RATE_LIMITER: DesignSystem = {
  id: 'rate-limiter',
  title: 'Rate Limiter',
  description: 'Design a distributed rate limiter protecting an API at 500K requests/sec across many edge nodes',
  nodes: [
    { id: 'client',   label: 'Clients',          IconComp: Globe,     color: '#4F8EF7', x: 30,  y: 200, desc: 'API clients sending bursts of traffic that must be throttled to fair, per-identity limits.', tech: [] },
    { id: 'edge',     label: 'Edge Gateway',     IconComp: Scale,     color: '#C9A84C', x: 180, y: 200, desc: 'Enforcement point closest to the client. Checks the limiter before forwarding and rejects with 429 when over quota.', tech: ['Envoy', 'Nginx'] },
    { id: 'limiter',  label: 'Limiter Service',  IconComp: Gauge,     color: '#9B5DE5', x: 340, y: 200, desc: 'Evaluates the sliding-window / token-bucket algorithm by calling Redis with an atomic Lua script.', tech: ['Go', 'Lua scripts'] },
    { id: 'redis',    label: 'Redis Counters',   IconComp: Zap,       color: '#22C55E', x: 340, y: 90,  desc: 'Per-key counters and timestamps. Sorted sets give exact sliding windows; TTL cleans up expired keys automatically.', tech: ['Redis', 'Sorted sets'] },
    { id: 'rules',    label: 'Policy Store',     IconComp: Database,  color: '#F97316', x: 180, y: 310, desc: 'Stores limit tiers per plan, route, and identity. Cached at the edge and hot-reloaded without redeploys.', tech: ['Postgres', 'etcd'] },
    { id: 'upstream', label: 'Backend Services', IconComp: Server,    color: '#9B5DE5', x: 520, y: 200, desc: 'The protected upstream. Only sees traffic that already passed the quota check, so it never handles overload.', tech: ['Microservices'] },
    { id: 'metrics',  label: 'Metrics',          IconComp: BarChart2, color: '#EF4444', x: 520, y: 310, desc: 'Aggregates allow/deny counters per identity and route for dashboards, alerting, and abuse detection.', tech: ['Prometheus', 'Grafana'] },
  ],
  connections: [
    { from: 'client',  to: 'edge',     label: 'request' },
    { from: 'edge',    to: 'limiter',  label: 'check quota' },
    { from: 'limiter', to: 'redis',    label: 'atomic INCR' },
    { from: 'limiter', to: 'rules',    label: 'load policy' },
    { from: 'limiter', to: 'edge',     label: 'allow / 429' },
    { from: 'edge',    to: 'upstream', label: 'forward if allowed' },
    { from: 'limiter', to: 'metrics',  label: 'counters', async: true },
  ],
  keyDecisions: [
    'Sliding-window-log in Redis (sorted sets) gives exact limits; token bucket is cheaper but approximate at boundaries',
    'Counters keyed by (identity, route, window) with a TTL so expired windows self-clean — no cron needed',
    'Enforcement at the edge: reject before the request reaches backend services to protect them from overload',
    'Lua scripts make the read-increment-decide atomic in Redis, avoiding race conditions under concurrency',
    'Return 429 with Retry-After and X-RateLimit-* headers so clients can back off gracefully',
    'Fail-open on a Redis outage: allow traffic through and alert, rather than take the whole API down',
  ],
  scaleFactors: [
    { label: 'Check throughput',    value: '500K RPS across ~50 edge nodes' },
    { label: 'Counter cardinality', value: '~10M active keys at any time, all TTL-bound' },
    { label: 'Added latency',       value: '<1ms p99 per check (single Redis round-trip or Lua call)' },
    { label: 'Redis shards',        value: '~16 shards behind consistent hashing to spread hot keys' },
  ]
};

const VIDEO_PLATFORM: DesignSystem = {
  id: 'video-platform',
  title: 'Video Streaming Platform',
  description: 'Design a YouTube-like platform: ingest, transcode, and stream video to millions of viewers',
  nodes: [
    { id: 'viewer',    label: 'Viewers',           IconComp: Globe,     color: '#4F8EF7', x: 30,  y: 90,  desc: 'Playback clients that fetch manifests and video segments, adapting quality to available bandwidth.', tech: [] },
    { id: 'uploader',  label: 'Uploaders',         IconComp: Globe,     color: '#4F8EF7', x: 30,  y: 310, desc: 'Creators uploading raw video files; large multipart uploads resume across network failures.', tech: [] },
    { id: 'cdn',       label: 'CDN Edge',          IconComp: Cloud,     color: '#06B6D4', x: 180, y: 90,  desc: 'Serves manifests and segments from the edge, absorbing the vast majority of playback bytes near the viewer.', tech: ['CloudFront', 'Akamai'] },
    { id: 'gateway',   label: 'API Gateway',       IconComp: Scale,     color: '#C9A84C', x: 180, y: 200, desc: 'Entry point for uploads, metadata edits, and playback API calls; authenticates and rate-limits.', tech: ['Nginx', 'Envoy'] },
    { id: 'transcode', label: 'Transcode Workers', IconComp: Cpu,       color: '#EF4444', x: 340, y: 200, desc: 'Turn one source into an HLS/DASH ladder of resolutions and bitrates. CPU/GPU heavy and fully asynchronous.', tech: ['FFmpeg', 'GPU encoding'] },
    { id: 'storage',   label: 'Object Storage',    IconComp: HardDrive, color: '#F97316', x: 520, y: 200, desc: 'Stores raw uploads and immutable ~6s segments. Segments are content-addressed and infinitely cacheable.', tech: ['S3', 'GCS'] },
    { id: 'meta',      label: 'Metadata DB',       IconComp: Database,  color: '#F97316', x: 660, y: 200, desc: 'Titles, descriptions, status, and the manifest of available renditions per video.', tech: ['Postgres', 'Cassandra'] },
    { id: 'counts',    label: 'View Counter',      IconComp: BarChart2, color: '#EF4444', x: 520, y: 310, desc: 'Aggregates play events asynchronously into approximate view counts — exact real-time counts are not worth it.', tech: ['Kafka', 'Redis'] },
  ],
  connections: [
    { from: 'uploader',  to: 'gateway',   label: 'upload' },
    { from: 'gateway',   to: 'storage',   label: 'store raw' },
    { from: 'gateway',   to: 'transcode', label: 'enqueue job', async: true },
    { from: 'transcode', to: 'storage',   label: 'renditions', async: true },
    { from: 'transcode', to: 'meta',      label: 'update status', async: true },
    { from: 'viewer',    to: 'cdn',       label: 'GET segment' },
    { from: 'cdn',       to: 'storage',   label: 'origin fetch' },
    { from: 'meta',      to: 'cdn',       label: 'manifest' },
    { from: 'viewer',    to: 'counts',    label: 'play event', async: true },
  ],
  keyDecisions: [
    'Never stream video from origin: segments are served from the CDN edge, with origin hit only on cache miss or first playback',
    'Adaptive bitrate (HLS/DASH): one source is transcoded into a ladder of resolutions and bitrates for the player to switch between',
    'Transcoding is asynchronous via a queue — the upload returns immediately with a processing status',
    'Segment-based object storage (immutable ~6s chunks) enables cheap caching and parallel range requests',
    'View counts are incremented asynchronously and batched — exact real-time counts are not worth the write cost',
    'Long-tail videos transcode on demand to save CPU; popular videos pre-transcode the full bitrate ladder',
  ],
  scaleFactors: [
    { label: 'Daily uploads',  value: '~500 hours/min uploaded, hundreds of thousands of segments/day' },
    { label: 'Transcode cost', value: '1 minute of video ≈ 5 minutes of CPU across the bitrate ladder' },
    { label: 'CDN offload',    value: '>95% of bytes served from edge cache' },
    { label: 'Startup time',   value: '<2s to first frame via prefetch of the first segments' },
  ]
};

const NOTIFICATION_SYSTEM: DesignSystem = {
  id: 'notification-system',
  title: 'Notification System',
  description: 'Design a multi-channel notification platform delivering push, email, and SMS reliably',
  nodes: [
    { id: 'producer', label: 'Producers',            IconComp: Server,        color: '#9B5DE5', x: 30,  y: 200, desc: 'Internal services that emit notification events (order shipped, password reset) without knowing the channels.', tech: ['Microservices', 'Kafka producers'] },
    { id: 'queue',    label: 'Notification Queue',   IconComp: MessageSquare, color: '#C9A84C', x: 180, y: 200, desc: 'Buffers events and decouples producers from delivery. Absorbs traffic spikes and enables retries.', tech: ['Kafka', 'SQS'] },
    { id: 'dedup',    label: 'Dedup Store',          IconComp: Zap,           color: '#22C55E', x: 340, y: 90,  desc: 'Idempotency keys keyed by (user, event, channel) with a TTL so retries never send the same message twice.', tech: ['Redis', 'TTL: 24h'] },
    { id: 'worker',   label: 'Notification Workers', IconComp: Server,        color: '#9B5DE5', x: 340, y: 200, desc: 'Consume events, check preferences, render templates, and hand off to the right channel gateway.', tech: ['Go', 'Node.js'] },
    { id: 'prefs',    label: 'Preferences Store',    IconComp: Database,      color: '#F97316', x: 520, y: 90,  desc: 'Per-user opt-ins, quiet hours, and channel choices. Checked at send time so opt-outs are honored centrally.', tech: ['Postgres'] },
    { id: 'channels', label: 'Channel Gateways',     IconComp: Bell,          color: '#4F8EF7', x: 520, y: 200, desc: 'Adapters for APNs/FCM (push), SMTP/provider (email), and SMS aggregators. One fleet per channel.', tech: ['APNs', 'FCM', 'SendGrid', 'Twilio'] },
    { id: 'dlq',      label: 'Retry / DLQ',          IconComp: RefreshCw,     color: '#EF4444', x: 660, y: 200, desc: 'Retries with exponential backoff and jitter; after N failures routes to a dead-letter queue for inspection.', tech: ['Kafka DLQ', 'SQS DLQ'] },
  ],
  connections: [
    { from: 'producer', to: 'queue',    label: 'emit event', async: true },
    { from: 'queue',    to: 'worker',   label: 'consume', async: true },
    { from: 'worker',   to: 'dedup',    label: 'check idempotency' },
    { from: 'worker',   to: 'prefs',    label: 'check opt-in' },
    { from: 'worker',   to: 'channels', label: 'send' },
    { from: 'channels', to: 'dlq',      label: 'on failure', async: true },
    { from: 'dlq',      to: 'queue',    label: 're-enqueue', async: true },
  ],
  keyDecisions: [
    'Fan-out decoupled via a message queue so producers never block on downstream channel latency',
    'Idempotency/dedup keyed by (user, event, channel) with a TTL window prevents duplicate sends on retries',
    'User preferences checked at send time — opt-outs, quiet hours, and per-channel choices honored centrally',
    'Retry with exponential backoff and jitter; after N attempts route to a dead-letter queue for inspection',
    'One worker fleet per channel so a slow SMS provider cannot stall push or email delivery',
    'Templates rendered server-side with per-user locale and variables, versioned for safe rollbacks',
  ],
  scaleFactors: [
    { label: 'Peak send rate',   value: '10K notifications/sec during broadcast events' },
    { label: 'Channel mix',      value: 'Push ~80%, Email ~15%, SMS ~5% of volume' },
    { label: 'Delivery latency', value: '<5s p95 for push; SMS can take 30s+ via carrier' },
    { label: 'Dedup window',     value: '24h TTL keyed per user/event/channel' },
  ]
};

const PAYMENT_SYSTEM: DesignSystem = {
  id: 'payment-system',
  title: 'Payment System',
  description: 'Design a payment platform with a double-entry ledger, idempotency, and daily reconciliation',
  nodes: [
    { id: 'client',  label: 'Checkout Clients', IconComp: Globe,      color: '#4F8EF7', x: 30,  y: 90,  desc: 'Web and mobile checkout flows that submit a payment with an idempotency key and await a result.', tech: [] },
    { id: 'gateway', label: 'API Gateway',      IconComp: Lock,       color: '#C9A84C', x: 180, y: 200, desc: 'Authenticates merchants, enforces idempotency keys on writes, and rate-limits payment submissions.', tech: ['Envoy', 'Nginx'] },
    { id: 'payment', label: 'Payment Service',  IconComp: Server,     color: '#9B5DE5', x: 340, y: 200, desc: 'Authorizes and captures payments. Coordinates the ledger, the PSP, and the saga, all idempotently.', tech: ['Java', 'Go'] },
    { id: 'webhook', label: 'Webhook Handler',  IconComp: Server,     color: '#9B5DE5', x: 340, y: 90,  desc: 'Verifies signed PSP callbacks and settles the payment. Treats callbacks as at-least-once and idempotent.', tech: ['HTTPS', 'HMAC'] },
    { id: 'psp',     label: 'PSP / Bank',       IconComp: CreditCard, color: '#F97316', x: 520, y: 90,  desc: 'External payment service provider or card network that actually moves money and returns async results.', tech: ['Stripe', 'Adyen'] },
    { id: 'ledger',  label: 'Ledger DB',        IconComp: Database,   color: '#F97316', x: 520, y: 200, desc: 'Append-only double-entry store. Every movement is a balanced debit/credit pair; balances are derived, never overwritten.', tech: ['Postgres', 'Immutable rows'] },
    { id: 'saga',    label: 'Saga Orchestrator', IconComp: Layers,    color: '#9B5DE5', x: 340, y: 310, desc: 'Coordinates multi-step flows (reserve, charge, fulfill) with compensating transactions instead of distributed locks.', tech: ['Temporal', 'State machine'] },
    { id: 'recon',   label: 'Reconciliation',   IconComp: RefreshCw,  color: '#EF4444', x: 660, y: 200, desc: 'Diffs the internal ledger against the PSP settlement file daily and flags mismatches for investigation.', tech: ['Batch jobs', 'Delta reports'] },
  ],
  connections: [
    { from: 'client',  to: 'gateway', label: 'pay (idempotency key)' },
    { from: 'gateway', to: 'payment', label: 'authorize' },
    { from: 'payment', to: 'ledger',  label: 'double-entry write' },
    { from: 'payment', to: 'psp',     label: 'charge' },
    { from: 'psp',     to: 'webhook', label: 'async result', async: true },
    { from: 'webhook', to: 'payment', label: 'settle', async: true },
    { from: 'payment', to: 'saga',    label: 'orchestrate', async: true },
    { from: 'saga',    to: 'ledger',  label: 'commit / compensate' },
    { from: 'recon',   to: 'ledger',  label: 'compare', async: true },
  ],
  keyDecisions: [
    'Double-entry ledger: every movement is a balanced debit/credit pair; account balances are derived, never overwritten',
    'Idempotency keys on all write requests so retries and duplicate client submissions never double-charge',
    'Never trust the client or the PSP callback alone — reconcile daily against the PSP settlement file',
    'Saga pattern coordinates multi-step flows with compensating transactions instead of a distributed lock',
    'Money stored as integer minor units (cents) to avoid floating-point rounding drift',
    'Append-only ledger with immutable rows; corrections are new reversing entries, giving a full audit trail',
  ],
  scaleFactors: [
    { label: 'Transactions',       value: '1K TPS sustained, 10K TPS peak (e.g. Black Friday)' },
    { label: 'Ledger writes',      value: '2x transactions — every txn is a balanced pair of entries' },
    { label: 'Idempotency window', value: '24h retention of keys to cover retries' },
    { label: 'Reconciliation',     value: 'Daily PSP settlement diff must converge to zero' },
  ]
};

const FILE_STORAGE: DesignSystem = {
  id: 'file-storage',
  title: 'File Storage & Sync',
  description: 'Design a Dropbox/Drive-style sync service storing petabytes of files across millions of devices',
  nodes: [
    { id: 'devices', label: 'Devices',           IconComp: Globe,     color: '#4F8EF7', x: 30,  y: 200, desc: 'Desktop and mobile clients that watch the local filesystem and sync only the chunks that changed.', tech: [] },
    { id: 'gateway', label: 'API Gateway',       IconComp: Scale,     color: '#C9A84C', x: 180, y: 200, desc: 'Authenticates clients, terminates TLS, and routes metadata commits and block transfers.', tech: ['Nginx', 'Envoy'] },
    { id: 'meta',    label: 'Metadata Service',  IconComp: Database,  color: '#F97316', x: 340, y: 90,  desc: 'Owns the file tree, versions, and the ordered list of chunk hashes that make up each file.', tech: ['Postgres', 'Cassandra'] },
    { id: 'dedup',   label: 'Dedup Index',       IconComp: FileStack, color: '#22C55E', x: 340, y: 200, desc: 'Maps content hashes to stored blocks so duplicate chunks are uploaded and stored only once.', tech: ['Content hash', 'Redis'] },
    { id: 'notify',  label: 'Sync Notifier',     IconComp: Zap,       color: '#9B5DE5', x: 340, y: 310, desc: 'Pushes a change event to a user\'s other devices so they pull updates instead of polling.', tech: ['WebSocket', 'Long-poll'] },
    { id: 'blocks',  label: 'Block Storage',     IconComp: HardDrive, color: '#F97316', x: 520, y: 90,  desc: 'Content-addressed object store holding immutable ~4MB blocks. A hash never maps to different content.', tech: ['S3', 'GCS'] },
    { id: 'cdn',     label: 'CDN Edge',          IconComp: Cloud,     color: '#06B6D4', x: 660, y: 200, desc: 'Serves immutable blocks close to the user; immutable content means the edge cache never goes stale.', tech: ['CloudFront', 'Akamai'] },
  ],
  connections: [
    { from: 'devices', to: 'gateway', label: 'delta sync' },
    { from: 'gateway', to: 'meta',    label: 'commit change' },
    { from: 'gateway', to: 'dedup',   label: 'hash chunk' },
    { from: 'dedup',   to: 'blocks',  label: 'store new block' },
    { from: 'meta',    to: 'blocks',  label: 'chunk refs' },
    { from: 'devices', to: 'cdn',     label: 'download block' },
    { from: 'cdn',     to: 'blocks',  label: 'origin fetch' },
    { from: 'meta',    to: 'notify',  label: 'change event', async: true },
    { from: 'notify',  to: 'devices', label: 'push update', async: true },
  ],
  keyDecisions: [
    'Content-addressed chunks: split files into ~4MB blocks named by their hash before upload',
    'Client-side chunk hashing enables dedup — identical blocks across users are stored once',
    'Delta sync uploads only changed chunks, so editing one line sends a handful of blocks',
    'Metadata is the source of truth: file tree, versions, and each file\'s ordered block list',
    'Other devices are notified over WebSocket/long-poll so they pull changes instead of polling',
    'Immutable blocks are served from the CDN with infinite cache headers — a hash never changes',
  ],
  scaleFactors: [
    { label: 'Total storage', value: 'Exabytes of deduplicated blocks; ~4MB chunks balance dedup vs overhead' },
    { label: 'Sync payload',  value: 'Delta sync uploads only changed chunks — often <1% of file size' },
    { label: 'Dedup savings', value: '~30-50% storage saved by deduplicating repeated blocks' },
    { label: 'Sync latency',  value: '<1s to propagate a change notification to other devices' },
  ]
};

const DISTRIBUTED_CACHE: DesignSystem = {
  id: 'distributed-cache',
  title: 'Distributed Cache',
  description: 'Design a Redis/Memcached-style cache cluster in front of a database serving millions of ops/sec',
  nodes: [
    { id: 'app',      label: 'App Servers',      IconComp: Globe,     color: '#4F8EF7', x: 30,  y: 200, desc: 'Application instances that read and write through the cache to offload the origin database.', tech: [] },
    { id: 'proxy',    label: 'Cache Proxy',      IconComp: Scale,     color: '#C9A84C', x: 180, y: 200, desc: 'Consistent-hashing router that picks the shard for a key, pools connections, and pipelines requests.', tech: ['Twemproxy', 'Envoy'] },
    { id: 'shards',   label: 'Cache Shards',     IconComp: Boxes,     color: '#9B5DE5', x: 360, y: 110, desc: 'Redis/Memcached nodes owning a slice of the hash space. Keys route to exactly one primary shard.', tech: ['Redis', 'Memcached'] },
    { id: 'replicas', label: 'Replica Nodes',    IconComp: Layers,    color: '#06B6D4', x: 360, y: 290, desc: 'Per-shard replicas kept warm for failover; the proxy reroutes when a primary is unhealthy.', tech: ['Redis replica', 'Sentinel'] },
    { id: 'hot',      label: 'Hot-Key Cache',    IconComp: Zap,       color: '#22C55E', x: 540, y: 110, desc: 'Extra copies of disproportionately hot keys spread reads so one shard is not the bottleneck.', tech: ['Client-side cache'] },
    { id: 'bus',      label: 'Invalidation Bus', IconComp: RefreshCw, color: '#EF4444', x: 540, y: 290, desc: 'Pub/sub bus that broadcasts invalidations so cached entries do not go stale across nodes.', tech: ['Redis Pub/Sub', 'Kafka'] },
    { id: 'db',       label: 'Origin Store',     IconComp: Database,  color: '#F97316', x: 700, y: 200, desc: 'The source of truth behind the cache. Only cache misses and writes reach it.', tech: ['PostgreSQL'] },
  ],
  connections: [
    { from: 'app',    to: 'proxy',    label: 'GET / SET' },
    { from: 'proxy',  to: 'shards',   label: 'route by hash' },
    { from: 'proxy',  to: 'hot',      label: 'hot key' },
    { from: 'hot',    to: 'shards',   label: 'backfill' },
    { from: 'shards', to: 'replicas', label: 'async replicate', async: true },
    { from: 'shards', to: 'db',       label: 'cache miss' },
    { from: 'db',     to: 'bus',      label: 'change event', async: true },
    { from: 'bus',    to: 'shards',   label: 'invalidate', async: true },
  ],
  keyDecisions: [
    'Consistent hashing maps keys to nodes so adding or removing a shard moves only ~1/N of the keys',
    'Virtual nodes (many ring points per server) even out load across heterogeneous hardware',
    'Eviction policy (LRU/LFU) plus TTL — memory is finite, so the cache must decide what to drop',
    'Replicas per shard give failover; the proxy reroutes to the replica when a primary dies',
    'Hot keys are detected and copied to extra nodes to avoid a single-shard hotspot',
    'Invalidation rides a pub/sub bus (or short TTLs) to keep entries from going stale across nodes',
  ],
  scaleFactors: [
    { label: 'Throughput', value: 'Millions of ops/sec across a cluster of ~100 nodes' },
    { label: 'Hit rate',   value: '~90-99% hit rate cuts origin DB load by 10-100x' },
    { label: 'Key remap',  value: 'Only ~1/N keys move when one node joins or leaves' },
    { label: 'Latency',    value: '<1ms p99 for an in-memory GET/SET' },
  ]
};

const WEB_CRAWLER: DesignSystem = {
  id: 'web-crawler',
  title: 'Web Crawler',
  description: 'Design a search-engine crawler fetching billions of pages politely and without duplicates',
  nodes: [
    { id: 'frontier',   label: 'URL Frontier',    IconComp: ListTree,  color: '#4F8EF7', x: 30,  y: 200, desc: 'Prioritized queue of URLs, split into per-host queues so one slow site never blocks the others.', tech: ['Kafka', 'Priority queue'] },
    { id: 'politeness', label: 'Politeness / Rate', IconComp: Timer,   color: '#C9A84C', x: 180, y: 90,  desc: 'Enforces robots.txt and a per-host crawl-delay so the crawler never hammers any single site.', tech: ['robots.txt', 'Crawl-delay'] },
    { id: 'fetcher',    label: 'Fetcher Pool',    IconComp: Globe,     color: '#9B5DE5', x: 340, y: 200, desc: 'Worker fleet that downloads pages concurrently, retries failures, and caps response size.', tech: ['Go', 'HTTP client pool'] },
    { id: 'dns',        label: 'DNS Cache',       IconComp: Network,   color: '#06B6D4', x: 180, y: 310, desc: 'Caches host → IP resolution so millions of URLs to the same host do not repeat DNS lookups.', tech: ['Redis', 'TTL cache'] },
    { id: 'extractor',  label: 'Link Extractor',  IconComp: GitBranch, color: '#9B5DE5', x: 520, y: 90,  desc: 'Parses HTML, normalizes links (absolute URLs, strips fragments), and hands new URLs to dedup.', tech: ['HTML parser', 'URL normalizer'] },
    { id: 'dedup',      label: 'Seen-URL Filter', IconComp: Shuffle,   color: '#22C55E', x: 690, y: 200, desc: 'Bloom filter of already-seen URLs; tiny memory cost with a small, tunable false-positive rate.', tech: ['Bloom filter'] },
    { id: 'pages',      label: 'Page Store',      IconComp: Database,  color: '#F97316', x: 520, y: 310, desc: 'Stores raw HTML and parsed content for the indexer. Raw pages are kept for reprocessing.', tech: ['S3', 'HDFS'] },
  ],
  connections: [
    { from: 'frontier',   to: 'politeness', label: 'per-host queue' },
    { from: 'politeness', to: 'fetcher',    label: 'next fetch' },
    { from: 'fetcher',    to: 'dns',        label: 'resolve host' },
    { from: 'fetcher',    to: 'extractor',  label: 'parse HTML' },
    { from: 'fetcher',    to: 'pages',      label: 'store page' },
    { from: 'extractor',  to: 'dedup',      label: 'filter seen' },
    { from: 'dedup',      to: 'frontier',   label: 'enqueue new', async: true },
  ],
  keyDecisions: [
    'Frontier is a priority queue with per-host sub-queues so a slow site cannot starve the whole crawl',
    'Politeness: honor robots.txt and space requests per host (crawl-delay) to avoid overloading servers',
    'Bloom filter dedup uses far less memory than an exact set; a rare false positive just skips a URL',
    'DNS caching avoids re-resolving the same host across millions of URLs',
    'Links are normalized before enqueue so the same page reached via different URLs is not crawled twice',
    'Raw pages go to object storage and are fed to the search index asynchronously',
  ],
  scaleFactors: [
    { label: 'Crawl rate',    value: 'Billions of pages/month; ~100K pages/sec across the fleet' },
    { label: 'Dedup memory',  value: '1B URLs ≈ 1.7GB in a Bloom filter at 1% false positive' },
    { label: 'Politeness',    value: 'Per-host limits (~1 req/sec) cap throughput per domain' },
    { label: 'Frontier size', value: 'Hundreds of millions of queued URLs, ranked by importance/freshness' },
  ]
};

const FLASH_SALE: DesignSystem = {
  id: 'flash-sale',
  title: 'Flash Sale / Ticket Booking',
  description: 'Design a ticket drop that survives a thundering herd without ever overselling inventory',
  nodes: [
    { id: 'users',     label: 'Users',             IconComp: Globe,      color: '#4F8EF7', x: 30,  y: 200, desc: 'A huge crowd hitting Buy the instant a sale opens — the classic thundering-herd problem.', tech: [] },
    { id: 'gateway',   label: 'API Gateway',       IconComp: Scale,      color: '#C9A84C', x: 180, y: 90,  desc: 'Authenticates, rate-limits, and hands admitted requests to the queue instead of inventory directly.', tech: ['Nginx', 'Envoy'] },
    { id: 'queue',     label: 'Admission Queue',   IconComp: ListTree,   color: '#C9A84C', x: 180, y: 310, desc: 'Bounded buffer that smooths the spike so the booking service sees a controlled, steady rate.', tech: ['Kafka', 'SQS'] },
    { id: 'booking',   label: 'Booking Service',   IconComp: Server,     color: '#9B5DE5', x: 360, y: 200, desc: 'Runs the reserve → pay → confirm flow with idempotency keys so retries never create duplicate orders.', tech: ['Go', 'Java'] },
    { id: 'idem',      label: 'Idempotency Store', IconComp: KeyRound,   color: '#EF4444', x: 540, y: 90,  desc: 'Records request keys so a retried reserve or charge returns the original result instead of repeating it.', tech: ['Redis', 'Postgres'] },
    { id: 'inventory', label: 'Inventory (Atomic)', IconComp: Zap,       color: '#22C55E', x: 540, y: 200, desc: 'Holds remaining stock and reserves units with an atomic DECR or conditional update to prevent overselling.', tech: ['Redis Lua', 'Postgres'] },
    { id: 'payment',   label: 'Payment Service',   IconComp: CreditCard, color: '#06B6D4', x: 540, y: 310, desc: 'Charges the buyer after the unit is reserved; a failed charge releases the held unit back to inventory.', tech: ['Stripe', 'Adyen'] },
    { id: 'db',        label: 'Inventory DB',      IconComp: Database,   color: '#F97316', x: 700, y: 200, desc: 'Durable source of truth for stock and orders; the fast in-memory inventory is reconciled against it.', tech: ['PostgreSQL', 'Serializable'] },
  ],
  connections: [
    { from: 'users',     to: 'gateway',   label: 'buy (huge spike)' },
    { from: 'gateway',   to: 'queue',     label: 'admit', async: true },
    { from: 'queue',     to: 'booking',   label: 'dequeue', async: true },
    { from: 'booking',   to: 'idem',      label: 'dedupe retries' },
    { from: 'booking',   to: 'inventory', label: 'atomic reserve' },
    { from: 'inventory', to: 'db',        label: 'persist stock' },
    { from: 'booking',   to: 'payment',   label: 'charge', async: true },
    { from: 'payment',   to: 'inventory', label: 'release on fail', async: true },
  ],
  keyDecisions: [
    'Absorb the thundering herd: admit requests through a queue/rate-limiter instead of letting all of them hit inventory',
    'Atomic reservation (Redis Lua DECR or a SQL conditional update with a version column) is what prevents overselling',
    'Idempotency keys on the reserve and pay steps so retries never create duplicate orders',
    'Redis holds hot remaining-stock counts; the database stays the durable source of truth and is reconciled',
    'Pre-warm inventory and open the sale at a controlled time to avoid a stampede at t=0',
    'A bounded queue returns "sold out" fast instead of letting millions of requests pile up into a timeout',
  ],
  scaleFactors: [
    { label: 'Peak RPS',           value: '~1M requests in the first second of a hot sale' },
    { label: 'Inventory',          value: 'A few thousand units — contention, not volume, is the bottleneck' },
    { label: 'Oversell tolerance', value: 'Zero — every reservation is atomic and idempotent' },
    { label: 'Latency',            value: '<100ms p99 for the reserve decision; queued users wait by design' },
  ]
};

const SEARCH_AUTOCOMPLETE: DesignSystem = {
  id: 'search-autocomplete',
  title: 'Search Autocomplete',
  description: 'Design a typeahead that returns ranked suggestions under 100ms for every keystroke',
  nodes: [
    { id: 'clients', label: 'Clients',            IconComp: Globe,      color: '#4F8EF7', x: 30,  y: 200, desc: 'Search inputs firing a query on each keystroke (debounced) and rendering the top suggestions.', tech: [] },
    { id: 'gateway', label: 'API Gateway',        IconComp: Scale,      color: '#C9A84C', x: 180, y: 200, desc: 'Fronts the suggestion API, authenticates, and rate-limits the very high query volume.', tech: ['Nginx', 'Envoy'] },
    { id: 'suggest', label: 'Suggestion Service', IconComp: Search,     color: '#9B5DE5', x: 360, y: 200, desc: 'Normalizes the typed prefix and returns the top-K completions, trimmed to a ranked list.', tech: ['Go', 'Node.js'] },
    { id: 'cache',   label: 'Prefix Cache',       IconComp: Zap,        color: '#22C55E', x: 360, y: 90,  desc: 'Stores the top completions for popular prefixes so most keystrokes never touch the index.', tech: ['Redis'] },
    { id: 'rank',    label: 'Ranking Service',    IconComp: TrendingUp, color: '#EF4444', x: 540, y: 90,  desc: 'Orders candidates by search popularity, recency, and personalization signals.', tech: ['Python', 'ML models'] },
    { id: 'trie',    label: 'Completion Index',   IconComp: ListTree,   color: '#06B6D4', x: 540, y: 200, desc: 'Trie / Elasticsearch completion suggester mapping a prefix to candidate completions in ~ms.', tech: ['Elasticsearch', 'Trie'] },
    { id: 'stream',  label: 'Index Updater',      IconComp: GitBranch,  color: '#C9A84C', x: 540, y: 310, desc: 'Streams aggregated query logs into the index so trending phrases surface within seconds.', tech: ['Kafka', 'Flink'] },
    { id: 'logs',    label: 'Query Logs',         IconComp: Database,   color: '#F97316', x: 700, y: 200, desc: 'Raw search logs that drive popularity counts; aggregated offline and streamed into the index.', tech: ['ClickHouse', 'S3'] },
  ],
  connections: [
    { from: 'clients', to: 'gateway', label: 'keystroke' },
    { from: 'gateway', to: 'suggest', label: 'prefix query' },
    { from: 'suggest', to: 'cache',   label: 'lookup top-K' },
    { from: 'cache',   to: 'trie',    label: 'cache miss' },
    { from: 'trie',    to: 'rank',    label: 'candidates' },
    { from: 'rank',    to: 'cache',   label: 'warm cache', async: true },
    { from: 'logs',    to: 'stream',  label: 'aggregate', async: true },
    { from: 'stream',  to: 'trie',    label: 'index update', async: true },
  ],
  keyDecisions: [
    'Serve the most popular prefixes from Redis; only cache misses reach the completer',
    'Elasticsearch completion suggester (or a trie) returns prefix matches in milliseconds',
    'Rank candidates by search popularity and recency, refreshed continuously from query logs',
    'Stream index updates so trending phrases appear within seconds, not on a nightly rebuild',
    'Debounce keystrokes (~50-100ms) client-side to cut query volume by an order of magnitude',
    'Keep only the top-K suggestions per prefix and cap prefix length to bound index size',
  ],
  scaleFactors: [
    { label: 'Query volume',   value: '~200K autocomplete RPS at peak' },
    { label: 'Latency budget', value: '<100ms p99 per keystroke or the UI feels laggy' },
    { label: 'Cache hit rate', value: '>90% of prefixes answered from Redis' },
    { label: 'Index size',     value: 'Top ~1M query prefixes; the long tail is dropped' },
  ]
};

const SYSTEMS: DesignSystem[] = [URL_SHORTENER, CHAT_APP, NEWS_FEED, RIDE_SHARING, RATE_LIMITER, VIDEO_PLATFORM, NOTIFICATION_SYSTEM, PAYMENT_SYSTEM, FILE_STORAGE, DISTRIBUTED_CACHE, WEB_CRAWLER, FLASH_SALE, SEARCH_AUTOCOMPLETE];

const NODE_W = 104;
const NODE_H = 70;

// Node bounding box top is (node.y - 10), so its visual center is offset from node.y.
function nodeCenter(node: ArchNode) {
  return { x: node.x + NODE_W / 2, y: node.y - 10 + NODE_H / 2 };
}

// Attach a connection to the node's bounding box: the point where the ray from
// the node center toward the other endpoint crosses the box. This keeps arrows on
// the node edge (never hidden underneath) and keeps aligned nodes straight.
function anchorPoint(node: ArchNode, towardsX: number, towardsY: number) {
  const c = nodeCenter(node);
  const dx = towardsX - c.x;
  const dy = towardsY - c.y;
  if (!dx && !dy) return c;
  const sx = dx ? NODE_W / 2 / Math.abs(dx) : Infinity;
  const sy = dy ? NODE_H / 2 / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return { x: c.x + dx * s, y: c.y + dy * s };
}

export default function SystemDesignExplorer() {
  const [activeSystem, setActiveSystem] = useState(SYSTEMS[0]);
  const [selectedNode, setSelectedNode] = useState<ArchNode | null>(null);
  const [showScale, setShowScale] = useState(false);

  const W = 820, H = 480;

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'rgba(10,10,15,0.95)', borderBottom: '1px solid #1E1E35', padding: '18px clamp(16px, 4vw, 28px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <LayoutDashboard size={20} color="#C9A84C" />
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(21px, 5vw, 26px)', color: '#F0F0F8', margin: 0 }}>
            System Design Explorer
          </h1>
        </div>
        <p style={{ fontSize: '13px', color: '#555570' }}>
          Interactive architecture diagrams — click any node for details and technology choices
        </p>
      </div>

      {/* System selector */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', padding: '14px clamp(16px, 4vw, 28px)', borderBottom: '1px solid #1E1E35' }}>
        {SYSTEMS.map(sys => (
          <button key={sys.id} onClick={() => { setActiveSystem(sys); setSelectedNode(null); }} style={{
            padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s ease',
            border: `1px solid ${activeSystem.id === sys.id ? 'rgba(201,168,76,0.4)' : '#1E1E35'}`,
            background: activeSystem.id === sys.id ? 'rgba(201,168,76,0.1)' : 'transparent',
            color: activeSystem.id === sys.id ? '#C9A84C' : '#8888AA',
          }}>{sys.title}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 0 }} className="sd-grid">
        <style>{`
          .sd-node{transition:transform .18s ease}
          .sd-node-base{transition:stroke .18s ease}
          .sd-node:hover{transform:translateY(-2px)}
          .sd-node:hover:not([data-selected]) .sd-node-base{stroke:#3A3A5A}
          @media(min-width:900px){
            .sd-grid{grid-template-columns:minmax(0,1fr) 300px!important}
            .sd-panel{position:sticky;top:0;align-self:start;max-height:100vh}
          }
          @media(max-width:899px){.sd-panel{border-left:none!important}}
        `}</style>
        {/* Diagram area */}
        <div style={{ padding: 'clamp(16px, 4vw, 24px)', overflowY: 'auto' }}>
          <div style={{ marginBottom: '14px' }}>
            <h2 style={{ fontSize: 'clamp(16px, 3.4vw, 18px)', fontWeight: 600, color: '#F0F0F8', marginBottom: '3px' }}>{activeSystem.title}</h2>
            <p style={{ fontSize: '13px', color: '#555570' }}>{activeSystem.description}</p>
          </div>

          {/* SVG Diagram */}
          <div style={{ background: '#0D0D18', border: '1px solid #1E1E35', borderRadius: '16px', overflowX: 'auto', overflowY: 'hidden', marginBottom: '20px' }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', minWidth: '680px', display: 'block' }}>
              <defs>
                <pattern id="grid-sd" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(201,168,76,0.03)" strokeWidth="0.5" />
                </pattern>
                <marker id="arrow-default" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#1E1E35" />
                </marker>
                <marker id="arrow-async" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="rgba(201,168,76,0.5)" />
                </marker>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-sd)" />

              {/* Connections */}
              {activeSystem.connections.map((conn, i) => {
                const f = activeSystem.nodes.find(n => n.id === conn.from);
                const t = activeSystem.nodes.find(n => n.id === conn.to);
                if (!f || !t) return null;
                const fc = nodeCenter(f), tc = nodeCenter(t);
                const p1 = anchorPoint(f, tc.x, tc.y);
                const p2 = anchorPoint(t, fc.x, fc.y);
                const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
                return (
                  <g key={i}>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                      stroke={conn.async ? 'rgba(201,168,76,0.35)' : '#2E2E4E'}
                      strokeWidth="1.5" strokeDasharray={conn.async ? '5,3' : 'none'}
                      markerEnd={conn.async ? 'url(#arrow-async)' : 'url(#arrow-default)'}
                    />
                    {conn.label && (
                      <text x={mx} y={my - 6} textAnchor="middle" fontSize="9" fill="#6A6A88" fontFamily="Inter, sans-serif"
                        paintOrder="stroke" stroke="#0D0D18" strokeWidth="3" strokeLinejoin="round">{conn.label}</text>
                    )}
                  </g>
                );
              })}

              {/* Nodes */}
              {activeSystem.nodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const NodeIcon = node.IconComp;
                return (
                  <g key={node.id} className="sd-node" data-selected={isSelected ? '' : undefined}
                    style={{ cursor: 'pointer' }} onClick={() => setSelectedNode(isSelected ? null : node)}>
                    {/* Opaque base — keeps the grid and connection lines from showing through the node */}
                    <rect className="sd-node-base" x={node.x} y={node.y - 10} width={NODE_W} height={NODE_H} rx={12}
                      fill="#12121E"
                      stroke={isSelected ? node.color : '#1E1E35'}
                      strokeWidth={isSelected ? 1.5 : 1}
                    />
                    {isSelected && (
                      <rect x={node.x} y={node.y - 10} width={NODE_W} height={NODE_H} rx={12}
                        fill={`${node.color}1a`} style={{ pointerEvents: 'none' }} />
                    )}
                    <foreignObject x={node.x + 42} y={node.y + 4} width="20" height="20">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                        <NodeIcon size={16} color={isSelected ? node.color : '#8888AA'} />
                      </div>
                    </foreignObject>
                    <text x={node.x + 52} y={node.y + 40} textAnchor="middle" fontSize="10" fill={isSelected ? node.color : '#8888AA'} fontFamily="Inter, sans-serif" fontWeight={600}>
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px 20px', fontSize: '12px', color: '#555570', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '1px', background: '#2E2E4E' }} />
              Synchronous call
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '20px', height: '0', borderTop: '1.5px dashed rgba(201,168,76,0.5)' }} />
              Async / Event-driven
            </div>
            <span>— Click nodes for details</span>
          </div>

          {/* Key decisions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#F0F0F8' }}>
                {showScale ? 'Scale Numbers' : 'Key Design Decisions'}
              </h3>
              <button onClick={() => setShowScale(!showScale)} style={{
                fontSize: '12px', color: '#C9A84C', cursor: 'pointer',
                background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: '6px', padding: '4px 12px', fontFamily: 'Inter, sans-serif'
              }}>
                {showScale ? 'Show Decisions' : 'Show Scale Numbers'}
              </button>
            </div>
            {showScale ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {activeSystem.scaleFactors.map((s, i) => (
                  <div key={i} style={{ background: '#12121E', border: '1px solid #1E1E35', borderRadius: '10px', padding: '14px 16px' }}>
                    <div style={{ fontSize: '12px', color: '#555570', marginBottom: '4px' }}>{s.label}</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#C9A84C' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeSystem.keyDecisions.map((d, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#12121E', border: '1px solid #1E1E35', borderRadius: '8px', padding: '12px 14px' }}>
                    <span style={{ color: '#C9A84C', flexShrink: 0, fontWeight: 700, fontSize: '13px' }}>{i + 1}.</span>
                    <span style={{ fontSize: '13px', color: '#8888AA', lineHeight: 1.6 }}>{d}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="sd-panel" style={{ borderLeft: '1px solid #1E1E35', borderTop: '1px solid #1E1E35', padding: 'clamp(16px, 4vw, 24px)', overflowY: 'auto' }}>
          {selectedNode ? (
            <div>
              <div style={{
                width: '46px', height: '46px', borderRadius: '12px',
                background: `${selectedNode.color}15`, border: `1px solid ${selectedNode.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
              }}>
                <selectedNode.IconComp size={20} color={selectedNode.color} />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#F0F0F8', marginBottom: '8px' }}>{selectedNode.label}</h3>
              <p style={{ fontSize: '14px', color: '#8888AA', lineHeight: 1.7, marginBottom: '16px' }}>{selectedNode.desc}</p>
              {selectedNode.tech.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#555570', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Technologies</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedNode.tech.map(t => (
                      <span key={t} style={{ fontSize: '12px', fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,255,255,0.04)', border: '1px solid #1E1E35', borderRadius: '4px', padding: '3px 8px', color: '#8888AA' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', paddingTop: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', opacity: 0.3 }}>
                <LayoutDashboard size={32} color="#8888AA" />
              </div>
              <p style={{ fontSize: '14px', color: '#555570', lineHeight: 1.7 }}>
                Click any node in the diagram to see component details and technology choices
              </p>
            </div>
          )}

          <div style={{ marginTop: '32px', borderTop: '1px solid #1E1E35', paddingTop: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#555570', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Components</div>
            {activeSystem.nodes.map(node => {
              const NodeIcon = node.IconComp;
              return (
                <button key={node.id} onClick={() => setSelectedNode(node)} style={{
                  width: '100%', display: 'flex', gap: '10px', alignItems: 'center',
                  padding: '8px 10px', borderRadius: '8px', cursor: 'pointer',
                  background: selectedNode?.id === node.id ? `${node.color}10` : 'transparent',
                  border: `1px solid ${selectedNode?.id === node.id ? `${node.color}25` : 'transparent'}`,
                  transition: 'all 0.15s ease', marginBottom: '4px', fontFamily: 'Inter, sans-serif'
                }}>
                  <NodeIcon size={13} color={selectedNode?.id === node.id ? node.color : '#555570'} />
                  <span style={{ fontSize: '13px', color: selectedNode?.id === node.id ? node.color : '#8888AA' }}>{node.label}</span>
                  <ChevronRight size={11} color="#555570" style={{ marginLeft: 'auto' }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
