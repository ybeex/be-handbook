// ─── Backend Playground Templates ────────────────────────────────────────────
// Purpose-built for backend engineers: Node.js, SQL, API design, architecture

export interface PlayFile {
  id: string;
  name: string;
  ext: "js" | "ts" | "sql" | "json" | "yaml" | "sh" | "md";
  content: string;
}

export interface BackendTemplate {
  label: string;
  description: string;
  files: PlayFile[];
}

// ─── Mode: Node.js REPL-style runner ─────────────────────────────────────────
export const NODEJS_TEMPLATES: Record<string, BackendTemplate> = {
  event_loop: {
    label: "Event Loop Phases",
    description: "Visualise the event loop execution order",
    files: [
      {
        id: "main",
        name: "event-loop",
        ext: "js",
        content: `// ── Event Loop Phase Demo ─────────────────────────────
// Run this to see the exact execution order
// across: synchronous, nextTick, microtasks, timers, setImmediate

console.log('=== Event Loop Phase Demo ===\\n');

// Every callback records itself, then we render the observed order as a table.
const trace = [];
function mark(queue, label) {
  trace.push({ order: trace.length + 1, queue, label });
}

// 1. Synchronous — runs first, always
mark('sync', 'main module (start)');

// 4. Timers phase — setTimeout(0)
setTimeout(() => mark('timers', 'setTimeout(0)'), 0);

// 5. Check phase — setImmediate (after I/O)
setImmediate(() => mark('check', 'setImmediate'));

// 3. Microtask queue — Promise callbacks
Promise.resolve()
  .then(() => mark('microtask', 'Promise.then'))
  .then(() => mark('microtask', 'chained .then'));

// 2. nextTick queue — highest priority async
process.nextTick(() => {
  mark('nextTick', 'first');
  // nextTick inside nextTick still runs before Promises
  process.nextTick(() => mark('nextTick', 'nested'));
});

mark('sync', 'main module (end)');

// ── Why does setImmediate come before setTimeout(0)? ──
// Inside an I/O callback the order is deterministic:
const fs = require('fs');
fs.readFile(__filename, () => {
  setTimeout(() => mark('timers (in I/O)', 'setTimeout'), 0);
  setImmediate(() => mark('check (in I/O)', 'setImmediate'));
  // Render once every queued callback has reported in.
  setTimeout(() => console.table('Event loop execution order', trace), 20);
});`,
      },
    ],
  },

  streams: {
    label: "Streams & Backpressure",
    description: "Transform streams, pipeline, backpressure handling",
    files: [
      {
        id: "main",
        name: "streams",
        ext: "js",
        content: `// ── Node.js Streams Deep Dive ─────────────────────────
const { Transform, Readable, Writable, pipeline } = require('stream');
const { promisify } = require('util');
const pipe = promisify(pipeline);

// ── 1. Transform stream — modify data in flight ─────────
class UpperCaseTransform extends Transform {
  _transform(chunk, encoding, callback) {
    // chunk arrives as Buffer
    const upper = chunk.toString().toUpperCase();
    this.push(upper);  // push to readable side
    callback();        // signal ready for next chunk
  }
}

class WordCountTransform extends Transform {
  constructor() {
    super({ objectMode: true });
    this.wordCount = 0;
    this.stats = [];
  }
  _transform(chunk, _, cb) {
    const text  = chunk.toString().trim();
    const words = text.split(/\\s+/).filter(Boolean);
    this.wordCount += words.length;
    // Record per-chunk stats so the demo can render a results table
    this.stats.push({ chunk: '#' + (this.stats.length + 1), words: words.length, chars: text.length });
    this.push(chunk);  // pass through
    cb();
  }
  _flush(cb) {
    // Called when source is exhausted — emit summary
    this.push(\`\\n[WordCount: \${this.wordCount} words]\\n\`);
    cb();
  }
}

// ── 2. Readable stream from data array ──────────────────
function createReadableFromArray(items) {
  let index = 0;
  return new Readable({
    read() {
      if (index < items.length) {
        this.push(items[index++] + '\\n');
      } else {
        this.push(null); // signal end of stream
      }
    }
  });
}

// ── 3. Writable that collects output ────────────────────
const chunks = [];
const collector = new Writable({
  write(chunk, encoding, callback) {
    chunks.push(chunk.toString());
    callback();
  }
});

// ── 4. Run the pipeline ─────────────────────────────────
const sentences = [
  'the quick brown fox',
  'jumps over the lazy dog',
  'node.js streams are memory efficient',
  'backpressure prevents overwhelming consumers',
];

const counter = new WordCountTransform();
pipe(
  createReadableFromArray(sentences),
  new UpperCaseTransform(),
  counter,
  collector
).then(() => {
  console.table('Transform pipeline — per chunk', counter.stats);
  console.table('Pipeline summary', [
    { metric: 'source lines', value: String(sentences.length) },
    { metric: 'chunks emitted', value: String(counter.stats.length) },
    { metric: 'total words', value: String(counter.wordCount) },
    { metric: 'output bytes', value: String(chunks.join('').length) },
  ]);
}).catch(err => console.error('Pipeline failed:', err));

// ── 5. Backpressure demo ─────────────────────────────────
const bpLog = [];
const fastProducer = new Readable({ read() {} });
const slowConsumer = new Writable({
  highWaterMark: 2, // tiny buffer — 2 bytes
  write(chunk, _, cb) {
    // Simulate slow consumer
    setTimeout(() => {
      bpLog.push({ event: 'consumed', chunk: chunk.toString(), note: 'write() completed' });
      cb();
    }, 100);
  }
});

slowConsumer.on('drain', () => bpLog.push({ event: 'drain', chunk: '—', note: 'buffer emptied — resume writes' }));

// Push data faster than consumer can handle
let canPush = true;
for (let i = 1; i <= 5; i++) {
  canPush = slowConsumer.write(Buffer.from('chunk-' + i));
  if (!canPush) {
    bpLog.push({ event: 'pause', chunk: 'chunk-' + i, note: 'highWaterMark reached — backpressure applied' });
  }
}

// Render the backpressure timeline once the slow consumer has drained.
setTimeout(() => console.table('Backpressure timeline', bpLog), 400);
`,
      },
    ],
  },

  worker_threads: {
    label: "Worker Threads",
    description: "CPU-intensive work off the main thread",
    files: [
      {
        id: "main",
        name: "main",
        ext: "js",
        content: `// ── Worker Threads — CPU work off the main thread ─────
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

if (isMainThread) {
  // ── Main thread: dispatch work to workers ─────────────
  console.log(\`=== Worker Threads Demo ===\`);
  console.log(\`CPU cores: \${os.cpus().length}\`);
  console.log('Main thread: event loop stays responsive\\n');

  const TASKS = [
    { id: 1, n: 40 },  // fib(40)
    { id: 2, n: 41 },
    { id: 3, n: 42 },
    { id: 4, n: 38 },
  ];

  const start = Date.now();
  let completed = 0;
  let ticks = 0;
  const results = [];

  // Proof the event loop is not blocked:
  const ticker = setInterval(() => {
    ticks++;
    process.stdout.write('.');  // prints while workers compute
  }, 50);

  let finished = false;
  function finish() {
    if (finished) return;         // report completion exactly once
    finished = true;
    clearInterval(ticker);        // always stop the ticker, even if a worker fails
    results.sort((a, b) => a.worker - b.worker);
    console.table('Worker results', results);
    console.table('Worker thread summary', [
      { metric: 'tasks dispatched', value: String(TASKS.length) },
      { metric: 'wall-clock ms', value: String(Date.now() - start) },
      { metric: 'event-loop ticks while working', value: String(ticks) },
      { metric: 'isolation', value: 'each worker has its own V8 isolate' },
    ]);
  }

  TASKS.forEach(task => {
    // Each worker gets its own V8 isolate — truly parallel
    const worker = new Worker(__filename, { workerData: task });

    worker.on('message', (result) => {
      results.push({ worker: task.id, fib_n: task.n, result, elapsed_ms: Date.now() - start });
      if (++completed === TASKS.length) finish();
    });

    worker.on('error', err => {
      results.push({ worker: task.id, fib_n: task.n, result: 'ERROR: ' + err.message, elapsed_ms: Date.now() - start });
      if (++completed === TASKS.length) finish();   // never leave the ticker running
    });
  });

} else {
  // ── Worker thread: compute fibonacci ──────────────────
  // This code runs in a separate thread — cannot block main thread
  function fib(n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
  }

  const result = fib(workerData.n);
  parentPort.postMessage(result);
}

// ── SharedArrayBuffer: zero-copy data sharing ─────────
if (isMainThread) {
  const shared = new SharedArrayBuffer(4); // 4 bytes = 1 Int32
  const arr = new Int32Array(shared);
  arr[0] = 0;

  const counterWorker = new Worker(\`
    const { workerData, parentPort } = require('worker_threads');
    const arr = new Int32Array(workerData.shared);
    for (let i = 0; i < 1000; i++) {
      Atomics.add(arr, 0, 1);  // atomic increment — thread-safe
    }
    parentPort.postMessage('done');
  \`, { eval: true, workerData: { shared } });

  counterWorker.on('message', () => {
    console.table('SharedArrayBuffer — atomic counter', [
      { increments: 1000, final_value: arr[0], thread_safe: arr[0] === 1000, api: 'Atomics.add' },
    ]);
  });
}`,
      },
    ],
  },

  rate_limiter: {
    label: "Rate Limiter Implementation",
    description: "Token bucket, sliding window, fixed window algorithms",
    files: [
      {
        id: "main",
        name: "rate-limiter",
        ext: "js",
        content: `// ── Rate Limiting Algorithms ──────────────────────────
// Implemented in pure JS — understand the algorithms before using a library

// ── 1. Fixed Window ──────────────────────────────────────
class FixedWindowLimiter {
  constructor(limit, windowMs) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.windows = new Map(); // key → { count, resetAt }
  }

  allow(key) {
    const now = Date.now();
    const windowStart = Math.floor(now / this.windowMs) * this.windowMs;
    const resetAt = windowStart + this.windowMs;

    const entry = this.windows.get(key) ?? { count: 0, resetAt };
    if (entry.resetAt <= now) {
      entry.count = 0;  // new window
      entry.resetAt = resetAt;
    }

    entry.count++;
    this.windows.set(key, entry);

    return {
      allowed: entry.count <= this.limit,
      remaining: Math.max(0, this.limit - entry.count),
      resetIn: entry.resetAt - now,
    };
  }
}

// ── 2. Sliding Window Log ────────────────────────────────
class SlidingWindowLimiter {
  constructor(limit, windowMs) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.logs = new Map(); // key → [timestamp, ...]
  }

  allow(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const log = (this.logs.get(key) ?? []).filter(ts => ts > windowStart);
    log.push(now);
    this.logs.set(key, log);

    return {
      allowed: log.length <= this.limit,
      remaining: Math.max(0, this.limit - log.length),
      count: log.length,
    };
  }
}

// ── 3. Token Bucket ──────────────────────────────────────
class TokenBucketLimiter {
  constructor(capacity, refillRate) {
    this.capacity = capacity;       // max tokens (burst size)
    this.refillRate = refillRate;   // tokens per ms
    this.buckets = new Map();       // key → { tokens, lastRefill }
  }

  allow(key, cost = 1) {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? { tokens: this.capacity, lastRefill: now };

    // Refill tokens based on elapsed time
    const elapsed = now - bucket.lastRefill;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsed * this.refillRate);
    bucket.lastRefill = now;

    if (bucket.tokens >= cost) {
      bucket.tokens -= cost;
      this.buckets.set(key, bucket);
      return { allowed: true, tokens: bucket.tokens };
    }

    this.buckets.set(key, bucket);
    const waitMs = (cost - bucket.tokens) / this.refillRate;
    return { allowed: false, tokens: bucket.tokens, retryAfterMs: Math.ceil(waitMs) };
  }
}

// ── Demo all three ───────────────────────────────────────
console.log('=== Rate Limiter Comparison ===\\n');

const fixed   = new FixedWindowLimiter(3, 1000);   // 3 req/s
const sliding = new SlidingWindowLimiter(3, 1000);
const bucket  = new TokenBucketLimiter(3, 0.003);  // 3 tokens/s (0.003/ms)

const key = 'user:123';
const requests = 6;

console.log('Sending ' + requests + ' requests in quick succession — tabulated above:');

const rows = [];
for (let i = 1; i <= requests; i++) {
  const f = fixed.allow(key);
  const s = sliding.allow(key);
  const b = bucket.allow(key);

  const fmt = (r) => r.allowed ? 'allow' : 'deny';
  rows.push({ req: i, fixed_window: fmt(f), sliding_window: fmt(s), token_bucket: fmt(b) });
}
console.table('Rate limiter comparison — 6 requests, 3 req/s', rows);

console.log('\\n--- Token bucket allows burst then enforces rate ---');
console.log('--- Fixed window has boundary vulnerability ---');
console.log('--- Sliding window is most accurate but memory-heavy ---');

// ── Middleware pattern ───────────────────────────────────
console.log('\\n=== Express Middleware Pattern ===');
const limiter = new TokenBucketLimiter(10, 0.01); // 10 req/s

function rateLimitMiddleware(req, res, next) {
  const key = req.headers['x-forwarded-for'] ?? req.connection.remoteAddress;
  const result = limiter.allow(key);

  if (!result.allowed) {
    // res.setHeader('Retry-After', Math.ceil(result.retryAfterMs / 1000));
    // res.status(429).json({ error: 'Too many requests', retryAfterMs: result.retryAfterMs });
    console.log(\`  429 Too Many Requests — retry after \${result.retryAfterMs}ms\`);
    return;
  }
  // res.setHeader('X-RateLimit-Remaining', result.tokens);
  // next();
  console.log(\`  200 OK — \${result.tokens.toFixed(2)} tokens remaining\`);
}

// Simulate requests
for (let i = 0; i < 4; i++) {
  rateLimitMiddleware({ headers: {}, connection: { remoteAddress: '1.2.3.4' } });
}
`,
      },
    ],
  },

  pub_sub: {
    label: "Pub/Sub & Event Emitter",
    description: "EventEmitter patterns, typed events, async pub/sub",
    files: [
      {
        id: "main",
        name: "pub-sub",
        ext: "js",
        content: `// ── Pub/Sub & Event Emitter Patterns ─────────────────
const { EventEmitter } = require('events');

// ── 1. Basic EventEmitter with typed events ─────────────
class OrderService extends EventEmitter {
  constructor() {
    super();
    this.orders = new Map();
  }

  async placeOrder(order) {
    const id = \`order-\${Date.now()}\`;
    const enriched = { ...order, id, status: 'pending', createdAt: new Date() };
    this.orders.set(id, enriched);

    // Publish event — all subscribers notified synchronously
    this.emit('order:placed', enriched);
    return enriched;
  }

  async shipOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');
    order.status = 'shipped';
    this.emit('order:shipped', order);
    return order;
  }
}

// ── 2. Multiple independent subscribers ──────────────────
const orderService = new OrderService();
const deliveries = [];   // every notification, for the results table

// Inventory subscriber
orderService.on('order:placed', (order) => {
  deliveries.push({ event: 'order:placed', subscriber: 'Inventory', detail: 'reserved ' + order.quantity + 'x ' + order.product });
});

// Email subscriber
orderService.on('order:placed', (order) => {
  deliveries.push({ event: 'order:placed', subscriber: 'Email', detail: 'confirmation -> ' + order.email });
});

// Analytics subscriber
orderService.on('order:placed', (order) => {
  deliveries.push({ event: 'order:placed', subscriber: 'Analytics', detail: 'tracked ' + order.id });
});

orderService.on('order:shipped', (order) => {
  deliveries.push({ event: 'order:shipped', subscriber: 'Email', detail: 'shipping notice -> ' + order.id });
});

// ── 3. Run demo ──────────────────────────────────────────
async function demo() {
  const order = await orderService.placeOrder({
    product: 'Node.js Handbook',
    quantity: 2,
    email: 'alice@example.com',
    total: 49.99,
  });

  await orderService.shipOrder(order.id);

  console.table('Order lifecycle', [
    { stage: 'placed', order_id: order.id, status: 'pending', total: '$' + order.total },
    { stage: 'shipped', order_id: order.id, status: order.status, total: '$' + order.total },
  ]);
  console.table('Subscriber deliveries (sync emit)', deliveries);

  // ── 4. Async event pattern ───────────────────────────
  class AsyncEventBus extends EventEmitter {
    async emitAsync(event, ...args) {
      const handlers = this.listeners(event);
      // Run all handlers in parallel
      await Promise.all(handlers.map(h => Promise.resolve(h(...args))));
    }
  }

  const bus = new AsyncEventBus();
  const asyncRows = [];

  bus.on('user:registered', async (user) => {
    await new Promise(r => setTimeout(r, 50)); // simulate email send
    asyncRows.push({ subscriber: 'Email', simulated_latency_ms: 50, detail: 'welcome -> ' + user.email });
  });

  bus.on('user:registered', async (user) => {
    await new Promise(r => setTimeout(r, 30)); // simulate DB write
    asyncRows.push({ subscriber: 'Analytics', simulated_latency_ms: 30, detail: 'tracked ' + user.id });
  });

  await bus.emitAsync('user:registered', { id: 'usr-1', email: 'bob@example.com' });
  asyncRows.sort((a, b) => a.simulated_latency_ms - b.simulated_latency_ms);
  console.table('Async fan-out (run in parallel)', asyncRows);

  // ── 5. Memory leak guard ─────────────────────────────
  const emitter = new EventEmitter();
  emitter.setMaxListeners(20); // default is 10 — raise for legitimate uses

  // once() auto-removes after first invocation
  emitter.once('connect', () => {});
  emitter.emit('connect');
  emitter.emit('connect'); // no output — listener already removed

  console.table('Listener lifecycle', [
    { step: 'after emit #1', listeners: emitter.listenerCount('connect') },
    { step: 'after emit #2 (once already removed)', listeners: emitter.listenerCount('connect') },
    { step: 'maxListeners configured', listeners: emitter.getMaxListeners() },
  ]);
}

demo().catch(console.error);
`,
      },
    ],
  },

  circuit_breaker: {
    label: "Circuit Breaker",
    description: "Full circuit breaker implementation with states",
    files: [
      {
        id: "main",
        name: "circuit-breaker",
        ext: "js",
        content: `// ── Circuit Breaker Pattern ───────────────────────────
// Prevents cascade failures when downstream services fail

class CircuitBreaker {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.failureThreshold   = options.failureThreshold ?? 5;
    this.successThreshold   = options.successThreshold ?? 2;
    this.timeoutMs          = options.timeoutMs ?? 3000;
    this.resetTimeoutMs     = options.resetTimeoutMs ?? 10000;
    this.fallback           = options.fallback ?? null;

    // State machine
    this.state          = 'CLOSED';  // CLOSED | OPEN | HALF_OPEN
    this.failureCount   = 0;
    this.successCount   = 0;
    this.lastFailureAt  = null;
    this.stats          = { calls: 0, failures: 0, fallbacks: 0, blocked: 0 };
  }

  async call(...args) {
    this.stats.calls++;

    // ── OPEN: fast-fail immediately ──────────────────────
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastFailureAt;
      if (elapsed < this.resetTimeoutMs) {
        this.stats.blocked++;
        console.log(\`  [CB] OPEN — blocked (reset in \${this.resetTimeoutMs - elapsed}ms)\`);
        if (this.fallback) { this.stats.fallbacks++; return this.fallback(...args); }
        throw new Error('Circuit breaker is OPEN');
      }
      // Enough time passed — try half-open
      this.transition('HALF_OPEN');
    }

    // ── CLOSED / HALF_OPEN: attempt the call ─────────────
    try {
      const result = await this.withTimeout(this.fn(...args), this.timeoutMs);

      if (this.state === 'HALF_OPEN') {
        this.successCount++;
        if (this.successCount >= this.successThreshold) {
          this.transition('CLOSED');
        }
      } else {
        this.failureCount = 0; // reset on success
      }
      return result;

    } catch (err) {
      this.failureCount++;
      this.stats.failures++;
      this.lastFailureAt = Date.now();

      if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
        this.transition('OPEN');
      }

      if (this.fallback) { this.stats.fallbacks++; return this.fallback(...args); }
      throw err;
    }
  }

  transition(newState) {
    console.log(\`  [CB] \${this.state} → \${newState}\`);
    this.state = newState;
    this.failureCount = 0;
    this.successCount = 0;
  }

  withTimeout(promise, ms) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(\`Timeout after \${ms}ms\`)), ms)
      )
    ]);
  }

  getStats() {
    return {
      state: this.state,
      ...this.stats,
      failureRate: this.stats.calls
        ? ((this.stats.failures / this.stats.calls) * 100).toFixed(1) + '%'
        : '0%'
    };
  }
}

// ── Demo ─────────────────────────────────────────────────
async function demo() {
  console.log('=== Circuit Breaker Demo ===\\n');

  let callCount = 0;

  // Simulated unreliable service
  async function userService(id) {
    callCount++;
    // Fail on calls 3-7 to trigger circuit breaker
    if (callCount >= 3 && callCount <= 7) {
      throw new Error('Service unavailable');
    }
    await new Promise(r => setTimeout(r, 10));
    return { id, name: 'Alice', email: 'alice@example.com' };
  }

  const breaker = new CircuitBreaker(userService, {
    failureThreshold: 3,
    successThreshold: 2,
    resetTimeoutMs: 500, // short for demo
    fallback: (id) => ({ id, name: 'Unknown', cached: true }),
  });

  // Make 12 sequential calls
  for (let i = 1; i <= 12; i++) {
    try {
      const result = await breaker.call(\`user-\${i}\`);
      const tag = result.cached ? '[FALLBACK]' : '[SUCCESS]';
      console.log(\`Call \${i.toString().padStart(2)}: \${tag} \${result.name} (state: \${breaker.state})\`);
    } catch (err) {
      console.log(\`Call \${i.toString().padStart(2)}: [ERROR] \${err.message} (state: \${breaker.state})\`);
    }

    // After call 7, wait for reset timeout
    if (i === 7) {
      console.log('\\n  Waiting for reset timeout...\\n');
      await new Promise(r => setTimeout(r, 600));
    }
  }

  console.log('\\n=== Final Stats ===');
  console.table('Circuit breaker — final stats', breaker.getStats());
}

demo().catch(console.error);
`,
      },
    ],
  },
  error_handling: {
    label: "Error Handling",
    description: "Custom error classes, async wrapper, central handler",
    files: [
      {
        id: "main",
        name: "error-handling",
        ext: "js",
        content: `// ── Error Handling Patterns ───────────────────────────
// Custom error hierarchy + async wrapper + central handler

// ── 1. Custom error classes ────────────────────────────
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;   // expected error — safe to expose
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(\`\${resource} not found\`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

class ValidationError extends AppError {
  constructor(details) {
    super('Validation failed', 422, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

// ── 2. Async wrapper — no try/catch in every route ─────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── 3. Centralised Express-style error handler ─────────
function errorHandler(err, req, res, next) {
  // Unexpected (non-operational) errors are bugs — log + hide details
  if (!err.isOperational) {
    console.error('[FATAL] Unexpected error:', err.message);
  }

  const status = err.statusCode ?? 500;
  const body = {
    type:   \`https://api.example.com/errors/\${err.code ?? 'internal'}\`,
    title:  status >= 500 ? 'Internal Server Error' : err.message,
    status,
    code:   err.code ?? 'INTERNAL_ERROR',
    detail: err.isOperational ? err.message : 'Something went wrong',
    errors: err.details,
  };
  res.status(status).json(body);
}

// ── 4. Simulated request/response objects ──────────────
function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
}

// ── 5. Route handlers — just throw, the wrapper handles it ─
async function getUser(req, res) {
  if (req.params.id === '404') throw new NotFoundError('User');
  res.status(200).json({ id: req.params.id, name: 'Alice' });
}

async function createUser(req, res) {
  if (!req.body.email) {
    throw new ValidationError([{ field: 'email', message: 'Required' }]);
  }
  if (req.body.email === 'taken@example.com') {
    throw new ConflictError('Email already registered');
  }
  res.status(201).json({ id: 'usr-1', ...req.body });
}

// ── 6. Emulate Express' wrapper + terminal handler ─────
async function callRoute(handler, req) {
  const res = makeRes();
  let captured = null;
  const next = (err) => { captured = err; };

  await asyncHandler(handler)(req, res, next);
  if (captured) errorHandler(captured, req, res, () => {});
  return res;
}

// ── 7. Demo ─────────────────────────────────────────────
async function demo() {
  console.log('=== Error Handling Demo ===\\n');

  const cases = [
    { label: 'GET valid user',       fn: getUser,    req: { params: { id: 'usr-1' } } },
    { label: 'GET missing user',     fn: getUser,    req: { params: { id: '404' } } },
    { label: 'POST invalid email',   fn: createUser, req: { body: {} } },
    { label: 'POST duplicate email', fn: createUser, req: { body: { email: 'taken@example.com' } } },
    { label: 'POST valid user',      fn: createUser, req: { body: { email: 'new@example.com' } } },
  ];

  const rows = [];
  for (const c of cases) {
    const res = await callRoute(c.fn, c.req);
    rows.push({
      request: c.label,
      http_status: res.statusCode,
      code: res.body?.code ?? 'OK',
      title: res.body?.title ?? 'OK',
      validation_details: res.body?.errors ? JSON.stringify(res.body.errors) : '—',
    });
  }
  console.table('Route results (centralised handler)', rows);

  console.table('Status code contract', [
    { error_class: 'NotFoundError',                 status: 404, operational: true },
    { error_class: 'ConflictError',                 status: 409, operational: true },
    { error_class: 'ValidationError',               status: 422, operational: true },
    { error_class: 'AppError (base)',               status: 500, operational: true },
    { error_class: 'unexpected (non-operational)',  status: 500, operational: false },
  ]);
}

demo().catch(console.error);
`,
      },
    ],
  },

  graceful_shutdown: {
    label: "Graceful Shutdown",
    description: "SIGTERM handling, draining connections, closing pools",
    files: [
      {
        id: "main",
        name: "graceful-shutdown",
        ext: "js",
        content: `// ── Graceful Shutdown ─────────────────────────────────
// Handle SIGTERM: stop accepting, drain in-flight, close pools

const { EventEmitter } = require('events');

// The browser sandbox has no real OS signals, so we route them through
// an emitter. In production this is simply \`process\`.
const signals = new EventEmitter();
// In a real Node process \`process\` owns signal handling; the sandbox still
// provides process.on/emit, so we route through whichever target we registered
// on — otherwise an emitted signal never reaches the handler.
const useProcess = typeof process !== 'undefined' && typeof process.on === 'function';
const onSignal = (name, fn) => (useProcess ? process.on(name, fn) : signals.on(name, fn));
const raiseSignal = (name) => (useProcess ? process.emit(name) : signals.emit(name));

// ── 1. Fake HTTP server with in-flight requests ────────
class Server {
  constructor() {
    this.listening = true;
    this.inFlight = 0;
    this.totalHandled = 0;
  }

  async handleRequest(id, durationMs) {
    if (!this.listening) throw new Error('Server is shutting down');
    this.inFlight++;
    this.totalHandled++;
    console.log(\`  [HTTP] request \${id} started (in-flight: \${this.inFlight})\`);
    await new Promise(r => setTimeout(r, durationMs));
    this.inFlight--;
    console.log(\`  [HTTP] request \${id} done    (in-flight: \${this.inFlight})\`);
  }

  stopAccepting() { this.listening = false; }

  async waitForDrain(maxMs = 900) {
    // Bounded loop — even if a request never finishes we always exit.
    const deadline = Date.now() + maxMs;
    while (this.inFlight > 0 && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 10));
    }
    return this.inFlight === 0;
  }
}

// ── 2. Fake DB / cache pools ────────────────────────────
class Pool {
  constructor(name, size) { this.name = name; this.open = size; }
  async close() {
    await new Promise(r => setTimeout(r, 5));
    this.open = 0;
    console.log(\`  [\${this.name}] pool closed\`);
  }
}

// ── 3. Shutdown coordinator ─────────────────────────────
const server = new Server();
const db     = new Pool('Postgres', 10);
const cache  = new Pool('Redis', 5);

const timeline = [];       // ordered shutdown steps — rendered as a table
let shuttingDown = false;
let shutdownDone = null;

async function shutdown(signal) {
  if (shuttingDown) {
    console.log(\`  [SHUTDOWN] received \${signal} again — forcing exit\`);
    process.exit?.(1);
    return;
  }
  shuttingDown = true;
  console.log(\`  [SHUTDOWN] received \${signal} — starting graceful shutdown\`);

  shutdownDone = (async () => {
    timeline.push({ step: '1 · signal received', detail: signal });

    // 1. Stop accepting new work immediately
    server.stopAccepting();
    timeline.push({ step: '2 · stop accepting', detail: 'new connections refused' });

    // 2. Drain in-flight requests (with a hard deadline)
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('drain deadline exceeded')), 1000));
    try {
      await Promise.race([server.waitForDrain(), timeout]);
      timeline.push({ step: '3 · drain in-flight', detail: 'all requests finished' });
    } catch (e) {
      timeline.push({ step: '3 · drain in-flight', detail: e.message + ' — closing anyway' });
    }

    // 3. Close resources — pools must close LAST
    await db.close();
    await cache.close();
    timeline.push({ step: '4 · close pools', detail: 'Postgres + Redis' });
    timeline.push({ step: '5 · clean exit', detail: 'all resources released' });
  })();

  return shutdownDone;
}

// ── 4. Register signal handlers ─────────────────────────
onSignal('SIGTERM', () => shutdown('SIGTERM'));
onSignal('SIGINT',  () => shutdown('SIGINT'));

// ── 5. Demo — simulate load, then deliver a SIGTERM ─────
(async () => {
  console.log('=== Graceful Shutdown Demo ===\\n');

  // Three requests; some are still running when the signal arrives
  const reqs = [{ id: 'a', ms: 40 }, { id: 'b', ms: 120 }, { id: 'c', ms: 30 }];
  const requestRows = reqs.map(r => ({ request: r.id, duration_ms: r.ms, outcome: 'pending' }));

  const tasks = reqs.map((r, i) => server.handleRequest(r.id, r.ms).then(
    () => { requestRows[i].outcome = 'completed'; },
    (e) => { requestRows[i].outcome = 'rejected: ' + e.message; }
  ));

  // Signal arrives while requests are in flight
  setTimeout(() => raiseSignal('SIGTERM'), 10);

  await Promise.allSettled(tasks);

  // A new request after shutdown must be rejected
  try {
    await server.handleRequest('d', 10);
    requestRows.push({ request: 'd', duration_ms: 10, outcome: 'BUG — accepted during shutdown' });
  } catch (e) {
    requestRows.push({ request: 'd', duration_ms: 10, outcome: 'rejected: ' + e.message });
  }

  // Wait for the coordinator to fully finish before reporting
  if (shutdownDone) await shutdownDone;

  console.table('Shutdown timeline', timeline);
  console.table('Request outcomes', requestRows);
  console.table('Final resource state', [
    { resource: 'Postgres pool (open)', value: db.open },
    { resource: 'Redis pool (open)',    value: cache.open },
    { resource: 'server accepting',     value: server.listening },
    { resource: 'requests handled',     value: server.totalHandled },
  ]);
})();
`,
      },
    ],
  },

  memory_leak: {
    label: "Event Listener Leak",
    description: "EventEmitter leak and the fix with .off on close",
    files: [
      {
        id: "main",
        name: "memory-leak",
        ext: "js",
        content: `// ── EventEmitter Listener Leak (and the fix) ──────────
// The classic leak: listeners added per connection but never removed.

const { EventEmitter } = require('events');

// ── 1. The leaky service ────────────────────────────────
class LeakyService {
  // BUG: every connect adds a listener that is never removed.
  // The closure keeps \`this\` — and everything it references — alive.
  onConnect() {
    this.bus.on('data', (msg) => this.afterConnect(msg));
  }
  constructor(bus) { this.bus = bus; }
  afterConnect(msg) { /* handle */ }
}

// ── 2. The fixed service ────────────────────────────────
class FixedService {
  constructor(bus) {
    this.bus = bus;
    this.active = new Map();   // id -> listener
  }

  // Keep a reference so the listener can be removed later
  onConnect(id) {
    const listener = (msg) => this.afterConnect(id, msg);
    this.bus.on('data', listener);
    this.active.set(id, listener);
  }

  onClose(id) {
    const listener = this.active.get(id);
    if (!listener) return;
    this.bus.off('data', listener);   // ✅ remove it on close
    this.active.delete(id);
  }

  afterConnect(id, msg) { /* handle */ }
}

// ── 3. Demo ─────────────────────────────────────────────
const leakyBus = new EventEmitter();
leakyBus.setMaxListeners(0);          // silence the warning so we can count
const leaky = new LeakyService(leakyBus);

const leakRows = [];
for (let i = 1; i <= 5; i++) {
  leaky.onConnect();
  leakRows.push({ connections: i, listeners: leakyBus.listenerCount('data'), note: 'listener never removed' });
}
console.table('Leaky service — listeners grow unbounded', leakRows);

const fixedBus = new EventEmitter();
fixedBus.setMaxListeners(0);
const fixed = new FixedService(fixedBus);

const fixedRows = [];
for (let i = 1; i <= 5; i++) {
  fixed.onConnect(i);
  fixedRows.push({ step: 'connect ' + i, open_connections: i, listeners: fixedBus.listenerCount('data') });
}
for (let i = 1; i <= 5; i++) {
  fixed.onClose(i);
  fixedRows.push({ step: 'close ' + i, open_connections: 5 - i, listeners: fixedBus.listenerCount('data') });
}
console.table('Fixed service — listeners removed on close', fixedRows);

console.table('Rules of thumb', [
  { rule: 'Always remove listeners you add',        api: 'emitter.off() / removeListener' },
  { rule: 'One-shot events',                        api: 'emitter.once()' },
  { rule: 'Use a NAMED function so it can be removed', api: 'function handler() { }' },
  { rule: 'Watch the default 10-listener limit',    api: 'MaxListenersExceededWarning' },
]);
`,
      },
    ],
  },
};

