'use client';

import { useState } from 'react';
import Link from 'next/link';
import Quiz from '@/components/content/Quiz';
import { ChevronRight, ArrowLeft, FlaskConical, BookOpen } from 'lucide-react';

const ALL_QUESTIONS = [
  { question: 'Which HTTP method is idempotent — calling it multiple times produces the same result as calling it once?', options: ['POST — creates new resources each call', 'PUT — replaces a resource, same body = same result', 'PATCH — partial update depends on order', 'None of the above are idempotent'], correctIndex: 1, explanation: 'PUT is idempotent because sending PUT /users/1 with the same body 10 times results in the same final state. POST is not idempotent — calling it 10 times creates 10 records.', category: 'Foundations', topic: 'HTTP' },
  { question: 'A request returns status 401. What does this specifically mean?', options: ['Resource not found', 'Server crashed internally', 'Not authenticated — credentials missing or invalid', 'Authenticated but lacking permission'], correctIndex: 2, explanation: '401 = Unauthenticated (missing or invalid credentials). 403 = Unauthorized (valid credentials, insufficient permissions). The distinction matters for security — 401 means log in first, 403 means you are logged in but not allowed.', category: 'Foundations', topic: 'HTTP' },
  { question: 'What does the stateless nature of HTTP mean in practice?', options: ['HTTP is inherently slow', 'Each request is completely independent — the server has no memory of previous requests', 'HTTP cannot maintain database consistency', 'HTTP only supports GET requests'], correctIndex: 1, explanation: 'HTTP statelessness means every request carries all context it needs. This is why cookies, sessions, and JWTs were invented — they add a state layer on top of a fundamentally stateless protocol.', category: 'Foundations', topic: 'HTTP' },
  { question: 'In Node.js, what happens to all other concurrent requests when fs.readFileSync() is called in a request handler?', options: ['Nothing — Node parallelizes I/O automatically', 'They queue up and process after the sync read completes', 'Node throws a runtime error preventing sync I/O', 'Other requests receive 503 errors'], correctIndex: 1, explanation: 'Synchronous I/O blocks the single-threaded event loop entirely. While the file reads (potentially seconds for large files), zero other requests are processed. This is catastrophic in production with concurrent users.', category: 'Node.js', topic: 'Event Loop' },
  { question: 'Which queue is always drained completely before macrotasks run?', options: ['The setTimeout callback queue', 'The setInterval queue', 'The microtask queue — Promises and queueMicrotask', 'The I/O event queue'], correctIndex: 2, explanation: 'Microtasks (Promise .then, async/await continuations, queueMicrotask) always drain completely before any macrotask (setTimeout, setInterval, I/O callbacks) executes. This is a firm event loop rule.', category: 'Node.js', topic: 'Event Loop' },
  { question: 'What does ACID stand for in database transactions?', options: ['Async, Cached, Indexed, Durable', 'Atomicity, Consistency, Isolation, Durability', 'Archived, Compressed, Integrated, Distributed', 'Available, Concurrent, Idempotent, Durable'], correctIndex: 1, explanation: 'ACID properties guarantee database reliability: Atomicity (all-or-nothing), Consistency (valid state always), Isolation (concurrent transactions do not interfere), Durability (committed data survives crashes). PostgreSQL is fully ACID compliant.', category: 'Databases', topic: 'ACID' },
  { question: 'A SELECT on a 10M-row table where email = x takes 5 seconds. What is almost certainly the problem?', options: ['The database server lacks RAM', 'No index on email — the database scans all 10M rows sequentially', 'The SQL syntax is incorrect', 'Network latency to the database'], correctIndex: 1, explanation: 'Without an index, the database performs a Sequential Scan across all 10M rows — O(n) complexity. Adding CREATE INDEX ON users(email) converts this to an O(log n) B-tree lookup, dropping execution time from 5000ms to under 1ms.', category: 'Databases', topic: 'Indexing' },
  { question: 'What is database sharding?', options: ['Encrypting data at rest with a shard key', 'Horizontal partitioning — splitting rows across multiple database instances', 'Creating automated database backups', 'Indexing all columns for query performance'], correctIndex: 1, explanation: 'Sharding horizontally splits data so e.g. user IDs 1-1M go to shard 1, 1M-2M to shard 2. Each shard is an independent database server. This allows storage and throughput to scale beyond single-machine limits at the cost of cross-shard query complexity.', category: 'Databases', topic: 'Replication' },
  { question: 'Why should JWTs never be stored in localStorage?', options: ['localStorage is too slow for JWT operations', 'localStorage has size limits that JWT exceeds', 'Any JavaScript on the page can read localStorage — XSS attacks steal JWTs', 'localStorage does not persist across browser sessions'], correctIndex: 2, explanation: 'XSS attacks inject malicious JavaScript that runs in your page context and can call localStorage.getItem(). Stolen JWTs give full account access. HttpOnly cookies are immune to JS access — the browser sends them automatically but scripts cannot read them.', category: 'Auth', topic: 'JWT' },
  { question: 'What is the main advantage of microservices over a monolith for large organizations?', options: ['Microservices are always significantly faster', 'Microservices require less total code', 'Independent deployment and scaling of individual services without affecting others', 'Microservices are inherently easier to debug'], correctIndex: 2, explanation: 'The core microservices benefit at org scale: deploy the Payment Service without touching User Service, scale only the Video Encoding service during peak load, isolate failures so a bug in Recommendations does not crash Checkout. The cost is significant operational complexity.', category: 'Architecture', topic: 'Microservices' },
  { question: 'A cache has a 30% hit rate. What does this mean and is it good?', options: ['70% of requests served instantly — that is good', '30% of requests find data in cache, 70% still query the database — generally poor', 'The cache is 30% full by capacity', '30% of data in cache is stale'], correctIndex: 1, explanation: 'Hit rate = percentage of requests served from cache. 30% means 70% of your traffic still hammers the database — the cache provides minimal benefit. For read-heavy workloads target 90%+. Low hit rate indicates wrong TTL, poor key design, or cache capacity issues.', category: 'Scaling', topic: 'Caching' },
  { question: 'What problem does a message queue like Kafka or RabbitMQ primarily solve?', options: ['It accelerates SQL queries dramatically', 'It decouples services — producers publish without waiting for consumers to process', 'It replaces the database for persistent storage', 'It handles HTTP routing between microservices'], correctIndex: 1, explanation: 'Message queues enable async, decoupled communication. The order service publishes order.placed and continues instantly — it does not wait. Email, inventory, and analytics services consume independently at their own pace. Also provides retry logic, guaranteed delivery, and traffic spike buffering.', category: 'Scaling', topic: 'Queues' },
  { question: 'What is the key difference between a Docker container and a Virtual Machine?', options: ['Containers are slower but more isolated', 'VMs share the host kernel; containers run a full OS', 'Containers share the host kernel; VMs run a full OS with their own kernel', 'They are functionally identical'], correctIndex: 2, explanation: 'Containers are isolated processes sharing the host OS kernel — lightweight (MBs, millisecond startup). VMs virtualize hardware and boot a complete OS — heavy (GBs, minute startup). Containers are preferred for microservices because you can run hundreds per host instead of dozens of VMs.', category: 'DevOps', topic: 'Docker' },
  { question: 'In the CAP theorem, what must every distributed system sacrifice during a network partition?', options: ['It must sacrifice availability', 'It must sacrifice consistency', 'It must sacrifice either consistency or availability — partition tolerance is mandatory', 'CAP does not apply to modern distributed systems'], correctIndex: 2, explanation: 'Partition tolerance (P) is not optional — network splits happen in real distributed systems. So you choose: stay Consistent (reject writes, return errors) like traditional databases, or stay Available (accept writes, risk stale reads) like Cassandra or DynamoDB. CP vs AP is the real choice.', category: 'Databases', topic: 'CAP Theorem' },
  { question: 'What does CORS protect against?', options: ['SQL injection attacks from the client', 'DDoS attacks overwhelming the server', 'Malicious websites making authenticated API requests on behalf of logged-in users', 'Man-in-the-middle attacks on HTTPS connections'], correctIndex: 2, explanation: 'Without CORS, evil.com could fetch bank.com/api/transfer using your browser session cookies. CORS headers tell the browser which origins are allowed to make cross-origin requests, blocking unauthorized cross-site API calls. It is enforced by the browser, not the server.', category: 'Auth', topic: 'CORS' },
  { question: 'Which statement correctly describes the idempotency difference between PUT and PATCH?', options: ['Both are always idempotent, so retrying either is always safe', 'PATCH is idempotent but PUT is not', 'PUT is idempotent; PATCH is not guaranteed to be idempotent', 'Neither is idempotent, so retries must always be avoided'], correctIndex: 2, explanation: 'PUT replaces the whole resource, so repeating the same request yields the same end state — idempotent. PATCH performs a partial edit that may be relative, for example "increment the balance by 10", so replaying it can change the result. The HTTP spec makes no idempotency guarantee for PATCH even though some patches happen to be safe to repeat.', category: 'API Design', topic: 'Idempotency' },
  { question: 'An API returns 409 Conflict. What does this status most accurately describe?', options: ['The request body was well-formed but failed field validation', 'The request conflicts with the current state of the resource, such as a duplicate email', 'The client exceeded its allowed request rate', 'The server is temporarily overloaded and unavailable'], correctIndex: 1, explanation: '409 Conflict means the request clashes with the current state of the resource, for example registering an email that already exists. 422 Unprocessable Entity is for semantically invalid data, 429 Too Many Requests is rate limiting, and 503 Service Unavailable signals temporary overload. Choosing 409 tells the client the issue is a state conflict rather than a malformed request.', category: 'API Design', topic: 'HTTP Status Codes' },
  { question: 'Why is cursor-based pagination generally preferred over offset pagination for large, frequently changing datasets?', options: ['Cursors point at a stable position in the result set, so inserts or deletes do not cause rows to be skipped or duplicated', 'Cursors allow jumping directly to any page number', 'Offset pagination cannot be combined with a LIMIT clause', 'Cursors require no index while offsets do'], correctIndex: 0, explanation: 'Offset pagination uses LIMIT/OFFSET, so when rows are inserted or deleted the offset shifts and users see skipped or repeated records; it also scans and discards OFFSET rows, which is slow at high offsets. A cursor encodes a stable position such as the last seen id or timestamp, giving consistent results and fast seeks on an indexed column.', category: 'API Design', topic: 'Pagination' },
  { question: 'A client sends If-None-Match with a stored ETag and the resource is unchanged. What should the server return?', options: ['200 OK with the full resource body', '201 Created', '409 Conflict', '304 Not Modified with an empty body'], correctIndex: 3, explanation: 'Conditional requests let a client ask "has this changed since my copy?". If the current ETag matches the sent If-None-Match, the server replies 304 Not Modified with no body, saving bandwidth and letting the client reuse its cached copy. A mismatch would return 200 OK with the fresh representation.', category: 'API Design', topic: 'Conditional Requests' },
  { question: 'A client retries a POST /payments call after a timeout. What is the purpose of an idempotency key?', options: ['It lets the server detect the retry and return the original result instead of charging twice', 'It encrypts the payment payload end to end', 'It converts the POST into a GET for caching', 'It guarantees the request reaches the server exactly once over the network'], correctIndex: 0, explanation: 'The client generates a unique idempotency key per logical operation and sends it as a header. The server stores the key with the result of the first attempt, so a retry with the same key returns the stored result rather than repeating the side effect. It cannot prevent duplicate transmission over the network — it prevents duplicate processing on the server.', category: 'API Design', topic: 'Idempotency' },
  { question: 'What behaviour distinguishes a token bucket rate limiter from a fixed window counter?', options: ['The token bucket can only run on a single server', 'The token bucket allows short bursts up to the bucket size while enforcing a steady average rate', 'The token bucket resets its count at every clock boundary', 'The token bucket rejects every request once the limit is hit for a full minute'], correctIndex: 1, explanation: 'A token bucket refills at a constant rate and lets a client spend accumulated tokens as a burst, smoothing the long-run average. A fixed window counter resets at clock edges and suffers from bursty double-spend around the boundary. A sliding window approximates a moving window to reduce that edge effect.', category: 'Scaling', topic: 'Rate Limiting' },
  { question: 'Why is consistent hashing preferred over simple modulo hashing when caching across a dynamic set of nodes?', options: ['It guarantees perfectly even key distribution with zero collisions', 'It removes the need for any replication', 'Adding or removing a node remaps only a small fraction of keys instead of nearly all of them', 'It stores every key on every node for redundancy'], correctIndex: 2, explanation: 'With modulo hashing such as key % N, changing the number of nodes N remaps almost every key, blowing away the cache and causing a stampede on the origin. Consistent hashing places nodes and keys on a ring so only the keys adjacent to a changed node move, roughly 1/N of keys, keeping most of the cache warm.', category: 'Scaling', topic: 'Consistent Hashing' },
  { question: 'In a replicated store with N replicas, a quorum is set so that R + W > N. What does this ensure?', options: ['The read set and write set must overlap, so a read sees the most recent acknowledged write', 'Every write blocks until all N replicas acknowledge it', 'The system stays strongly consistent even during a network partition', 'Reads always take the fastest replica regardless of freshness'], correctIndex: 0, explanation: 'If the number of replicas written (W) plus the number read (R) exceeds N, the two sets must intersect, so at least one replica returns the latest value. This gives quorum-consistent reads but not full linearizability, and under a partition you must still trade availability against consistency.', category: 'System Design', topic: 'Quorum' },
  { question: 'When is optimistic concurrency control a better choice than pessimistic locking?', options: ['When write conflicts are frequent and contention is high', 'When conflicts are rare and you want to avoid holding database locks during user think-time', 'When you must guarantee that no transaction ever retries', 'Only when the application runs on a single thread'], correctIndex: 1, explanation: 'Optimistic control reads a version number and checks it is unchanged at write time using a compare-and-set, retrying on conflict — ideal when conflicts are rare because no locks are held. Pessimistic locking with SELECT ... FOR UPDATE holds locks for the whole transaction and is better under heavy contention, where frequent optimistic retries would waste work.', category: 'Databases', topic: 'Locking' },
  { question: 'A user saves their profile, reloads, and immediately sees the old data. Writes go to a primary and reads to a read replica. What is the most likely cause?', options: ['The write silently failed', 'The replica runs a different database version', 'Replication lag — the write reached the primary but has not yet propagated to the replica serving the read', 'The application cached the response forever'], correctIndex: 2, explanation: 'With asynchronous replication, replicas trail the primary by some lag, so an immediate read from a replica can return stale data. Common fixes are read-your-writes, routing a user briefly back to the primary after a write, monotonic reads, or synchronous replication at the cost of added write latency.', category: 'Databases', topic: 'Replication Lag' },
  { question: 'An endpoint loads 100 orders, then runs 100 extra queries, one per order, to fetch each customer. What is this called and how is it resolved?', options: ['A deadlock — resolved by adding retry logic', 'A full table scan — resolved by adding an index', 'A phantom read — resolved by raising the isolation level', 'The N+1 query problem — resolved with a JOIN or a batched IN query'], correctIndex: 3, explanation: 'The N+1 problem issues one query per parent row, so latency grows linearly with result size. It is fixed by fetching related rows in a single JOIN, a batched WHERE id IN (...) query, or an ORM eager-loading or join feature. It is one of the most common and most easily missed performance bugs.', category: 'Databases', topic: 'N+1 Queries' },
  { question: 'Why does a backend use a database connection pool instead of opening a new connection per request?', options: ['Opening a connection involves handshakes and authentication, so the pool reuses warm connections to cut that overhead', 'A pool automatically encrypts query results', 'A pool forces every query into one long transaction', 'A pool removes the need for indexes'], correctIndex: 0, explanation: 'Establishing a database connection costs a TCP handshake, possibly TLS, and authentication. A pool keeps a set of connections open and lends them out, removing that cost per request. Sizing matters: too many connections can exhaust the database, and too few cause request queueing.', category: 'Databases', topic: 'Connection Pooling' },
  { question: 'A hot cache key expires and thousands of concurrent requests miss at once and all hit the database. What is this called?', options: ['Cache pollution', 'Cache coherence', 'A cache stampede, also called a thundering herd', 'Write-through caching'], correctIndex: 2, explanation: 'A cache stampede happens when many requests miss the same key simultaneously and all recompute it, overwhelming the origin. Mitigations include a mutex so only one worker recomputes while others wait or serve stale data, probabilistic early refresh, or background recomputation before expiry.', category: 'Scaling', topic: 'Cache Stampede' },
  { question: 'What is the essential difference between LRU and LFU cache eviction?', options: ['LRU evicts the most recently used item; LFU evicts the most frequent item', 'LRU evicts the least recently used item; LFU evicts the least frequently used item', 'LRU is only for databases and LFU only for CDNs', 'They behave identically in every workload'], correctIndex: 1, explanation: 'LRU, Least Recently Used, discards whatever has gone untouched longest, betting that recency predicts reuse. LFU, Least Frequently Used, discards the item with the fewest accesses, favouring steadily popular entries but risking retention of items that were hot once and are now stale. Neither policy wins universally.', category: 'Scaling', topic: 'Cache Eviction' },
  { question: 'In Kafka, how does a consumer group process a topic in parallel while ensuring each message is handled once per group?', options: ['Every consumer in the group receives a copy of every message', 'Consumers broadcast messages and deduplicate by offset', 'Consumers coordinate by locking the whole topic', 'Each partition is assigned to exactly one consumer in the group, and consumers commit offsets to track progress'], correctIndex: 3, explanation: 'Within a consumer group, each partition is consumed by exactly one member, so the partition count caps parallelism. Consumers commit offsets to record how far they have read and resume from the last committed offset after a rebalance. Having more consumers than partitions leaves the extra consumers idle.', category: 'Streaming', topic: 'Consumer Groups' },
  { question: 'What does at-least-once delivery guarantee, and what must message handlers therefore do?', options: ['Messages are never duplicated, so handlers need no special care', 'Messages may be redelivered after retries, so handlers should be idempotent or deduplicate', 'Messages may be silently dropped during a rebalance', 'Exactly one consumer processes each message forever with no possibility of reprocessing'], correctIndex: 1, explanation: 'At-least-once means a message is delivered one or more times; duplicates arise from retries, crashes, or rebalances that occur after processing but before committing an offset. Handlers must therefore be idempotent or deduplicate using a key. Truly exactly-once semantics require transactional offset commits and are more expensive.', category: 'Streaming', topic: 'Delivery Semantics' },
  { question: 'A service must both write to its database and publish an event to a broker. What problem does the transactional outbox pattern solve?', options: ['It makes database writes faster by batching them', 'It removes the need for a message broker entirely', 'It avoids the dual-write problem where one write succeeds and the other fails, causing lost or phantom events', 'It guarantees events are consumed the instant they are published'], correctIndex: 2, explanation: 'Writing to a database and a broker is not atomic: the commit may succeed while the publish fails, or the reverse. The outbox pattern writes the event to an outbox table inside the same local transaction as the business data, then a relay publishes it and marks it sent, guaranteeing the event is emitted exactly when the data was committed.', category: 'Architecture', topic: 'Outbox Pattern' },
  { question: 'Compared with two-phase commit, what is the main tradeoff of the saga pattern for distributed transactions?', options: ['It gives atomicity through compensating actions instead of distributed locks, trading isolation for availability', 'It provides full ACID isolation across all participating services', 'It requires all services to share one database', 'It removes the need for idempotent operations'], correctIndex: 0, explanation: 'Two-phase commit holds locks on every participant until the coordinator commits, which is atomic but blocking and availability-hostile. A saga splits the work into local steps with compensating actions on failure, staying available and scalable but offering only eventual consistency with no isolation — intermediate states are visible and compensations must be idempotent.', category: 'Architecture', topic: 'Saga vs 2PC' },
  { question: 'How does a circuit breaker respond when a downstream dependency keeps failing?', options: ['It moves from closed to open after failures pass a threshold, then to half-open to probe recovery', 'It flips from open to closed on the very first failure', 'It remains half-open permanently after any error', 'It never changes state and only logs errors'], correctIndex: 0, explanation: 'When closed, calls pass through; once failures cross a threshold the breaker opens and fails fast without calling the struggling dependency, preventing cascading failure. After a cool-down it goes half-open and allows limited probe calls. A successful probe returns it to closed, and renewed failure reopens it.', category: 'Architecture', topic: 'Circuit Breaker' },
  { question: 'Why is exponential backoff with jitter preferred over fixed-interval retries?', options: ['It makes retries more aggressive so they succeed faster', 'It guarantees a request can never fail', 'It removes the need for idempotency keys', 'It spreads retries over time so many clients do not synchronize and re-overwhelm a recovering service'], correctIndex: 3, explanation: 'Without jitter, many clients retry at the same intervals, creating synchronized retry storms that crash a service just as it recovers. Jitter randomizes the delay across clients, and exponential growth bounds total retry pressure. Retries should still be applied only to idempotent operations.', category: 'Scaling', topic: 'Backoff & Retries' },
  { question: 'What distinguishes a canary deployment from a blue-green deployment?', options: ['Canary sends a small slice of live traffic to the new version and watches metrics before widening the rollout', 'Canary keeps two full identical environments and flips all traffic at once', 'Blue-green gradually ramps traffic one percent at a time', 'The two techniques are identical'], correctIndex: 0, explanation: 'Blue-green runs two complete environments and switches all traffic at the router, giving a fast and near-instant rollback. Canary exposes the new version to a small percentage of traffic first, observes error and latency metrics, then increases exposure. Canary limits blast radius, while blue-green provides a binary switch.', category: 'DevOps', topic: 'Deployments' },
  { question: 'What does PKCE add to the OAuth2 authorization code flow?', options: ['It encrypts the access token in transit', 'It replaces refresh tokens entirely', 'It binds the authorization code to a client-generated verifier so a stolen code cannot be exchanged', 'It authenticates the resource server to the client'], correctIndex: 2, explanation: 'PKCE has the client generate a random code_verifier, send its hash as a code_challenge with the authorization request, and send the verifier when exchanging the code for tokens. An intercepted code is useless without the verifier. It is essential for public clients such as mobile and single-page apps that cannot keep a client secret.', category: 'Security', topic: 'OAuth2 PKCE' },
  { question: 'What does refresh token rotation add beyond a plain long-lived refresh token?', options: ['Each refresh returns a new refresh token and invalidates the old one, so replaying a stolen token is detected', 'It makes access tokens live longer', 'It removes the need for access tokens', 'It stores tokens in localStorage for persistence'], correctIndex: 0, explanation: 'With rotation, exchanging a refresh token issues a fresh one and invalidates the previous token. If an attacker replays a stolen but already-used refresh token, the server detects the reuse and can revoke the entire token family, shrinking the window of compromise.', category: 'Security', topic: 'Refresh Tokens' },
  { question: 'What is SSRF, Server-Side Request Forgery, and how is it mitigated?', options: ['Forging user credentials — mitigated by stronger passwords and MFA', 'Stealing session cookies via injected scripts — mitigated with HttpOnly cookies', 'Tricking the server into fetching an attacker-controlled URL — mitigated by allow-listing destinations and blocking internal IP ranges', 'Flooding the server with requests — mitigated by rate limiting'], correctIndex: 2, explanation: 'In SSRF an attacker supplies a URL that the server fetches, potentially reaching internal services such as cloud metadata endpoints like 169.254.169.254. Mitigations include strict allow-listing, blocking private and link-local IP ranges, disabling redirects, and enforcing network egress controls.', category: 'Security', topic: 'SSRF' },
  { question: 'Which pairing correctly matches the primary defenses to CSRF and XSS?', options: ['SameSite cookies and anti-CSRF tokens for CSRF; output encoding and Content-Security-Policy for XSS', 'Content-Security-Policy for CSRF; SameSite cookies for XSS', 'CORS for both CSRF and XSS', 'Rate limiting for CSRF; password hashing for XSS'], correctIndex: 0, explanation: 'CSRF tricks a logged-in user browser into sending an authenticated request, so the defenses are SameSite cookies and per-request anti-CSRF tokens. XSS injects attacker scripts into pages the user trusts, so the defenses are contextual output encoding, a strict Content-Security-Policy, and never rendering untrusted input as HTML. They are distinct threats with different fixes.', category: 'Security', topic: 'XSS & CSRF' },
  { question: 'In a flash sale of 100 units under heavy concurrency, which approach most reliably prevents overselling?', options: ['Read the stock with SELECT, then UPDATE with the new value, outside a transaction', 'Run an atomic conditional update such as UPDATE stock SET qty = qty - 1 WHERE id = ? AND qty > 0 and check the number of affected rows', 'Cache the stock count in Redis and trust the cached value', 'Add more application servers so requests are handled in parallel'], correctIndex: 1, explanation: 'A read-then-write check is a race: two requests can both read qty = 1 and both decrement, selling 101 units. An atomic conditional UPDATE, or SELECT ... FOR UPDATE, performs the check and decrement as one indivisible operation, and zero affected rows means the item is sold out. Relying on a cached count without atomic decrement reintroduces the race.', category: 'System Design', topic: 'Oversell Prevention' },
];

