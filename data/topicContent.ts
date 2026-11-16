// Topic content registry — ALL topics fully written, zero placeholders

export type { TopicContent, Section, QuizData } from "./contentTypes";
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT: Record<string, TopicContent> = {
  // ─── FOUNDATIONS ─────────────────────────────────────────────────────────

  "what-is-backend": {
    slug: "what-is-backend",
    title: "What is Backend?",
    tagline: "Understanding what happens behind every app you use",
    hasVisualizer: "http",
    sections: [
      {
        type: "text",
        heading: "The Simple Explanation",
        content:
          "Every application you use — whether it is Instagram, Uber, or your banking app — has two fundamental parts. The **frontend** is the visual layer you interact with: buttons, forms, screens. The **backend** is everything happening on a remote server: storing data, authenticating users, processing payments, executing business logic, and sending responses back.\n\nThe backend is invisible to end users but is where most of the engineering complexity lives. No backend means no persistence, no multi-user access, and no business logic beyond what can run in a browser.",
      },
      {
        type: "analogy",
        heading: "Restaurant Analogy",
        content:
          "Think of a restaurant. You sit at the table, read the menu, and place an order. That experience is the frontend.\n\nBehind the kitchen door: orders are received and queued, ingredients are retrieved from storage (the database), meals are prepared according to recipes (business logic), quality is checked (validation), and food is plated and delivered (HTTP response).\n\nThe kitchen is completely invisible to you. You see only the result. But if the kitchen breaks — nothing works. That kitchen is the backend.",
      },
      {
        type: "text",
        heading: "What Backend Engineers Build",
        content:
          "**APIs** — The communication contracts that frontends and mobile apps call to get and send data.\n\n**Databases** — Where all application data is stored, structured, queried, and maintained.\n\n**Authentication systems** — Verifying who users are and what they are allowed to do.\n\n**Business logic** — The rules governing how the application behaves: pricing, validation, workflows.\n\n**Background jobs** — Scheduled tasks and async operations running independently of user requests.\n\n**Infrastructure** — Servers, queues, caches, and pipelines ensuring reliability and performance.",
      },
      {
        type: "code",
        heading: "A Minimal Backend Server",
        language: "typescript",
        label: "server.ts",
        code: `import express from 'express';

const app = express();
app.use(express.json());

// In-memory store (real apps use PostgreSQL, MongoDB, etc.)
const users: { id: number; name: string; email: string }[] = [
  { id: 1, name: 'Alice Smith', email: 'alice@example.com' },
];

// GET all users
app.get('/api/users', (req, res) => {
  res.json({ data: users });
});

// GET one user
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ data: user });
});

// POST create user
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  const newUser = { id: users.length + 1, name, email };
  users.push(newUser);
  res.status(201).json({ data: newUser });
});

app.listen(3000, () => console.log('Server running on :3000'));`,
      },
      {
        type: "comparison",
        heading: "Frontend vs Backend",
        headers: ["Frontend", "Backend"],
        rows: [
          {
            aspect: "Runs on",
            Frontend: "User device (browser, phone)",
            Backend: "Remote server",
          },
          {
            aspect: "Languages",
            Frontend: "HTML, CSS, JavaScript",
            Backend: "Node.js, Go, Python, Java, Rust",
          },
          {
            aspect: "Visible to user",
            Frontend: "Yes — everything rendered on screen",
            Backend: "No — accessed only via API calls",
          },
          {
            aspect: "Data storage",
            Frontend: "Temporary (cookies, localStorage)",
            Backend: "Permanent (databases)",
          },
          {
            aspect: "Security surface",
            Frontend: "XSS, input sanitization",
            Backend: "Auth, injection, access control, secrets",
          },
          {
            aspect: "Scale concerns",
            Frontend: "Bundle size, render performance",
            Backend: "Throughput, latency, availability, DB load",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "How Big Companies Structure Backends",
        content:
          "Netflix runs 700+ independent backend services. Uber separates driver, rider, pricing, and routing logic into distinct services. Stripe processes millions of API requests per day across geographically redundant clusters with 99.999% uptime SLAs. Every one of these started as a single backend server — a monolith. Scale drove decomposition, not the other way around.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Backend is the server-side code users never see but always depend on",
          "Backend engineers build APIs, databases, authentication, business logic, and infrastructure",
          "Every user-facing application has a frontend (visible) and backend (invisible) component",
          "Security, reliability, and performance are primary backend concerns",
          "Modern backends are written in Node.js, Python, Go, Java, Rust, and more",
          "Large organizations run dozens to hundreds of backend services in coordination",
        ],
      },
    ],
    quiz: [
      {
        question: "What is the primary role of a backend in a web application?",
        options: [
          "Rendering HTML and CSS for the user to see",
          "Handling data storage, business logic, authentication, and API responses",
          "Managing mouse events and form inputs in the browser",
          "Compiling JavaScript into machine code",
        ],
        correctIndex: 1,
        explanation:
          "The backend handles everything server-side and invisible to users: storing data in databases, enforcing business rules, authenticating users, and responding to API requests. The frontend handles rendering and user interaction.",
      },
      {
        question: "Which of these is NOT typically backend work?",
        options: [
          "Writing SQL queries to fetch user data from PostgreSQL",
          "Building JWT-based authentication middleware",
          "Designing a CSS animation for a button hover state",
          "Configuring a message queue for background job processing",
        ],
        correctIndex: 2,
        explanation:
          "CSS animations are frontend work. Backend engineering covers data storage, authentication, APIs, queues, caching, infrastructure — none of which involve visual styling or browser rendering.",
      },
      {
        question:
          "Why do large companies like Netflix use hundreds of backend services instead of one?",
        options: [
          "One server cannot store that much source code",
          "Independent scaling, deployment, and fault isolation of different features",
          "Multiple servers are always cheaper than one powerful server",
          "Government compliance regulations require distributed architecture",
        ],
        correctIndex: 1,
        explanation:
          "Microservices allow each team to deploy independently without risk to other features, scale individual services under load (video encoding separately from billing), and contain failures so a bug in one service does not cascade to others.",
      },
    ],
  },

  "client-server": {
    slug: "client-server",
    title: "Client/Server Architecture",
    tagline:
      "The foundational model that every networked application is built on",
    sections: [
      {
        type: "text",
        heading: "The Core Model",
        content:
          "Client/server architecture divides a system into two roles: **clients** that request resources or services, and **servers** that provide them. This separation is the foundational pattern of the entire internet.\n\nA client can be a browser, mobile app, desktop application, CLI tool, or even another server. A server is any process listening for incoming requests and responding to them. The key constraint: the client always initiates, the server always responds.",
      },
      {
        type: "analogy",
        heading: "The Phone Call Analogy",
        content:
          "Client/server works exactly like a phone call. You (the client) dial a number. The other person (the server) picks up. You ask a question. They answer. You hang up.\n\nNotice: you initiate the call, not them. If you do not call, they never know you exist. This is the fundamental nature of request-response — the server is passive until called. This is why features like notifications and real-time updates require special techniques (WebSockets, SSE, push) to break this pattern.",
      },
      {
        type: "text",
        heading: "Request-Response Cycle",
        content:
          "Every HTTP interaction follows this cycle:\n\n1. Client opens a TCP connection to the server\n2. Client sends an HTTP request (method, URL, headers, optional body)\n3. Server receives the request and routes it to the appropriate handler\n4. Handler executes business logic, queries databases, calls other services\n5. Server sends an HTTP response (status code, headers, body)\n6. Client receives the response and acts on it\n7. Connection is closed (or kept alive for subsequent requests)",
      },
      {
        type: "code",
        heading: "Client and Server in Node.js",
        language: "typescript",
        label: "client-server.ts",
        code: `// SERVER — listens for incoming requests
import http from 'http';

const server = http.createServer((req, res) => {
  const url = req.url || '/';
  const method = req.method || 'GET';
  
  console.log(\`Received: \${method} \${url}\`);
  
  // Route the request
  if (method === 'GET' && url === '/api/time') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ timestamp: Date.now() }));
    return;
  }
  
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(3000, () => console.log('Server listening on port 3000'));

// CLIENT — makes requests to the server
const response = await fetch('http://localhost:3000/api/time');
const data = await response.json();
console.log('Server time:', data.timestamp);`,
      },
      {
        type: "comparison",
        heading: "Architecture Variants",
        headers: ["Classic C/S", "N-Tier", "Microservices"],
        rows: [
          {
            aspect: "Structure",
            "Classic C/S": "Client talks directly to one server",
            "N-Tier": "Client → API server → DB server",
            Microservices: "Client → API gateway → many services",
          },
          {
            aspect: "Complexity",
            "Classic C/S": "Low",
            "N-Tier": "Medium",
            Microservices: "High",
          },
          {
            aspect: "Scale",
            "Classic C/S": "Limited",
            "N-Tier": "Good",
            Microservices: "Excellent",
          },
          {
            aspect: "Best for",
            "Classic C/S": "Simple tools, prototypes",
            "N-Tier": "Most applications",
            Microservices: "Large orgs, high scale",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Servers Can Be Clients Too",
        content:
          "In modern architectures, servers regularly act as clients to other servers. Your API server calls a payment service (Stripe), an email service (SendGrid), and your own database. This is called service-to-service communication. The roles of client and server are relative to any given transaction, not fixed identities.",
      },
    ],
    quiz: [
      {
        question:
          "In client/server architecture, who always initiates the communication?",
        options: [
          "The server",
          "The client",
          "Either party can initiate",
          "A third-party broker",
        ],
        correctIndex: 1,
        explanation:
          "In standard HTTP client/server, the client always initiates requests. The server is passive — it listens and responds but never sends data without a client first asking. This is why WebSockets and SSE were created: to allow server-initiated messages.",
      },
      {
        question: 'What is a "stateless" server in the context of HTTP?',
        options: [
          "A server that stores no data at all",
          "A server that treats each request independently with no memory of previous requests",
          "A server without a file system",
          "A server that only handles GET requests",
        ],
        correctIndex: 1,
        explanation:
          "Stateless means each HTTP request is completely self-contained. The server does not remember previous interactions. This enables horizontal scaling — any server instance can handle any request. State is maintained client-side (tokens) or in shared storage (databases, Redis).",
      },
    ],
  },

  http: {
    slug: "http",
    title: "HTTP & HTTPS",
    tagline: "The language that powers every request on the web",
    hasVisualizer: "http",
    sections: [
      {
        type: "text",
        heading: "What is HTTP?",
        content:
          "HTTP (HyperText Transfer Protocol) is the application-layer protocol that clients and servers use to communicate. Every time you load a page, call an API, or submit a form, you are using HTTP.\n\nHTTP is **stateless** — each request is completely independent of all previous requests. It is **text-based** in HTTP/1.1 (binary frames in HTTP/2 and HTTP/3). It uses a **request-response model** — the client sends a request, the server sends exactly one response.",
      },
      {
        type: "analogy",
        heading: "The Postal Mail Analogy",
        content:
          "HTTP is like postal mail with a guaranteed reply. You write a letter (request) with:\n- A destination address (URL)\n- A subject line (HTTP method: GET, POST...)\n- A message body (request payload)\n- Metadata (headers)\n\nThe recipient reads it and sends back a reply (response) with:\n- A status (200 OK, 404 Not Found...)\n- The actual content\n\nNeither party remembers previous letters. Each is a fresh transaction. That is statelessness.",
      },
      {
        type: "code",
        heading: "HTTP Request Structure",
        language: "http",
        label: "request.http",
        code: `POST /api/users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Accept: application/json
User-Agent: MyApp/1.0
Content-Length: 52

{
  "name": "Alice Smith",
  "email": "alice@example.com"
}`,
      },
      {
        type: "code",
        heading: "HTTP Response Structure",
        language: "http",
        label: "response.http",
        code: `HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/users/123
X-Request-ID: req_abc123
Cache-Control: no-cache
Date: Mon, 01 Jan 2024 12:00:00 GMT

{
  "data": {
    "id": 123,
    "name": "Alice Smith",
    "email": "alice@example.com",
    "createdAt": "2024-01-01T12:00:00Z"
  }
}`,
      },
      {
        type: "comparison",
        heading: "HTTP Methods",
        headers: ["Method", "Purpose", "Has Body", "Idempotent", "Safe"],
        rows: [
          {
            aspect: "GET",
            Method: "GET",
            Purpose: "Retrieve resource",
            "Has Body": "No",
            Idempotent: "Yes",
            Safe: "Yes",
          },
          {
            aspect: "POST",
            Method: "POST",
            Purpose: "Create resource",
            "Has Body": "Yes",
            Idempotent: "No",
            Safe: "No",
          },
          {
            aspect: "PUT",
            Method: "PUT",
            Purpose: "Replace resource entirely",
            "Has Body": "Yes",
            Idempotent: "Yes",
            Safe: "No",
          },
          {
            aspect: "PATCH",
            Method: "PATCH",
            Purpose: "Partially update resource",
            "Has Body": "Yes",
            Idempotent: "No",
            Safe: "No",
          },
          {
            aspect: "DELETE",
            Method: "DELETE",
            Purpose: "Remove resource",
            "Has Body": "No",
            Idempotent: "Yes",
            Safe: "No",
          },
          {
            aspect: "HEAD",
            Method: "HEAD",
            Purpose: "Metadata only, no body",
            "Has Body": "No",
            Idempotent: "Yes",
            Safe: "Yes",
          },
          {
            aspect: "OPTIONS",
            Method: "OPTIONS",
            Purpose: "Describe allowed operations",
            "Has Body": "No",
            Idempotent: "Yes",
            Safe: "Yes",
          },
        ],
      },
      {
        type: "comparison",
        heading: "HTTP Status Code Families",
        headers: ["Range", "Category", "Common Codes"],
        rows: [
          {
            aspect: "2xx",
            Range: "2xx",
            Category: "Success",
            "Common Codes":
              "200 OK, 201 Created, 204 No Content, 206 Partial Content",
          },
          {
            aspect: "3xx",
            Range: "3xx",
            Category: "Redirection",
            "Common Codes":
              "301 Moved Permanently, 302 Found, 304 Not Modified, 307 Temporary Redirect",
          },
          {
            aspect: "4xx",
            Range: "4xx",
            Category: "Client Error",
            "Common Codes":
              "400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests",
          },
          {
            aspect: "5xx",
            Range: "5xx",
            Category: "Server Error",
            "Common Codes":
              "500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Never Return 200 for Errors",
        content:
          'A common anti-pattern is returning HTTP 200 OK with an error body like {"success": false, "error": "Not found"}. Always use the correct status code. Monitoring tools, API clients, and error tracking systems all depend on status codes. Returning 200 for errors breaks all downstream error handling.',
      },
      {
        type: "text",
        heading: "HTTPS and TLS",
        content:
          "HTTPS is HTTP with a TLS (Transport Layer Security) encryption layer. TLS provides three things:\n\n**Confidentiality** — All data is encrypted in transit. Even if intercepted, it is unreadable.\n\n**Authentication** — The server's certificate proves its identity, preventing impersonation.\n\n**Integrity** — Any tampering with data in transit is detected and the connection rejected.\n\nIn 2024, there is no legitimate reason to use plain HTTP for any production application. Free certificates via Let's Encrypt remove the last cost barrier.",
      },
      {
        type: "comparison",
        heading: "HTTP Versions",
        headers: ["HTTP/1.1", "HTTP/2", "HTTP/3"],
        rows: [
          {
            aspect: "Transport",
            "HTTP/1.1": "TCP",
            "HTTP/2": "TCP",
            "HTTP/3": "QUIC (UDP-based)",
          },
          {
            aspect: "Multiplexing",
            "HTTP/1.1": "One request per connection",
            "HTTP/2": "Multiple streams per conn",
            "HTTP/3": "Multiple streams over QUIC",
          },
          {
            aspect: "Head-of-line",
            "HTTP/1.1": "Blocks at TCP level",
            "HTTP/2": "Blocks at TCP level",
            "HTTP/3": "No blocking (QUIC streams)",
          },
          {
            aspect: "Header compress",
            "HTTP/1.1": "None",
            "HTTP/2": "HPACK",
            "HTTP/3": "QPACK",
          },
          {
            aspect: "Connection time",
            "HTTP/1.1": "TCP + TLS",
            "HTTP/2": "TCP + TLS",
            "HTTP/3": "0-RTT resumption",
          },
        ],
      },
    ],
    quiz: [
      {
        question:
          "Which HTTP method is idempotent — calling it multiple times produces the same result?",
        options: [
          "POST — creates new resources each call",
          "PUT — replaces a resource, same body = same final state",
          "PATCH — partial updates can depend on call order",
          "None are idempotent",
        ],
        correctIndex: 1,
        explanation:
          "PUT is idempotent: PUT /users/1 with the same body 10 times results in the same state. POST creates a new resource each call. DELETE is also idempotent — deleting what is already deleted has no additional effect.",
      },
      {
        question:
          "What status code should be returned when a resource the client requested does not exist?",
        options: [
          "200 OK with an error body",
          "400 Bad Request",
          "404 Not Found",
          "500 Internal Server Error",
        ],
        correctIndex: 2,
        explanation:
          "404 Not Found is the correct semantic. 200 with an error body breaks all monitoring, client-side error handling, and API standards. 400 means the client sent a malformed request. 500 means the server crashed — not a missing resource.",
      },
      {
        question: "What does HTTPS add on top of HTTP?",
        options: [
          "Faster data transfer",
          "Support for JSON bodies",
          "TLS encryption for confidentiality, authentication, and integrity",
          "Larger request size limits",
        ],
        correctIndex: 2,
        explanation:
          "HTTPS wraps HTTP in TLS, providing: encryption (data unreadable in transit), server certificate authentication (prevents impersonation), and integrity checking (detects tampering). It adds a small latency overhead for the TLS handshake but this is negligible with TLS session resumption.",
      },
    ],
  },

  dns: {
    slug: "dns",
    title: "DNS",
    tagline: "The internet's phone book — translating names to addresses",
    sections: [
      {
        type: "text",
        heading: "What is DNS?",
        content:
          "DNS (Domain Name System) is the distributed database that translates human-readable domain names like `api.example.com` into IP addresses like `93.184.216.34`. Without DNS, you would need to memorize IP addresses to visit any website.\n\nDNS is a hierarchical, distributed system. No single server knows all domain names. Instead, queries are delegated down a tree from root servers to TLD servers to authoritative nameservers.",
      },
      {
        type: "analogy",
        heading: "Phone Book Analogy",
        content:
          'Before smartphones, phone books listed names (human-readable) alongside phone numbers (machine-routable). You knew who you wanted to call but looked up their number to actually dial it.\n\nDNS works identically. You know the name "google.com" but the internet routes packets by IP address "142.250.80.46". DNS is the lookup service bridging human names to numeric addresses.',
      },
      {
        type: "steps",
        heading: "DNS Resolution Process",
        steps: [
          {
            title: "Browser cache check",
            detail:
              "Browser checks its local DNS cache first. If a valid cached answer exists (within TTL), resolution ends here.",
          },
          {
            title: "OS resolver check",
            detail:
              "Browser asks the OS resolver. Checks /etc/hosts file and OS DNS cache.",
          },
          {
            title: "Recursive resolver query",
            detail:
              "OS sends query to configured recursive resolver (typically your ISP or 8.8.8.8). This resolver does the heavy lifting.",
          },
          {
            title: "Root nameserver",
            detail:
              'Recursive resolver asks a root nameserver which nameserver handles ".com" TLD. There are 13 root server clusters worldwide.',
          },
          {
            title: "TLD nameserver",
            detail:
              "Root refers to the .com TLD nameserver. TLD nameserver provides the authoritative nameserver for example.com.",
          },
          {
            title: "Authoritative nameserver",
            detail:
              "TLD refers to example.com's nameserver (e.g., ns1.example.com). This server holds the actual A/AAAA records with the IP address.",
          },
          {
            title: "Response returned and cached",
            detail:
              "IP address returned up the chain, cached at each level for TTL seconds, delivered to the browser.",
          },
        ],
      },
      {
        type: "comparison",
        heading: "DNS Record Types",
        headers: ["Type", "Purpose", "Example"],
        rows: [
          {
            aspect: "A",
            Type: "A",
            Purpose: "Maps hostname to IPv4 address",
            Example: "api.example.com → 93.184.216.34",
          },
          {
            aspect: "AAAA",
            Type: "AAAA",
            Purpose: "Maps hostname to IPv6 address",
            Example: "api.example.com → 2001:db8::1",
          },
          {
            aspect: "CNAME",
            Type: "CNAME",
            Purpose: "Alias one hostname to another",
            Example: "www.example.com → example.com",
          },
          {
            aspect: "MX",
            Type: "MX",
            Purpose: "Mail server for the domain",
            Example: "example.com → mail.example.com (priority 10)",
          },
          {
            aspect: "TXT",
            Type: "TXT",
            Purpose: "Arbitrary text data (SPF, DKIM, verify)",
            Example: '"v=spf1 include:sendgrid.net ~all"',
          },
          {
            aspect: "NS",
            Type: "NS",
            Purpose: "Authoritative nameserver for domain",
            Example: "example.com → ns1.cloudflare.com",
          },
          {
            aspect: "PTR",
            Type: "PTR",
            Purpose: "Reverse DNS (IP to hostname)",
            Example: "34.216.184.93.in-addr.arpa → api.example.com",
          },
          {
            aspect: "SRV",
            Type: "SRV",
            Purpose: "Service location record",
            Example: "_https._tcp.example.com → priority, port, target",
          },
        ],
      },
      {
        type: "code",
        heading: "DNS Lookups Programmatically",
        language: "typescript",
        label: "dns-lookup.ts",
        code: `import dns from 'dns/promises';

// Lookup A record (IPv4)
const { address } = await dns.lookup('api.example.com', { family: 4 });
console.log('IPv4:', address); // 93.184.216.34

// Resolve all A records (handles round-robin DNS)
const addresses = await dns.resolve4('api.example.com');
console.log('All A records:', addresses);

// Reverse lookup (IP → hostname)
const hostnames = await dns.reverse('93.184.216.34');
console.log('Hostnames:', hostnames);

// Resolve MX records (mail servers)
const mxRecords = await dns.resolveMx('example.com');
// [{ exchange: 'mail.example.com', priority: 10 }]

// TXT records (SPF, DKIM, verification)
const txtRecords = await dns.resolveTxt('example.com');
console.log('TXT:', txtRecords);`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "TTL and Propagation",
        content:
          "DNS TTL (Time-to-Live) controls how long resolvers cache a record. Low TTL (60s) means changes propagate quickly but increases DNS query load. High TTL (86400s = 1 day) means changes take longer to propagate globally. When changing DNS for a production migration, lower TTL 24-48 hours before switching, switch, then restore TTL.",
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "How Cloudflare Uses DNS at Scale",
        content:
          "Cloudflare operates the 1.1.1.1 resolver processing over 1 trillion DNS queries per day. They use Anycast routing — the same IP address is announced from hundreds of data centers simultaneously. Your DNS query automatically routes to the nearest Cloudflare PoP. Average resolution time is under 15ms globally, versus 50-200ms for typical ISP resolvers.",
      },
    ],
    quiz: [
      {
        question: "What does DNS ultimately translate?",
        options: [
          "HTTP methods to status codes",
          "Domain names to IP addresses",
          "URLs to file paths on a server",
          "Hostnames to MAC addresses",
        ],
        correctIndex: 1,
        explanation:
          "DNS resolves human-readable domain names (api.example.com) to machine-routable IP addresses (93.184.216.34). The internet routes packets by IP address, so this translation is necessary before any TCP connection can be established.",
      },
      {
        question:
          "What DNS record type creates an alias from one hostname to another?",
        options: ["A record", "MX record", "CNAME record", "PTR record"],
        correctIndex: 2,
        explanation:
          "CNAME (Canonical Name) creates an alias. www.example.com CNAME example.com means www.example.com points to wherever example.com points. Changing example.com's A record automatically updates www.example.com too. CNAMEs cannot be used at the apex/root domain.",
      },
    ],
  },

  "tcp-ip": {
    slug: "tcp-ip",
    title: "TCP/IP",
    tagline:
      "The reliable transport layer underpinning all internet communication",
    sections: [
      {
        type: "text",
        heading: "The Internet Protocol Stack",
        content:
          "The internet uses a layered protocol stack. Each layer handles a specific concern:\n\n**Application layer (HTTP, DNS, SMTP)** — What data means and how to interpret it\n\n**Transport layer (TCP, UDP)** — How to reliably deliver data between processes\n\n**Internet layer (IP)** — How to route packets across networks\n\n**Link layer (Ethernet, WiFi)** — How to transmit bits over a physical medium\n\nAs a backend engineer, you primarily work at the application layer but must understand TCP to diagnose connection issues, tune performance, and understand why HTTP behaves as it does.",
      },
      {
        type: "analogy",
        heading: "TCP as a Certified Mail Service",
        content:
          "Imagine sending important documents. Regular mail (UDP) is cheap and fast but provides no guarantees — packets can be lost or arrive out of order.\n\nCertified mail (TCP) provides: a confirmation that the package arrived (acknowledgment), in the correct order (sequence numbers), with a signature required (connection establishment). If a package goes missing, it gets resent automatically (retransmission). You pay slightly more in time and overhead, but you get guarantees.",
      },
      {
        type: "steps",
        heading: "TCP Three-Way Handshake",
        steps: [
          {
            title: "SYN — Client initiates",
            detail:
              'Client sends a SYN packet with its Initial Sequence Number (ISN). "I want to connect, my sequence starts at X."',
          },
          {
            title: "SYN-ACK — Server acknowledges",
            detail:
              'Server responds with SYN-ACK: "I received your SYN (ACK=X+1), I want to connect too, my sequence starts at Y."',
          },
          {
            title: "ACK — Client confirms",
            detail:
              'Client sends ACK=Y+1: "Connection established." Both sides have synchronized sequence numbers. Data can flow.',
          },
        ],
      },
      {
        type: "comparison",
        heading: "TCP vs UDP",
        headers: ["TCP", "UDP"],
        rows: [
          {
            aspect: "Connection",
            TCP: "Connection-oriented (handshake required)",
            UDP: "Connectionless (fire and forget)",
          },
          {
            aspect: "Reliability",
            TCP: "Guaranteed delivery with retransmission",
            UDP: "No delivery guarantee",
          },
          {
            aspect: "Ordering",
            TCP: "Packets delivered in sequence",
            UDP: "May arrive out of order",
          },
          {
            aspect: "Flow control",
            TCP: "Yes — receiver controls send rate",
            UDP: "No",
          },
          {
            aspect: "Overhead",
            TCP: "Higher (headers, ACKs, handshake)",
            UDP: "Lower (8-byte header vs 20+)",
          },
          {
            aspect: "Speed",
            TCP: "Slower due to guarantees",
            UDP: "Faster — minimal overhead",
          },
          {
            aspect: "Use cases",
            TCP: "HTTP, HTTPS, databases, email, SSH",
            UDP: "DNS, streaming, gaming, VoIP, QUIC",
          },
        ],
      },
      {
        type: "code",
        heading: "TCP Socket Programming in Node.js",
        language: "typescript",
        label: "tcp-server.ts",
        code: `import net from 'net';

// TCP Server
const server = net.createServer((socket) => {
  console.log(\`Client connected: \${socket.remoteAddress}:\${socket.remotePort}\`);
  
  // Receive data
  socket.on('data', (data) => {
    console.log('Received:', data.toString());
    // Echo back
    socket.write(\`Echo: \${data.toString()}\`);
  });
  
  // Handle disconnection
  socket.on('close', () => console.log('Client disconnected'));
  socket.on('error', (err) => console.error('Socket error:', err));
  
  // Configure socket
  socket.setKeepAlive(true, 30000); // keepalive after 30s idle
  socket.setTimeout(60000);         // 60s inactivity timeout
});

server.listen(8080, () => console.log('TCP server on port 8080'));

// TCP Client
const client = net.createConnection({ port: 8080 }, () => {
  console.log('Connected to server');
  client.write('Hello from client');
});
client.on('data', (data) => console.log('Response:', data.toString()));`,
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "TCP Performance Tuning",
        content:
          "Several TCP settings significantly impact application performance. TCP_NODELAY disables Nagle's algorithm, reducing latency for small packets (important for interactive apps). TCP keepalive prevents idle connections from being dropped by firewalls. Connection pooling amortizes the 3-way handshake cost across many requests — critical for database drivers and HTTP clients.",
      },
    ],
    quiz: [
      {
        question:
          "How many packets are exchanged during a TCP three-way handshake?",
        options: [
          "1 — just the initial SYN",
          "2 — SYN and SYN-ACK",
          "3 — SYN, SYN-ACK, ACK",
          "4 — includes a data packet",
        ],
        correctIndex: 2,
        explanation:
          "TCP requires exactly 3 packets to establish a connection: SYN (client initiates), SYN-ACK (server acknowledges and initiates), ACK (client confirms). Only after this handshake can data flow. This 1.5 round-trip latency is why HTTP/3 introduced 0-RTT connection resumption.",
      },
      {
        question: "Why would you choose UDP over TCP?",
        options: [
          "When you need guaranteed message delivery",
          "When data must arrive in the correct order",
          "When low latency matters more than reliability, such as live video streaming",
          "When security is critical",
        ],
        correctIndex: 2,
        explanation:
          "UDP trades reliability for speed. For live video or gaming, a dropped frame is better than a delayed retransmission — you want the newest data as fast as possible. DNS also uses UDP since a single short query/response fits in one packet and a lost packet is trivially retried.",
      },
    ],
  },

  apis: {
    slug: "apis",
    title: "APIs",
    tagline: "The contracts that let software systems talk to each other",
    sections: [
      {
        type: "text",
        heading: "What is an API?",
        content:
          'An API (Application Programming Interface) is a defined contract specifying how one software component can interact with another. It exposes capabilities while hiding implementation details.\n\nIn web development, "API" usually refers to an HTTP API — a server that accepts HTTP requests with specific structure and returns structured responses (typically JSON). But APIs exist everywhere: operating system APIs, library APIs, hardware APIs, and cloud service APIs.',
      },
      {
        type: "analogy",
        heading: "Restaurant Menu Analogy",
        content:
          'A restaurant menu is an API. It tells you exactly what you can order (available endpoints), what information you need to provide (parameters — "medium rare, no onions"), and what you will get back (response format — a steak dinner).\n\nYou do not need to know how the kitchen works. You do not touch the stove. You just call the right item on the menu with the right parameters. That is API design: a clear contract between caller and provider.',
      },
      {
        type: "code",
        heading: "Designing a Clean API",
        language: "typescript",
        label: "api-design.ts",
        code: `// Well-designed API endpoints follow these patterns:
// - Nouns for resources (not verbs)
// - Hierarchical URL structure
// - HTTP methods express the action
// - Consistent response envelope

// Resource: /api/v1/users
GET    /api/v1/users              // List users
POST   /api/v1/users              // Create user
GET    /api/v1/users/:id          // Get specific user
PUT    /api/v1/users/:id          // Replace user
PATCH  /api/v1/users/:id          // Update user fields
DELETE /api/v1/users/:id          // Delete user

// Nested resources
GET    /api/v1/users/:id/orders   // Orders belonging to user
POST   /api/v1/users/:id/orders   // Create order for user

// Consistent response envelope
{
  "data": { ... },          // Success: the resource or list
  "error": { ... },         // Failure: error object
  "meta": {                 // Optional metadata
    "total": 250,
    "page": 1,
    "perPage": 20
  }
}

// API versioning in URL (recommended for breaking changes)
// /api/v1/users → /api/v2/users (new field requirements)`,
      },
      {
        type: "code",
        heading: "API Design Best Practices",
        language: "typescript",
        label: "api-express.ts",
        code: `import express, { Request, Response, NextFunction } from 'express';

const app = express();
app.use(express.json());

// Input validation middleware
const validateUser = (req: Request, res: Response, next: NextFunction) => {
  const { name, email } = req.body;
  
  if (!name || typeof name !== 'string' || name.length < 2) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'name must be at least 2 characters' }
    });
  }
  if (!email || !email.includes('@')) {
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Valid email required' }
    });
  }
  next();
};

// Idempotent GET
app.get('/api/v1/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  
  if (!user) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: \`User \${req.params.id} not found\` }
    });
  }
  
  res.json({ data: user });
});

// POST with validation
app.post('/api/v1/users', validateUser, async (req, res) => {
  const user = await db.users.create(req.body);
  
  res.status(201)
    .header('Location', \`/api/v1/users/\${user.id}\`)
    .json({ data: user });
});`,
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "API Versioning Strategy",
        content:
          "Version APIs from day one. URL versioning (/v1/, /v2/) is most explicit. Never break a deployed API without a new version — mobile clients cannot be force-updated instantly. Stripe maintains API versions for years and allows clients to pin to a specific date version. This is the gold standard for API backward compatibility.",
      },
    ],
    quiz: [
      {
        question: "What is the primary purpose of an API?",
        options: [
          "To store data persistently",
          "To define a contract for how software components interact",
          "To render user interfaces",
          "To manage server memory",
        ],
        correctIndex: 1,
        explanation:
          "An API is a defined interface — a contract specifying what operations are available, what inputs they accept, and what outputs they return. It hides implementation details behind a stable interface, enabling decoupled development.",
      },
      {
        question: "Which URL structure follows RESTful API design principles?",
        options: [
          "/api/getUser?id=123",
          "/api/users/123 (GET)",
          "/api/deleteUser/123",
          "/api/v1/createNewUser",
        ],
        correctIndex: 1,
        explanation:
          'RESTful design uses nouns for resources (users) and HTTP methods to express the action. GET /api/users/123 is correct: GET expresses "read", /users/123 is the resource identifier. URLs with verbs like getUser or deleteUser violate REST conventions.',
      },
    ],
  },

  rest: {
    slug: "rest",
    title: "REST",
    tagline: "The architectural style that shaped modern API design",
    sections: [
      {
        type: "text",
        heading: "What is REST?",
        content:
          "REST (Representational State Transfer) is an architectural style for distributed hypermedia systems defined by Roy Fielding in his 2000 doctoral dissertation. It is not a protocol or standard but a set of constraints that, when followed, produce scalable, maintainable APIs.\n\nREST has six architectural constraints: uniform interface, client-server separation, statelessness, cacheability, layered system, and code-on-demand (optional). APIs that follow these constraints are called RESTful.",
      },
      {
        type: "text",
        heading: "The Six REST Constraints",
        content:
          "**Uniform Interface** — A consistent way to interact with resources. Resources identified by URIs, manipulated through representations, self-descriptive messages, HATEOAS.\n\n**Client-Server** — Client and server evolve independently. Client handles UI; server handles data and logic.\n\n**Stateless** — Each request contains all information needed. Server stores no session state between requests.\n\n**Cacheable** — Responses must define themselves as cacheable or non-cacheable. Caching improves scalability.\n\n**Layered System** — Client cannot tell if it is connected to the end server or an intermediary (load balancer, cache).\n\n**Code-On-Demand** (optional) — Server can extend client functionality by sending executable code.",
      },
      {
        type: "code",
        heading: "RESTful API in Express",
        language: "typescript",
        label: "rest-api.ts",
        code: `import express from 'express';
const app = express();
app.use(express.json());

// Collection resource: /articles
app.get('/articles', async (req, res) => {
  const { page = 1, limit = 20, tag } = req.query;
  const articles = await db.articles.findAll({ page, limit, tag });
  
  res.json({
    data: articles,
    meta: { page, limit, total: articles.total },
    links: {
      self: \`/articles?page=\${page}\`,
      next: articles.hasNext ? \`/articles?page=\${Number(page)+1}\` : null,
    }
  });
});

// Individual resource: /articles/:id
app.get('/articles/:id', async (req, res) => {
  const article = await db.articles.findById(req.params.id);
  if (!article) return res.status(404).json({ error: 'Not found' });
  
  // Include links to related resources (HATEOAS)
  res.json({
    data: article,
    links: {
      self: \`/articles/\${article.id}\`,
      author: \`/users/\${article.authorId}\`,
      comments: \`/articles/\${article.id}/comments\`,
    }
  });
});

// Create: POST to collection
app.post('/articles', authenticate, async (req, res) => {
  const article = await db.articles.create({
    ...req.body,
    authorId: req.user.id,
  });
  res.status(201).location(\`/articles/\${article.id}\`).json({ data: article });
});

// Full replace: PUT to individual resource (idempotent)
app.put('/articles/:id', authenticate, authorize, async (req, res) => {
  const article = await db.articles.replace(req.params.id, req.body);
  res.json({ data: article });
});

// Partial update: PATCH (only send changed fields)
app.patch('/articles/:id', authenticate, authorize, async (req, res) => {
  const article = await db.articles.update(req.params.id, req.body);
  res.json({ data: article });
});

app.delete('/articles/:id', authenticate, authorize, async (req, res) => {
  await db.articles.delete(req.params.id);
  res.status(204).end(); // No content on successful delete
});`,
      },
      {
        type: "comparison",
        heading: "REST vs RPC-style APIs",
        headers: ["REST", "RPC-style"],
        rows: [
          {
            aspect: "URL structure",
            REST: "Nouns: /users/123",
            "RPC-style": "Verbs: /getUser, /deleteUser",
          },
          {
            aspect: "Actions",
            REST: "HTTP method expresses action",
            "RPC-style": "Action in URL or body",
          },
          {
            aspect: "Caching",
            REST: "GET responses are naturally cacheable",
            "RPC-style": "Harder to cache POST-based calls",
          },
          {
            aspect: "Standards",
            REST: "Widely understood conventions",
            "RPC-style": "Custom per API, less discoverable",
          },
          {
            aspect: "Flexibility",
            REST: "Resource-centric, less flexible",
            "RPC-style": "Action-centric, more flexible",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Common REST Anti-Patterns",
        content:
          "Avoid: verbs in URLs (/api/getUser), using POST for reads, ignoring status codes (200 for errors), inconsistent response structures, no versioning strategy, and overly nested URLs (/users/1/orders/5/items/3/variants). REST works best with resources as the core abstraction — keep URLs flat and meaningful.",
      },
    ],
    quiz: [
      {
        question: 'What does "stateless" mean in REST?',
        options: [
          "The API has no data",
          "Each request contains all information needed — server stores no session between requests",
          "The server never changes state",
          "Responses have no body",
        ],
        correctIndex: 1,
        explanation:
          "REST statelessness means each HTTP request must be fully self-contained. The server does not remember previous requests. This enables horizontal scaling — any server can handle any request because there is no server-side session to maintain.",
      },
    ],
  },

  graphql: {
    slug: "graphql",
    title: "GraphQL",
    tagline: "A query language for your API — ask for exactly what you need",
    sections: [
      {
        type: "text",
        heading: "What is GraphQL?",
        content:
          "GraphQL is a query language for APIs and a server-side runtime for executing those queries, developed by Facebook in 2012 and open-sourced in 2015. Unlike REST where the server determines the response shape, in GraphQL the **client specifies exactly what data it needs**.\n\nThis solves two major REST problems: **over-fetching** (receiving more data than needed) and **under-fetching** (needing multiple requests to get related data).",
      },
      {
        type: "analogy",
        heading: "Custom Order vs Set Menu",
        content:
          'REST is like a set menu at a restaurant. You order "the steak dinner" and receive a fixed plate: steak, fries, salad, bread. You did not want the salad, but it comes anyway. You wanted garlic butter, but it is not standard.\n\nGraphQL is like ordering a la carte. You specify exactly: steak (medium rare), truffle fries, no salad, add garlic butter. You receive exactly what you asked for — nothing more, nothing less. The kitchen (server) handles the complexity of assembling your custom order.',
      },
      {
        type: "code",
        heading: "GraphQL Schema Definition",
        language: "graphql",
        label: "schema.graphql",
        code: `type User {
  id: ID!
  name: String!
  email: String!
  posts(limit: Int = 10): [Post!]!
  followerCount: Int!
}

type Post {
  id: ID!
  title: String!
  body: String!
  author: User!
  tags: [String!]!
  publishedAt: String
  commentCount: Int!
}

type Query {
  user(id: ID!): User
  users(page: Int, limit: Int): [User!]!
  post(id: ID!): Post
  searchPosts(query: String!, tags: [String]): [Post!]!
}

type Mutation {
  createPost(title: String!, body: String!, tags: [String]): Post!
  updatePost(id: ID!, title: String, body: String): Post!
  deletePost(id: ID!): Boolean!
}

type Subscription {
  postCreated: Post!
  commentAdded(postId: ID!): Comment!
}`,
      },
      {
        type: "code",
        heading: "GraphQL Queries vs REST Calls",
        language: "graphql",
        label: "queries.graphql",
        code: `# Single query fetches user + their posts + post authors
# REST would require: GET /users/1, GET /users/1/posts, GET /users/2 (author)

query GetUserWithPosts {
  user(id: "1") {
    name
    email
    posts(limit: 3) {
      title
      publishedAt
      commentCount
      author {
        name    # might be a different user (co-author)
      }
    }
  }
}

# Ask only for what the mobile app needs (less bandwidth)
query MobileUserCard {
  user(id: "1") {
    name          # Only these two fields
    followerCount # Nothing else
  }
}

# Multiple resources in one round trip
query DashboardData {
  me: user(id: "me") { name }
  recentPosts: searchPosts(query: "", limit: 5) {
    id
    title
    publishedAt
  }
}`,
      },
      {
        type: "comparison",
        heading: "REST vs GraphQL",
        headers: ["REST", "GraphQL"],
        rows: [
          {
            aspect: "Data fetching",
            REST: "Server determines response shape",
            GraphQL: "Client specifies exactly what it needs",
          },
          {
            aspect: "Multiple resources",
            REST: "Multiple HTTP round trips",
            GraphQL: "Single request for all related data",
          },
          {
            aspect: "Over-fetching",
            REST: "Common — endpoints return full objects",
            GraphQL: "Eliminated — only requested fields returned",
          },
          {
            aspect: "Versioning",
            REST: "URL versions (/v1/, /v2/)",
            GraphQL: "Schema evolution via deprecation",
          },
          {
            aspect: "Caching",
            REST: "HTTP caching works naturally",
            GraphQL: "HTTP caching harder (all POSTs by convention)",
          },
          {
            aspect: "Learning curve",
            REST: "Widely known, low barrier",
            GraphQL: "Higher — schema, resolvers, N+1 problems",
          },
          {
            aspect: "Best for",
            REST: "Simple APIs, microservices, public APIs",
            GraphQL: "Complex UIs, mobile apps, rapid frontend iteration",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "The N+1 Query Problem",
        content:
          "The most common GraphQL pitfall: if you have a posts query returning 10 posts, and each post resolves its author, you execute 1 query for posts + 10 queries for authors = 11 queries. Solution: use DataLoader to batch and deduplicate database calls. Without it, GraphQL performance can be worse than REST.",
      },
    ],
    quiz: [
      {
        question:
          "What problem does GraphQL solve that REST APIs commonly have?",
        options: [
          "REST APIs are insecure by default",
          "Over-fetching (too much data) and under-fetching (needing multiple requests)",
          "REST cannot handle authentication",
          "REST is slower than GraphQL by default",
        ],
        correctIndex: 1,
        explanation:
          "GraphQL lets clients specify exactly the fields they need, eliminating over-fetching (receiving unused data). It also allows fetching multiple related resources in a single query, solving under-fetching (needing N requests to get N resources).",
      },
    ],
  },

  websockets: {
    slug: "websockets",
    title: "WebSockets & SSE",
    tagline: "Breaking the request-response cycle for real-time communication",
    sections: [
      {
        type: "text",
        heading: "The Problem with HTTP Polling",
        content:
          'Standard HTTP is request-driven — clients ask, servers answer. For real-time features (chat, live feeds, collaborative editing, trading dashboards), you cannot wait for a client to ask. You need to push data as it happens.\n\nNaive solution: **polling** — client asks "anything new?" every N seconds. Problems: most requests return empty (wasted), latency = up to N seconds, high server load.\n\nBetter: **long-polling** — client sends request, server holds it open until data arrives. Reduces empty responses but still requires reconnection after each message.',
      },
      {
        type: "text",
        heading: "WebSockets",
        content:
          "WebSocket is a full-duplex communication protocol over a single TCP connection. After an HTTP upgrade handshake, the connection stays open and either party can send frames at any time.\n\n**Key properties:**\n- Bi-directional: server can push to client without a request\n- Persistent: one connection handles many messages (no handshake overhead per message)\n- Low latency: typically <50ms message delivery\n- Full-duplex: simultaneous send and receive\n\nUse cases: real-time chat, collaborative editors, live dashboards, multiplayer games, financial tickers.",
      },
      {
        type: "code",
        heading: "WebSocket Server and Client",
        language: "typescript",
        label: "websocket.ts",
        code: `import { WebSocketServer, WebSocket } from 'ws';

// Server
const wss = new WebSocketServer({ port: 8080 });
const clients = new Set<WebSocket>();

wss.on('connection', (ws, req) => {
  clients.add(ws);
  console.log(\`Client connected. Total: \${clients.size}\`);

  // Receive messages from this client
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    
    // Broadcast to all connected clients
    const payload = JSON.stringify({
      type: 'message',
      text: msg.text,
      from: req.headers['x-user-id'],
      timestamp: Date.now(),
    });
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  });

  // Handle disconnection
  ws.on('close', () => {
    clients.delete(ws);
    console.log(\`Client disconnected. Total: \${clients.size}\`);
  });

  // Send welcome message
  ws.send(JSON.stringify({ type: 'connected', message: 'Welcome!' }));
});

// Client (in browser or Node.js)
const ws = new WebSocket('wss://api.example.com/ws', {
  headers: { 'x-user-id': 'user_123' }
});

ws.on('open', () => ws.send(JSON.stringify({ text: 'Hello everyone!' })));
ws.on('message', (data) => console.log('Received:', JSON.parse(data.toString())));
ws.on('close', () => setTimeout(() => reconnect(), 3000)); // Auto-reconnect`,
      },
      {
        type: "text",
        heading: "Server-Sent Events (SSE)",
        content:
          "SSE is a simpler alternative for **server-to-client** only streaming over standard HTTP. The server sends a stream of text/event-stream data; the client uses the native EventSource API.\n\nAdvantages over WebSockets: works over plain HTTP/2 (no upgrade), automatic reconnection built in, works through HTTP proxies naturally, simpler to implement.\n\nLimitations: one-directional only (server → client), text-only by default, maximum 6 concurrent connections per domain in HTTP/1.1 (solved with HTTP/2).",
      },
      {
        type: "code",
        heading: "Server-Sent Events Implementation",
        language: "typescript",
        label: "sse.ts",
        code: `// SSE Server
app.get('/api/events', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial connection event
  res.write('event: connected\ndata: {"status":"ok"}\n\n');

  // Send periodic updates
  const interval = setInterval(() => {
    const data = JSON.stringify({
      price: 42000 + Math.random() * 1000,
      timestamp: Date.now()
    });
    res.write(\`event: price-update\ndata: \${data}\n\n\`);
  }, 1000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// SSE Client (browser)
const source = new EventSource('/api/events');
source.addEventListener('price-update', (event) => {
  const data = JSON.parse(event.data);
  updatePriceDisplay(data.price);
});
source.onerror = () => source.close(); // SSE auto-reconnects`,
      },
      {
        type: "comparison",
        heading: "Polling vs SSE vs WebSockets",
        headers: ["Polling", "SSE", "WebSocket"],
        rows: [
          {
            aspect: "Direction",
            Polling: "Client-initiated",
            SSE: "Server → Client only",
            WebSocket: "Full bi-directional",
          },
          {
            aspect: "Protocol",
            Polling: "Standard HTTP",
            SSE: "Standard HTTP/2",
            WebSocket: "WS protocol (upgrade)",
          },
          {
            aspect: "Latency",
            Polling: "Up to interval delay",
            SSE: "Near real-time",
            WebSocket: "Near real-time",
          },
          {
            aspect: "Overhead",
            Polling: "High (many requests)",
            SSE: "Low (persistent stream)",
            WebSocket: "Lowest (binary frames)",
          },
          {
            aspect: "Reconnection",
            Polling: "N/A",
            SSE: "Automatic",
            WebSocket: "Manual (must implement)",
          },
          {
            aspect: "Use case",
            Polling: "Simple, infrequent",
            SSE: "Feeds, notifications",
            WebSocket: "Chat, games, collaboration",
          },
        ],
      },
    ],
    quiz: [
      {
        question:
          "What is the fundamental difference between WebSockets and regular HTTP?",
        options: [
          "WebSockets use a different port than HTTP",
          "WebSockets maintain a persistent connection allowing server-initiated messages",
          "WebSockets are encrypted while HTTP is not",
          "WebSockets only work in mobile browsers",
        ],
        correctIndex: 1,
        explanation:
          "WebSockets establish a persistent, full-duplex TCP connection via an HTTP upgrade handshake. Once established, either party can send messages at any time without a new request. HTTP requires a new request for every interaction and the server cannot push without being asked.",
      },
    ],
  },

  grpc: {
    slug: "grpc",
    title: "gRPC",
    tagline:
      "High-performance RPC for microservice-to-microservice communication",
    sections: [
      {
        type: "text",
        heading: "What is gRPC?",
        content:
          "gRPC is a high-performance, open-source Remote Procedure Call (RPC) framework developed by Google. It uses **Protocol Buffers (Protobuf)** as its interface definition language and binary serialization format, and runs over HTTP/2.\n\nInstead of REST's resource-oriented design, gRPC exposes functions (procedures) that remote clients can call as if they were local functions. This makes it natural for tightly-coupled service-to-service communication where performance is critical.",
      },
      {
        type: "comparison",
        heading: "gRPC vs REST",
        headers: ["gRPC", "REST + JSON"],
        rows: [
          {
            aspect: "Payload format",
            gRPC: "Binary Protobuf (~5-10x smaller)",
            "REST + JSON": "Text JSON (human readable)",
          },
          {
            aspect: "Serialization",
            gRPC: "Fast binary encoding/decoding",
            "REST + JSON": "Slower text parsing",
          },
          {
            aspect: "Schema",
            gRPC: "Strongly typed .proto definition",
            "REST + JSON": "Optional (OpenAPI, JSON Schema)",
          },
          {
            aspect: "Code generation",
            gRPC: "Auto-generates clients in 11+ langs",
            "REST + JSON": "Manual or via OpenAPI generators",
          },
          {
            aspect: "Streaming",
            gRPC: "Native bi-directional streaming",
            "REST + JSON": "Requires WebSockets or SSE",
          },
          {
            aspect: "Browser support",
            gRPC: "Requires grpc-web proxy",
            "REST + JSON": "Native browser support",
          },
          {
            aspect: "Debugging",
            gRPC: "Harder (binary)",
            "REST + JSON": "Easy (human-readable JSON)",
          },
          {
            aspect: "Best for",
            gRPC: "Internal microservice communication",
            "REST + JSON": "Public APIs, browser clients",
          },
        ],
      },
      {
        type: "code",
        heading: "Protobuf Definition + gRPC Service",
        language: "protobuf",
        label: "user.proto",
        code: `syntax = "proto3";

package user;

// Request/response message types
message GetUserRequest {
  string user_id = 1;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
  int64 created_at = 4;
  repeated string roles = 5;  // Repeated = array
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
  string password = 3;
}

message UserList {
  repeated User users = 1;
  int32 total = 2;
}

// Service definition
service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc CreateUser (CreateUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (UserList);
  
  // Server streaming: client sends one request, receives stream
  rpc WatchUserActivity (GetUserRequest) returns (stream ActivityEvent);
  
  // Bi-directional streaming
  rpc Chat (stream ChatMessage) returns (stream ChatMessage);
}`,
      },
      {
        type: "code",
        heading: "gRPC Server in Node.js",
        language: "typescript",
        label: "grpc-server.ts",
        code: `import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDef = protoLoader.loadSync('./user.proto');
const proto = grpc.loadPackageDefinition(packageDef) as any;

// Implement the service
const userService = {
  async getUser(call: any, callback: any) {
    const { user_id } = call.request;
    try {
      const user = await db.users.findById(user_id);
      if (!user) {
        return callback({
          code: grpc.status.NOT_FOUND,
          message: \`User \${user_id} not found\`,
        });
      }
      callback(null, {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.createdAt.getTime(),
      });
    } catch (err) {
      callback({ code: grpc.status.INTERNAL, message: 'Database error' });
    }
  },
  
  // Server streaming example
  watchUserActivity(call: any) {
    const { user_id } = call.request;
    const unsubscribe = eventBus.subscribe(\`user:\${user_id}\`, (event) => {
      call.write({ type: event.type, timestamp: Date.now() });
    });
    call.on('cancelled', unsubscribe);
  }
};

const server = new grpc.Server();
server.addService(proto.user.UserService.service, userService);
server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
  console.log('gRPC server running on port 50051');
});`,
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "Where gRPC Shines",
        content:
          "Google, Netflix, Uber, and Lyft use gRPC for internal service-to-service communication. The binary format and HTTP/2 multiplexing provide significant performance gains — typically 5-10x smaller payloads and 2-5x faster serialization vs JSON. For high-throughput internal APIs (>10K RPS), gRPC can meaningfully reduce infrastructure costs and latency.",
      },
    ],
    quiz: [
      {
        question: "What format does gRPC use for payload serialization?",
        options: [
          "JSON (text-based)",
          "XML",
          "Binary Protocol Buffers (Protobuf)",
          "MessagePack",
        ],
        correctIndex: 2,
        explanation:
          "gRPC uses Protocol Buffers (Protobuf) — a binary serialization format. Protobuf is ~5-10x smaller than equivalent JSON and 3-10x faster to serialize/deserialize. The tradeoff is that it is not human-readable, making debugging harder.",
      },
    ],
  },

  // ─── AUTH ─────────────────────────────────────────────────────────────────

  "cookies-sessions": {
    slug: "cookies-sessions",
    title: "Cookies & Sessions",
    tagline:
      "Adding state to stateless HTTP — the foundation of web authentication",
    sections: [
      {
        type: "text",
        heading: "Why Sessions Exist",
        content:
          "HTTP is stateless — every request is independent. But real applications need to track logged-in users across multiple requests. Sessions and cookies solve this by creating a persistent identity layer on top of stateless HTTP.\n\n**Cookies** are small pieces of data the server sends to the browser, which the browser automatically includes in every subsequent request to that domain.\n\n**Sessions** are server-side storage that associates a session ID (stored in a cookie) with user data. When the browser sends the session ID cookie, the server looks up the session data.",
      },
      {
        type: "analogy",
        heading: "Hotel Key Card Analogy",
        content:
          "When you check into a hotel, they give you a key card (session cookie). The card itself is just a number — it contains no personal information. But the hotel's system (session store) maps your key card number to: your room number, checkout date, preferences, and billing info.\n\nEvery time you use the key card, the hotel system looks up everything associated with it. If you lose the card, no personal data is exposed — just report it and get a new card. The key card is meaningless without the hotel's backend lookup — that is a session.",
      },
      {
        type: "code",
        heading: "Session-Based Authentication",
        language: "typescript",
        label: "sessions.ts",
        code: `import express from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const app = express();
const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET!, // Long random string
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    httpOnly: true,    // Not accessible via JavaScript (XSS protection)
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict', // CSRF protection
  }
}));

// Login: create session
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.users.findByEmail(email);
  
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Store user data in session
  req.session.userId = user.id;
  req.session.role = user.role;
  
  res.json({ message: 'Logged in' });
});

// Protected route: check session
app.get('/api/profile', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const user = await db.users.findById(req.session.userId);
  res.json({ data: user });
});

// Logout: destroy session
app.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.json({ message: 'Logged out' });
  });
});`,
      },
      {
        type: "comparison",
        heading: "Cookie Attributes",
        headers: ["Attribute", "Effect", "Security Benefit"],
        rows: [
          {
            aspect: "HttpOnly",
            Attribute: "HttpOnly",
            Effect: "Cookie not accessible via JS",
            "Security Benefit": "Prevents XSS stealing session cookies",
          },
          {
            aspect: "Secure",
            Attribute: "Secure",
            Effect: "Only sent over HTTPS",
            "Security Benefit": "Prevents interception over HTTP",
          },
          {
            aspect: "SameSite=Strict",
            Attribute: "SameSite=Strict",
            Effect: "Only sent for same-site requests",
            "Security Benefit": "Prevents CSRF attacks",
          },
          {
            aspect: "SameSite=Lax",
            Attribute: "SameSite=Lax",
            Effect: "Sent for top-level navigation",
            "Security Benefit": "CSRF protection with less restriction",
          },
          {
            aspect: "Max-Age / Expires",
            Attribute: "Max-Age / Expires",
            Effect: "Controls cookie lifetime",
            "Security Benefit": "Limits session duration exposure",
          },
          {
            aspect: "Domain",
            Attribute: "Domain",
            Effect: "Restricts which subdomains get cookie",
            "Security Benefit": "Prevents sharing across unrelated subdomains",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Session Fixation and Regeneration",
        content:
          "After login, always generate a new session ID. If you reuse the pre-login session ID, an attacker can set a known session ID before login and then use it after the victim authenticates (session fixation attack). Call req.session.regenerate() after successful authentication in any session library.",
      },
    ],
    quiz: [
      {
        question:
          "Why should session cookies always have the HttpOnly flag set?",
        options: [
          "It makes the cookie expire faster",
          "It prevents JavaScript from reading the cookie, blocking XSS session theft",
          "It forces HTTPS for cookie transmission",
          "It prevents the cookie from being sent cross-site",
        ],
        correctIndex: 1,
        explanation:
          "HttpOnly prevents any JavaScript (including injected XSS scripts) from accessing the cookie via document.cookie. Without HttpOnly, a single XSS vulnerability can steal all users' session cookies. With HttpOnly, the browser sends the cookie automatically but scripts cannot read it.",
      },
    ],
  },

  jwt: {
    slug: "jwt",
    title: "JWT",
    tagline:
      "Stateless authentication tokens for modern APIs and microservices",
    hasVisualizer: "jwt",
    sections: [
      {
        type: "text",
        heading: "What is a JWT?",
        content:
          "A JWT (JSON Web Token) is a compact, URL-safe token that carries signed claims about a subject (user). It consists of three base64url-encoded parts separated by dots: Header.Payload.Signature.\n\nUnlike sessions, JWTs are **stateless** — the server does not store them. Any server with the secret key can verify and decode a JWT without database or cache lookups. This enables horizontal scaling and microservice architectures where multiple services need to verify user identity.",
      },
      {
        type: "analogy",
        heading: "Signed Government ID Analogy",
        content:
          "A government ID contains your information (payload), is issued by an authority (server signature), and can be verified by anyone — a border agent, a bartender — without calling the issuing government (no database lookup).\n\nThe bearer carries it. The signature proves authenticity. The information is readable by anyone who sees it (not encrypted). The signature cannot be forged without the government's stamp (secret key).\n\nJWTs work identically: server issues a signed token, client carries it, any service with the public/secret key verifies it instantly.",
      },
      {
        type: "code",
        heading: "Complete JWT Authentication",
        language: "typescript",
        label: "jwt-auth.ts",
        code: `import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;

// LOGIN — issue access + refresh tokens
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.users.findByEmail(email);
  
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' } // Short-lived
  );
  
  const refreshToken = jwt.sign(
    { sub: user.id, jti: crypto.randomUUID() }, // jti = unique token ID
    REFRESH_SECRET,
    { expiresIn: '30d' }
  );
  
  // Store refresh token hash in DB for revocation support
  await db.refreshTokens.create({
    userId: user.id,
    tokenHash: await bcrypt.hash(refreshToken, 8),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });
  
  // Send access token in response, refresh in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, secure: true, sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  
  res.json({ accessToken }); // Client stores in memory only
});

// MIDDLEWARE — verify on protected routes
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// REFRESH — issue new access token using refresh token
app.post('/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });
  
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as JwtPayload;
    
    // Verify against stored token (revocation check)
    const stored = await db.refreshTokens.findByUserId(payload.sub);
    const valid = stored && await bcrypt.compare(refreshToken, stored.tokenHash);
    if (!valid) return res.status(401).json({ error: 'Refresh token revoked' });
    
    const accessToken = jwt.sign(
      { sub: payload.sub, email: payload.email, role: payload.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    res.json({ accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});`,
      },
      {
        type: "comparison",
        heading: "Sessions vs JWTs",
        headers: ["Sessions", "JWTs"],
        rows: [
          {
            aspect: "Storage",
            Sessions: "Server stores data (Redis, DB)",
            JWTs: "Client carries token (stateless server)",
          },
          {
            aspect: "Scalability",
            Sessions: "Requires shared session store",
            JWTs: "Any server verifies without shared state",
          },
          {
            aspect: "Revocation",
            Sessions: "Instant — delete from store",
            JWTs: "Hard — must wait for expiry or maintain blocklist",
          },
          {
            aspect: "Payload size",
            Sessions: "Only session ID sent per request",
            JWTs: "Full token sent per request (usually 200-500 bytes)",
          },
          {
            aspect: "Best for",
            Sessions: "Traditional web apps, admin panels",
            JWTs: "Microservices, mobile apps, cross-origin APIs",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Critical JWT Security Rules",
        content:
          'Never store JWTs in localStorage — XSS can steal them. Use memory for access tokens and httpOnly cookies for refresh tokens. Never put passwords or secrets in the payload — it is only base64 encoded, not encrypted. Always validate the algorithm — reject tokens using "none" algorithm. Always set expiry (exp claim) — never issue eternal tokens.',
      },
    ],
    quiz: [
      {
        question: "Is JWT payload data private?",
        options: [
          "Yes, it is encrypted with the secret key",
          "No, it is only base64 encoded — anyone can decode it",
          "Yes, but only if HS256 algorithm is used",
          "It depends on the issuer configuration",
        ],
        correctIndex: 1,
        explanation:
          "JWT payload is base64url encoded, NOT encrypted. Anyone who intercepts the token can decode the header and payload trivially. The signature only proves the token was issued by the secret key holder and has not been tampered with. Never put sensitive data in a JWT payload.",
      },
      {
        question: "Why is JWT revocation harder than session revocation?",
        options: [
          "JWT signatures cannot be validated quickly",
          "JWTs are stateless — the server has no record to delete to invalidate a token",
          "JWT libraries do not support revocation APIs",
          "JWT tokens are encrypted and cannot be inspected",
        ],
        correctIndex: 1,
        explanation:
          "Sessions are stored server-side — deleting the session record immediately invalidates it. JWTs are stateless — any valid signature is accepted until expiry. To revoke a JWT before expiry, you need a token blocklist (Redis set of revoked JTIs) or keep JWTs very short-lived (15 minutes) with refresh tokens.",
      },
    ],
  },

  oauth: {
    slug: "oauth",
    title: "OAuth 2.0",
    tagline:
      "Delegated authorization — letting users grant third-party access without sharing passwords",
    sections: [
      {
        type: "text",
        heading: "What is OAuth 2.0?",
        content:
          "OAuth 2.0 is an authorization framework that enables applications to obtain limited access to user accounts without exposing credentials. Rather than sharing a username and password with a third-party app, users grant that app specific permissions via the service that hosts their account.\n\nOAuth solves a real problem: you want to let a third-party app (say, a calendar scheduler) read your Google Calendar without giving it your Google password. If the app is compromised, your Google password remains safe and you can revoke access at any time.",
      },
      {
        type: "analogy",
        heading: "Hotel Concierge Analogy",
        content:
          "You are at a hotel with valet parking. Instead of giving the valet your car keys (full access — they could take your car anywhere), the hotel gives you a valet key (limited access token). The valet key can only start the car and open the driver door — it cannot open the trunk or glove compartment.\n\nOAuth works similarly: instead of your password (full account access), you issue a scoped access token (can read calendar but not send emails). You control what each token can do and can revoke it without changing your password.",
      },
      {
        type: "steps",
        heading: "OAuth 2.0 Authorization Code Flow",
        steps: [
          {
            title: "User initiates login",
            detail:
              'User clicks "Continue with Google". Your app redirects to Google\'s auth server with: client_id, redirect_uri, scope, state (CSRF token), response_type=code.',
          },
          {
            title: "User authenticates and consents",
            detail:
              "Google shows login and consent screen. User authenticates with Google and grants requested permissions (scopes).",
          },
          {
            title: "Authorization code returned",
            detail:
              "Google redirects back to your redirect_uri with an authorization code (short-lived, one-time use) and the state parameter.",
          },
          {
            title: "Server exchanges code for tokens",
            detail:
              "Your backend exchanges the code for tokens via POST to Google's token endpoint with: code, client_id, client_secret, redirect_uri.",
          },
          {
            title: "Access token received",
            detail:
              "Google returns access_token, refresh_token, expiry, and granted scopes. Your app stores refresh token securely server-side.",
          },
          {
            title: "API calls with access token",
            detail:
              "Your app calls Google APIs with Authorization: Bearer {access_token}. When expired, use refresh token to get a new access token silently.",
          },
        ],
      },
      {
        type: "code",
        heading: "OAuth 2.0 Implementation with NextAuth/Passport",
        language: "typescript",
        label: "oauth.ts",
        code: `import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: 'https://app.example.com/auth/google/callback',
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly'],
},
async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user
    let user = await db.users.findByGoogleId(profile.id);
    
    if (!user) {
      user = await db.users.create({
        googleId: profile.id,
        email: profile.emails?.[0].value,
        name: profile.displayName,
        avatar: profile.photos?.[0].value,
      });
    }
    
    // Store tokens securely server-side
    await db.oauthTokens.upsert({
      userId: user.id,
      provider: 'google',
      accessToken: encrypt(accessToken),
      refreshToken: refreshToken ? encrypt(refreshToken) : undefined,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    });
    
    done(null, user);
  } catch (err) {
    done(err as Error);
  }
}));

// Routes
app.get('/auth/google', passport.authenticate('google'));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/dashboard')
);`,
      },
      {
        type: "comparison",
        heading: "OAuth 2.0 Grant Types",
        headers: ["Grant Type", "Use Case", "Security Level"],
        rows: [
          {
            aspect: "Authorization Code",
            "Grant Type": "Authorization Code + PKCE",
            "Use Case": "Web apps, mobile apps (standard)",
            "Security Level": "Highest — code exchanged server-side",
          },
          {
            aspect: "Client Credentials",
            "Grant Type": "Client Credentials",
            "Use Case": "Machine-to-machine (no user)",
            "Security Level": "High — no user involved",
          },
          {
            aspect: "Device Code",
            "Grant Type": "Device Authorization",
            "Use Case": "Smart TVs, CLIs, constrained devices",
            "Security Level": "High — uses polling",
          },
          {
            aspect: "Implicit",
            "Grant Type": "Implicit (deprecated)",
            "Use Case": "Old SPAs — DO NOT USE",
            "Security Level": "Low — token in URL fragment",
          },
          {
            aspect: "Password",
            "Grant Type": "Resource Owner Password (deprecated)",
            "Use Case": "DO NOT USE — defeats purpose of OAuth",
            "Security Level": "None — defeats OAuth purpose",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Always Use PKCE for Public Clients",
        content:
          "PKCE (Proof Key for Code Exchange) prevents authorization code interception attacks in mobile apps and SPAs. Generate a random code_verifier, hash it (code_challenge), send the hash with the auth request, and the verifier with the token exchange. Without PKCE, intercepted auth codes can be exchanged by attackers.",
      },
    ],
    quiz: [
      {
        question: "What problem does OAuth 2.0 primarily solve?",
        options: [
          "Encrypting passwords in transit",
          "Delegated authorization — granting third-party access without sharing credentials",
          "Preventing SQL injection attacks",
          "Managing API rate limits",
        ],
        correctIndex: 1,
        explanation:
          "OAuth 2.0 enables users to grant third-party apps limited access to their accounts without sharing passwords. The user authenticates with the identity provider (Google, GitHub), grants specific scopes, and the third-party receives a scoped access token — not the password.",
      },
    ],
  },

  cors: {
    slug: "cors",
    title: "CORS",
    tagline:
      "Browser security protecting users from unauthorized cross-origin requests",
    sections: [
      {
        type: "text",
        heading: "What is CORS?",
        content:
          "CORS (Cross-Origin Resource Sharing) is a browser security mechanism that restricts how web pages can request resources from a different origin (domain, port, or protocol) than the one that served the page.\n\nWithout CORS, malicious websites could silently make authenticated API requests using visitor's cookies — stealing data or performing actions on their behalf. CORS prevents this by requiring servers to explicitly permit cross-origin access.",
      },
      {
        type: "text",
        heading: "Same-Origin Policy",
        content:
          "Browsers enforce the **Same-Origin Policy** by default: a web page can only make requests to the same origin (scheme + host + port) that served it.\n\n- `https://app.com` → `https://app.com/api` — Allowed (same origin)\n- `https://app.com` → `https://api.app.com/data` — Blocked (different subdomain)\n- `https://app.com` → `http://app.com/api` — Blocked (different protocol)\n- `https://app.com` → `https://app.com:8080/api` — Blocked (different port)\n\nCORS is the mechanism that allows servers to relax this restriction selectively.",
      },
      {
        type: "code",
        heading: "CORS Configuration in Express",
        language: "typescript",
        label: "cors-config.ts",
        code: `import cors from 'cors';

// Simple: allow specific origins
app.use(cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,     // Allow cookies and auth headers
  maxAge: 86400,         // Cache preflight for 24 hours
}));

// Dynamic origin validation
app.use(cors({
  origin: (origin, callback) => {
    const allowed = process.env.ALLOWED_ORIGINS?.split(',') ?? [];
    
    // Allow requests with no origin (server-to-server, Postman)
    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(\`Origin \${origin} not allowed by CORS\`));
  },
  credentials: true,
}));

// For maximum security in production:
// 1. Never use origin: '*' with credentials: true
// 2. Explicitly list every allowed origin
// 3. Only allow methods and headers actually needed
// 4. Use maxAge to reduce preflight request overhead`,
      },
      {
        type: "text",
        heading: "Preflight Requests",
        content:
          'For "complex" requests (non-simple methods, custom headers, or sending JSON), the browser sends a preliminary **OPTIONS preflight request** to ask: "Is this cross-origin request allowed?"\n\nThe server responds with CORS headers indicating what is permitted. Only if the preflight succeeds does the browser send the actual request.\n\nSimple requests (GET with no custom headers, some POSTs) skip the preflight. Everything else triggers it.',
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: 'Never Use origin: "*" with credentials: true',
        content:
          "Combining a wildcard CORS origin (*) with credentials: true is a security vulnerability. Browsers block this combination for good reason — it would allow any website to make authenticated API calls using visitor cookies. Always specify exact allowed origins when credentials are involved.",
      },
    ],
    quiz: [
      {
        question: "CORS is enforced by:",
        options: [
          "The server blocking unauthorized requests",
          "The browser blocking unauthorized cross-origin responses",
          "The network firewall intercepting cross-origin traffic",
          "DNS servers filtering cross-origin domains",
        ],
        correctIndex: 1,
        explanation:
          "CORS is enforced by the browser. The server sends CORS headers indicating what is allowed. The browser checks these headers and blocks JavaScript from accessing the response if the origin is not permitted. Server-to-server calls bypass CORS entirely since there is no browser enforcing it.",
      },
    ],
  },

  csrf: {
    slug: "csrf",
    title: "CSRF & XSS",
    tagline: "The two most common web attack vectors and how to stop them",
    sections: [
      {
        type: "text",
        heading: "Cross-Site Request Forgery (CSRF)",
        content:
          'CSRF tricks an authenticated user into unknowingly performing an action on a web application they are currently logged into. The attacker crafts a request to the target site and tricks the victim\'s browser into sending it — with the victim\'s cookies automatically included.\n\nExample: User is logged into bank.com. They visit evil.com which contains a hidden form: `<form action="https://bank.com/transfer" method="POST"><input name="amount" value="1000"><input name="to" value="attacker">`. JavaScript auto-submits it. Bank.com receives the request with the user\'s valid session cookie and processes the transfer.',
      },
      {
        type: "code",
        heading: "CSRF Protection",
        language: "typescript",
        label: "csrf-protection.ts",
        code: `import csrf from 'csrf';
const tokens = new csrf();

// Server-side CSRF token generation
app.get('/api/csrf-token', (req, res) => {
  const secret = req.session.csrfSecret || tokens.secretSync();
  req.session.csrfSecret = secret;
  
  const token = tokens.create(secret);
  res.json({ csrfToken: token });
});

// Middleware to validate CSRF on state-changing requests
function verifyCsrf(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  
  const token = req.headers['x-csrf-token'] as string
    || req.body._csrf;
  
  if (!tokens.verify(req.session.csrfSecret, token)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next();
}

// Modern alternative: SameSite cookies + CORS prevent most CSRF
// No need for CSRF tokens if:
// - Cookies use SameSite=Strict or SameSite=Lax
// - API uses JWT in Authorization header (not cookies)
// - CORS is properly configured to allowed origins only

// Client sends CSRF token in header:
// fetch('/api/transfer', {
//   method: 'POST',
//   headers: { 'X-CSRF-Token': csrfToken, 'Content-Type': 'application/json' },
//   body: JSON.stringify({ amount: 100, to: 'friend@example.com' })
// });`,
      },
      {
        type: "text",
        heading: "Cross-Site Scripting (XSS)",
        content:
          "XSS attacks inject malicious scripts into web pages viewed by other users. If successful, the attacker's script runs in the victim's browser with full access to cookies, localStorage, the DOM, and the ability to make authenticated API calls.\n\nThree types:\n\n**Stored XSS** — Malicious script saved in database (e.g., comment field), served to all users who view it.\n\n**Reflected XSS** — Malicious script in URL parameter, reflected in the response (e.g., search results).\n\n**DOM-based XSS** — Malicious script in fragment/hash, processed by client-side JavaScript.",
      },
      {
        type: "code",
        heading: "XSS Prevention",
        language: "typescript",
        label: "xss-prevention.ts",
        code: `import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import helmet from 'helmet';

// 1. Content Security Policy — restrict what scripts can execute
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'nonce-RANDOM_NONCE'"], // Only scripts with nonce
    styleSrc: ["'self'", "'unsafe-inline'"],        // Or use nonces for styles too
    imgSrc: ["'self'", 'data:', 'https://cdn.example.com'],
    connectSrc: ["'self'", 'https://api.example.com'],
    objectSrc: ["'none'"],    // Block plugins
    upgradeInsecureRequests: [],
  }
}));

// 2. Sanitize user-generated HTML before storing/rendering
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

function sanitizeHtml(html: string): string {
  return purify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'li'],
    ALLOWED_ATTR: ['href'],
    FORCE_HTTPS: true, // Convert http links to https
  });
}

// 3. Escape user input before interpolating into HTML
// In React/Vue/modern frameworks — this is done automatically
// Never use innerHTML with user data — use textContent or framework's data binding

// 4. HttpOnly cookies — XSS cannot steal session tokens
// (Already covered in cookies/sessions chapter)

// Example: Sanitize before storing
app.post('/comments', async (req, res) => {
  const cleanContent = sanitizeHtml(req.body.content);
  const comment = await db.comments.create({ content: cleanContent });
  res.status(201).json({ data: comment });
});`,
      },
      {
        type: "checklist",
        heading: "Security Checklist",
        items: [
          "Use SameSite=Strict or Lax cookies to prevent most CSRF attacks",
          "Set Content-Security-Policy headers to restrict script execution",
          "Always sanitize user-generated HTML with a library like DOMPurify",
          "Never use innerHTML with untrusted user content",
          "Use framework data-binding (React, Vue) which auto-escapes output",
          "Set HttpOnly on authentication cookies to prevent XSS token theft",
          "Validate and reject unexpected characters in input where possible",
          "For APIs using JWT in Authorization headers: CSRF is not applicable",
        ],
      },
    ],
    quiz: [
      {
        question: "CSRF attacks succeed because:",
        options: [
          "The server is not properly validating input",
          "Browsers automatically include cookies with cross-origin requests",
          "HTTPS is not being used",
          "Passwords are stored in plain text",
        ],
        correctIndex: 1,
        explanation:
          "CSRF exploits the fact that browsers automatically attach cookies (including session cookies) to cross-origin requests. The attacker crafts a request to the target site and tricks the victim's browser into sending it — the browser adds the auth cookie and the server sees a legitimate authenticated request.",
      },
    ],
  },

  hashing: {
    slug: "hashing",
    title: "Password Hashing",
    tagline:
      "Storing passwords safely with bcrypt and argon2 — one-way functions that protect users",
    sections: [
      {
        type: "text",
        heading: "Why Plain Text Passwords Are Catastrophic",
        content:
          'If your database is breached and passwords are stored in plain text (or even simple MD5/SHA1), every user\'s account across every service they use is compromised. People reuse passwords — a breach of your service becomes a breach of their bank.\n\nPassword hashing converts a password into an irreversible fixed-length string using a one-way function. The hash can be verified (does "password" match "hash"?) but cannot be reversed. If your database leaks, hashes alone are useless to attackers — brute-forcing modern bcrypt hashes is computationally infeasible.',
      },
      {
        type: "text",
        heading: "Why bcrypt and Argon2 Instead of SHA-256",
        content:
          "SHA-256 is a fast hash — designed for speed. A modern GPU can compute billions of SHA-256 hashes per second, making brute-force attacks fast.\n\n**bcrypt** and **argon2** are intentionally slow adaptive hash functions:\n\n- They include a **work factor/cost** that makes hashing intentionally expensive\n- The cost can be increased as hardware gets faster (future-proof)\n- They include a **salt** (random bytes) preventing rainbow table attacks\n- bcrypt: 100ms per hash at cost 12 means 10 hashes/second per core — brute force of 8+ char passwords is infeasible",
      },
      {
        type: "code",
        heading: "Secure Password Hashing Implementation",
        language: "typescript",
        label: "password-hashing.ts",
        code: `import bcrypt from 'bcrypt';
import argon2 from 'argon2';

const BCRYPT_ROUNDS = 12; // ~100-300ms per hash on modern hardware

// ── BCRYPT (widely used, proven) ──────────────────────────────
// Hash during registration
export async function hashPasswordBcrypt(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
  // Output: "$2b$12$[22 chars salt][31 chars hash]"
}

// Verify during login
export async function verifyPasswordBcrypt(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ── ARGON2 (more modern, OWASP recommended) ───────────────────
export async function hashPasswordArgon2(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,     // Hybrid — best for passwords
    memoryCost: 65536,         // 64MB memory requirement
    timeCost: 3,               // 3 iterations
    parallelism: 4,            // 4 parallel threads
  });
}

export async function verifyPasswordArgon2(
  plain: string,
  hash: string
): Promise<boolean> {
  return argon2.verify(hash, plain);
}

// ── Registration flow ─────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;
  
  // Enforce password policy before hashing
  if (password.length < 12) {
    return res.status(422).json({ error: 'Password must be at least 12 characters' });
  }
  
  // Check for compromised passwords (HaveIBeenPwned API k-anonymity)
  const isBreached = await checkHibp(password);
  if (isBreached) {
    return res.status(422).json({ error: 'This password has been compromised in a data breach. Please choose a different password.' });
  }
  
  const passwordHash = await hashPasswordArgon2(password);
  const user = await db.users.create({ email, passwordHash });
  
  // Never return the hash
  res.status(201).json({ data: { id: user.id, email: user.email } });
});

// ── Login flow with timing-safe comparison ────────────────────
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.users.findByEmail(email);
  
  // Always hash even if user not found (prevent timing attacks)
  const hash = user?.passwordHash ?? '$argon2id$v=19$m=65536,t=3,p=4$dummy';
  const valid = await verifyPasswordArgon2(password, hash);
  
  if (!user || !valid) {
    // Same error either way (don't leak whether email exists)
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Check if hash needs re-hashing with updated parameters
  if (argon2.needsRehash(user.passwordHash)) {
    const newHash = await hashPasswordArgon2(password);
    await db.users.update(user.id, { passwordHash: newHash });
  }
  
  // Issue token...
});`,
      },
      {
        type: "comparison",
        heading: "Hashing Algorithms Compared",
        headers: ["Algorithm", "Speed", "Memory Hard", "GPU Resistant", "Use"],
        rows: [
          {
            aspect: "MD5",
            Algorithm: "MD5",
            Speed: "Billions/sec",
            "Memory Hard": "No",
            "GPU Resistant": "No",
            Use: "Never for passwords",
          },
          {
            aspect: "SHA-256",
            Algorithm: "SHA-256",
            Speed: "Billions/sec",
            "Memory Hard": "No",
            "GPU Resistant": "No",
            Use: "Data integrity, HMAC — not passwords",
          },
          {
            aspect: "bcrypt",
            Algorithm: "bcrypt",
            Speed: "Configurable",
            "Memory Hard": "No",
            "GPU Resistant": "Somewhat",
            Use: "Passwords — widely trusted",
          },
          {
            aspect: "Argon2id",
            Algorithm: "Argon2id",
            Speed: "Configurable",
            "Memory Hard": "Yes",
            "GPU Resistant": "Yes",
            Use: "Passwords — OWASP recommended",
          },
          {
            aspect: "scrypt",
            Algorithm: "scrypt",
            Speed: "Configurable",
            "Memory Hard": "Yes",
            "GPU Resistant": "Yes",
            Use: "Passwords — good alternative",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Never Do These",
        content:
          "Never store plain text passwords. Never use MD5 or SHA-1/SHA-256 alone for passwords. Never use the same salt for all passwords (use per-user random salts — bcrypt/argon2 handle this automatically). Never encrypt passwords (encryption is reversible; hashing is not). Never build your own crypto — use a battle-tested library.",
      },
    ],
    quiz: [
      {
        question: "Why is bcrypt better than SHA-256 for password hashing?",
        options: [
          "bcrypt is more secure mathematically",
          "bcrypt is intentionally slow, making brute-force attacks computationally infeasible",
          "bcrypt produces longer hashes",
          "SHA-256 does not support Unicode passwords",
        ],
        correctIndex: 1,
        explanation:
          "SHA-256 is designed to be fast — GPUs can compute billions per second, making brute force trivial. bcrypt and argon2 are deliberately slow with configurable cost factors. At cost 12, bcrypt takes ~100ms per hash. Brute-forcing an 8+ character password space at 10 hashes/second takes longer than the age of the universe.",
      },
    ],
  },
};

import TOPIC_CONTENT_PART2 from "./topicContent2";
import TOPIC_CONTENT_PART3 from "./topicContent3";
import { TOPIC_CONTENT_PART4 } from "./topicContent4";
import { TOPIC_CONTENT_PART6 } from "./topicContent6";
import { TOPIC_CONTENT_PART8 } from "./topicContent8";
import { TOPIC_CONTENT_PART9 } from "./topicContent9";
import { TOPIC_CONTENT_PART10 } from "./topicContent10";
import { TOPIC_CONTENT_GAPS_DATA } from "./topicContentGapsData";
import { TOPIC_CONTENT_GAPS_OBS } from "./topicContentGapsObs";
import { TOPIC_CONTENT_GAPS_SEC_ID } from "./topicContentGapsSecId";
import { TOPIC_CONTENT_GAPS_SEC_APP } from "./topicContentGapsSecApp";
import { TOPIC_CONTENT_GAPS_DIST } from "./topicContentGapsDist";
import { TOPIC_CONTENT_GAPS_STREAM } from "./topicContentGapsStream";
import { TOPIC_CONTENT_GAPS_RT } from "./topicContentGapsRt";
import { TOPIC_CONTENT_GAPS_API } from "./topicContentGapsApi";
import { TOPIC_CONTENT_GAPS_RUNTIME } from "./topicContentGapsRuntime";
import { TOPIC_CONTENT_GAPS_PLATFORM } from "./topicContentGapsPlatform";
import { TOPIC_CONTENT_GAPS_SYS_A } from "./topicContentGapsSysA";
import { TOPIC_CONTENT_GAPS_SYS_B1 } from "./topicContentGapsSysB1";
import { TOPIC_CONTENT_GAPS_SYS_B2 } from "./topicContentGapsSysB2";

const ALL_TOPIC_CONTENT: Record<string, TopicContent> = {
  ...TOPIC_CONTENT,
  ...TOPIC_CONTENT_PART2,
  ...TOPIC_CONTENT_PART3,
  ...TOPIC_CONTENT_PART4,
  ...TOPIC_CONTENT_PART6,
  ...TOPIC_CONTENT_PART8,
  ...TOPIC_CONTENT_PART9,
  ...TOPIC_CONTENT_PART10,
  ...TOPIC_CONTENT_GAPS_DATA,
  ...TOPIC_CONTENT_GAPS_OBS,
  ...TOPIC_CONTENT_GAPS_SEC_ID,
  ...TOPIC_CONTENT_GAPS_SEC_APP,
  ...TOPIC_CONTENT_GAPS_DIST,
  ...TOPIC_CONTENT_GAPS_STREAM,
  ...TOPIC_CONTENT_GAPS_RT,
  ...TOPIC_CONTENT_GAPS_API,
  ...TOPIC_CONTENT_GAPS_RUNTIME,
  ...TOPIC_CONTENT_GAPS_PLATFORM,
  ...TOPIC_CONTENT_GAPS_SYS_A,
  ...TOPIC_CONTENT_GAPS_SYS_B1,
  ...TOPIC_CONTENT_GAPS_SYS_B2,
};

export function getTopicContent(slug: string): TopicContent | null {
  return ALL_TOPIC_CONTENT[slug] || null;
}