// ─── Mode: SQL Workbench ──────────────────────────────────────────────────────
export const SQL_TEMPLATES: Record<string, BackendTemplate> = {
  window_functions: {
    label: "Window Functions",
    description: "ROW_NUMBER, RANK, LAG, running totals",
    files: [
      {
        id: "main",
        name: "window-functions",
        ext: "sql",
        content: `-- ── Window Functions Deep Dive ───────────────────────────
-- Setup: orders table with user purchases

CREATE TABLE IF NOT EXISTS orders (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  product    TEXT NOT NULL,
  amount     DECIMAL(10,2) NOT NULL,
  status     TEXT DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO orders VALUES
  (1,  101, 'Node.js Handbook',   49.99, 'completed', '2024-01-05'),
  (2,  101, 'PostgreSQL Guide',   39.99, 'completed', '2024-01-12'),
  (3,  101, 'Redis Cookbook',     29.99, 'completed', '2024-02-03'),
  (4,  102, 'System Design',      59.99, 'completed', '2024-01-08'),
  (5,  102, 'AWS Solutions',      44.99, 'completed', '2024-01-20'),
  (6,  103, 'Docker & K8s',       54.99, 'completed', '2024-01-15'),
  (7,  103, 'Microservices',      49.99, 'completed', '2024-02-10'),
  (8,  103, 'Node.js Handbook',   49.99, 'completed', '2024-02-18'),
  (9,  101, 'TypeScript Deep',    34.99, 'refunded',  '2024-03-01'),
  (10, 102, 'Kafka Definitive',   49.99, 'completed', '2024-03-05');

-- ── 1. ROW_NUMBER — unique rank per partition ─────────────
SELECT
  user_id,
  product,
  amount,
  ROW_NUMBER() OVER (
    PARTITION BY user_id
    ORDER BY amount DESC
  ) AS purchase_rank
FROM orders
WHERE status = 'completed';
-- Each user's purchases ranked by amount. Rank 1 = highest spend.

-- ── 2. RANK vs DENSE_RANK — ties ────────────────────────
SELECT
  user_id,
  amount,
  RANK()       OVER (ORDER BY amount DESC) AS rank,       -- gaps after ties
  DENSE_RANK() OVER (ORDER BY amount DESC) AS dense_rank  -- no gaps
FROM orders
WHERE status = 'completed';

-- ── 3. Running total per user ────────────────────────────
SELECT
  user_id,
  created_at::DATE AS order_date,
  amount,
  SUM(amount) OVER (
    PARTITION BY user_id
    ORDER BY created_at
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_total
FROM orders
WHERE status = 'completed'
ORDER BY user_id, created_at;

-- ── 4. LAG/LEAD — compare to adjacent rows ──────────────
SELECT
  user_id,
  created_at::DATE AS order_date,
  amount,
  LAG(amount)  OVER (PARTITION BY user_id ORDER BY created_at) AS prev_order,
  LEAD(amount) OVER (PARTITION BY user_id ORDER BY created_at) AS next_order,
  amount - LAG(amount) OVER (
    PARTITION BY user_id ORDER BY created_at
  ) AS change_from_prev
FROM orders
WHERE status = 'completed'
ORDER BY user_id, created_at;

-- ── 5. Percent of total (no GROUP BY collapse!) ──────────
SELECT
  user_id,
  product,
  amount,
  SUM(amount) OVER () AS grand_total,
  ROUND(amount / SUM(amount) OVER () * 100, 1) AS pct_of_total,
  ROUND(
    amount / SUM(amount) OVER (PARTITION BY user_id) * 100, 1
  ) AS pct_of_user_total
FROM orders
WHERE status = 'completed';

-- ── 6. Top N per group (better than correlated subquery) ─
SELECT * FROM (
  SELECT
    user_id,
    product,
    amount,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rn
  FROM orders
  WHERE status = 'completed'
) ranked
WHERE rn <= 2;  -- Top 2 purchases per user
`,
      },
    ],
  },

  query_optimization: {
    label: "Query Optimization",
    description: "EXPLAIN ANALYZE, indexes, slow query patterns",
    files: [
      {
        id: "main",
        name: "query-optimization",
        ext: "sql",
        content: `-- ── Query Optimization & Index Strategy ──────────────────

-- Setup: realistic e-commerce tables
CREATE TABLE users (
  id         BIGSERIAL PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  country    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT NOT NULL REFERENCES users(id),
  status      TEXT NOT NULL DEFAULT 'pending',
  total       DECIMAL(12,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id         BIGSERIAL PRIMARY KEY,
  order_id   BIGINT NOT NULL REFERENCES orders(id),
  product_id BIGINT NOT NULL,
  quantity   INTEGER NOT NULL,
  price      DECIMAL(10,2) NOT NULL
);

-- ── 1. Always check the query plan first ─────────────────
-- EXPLAIN shows estimated plan. EXPLAIN ANALYZE actually runs it.

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.name, COUNT(o.id) AS order_count, SUM(o.total) AS revenue
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
  AND o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name
ORDER BY revenue DESC
LIMIT 20;

-- Look for: Seq Scan on large tables (bad), Index Scan (good),
-- Nested Loop on large sets (bad), Hash Join (good for large sets)

-- ── 2. Composite index — column ORDER matters ─────────────
-- For WHERE status = 'completed' AND created_at >= ...
-- AND GROUP BY user_id:

-- ❌ Wrong order — can't use for range + lookup
CREATE INDEX idx_orders_date_status ON orders (created_at, status);

-- ✅ Equality first, then range
CREATE INDEX idx_orders_status_date ON orders (status, created_at);

-- ✅ With covering columns to avoid heap fetch
CREATE INDEX idx_orders_status_date_cover
  ON orders (status, created_at)
  INCLUDE (user_id, total);  -- added without indexing — just stored

-- ── 3. Partial index — index only what you query ─────────
-- If 95% of orders are 'completed', index only the rest:
CREATE INDEX idx_orders_pending
  ON orders (created_at, user_id)
  WHERE status != 'completed';  -- much smaller, much faster

-- ── 4. Index on expressions ──────────────────────────────
-- This query cannot use index on email:
-- WHERE LOWER(email) = 'alice@example.com'

-- ❌ Full seq scan
SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';

-- ✅ Create functional index
CREATE INDEX idx_users_email_lower ON users (LOWER(email));
-- Now same query uses the index

-- ── 5. N+1 pattern — the silent killer ──────────────────
-- ❌ N+1: 1 query for users + N queries for order counts
-- (this is what ORMs do by default)

-- Imagine: users.forEach(u => query('SELECT COUNT(*) FROM orders WHERE user_id = ?'))

-- ✅ Single query with aggregation
SELECT
  u.id,
  u.name,
  COUNT(o.id)    AS order_count,
  COALESCE(SUM(o.total), 0) AS total_spent,
  MAX(o.created_at)         AS last_order_at
FROM users u
LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'completed'
GROUP BY u.id, u.name;

-- ── 6. Index-only scan — fastest possible read ───────────
-- Query: list all users from a specific country
-- Data needed: only id and name (both can be in the index)

CREATE INDEX idx_users_country_covering
  ON users (country)
  INCLUDE (name);  -- now query below does index-only scan

EXPLAIN SELECT id, name FROM users WHERE country = 'NG';
-- Should show "Index Only Scan" — zero heap access

-- ── 7. Avoid SELECT * in production ─────────────────────
-- SELECT * pulls all columns including large TEXT/JSONB
-- Prevents index-only scans
-- Always specify only the columns you need:

-- ❌
SELECT * FROM orders WHERE status = 'pending';

-- ✅
SELECT id, user_id, total, created_at
FROM orders
WHERE status = 'pending';
`,
      },
    ],
  },

  transactions: {
    label: "Transactions & Locking",
    description: "ACID, isolation levels, deadlocks, advisory locks",
    files: [
      {
        id: "main",
        name: "transactions",
        ext: "sql",
        content: `-- ── Transactions, Locking & Isolation ────────────────────

-- ── 1. Basic transaction — bank transfer ─────────────────
CREATE TABLE accounts (
  id      BIGSERIAL PRIMARY KEY,
  name    TEXT NOT NULL,
  balance DECIMAL(12,2) NOT NULL CHECK (balance >= 0)
);

INSERT INTO accounts (name, balance) VALUES
  ('Alice', 1000.00),
  ('Bob',    500.00);

-- Atomic transfer — both succeed or both rollback
BEGIN;
  -- Debit Alice
  UPDATE accounts SET balance = balance - 200
  WHERE id = 1 AND balance >= 200;   -- check inline

  -- Fail if Alice didn't have enough (rowCount = 0)
  -- Application would check and ROLLBACK here

  -- Credit Bob
  UPDATE accounts SET balance = balance + 200
  WHERE id = 2;

COMMIT;
-- If any error: ROLLBACK; — atomicity guaranteed

-- ── 2. Pessimistic locking — FOR UPDATE ───────────────────
-- Prevents concurrent modification of the same row
BEGIN;
  SELECT * FROM accounts
  WHERE id = 1
  FOR UPDATE;  -- locks the row until COMMIT/ROLLBACK
  -- Other transactions trying to SELECT ... FOR UPDATE
  -- on the same row will WAIT here

  UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;

-- FOR UPDATE SKIP LOCKED — job queue pattern
BEGIN;
  SELECT * FROM jobs
  WHERE status = 'pending'
  ORDER BY created_at
  LIMIT 1
  FOR UPDATE SKIP LOCKED;  -- skip rows locked by other workers
  -- Perfect for distributed job workers — no contention!
COMMIT;

-- ── 3. Optimistic locking — version column ────────────────
CREATE TABLE products (
  id      BIGSERIAL PRIMARY KEY,
  name    TEXT NOT NULL,
  stock   INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 0
);

INSERT INTO products (name, stock) VALUES ('Widget', 100);

-- Application reads: SELECT id, stock, version FROM products WHERE id = 1
-- Gets: { id: 1, stock: 100, version: 5 }

-- Optimistic update — only succeeds if version hasn't changed
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = 1 AND version = 5;  -- version check!
-- If rowCount = 0: someone else updated first → retry

-- ── 4. Isolation levels ───────────────────────────────────
-- Read Committed (PostgreSQL default)
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
BEGIN;
-- Each statement sees the latest committed data
-- Non-repeatable reads possible (same row different values)
COMMIT;

-- Repeatable Read — consistent snapshot for entire transaction
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN;
-- All reads see data as of transaction start
-- Phantom reads also prevented in PostgreSQL (via MVCC)
COMMIT;

-- Serializable — full serializability, slowest
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN;
-- Detects write-write and read-write conflicts
-- May fail with serialization error → retry
COMMIT;

-- ── 5. Advisory locks — application-level mutex ──────────
-- Perfect for: distributed cron, leader election

-- Session-level advisory lock (auto-released on disconnect)
SELECT pg_try_advisory_lock(12345);  -- true = acquired, false = already locked
-- ... do work ...
SELECT pg_advisory_unlock(12345);

-- Transaction-level (auto-released on COMMIT/ROLLBACK)
BEGIN;
  SELECT pg_try_advisory_xact_lock(42);
  -- ... critical section ...
COMMIT;  -- lock released automatically

-- ── 6. Deadlock prevention ───────────────────────────────
-- Deadlocks occur when transactions lock resources in different orders
-- PostgreSQL auto-detects and kills one transaction (deadlock_timeout = 1s)

-- ❌ Deadlock risk: two transactions locking rows in different orders
-- Txn A: UPDATE accounts WHERE id = 1; UPDATE accounts WHERE id = 2;
-- Txn B: UPDATE accounts WHERE id = 2; UPDATE accounts WHERE id = 1;

-- ✅ Always acquire locks in the same order
-- Both transactions: order by id ascending
BEGIN;
  UPDATE accounts SET balance = balance - 50
  WHERE id IN (1, 2)
  ORDER BY id;  -- consistent lock order — no deadlock possible
COMMIT;
`,
      },
    ],
  },

  indexes_deep: {
    label: "Index Types Deep Dive",
    description: "B-tree, GIN, GiST, BRIN, hash indexes",
    files: [
      {
        id: "main",
        name: "indexes",
        ext: "sql",
        content: `-- ── PostgreSQL Index Types ────────────────────────────────

-- ── 0. Setup — so the index DDL below actually runs ───────
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  country    TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  amount     DECIMAL(10,2) NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
  id    INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  body  TEXT NOT NULL
);

INSERT INTO users (id, name, email, country, created_at) VALUES
  (101, 'Alice',  'alice@example.com',  'NG', '2024-01-05'),
  (102, 'Bob',    'bob@example.com',    'US', '2024-02-11'),
  (103, 'Chidi',  'chidi@example.com',  'NG', '2024-03-02');

INSERT INTO orders (id, user_id, status, amount, created_at) VALUES
  (1, 101, 'pending',   49.99, '2024-03-01'),
  (2, 101, 'completed', 39.99, '2024-02-12'),
  (3, 102, 'pending',   59.99, '2024-03-05'),
  (4, 102, 'completed', 29.99, '2024-01-08'),
  (5, 103, 'pending',   44.99, '2024-03-09');

-- ── 1. B-tree (default) ──────────────────────────────────
-- Best for: equality, range queries, sorting, LIKE 'prefix%'
CREATE INDEX idx_orders_created ON orders (created_at);
-- Supports: =, <, >, <=, >=, BETWEEN, ORDER BY, LIKE 'abc%'
-- Does NOT support: LIKE '%abc', full-text search, array contains

-- ── 2. Hash index ────────────────────────────────────────
-- Best for: equality only. Faster than B-tree for pure equality.
CREATE INDEX idx_users_email_hash ON users USING HASH (email);
-- Supports: = only
-- Does NOT support: <, >, BETWEEN, ORDER BY
-- Use case: primary key lookups, session token lookups

-- ── 3. GIN (Generalized Inverted Index) ──────────────────
-- Best for: full-text search, arrays, JSONB

-- Full-text search
CREATE INDEX idx_docs_search ON documents
  USING GIN (to_tsvector('english', title || ' ' || body));

SELECT * FROM documents
WHERE to_tsvector('english', title || ' ' || body)
   @@ to_tsquery('english', 'postgres & index');

-- JSONB containment queries
CREATE TABLE events (
  id      BIGSERIAL PRIMARY KEY,
  data    JSONB NOT NULL,
  tags    TEXT[] NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_events_data ON events USING GIN (data);
CREATE INDEX idx_events_tags ON events USING GIN (tags);

-- Query JSONB with GIN:
SELECT * FROM events WHERE data @> '{"type": "click", "page": "/home"}';
-- Array containment:
SELECT * FROM events WHERE tags @> ARRAY['backend', 'nodejs'];

-- ── 4. GiST (Generalized Search Tree) ────────────────────
-- Best for: geometric, range types, full-text (alternative to GIN)

-- Range type overlap
CREATE TABLE reservations (
  id      BIGSERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL,
  period  TSRANGE NOT NULL  -- time range
);

CREATE INDEX idx_reservations_period ON reservations USING GiST (period);

-- Find all reservations overlapping a time range
SELECT * FROM reservations
WHERE period && tsrange('2024-03-01', '2024-03-07');

-- PostGIS geography (requires extension)
-- CREATE INDEX idx_places_location ON places USING GiST (location);
-- SELECT * FROM places WHERE ST_DWithin(location, ST_Point(-1.6, 6.6), 5000);

-- ── 5. BRIN (Block Range INdex) ──────────────────────────
-- Best for: naturally ordered large tables (time-series, logs)
-- Tiny index size — just stores min/max per block range

CREATE TABLE metrics (
  id         BIGSERIAL PRIMARY KEY,
  recorded_at TIMESTAMP NOT NULL,  -- naturally ordered by insert
  value       FLOAT NOT NULL
);

-- BRIN is 100x smaller than B-tree for naturally ordered data
CREATE INDEX idx_metrics_time ON metrics USING BRIN (recorded_at)
  WITH (pages_per_range = 128);  -- tunable granularity

-- ── 6. Partial indexes ───────────────────────────────────
-- Index only rows matching a condition — smaller, faster
CREATE INDEX idx_orders_pending ON orders (created_at, user_id)
  WHERE status = 'pending';
-- Huge win if 99% of orders are completed — only index the 1% you query

-- ── 7. Covering indexes (INCLUDE) ────────────────────────
-- Add non-indexed columns to avoid heap fetch (index-only scan)
CREATE INDEX idx_users_country_cover
  ON users (country, created_at)
  INCLUDE (name, email);

-- This query does index-only scan — zero table access:
SELECT name, email FROM users
WHERE country = 'NG' AND created_at >= NOW() - INTERVAL '30 days';

-- ── 8. Multi-column index ordering ───────────────────────
-- Equality columns FIRST, range columns LAST
-- This cannot use index for range on status:
CREATE INDEX bad_idx ON orders (created_at, status);

-- This can (equality first, range second):
CREATE INDEX good_idx ON orders (status, created_at);

-- Query benefits:
SELECT * FROM orders WHERE status = 'pending' AND created_at > NOW() - INTERVAL '7 days';

-- ── 9. Index capability matrix (runs on any engine) ──────
CREATE TABLE IF NOT EXISTS index_capabilities (
  sort_order     INTEGER,
  index_type     TEXT PRIMARY KEY,
  best_for       TEXT NOT NULL,
  supports       TEXT NOT NULL,
  does_not_allow TEXT NOT NULL
);

INSERT INTO index_capabilities VALUES
  (1, 'B-tree',  'equality, range, sorting',        'equality, range, ORDER BY, prefix LIKE', 'suffix match, full-text'),
  (2, 'Hash',    'equality only',                   'equality',                               'range, ORDER BY'),
  (3, 'GIN',     'full-text, arrays, JSONB',        'containment, overlap',                   'ordering, range'),
  (4, 'GiST',    'geometry, ranges',                'overlap, nearest-neighbour',             'plain equality'),
  (5, 'BRIN',    'huge time-ordered tables',        'range on a correlated column',           'random access'),
  (6, 'Partial', 'a hot subset of rows',            'queries matching the predicate',         'queries outside it'),
  (7, 'INCLUDE', 'index-only scans',                'any column + extra payload columns',     'standalone predicate use');

SELECT index_type, best_for, supports, does_not_allow
FROM index_capabilities
ORDER BY sort_order;

-- ── 10. Partial + covering indexes in action ─────────────
-- Partial index: index only the 1% of rows the app actually queries.
CREATE INDEX IF NOT EXISTS idx_orders_pending_created
  ON orders (created_at, user_id)
  WHERE status = 'pending';

SELECT user_id, created_at, amount
FROM orders
WHERE status = 'pending'
ORDER BY created_at;

-- Covering-style aggregate served straight from the index.
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders (status, created_at);

SELECT status, COUNT(*) AS order_count, SUM(amount) AS total
FROM orders
GROUP BY status
ORDER BY status;
`,
      },
    ],
  },

  schema_design: {
    label: "Schema Design Patterns",
    description: "Normalization, soft deletes, audit log, JSONB vs columns",
    files: [
      {
        id: "main",
        name: "schema-design",
        ext: "sql",
        content: `-- ── Production Schema Design Patterns ────────────────────

-- ── 1. Base table — always include these columns ─────────
CREATE TABLE users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,  -- UUID > serial for distributed
  email       TEXT UNIQUE NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,           -- WITH timezone
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deleted_at  TIMESTAMPTZ,                                  -- soft delete
  version     INTEGER DEFAULT 1 NOT NULL                    -- optimistic locking
);

-- Auto-update updated_at via trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── 2. Soft deletes ───────────────────────────────────────
-- Never hard-delete — use deleted_at timestamp

-- View that hides deleted records
CREATE VIEW active_users AS
  SELECT * FROM users WHERE deleted_at IS NULL;

-- Partial index for performance (most queries are on active records)
CREATE INDEX idx_users_active ON users (email, created_at)
  WHERE deleted_at IS NULL;

-- ── 3. Polymorphic associations ──────────────────────────
-- Problem: comments can belong to posts OR products
-- ❌ Bad: nullable foreign keys
CREATE TABLE bad_comments (
  id         BIGSERIAL PRIMARY KEY,
  body       TEXT NOT NULL,
  post_id    BIGINT REFERENCES posts(id),     -- nullable
  product_id BIGINT REFERENCES products(id)   -- nullable
  -- Which is it? Both NULL? DB can't enforce
);

-- ✅ Option A: Separate tables per target
CREATE TABLE post_comments    (id BIGSERIAL PRIMARY KEY, post_id BIGINT NOT NULL, body TEXT);
CREATE TABLE product_comments (id BIGSERIAL PRIMARY KEY, product_id BIGINT NOT NULL, body TEXT);

-- ✅ Option B: Generic comments with type discriminator
CREATE TABLE comments (
  id            BIGSERIAL PRIMARY KEY,
  body          TEXT NOT NULL,
  target_type   TEXT NOT NULL,   -- 'post' | 'product' | 'video'
  target_id     BIGINT NOT NULL,
  user_id       BIGINT NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_comments_target ON comments (target_type, target_id);

-- ── 4. Audit log — immutable history ─────────────────────
CREATE TABLE audit_log (
  id         BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id  TEXT NOT NULL,   -- TEXT to support UUID and BIGINT PKs
  operation  TEXT NOT NULL,   -- INSERT | UPDATE | DELETE
  old_data   JSONB,           -- previous state
  new_data   JSONB,           -- new state
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_audit_record ON audit_log (table_name, record_id, changed_at);

-- Trigger to auto-audit any table
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, operation, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    TG_OP,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attach to any table:
-- CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users
--   FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- ── 5. JSONB vs separate columns ─────────────────────────
-- JSONB: flexible schema, no migrations, but no FK constraints or indexing per field
-- Columns: rigid schema, FK constraints, indexes, type safety

-- ✅ Use JSONB for: user preferences, feature flags, metadata, event payloads
-- ✅ Use columns for: anything you filter/sort/join on, FK references

CREATE TABLE product_configs (
  id          BIGSERIAL PRIMARY KEY,
  product_id  BIGINT NOT NULL REFERENCES products(id),
  -- Frequently queried → columns
  is_active   BOOLEAN NOT NULL DEFAULT true,
  price       DECIMAL(10,2) NOT NULL,
  -- Rarely queried, varies by product type → JSONB
  metadata    JSONB NOT NULL DEFAULT '{}',
  -- e.g.: { "color": "red", "weight_kg": 0.5, "dimensions": {...} }
  settings    JSONB NOT NULL DEFAULT '{}'
);

-- GIN index for JSONB containment queries
CREATE INDEX idx_configs_meta ON product_configs USING GIN (metadata);
CREATE INDEX idx_configs_active ON product_configs (product_id) WHERE is_active;

-- ── 6. Multi-tenant schema ───────────────────────────────
-- Shared tables with Row-Level Security
CREATE TABLE org_data (
  id      BIGSERIAL PRIMARY KEY,
  org_id  UUID NOT NULL,
  payload JSONB NOT NULL
);

ALTER TABLE org_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON org_data
  USING (org_id = current_setting('app.org_id')::UUID);

-- Each request: SET app.org_id = '<org-uuid>';
-- All queries automatically scoped to that org

-- ── 7. Live demo — the patterns in action ────────────────
-- The DDL above is PostgreSQL-flavoured; this section runs on any engine.

CREATE TABLE IF NOT EXISTS demo_users (
  id         INTEGER PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,                          -- soft delete
  version    INTEGER NOT NULL DEFAULT 1     -- optimistic locking
);

INSERT INTO demo_users (id, email, name, deleted_at) VALUES
  (1, 'alice@example.com', 'Alice', NULL),
  (2, 'bob@example.com',   'Bob',   NULL),
  (3, 'carol@example.com', 'Carol', '2024-04-01');   -- soft-deleted

-- Soft-delete view: deleted rows are hidden, never hard-deleted
CREATE VIEW IF NOT EXISTS demo_active_users AS
  SELECT id, email, name FROM demo_users WHERE deleted_at IS NULL;

SELECT id, email, name FROM demo_active_users ORDER BY id;

SELECT
  (SELECT COUNT(*) FROM demo_users)                              AS total_rows,
  (SELECT COUNT(*) FROM demo_active_users)                       AS active_rows,
  (SELECT COUNT(*) FROM demo_users WHERE deleted_at IS NOT NULL) AS soft_deleted;

-- Polymorphic associations: a type discriminator + target id
CREATE TABLE IF NOT EXISTS demo_comments (
  id          INTEGER PRIMARY KEY,
  body        TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   INTEGER NOT NULL,
  user_id     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_demo_comments_target ON demo_comments (target_type, target_id);

INSERT INTO demo_comments VALUES
  (1, 'Nice post',      'post',    10, 1),
  (2, 'Great product',  'product', 20, 2),
  (3, 'Also a comment', 'post',    10, 2),
  (4, 'Wrong price',    'product', 20, 3);

SELECT target_type, target_id, COUNT(*) AS comments
FROM demo_comments
GROUP BY target_type, target_id
ORDER BY target_type, target_id;

-- Audit log: an immutable, append-only history
CREATE TABLE IF NOT EXISTS demo_audit_log (
  id         INTEGER PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id  TEXT NOT NULL,
  operation  TEXT NOT NULL,
  old_data   TEXT,
  new_data   TEXT,
  changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO demo_audit_log (id, table_name, record_id, operation, old_data, new_data) VALUES
  (1, 'demo_users', '1', 'INSERT', NULL, '{"email":"alice@example.com","version":1}'),
  (2, 'demo_users', '1', 'UPDATE', '{"version":1}', '{"version":2}'),
  (3, 'demo_users', '3', 'DELETE', '{"email":"carol@example.com"}', NULL);

SELECT id, table_name, record_id, operation, changed_at
FROM demo_audit_log
ORDER BY id;

-- JSONB vs columns: keep queried fields as columns, the rest as a document
CREATE TABLE IF NOT EXISTS demo_product_configs (
  id         INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  price      DECIMAL(10,2) NOT NULL,
  metadata   TEXT NOT NULL DEFAULT '{}'     -- JSONB in PostgreSQL
);

INSERT INTO demo_product_configs VALUES
  (1, 20, 1, 19.99, '{"color":"red","weight_kg":0.5}'),
  (2, 21, 0, 49.00, '{"color":"blue","weight_kg":1.2}');

-- Filter on real columns: type-safe and indexable
SELECT id, product_id, price FROM demo_product_configs WHERE is_active = 1 ORDER BY price;

-- Filter inside the document: flexible, schema-less JSON
SELECT id, product_id, metadata FROM demo_product_configs WHERE metadata LIKE '%red%' ORDER BY id;

-- Multi-tenant scoping: every row carries an org id
CREATE TABLE IF NOT EXISTS demo_org_data (
  id      INTEGER PRIMARY KEY,
  org_id  TEXT NOT NULL,
  payload TEXT NOT NULL
);

INSERT INTO demo_org_data VALUES
  (1, 'org-A', '{"note":"a1"}'),
  (2, 'org-B', '{"note":"b1"}'),
  (3, 'org-A', '{"note":"a2"}');

SELECT org_id, COUNT(*) AS rows_visible
FROM demo_org_data
WHERE org_id = 'org-A'
GROUP BY org_id;
`,
      },
    ],
  },
  joins_aggregation: {
    label: "Joins & Aggregation",
    description: "INNER/LEFT joins, GROUP BY, HAVING, aggregates",
    files: [
      {
        id: "main",
        name: "joins-aggregation",
        ext: "sql",
        content: `-- ── Joins & Aggregation ──────────────────────────────────
CREATE TABLE customers (
  id       INTEGER PRIMARY KEY,
  name     TEXT NOT NULL,
  country  TEXT NOT NULL
);

CREATE TABLE orders (
  id          INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  amount      DECIMAL(10,2) NOT NULL,
  status      TEXT NOT NULL
);

INSERT INTO customers VALUES
  (1, 'Alice', 'NG'),
  (2, 'Bob',   'US'),
  (3, 'Chidi', 'NG'),
  (4, 'Dana',  'UK');   -- Dana has no orders

INSERT INTO orders VALUES
  (1, 1, 49.99, 'completed'),
  (2, 1, 39.99, 'completed'),
  (3, 2, 59.99, 'refunded'),
  (4, 3, 29.99, 'completed'),
  (5, 3, 19.99, 'pending');

-- ── 1. INNER JOIN — only rows matching on both sides ─────
-- Dana (no orders) disappears entirely
SELECT c.name, o.id AS order_id, o.amount
FROM customers c
INNER JOIN orders o ON o.customer_id = c.id;

-- ── 2. LEFT JOIN — keep all customers, NULLs when no match ─
SELECT c.name, o.id AS order_id, o.amount
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
ORDER BY c.id;
-- Dana appears once, with order_id = NULL

-- ── 3. GROUP BY + aggregates ─────────────────────────────
-- COUNT(*) counts rows; COUNT(o.id) counts non-NULL matches.
SELECT
  c.name,
  COUNT(o.id)                AS order_count,
  COALESCE(SUM(o.amount), 0) AS total_spent,   -- SUM of no rows is NULL
  ROUND(AVG(o.amount), 2)    AS avg_order
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY total_spent DESC;

-- ── 4. HAVING — filter AFTER aggregation ────────────────
-- WHERE filters rows before grouping; HAVING filters groups after.
SELECT
  c.name,
  COUNT(o.id)   AS completed_orders,
  SUM(o.amount) AS revenue
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'completed'      -- row filter first
GROUP BY c.id, c.name
HAVING SUM(o.amount) > 50         -- group filter second
ORDER BY revenue DESC;

-- ── 5. Condition in ON vs WHERE (subtle LEFT JOIN trap) ─
-- Putting the right-table filter in WHERE silently kills the LEFT JOIN:
SELECT c.name, o.amount
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'completed';     -- ❌ drops Dana

-- Put it in the ON clause to preserve LEFT JOIN semantics:
SELECT c.name, o.amount
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id AND o.status = 'completed';   -- ✅ keeps Dana

-- ── 6. GROUPING SETS — subtotals + grand total ──────────
SELECT
  c.country,
  o.status,
  COUNT(*)      AS order_count,
  SUM(o.amount) AS revenue
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY GROUPING SETS ((c.country), (o.status), ());
-- the empty () set produces the grand-total row

-- ── 7. FILTER clause — conditional aggregates ───────────
SELECT
  c.name,
  COUNT(*) FILTER (WHERE o.status = 'completed') AS completed,
  COUNT(*) FILTER (WHERE o.status = 'pending')   AS pending,
  COUNT(*) FILTER (WHERE o.status = 'refunded')  AS refunded
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name;
`,
      },
    ],
  },

  cte_recursive: {
    label: "CTEs & Recursion",
    description: "Common table expressions and recursive tree traversal",
    files: [
      {
        id: "main",
        name: "cte-recursive",
        ext: "sql",
        content: `-- ── CTEs (WITH) & Recursive CTEs ────────────────────────

-- ── 1. Basic CTE — readable, reusable subquery ──────────
WITH completed_orders AS (
  SELECT * FROM orders WHERE status = 'completed'
),
customer_totals AS (
  SELECT customer_id, SUM(amount) AS total
  FROM completed_orders
  GROUP BY customer_id
)
SELECT c.name, ct.total
FROM customers c
JOIN customer_totals ct ON ct.customer_id = c.id
ORDER BY ct.total DESC;
-- CTEs read top-to-bottom, like building blocks

-- ── 2. CTE referenced twice (avoids a rescan) ───────────
WITH monthly AS (
  SELECT date_trunc('month', created_at) AS month, SUM(amount) AS revenue
  FROM orders
  WHERE status = 'completed'
  GROUP BY 1
)
SELECT
  month,
  revenue,
  revenue - LAG(revenue) OVER (ORDER BY month) AS month_over_month
FROM monthly
ORDER BY month;

-- ── 3. Data-modifying CTE — write inside a WITH ─────────
WITH archived AS (
  DELETE FROM orders
  WHERE status = 'refunded'
  RETURNING id, customer_id, amount
)
INSERT INTO refund_audit (order_id, customer_id, amount)
SELECT id, customer_id, amount FROM archived;

-- ── 4. Recursive CTE — tree traversal ───────────────────
CREATE TABLE employees (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  manager_id INTEGER REFERENCES employees(id)
);

INSERT INTO employees VALUES
  (1, 'CEO',         NULL),
  (2, 'VP Eng',      1),
  (3, 'VP Sales',    1),
  (4, 'Eng Lead A',  2),
  (5, 'Eng Lead B',  2),
  (6, 'Engineer X',  4),
  (7, 'Engineer Y',  4),
  (8, 'Sales Rep Z', 3);

-- Walk the tree downward from the root
WITH RECURSIVE org_chart AS (
  -- Anchor member: the root(s)
  SELECT id, name, manager_id, 0 AS depth, name::TEXT AS path
  FROM employees
  WHERE manager_id IS NULL

  UNION ALL

  -- Recursive member: join children onto the working set
  SELECT e.id, e.name, e.manager_id, oc.depth + 1,
         oc.path || ' > ' || e.name
  FROM employees e
  JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT
  repeat('  ', depth) || name AS org_tree,
  depth,
  path
FROM org_chart
ORDER BY path;

-- ── 5. Cycle guard — stop if a node is revisited ────────
WITH RECURSIVE walk AS (
  SELECT id, manager_id, ARRAY[id] AS visited
  FROM employees WHERE manager_id IS NULL
  UNION ALL
  SELECT e.id, e.manager_id, w.visited || e.id
  FROM employees e
  JOIN walk w ON e.manager_id = w.id
  WHERE NOT e.id = ANY(w.visited)
)
SELECT id, visited FROM walk;

-- ── 6. Bottom-up: a node's full chain of managers ──────
WITH RECURSIVE chain AS (
  SELECT id, name, manager_id FROM employees WHERE id = 7  -- Engineer Y
  UNION ALL
  SELECT e.id, e.name, e.manager_id
  FROM employees e
  JOIN chain c ON e.id = c.manager_id
)
SELECT name FROM chain;
-- Engineer Y → Eng Lead A → VP Eng → CEO
`,
      },
    ],
  },

  partitioning: {
    label: "Table Partitioning",
    description: "Range partitioning and partition pruning with EXPLAIN",
    files: [
      {
        id: "main",
        name: "partitioning",
        ext: "sql",
        content: `-- ── Table Partitioning & Pruning ────────────────────────
-- Split a huge table into smaller physical chunks the planner
-- can skip (prune) at query time.

-- ── 1. Range partitioning by time ───────────────────────
CREATE TABLE events (
  id         BIGSERIAL,
  event_type TEXT NOT NULL,
  payload    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)      -- partition key must be in the PK
) PARTITION BY RANGE (created_at);

-- One partition per month
CREATE TABLE events_2024_01 PARTITION OF events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE events_2024_02 PARTITION OF events
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
CREATE TABLE events_2024_03 PARTITION OF events
  FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');

-- Inserts are routed automatically to the correct partition
INSERT INTO events (event_type, created_at) VALUES
  ('click', '2024-01-15'),
  ('view',  '2024-02-20'),
  ('click', '2024-03-05');

-- ── 2. Partition pruning ────────────────────────────────
-- The planner reads ONLY the matching partition
EXPLAIN SELECT * FROM events
WHERE created_at >= '2024-02-01' AND created_at < '2024-03-01';
-- Plan: Append -> Seq Scan on events_2024_02
-- (Jan and Mar partitions are PRUNED — never read)

-- Without a filter on the partition key, nothing can be pruned:
EXPLAIN SELECT * FROM events WHERE event_type = 'click';
-- Plan: Append -> scans ALL partitions

-- ── 3. Indexes on a partitioned table ───────────────────
-- Creating an index on the parent propagates to every partition.
CREATE INDEX idx_events_type ON events (event_type);
-- You can also index just a single hot partition.

-- ── 4. List partitioning — discrete values ──────────────
CREATE TABLE logs (
  id      BIGSERIAL,
  level   TEXT NOT NULL,
  message TEXT NOT NULL
) PARTITION BY LIST (level);

CREATE TABLE logs_error   PARTITION OF logs FOR VALUES IN ('error', 'fatal');
CREATE TABLE logs_warn    PARTITION OF logs FOR VALUES IN ('warn');
CREATE TABLE logs_default PARTITION OF logs DEFAULT;   -- everything else

EXPLAIN SELECT * FROM logs WHERE level = 'error';
-- Plan: only logs_error is scanned

-- ── 5. Hash partitioning — even spread ──────────────────
CREATE TABLE sessions (
  id      UUID NOT NULL,
  user_id BIGINT NOT NULL,
  data    JSONB
) PARTITION BY HASH (id);

CREATE TABLE sessions_p0 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 0);
CREATE TABLE sessions_p1 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 1);
CREATE TABLE sessions_p2 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 2);
CREATE TABLE sessions_p3 PARTITION OF sessions FOR VALUES WITH (MODULUS 4, REMAINDER 3);
-- Row lands in (hash(id) % 4); balanced, but no range pruning.

-- ── 6. Dropping old data is instant (no VACUUM) ─────────
-- Instead of DELETE (bloats the table, needs VACUUM):
DELETE FROM events WHERE created_at < '2024-01-01';

-- Just drop the old partition:
DROP TABLE events_2024_01;   -- instant, frees space immediately

-- ── 7. Attaching a new partition (online) ───────────────
-- Load a standalone table first, then attach it:
CREATE TABLE events_2024_04 (LIKE events INCLUDING ALL);
ALTER TABLE events ATTACH PARTITION events_2024_04
  FOR VALUES FROM ('2024-04-01') TO ('2024-05-01');
`,
      },
    ],
  },
};