const CATEGORIES_LIST = ['All', ...Array.from(new Set(ALL_QUESTIONS.map(q => q.category)))];

export default function QuizPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [started, setStarted] = useState(false);

  const filteredQuestions = selectedCategory === 'All'
    ? ALL_QUESTIONS
    : ALL_QUESTIONS.filter(q => q.category === selectedCategory);

  if (started) {
    return (
      <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: 'Inter, sans-serif' }}>
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #1E1E35', padding: '0 24px', height: '56px',
          display: 'flex', alignItems: 'center', gap: '16px'
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#F0F0F8' }}>
              Backend<span style={{ color: '#C9A84C' }}>Craft</span>
            </span>
          </Link>
          <ChevronRight size={12} color="#555570" />
          <span style={{ fontSize: '14px', color: '#8888AA' }}>Quiz — {selectedCategory}</span>
          <button onClick={() => setStarted(false)} style={{
            marginLeft: 'auto', fontSize: '13px', color: '#8888AA', cursor: 'pointer',
            background: '#12121E', border: '1px solid #1E1E35', borderRadius: '7px', padding: '6px 14px',
            fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <ArrowLeft size={12} /> Exit Quiz
          </button>
        </nav>
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}>
          <Quiz questions={filteredQuestions} title={`${selectedCategory} — ${filteredQuestions.length} Questions`} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0F', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1E1E35', padding: '0 24px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '16px', color: '#F0F0F8' }}>
              Backend<span style={{ color: '#C9A84C' }}>Craft</span>
            </span>
          </Link>
          <ChevronRight size={12} color="#555570" />
          <span style={{ fontSize: '14px', color: '#8888AA' }}>Quiz Mode</span>
        </div>
        <Link href="/docs" style={{
          fontSize: '13px', color: '#8888AA', textDecoration: 'none',
          background: '#12121E', border: '1px solid #1E1E35', borderRadius: '7px', padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <ArrowLeft size={12} /> Back to Docs
        </Link>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px', margin: '0 auto 20px',
            background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <FlaskConical size={28} color="#C9A84C" />
          </div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: '48px', color: '#F0F0F8', marginBottom: '12px' }}>
            Knowledge Check
          </h1>
          <p style={{ fontSize: '17px', color: '#8888AA', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
            {ALL_QUESTIONS.length} interview-level questions across all backend topics.
            Instant feedback with detailed explanations for every answer.
          </p>
        </div>

        {/* Category selector */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#555570', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
            Filter by category
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {CATEGORIES_LIST.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '7px 16px', borderRadius: '8px', fontSize: '13px',
                  fontWeight: selectedCategory === cat ? 600 : 400,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  border: `1px solid ${selectedCategory === cat ? 'rgba(201,168,76,0.4)' : '#1E1E35'}`,
                  background: selectedCategory === cat ? 'rgba(201,168,76,0.1)' : '#12121E',
                  color: selectedCategory === cat ? '#C9A84C' : '#8888AA',
                  transition: 'all 0.2s ease'
                }}
              >
                {cat}
                <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.7 }}>
                  ({cat === 'All' ? ALL_QUESTIONS.length : ALL_QUESTIONS.filter(q => q.category === cat).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Question preview */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#555570', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '12px' }}>
            Questions in this set ({filteredQuestions.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
            {filteredQuestions.map((q, i) => (
              <div key={i} style={{
                background: '#12121E', border: '1px solid #1E1E35', borderRadius: '10px',
                padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start'
              }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: '#C9A84C'
                }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', color: '#F0F0F8', lineHeight: 1.5, marginBottom: '4px' }}>{q.question}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#555570' }}>{q.category}</span>
                    <span style={{ fontSize: '11px', color: '#333' }}>—</span>
                    <span style={{ fontSize: '11px', color: '#555570' }}>{q.topic}</span>
                  </div>
                </div>
                <BookOpen size={13} color="#555570" style={{ flexShrink: 0, marginTop: '3px' }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setStarted(true)}
            style={{
              background: 'linear-gradient(135deg, #9B7B2E, #C9A84C, #E8C96B)',
              color: '#0A0A0F', border: 'none', borderRadius: '12px',
              padding: '15px 48px', fontSize: '16px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 24px rgba(201,168,76,0.3)',
              display: 'inline-flex', alignItems: 'center', gap: '8px'
            }}
          >
            <FlaskConical size={18} />
            Start {filteredQuestions.length} Questions
          </button>
          <p style={{ fontSize: '13px', color: '#555570', marginTop: '12px' }}>
            Instant feedback with detailed explanations after each answer
          </p>
        </div>
      </div>
    </div>
  );
}
