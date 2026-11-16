import { Category } from "@/types";

export const CATEGORIES: Category[] = [
  {
    id: "foundations",
    title: "Foundations",
    description: "Core concepts every backend engineer must know",
    icon: "Layers",
    color: "#4F8EF7",
    topics: [
      {
        id: "what-is-backend",
        title: "What is Backend?",
        slug: "what-is-backend",
        description: "Understanding the server side of the web",
        difficulty: "beginner",
        estimatedTime: 10,
        prerequisites: [],
        category: "foundations",
        icon: "Server",
      },
      {
        id: "client-server",
        title: "Client/Server Architecture",
        slug: "client-server",
        description: "How clients and servers communicate",
        difficulty: "beginner",
        estimatedTime: 15,
        prerequisites: ["what-is-backend"],
        category: "foundations",
        icon: "ArrowLeftRight",
      },
      {
        id: "http",
        title: "HTTP & HTTPS",
        slug: "http",
        description: "The protocol powering every web request",
        difficulty: "beginner",
        estimatedTime: 20,
        prerequisites: ["client-server"],
        category: "foundations",
        icon: "Globe",
      },
      {
        id: "dns",
        title: "DNS",
        slug: "dns",
        description: "Domain Name System — the internet's phone book",
        difficulty: "beginner",
        estimatedTime: 15,
        prerequisites: ["http"],
        category: "foundations",
        icon: "MapPin",
      },
      {
        id: "tcp-ip",
        title: "TCP/IP",
        slug: "tcp-ip",
        description: "The transport layer of the internet",
        difficulty: "intermediate",
        estimatedTime: 20,
        prerequisites: ["dns"],
        category: "foundations",
        icon: "Network",
      },
      {
        id: "apis",
        title: "APIs",
        slug: "apis",
        description: "Application Programming Interfaces",
        difficulty: "beginner",
        estimatedTime: 15,
        prerequisites: ["http"],
        category: "foundations",
        icon: "Plug",
      },
      {
        id: "rest",
        title: "REST",
        slug: "rest",
        description: "RESTful API design principles",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["apis"],
        category: "foundations",
        icon: "FileJson",
      },
      {
        id: "graphql",
        title: "GraphQL",
        slug: "graphql",
        description: "Query language for your API",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["rest"],
        category: "foundations",
        icon: "GitMerge",
      },
      {
        id: "websockets",
        title: "WebSockets & SSE",
        slug: "websockets",
        description: "Real-time communication protocols",
        difficulty: "intermediate",
        estimatedTime: 20,
        prerequisites: ["http"],
        category: "foundations",
        icon: "Zap",
      },
      {
        id: "grpc",
        title: "gRPC",
        slug: "grpc",
        description: "High-performance RPC framework",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["rest"],
        category: "foundations",
        icon: "Radio",
      },
    ],
  },
  {
    id: "auth",
    title: "Authentication & Security",
    description: "Securing your applications properly",
    icon: "ShieldCheck",
    color: "#9B5DE5",
    topics: [
      {
        id: "cookies-sessions",
        title: "Cookies & Sessions",
        slug: "cookies-sessions",
        description: "Stateful session management",
        difficulty: "beginner",
        estimatedTime: 20,
        prerequisites: ["http"],
        category: "auth",
        icon: "Cookie",
      },
      {
        id: "jwt",
        title: "JWT",
        slug: "jwt",
        description: "JSON Web Tokens for stateless auth",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["cookies-sessions"],
        category: "auth",
        icon: "KeyRound",
      },
      {
        id: "oauth",
        title: "OAuth 2.0",
        slug: "oauth",
        description: "Delegated authorization standard",
        difficulty: "advanced",
        estimatedTime: 35,
        prerequisites: ["jwt"],
        category: "auth",
        icon: "Key",
      },
      {
        id: "cors",
        title: "CORS",
        slug: "cors",
        description: "Cross-Origin Resource Sharing",
        difficulty: "intermediate",
        estimatedTime: 15,
        prerequisites: ["http"],
        category: "auth",
        icon: "Globe2",
      },
      {
        id: "csrf",
        title: "CSRF & XSS",
        slug: "csrf",
        description: "Cross-site attack vectors and defenses",
        difficulty: "intermediate",
        estimatedTime: 20,
        prerequisites: ["cookies-sessions"],
        category: "auth",
        icon: "ShieldAlert",
      },
      {
        id: "hashing",
        title: "Password Hashing",
        slug: "hashing",
        description: "bcrypt, argon2 and secure storage",
        difficulty: "intermediate",
        estimatedTime: 20,
        prerequisites: ["jwt"],
        category: "auth",
        icon: "Hash",
      },
    ],
  },
  {
    id: "nodejs",
    title: "Node.js",
    description: "Server-side JavaScript runtime internals",
    icon: "Hexagon",
    color: "#22C55E",
    topics: [
      {
        id: "event-loop",
        title: "Event Loop",
        slug: "event-loop",
        description: "Node's single-threaded async engine",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: [],
        category: "nodejs",
        icon: "RefreshCw",
      },
      {
        id: "async-programming",
        title: "Async Programming",
        slug: "async-programming",
        description: "Callbacks, Promises, async/await",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["event-loop"],
        category: "nodejs",
        icon: "Timer",
      },
      {
        id: "streams",
        title: "Streams & Buffers",
        slug: "streams",
        description: "Efficient data handling in Node",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["async-programming"],
        category: "nodejs",
        icon: "Waves",
      },
      {
        id: "clustering",
        title: "Clustering & Workers",
        slug: "clustering",
        description: "Multi-core Node.js applications",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["event-loop"],
        category: "nodejs",
        icon: "Cpu",
      },
      {
        id: "memory",
        title: "Memory Management",
        slug: "memory",
        description: "Heap, GC, and memory leak detection",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["clustering"],
        category: "nodejs",
        icon: "MemoryStick",
      },
    ],
  },
  {
    id: "databases",
    title: "Databases",
    description: "Data storage, retrieval, and optimization",
    icon: "Database",
    color: "#F97316",
    topics: [
      {
        id: "sql-basics",
        title: "SQL Fundamentals",
        slug: "sql-basics",
        description: "Relational database foundations",
        difficulty: "beginner",
        estimatedTime: 30,
        prerequisites: [],
        category: "databases",
        icon: "Table",
      },
      {
        id: "nosql",
        title: "NoSQL",
        slug: "nosql",
        description: "Non-relational database patterns",
        difficulty: "intermediate",
        estimatedTime: 20,
        prerequisites: ["sql-basics"],
        category: "databases",
        icon: "Boxes",
      },
      {
        id: "postgresql",
        title: "PostgreSQL Deep Dive",
        slug: "postgresql",
        description: "Advanced relational database features",
        difficulty: "intermediate",
        estimatedTime: 35,
        prerequisites: ["sql-basics"],
        category: "databases",
        icon: "DatabaseZap",
      },
      {
        id: "redis",
        title: "Redis",
        slug: "redis",
        description: "In-memory data structure store",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["sql-basics"],
        category: "databases",
        icon: "Zap",
      },
      {
        id: "acid",
        title: "ACID & Transactions",
        slug: "acid",
        description: "Database reliability guarantees",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["postgresql"],
        category: "databases",
        icon: "FlaskConical",
      },
      {
        id: "indexing",
        title: "Indexing & Query Optimization",
        slug: "indexing",
        description: "Making queries orders of magnitude faster",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["sql-basics"],
        category: "databases",
        icon: "Search",
      },
      {
        id: "replication",
        title: "Replication & Sharding",
        slug: "replication",
        description: "Scaling databases horizontally",
        difficulty: "advanced",
        estimatedTime: 35,
        prerequisites: ["indexing"],
        category: "databases",
        icon: "Copy",
      },
      {
        id: "cap-theorem",
        title: "CAP Theorem",
        slug: "cap-theorem",
        description: "Consistency, Availability, Partition tolerance",
        difficulty: "advanced",
        estimatedTime: 20,
        prerequisites: ["replication"],
        category: "databases",
        icon: "Triangle",
      },
      {
        id: "graph-databases",
        title: "Graph Databases",
        slug: "graph-databases",
        description: "Nodes, edges, and traversing connected data",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["nosql"],
        category: "databases",
        icon: "Network",
      },
      {
        id: "wide-column-stores",
        title: "Wide-Column Stores",
        slug: "wide-column-stores",
        description: "Cassandra and Bigtable: partitioned column families",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["nosql"],
        category: "databases",
        icon: "Grid3x3",
      },
      {
        id: "probabilistic-structures",
        title: "Probabilistic Data Structures",
        slug: "probabilistic-structures",
        description: "Bloom filters, HyperLogLog, and Count-Min Sketch",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["redis"],
        category: "databases",
        icon: "Hash",
      },
      {
        id: "distributed-id-generation",
        title: "Distributed ID Generation",
        slug: "distributed-id-generation",
        description: "Snowflake IDs, UUIDv7, and monotonic keys",
        difficulty: "intermediate",
        estimatedTime: 20,
        prerequisites: ["replication"],
        category: "databases",
        icon: "Fingerprint",
      },
      {
        id: "replication-topologies",
        title: "Replication Topologies",
        slug: "replication-topologies",
        description: "Single-leader, multi-leader, and leaderless",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["replication"],
        category: "databases",
        icon: "Copy",
      },
      {
        id: "data-lifecycle",
        title: "Data Lifecycle & Retention",
        slug: "data-lifecycle",
        description: "Tiering, archival, and legal retention windows",
        difficulty: "intermediate",
        estimatedTime: 20,
        prerequisites: ["backup-dr"],
        category: "databases",
        icon: "RefreshCw",
      },
    ],
  },
  {
    id: "data-engineering",
    title: "Data Engineering",
    description: "Modeling, storing, searching, and moving data at scale",
    icon: "Boxes",
    color: "#14B8A6",
    topics: [
      {
        id: "data-modeling",
        title: "Data Modeling",
        slug: "data-modeling",
        description: "From entities and relationships to durable schemas",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["sql-basics"],
        category: "data-engineering",
        icon: "Boxes",
      },
      {
        id: "storage-engines",
        title: "Storage Engines: B-Tree vs LSM",
        slug: "storage-engines",
        description: "How databases actually put bytes on disk",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["indexing"],
        category: "data-engineering",
        icon: "Database",
      },
      {
        id: "schema-migrations",
        title: "Schema Migrations",
        slug: "schema-migrations",
        description: "Evolving a live database without downtime",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["postgresql"],
        category: "data-engineering",
        icon: "GitBranch",
      },
      {
        id: "full-text-search",
        title: "Full-Text Search",
        slug: "full-text-search",
        description: "Inverted indexes, analyzers, and relevance ranking",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["indexing"],
        category: "data-engineering",
        icon: "Search",
      },
      {
        id: "object-storage",
        title: "Object Storage",
        slug: "object-storage",
        description: "S3 semantics for files at any scale",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: [],
        category: "data-engineering",
        icon: "Boxes",
      },
      {
        id: "olap-analytics",
        title: "OLAP & Analytical Databases",
        slug: "olap-analytics",
        description: "Columnar storage, star schemas, and batch ELT",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["sql-basics"],
        category: "data-engineering",
        icon: "BarChart2",
      },
      {
        id: "time-series",
        title: "Time-Series Databases",
        slug: "time-series",
        description: "Metrics, retention, and downsampling at scale",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["indexing"],
        category: "data-engineering",
        icon: "Activity",
      },
      {
        id: "change-data-capture",
        title: "Change Data Capture",
        slug: "change-data-capture",
        description: "Streaming database changes to downstream systems",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["postgresql"],
        category: "data-engineering",
        icon: "Waypoints",
      },
      {
        id: "vector-databases",
        title: "Vector Databases",
        slug: "vector-databases",
        description: "Embeddings and approximate nearest-neighbour search",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["nosql"],
        category: "data-engineering",
        icon: "Network",
      },
      {
        id: "backup-dr",
        title: "Backups & Disaster Recovery",
        slug: "backup-dr",
        description: "RPO, RTO, and proving restores actually work",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["replication"],
        category: "data-engineering",
        icon: "Copy",
      },
    ],
  },
  {
    id: "architecture",
    title: "Architecture",
    description: "System design and architectural patterns",
    icon: "Building2",
    color: "#C9A84C",
    topics: [
      {
        id: "monolith",
        title: "Monoliths vs Microservices",
        slug: "monolith",
        description: "Choosing the right architecture",
        difficulty: "beginner",
        estimatedTime: 20,
        prerequisites: [],
        category: "architecture",
        icon: "Box",
      },
      {
        id: "microservices",
        title: "Microservices Deep Dive",
        slug: "microservices",
        description: "Building distributed systems",
        difficulty: "advanced",
        estimatedTime: 40,
        prerequisites: ["monolith"],
        category: "architecture",
        icon: "Grid3x3",
      },
      {
        id: "event-driven",
        title: "Event-Driven Architecture",
        slug: "event-driven",
        description: "Async event-based system design",
        difficulty: "advanced",
        estimatedTime: 35,
        prerequisites: ["microservices"],
        category: "architecture",
        icon: "Waypoints",
      },
      {
        id: "cqrs",
        title: "CQRS & Event Sourcing",
        slug: "cqrs",
        description: "Command Query Responsibility Segregation",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["event-driven"],
        category: "architecture",
        icon: "Scissors",
      },
      {
        id: "clean-arch",
        title: "Clean Architecture",
        slug: "clean-arch",
        description: "Layered system design patterns",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["microservices"],
        category: "architecture",
        icon: "Target",
      },
      {
        id: "api-gateway",
        title: "API Gateway & BFF",
        slug: "api-gateway",
        description: "Central entry points and backend-for-frontend",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["microservices"],
        category: "architecture",
        icon: "Waypoints",
      },
      {
        id: "resilience-patterns",
        title: "Resilience Patterns",
        slug: "resilience-patterns",
        description: "Circuit breakers, retries, bulkheads, and timeouts",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["microservices"],
        category: "architecture",
        icon: "ShieldCheck",
      },
    ],
  },
  {
    id: "scaling",
    title: "Scaling & Performance",
    description: "Building systems that handle massive load",
    icon: "TrendingUp",
    color: "#EF4444",
    topics: [
      {
        id: "caching",
        title: "Caching Strategies",
        slug: "caching",
        description: "Cache patterns, TTL, and invalidation",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["redis"],
        category: "scaling",
        icon: "Zap",
      },
      {
        id: "load-balancing",
        title: "Load Balancing",
        slug: "load-balancing",
        description: "Distributing traffic efficiently",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: [],
        category: "scaling",
        icon: "Scale",
      },
      {
        id: "cdn",
        title: "CDN",
        slug: "cdn",
        description: "Content Delivery Networks",
        difficulty: "intermediate",
        estimatedTime: 15,
        prerequisites: ["load-balancing"],
        category: "scaling",
        icon: "Globe",
      },
      {
        id: "queues",
        title: "Message Queues",
        slug: "queues",
        description: "Kafka, RabbitMQ, BullMQ deep dive",
        difficulty: "advanced",
        estimatedTime: 35,
        prerequisites: [],
        category: "scaling",
        icon: "List",
      },
      {
        id: "rate-limiting",
        title: "Rate Limiting",
        slug: "rate-limiting",
        description: "Protecting APIs from abuse",
        difficulty: "intermediate",
        estimatedTime: 20,
        prerequisites: ["caching"],
        category: "scaling",
        icon: "Gauge",
      },
      {
        id: "consistent-hashing",
        title: "Consistent Hashing",
        slug: "consistent-hashing",
        description: "Distributing keys evenly with minimal reshuffling",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["replication"],
        category: "scaling",
        icon: "RefreshCw",
      },
      {
        id: "capacity-planning",
        title: "Capacity Planning",
        slug: "capacity-planning",
        description: "Sizing systems with headroom and cost in mind",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["load-balancing"],
        category: "scaling",
        icon: "Gauge",
      },
      {
        id: "load-testing",
        title: "Performance & Load Testing",
        slug: "load-testing",
        description: "k6, latency percentiles, and finding breaking points",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["load-balancing"],
        category: "scaling",
        icon: "Activity",
      },
      {
        id: "multi-region",
        title: "Multi-Region Architecture",
        slug: "multi-region",
        description: "Active-passive and active-active across the globe",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["replication"],
        category: "scaling",
        icon: "Globe",
      },
    ],
  },
  {
    id: "devops",
    title: "DevOps & Deployment",
    description: "Shipping and operating production systems",
    icon: "Rocket",
    color: "#4F8EF7",
    topics: [
      {
        id: "docker",
        title: "Docker",
        slug: "docker",
        description: "Containerization fundamentals",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: [],
        category: "devops",
        icon: "Container",
      },
      {
        id: "kubernetes",
        title: "Kubernetes",
        slug: "kubernetes",
        description: "Container orchestration at scale",
        difficulty: "advanced",
        estimatedTime: 45,
        prerequisites: ["docker"],
        category: "devops",
        icon: "Workflow",
      },
      {
        id: "cicd",
        title: "CI/CD Pipelines",
        slug: "cicd",
        description: "Automated build and deploy",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["docker"],
        category: "devops",
        icon: "GitBranch",
      },
      {
        id: "nginx",
        title: "Nginx & Reverse Proxies",
        slug: "nginx",
        description: "Web server and reverse proxy config",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["load-balancing"],
        category: "devops",
        icon: "ArrowLeftRight",
      },
      {
        id: "monitoring",
        title: "Monitoring & Observability",
        slug: "monitoring",
        description: "Logs, metrics, and distributed tracing",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["docker"],
        category: "devops",
        icon: "Activity",
      },
      {
        id: "iac",
        title: "Infrastructure as Code",
        slug: "iac",
        description: "Terraform, Pulumi, and reproducible infrastructure",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["docker"],
        category: "devops",
        icon: "Settings",
      },
      {
        id: "gitops",
        title: "GitOps & Progressive Delivery",
        slug: "gitops",
        description: "Git as the source of truth for deploys",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["cicd"],
        category: "devops",
        icon: "GitBranch",
      },
      {
        id: "k8s-advanced",
        title: "Kubernetes Workloads & Autoscaling",
        slug: "k8s-advanced",
        description: "Probes, HPA, resources, and StatefulSets",
        difficulty: "advanced",
        estimatedTime: 35,
        prerequisites: ["kubernetes"],
        category: "devops",
        icon: "Workflow",
      },
      {
        id: "linux-fundamentals",
        title: "Linux & OS for Backend",
        slug: "linux-fundamentals",
        description: "Processes, signals, file descriptors, and systemd",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: [],
        category: "devops",
        icon: "Terminal",
      },
      {
        id: "cloud-networking",
        title: "Cloud Networking",
        slug: "cloud-networking",
        description: "VPCs, subnets, security groups, and private links",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["nginx"],
        category: "devops",
        icon: "Network",
      },
      {
        id: "observability-alerting",
        title: "Alerting & Log Aggregation",
        slug: "observability-alerting",
        description: "Structured logs, dashboards, and alerts that wake you",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["monitoring"],
        category: "devops",
        icon: "Activity",
      },
      {
        id: "slo-error-budgets",
        title: "SLOs & Error Budgets",
        slug: "slo-error-budgets",
        description: "Turning reliability into an engineering budget",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["monitoring"],
        category: "devops",
        icon: "Target",
      },
      {
        id: "chaos-engineering",
        title: "Chaos Engineering",
        slug: "chaos-engineering",
        description: "Finding weaknesses by injecting controlled failure",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["monitoring"],
        category: "devops",
        icon: "FlaskConical",
      },
      {
        id: "incident-response",
        title: "Incident Response",
        slug: "incident-response",
        description: "Declaring, running, and learning from incidents",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["monitoring"],
        category: "devops",
        icon: "ShieldAlert",
      },
      {
        id: "distributed-tracing",
        title: "Distributed Tracing (OpenTelemetry)",
        slug: "distributed-tracing",
        description: "Spans, context propagation, and tail-based sampling",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["monitoring"],
        category: "devops",
        icon: "Waypoints",
      },
      {
        id: "metrics-methods",
        title: "Metrics & RED/USE Methods",
        slug: "metrics-methods",
        description: "Counters, histograms, and what to actually measure",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["monitoring"],
        category: "devops",
        icon: "BarChart2",
      },
      {
        id: "continuous-profiling",
        title: "Continuous Profiling",
        slug: "continuous-profiling",
        description: "Always-on flamegraphs to find production hotspots",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["monitoring"],
        category: "devops",
        icon: "Activity",
      },
    ],
  },
  {
    id: "api-design",
    title: "API Design & Protocols",
    description: "Contract-first API design, evolution, and reliability",
    icon: "Plug",
    color: "#0EA5E9",
    topics: [
      {
        id: "api-pagination",
        title: "Pagination & Filtering",
        slug: "api-pagination",
        description:
          "Cursor vs offset pagination, and doing it efficiently at scale",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["rest"],
        category: "api-design",
        icon: "List",
      },
      {
        id: "api-versioning",
        title: "API Versioning & Evolution",
        slug: "api-versioning",
        description: "Evolving APIs without breaking existing clients",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["rest"],
        category: "api-design",
        icon: "GitBranch",
      },
      {
        id: "openapi",
        title: "OpenAPI & API Contracts",
        slug: "openapi",
        description: "Contract-first API design, docs, and codegen",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["rest"],
        category: "api-design",
        icon: "FileJson",
      },
      {
        id: "http-caching",
        title: "HTTP Caching & Conditional Requests",
        slug: "http-caching",
        description: "ETags, Cache-Control, and revalidation done right",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["http"],
        category: "api-design",
        icon: "RefreshCw",
      },
      {
        id: "serialization",
        title: "Serialization Formats",
        slug: "serialization",
        description: "JSON, Protobuf, Avro, and MessagePack trade-offs",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["http"],
        category: "api-design",
        icon: "Code2",
      },
      {
        id: "webhooks",
        title: "Webhooks & Event Callbacks",
        slug: "webhooks",
        description: "Reliably pushing events to external systems",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["http"],
        category: "api-design",
        icon: "Bell",
      },
      {
        id: "grpc-streaming",
        title: "gRPC Streaming & Interceptors",
        slug: "grpc-streaming",
        description: "Server, client, and bidirectional streaming in gRPC",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["grpc"],
        category: "api-design",
        icon: "Radio",
      },
      {
        id: "idempotency",
        title: "Idempotency & Safe Retries",
        slug: "idempotency",
        description: "Designing operations that survive retries and duplicates",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["rest"],
        category: "api-design",
        icon: "Fingerprint",
      },
    ],
  },
  {
    id: "testing",
    title: "Testing & Quality",
    description: "Proving your systems work before they ship",
    icon: "FlaskConical",
    color: "#EC4899",
    topics: [
      {
        id: "testing-fundamentals",
        title: "Testing Fundamentals",
        slug: "testing-fundamentals",
        description: "The test pyramid, test doubles, and deterministic tests",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: [],
        category: "testing",
        icon: "FlaskConical",
      },
      {
        id: "integration-testing",
        title: "Integration Testing",
        slug: "integration-testing",
        description:
          "Real databases, Testcontainers, and isolated parallel runs",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["testing-fundamentals"],
        category: "testing",
        icon: "Container",
      },
      {
        id: "contract-testing",
        title: "Contract Testing",
        slug: "contract-testing",
        description:
          "Consumer-driven contracts that catch breaking changes early",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["integration-testing"],
        category: "testing",
        icon: "FileJson",
      },
      {
        id: "e2e-testing",
        title: "End-to-End Testing",
        slug: "e2e-testing",
        description: "Playwright and Cypress against real user journeys",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["integration-testing"],
        category: "testing",
        icon: "PlayCircle",
      },
      {
        id: "property-based-testing",
        title: "Property-Based & Fuzz Testing",
        slug: "property-based-testing",
        description: "Generating inputs to falsify invariants automatically",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["testing-fundamentals"],
        category: "testing",
        icon: "FlaskConical",
      },
      {
        id: "test-strategy",
        title: "Test Strategy & Flakiness",
        slug: "test-strategy",
        description: "Coverage, mutation testing, and taming flaky suites",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["testing-fundamentals"],
        category: "testing",
        icon: "Target",
      },
    ],
  },
  {
    id: "system-design",
    title: "System Design",
    description: "Design systems that scale to millions",
    icon: "LayoutDashboard",
    color: "#9B5DE5",
    topics: [
      {
        id: "url-shortener",
        title: "Design URL Shortener",
        slug: "url-shortener",
        description: "Design a bit.ly clone end-to-end",
        difficulty: "intermediate",
        estimatedTime: 40,
        prerequisites: [],
        category: "system-design",
        icon: "Link",
      },
      {
        id: "chat-app",
        title: "Design Chat Application",
        slug: "chat-app",
        description: "Real-time messaging at scale",
        difficulty: "advanced",
        estimatedTime: 50,
        prerequisites: ["websockets", "queues"],
        category: "system-design",
        icon: "MessageSquare",
      },
      {
        id: "notification-system",
        title: "Notification System",
        slug: "notification-system",
        description: "Push notifications at massive scale",
        difficulty: "advanced",
        estimatedTime: 45,
        prerequisites: ["queues"],
        category: "system-design",
        icon: "Bell",
      },
      {
        id: "payment-system",
        title: "Payment System",
        slug: "payment-system",
        description: "Reliable financial transaction design",
        difficulty: "advanced",
        estimatedTime: 55,
        prerequisites: ["acid", "queues"],
        category: "system-design",
        icon: "CreditCard",
      },
      {
        id: "design-news-feed",
        title: "Design a News Feed",
        slug: "design-news-feed",
        description: "Fanout, ranking, and caching at millions of DAU",
        difficulty: "advanced",
        estimatedTime: 45,
        prerequisites: ["caching", "cdn"],
        category: "system-design",
        icon: "List",
      },
      {
        id: "design-file-storage",
        title: "Design File Storage",
        slug: "design-file-storage",
        description: "Chunking, deduplication, and multi-device sync",
        difficulty: "advanced",
        estimatedTime: 45,
        prerequisites: ["object-storage"],
        category: "system-design",
        icon: "Boxes",
      },
      {
        id: "design-search-autocomplete",
        title: "Design Search Autocomplete",
        slug: "design-search-autocomplete",
        description: "Sub-100ms suggestions from prefix to ranked list",
        difficulty: "advanced",
        estimatedTime: 40,
        prerequisites: ["full-text-search", "caching"],
        category: "system-design",
        icon: "Search",
      },
      {
        id: "design-video-platform",
        title: "Design a Video Platform",
        slug: "design-video-platform",
        description: "Upload, transcode, distribute, and count views",
        difficulty: "advanced",
        estimatedTime: 50,
        prerequisites: ["cdn", "queues"],
        category: "system-design",
        icon: "PlayCircle",
      },
      {
        id: "design-distributed-cache",
        title: "Design a Distributed Cache",
        slug: "design-distributed-cache",
        description: "Hashing, eviction, and stampede protection",
        difficulty: "advanced",
        estimatedTime: 45,
        prerequisites: ["caching", "consistent-hashing"],
        category: "system-design",
        icon: "Zap",
      },
      {
        id: "design-ticket-booking",
        title: "Design a Ticket Booking System",
        slug: "design-ticket-booking",
        description: "Seat locking, no overselling, and flash-sale spikes",
        difficulty: "advanced",
        estimatedTime: 50,
        prerequisites: ["acid", "queues"],
        category: "system-design",
        icon: "CreditCard",
      },
      {
        id: "design-rate-limiter",
        title: "Design a Rate Limiter",
        slug: "design-rate-limiter",
        description: "Distributed token buckets without race conditions",
        difficulty: "advanced",
        estimatedTime: 40,
        prerequisites: ["rate-limiting"],
        category: "system-design",
        icon: "Gauge",
      },
      {
        id: "design-kv-store",
        title: "Design a Key-Value Store",
        slug: "design-kv-store",
        description: "Partitioning, replication, and quorum reads/writes",
        difficulty: "advanced",
        estimatedTime: 50,
        prerequisites: ["consistent-hashing", "replication"],
        category: "system-design",
        icon: "Database",
      },
      {
        id: "design-web-crawler",
        title: "Design a Web Crawler",
        slug: "design-web-crawler",
        description: "Frontier scheduling, politeness, and dedup at scale",
        difficulty: "advanced",
        estimatedTime: 40,
        prerequisites: ["queues"],
        category: "system-design",
        icon: "Search",
      },
      {
        id: "design-message-queue",
        title: "Design a Message Queue",
        slug: "design-message-queue",
        description: "Ordering, delivery guarantees, and consumer groups",
        difficulty: "advanced",
        estimatedTime: 45,
        prerequisites: ["queues"],
        category: "system-design",
        icon: "List",
      },
      {
        id: "design-proximity-service",
        title: "Design a Proximity Service",
        slug: "design-proximity-service",
        description: "Geohashing and nearest-neighbour search on maps",
        difficulty: "intermediate",
        estimatedTime: 40,
        prerequisites: ["indexing"],
        category: "system-design",
        icon: "MapPin",
      },
      {
        id: "design-collaborative-editor",
        title: "Design a Collaborative Editor",
        slug: "design-collaborative-editor",
        description: "OT, CRDTs, and real-time presence for shared docs",
        difficulty: "advanced",
        estimatedTime: 45,
        prerequisites: ["websockets"],
        category: "system-design",
        icon: "Code2",
      },
      {
        id: "design-leaderboard",
        title: "Design a Leaderboard",
        slug: "design-leaderboard",
        description: "Redis sorted sets and ranked queries at scale",
        difficulty: "intermediate",
        estimatedTime: 35,
        prerequisites: ["redis"],
        category: "system-design",
        icon: "TrendingUp",
      },
      {
        id: "design-stock-exchange",
        title: "Design a Stock Exchange",
        slug: "design-stock-exchange",
        description: "Matching engines, order books, and determinism",
        difficulty: "advanced",
        estimatedTime: 55,
        prerequisites: ["acid"],
        category: "system-design",
        icon: "TrendingUp",
      },
      {
        id: "design-ride-sharing",
        title: "Design a Ride-Sharing Service",
        slug: "design-ride-sharing",
        description: "Real-time matching and location pipelines (Uber)",
        difficulty: "advanced",
        estimatedTime: 50,
        prerequisites: ["design-proximity-service"],
        category: "system-design",
        icon: "MapPin",
      },
      {
        id: "design-ad-click-aggregator",
        title: "Design an Ad Click Aggregator",
        slug: "design-ad-click-aggregator",
        description: "High-volume ingest and near-real-time aggregation",
        difficulty: "advanced",
        estimatedTime: 45,
        prerequisites: ["queues"],
        category: "system-design",
        icon: "BarChart2",
      },
      {
        id: "design-metrics-system",
        title: "Design a Metrics System",
        slug: "design-metrics-system",
        description: "Ingest, rollup, and query time-series at scale",
        difficulty: "advanced",
        estimatedTime: 45,
        prerequisites: ["time-series"],
        category: "system-design",
        icon: "Activity",
      },
      {
        id: "design-id-generator",
        title: "Design a Distributed ID Generator",
        slug: "design-id-generator",
        description: "Globally unique, roughly sortable IDs at scale",
        difficulty: "intermediate",
        estimatedTime: 35,
        prerequisites: ["distributed-id-generation"],
        category: "system-design",
        icon: "Fingerprint",
      },
    ],
  },
  {
    id: "security",
    title: "Security & Compliance",
    description: "Identity, hardening, and regulatory obligations",
    icon: "Lock",
    color: "#F43F5E",
    topics: [
      {
        id: "openid-connect",
        title: "OpenID Connect (OIDC)",
        slug: "openid-connect",
        description: "Identity on top of OAuth 2.0, ID tokens, and JWKS",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["oauth"],
        category: "security",
        icon: "KeyRound",
      },
      {
        id: "saml-sso",
        title: "SAML & Enterprise SSO",
        slug: "saml-sso",
        description: "Identity federation for enterprise customers",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["oauth"],
        category: "security",
        icon: "Building2",
      },
      {
        id: "mtls",
        title: "Mutual TLS (mTLS)",
        slug: "mtls",
        description: "Certificate-based service-to-service authentication",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["tls-ssl"],
        category: "security",
        icon: "ShieldCheck",
      },
      {
        id: "authorization-models",
        title: "Authorization Models (RBAC/ABAC)",
        slug: "authorization-models",
        description: "RBAC, ABAC, ReBAC, and policy engines like OPA",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["oauth"],
        category: "security",
        icon: "ShieldAlert",
      },
      {
        id: "secrets-management",
        title: "Secrets & Key Management",
        slug: "secrets-management",
        description: "Vault, KMS, rotation, and encryption at rest",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: [],
        category: "security",
        icon: "Key",
      },
      {
        id: "web-vulnerabilities",
        title: "Web Vulnerability Deep Dive",
        slug: "web-vulnerabilities",
        description: "XXE, insecure deserialization, SSRF, and clickjacking",
        difficulty: "advanced",
        estimatedTime: 35,
        prerequisites: ["csrf"],
        category: "security",
        icon: "ShieldAlert",
      },
      {
        id: "supply-chain-security",
        title: "Software Supply Chain Security",
        slug: "supply-chain-security",
        description: "SBOMs, dependency scanning, and signed artifacts",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["cicd"],
        category: "security",
        icon: "Boxes",
      },
      {
        id: "waf-ddos",
        title: "WAF, DDoS & Bot Mitigation",
        slug: "waf-ddos",
        description: "Edge filtering, challenges, and volumetric defense",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["nginx"],
        category: "security",
        icon: "ShieldCheck",
      },
      {
        id: "threat-modeling",
        title: "Threat Modeling & Zero Trust",
        slug: "threat-modeling",
        description: "STRIDE, attack surface mapping, and zero trust",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: [],
        category: "security",
        icon: "Fingerprint",
      },
      {
        id: "compliance",
        title: "Compliance: GDPR, PCI-DSS & SOC 2",
        slug: "compliance",
        description: "Data privacy, audit trails, and staying certified",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: [],
        category: "security",
        icon: "FileJson",
      },
    ],
  },
  {
    id: "distributed-systems",
    title: "Distributed Systems",
    description: "Agreement, coordination, and correctness across nodes",
    icon: "Network",
    color: "#8B5CF6",
    topics: [
      {
        id: "consensus",
        title: "Consensus: Raft & Paxos",
        slug: "consensus",
        description: "How nodes agree on a single value despite failures",
        difficulty: "advanced",
        estimatedTime: 35,
        prerequisites: ["cap-theorem"],
        category: "distributed-systems",
        icon: "GitMerge",
      },
      {
        id: "leader-election",
        title: "Leader Election",
        slug: "leader-election",
        description: "Choosing one coordinator safely and quickly",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["consensus"],
        category: "distributed-systems",
        icon: "Target",
      },
      {
        id: "distributed-locking",
        title: "Distributed Locking",
        slug: "distributed-locking",
        description: "Redlock, leases, and fencing tokens",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["redis"],
        category: "distributed-systems",
        icon: "Lock",
      },
      {
        id: "time-ordering",
        title: "Clocks & Ordering",
        slug: "time-ordering",
        description: "Lamport and vector clocks, and why time is hard",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["consensus"],
        category: "distributed-systems",
        icon: "Timer",
      },
      {
        id: "distributed-transactions",
        title: "Distributed Transactions",
        slug: "distributed-transactions",
        description: "2PC, sagas, and the outbox pattern",
        difficulty: "advanced",
        estimatedTime: 35,
        prerequisites: ["microservices"],
        category: "distributed-systems",
        icon: "Scissors",
      },
      {
        id: "delivery-semantics",
        title: "Delivery Semantics",
        slug: "delivery-semantics",
        description: "At-most, at-least, and exactly-once processing",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["queues"],
        category: "distributed-systems",
        icon: "ArrowLeftRight",
      },
      {
        id: "consistency-models",
        title: "Consistency Models",
        slug: "consistency-models",
        description: "Quorums, tunable consistency, and split-brain",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["cap-theorem"],
        category: "distributed-systems",
        icon: "Scale",
      },
    ],
  },
  {
    id: "streaming",
    title: "Streaming & Messaging",
    description: "Moving and processing events reliably",
    icon: "Waves",
    color: "#06B6D4",
    topics: [
      {
        id: "kafka-internals",
        title: "Kafka Internals",
        slug: "kafka-internals",
        description: "Partitions, offsets, replication, and rebalancing",
        difficulty: "advanced",
        estimatedTime: 35,
        prerequisites: ["queues"],
        category: "streaming",
        icon: "Layers",
      },
      {
        id: "managed-queues",
        title: "Managed Messaging (SQS/SNS)",
        slug: "managed-queues",
        description: "Cloud-native queues, topics, and dead-lettering",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["queues"],
        category: "streaming",
        icon: "List",
      },
      {
        id: "stream-processing",
        title: "Stream Processing",
        slug: "stream-processing",
        description: "Windowing, watermarks, and stateful operators",
        difficulty: "advanced",
        estimatedTime: 35,
        prerequisites: ["kafka-internals"],
        category: "streaming",
        icon: "Activity",
      },
      {
        id: "batch-processing",
        title: "Batch Processing",
        slug: "batch-processing",
        description: "MapReduce and Spark for large offline jobs",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["olap-analytics"],
        category: "streaming",
        icon: "Grid3x3",
      },
      {
        id: "data-pipelines",
        title: "Data Pipelines & Orchestration",
        slug: "data-pipelines",
        description: "Airflow, dbt, and building reliable ELT",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["change-data-capture"],
        category: "streaming",
        icon: "Workflow",
      },
      {
        id: "lakehouse",
        title: "Data Lake & Lakehouse",
        slug: "lakehouse",
        description: "Columnar files, table formats, and open storage",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["olap-analytics"],
        category: "streaming",
        icon: "Database",
      },
      {
        id: "schema-registry",
        title: "Schema Registry & Governance",
        slug: "schema-registry",
        description: "Compatibility rules for evolving event schemas",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["kafka-internals"],
        category: "streaming",
        icon: "FileJson",
      },
    ],
  },
  {
    id: "realtime",
    title: "Real-Time & Protocols",
    description: "Wire-level protocols and live communication",
    icon: "Radio",
    color: "#F59E0B",
    topics: [
      {
        id: "tls-ssl",
        title: "TLS/SSL Deep Dive",
        slug: "tls-ssl",
        description: "Handshakes, certificates, and cipher suites",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["http"],
        category: "realtime",
        icon: "ShieldCheck",
      },
      {
        id: "http3-quic",
        title: "HTTP/3 & QUIC",
        slug: "http3-quic",
        description: "UDP transport, 0-RTT, and eliminating HOL blocking",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["http"],
        category: "realtime",
        icon: "Zap",
      },
      {
        id: "long-polling",
        title: "Long Polling & SSE",
        slug: "long-polling",
        description: "Server push without WebSockets, and when to use it",
        difficulty: "intermediate",
        estimatedTime: 20,
        prerequisites: ["http"],
        category: "realtime",
        icon: "Timer",
      },
      {
        id: "webrtc",
        title: "WebRTC",
        slug: "webrtc",
        description: "Peer-to-peer audio, video, and data channels",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["websockets"],
        category: "realtime",
        icon: "Waves",
      },
      {
        id: "mqtt-iot",
        title: "MQTT & IoT Messaging",
        slug: "mqtt-iot",
        description: "Lightweight pub/sub for constrained devices",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["websockets"],
        category: "realtime",
        icon: "Radio",
      },
      {
        id: "ssh-sftp",
        title: "SSH, SFTP & Secure Transfer",
        slug: "ssh-sftp",
        description: "Keys, tunnels, and moving files safely",
        difficulty: "intermediate",
        estimatedTime: 20,
        prerequisites: [],
        category: "realtime",
        icon: "Terminal",
      },
      {
        id: "grpc-web",
        title: "gRPC-Web & Connect",
        slug: "grpc-web",
        description: "Reaching gRPC from browsers via proxies",
        difficulty: "advanced",
        estimatedTime: 25,
        prerequisites: ["grpc"],
        category: "realtime",
        icon: "ArrowLeftRight",
      },
    ],
  },
  {
    id: "advanced-api",
    title: "Advanced API Patterns",
    description: "Beyond REST: typed, event, and contract-first APIs",
    icon: "Link",
    color: "#10B981",
    topics: [
      {
        id: "graphql-advanced",
        title: "GraphQL Advanced",
        slug: "graphql-advanced",
        description: "Subscriptions, federation, and solving N+1",
        difficulty: "advanced",
        estimatedTime: 35,
        prerequisites: ["graphql"],
        category: "advanced-api",
        icon: "GitMerge",
      },
      {
        id: "asyncapi",
        title: "AsyncAPI & Event Contracts",
        slug: "asyncapi",
        description: "Describing event-driven APIs as contracts",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["event-driven"],
        category: "advanced-api",
        icon: "FileJson",
      },
      {
        id: "trpc",
        title: "tRPC & End-to-End Types",
        slug: "trpc",
        description: "Type-safe RPC without codegen or schemas",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["rest"],
        category: "advanced-api",
        icon: "Plug",
      },
      {
        id: "hateoas-jsonapi",
        title: "HATEOAS & JSON:API",
        slug: "hateoas-jsonapi",
        description: "Hypermedia-driven and standardized REST payloads",
        difficulty: "intermediate",
        estimatedTime: 20,
        prerequisites: ["rest"],
        category: "advanced-api",
        icon: "Link",
      },
      {
        id: "soap-xml",
        title: "SOAP & XML-RPC",
        slug: "soap-xml",
        description: "Legacy enterprise integration you still have to touch",
        difficulty: "intermediate",
        estimatedTime: 20,
        prerequisites: ["rest"],
        category: "advanced-api",
        icon: "Code2",
      },
    ],
  },
  {
    id: "runtimes",
    title: "Runtimes & Frameworks",
    description: "Backend languages, frameworks, and execution models",
    icon: "Cpu",
    color: "#A855F7",
    topics: [
      {
        id: "python-backend",
        title: "Python for Backend",
        slug: "python-backend",
        description: "FastAPI, Django, and async Python trade-offs",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: [],
        category: "runtimes",
        icon: "Terminal",
      },
      {
        id: "go-backend",
        title: "Go for Backend",
        slug: "go-backend",
        description: "Goroutines, channels, and simple concurrency",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: [],
        category: "runtimes",
        icon: "Cpu",
      },
      {
        id: "java-backend",
        title: "Java & Spring Boot",
        slug: "java-backend",
        description: "The JVM, threads, and enterprise frameworks",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: [],
        category: "runtimes",
        icon: "Building2",
      },
      {
        id: "rust-backend",
        title: "Rust for Backend",
        slug: "rust-backend",
        description: "Ownership, Tokio, and memory-safe performance",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: [],
        category: "runtimes",
        icon: "Settings",
      },
      {
        id: "serverless-faas",
        title: "Serverless & FaaS",
        slug: "serverless-faas",
        description: "Cold starts, event triggers, and when to avoid it",
        difficulty: "intermediate",
        estimatedTime: 30,
        prerequisites: ["docker"],
        category: "runtimes",
        icon: "Zap",
      },
      {
        id: "profiling",
        title: "Performance Profiling",
        slug: "profiling",
        description: "Flamegraphs, CPU profiles, and finding hot paths",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["monitoring"],
        category: "runtimes",
        icon: "Activity",
      },
      {
        id: "monorepo-package-management",
        title: "Monorepos & Package Management",
        slug: "monorepo-package-management",
        description: "Workspaces, dependency graphs, and build caching",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: [],
        category: "runtimes",
        icon: "Boxes",
      },
    ],
  },
  {
    id: "platform",
    title: "Platform Engineering",
    description: "Internal platforms, cloud cost, and developer experience",
    icon: "Settings",
    color: "#0891B2",
    topics: [
      {
        id: "config-management",
        title: "Configuration Management",
        slug: "config-management",
        description: "Ansible and idempotent host provisioning",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["linux-fundamentals"],
        category: "platform",
        icon: "Settings",
      },
      {
        id: "container-registry",
        title: "Container Registries & Image Supply Chain",
        slug: "container-registry",
        description: "Registries, image scanning, and signing",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["docker"],
        category: "platform",
        icon: "Container",
      },
      {
        id: "finops",
        title: "Cloud Cost & FinOps",
        slug: "finops",
        description: "Budgets, tagging, and engineering for unit economics",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: ["cloud-networking"],
        category: "platform",
        icon: "Scale",
      },
      {
        id: "platform-engineering",
        title: "Platform Engineering & IDPs",
        slug: "platform-engineering",
        description: "Golden paths, self-service, and internal portals",
        difficulty: "advanced",
        estimatedTime: 30,
        prerequisites: ["kubernetes"],
        category: "platform",
        icon: "Layers",
      },
      {
        id: "git-workflows",
        title: "Git Workflows & Branching",
        slug: "git-workflows",
        description: "Trunk-based development and release branching",
        difficulty: "intermediate",
        estimatedTime: 20,
        prerequisites: [],
        category: "platform",
        icon: "GitBranch",
      },
      {
        id: "cloud-providers",
        title: "Cloud Providers Compared",
        slug: "cloud-providers",
        description: "AWS, GCP, and Azure core service mapping",
        difficulty: "intermediate",
        estimatedTime: 25,
        prerequisites: [],
        category: "platform",
        icon: "Globe2",
      },
    ],
  },
];