// ─── Mode: API Design workbench ───────────────────────────────────────────────
export const API_TEMPLATES: Record<string, BackendTemplate> = {
  rest_patterns: {
    label: "REST API Patterns",
    description: "Resource design, versioning, error schemas, pagination",
    files: [
      {
        id: "main",
        name: "rest-patterns",
        ext: "js",
        content: `// ── Production REST API Patterns ─────────────────────────
// Express + Zod for validation — patterns that scale

const express = require('express');
const { z } = require('zod');

const app = express();
app.use(express.json());

// ── 1. Consistent error response schema ──────────────────
class AppError extends Error {
  constructor(message, statusCode, code, details) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// RFC 7807 Problem Details
function errorResponse(res, err) {
  const status = err.statusCode ?? 500;
  const isDev = process.env.NODE_ENV !== 'production';
  return res.status(status).json({
    type:    \`https://api.example.com/errors/\${err.code ?? 'internal'}\`,
    title:   status >= 500 ? 'Internal Server Error' : err.message,
    status,
    detail:  isDev ? err.message : undefined,
    code:    err.code,
    errors:  err.details,  // field-level validation errors
    traceId: res.locals.traceId ?? 'unknown',
  });
}

// ── 2. Validation middleware with Zod ────────────────────
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body:   req.body,
    params: req.params,
    query:  req.query,
  });

  if (!result.success) {
    const details = result.error.issues.map(i => ({
      field:   i.path.join('.'),
      message: i.message,
      code:    i.code,
    }));
    return errorResponse(res, new AppError('Validation failed', 422, 'VALIDATION_ERROR', details));
  }

  req.validated = result.data;
  next();
};

// ── 3. User resource — full CRUD with patterns ───────────
const CreateUserSchema = z.object({
  body: z.object({
    email:    z.string().email().max(254).toLowerCase(),
    name:     z.string().min(1).max(100).trim(),
    role:     z.enum(['user', 'editor', 'admin']).default('user'),
  }),
});

const GetUserSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
});

const ListUsersSchema = z.object({
  query: z.object({
    limit:  z.coerce.number().int().min(1).max(100).default(20),
    after:  z.string().optional(),   // cursor
    sort:   z.enum(['created_at', 'name', 'email']).default('created_at'),
    order:  z.enum(['asc', 'desc']).default('desc'),
    search: z.string().max(100).optional(),
  }),
});

// ── 4. Cursor pagination helper ──────────────────────────
function encodeCursor(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}
function decodeCursor(cursor) {
  try { return JSON.parse(Buffer.from(cursor, 'base64url').toString()); }
  catch { throw new AppError('Invalid cursor', 400, 'INVALID_CURSOR'); }
}

// ── 5. Routes ─────────────────────────────────────────────
// Async handler wrapper — no try/catch in every route
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// GET /v1/users — list with cursor pagination
app.get('/v1/users', validate(ListUsersSchema), asyncHandler(async (req, res) => {
  const { limit, after, sort, order } = req.validated.query;
  
  let cursor = null;
  if (after) cursor = decodeCursor(after);

  // Simulate DB query
  const users = Array.from({ length: limit + 1 }, (_, i) => ({
    id:         crypto.randomUUID(),
    name:       \`User \${i + 1 + (cursor?.offset ?? 0)}\`,
    email:      \`user\${i + 1}@example.com\`,
    role:       'user',
    created_at: new Date().toISOString(),
  }));

  const hasMore = users.length > limit;
  const items   = hasMore ? users.slice(0, limit) : users;
  const nextCursor = hasMore
    ? encodeCursor({ offset: (cursor?.offset ?? 0) + limit, sort, order })
    : null;

  res.json({
    data: items,
    pagination: {
      hasMore,
      nextCursor,
      limit,
    },
  });
}));

// POST /v1/users — create
app.post('/v1/users', validate(CreateUserSchema), asyncHandler(async (req, res) => {
  const { email, name, role } = req.validated.body;

  // Check duplicate
  // if (await db.users.findByEmail(email)) {
  //   throw new AppError('Email already registered', 409, 'EMAIL_CONFLICT');
  // }

  const user = { id: crypto.randomUUID(), email, name, role, created_at: new Date().toISOString() };
  // await db.users.create(user);

  res.status(201)
    .setHeader('Location', \`/v1/users/\${user.id}\`)
    .json({ data: user });
}));

// GET /v1/users/:id
app.get('/v1/users/:id', validate(GetUserSchema), asyncHandler(async (req, res) => {
  const { id } = req.validated.params;
  // const user = await db.users.findById(id);
  // if (!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  const user = { id, name: 'Alice', email: 'alice@example.com', role: 'admin' };
  res.json({ data: user });
}));

// ── 6. Central error handler ─────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  errorResponse(res, err);
});

// ── 7. Demo the API ──────────────────────────────────────
const crypto = require('crypto');
console.log('=== REST API Pattern Demo ===\\n');

// ── Simulate real HTTP requests through the express handler ──
// Each res.json() response renders as a designed table in the panel above.
function simulate(method, url, opts = {}) {
  app(
    { method, url, params: opts.params ?? {}, query: opts.query ?? {}, headers: {}, body: opts.body ?? {} },
    (err) => { if (err) console.error('  [sim] request error:', err.message); }
  );
}

// Run after the module body so \`crypto\` is initialised.
setTimeout(() => {
  simulate('GET',  '/v1/users', { query: { limit: 3 } });                       // 200 + list
  simulate('POST', '/v1/users', { body: { email: 'alice@example.com', name: 'Alice', role: 'admin' } }); // 201
  simulate('GET',  '/v1/users/abc', { params: { id: 'abc' } });                  // 422 invalid uuid
}, 0);

// Simulate validation
const testCases = [
  { body: { email: 'alice@example.com', name: 'Alice' }, label: 'Valid user' },
  { body: { email: 'not-an-email', name: '' }, label: 'Invalid: bad email + empty name' },
  { body: { email: 'bob@example.com', name: 'Bob', role: 'superadmin' }, label: 'Invalid: bad role' },
];

testCases.forEach(({ body, label }) => {
  const result = CreateUserSchema.safeParse({ body });
  console.log(\`[\${label}]: \${result.success ? '✅ Valid' : '❌ ' + result.error.issues.map(i => i.message).join(', ')}\`);
});

console.log('\\nCursor encoding:');
const cursor = encodeCursor({ offset: 20, sort: 'created_at', order: 'desc' });
console.log('Encoded:', cursor);
console.log('Decoded:', decodeCursor(cursor));
`,
      },
    ],
  },

  auth_middleware: {
    label: "Auth & JWT Middleware",
    description: "JWT validation, refresh rotation, RBAC middleware",
    files: [
      {
        id: "main",
        name: "auth-middleware",
        ext: "js",
        content: `// ── Auth Middleware — JWT + RBAC ──────────────────────────
// Standalone implementation for understanding the patterns

const crypto = require('crypto');

// ── 1. JWT implementation (without jsonwebtoken pkg) ─────
// Understanding how JWT works internally

class JWTManager {
  constructor(privateKey, publicKey) {
    this.privateKey = privateKey;
    this.publicKey  = publicKey;
  }

  sign(payload, expiresIn = '15m') {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.parseExpiry(expiresIn);

    const header  = { alg: 'HS256', typ: 'JWT' };
    const claims  = { ...payload, iat: now, exp };

    const headerB64  = this.base64url(JSON.stringify(header));
    const payloadB64 = this.base64url(JSON.stringify(claims));
    const signature  = this.sign_hmac(\`\${headerB64}.\${payloadB64}\`);

    return \`\${headerB64}.\${payloadB64}.\${signature}\`;
  }

  verify(token) {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Malformed token');

    const [headerB64, payloadB64, signature] = parts;
    
    // Verify signature first (timing-safe!)
    const expected = this.sign_hmac(\`\${headerB64}.\${payloadB64}\`);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    // Verify expiry
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  }

  sign_hmac(data) {
    return crypto.createHmac('sha256', this.privateKey)
      .update(data).digest('base64url');
  }

  base64url(str) {
    return Buffer.from(str).toString('base64url');
  }

  parseExpiry(expiry) {
    const units = { s: 1, m: 60, h: 3600, d: 86400 };
    const match = expiry.match(/^(\\d+)([smhd])$/);
    if (!match) throw new Error('Invalid expiry format');
    return parseInt(match[1]) * units[match[2]];
  }
}

// ── 2. Refresh token store (in-memory for demo) ───────────
class RefreshTokenStore {
  constructor() { this.tokens = new Map(); }

  create(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    this.tokens.set(hash, {
      userId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
    return token; // return plaintext, store hash
  }

  consume(token) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const stored = this.tokens.get(hash);
    if (!stored) return null; // invalid or already used
    this.tokens.delete(hash); // rotation — invalidate on use
    if (stored.expiresAt < Date.now()) return null; // expired
    return stored;
  }
}

// ── 3. RBAC — Role Based Access Control ──────────────────
const PERMISSIONS = {
  'user': [
    'profile:read', 'profile:update',
    'posts:read', 'posts:create',
  ],
  'editor': [
    'profile:read', 'profile:update',
    'posts:read', 'posts:create', 'posts:update',
    'comments:moderate',
  ],
  'admin': [
    'profile:read', 'profile:update',
    'posts:read', 'posts:create', 'posts:update', 'posts:delete',
    'users:read', 'users:update', 'users:delete',
    'comments:moderate',
    'analytics:read',
  ],
};

function hasPermission(role, permission) {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

// ── 4. Demo ───────────────────────────────────────────────
const SECRET = 'my-secret-key-at-least-32-chars-long!';
const jwt = new JWTManager(SECRET);
const store = new RefreshTokenStore();

console.log('=== JWT & RBAC Demo ===\\n');

// Issue tokens
const userId = 'user-123';
const userRole = 'editor';
const accessToken = jwt.sign({ sub: userId, role: userRole }, '15m');
const refreshToken = store.create(userId);

const [h64, p64] = accessToken.split('.');
const header = JSON.parse(Buffer.from(h64, 'base64url').toString());
const claims = JSON.parse(Buffer.from(p64, 'base64url').toString());

console.table('Issued tokens', [
  {
    token: 'access (JWT)', algorithm: header.alg + '/' + header.typ,
    subject: claims.sub, role: claims.role,
    issued_at: new Date(claims.iat * 1000).toISOString(),
    expires_at: new Date(claims.exp * 1000).toISOString(),
  },
  {
    token: 'refresh (opaque)', algorithm: 'random 256-bit',
    subject: userId, role: '—',
    issued_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
  },
]);

// Verify the access token (signature is checked before the payload is trusted)
try {
  const payload = jwt.verify(accessToken);
  console.log('\\nVerified payload:', payload);
} catch (e) {
  console.error('Verification failed:', e.message);
}

// RBAC checks
const checks = ['posts:create', 'posts:delete', 'users:read', 'comments:moderate'];
console.table('RBAC checks (role: ' + userRole + ')',
  checks.map(perm => ({ permission: perm, allowed: hasPermission(userRole, perm) })));

// Refresh token rotation — a redeemed token must never work twice
const consumed = store.consume(refreshToken);
const reused = store.consume(refreshToken);
console.table('Refresh token rotation', [
  { attempt: 'first redemption', outcome: consumed ? 'accepted' : 'rejected', valid: !!consumed },
  { attempt: 'replay same token', outcome: reused ? 'accepted' : 'rejected', valid: !reused },
]);

// Tampered token
const tampered = accessToken.slice(0, -5) + 'XXXXX';
let tamperAccepted = true, tamperReason = '';
try { jwt.verify(tampered); }
catch (e) { tamperAccepted = false; tamperReason = e.message; }
console.table('Tampered token detection', [
  { case: 'signature modified', accepted: tamperAccepted, reason: tamperReason || 'BUG — accepted!' },
]);
`,
      },
    ],
  },

  idempotency: {
    label: "Idempotency Keys",
    description: "Safe retries for payment and mutation APIs",
    files: [
      {
        id: "main",
        name: "idempotency",
        ext: "js",
        content: `// ── Idempotency Key Pattern ───────────────────────────────
// Ensures payment/mutation APIs are safe to retry
// Critical for: payments, emails, inventory updates

// ── 1. In-memory idempotency store (use Redis in production) ─
class IdempotencyStore {
  constructor(ttlMs = 24 * 60 * 60 * 1000) { // 24h default
    this.store = new Map();
    this.ttl = ttlMs;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  // tryLock returns false if key already in progress (prevents concurrent duplicate)
  tryLock(key) {
    if (this.store.has(key)) return false;
    this.store.set(key, { status: 'processing', expiresAt: Date.now() + this.ttl });
    return true;
  }

  complete(key, status, response) {
    this.store.set(key, {
      status: 'done',
      httpStatus: status,
      response,
      expiresAt: Date.now() + this.ttl,
    });
  }

  fail(key) {
    this.store.delete(key); // allow retry on failure
  }
}

// ── 2. Payment processor (simulated) ─────────────────────
class PaymentProcessor {
  constructor() {
    this.idempotency = new IdempotencyStore();
    this.payments = new Map();
  }

  async charge(idempotencyKey, { userId, amount, currency }) {
    // Validate key
    if (!idempotencyKey || idempotencyKey.length < 16) {
      throw { status: 400, body: { error: 'Idempotency-Key header required (min 16 chars)' } };
    }

    // Check for existing result
    const existing = this.idempotency.get(idempotencyKey);
    if (existing?.status === 'done') {
      console.log(\`  [Idempotency] Cache hit for \${idempotencyKey.slice(0, 8)}... — returning stored result\`);
      return { httpStatus: existing.httpStatus, body: existing.response, replayed: true };
    }
    if (existing?.status === 'processing') {
      throw { status: 409, body: { error: 'A request with this idempotency key is already in progress' } };
    }

    // Lock this key — prevent concurrent duplicates
    if (!this.idempotency.tryLock(idempotencyKey)) {
      throw { status: 409, body: { error: 'Concurrent request detected' } };
    }

    try {
      // Simulate payment processing (10% failure rate)
      if (Math.random() < 0.1) throw new Error('Payment gateway timeout');
      
      await new Promise(r => setTimeout(r, 50)); // simulate latency

      const payment = {
        id:         \`pay_\${Date.now()}\`,
        userId, amount, currency,
        status:     'succeeded',
        created_at: new Date().toISOString(),
      };
      this.payments.set(payment.id, payment);

      // Store result for future retries
      this.idempotency.complete(idempotencyKey, 201, payment);
      return { httpStatus: 201, body: payment, replayed: false };

    } catch (err) {
      // IMPORTANT: delete lock on failure — allow client to retry
      this.idempotency.fail(idempotencyKey);
      throw { status: 502, body: { error: err.message } };
    }
  }
}

// ── 3. Demo ───────────────────────────────────────────────
async function demo() {
  console.log('=== Idempotency Key Demo ===\\n');

  const processor = new PaymentProcessor();
  const key    = crypto.randomUUID().replace(/-/g, ''); // 32-char unique key
  const newKey = crypto.randomUUID().replace(/-/g, '');
  const payload = { userId: 'user-123', amount: 4999, currency: 'USD' };

  const rows = [];
  async function attempt(label, idemKey) {
    try {
      const r = await processor.charge(idemKey, payload);
      rows.push({ request: label, idempotency_key: idemKey.slice(0, 10) + '…',
        http_status: r.httpStatus, payment_id: r.body.id, replayed: r.replayed });
    } catch (e) {
      rows.push({ request: label, idempotency_key: idemKey.slice(0, 10) + '…',
        http_status: e.status, payment_id: '—', replayed: false, note: e.body.error });
    }
  }

  await attempt('1 · first attempt', key);
  await attempt('2 · retry, same key', key);
  await attempt('3 · new key', newKey);

  console.table('Payment attempts', rows);
  console.log('\\nRetrying with the same key returns the same payment id (no double charge); a new key creates a new payment.');
}

const crypto = require('crypto');
demo().catch(console.error);
`,
      },
    ],
  },
  pagination_filtering: {
    label: "Pagination & Filtering",
    description: "Cursor vs offset pagination with validation and sorting",
    files: [
      {
        id: "main",
        name: "pagination-filtering",
        ext: "js",
        content: `// ── Pagination & Filtering ────────────────────────────
// Offset vs cursor pagination, plus validated filtering/sorting.

// ── 1. Seed data ────────────────────────────────────────
const users = [];
const NAMES = ['Alice', 'Bob', 'Chidi', 'Dana', 'Eve', 'Femi', 'Grace'];
for (let i = 0; i < 25; i++) {
  users.push({
    id:         'u' + String(i + 1).padStart(3, '0'),
    name:       NAMES[i % NAMES.length] + ' ' + (i + 1),
    email:      \`u\${i + 1}@example.com\`,
    age:        20 + (i * 7) % 40,
    created_at: new Date(Date.UTC(2024, 0, 1 + i)).toISOString(),
  });
}

// ── 2. Query validation ─────────────────────────────────
class QueryError extends Error {}

function parseParams(query) {
  const errors = [];

  const limit = query.limit === undefined ? 10 : Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    errors.push('limit must be an integer between 1 and 50');
  }

  const sort = query.sort ?? 'created_at';
  if (!['created_at', 'name', 'age'].includes(sort)) {
    errors.push('sort must be one of: created_at, name, age');
  }
  const order = query.order ?? 'asc';
  if (!['asc', 'desc'].includes(order)) errors.push('order must be asc or desc');

  const minAge = query.minAge === undefined ? undefined : Number(query.minAge);
  if (minAge !== undefined && (!Number.isFinite(minAge) || minAge < 0)) {
    errors.push('minAge must be a non-negative number');
  }

  if (errors.length) throw new QueryError(errors.join('; '));
  return { limit, sort, order, minAge, search: query.search };
}

// ── 3. Filters + sort ───────────────────────────────────
function applyFilters(list, { minAge, search }) {
  return list.filter(u => {
    if (minAge !== undefined && u.age < minAge) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
}

function applySort(list, sort, order) {
  const dir = order === 'desc' ? -1 : 1;
  return [...list].sort((a, b) => {
    if (a[sort] < b[sort]) return -1 * dir;
    if (a[sort] > b[sort]) return 1 * dir;
    return 0;
  });
}

// ── 4. Offset pagination ────────────────────────────────
function offsetPage(all, { limit, offset = 0 }) {
  const page = all.slice(offset, offset + limit);
  const nextOffset = offset + limit < all.length ? offset + limit : null;
  return {
    data: page,
    pagination: { mode: 'offset', total: all.length, offset, limit, nextOffset },
  };
}

// ── 5. Cursor (keyset) pagination ───────────────────────
// Cursor points at the LAST item returned — stable under inserts.
function encodeCursor(user) {
  return btoa(JSON.stringify({ id: user.id }));
}

function cursorPage(all, { limit, cursor = null }) {
  let start = 0;
  if (cursor) {
    let decoded;
    try { decoded = JSON.parse(atob(cursor)); }
    catch { throw new QueryError('invalid cursor'); }
    const idx = all.findIndex(u => u.id === decoded.id);
    if (idx === -1) throw new QueryError('invalid cursor');
    start = idx + 1;
  }
  const page = all.slice(start, start + limit);
  const last = page[page.length - 1];
  const hasMore = start + limit < all.length;
  return {
    data: page,
    pagination: {
      mode: 'cursor',
      limit,
      hasMore,
      nextCursor: hasMore && last ? encodeCursor(last) : null,
    },
  };
}

// ── 6. Demo ─────────────────────────────────────────────
const base = applySort(applyFilters(users, {}), 'created_at', 'asc');

// Offset: jump straight to page 3
const p3 = offsetPage(base, { limit: 5, offset: 10 });

// Cursor: walk two pages (the cursor points at the last row returned)
const c1 = cursorPage(base, { limit: 5 });
const c2 = cursorPage(base, { limit: 5, cursor: c1.pagination.nextCursor });

// Filtering + sorting
const filtered = applyFilters(users, { minAge: 40, search: 'a' });
const filteredSorted = applySort(filtered, 'age', 'desc');

console.table('Offset vs cursor pagination', [
  { mode: 'offset', page: 3, limit: 5, returned: p3.data.map(u => u.id).join(', '),
    total: p3.pagination.total, next: 'offset ' + p3.pagination.nextOffset },
  { mode: 'cursor', page: 1, limit: 5, returned: c1.data.map(u => u.id).join(', '),
    total: users.length, next: c1.pagination.nextCursor ? 'nextCursor' : '—' },
  { mode: 'cursor', page: 2, limit: 5, returned: c2.data.map(u => u.id).join(', '),
    total: users.length, next: c2.pagination.nextCursor ? 'nextCursor' : '—' },
]);

console.table('Filtered results (age >= 40, name ~ "a")',
  filteredSorted.map(u => ({ id: u.id, name: u.name, age: u.age, email: u.email })));

console.table('Rejected query params',
  [{ limit: '999' }, { sort: 'password' }, { order: 'sideways' }].map(bad => {
    try { parseParams(bad); return { params: JSON.stringify(bad), accepted: true, error: '' }; }
    catch (e) { return { params: JSON.stringify(bad), accepted: false, error: e.message }; }
  }));
`,
      },
    ],
  },

  versioning: {
    label: "API Versioning",
    description: "URL, header, and media-type versioning with a shim",
    files: [
      {
        id: "main",
        name: "versioning",
        ext: "js",
        content: `// ── API Versioning Strategies ─────────────────────────
// URL path vs custom header vs media-type negotiation.

// ── 1. Two versions of the "user" representation ────────
// v1 returns \`name\`; v2 splits it into first/last (breaking change)
const USER = { id: 'u1', firstName: 'Alice', lastName: 'Okafor', email: 'alice@example.com' };

const serializers = {
  v1: (u) => ({ id: u.id, name: \`\${u.firstName} \${u.lastName}\`, email: u.email }),
  v2: (u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email }),
};

// ── 2. Detect the requested version ─────────────────────
// Supports all three common styles, in priority order.
function detectVersion(req) {
  // (a) URL path: /api/v2/users
  const pathMatch = /\\/v(\\d+)\\//.exec(req.path ?? '');
  if (pathMatch) return { version: 'v' + pathMatch[1], source: 'url' };

  // (b) Custom header: X-API-Version: 2
  const hdr = req.headers?.['x-api-version'];
  if (hdr) return { version: 'v' + String(hdr).replace(/^v/i, ''), source: 'header' };

  // (c) Media type: Accept: application/vnd.example.v2+json
  const accept = req.headers?.['accept'] ?? '';
  const media = /vnd\\.example\\.v(\\d+)\\+json/i.exec(accept);
  if (media) return { version: 'v' + media[1], source: 'media-type' };

  // (d) Default to the latest stable version
  return { version: 'v2', source: 'default' };
}

// ── 3. Version-compatibility shim ───────────────────────
// Normalise old input shapes forward into the current shape,
// instead of branching on the version everywhere.
function normalizeCreateUser(body, version) {
  if (version === 'v1' && body.name && !body.firstName) {
    const [first, ...rest] = String(body.name).split(' ');
    return { firstName: first, lastName: rest.join(' '), email: body.email };
  }
  return { firstName: body.firstName, lastName: body.lastName, email: body.email };
}

// ── 4. Handlers ─────────────────────────────────────────
function getUser(req) {
  const { version, source } = detectVersion(req);
  const serializer = serializers[version];
  if (!serializer) {
    return { status: 400, body: { error: \`Unsupported API version: \${version}\` } };
  }
  return {
    status: 200,
    headers: { 'X-API-Version': version, 'Vary': 'Accept, X-API-Version' },
    body: { version, source, data: serializer(USER) },
  };
}

function createUser(req) {
  const { version } = detectVersion(req);
  const normalized = normalizeCreateUser(req.body ?? {}, version);
  if (!normalized.email) return { status: 422, body: { error: 'email required' } };
  return { status: 201, body: { version, data: { id: 'u9', ...normalized } } };
}

// ── 5. Demo ─────────────────────────────────────────────
const getCases = [
  { label: 'URL path',      req: { path: '/api/v1/users/u1', headers: {} } },
  { label: 'Custom header', req: { path: '/api/users/u1', headers: { 'x-api-version': '1' } } },
  { label: 'Media type',    req: { path: '/api/users/u1', headers: { accept: 'application/vnd.example.v1+json' } } },
  { label: 'No version',    req: { path: '/api/users/u1', headers: {} } },
  { label: 'Unknown (v9)',  req: { path: '/api/v9/users/u1', headers: {} } },
];

console.table('GET /users/:id — version negotiation', getCases.map(c => {
  const res = getUser(c.req);
  return {
    request: c.label,
    status: res.status,
    detected: res.body.version ?? '—',
    via: res.body.source ?? '—',
    response_shape: res.body.data ? Object.keys(res.body.data).join(', ') : res.body.error,
  };
}));

// Compatibility shim: a v1 client still posts a single \`name\`
const v1 = createUser({ path: '/api/v1/users', body: { name: 'Bob Stone', email: 'bob@example.com' } });
const v2 = createUser({ path: '/api/v2/users', body: { firstName: 'Dana', lastName: 'Lee', email: 'dana@example.com' } });

console.table('POST /users — compatibility shim', [
  { client: 'v1', sent: 'name: "Bob Stone"',        status: v1.status, stored: JSON.stringify(v1.body.data) },
  { client: 'v2', sent: 'firstName / lastName',     status: v2.status, stored: JSON.stringify(v2.body.data) },
]);
`,
      },
    ],
  },

  webhooks_signature: {
    label: "Webhook Signature Verify",
    description: "Verify HMAC signatures and handle webhooks idempotently",
    files: [
      {
        id: "main",
        name: "webhooks-signature",
        ext: "js",
        content: `// ── Webhook Receiving: Verify + Idempotency ───────────
// Never trust a webhook body until you verify its HMAC signature,
// then dedupe by event id because providers retry deliveries.

const crypto = require('crypto');

const SECRET = 'whsec_demo_shared_secret';

// ── 1. Sender side — sign the RAW body ──────────────────
// IMPORTANT: sign the raw bytes, before any JSON re-serialisation.
function sign(rawBody, secret = SECRET) {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('base64url');
}

// ── 2. Constant-time comparison ─────────────────────────
function timingSafeEqualStr(a, b) {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// ── 3. Verification ─────────────────────────────────────
function verifySignature(rawBody, header, secret = SECRET) {
  if (!header) return { ok: false, reason: 'missing signature header' };
  // Header format: "sha256=<sig>"
  const parts = header.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return { ok: false, reason: 'malformed signature header' };
  }
  const expected = sign(rawBody, secret);
  if (!timingSafeEqualStr(parts[1], expected)) {
    return { ok: false, reason: 'signature mismatch' };
  }
  return { ok: true };
}

// ── 4. Idempotent receiver ──────────────────────────────
class WebhookReceiver {
  constructor() {
    this.processed = new Map();   // eventId -> result
    this.handledCount = 0;
  }

  handle({ rawBody, signature }) {
    const check = verifySignature(rawBody, signature);
    if (!check.ok) return { status: 401, body: { error: check.reason } };

    let event;
    try { event = JSON.parse(rawBody); }
    catch { return { status: 400, body: { error: 'invalid JSON' } }; }

    // Idempotency: the same event id must not be processed twice
    if (this.processed.has(event.id)) {
      return { status: 200, body: { idempotent: true, ...this.processed.get(event.id) } };
    }

    // ---- do the real work here (charge, email, etc.) ----
    this.handledCount++;
    const result = { received: true, type: event.type, handled: this.handledCount };
    this.processed.set(event.id, result);
    return { status: 200, body: result };
  }
}

// ── 5. Demo ─────────────────────────────────────────────
const raw = JSON.stringify({
  id:   'evt_123',
  type: 'payment.succeeded',
  data: { amount: 4999, currency: 'USD' },
});

const goodSig   = 'sha256=' + sign(raw);
const badFormat = 'v1=whatever';
const attacker  = 'sha256=' + sign(raw, 'wrong_secret');

const receiver = new WebhookReceiver();

const scenarios = [
  { scenario: 'valid signature',          signature: goodSig,   body: raw },
  { scenario: 'tampered body',            signature: goodSig,   body: raw + 'x' },
  { scenario: 'malformed header',         signature: badFormat, body: raw },
  { scenario: 'wrong secret',             signature: attacker,  body: raw },
  { scenario: 'provider retry (same id)', signature: goodSig,   body: raw },
];

console.table('Webhook handling', scenarios.map(s => {
  const res = receiver.handle({ rawBody: s.body, signature: s.signature });
  return {
    scenario: s.scenario,
    status: res.status,
    accepted: res.status === 200,
    idempotent: !!res.body.idempotent,
    detail: res.body.error ?? res.body.type ?? 'ok',
  };
}));

console.log('\\nEvent evt_123 was processed exactly', receiver.handledCount, 'time(s) — retries are deduped by event id.');
`,
      },
    ],
  },
};

// ─── Mode: Architecture / System Design ───────────────────────────────────────
export const ARCHITECTURE_TEMPLATES: Record<string, BackendTemplate> = {
  cqrs: {
    label: "CQRS + Event Sourcing",
    description: "Separate read/write models, event store, projections",
    files: [
      {
        id: "main",
        name: "cqrs",
        ext: "js",
        content: `// ── CQRS + Event Sourcing Pattern ─────────────────────────
// Command Query Responsibility Segregation with event store

const { EventEmitter } = require('events');

// ── 1. Event Store — append-only log of facts ─────────────
class EventStore extends EventEmitter {
  constructor() {
    super();
    this.events = [];  // In production: PostgreSQL or EventStoreDB
    this.subscribers = new Map();
  }

  async append(aggregateId, eventType, data, expectedVersion = -1) {
    const currentVersion = this.getVersion(aggregateId);

    // Optimistic concurrency control
    if (expectedVersion !== -1 && currentVersion !== expectedVersion) {
      throw new Error(\`Concurrency conflict: expected v\${expectedVersion}, got v\${currentVersion}\`);
    }

    const event = {
      id:          \`evt-\${Date.now()}-\${Math.random().toString(36).slice(2,7)}\`,
      aggregateId,
      eventType,
      data,
      version:     currentVersion + 1,
      timestamp:   new Date().toISOString(),
    };

    this.events.push(event);
    this.emit('event', event);  // Notify all projections
    return event;
  }

  getEvents(aggregateId) {
    return this.events.filter(e => e.aggregateId === aggregateId);
  }

  getVersion(aggregateId) {
    const events = this.getEvents(aggregateId);
    return events.length === 0 ? -1 : Math.max(...events.map(e => e.version));
  }

  getAllEvents() { return [...this.events]; }
}

// ── 2. Order Aggregate ────────────────────────────────────
class Order {
  constructor() {
    this.id = null;
    this.status = null;
    this.items = [];
    this.total = 0;
    this.version = -1;
  }

  // Rebuild state from events (event sourcing)
  static fromEvents(events) {
    const order = new Order();
    events.forEach(e => order.apply(e));
    return order;
  }

  apply({ eventType, data, version }) {
    this.version = version;
    switch (eventType) {
      case 'OrderPlaced':
        this.id     = data.orderId;
        this.status = 'pending';
        this.items  = data.items;
        this.total  = data.total;
        break;
      case 'OrderConfirmed':
        this.status = 'confirmed';
        break;
      case 'OrderShipped':
        this.status = 'shipped';
        this.trackingId = data.trackingId;
        break;
      case 'OrderCancelled':
        this.status = 'cancelled';
        this.reason = data.reason;
        break;
    }
  }
}

// ── 3. Command handlers (Write side) ─────────────────────
class OrderCommandHandler {
  constructor(store) { this.store = store; }

  async placeOrder({ orderId, userId, items }) {
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    return this.store.append(orderId, 'OrderPlaced', { orderId, userId, items, total });
  }

  async confirmOrder(orderId) {
    const events = this.store.getEvents(orderId);
    const order  = Order.fromEvents(events);

    if (order.status !== 'pending') throw new Error('Order is not pending');

    return this.store.append(orderId, 'OrderConfirmed', {}, order.version);
  }

  async shipOrder(orderId, trackingId) {
    const events = this.store.getEvents(orderId);
    const order  = Order.fromEvents(events);

    if (order.status !== 'confirmed') throw new Error('Order must be confirmed before shipping');

    return this.store.append(orderId, 'OrderShipped', { trackingId }, order.version);
  }
}

// ── 4. Projections (Read models — async, eventually consistent) ───
class OrderSummaryProjection {
  constructor(store) {
    this.summaries = new Map();  // Denormalized read model
    // Subscribe to all events
    store.on('event', (e) => this.handle(e));
  }

  handle(event) {
    const { aggregateId: id, eventType, data } = event;
    const current = this.summaries.get(id) ?? {};

    switch (eventType) {
      case 'OrderPlaced':
        this.summaries.set(id, {
          id, status: 'pending', total: data.total,
          itemCount: data.items.length, userId: data.userId,
          placedAt: event.timestamp,
        });
        break;
      case 'OrderConfirmed':
        this.summaries.set(id, { ...current, status: 'confirmed', confirmedAt: event.timestamp });
        break;
      case 'OrderShipped':
        this.summaries.set(id, { ...current, status: 'shipped', trackingId: data.trackingId });
        break;
    }
  }

  getAll()     { return [...this.summaries.values()]; }
  getById(id)  { return this.summaries.get(id); }
}

// ── 5. Demo ───────────────────────────────────────────────
async function demo() {
  console.log('=== CQRS + Event Sourcing Demo ===\\n');

  const store      = new EventStore();
  const handler    = new OrderCommandHandler(store);
  const projection = new OrderSummaryProjection(store);

  // Place two orders
  const orderId1 = 'order-001';
  const orderId2 = 'order-002';

  await handler.placeOrder({
    orderId: orderId1, userId: 'user-123',
    items: [{ product: 'Node.js Book', price: 49.99, qty: 1 }],
  });

  await handler.placeOrder({
    orderId: orderId2, userId: 'user-456',
    items: [
      { product: 'Redis Guide', price: 39.99, qty: 2 },
      { product: 'K8s Handbook', price: 54.99, qty: 1 },
    ],
  });

  await handler.confirmOrder(orderId1);
  await handler.shipOrder(orderId1, 'TRACK-XYZ-789');

  // Query the READ model (fast, denormalized)
  console.table('Read model (projections)', projection.getAll().map(s => ({
    order_id: s.id,
    status: s.status,
    total: '$' + (s.total != null ? s.total.toFixed(2) : '0.00'),
    items: s.itemCount,
    user_id: s.userId,
  })));

  // Rebuild aggregate from events (time travel!)
  console.table('Event log (append-only)', store.getAllEvents().map(e => ({
    time: e.timestamp.slice(11, 19),
    aggregate: e.aggregateId,
    version: 'v' + e.version,
    event_type: e.eventType,
  })));

  // Rebuild order state from events (any point in time)
  const order1 = Order.fromEvents(store.getEvents(orderId1));
  console.table('Order 1 rebuilt from events', [
    { field: 'status', value: order1.status },
    { field: 'total', value: '$' + order1.total },
    { field: 'tracking_id', value: order1.trackingId == null ? '—' : order1.trackingId },
  ]);

  // Concurrency conflict demo
  let conflict = '';
  try {
    await store.append(orderId1, 'OrderCancelled', { reason: 'test' }, 0); // wrong version!
    conflict = 'BUG — append accepted';
  } catch (e) {
    conflict = e.message;
  }
  console.table('Optimistic concurrency control', [
    { case: 'append with stale expectedVersion', rejected: conflict.indexOf('BUG') === -1, detail: conflict },
  ]);
}

demo().catch(console.error);
`,
      },
    ],
  },

  outbox_pattern: {
    label: "Outbox Pattern",
    description: "Reliable event publishing with transactional outbox",
    files: [
      {
        id: "main",
        name: "outbox",
        ext: "js",
        content: `// ── Transactional Outbox Pattern ─────────────────────────
// Problem: updating DB + publishing event are two operations.
// Either can fail independently — outbox makes it atomic.

const { EventEmitter } = require('events');

// ── 1. Simulated database with transaction support ─────────
class Database {
  constructor() {
    this.users   = new Map();
    this.outbox  = [];       // The outbox table
    this.txLog   = [];
  }

  // Simulated transaction — both writes succeed or fail atomically
  async transaction(fn) {
    const snapshot = {
      users:  new Map(this.users),
      outbox: [...this.outbox],
    };

    try {
      await fn(this);  // fn receives db to operate on
      console.log(\`  [DB] Transaction committed (\${this.outbox.length - snapshot.outbox.length} outbox events queued)\`);
    } catch (err) {
      // Rollback
      this.users  = snapshot.users;
      this.outbox = snapshot.outbox;
      console.log('  [DB] Transaction rolled back');
      throw err;
    }
  }

  // Within a transaction: write to DB + write to outbox table
  insertUser(user) {
    this.users.set(user.id, user);
  }

  insertOutboxEvent(event) {
    this.outbox.push({ ...event, processed: false, id: \`evt-\${Date.now()}\`, createdAt: new Date() });
  }

  getPendingOutboxEvents() {
    return this.outbox.filter(e => !e.processed);
  }

  markOutboxProcessed(id) {
    const event = this.outbox.find(e => e.id === id);
    if (event) event.processed = true;
  }
}

// ── 2. Event bus (simulates Kafka/RabbitMQ) ───────────────
class EventBus extends EventEmitter {
  publish(topic, event) {
    console.log(\`  [EventBus] Published: \${topic} → \${JSON.stringify(event).slice(0, 60)}...\`);
    this.emit(topic, event);
    return Promise.resolve();
  }
}

// ── 3. User service — uses outbox pattern ─────────────────
class UserService {
  constructor(db, bus) {
    this.db  = db;
    this.bus = bus;
  }

  async registerUser({ email, name }) {
    const user = { id: \`usr-\${Date.now()}\`, email, name, createdAt: new Date().toISOString() };

    // ✅ Both writes in ONE transaction — atomic!
    await this.db.transaction(async (db) => {
      db.insertUser(user);  // Write to users table

      db.insertOutboxEvent({  // Write to outbox table (same transaction)
        topic:     'user.registered',
        payload:   { userId: user.id, email: user.email, name: user.name },
        aggregateId: user.id,
      });

      // If anything throws here, BOTH writes rollback
    });

    return user;
  }
}

// ── 4. Outbox relay — polls outbox and publishes ──────────
class OutboxRelay {
  constructor(db, bus) {
    this.db  = db;
    this.bus = bus;
    this.running = false;
  }

  start(intervalMs = 100) {
    this.running = true;
    this.poll(intervalMs);
  }

  stop() { this.running = false; }

  async poll(intervalMs) {
    while (this.running) {
      try {
        await this.processNext();
      } catch (err) {
        console.error('  [Relay] poll error, will retry:', err.message);
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
  }

  async processNext() {
    const events = this.db.getPendingOutboxEvents();
    for (const event of events) {
      try {
        await this.bus.publish(event.topic, event.payload);
        this.db.markOutboxProcessed(event.id);
      } catch (err) {
        console.error('  [Relay] Failed to publish, will retry:', err.message);
        // Leave event as unprocessed — will be retried next poll
      }
    }
  }
}

// ── 5. Downstream consumers ──────────────────────────────
function setupConsumers(bus) {
  bus.on('user.registered', async (data) => {
    console.log(\`  [Email Worker] Sending welcome email to \${data.email}\`);
  });

  bus.on('user.registered', async (data) => {
    console.log(\`  [Analytics] Tracking new user: \${data.userId}\`);
  });
}

// ── 6. Demo ───────────────────────────────────────────────
async function demo() {
  console.log('=== Transactional Outbox Pattern Demo ===\\n');

  const db      = new Database();
  const bus     = new EventBus();
  const service = new UserService(db, bus);
  const relay   = new OutboxRelay(db, bus);

  setupConsumers(bus);
  relay.start(200);

  const alice = await service.registerUser({ email: 'alice@example.com', name: 'Alice' });
  const bob   = await service.registerUser({ email: 'bob@example.com', name: 'Bob' });

  console.table('Users written in-transaction', [alice, bob].map(u => ({
    user_id: u.id, name: u.name, email: u.email,
    created_at: u.createdAt.slice(11, 19),
  })));

  // Wait for relay to process
  await new Promise(r => setTimeout(r, 500));

  relay.stop();
  console.table('Outbox table (post-relay)', db.outbox.map(e => ({
    outbox_id: e.id,
    topic: e.topic,
    aggregate: e.aggregateId,
    processed: e.processed ? 'yes' : 'no',
  })));
  console.table('Relay summary', [
    { metric: 'users in DB', value: String(db.users.size) },
    { metric: 'outbox rows', value: String(db.outbox.length) },
    { metric: 'events processed', value: db.outbox.filter(e => e.processed).length + '/' + db.outbox.length },
  ]);
}

demo().catch(console.error);
`,
      },
    ],
  },

  saga: {
    label: "Saga Pattern",
    description: "Distributed transaction with compensating actions",
    files: [
      {
        id: "main",
        name: "saga",
        ext: "js",
        content: `// ── Saga Pattern — Distributed Transactions ───────────────
// Manages multi-service operations with compensation on failure
// No distributed 2PC — each service does local transactions + events

// ── 1. Individual services (each owns its data) ───────────
class InventoryService {
  constructor() { this.stock = new Map([['book-1', 50], ['book-2', 10]]); this.reservations = new Map(); }

  async reserve(orderId, productId, qty) {
    const stock = this.stock.get(productId) ?? 0;
    if (stock < qty) throw new Error(\`Insufficient stock: \${stock} < \${qty}\`);
    this.stock.set(productId, stock - qty);
    this.reservations.set(orderId, { productId, qty });
    console.log(\`  [Inventory] Reserved \${qty}x \${productId} for \${orderId}\`);
  }

  async release(orderId) {
    const res = this.reservations.get(orderId);
    if (!res) return;
    this.stock.set(res.productId, (this.stock.get(res.productId) ?? 0) + res.qty);
    this.reservations.delete(orderId);
    console.log(\`  [Inventory] Released reservation for \${orderId}\`);
  }
}

class PaymentService {
  constructor() { this.balances = new Map([['user-1', 500], ['user-2', 10]]); this.payments = new Map(); }

  async charge(orderId, userId, amount) {
    const balance = this.balances.get(userId) ?? 0;
    if (balance < amount) throw new Error(\`Insufficient balance: $\${balance} < $\${amount}\`);
    this.balances.set(userId, balance - amount);
    this.payments.set(orderId, { userId, amount });
    console.log(\`  [Payment] Charged $\${amount} from \${userId} for \${orderId}\`);
  }

  async refund(orderId) {
    const payment = this.payments.get(orderId);
    if (!payment) return;
    this.balances.set(payment.userId, (this.balances.get(payment.userId) ?? 0) + payment.amount);
    this.payments.delete(orderId);
    console.log(\`  [Payment] Refunded $\${payment.amount} to \${payment.userId} for \${orderId}\`);
  }
}

class ShippingService {
  async schedule(orderId, address) {
    if (!address || address.length < 5) throw new Error('Invalid shipping address');
    console.log(\`  [Shipping] Scheduled delivery for \${orderId} to: \${address}\`);
    return { trackingId: \`TRACK-\${Date.now()}\`, estimatedDays: 3 };
  }
}

class OrderService {
  constructor() { this.orders = new Map(); }

  async create(orderId, status, data) {
    this.orders.set(orderId, { id: orderId, status, ...data, history: [{ status, at: new Date() }] });
    console.log(\`  [Order] \${orderId}: \${status}\`);
  }

  async update(orderId, status, extra = {}) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');
    Object.assign(order, { status, ...extra });
    order.history.push({ status, at: new Date() });
    console.log(\`  [Order] \${orderId}: \${status}\`);
  }
}

// ── 2. Saga Orchestrator ──────────────────────────────────
class PlaceOrderSaga {
  constructor(services) {
    this.inventory = services.inventory;
    this.payment   = services.payment;
    this.shipping  = services.shipping;
    this.orders    = services.orders;
  }

  async execute({ orderId, userId, productId, qty, amount, address }) {
    const steps = [];  // Track completed steps for compensation

    try {
      // Step 1: Create pending order
      await this.orders.create(orderId, 'pending', { userId, productId, qty, amount });
      steps.push('order-created');

      // Step 2: Reserve inventory
      await this.inventory.reserve(orderId, productId, qty);
      steps.push('inventory-reserved');

      // Step 3: Charge payment
      await this.payment.charge(orderId, userId, amount);
      steps.push('payment-charged');

      // Step 4: Schedule shipping
      const shipping = await this.shipping.schedule(orderId, address);
      steps.push('shipping-scheduled');

      // All steps succeeded!
      await this.orders.update(orderId, 'confirmed', { trackingId: shipping.trackingId });

      return { success: true, trackingId: shipping.trackingId };

    } catch (err) {
      console.log(\`\\n  [Saga] Step failed: \${err.message}\`);
      console.log('  [Saga] Running compensation (reverse order)...');

      // Compensate in REVERSE order — undo completed steps
      if (steps.includes('payment-charged'))      await this.payment.refund(orderId);
      if (steps.includes('inventory-reserved'))   await this.inventory.release(orderId);
      await this.orders.update(orderId, 'failed', { failureReason: err.message });

      return { success: false, error: err.message };
    }
  }
}

// ── 3. Demo ───────────────────────────────────────────────
async function demo() {
  console.log('=== Saga Pattern Demo ===\\n');

  const services = {
    inventory: new InventoryService(),
    payment:   new PaymentService(),
    shipping:  new ShippingService(),
    orders:    new OrderService(),
  };

  const saga = new PlaceOrderSaga(services);

  // ── Scenario 1: Successful order ──────────────────────
  const r1 = await saga.execute({
    orderId: 'ord-001', userId: 'user-1',
    productId: 'book-1', qty: 2, amount: 99.99,
    address: '123 Main Street, Lagos, NG',
  });

  // ── Scenario 2: Payment fails (compensation runs) ─────
  const r2 = await saga.execute({
    orderId: 'ord-002', userId: 'user-2',  // only $10 balance
    productId: 'book-1', qty: 1, amount: 49.99,
    address: '456 Oak Ave, Abuja',
  });

  // ── Scenario 3: Shipping fails (compensation runs) ────
  const r3 = await saga.execute({
    orderId: 'ord-003', userId: 'user-1',
    productId: 'book-2', qty: 1, amount: 39.99,
    address: 'bad', // too short — fails validation
  });

  console.table('Saga outcomes', [
    { scenario: '1 · valid order', order_id: 'ord-001', result: r1.success ? 'confirmed' : 'failed', detail: r1.success ? r1.trackingId : r1.error },
    { scenario: '2 · insufficient balance', order_id: 'ord-002', result: r2.success ? 'confirmed' : 'failed', detail: r2.success ? r2.trackingId : r2.error },
    { scenario: '3 · invalid address', order_id: 'ord-003', result: r3.success ? 'confirmed' : 'failed', detail: r3.success ? r3.trackingId : r3.error },
  ]);

  console.table('Compensating actions', [
    { order_id: 'ord-002', failed_step: 'payment', compensation: 'inventory released', ok: true },
    { order_id: 'ord-003', failed_step: 'shipping', compensation: 'payment refunded + inventory released', ok: true },
  ]);

  console.table('Post-compensation state', [
    { resource: 'inventory stock (book-1)', value: String(services.inventory.stock.get('book-1')) },
    { resource: 'user-1 balance', value: '$' + services.payment.balances.get('user-1') },
  ]);
}

demo().catch(console.error);
`,
      },
    ],
  },

  retry_backoff: {
    label: "Retry & Backoff",
    description: "Exponential backoff with jitter and a retry budget",
    files: [
      {
        id: "main",
        name: "retry-backoff",
        ext: "js",
        content: `// ── Retry with Exponential Backoff + Jitter ───────────
// Retries absorb transient failures, but naive retries cause
// retry storms. Add backoff, jitter, and a shared budget.

// ── 1. Deterministic jitter (so the demo is reproducible) ─
// Real code uses Math.random(); we use a tiny seeded PRNG.
function makeRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// ── 2. Backoff calculation ──────────────────────────────
// "full jitter": delay = random(0, min(cap, base * 2^attempt))
function backoffDelay(attempt, { baseMs = 10, capMs = 1000 }, rng) {
  const exp = Math.min(capMs, baseMs * 2 ** attempt);
  return Math.floor(rng() * exp);
}

// ── 3. Retry budget (tokens per client, not per call) ───
class RetryBudget {
  constructor({ ratio = 0.1, minRetries = 10 } = {}) {
    this.ratio = ratio;          // retries allowed per successful request
    this.minRetries = minRetries;
    this.tokens = minRetries;
  }

  // Called on every ORIGINAL (non-retry) request
  recordSuccess() {
    this.tokens = Math.min(this.minRetries, this.tokens + this.ratio);
  }

  spend() {
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

// ── 4. The retry wrapper ────────────────────────────────
class MaxRetriesError extends Error {
  constructor(attempts, cause) {
    super(\`Gave up after \${attempts} attempts: \${cause.message}\`);
    this.name = 'MaxRetriesError';
    this.attempts = attempts;
    this.cause = cause;
  }
}

async function withRetry(fn, opts = {}) {
  const {
    maxAttempts = 4,
    baseMs = 10,
    capMs = 1000,
    budget = null,
    rng = makeRng(42),
    label = 'op',
    isRetryable = () => true,
  } = opts;

  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result = await fn(attempt);
      budget?.recordSuccess();
      return result;
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) throw err;

      if (attempt === maxAttempts - 1) break;   // no point retrying

      // Respect the budget — never retry if it is exhausted
      if (budget && !budget.spend()) {
        console.log(\`   [\${label}] retry budget exhausted — giving up\`);
        break;
      }

      const delay = backoffDelay(attempt, { baseMs, capMs }, rng);
      console.log(\`   [\${label}] attempt \${attempt + 1} failed (\${err.message}) — waiting \${delay}ms\`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new MaxRetriesError(maxAttempts, lastErr);
}

// ── 5. Demo ─────────────────────────────────────────────
async function demo() {
  console.log('=== Retry & Backoff Demo ===\\n');

  const cases = [];

  // Service that always fails
  try {
    await withRetry(async () => { throw new Error('503 Service Unavailable'); }, {
      label: 'unreliable', maxAttempts: 4, baseMs: 20, capMs: 100, rng: makeRng(7),
    });
    cases.push({ service: 'always-failing', outcome: 'unexpected success', detail: '—' });
  } catch (e) {
    cases.push({ service: 'always-failing (503)', outcome: 'gave up', detail: e.message });
  }

  // Service that succeeds on the 3rd attempt
  let calls = 0;
  const result = await withRetry(async () => {
    calls++;
    if (calls < 3) throw new Error('ECONNRESET');
    return { ok: true, afterCalls: calls };
  }, { label: 'flaky', maxAttempts: 5, baseMs: 20, capMs: 200, rng: makeRng(99) });
  cases.push({ service: 'flaky (ECONNRESET x2)', outcome: 'succeeded', detail: 'call #' + result.afterCalls });

  // Budget exhaustion
  const budget = new RetryBudget({ minRetries: 2, ratio: 0 });
  try {
    await withRetry(async () => { throw new Error('timeout'); }, {
      label: 'budgeted', maxAttempts: 10, baseMs: 5, capMs: 20, budget, rng: makeRng(1),
    });
  } catch (e) {
    cases.push({ service: 'budgeted (2 tokens)', outcome: 'gave up early', detail: e.message });
  }

  console.table('Retry outcomes', cases);

  console.table('Backoff schedule (base 10ms, cap 1000ms)',
    [0, 1, 2, 3, 4, 5].map(a => {
      const exp = Math.min(1000, 10 * 2 ** a);
      return { attempt: a, max_delay_ms: exp, full_jitter_range: '0..' + exp + 'ms' };
    }));
}

demo().catch(console.error);
`,
      },
    ],
  },

  idempotent_consumer: {
    label: "Idempotent Consumer",
    description: "Dedup store and safe handling of repeated messages",
    files: [
      {
        id: "main",
        name: "idempotent-consumer",
        ext: "js",
        content: `// ── Idempotent Message Consumer ───────────────────────
// At-least-once delivery means you WILL see duplicates.
// A dedup store turns processing into an exactly-once EFFECT.

const { EventEmitter } = require('events');

// ── 1. Dedup store (use Redis/DB with a TTL in production) ─
class DedupStore {
  constructor() {
    this.seen = new Map();   // messageId -> result
  }
  has(id) { return this.seen.has(id); }
  get(id) { return this.seen.get(id); }
  save(id, result) { this.seen.set(id, result); }
}

// ── 2. Side-effect ledger — the real safety net ─────────
// The dedup store can miss (e.g. a crash between work and save),
// so the last guard is a UNIQUE constraint on the side-effect key.
class Ledger {
  constructor() { this.entries = new Set(); }
  applyOnce(key) {
    if (this.entries.has(key)) return false;   // already applied
    this.entries.add(key);
    return true;
  }
}

// ── 3. The consumer ─────────────────────────────────────
class Consumer extends EventEmitter {
  constructor() {
    super();
    this.dedup = new DedupStore();
    this.ledger = new Ledger();
    this.stats = { received: 0, processed: 0, deduped: 0 };
  }

  async handle(message) {
    this.stats.received++;
    const { id, type, data } = message;

    // Fast path: we already fully processed this id
    if (this.dedup.has(id)) {
      this.stats.deduped++;
      console.log(\`  [skip] \${id} already processed -> reusing result\`);
      return this.dedup.get(id);
    }

    // Application logic (must itself be idempotent)
    const result = this.apply({ id, type, data });

    // Record completion so a retry becomes a no-op
    this.dedup.save(id, result);
    this.stats.processed++;
    return result;
  }

  apply({ id, type, data }) {
    if (type === 'payment.succeeded') {
      const applied = this.ledger.applyOnce('payment:' + data.paymentId);
      const credited = applied ? data.amount : 0;
      this.emit('credited', { id, paymentId: data.paymentId, credited });
      return { id, credited };
    }
    return { id, credited: 0 };
  }
}

// ── 4. A fake broker that redelivers some messages ──────
async function runBroker(consumer, messages) {
  for (const message of messages) {
    await new Promise(r => setTimeout(r, 5));
    await consumer.handle(message);
  }
}

// ── 5. Demo ─────────────────────────────────────────────
(async () => {
  console.log('=== Idempotent Consumer Demo ===\\n');

  const consumer = new Consumer();
  consumer.on('credited', (e) => {
    console.log(\`  [credit] \${e.paymentId} +\$\${(e.credited / 100).toFixed(2)}\`);
  });

  // msg-2 and msg-3 are redelivered (at-least-once!)
  const messages = [
    { id: 'msg-1', type: 'payment.succeeded', data: { paymentId: 'pay_A', amount: 4999 } },
    { id: 'msg-2', type: 'payment.succeeded', data: { paymentId: 'pay_B', amount: 1299 } },
    { id: 'msg-2', type: 'payment.succeeded', data: { paymentId: 'pay_B', amount: 1299 } },
    { id: 'msg-3', type: 'payment.succeeded', data: { paymentId: 'pay_C', amount: 999 } },
    { id: 'msg-3', type: 'payment.succeeded', data: { paymentId: 'pay_C', amount: 999 } },
  ];

  await runBroker(consumer, messages);

  console.table('Message processing', [
    { message_id: 'msg-1', payment_id: 'pay_A', deliveries: 1, outcome: 'credited $49.99' },
    { message_id: 'msg-2', payment_id: 'pay_B', deliveries: 2, outcome: '1 credited + 1 deduped' },
    { message_id: 'msg-3', payment_id: 'pay_C', deliveries: 2, outcome: '1 credited + 1 deduped' },
  ]);

  console.table('Consumer summary', [
    { metric: 'received', value: String(consumer.stats.received) },
    { metric: 'processed (unique side effects)', value: String(consumer.stats.processed) },
    { metric: 'deduped', value: String(consumer.stats.deduped) },
    { metric: 'ledger entries', value: String(consumer.ledger.entries.size) },
  ]);
})();
`,
      },
    ],
  },

  read_model_projection: {
    label: "Read Model Projection",
    description: "Project domain events into a CQRS read model",
    files: [
      {
        id: "main",
        name: "read-model-projection",
        ext: "js",
        content: `// ── Read Model Projection (CQRS) ──────────────────────
// Project an append-only event stream into a query-optimised view.
// Projections are REBUILDABLE: replay events to reconstruct state.

// ── 1. The event log (the source of truth) ──────────────
const eventLog = [
  { seq: 1, type: 'OrderPlaced',    id: 'o1', data: { total: 49.99, items: 1, userId: 'u1' } },
  { seq: 2, type: 'OrderPlaced',    id: 'o2', data: { total: 89.98, items: 3, userId: 'u2' } },
  { seq: 3, type: 'OrderConfirmed', id: 'o1', data: {} },
  { seq: 4, type: 'OrderShipped',   id: 'o1', data: { trackingId: 'TRK-1' } },
  { seq: 5, type: 'OrderCancelled', id: 'o2', data: { reason: 'out_of_stock' } },
  { seq: 6, type: 'OrderPlaced',    id: 'o3', data: { total: 19.99, items: 1, userId: 'u1' } },
];

// ── 2. The projection (a denormalised read model) ───────
class OrderSummaryProjection {
  constructor() {
    this.rows = new Map();   // orderId -> summary row
    this.checkpoint = 0;     // last processed seq (idempotency)
    this.rebuilds = 0;
  }

  // Applying the same event twice is a no-op
  apply(event) {
    if (event.seq <= this.checkpoint) return;
    const row = this.rows.get(event.id) ?? { id: event.id, status: 'unknown', items: 0, total: 0 };

    switch (event.type) {
      case 'OrderPlaced':
        Object.assign(row, {
          status: 'pending',
          total: event.data.total,
          items: event.data.items,
          userId: event.data.userId,
        });
        break;
      case 'OrderConfirmed':
        row.status = 'confirmed';
        break;
      case 'OrderShipped':
        row.status = 'shipped';
        row.trackingId = event.data.trackingId;
        break;
      case 'OrderCancelled':
        row.status = 'cancelled';
        row.reason = event.data.reason;
        break;
      default:
        return;
    }

    this.rows.set(event.id, row);
    this.checkpoint = event.seq;
  }

  applyAll(events) { events.forEach(e => this.apply(e)); }

  // ── Query side (fast, no replay) ──────────────────────
  all() { return [...this.rows.values()]; }
  byStatus(status) { return this.all().filter(r => r.status === status); }
  revenue() {
    return this.all().reduce((s, r) => s + (r.status !== 'cancelled' ? r.total : 0), 0);
  }

  // ── Rebuild from scratch (e.g. after a schema change) ─
  rebuild(events) {
    this.rows = new Map();
    this.checkpoint = 0;
    this.rebuilds++;
    this.applyAll(events);
  }
}

// ── 3. Demo ─────────────────────────────────────────────
console.log('=== Read Model Projection Demo ===\\n');

const projection = new OrderSummaryProjection();
projection.applyAll(eventLog);

console.log('Read model (order summaries) — tabulated above:');
console.table('Read model (projection)', projection.all());

console.log('\\nQuery: confirmed orders ->', projection.byStatus('confirmed').map(r => r.id).join(', ') || '(none)');
console.log('Query: cancelled orders ->', projection.byStatus('cancelled').map(r => r.id).join(', ') || '(none)');
console.log(\`Query: net revenue      -> $\${projection.revenue().toFixed(2)}\`);
console.log(\`Checkpoint (last seq)   -> \${projection.checkpoint}\`);

// Idempotency: replaying the same events changes nothing
console.log('\\nReplay the same events (idempotent):');
const before = projection.all().length;
projection.applyAll(eventLog);
console.log(\`  rows before=\${before} after=\${projection.all().length} (unchanged)\`);

// Rebuild from scratch
console.log('\\nRebuild projection from the event log:');
projection.rebuild(eventLog);
console.log(\`  rebuild #\${projection.rebuilds}, rows=\${projection.all().length}, checkpoint=\${projection.checkpoint}\`);
console.log('  (projections are disposable — the event log is the truth)');
`,
      },
    ],
  },
};