export const ALL_TOPICS = CATEGORIES.flatMap((c) => c.topics);

export const GLOSSARY: Record<string, string> = {
  // ── Protocols & Web ───────────────────────────────────────────────────────
  API: "Application Programming Interface — a defined contract specifying how software components interact",
  REST: "Representational State Transfer — architectural constraints for stateless, resource-oriented HTTP APIs",
  GraphQL:
    "Query language allowing clients to specify exactly the data shape they need in a single request",
  gRPC: "Google Remote Procedure Call — high-performance open-source RPC framework using binary Protobuf serialization",
  Protobuf:
    "Protocol Buffers — binary serialization format used by gRPC, roughly 5-10x smaller than equivalent JSON",
  RPC: "Remote Procedure Call — invoking a function on a remote server as if it were a local function call",
  HTTP: "HyperText Transfer Protocol — the stateless request-response protocol powering all web communication",
  "HTTP/2":
    "HTTP version using binary framing and multiplexing — multiple requests share one TCP connection",
  "HTTP/3":
    "HTTP version running over QUIC (UDP) — eliminates head-of-line blocking, faster on lossy networks",
  HTTPS:
    "HTTP secured with TLS — provides confidentiality, server authentication, and integrity verification",
  TLS: "Transport Layer Security — cryptographic protocol wrapping HTTP to prevent eavesdropping and tampering",
  "TLS Handshake":
    "Negotiation phase establishing cipher suites and exchanging keys before encrypted data flows",
  "Keep-Alive":
    "HTTP mechanism reusing a TCP connection across multiple requests — avoids repeated handshake overhead",
  WebSocket:
    "Persistent full-duplex TCP connection allowing both client and server to send messages at any time",
  SSE: "Server-Sent Events — server streaming data to browser over a persistent HTTP connection, client read-only",
  "Long Polling":
    "Client holds HTTP connection open until server has data — simulates server push without WebSockets",
  DNS: "Domain Name System — distributed database translating human-readable domain names to IP addresses",
  TCP: "Transmission Control Protocol — connection-oriented transport providing reliable, ordered byte delivery",
  UDP: "User Datagram Protocol — connectionless transport with no delivery guarantees, lower overhead than TCP",
  QUIC: "UDP-based transport protocol developed by Google — used by HTTP/3, built-in TLS, no head-of-line blocking",
  IP: "Internet Protocol — routes packets across networks using source and destination IP addresses",
  Anycast:
    "Network routing where the same IP is announced from multiple locations — traffic goes to nearest node",

  // ── Auth & Security ────────────────────────────────────────────────────────
  JWT: "JSON Web Token — compact, self-contained signed token carrying user claims, verified without DB lookup",
  OAuth:
    "Open Authorization — protocol for delegated authorization without sharing credentials",
  PKCE: "Proof Key for Code Exchange — OAuth extension preventing authorization code interception attacks",
  "Access Token":
    "Short-lived credential (typically JWT) proving authorization to access protected resources",
  "Refresh Token":
    "Long-lived credential used to obtain new short-lived access tokens without re-authentication",
  "OAuth Scope":
    "Specific permission granted by a user to a third-party application during OAuth authorization",
  Session:
    "Server-side storage associating a session ID (in cookie) with user data across requests",
  CORS: "Cross-Origin Resource Sharing — browser mechanism controlling which origins can make cross-domain API requests",
  CSP: "Content Security Policy — HTTP header restricting which scripts, styles, and resources can execute on a page",
  CSRF: "Cross-Site Request Forgery — tricking an authenticated user's browser into making unauthorized requests",
  XSS: "Cross-Site Scripting — injecting malicious scripts into pages viewed by other users",
  "SQL Injection":
    "Inserting malicious SQL into user input to manipulate database queries — prevented by parameterized queries",
  SSRF: "Server-Side Request Forgery — tricking the server into making requests to internal or unintended URLs",
  bcrypt:
    "Adaptive password hashing function with configurable cost factor — intentionally slow to resist brute force",
  Argon2:
    "Memory-hard password hashing algorithm — OWASP recommended, resistant to GPU and ASIC attacks",
  Salt: "Random bytes added to a password before hashing — ensures identical passwords produce different hashes",
  Hashing:
    "One-way transformation producing a fixed-length digest — cannot be reversed to recover original input",
  Encryption:
    "Reversible transformation of data using a cryptographic key — can be decrypted with the correct key",
  Certificate:
    "Digitally signed document proving a server's identity — issued and signed by a Certificate Authority",
  mTLS: "Mutual TLS — both client and server authenticate with certificates, not just the server",
  "Idempotency Key":
    "Unique client-provided identifier ensuring an operation is only executed once even with retries",
  HMAC: "Hash-based Message Authentication Code — uses a secret key to verify both data integrity and authenticity",

  // ── Databases ──────────────────────────────────────────────────────────────
  SQL: "Structured Query Language — declarative language for querying and manipulating relational databases",
  ACID: "Atomicity, Consistency, Isolation, Durability — the four guarantees of reliable database transactions",
  Atomicity:
    "Transaction property: all operations succeed or all are rolled back — no partial completion",
  Consistency:
    "Transaction property: database moves from one valid state to another, preserving all constraints",
  Isolation:
    "Transaction property: concurrent transactions do not interfere — each sees a consistent snapshot",
  Durability:
    "Transaction property: committed data survives system crashes — written to persistent storage",
  CAP: "Consistency, Availability, Partition Tolerance — distributed systems must sacrifice one during network partitions",
  "Eventual Consistency":
    "Distributed guarantee that all nodes will converge to the same value given enough time with no new writes",
  "Strong Consistency":
    "Every read returns the most recent write — requires coordination across all nodes",
  Index:
    "Separate data structure maintaining sorted column values with row pointers — speeds reads at cost of write overhead",
  "B-Tree Index":
    "Default database index — balanced tree supporting equality, range queries, and sorting in O(log n)",
  "Composite Index":
    "Index on multiple columns — must be queried starting from the leftmost column (leftmost prefix rule)",
  "Partial Index":
    "Index on a filtered subset of rows (e.g. WHERE deleted_at IS NULL) — smaller and faster",
  "Covering Index":
    "Index containing all columns a query needs — never touches the main table heap",
  "GIN Index":
    "Generalized Inverted Index — optimized for JSONB, arrays, and full-text search in PostgreSQL",
  "BRIN Index":
    "Block Range Index — very compact index for large tables where data correlates with physical order",
  "EXPLAIN ANALYZE":
    "PostgreSQL command showing actual execution plan with real row counts and timings — essential for optimization",
  "Sequential Scan":
    "Full table scan reading every row — O(n), indicates a missing index on large tables",
  "Query Planner":
    "Database component that chooses the most efficient execution plan for a SQL query",
  "N+1 Problem":
    "Fetching N records then issuing N additional queries for related data — use JOIN or DataLoader instead",
  "Connection Pool":
    "Cache of reusable database connections — avoids TCP handshake and auth overhead per query",
  Migration:
    "Versioned, incremental database schema change tracked in code and applied in sequence",
  Normalization:
    "Organizing tables to eliminate redundancy — each piece of data stored in exactly one place",
  Denormalization:
    "Intentionally duplicating data across tables to speed up reads at the cost of write complexity",
  "Foreign Key":
    "Column referencing the primary key of another table — database enforces referential integrity",
  "Primary Key":
    "Unique, non-null identifier for each row — usually auto-incremented integer or UUID",
  Transaction:
    "A unit of work that succeeds or fails atomically — BEGIN, operations, COMMIT or ROLLBACK",
  "Transaction Isolation":
    "Degree to which concurrent transactions are isolated — Read Committed, Repeatable Read, Serializable",
  Deadlock:
    "Two transactions each holding a lock the other needs — both stall until the database kills one",
  "Optimistic Locking":
    "Check for conflicts at commit time using a version field — no locks during the operation",
  "Pessimistic Locking":
    "Acquire row lock before reading — prevents concurrent modification at cost of throughput",
  WAL: "Write-Ahead Log — changes written to a sequential log before data files — enables crash recovery and replication",
  MVCC: "Multi-Version Concurrency Control — keeps multiple row versions so readers never block writers",
  Sharding:
    "Horizontal database partitioning — splitting rows across multiple database instances by a shard key",
  Replication:
    "Copying data to multiple database instances — enables read scaling and high availability",
  "Read Replica":
    "Database copy receiving replicated writes from a primary — serves read queries to distribute load",
  ORM: "Object-Relational Mapper — maps database tables to programming language objects and generates SQL",
  Prisma:
    "Type-safe TypeScript ORM with schema-first design and an auto-generated, fully typed query client",

  // ── Architecture & Patterns ────────────────────────────────────────────────
  Microservice:
    "Small, independently deployable service with a single bounded business responsibility",
  Monolith:
    "Single deployable unit containing all application functionality in one codebase",
  "Modular Monolith":
    "Single deployable unit with well-defined internal module boundaries — good stepping stone to microservices",
  "Service Mesh":
    "Infrastructure layer handling service-to-service communication, TLS, tracing — e.g. Istio, Linkerd",
  "API Gateway":
    "Single entry point for all clients — handles auth, routing, rate limiting, and SSL termination",
  "Service Discovery":
    "Mechanism for services to find each other dynamically without hardcoded addresses",
  "Circuit Breaker":
    "Stops calls to a failing downstream service after a threshold — prevents cascade failures",
  "Saga Pattern":
    "Distributed transaction using a sequence of local transactions with compensating rollbacks",
  "Strangler Fig":
    "Incremental monolith migration — gradually route traffic to new services alongside the old system",
  CQRS: "Command Query Responsibility Segregation — separate read models from write models for independent optimization",
  "Event Sourcing":
    "Store state as an ordered sequence of events rather than current state snapshots",
  "Outbox Pattern":
    "Write events to a DB outbox table atomically with business data — background worker publishes to queue",
  "Two-Phase Commit":
    "Distributed transaction protocol ensuring all nodes commit or all rollback — strong but slow",
  Idempotent:
    "An operation producing the same result regardless of how many times it is applied",
  "Bounded Context":
    "DDD concept: explicit boundary within which a domain model is consistent and well-defined",

  // ── Scaling & Performance ──────────────────────────────────────────────────
  "Horizontal Scaling":
    "Adding more machines to distribute load — stateless services scale horizontally easily",
  "Vertical Scaling":
    "Adding more CPU or RAM to an existing machine — limited by hardware ceiling",
  "Load Balancer":
    "Distributes incoming requests across multiple backend servers for scale and availability",
  "Reverse Proxy":
    "Server receiving client requests and forwarding them to backends — hides backend topology",
  Cache:
    "Fast in-memory storage for frequently accessed data — reduces database load and latency",
  "Cache Hit": "Cache lookup returning a valid value — no origin query needed",
  "Cache Miss":
    "Cache lookup finding no valid entry — must fetch from the database or origin",
  "Cache Stampede":
    "Many concurrent requests hitting an expired cache key simultaneously — all miss and hammer the DB",
  CDN: "Content Delivery Network — globally distributed servers caching and serving content close to users",
  "CDN Edge":
    "CDN server geographically close to users — serves cached content with minimal round-trip latency",
  LRU: "Least Recently Used — evicts the cache item not accessed for the longest time",
  LFU: "Least Frequently Used — evicts the cache item accessed the fewest times",
  TTL: "Time-to-Live — duration after which a cached item, DNS record, or token automatically expires",
  "Rate Limiting":
    "Controlling how many requests a client can make in a time window — protects APIs from abuse",
  "Token Bucket":
    "Rate limiting algorithm: tokens accumulate at a fixed rate up to capacity — allows controlled bursts",
  "Sliding Window":
    "Rate limiting tracking requests in a rolling time window — prevents boundary burst exploitation",
  Backpressure:
    "Signal from a slow consumer to a fast producer to slow down — prevents buffer overflow",
  Queue:
    "Data structure storing messages for async processing — decouples producers from consumers",
  "Dead Letter Queue":
    "Queue holding messages that failed processing after maximum retries — for inspection and replay",
  Fanout:
    "Delivering one published message to multiple independent consumers simultaneously",
  "Pub/Sub":
    "Publish-Subscribe — publishers emit events without knowing consumers; consumers subscribe to topics",
  "P99 Latency":
    "99th percentile latency — 99% of requests complete faster than this value; the slow tail",
  Throughput: "Number of requests or operations completed per unit of time",
  Latency: "Time elapsed between sending a request and receiving a response",
  SLA: "Service Level Agreement — contractual commitment defining minimum availability or performance",
  SLO: "Service Level Objective — internal reliability target (e.g. 99.9% of requests under 200ms)",
  SLI: "Service Level Indicator — actual measured metric used to evaluate whether an SLO is met",

  // ── DevOps & Infrastructure ────────────────────────────────────────────────
  Container:
    "Lightweight isolated process packaging an app with all its dependencies — runs identically anywhere",
  Docker:
    'Platform for building, shipping, and running containers — solves "works on my machine"',
  Kubernetes:
    "Container orchestration platform — automates deployment, scaling, self-healing, and rollouts",
  Pod: "Kubernetes smallest deployable unit — one or more containers sharing a network namespace and storage",
  Deployment:
    "Kubernetes object managing replica pods with rolling update and rollback capabilities",
  Ingress:
    "Kubernetes object routing external HTTP/HTTPS traffic to internal services with path rules",
  Namespace:
    "Kubernetes virtual cluster for resource isolation — typically dev, staging, production",
  Helm: "Kubernetes package manager — bundles manifests into reusable versioned charts",
  "CI/CD":
    "Continuous Integration and Delivery — automated pipeline: build, test, lint, then deploy on every push",
  "Blue-Green Deploy":
    "Run two identical environments; route traffic to green while blue stays as instant rollback",
  "Canary Release":
    "Gradually shift a percentage of traffic to a new version — monitor before full rollout",
  "Feature Flag":
    "Runtime toggle enabling or disabling features without a code deployment",
  Nginx:
    "High-performance async web server and reverse proxy — handles SSL, static files, and load balancing",
  Observability:
    "Ability to understand internal system state from external outputs — logs, metrics, and traces",
  "Distributed Tracing":
    "Tracking a single request as it traverses multiple services to pinpoint latency and errors",

  // ── Node.js ────────────────────────────────────────────────────────────────
  "Event Loop":
    "Node.js's single-threaded mechanism for non-blocking I/O — callbacks queue while I/O runs on OS threads",
  Microtask:
    "Promise callback or queueMicrotask() — always drains completely before any macrotask runs",
  Macrotask:
    "setTimeout, setInterval, or I/O callback — scheduled for a future event loop tick",
  "Worker Thread":
    "Node.js thread for CPU-intensive work — runs in parallel without blocking the event loop",
  Stream:
    "Node.js abstraction for reading or writing data incrementally — constant memory regardless of total size",
  Buffer:
    "Fixed-size chunk of raw binary memory in Node.js — used for I/O, network data, and binary protocols",
  Heap: "Memory region where JavaScript objects live — managed by V8's garbage collector",
  "Garbage Collection":
    "Automatic reclamation of unreachable objects — V8 uses generational GC with minor and major cycles",
  "Memory Leak":
    "Unintentional retention of objects that should be freed — heap grows indefinitely until OOM crash",
  libuv:
    "C library powering Node.js async I/O — provides the event loop and a thread pool for blocking operations",

  // ── Distributed Systems ───────────────────────────────────────────────────
  Quorum:
    "Minimum number of nodes that must agree for a read or write to succeed — a strict majority in most systems",
  Consensus:
    "Agreement among distributed nodes on a single value or ordering despite failures — the basis of replicated state",
  Raft: "Understandable consensus algorithm using leader election and log replication — a clearer alternative to Paxos",
  Paxos:
    "Classic consensus protocol for agreeing on values across unreliable nodes — notoriously hard to implement correctly",
  "Leader Election":
    "Process of choosing one node to coordinate work among a cluster while the others become followers",
  "Split Brain":
    "Two partitions each believing they are primary and accepting writes — corrupts data without fencing",
  "Fencing Token":
    "Monotonically increasing token attached to lock grants — storage rejects writes from stale leaders",
  "Lamport Clock":
    "Logical clock assigning monotonically increasing counters to events — captures happens-before without wall clocks",
  "Vector Clock":
    "Logical clock holding one counter per node — distinguishes concurrent events from causally ordered ones",
  "Hybrid Logical Clock":
    "Combines physical wall time with logical counters — keeps timestamps near real time and causally consistent",
  CRDT: "Conflict-free Replicated Data Type — data structure merging concurrent updates deterministically without coordination",
  "Operational Transformation":
    "Algorithm transforming concurrent edits so replicated documents converge — used in collaborative editors",
  Linearizability:
    "Strongest consistency model: every operation appears to take effect atomically at a single instant",
  Causality:
    "Ordering in which events influenced by earlier events must appear after them — a partial, not total order",
  "Happens-Before":
    "Relation defining that one event is ordered before another — the basis of logical time in distributed systems",
  "State Machine Replication":
    "Replicating a deterministic state machine by applying the same ordered command log on every node",
  "Gossip Protocol":
    "Epidemic-style dissemination where nodes periodically share state with random peers — scalable and fault tolerant",
  Heartbeat:
    "Periodic signal proving a node or process is alive — its absence triggers failure detection",
  Lease:
    "Time-bounded grant of authority — the holder acts as leader until expiry, reducing reliance on clock accuracy",
  Redlock:
    "Redis-based distributed lock algorithm acquiring locks on a majority of independent instances",
  "Idempotent Consumer":
    "Message consumer that deduplicates deliveries so repeated processing leaves state unchanged",
  "Exactly-Once Semantics":
    "Guarantee that each message affects state exactly once — usually via idempotence plus transactional offsets",
  "At-Least-Once":
    "Delivery guarantee where messages are never lost but may be duplicated — consumers must be idempotent",
  "At-Most-Once":
    "Delivery guarantee where messages are never duplicated but may be lost — no retries on failure",
  "Consistent Hashing":
    "Hashing scheme placing keys on a ring so adding or removing nodes moves only a small fraction of keys",
  "Consistent Hashing Ring":
    "Circular keyspace used by consistent hashing — each node owns the arc of keys preceding it",
  "Virtual Node":
    "Multiple ring positions per physical node in consistent hashing — smooths load and speeds rebalancing",
  "Hinted Handoff":
    "Temporarily storing writes for a down node on a peer — forwarded once the node recovers",
  "Read Repair":
    "Fixing stale replicas during a read by writing the newest version back to nodes that disagree",
  "Anti-Entropy":
    "Background process comparing replicas and reconciling differences — repairs drift missed by read repair",
  "Tunable Consistency":
    "Choosing per-operation read and write quorums to trade latency against consistency strength",
  "Sloppy Quorum":
    "Accepting writes on non-primary nodes when primaries are unavailable — improves availability, weakens consistency",
  "Two Generals Problem":
    "Impossibility result proving two parties cannot reliably agree over an unreliable channel — motivates idempotence",
  "Byzantine Fault":
    "Failure where a node behaves arbitrarily or maliciously — requires BFT consensus to tolerate",
  "CAP vs PACELC":
    "CAP covers consistency under partitions; PACELC also covers latency versus consistency when there is no partition",
  PACELC:
    "Extension of CAP: if Partition, trade Availability versus Consistency; Else trade Latency versus Consistency",

  // ── Streaming & Messaging ─────────────────────────────────────────────────
  Kafka:
    "Distributed, partitioned, replicated commit log — the backbone of high-throughput event streaming",
  Partition:
    "Ordered, append-only slice of a topic — the unit of parallelism and ordering in Kafka",
  "Consumer Group":
    "Set of consumers sharing a subscription — each partition is assigned to exactly one member",
  Offset:
    "Monotonically increasing position of a record within a partition — consumers commit it to track progress",
  Rebalancing:
    "Reassigning partitions among consumers when group membership changes — briefly pauses consumption",
  "Log Compaction":
    "Retaining only the latest record per key in a topic — enables stateful restore from the log",
  ISR: "In-Sync Replicas — partition replicas fully caught up with the leader; acks depend on this set",
  "Producer Acks":
    "Kafka producer setting controlling durability — acks=0, 1, or all trade latency for safety",
  "Schema Registry":
    "Central service storing and versioning message schemas — enforces compatibility between producers and consumers",
  Avro: "Compact binary serialization format with schema evolution — common for Kafka and Hadoop data",
  "Change Data Capture":
    "Streaming row-level database changes as events — keeps downstream systems in near-real-time sync",
  Debezium:
    "Open-source CDC platform reading database logs and publishing change events to Kafka",
  Watermark:
    "Streaming marker indicating no events earlier than a given time are expected — advances event-time windows",
  "Windowed Aggregation":
    "Grouping stream records into finite time or count windows to compute running aggregates",
  "Exactly-Once Processing":
    "Streaming guarantee that each record updates state once — implemented with transactions and idempotent sinks",
  "Event Time vs Processing Time":
    "Event time is when an event occurred; processing time is when the system handled it — windows differ",
  RabbitMQ:
    "Mature message broker implementing AMQP with flexible routing via exchanges and queues",
  AMQP: "Advanced Message Queuing Protocol — open standard for interoperable message-oriented middleware",
  NATS: "Lightweight, high-performance messaging system with pub/sub, request-reply, and JetStream persistence",
  "Backpressure vs Buffering":
    "Backpressure slows the producer; buffering absorbs bursts — buffering without limits risks memory exhaustion",
  "Dead Letter Topic":
    "Kafka topic receiving records that failed repeated processing — enables inspection and replay",
  Compaction:
    "Background merging of files or log segments to remove obsolete records and reclaim space",
  "Batch Processing":
    "Handling bounded datasets in scheduled bulk jobs — high throughput at higher latency than streaming",
  "Stream Processing":
    "Continuously processing unbounded data as it arrives — low latency with stateful operators",
  ETL: "Extract, Transform, Load — moving data from sources, reshaping it, then loading it into a warehouse",
  ELT: "Extract, Load, Transform — load raw data first and transform it inside the powerful target warehouse",
  Lakehouse:
    "Architecture combining data lake storage with warehouse-style transactions and schema management",
  "Data Lake":
    "Central repository storing raw data in native format for later processing and analysis",
  "Data Warehouse":
    "Structured repository optimized for analytical queries over integrated, modeled historical data",
  OLAP: "Online Analytical Processing — columnar workloads for fast multidimensional aggregation over large datasets",
  OLTP: "Online Transaction Processing — many small, fast, highly concurrent read and write transactions",
  "Star Schema":
    "Dimensional model with a central fact table joined to denormalized dimension tables",
  "Snowflake Schema":
    "Dimensional model where dimensions are normalized into related tables — less redundancy, more joins",
  "Slowly Changing Dimension":
    "Warehouse pattern tracking how dimension attributes change over time — via Type 1, 2, or 3 strategies",
  Parquet:
    "Columnar, compressed file format with predicate pushdown — the standard for analytic data at rest",
  "Columnar Storage":
    "Storing values by column rather than by row — excellent compression and scan performance for analytics",
  "Materialized View":
    "Precomputed query result stored on disk — fast reads, refreshed on a schedule or on change",
  "Lambda Architecture":
    "Serving data via parallel batch and speed layers merged at query time — accurate but operationally heavy",
  "Kappa Architecture":
    "Simplification of Lambda where a single streaming layer reprocesses the log to produce every view",

  // ── Security & Compliance ─────────────────────────────────────────────────
  "OpenID Connect":
    "Identity layer on top of OAuth 2.0 — issues ID tokens so clients can verify user identity",
  SAML: "Security Assertion Markup Language — XML standard for federated single sign-on between IdP and service provider",
  "Identity Provider":
    "System that authenticates users and issues assertions or tokens to other applications",
  "Service Account":
    "Non-human identity used by workloads to authenticate to APIs and cloud resources",
  RBAC: "Role-Based Access Control — permissions are granted to roles and users are assigned to roles",
  ABAC: "Attribute-Based Access Control — policies evaluated against user, resource, and environment attributes",
  ReBAC:
    "Relationship-Based Access Control — authorization derived from relationships between users and resources",
  "Principle of Least Privilege":
    "Granting only the minimum permissions needed for a task — limits the blast radius of a compromise",
  "Zero Trust":
    "Security model assuming no implicit trust — every request is authenticated and authorized continuously",
  "Defense in Depth":
    "Layering multiple independent controls so that no single failure compromises the system",
  STRIDE:
    "Threat modeling framework: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation",
  "Threat Model":
    "Structured analysis of assets, adversaries, and attack paths to prioritize security work",
  "Attack Surface":
    "Sum of all points where an attacker could interact with a system — smaller is safer",
  CVSS: "Common Vulnerability Scoring System — standardized 0-10 severity score for security vulnerabilities",
  CVE: "Common Vulnerabilities and Exposures — unique identifier for a publicly known security flaw",
  SBOM: "Software Bill of Materials — machine-readable inventory of components and dependencies in a build",
  SLSA: "Supply-chain Levels for Software Artifacts — framework of hardening levels for build provenance",
  Sigstore:
    "Open-source tooling for signing, verifying, and transparently logging software artifacts",
  "Supply Chain Attack":
    "Compromising a dependency or build pipeline to inject malicious code into downstream software",
  "Dependency Confusion":
    "Publishing a public package matching an internal private name to hijack installs",
  Typosquatting:
    "Registering packages with names close to popular ones to trick developers into installing them",
  "Secrets Manager":
    "Service storing and rotating credentials and API keys — apps fetch them at runtime instead of committing them",
  Vault:
    "HashiCorp tool for secrets management, dynamic credentials, and encryption as a service",
  "Envelope Encryption":
    "Encrypting data with a data key, then encrypting that key with a master key held in a KMS",
  "Key Rotation":
    "Periodically replacing cryptographic keys to limit exposure — rewrap data keys without re-encrypting data",
  HSM: "Hardware Security Module — tamper-resistant device that stores keys and performs crypto operations",
  KMS: "Key Management Service — managed service for creating, storing, and auditing cryptographic keys",
  "Data Residency":
    "Requirement that data be stored and processed within a specific jurisdiction",
  PII: "Personally Identifiable Information — data that can identify a specific individual, subject to regulation",
  GDPR: "General Data Protection Regulation — EU law governing personal data handling and individual rights",
  "PCI-DSS":
    "Payment Card Industry Data Security Standard — rules for handling cardholder data",
  "SOC 2":
    "Audit report attesting that a service meets trust criteria for security, availability, and confidentiality",
  "Right to Erasure":
    "GDPR right letting individuals request deletion of their personal data — challenges immutable logs",
  Tokenization:
    "Replacing sensitive data with a surrogate token — the original value is kept in a secure vault",
  "Data Masking":
    "Replacing sensitive values with realistic substitutes so non-production data stays safe",
  WAF: "Web Application Firewall — inspects HTTP traffic and blocks common attacks like SQL injection and XSS",
  DDoS: "Distributed Denial of Service — flooding a service from many sources to exhaust its capacity",
  "Bot Mitigation":
    "Detecting and blocking automated traffic while allowing legitimate users through",
  "Rate Limiting vs Throttling":
    "Rate limiting rejects excess requests; throttling queues or slows them — both protect capacity",
  "Certificate Pinning":
    "Binding a client to an expected server certificate or key — resists MITM with rogue CAs",
  HSTS: "HTTP Strict Transport Security — header forcing browsers to use HTTPS for future requests",
  SameSite:
    "Cookie attribute controlling whether cookies are sent on cross-site requests — mitigates CSRF",
  "Subresource Integrity":
    "Browser check that a fetched script or stylesheet matches a known hash — blocks tampered assets",
  Nonce:
    "Number used once — a random value ensuring a token or request cannot be replayed",
  "Replay Attack":
    "Re-sending a captured valid request to trigger an unintended action — countered by nonces and timestamps",
  "Timing Attack":
    "Inferring secrets from differences in execution time — mitigated by constant-time comparison",

  // ── Platform & Runtime ────────────────────────────────────────────────────
  Serverless:
    "Execution model where the provider manages servers — you deploy functions and pay per invocation",
  FaaS: "Function as a Service — running individual functions on demand without managing infrastructure",
  "Cold Start":
    "Latency spike when a function instance starts from scratch — mitigated by provisioned concurrency",
  "AWS Lambda":
    "Amazon's function-as-a-service platform — runs code in response to events with automatic scaling",
  "Edge Computing":
    "Running compute close to users at the network edge to cut latency and backhaul traffic",
  "Chaos Engineering":
    "Deliberately injecting failures in production to validate resilience and reveal weaknesses",
  GitOps:
    "Managing infrastructure and deployments through Git — the repo is the source of truth and agents reconcile state",
  "Infrastructure as Code":
    "Defining and provisioning infrastructure with versioned, declarative configuration files",
  Terraform:
    "Declarative IaC tool provisioning multi-cloud resources from HCL configuration and state",
  Pulumi:
    "IaC tool letting you define cloud resources in general-purpose languages like TypeScript or Go",
  "Golden Path":
    "Recommended, well-supported way to build and ship a service — a paved road with guardrails",
  "Internal Developer Platform":
    "Self-service layer abstracting infrastructure so developers deploy without deep operations knowledge",
  Backstage:
    "Open-source developer portal for service catalogs, templates, and documentation",
  "Trunk-Based Development":
    "Short-lived branches merged frequently into main — enables continuous integration",
  Monorepo:
    "Single repository holding many projects or services — simplifies sharing and refactors",
  Polyrepo:
    "Separate repository per project or service — independent versioning and ownership",
  "Semantic Versioning":
    "MAJOR.MINOR.PATCH scheme where version changes signal breaking, additive, or patch changes",
  "Peer Dependency":
    "Package expecting the host project to provide a shared dependency version — common for plugins",
  Lockfile:
    "Records the exact resolved dependency versions — guarantees reproducible installs",
  FinOps:
    "Discipline of managing cloud spend — aligning cost with value through visibility and accountability",
  Egress:
    "Data leaving a cloud or network — often billed, so it drives architectural decisions",
  "Reserved Instance":
    "Prepaid or committed cloud capacity at a discount in exchange for a usage term",
  "Spot Instance":
    "Spare cloud capacity at a deep discount that can be reclaimed with little notice — for fault-tolerant work",
  "Right-Sizing":
    "Matching resource allocation to actual workload demand to cut waste without hurting performance",
  "Progressive Delivery":
    "Releasing gradually with canaries, flags, and automated analysis before full rollout",
  "Canary Analysis":
    "Automatically comparing a canary's metrics against the baseline to decide promotion or rollback",
  "Error Budget":
    "Allowable amount of unreliability before freezing risky changes — 100% minus the SLO",
  Toil: "Manual, repetitive, automatable operational work that scales with the service — reduce it",
  Runbook:
    "Documented procedure for handling a specific operational task or alert",
  Postmortem:
    "Structured review after an incident documenting timeline, impact, and follow-up actions",
  "Blameless Postmortem":
    "Postmortem focused on systemic causes rather than blaming individuals — improves psychological safety",
  "On-Call Rotation":
    "Schedule rotating which engineer responds to alerts — spreads the burden fairly",
  "Escalation Policy":
    "Rules for notifying the next responder when an alert is unacknowledged — ensures nothing is dropped",
  MTTD: "Mean Time To Detect — average time from fault onset to its detection",
  MTTR: "Mean Time To Recovery — average time to restore service after a failure",
  MTBF: "Mean Time Between Failures — average uptime between incidents, a reliability measure",
  "Fault Injection":
    "Intentionally introducing errors, latency, or failures to test system resilience",
  "Synthetic Monitoring":
    "Proactively running scripted checks from outside the system to detect issues before users do",
  "Real User Monitoring":
    "Collecting performance data from actual user sessions in the browser or app",
  Cardinality:
    "Number of distinct values a metric label can take — high cardinality explodes time-series storage",
  Downsampling:
    "Reducing data resolution by aggregating older points — keeps long-term metrics affordable",
  Rollup:
    "Pre-aggregating metrics over coarser intervals to speed queries and cut storage",
  "Continuous Profiling":
    "Sampling production CPU or memory profiles continuously to find hotspots over time",
  "Flame Graph":
    "Visualization of stacked call stacks by time — shows where CPU is spent at a glance",
  "RED Method":
    "Service monitoring via Rate, Errors, and Duration — the key metrics for every request-driven service",
  "USE Method":
    "Resource monitoring via Utilization, Saturation, and Errors — for CPU, memory, disk, and network",
  "Golden Signals":
    "Latency, traffic, errors, and saturation — the four signals every service should monitor",
  "Structured Logging":
    "Emitting logs as machine-parseable key-value records instead of free-form text",
  "Log Aggregation":
    "Centralizing logs from many services into one searchable store like ELK or Loki",
  "Alert Fatigue":
    "Desensitization from too many low-value alerts — causes real incidents to be missed",
  "High Cardinality":
    "Metrics with a huge number of unique label combinations — costly to store and query",

  // ── Data Engineering ──────────────────────────────────────────────────────
  "Data Pipeline":
    "Series of steps moving and transforming data from sources to sinks on a schedule or stream",
  Orchestration:
    "Scheduling and coordinating dependent jobs with retries, dependencies, and observability",
  Airflow:
    "Workflow orchestration platform defining pipelines as DAGs of Python tasks",
  DAG: "Directed Acyclic Graph — a dependency graph with no cycles, used to model job execution order",
  Backfill:
    "Reprocessing historical data through a pipeline after logic or data changes",
  "Data Contract":
    "Agreed schema and semantics between producers and consumers — enforced to prevent silent breakage",
  "Data Quality":
    "Degree to which data is accurate, complete, consistent, and timely — validated by tests and checks",
  "Idempotent Pipeline":
    "Pipeline that produces the same result when re-run, enabling safe retries and backfills",
  "Partition Pruning":
    "Skipping irrelevant partitions during a query — dramatically reduces scanned data",
  "Data Skew":
    "Uneven distribution of data across partitions — a few shards dominate runtime",
  Shuffle:
    "Redistributing data across nodes for joins or aggregations — often the most expensive stage",
  "Broadcast Join":
    "Sending a small table to every worker to join locally — avoids a full shuffle",
  Bucketing:
    "Pre-partitioning data into a fixed number of files by hash — speeds joins and sampling",
  "Z-Ordering":
    "Interleaving sort keys in storage so range filters on multiple columns can skip files",
  "Time-Series Database":
    "Database optimized for timestamped metrics — high write throughput with time-based queries",
  InfluxDB:
    "Popular open-source time-series database with a SQL-like query language and retention policies",
  Prometheus:
    "Pull-based monitoring system with a time-series database, PromQL, and alerting",
  "Retention Policy":
    "Rules defining how long data is kept before it is expired or moved to colder tiers",
  "Hot/Warm/Cold Storage":
    "Tiering data by access frequency — hot for fast expensive storage, cold for cheap archival",
  "Object Storage":
    "Flat, scalable storage for immutable blobs keyed by name — the foundation of data lakes",
  S3: "Amazon Simple Storage Service — highly durable object storage with virtually unlimited scale",
  "Bloom Filter":
    "Probabilistic set structure answering may-contain queries — no false negatives, few false positives",
  HyperLogLog:
    "Probabilistic algorithm estimating distinct counts with tiny memory and about 1% error",
  "Count-Min Sketch":
    "Probabilistic structure estimating item frequencies in a stream with sublinear memory",
  "Bitmap Index":
    "Index storing one bit per row per value — fast set operations for low-cardinality columns",
  Geohash:
    "Encoding latitude and longitude into a short string where shared prefixes mean nearby locations",
  Quadtree:
    "Tree recursively subdividing space into quadrants — used for spatial indexing and range queries",
  H3: "Uber's hierarchical hexagonal geospatial indexing system — uniform cells for spatial analysis",
  "Vector Database":
    "Database indexing high-dimensional embeddings for fast similarity search",
  Embedding:
    "Dense numeric vector representing the semantic meaning of text, image, or other data",
  "Approximate Nearest Neighbor":
    "Search finding near neighbours quickly by trading exact recall for large speed gains",
  HNSW: "Hierarchical Navigable Small World — graph index giving fast approximate nearest-neighbour search",
  IVF: "Inverted File index — clusters vectors so search scans only the nearest few buckets",
  RAG: "Retrieval-Augmented Generation — retrieving relevant documents and feeding them to an LLM as context",
  "Graph Database":
    "Database storing nodes and edges natively — optimized for traversal and relationship queries",
  Cypher: "Declarative query language for property graphs — used by Neo4j",
  "Property Graph":
    "Graph model where nodes and edges carry key-value properties — the basis of Neo4j",
  "Wide-Column Store":
    "NoSQL store with rows keyed by a partition key and sparse sorted columns — for example Cassandra",
  Cassandra:
    "Distributed wide-column database with tunable consistency, no single point of failure, and linear scale",
  Snowflake:
    "Cloud data warehouse separating storage and compute with per-second billing and elastic scaling",
  BigQuery:
    "Google's serverless, columnar cloud data warehouse for large-scale analytics",
  "Reverse ETL":
    "Pushing modeled warehouse data back into operational tools like CRMs and ad platforms",

  // ── Auth & Identity ────────────────────────────────────────────────────────
  "OAuth 2.1":
    "Consolidated OAuth revision — folds PKCE into the core flow and drops insecure grants like implicit and password",
  "OIDC Discovery":
    "OpenID Connect Discovery — a well-known endpoint publishing a provider's authorization, token, and JWKS URLs",
  JWKS: "JSON Web Key Set — endpoint publishing the public keys a client uses to verify JSON Web Token signatures",
  "Token Introspection":
    "OAuth endpoint letting a resource server check whether an opaque token is active and what it authorizes",
  "Refresh Token Rotation":
    "Issuing a new refresh token on every use and invalidating the old one — detects token theft via reuse",
  TOTP: "Time-based One-Time Password — short numeric codes derived from a shared secret and the current time",
  WebAuthn:
    "Web Authentication — W3C standard for passwordless login using passkeys and hardware authenticators",
  "SPIFFE/SPIRE":
    "Secure Production Identity Framework For Everyone and its runtime — issue verifiable workload identities for zero-trust mTLS",
  "RBAC vs ABAC":
    "Role-based access control grants by role, while attribute-based access control evaluates user, resource, and context attributes",
  SCIM: "System for Cross-domain Identity Management — REST standard automating user and group provisioning across systems",
  "SAML Assertion":
    "XML document from an identity provider asserting a user's identity and attributes to a service provider",
  "Entra ID / Azure AD":
    "Microsoft's cloud identity provider — issues OAuth and OpenID Connect tokens and manages users, groups, and enterprise SSO",

  // ── API & Contracts ────────────────────────────────────────────────────────
  ETag: "Entity Tag — response header carrying a version fingerprint used for caching and conditional requests",
  "If-None-Match":
    "Conditional request header — the server returns 304 Not Modified when the client's ETag still matches",
  Idempotency:
    "Property where repeating a request produces the same effect as doing it once — essential for safe retries",
  "Cursor Pagination":
    "Paging using an opaque pointer to the last item — stable and efficient for large or changing datasets",
  "Offset Pagination":
    "Paging by skipping a fixed number of rows with LIMIT and OFFSET — simple but slow and unstable on large tables",
  HATEOAS:
    "Hypermedia as the Engine of Application State — REST responses embed links telling clients what they can do next",
  OpenAPI:
    "Machine-readable specification describing a REST API's endpoints, schemas, and auth for docs and code generation",
  "JSON Schema":
    "Declarative vocabulary for validating the structure of JSON documents — used by OpenAPI and validators",
  Webhook:
    "User-defined HTTP callback a service invokes to push events to a consumer's endpoint in near real time",
  "Payload Signature":
    "HMAC or asymmetric signature over a webhook body proving the request came from the expected sender",
  "gRPC Streaming":
    "gRPC mode supporting client, server, or bidirectional streams of messages over a single HTTP/2 call",
  "Server Reflection":
    "gRPC feature letting clients discover a server's services and message types at runtime without the .proto files",
  "Backwards Compatibility":
    "New versions can still read data or serve clients written for older versions — required for safe rollout",
  "Semantic Contract":
    "Agreed meaning and behavior of an interface beyond its schema — what each field and error actually signifies",

  // ── Concurrency & Isolation ────────────────────────────────────────────────
  "Optimistic Concurrency":
    "Allowing concurrent updates without locks, then rejecting a write if a version or ETag changed since it was read",
  "Row-Level Security":
    "Database policies restricting which rows a user may read or write based on their identity or session",
  "Two-Phase Locking":
    "Protocol acquiring all locks a transaction needs then releasing them at commit — guarantees serializability",
  "Snapshot Isolation":
    "Each transaction reads a consistent snapshot of committed data — avoids most read anomalies but allows write skew",
  "Phantom Read":
    "Anomaly where a transaction re-runs a range query and sees newly inserted rows it did not see before",
  "Non-Repeatable Read":
    "Anomaly where re-reading the same row within a transaction returns a different value after another commit",
  "Monotonic Reads":
    "Guarantee that a client never reads data going backwards in time — later reads see at least what earlier reads did",
  Serializability:
    "Strongest isolation level: transactions behave as if executed one after another in some serial order",
  CTE: "Common Table Expression — a named temporary result set defined with WITH to simplify complex queries",
  "Window Function":
    "SQL function computing an aggregate over a set of rows related to the current row without collapsing them",

  // ── Database Internals ─────────────────────────────────────────────────────
  VACUUM:
    "PostgreSQL maintenance reclaiming space from dead tuples and refreshing visibility information",
  Autovacuum:
    "Background PostgreSQL process running VACUUM and ANALYZE automatically to prevent bloat and stale statistics",
  "Index Selectivity":
    "Fraction of rows a predicate matches — high selectivity suits an index, low selectivity favors a sequential scan",
  "Bitmap Scan":
    "PostgreSQL plan building a bitmap of matching row locations from one or more indexes before visiting the table",
  "Hash Join":
    "Join algorithm building an in-memory hash table on one input and probing it with the other",
  "Merge Join":
    "Join algorithm merging two inputs already sorted on the join key — efficient for large pre-sorted sets",
  "Nested Loop Join":
    "Join algorithm scanning the inner table once per outer row — cheap for small inputs backed by an index",
  "Full-Text Search":
    "Searching documents by natural-language words using tokenization, stemming, and relevance ranking",

  // ── Resilience & Failure Handling ──────────────────────────────────────────
  "Phi Accrual Failure Detector":
    "Failure detector outputting a continuous suspicion score from heartbeat arrival times — used by Cassandra and Akka",
  "Failure Detector":
    "Component that decides whether a node is alive or failed, balancing detection speed against false positives",
  "Speculative Execution":
    "Running duplicate copies of slow tasks and keeping the first to finish — cuts tail latency in batch jobs",
  "Hedged Request":
    "Sending a duplicate request to a second replica after a short delay — mitigates tail latency without full retries",
  "Tail Latency":
    "Latency experienced by the slowest requests (p95 and above) — often what users feel worst",
  Jitter:
    "Randomized delay added to retries or heartbeats to spread load and avoid synchronized spikes",
  "Thundering Herd":
    "Many clients or processes waking at once after a shared event — overloads the resource they rush to",
  Bulkhead:
    "Isolating resources per dependency or tenant so one failure cannot exhaust capacity for everything else",
  "Load Shedding":
    "Deliberately dropping or rejecting excess requests to keep the system responsive under overload",
  "Graceful Degradation":
    "Continuing to serve reduced functionality when a dependency fails instead of failing entirely",
  "Retry Storm":
    "Overwhelming a struggling service with synchronized retries — worsened without backoff and jitter",
  "Leaky Bucket":
    "Rate limiting algorithm draining a bucket at a fixed rate — smooths bursty traffic into a steady flow",
  "Sliding Window Log":
    "Rate limiting that timestamps each request and counts those in the trailing window — precise but memory-heavy",
  "Fixed Window":
    "Rate limiting counting requests within discrete aligned windows — simple but allows bursty boundary spikes",

  // ── Observability & Reliability ────────────────────────────────────────────
  OpenTelemetry:
    "Vendor-neutral standard and SDK for generating, collecting, and exporting traces, metrics, and logs",
  "Tracing Span":
    "A single timed operation within a trace — has a start, an end, attributes, and a parent span",
  "Trace Context":
    "W3C-standard headers such as traceparent propagating trace identity across service boundaries",
  Exemplar:
    "A sample trace ID attached to a metric data point — links an aggregate spike back to a concrete request",
  "Histogram Bucket":
    "Predefined value ranges a histogram counts observations into — enables percentiles from aggregated metrics",
  "Burn Rate":
    "How fast an SLO's error budget is being consumed relative to its target — drives alert severity",
  "Synthetic Check":
    "Scripted probe run on a schedule to verify an endpoint works from outside the system",
  "Health Check":
    "Endpoint reporting whether a service can serve traffic — used by load balancers and orchestrators",
  "Readiness Probe":
    "Kubernetes check deciding whether a pod should receive traffic — failing removes it from the endpoints",
  "Liveness Probe":
    "Kubernetes check restarting a container when it is stuck or deadlocked",
  "Startup Probe":
    "Kubernetes check giving a slow-starting container time before liveness and readiness checks begin",

  // ── Analytics & Data Modeling ──────────────────────────────────────────────
  "Data Mesh":
    "Decentralized data architecture treating domains as data product owners with a self-serve platform and federated governance",
  dbt: "Data Build Tool — SQL-based transformation framework that versions, tests, and documents warehouse models",
  "Medallion Architecture":
    "Layered lakehouse pattern refining data through bronze, silver, and gold stages of increasing quality",
  "Bronze/Silver/Gold":
    "Medallion layers where bronze is raw ingested data, silver is cleaned and conformed, gold is business-ready",
  "Upsert/Merge":
    "Inserting a row if it is absent or updating it if present — the idempotent write pattern for sink tables",
  "Late Data":
    "Events arriving after their window has closed — handled via allowed lateness or reprocessing",
  "Schema Evolution":
    "Changing a data format over time while keeping existing producers and consumers working",
  "Backward/Forward Compatibility":
    "Backward compatibility lets new readers read old data; forward compatibility lets old readers read new data",
  "Idempotent Sink":
    "Output connector that deduplicates writes so reprocessing a stream does not double-count results",
  "SCD Type 2":
    "Slowly Changing Dimension Type 2 — preserving history by writing a new row with validity dates on each change",
  "Surrogate Key":
    "System-generated identifier for a dimension row — decouples it from changing natural business keys",
  "Natural Key":
    "Business-meaningful identifier such as email or SKU used to identify a record — can change and is harder to join",
};

