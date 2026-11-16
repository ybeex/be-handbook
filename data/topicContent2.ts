// Part 2: Node.js, Database, and Architecture topics

import type { TopicContent } from './contentTypes';

export const TOPIC_CONTENT_PART2: Record<string, TopicContent> = {

  // ─── NODE.JS ─────────────────────────────────────────────────────────────

  'event-loop': {
    slug: 'event-loop',
    title: 'The Node.js Event Loop',
    tagline: "Single-threaded concurrency — Node's most misunderstood superpower",
    hasVisualizer: 'eventloop',
    sections: [
      { type: 'text', heading: 'The Core Problem', content: 'Traditional servers (Apache, Java Servlet containers) create a new OS thread per incoming request. Threads consume ~1MB of memory each, and context-switching between them is expensive. A server handling 10,000 concurrent users needs ~10GB just for threads — most of which sit idle waiting for I/O.\n\nNode.js uses a radically different model: **one thread, non-blocking I/O, event-driven callbacks**. Instead of waiting for a database query to return, Node registers a callback and immediately picks up the next request. When the database responds, the callback fires. One thread serves thousands of concurrent requests.' },
      { type: 'analogy', heading: 'The Single Barista Analogy', content: 'Traditional model: one barista per customer. Barista 1 takes order #1, makes coffee (3 minutes), serves it, then takes order #2. With 100 customers, you need 100 baristas — most waiting for their coffee machines.\n\nNode.js model: one hyper-efficient barista. They take order #1, START the coffee machine (non-blocking), immediately take order #2, start another machine, take order #3. When machine #1 finishes (callback fires), they grab that coffee and serve it. One person, 100 orders in flight simultaneously.\n\nThe key insight: **I/O does not need CPU**. While the database query runs on the DB server, Node\'s thread can process other requests.' },
      { type: 'text', heading: 'Event Loop Phases', content: 'The event loop runs phases in a fixed order each "tick":\n\n**Timers** — Executes setTimeout and setInterval callbacks whose delay has elapsed.\n\n**Pending I/O callbacks** — Executes I/O callbacks deferred from the previous tick.\n\n**Poll** — Retrieves new I/O events. If callbacks are ready, executes them. Otherwise waits.\n\n**Check** — Executes setImmediate callbacks. Always runs after poll, before timers next tick.\n\n**Close callbacks** — socket.on("close") and similar cleanup callbacks.\n\nBetween every phase, **microtasks drain completely**: Promise .then/.catch callbacks and queueMicrotask() callbacks. Microtasks always run before the next phase begins.' },
      { type: 'code', heading: 'Execution Order Deep Dive', language: 'typescript', label: 'event-loop-order.ts', code: `// Understanding the exact execution order

console.log('1: sync start');

// Macrotask — runs in TIMERS phase, next tick
setTimeout(() => console.log('6: setTimeout 0ms'), 0);

// Macrotask — runs in CHECK phase, before setTimeout
setImmediate(() => console.log('5: setImmediate'));

// Microtask — runs between current sync code and macrotasks
Promise.resolve()
  .then(() => console.log('3: promise .then'))
  .then(() => console.log('4: chained promise'));

// Microtask — same as promise .then
queueMicrotask(() => console.log('3.5: queueMicrotask'));

console.log('2: sync end');

// Output: 1, 2, 3, 3.5, 4, 5, 6
// Rule: sync → microtasks → [check | timers | I/O] → microtasks → repeat

// Inside I/O callback: setImmediate ALWAYS before setTimeout
const fs = require('fs');
fs.readFile('/tmp/test', () => {
  setTimeout(() => console.log('B: timeout'), 0);
  setImmediate(() => console.log('A: immediate')); // Always first inside I/O
});` },
      { type: 'code', heading: 'Blocking vs Non-Blocking — The Critical Difference', language: 'typescript', label: 'blocking.ts', code: `// ❌ BLOCKING — freezes ALL requests while this runs
app.get('/users', (req, res) => {
  // readFileSync blocks the event loop thread
  // No other request can be handled until this returns
  const data = fs.readFileSync('./large-file.json'); // 200ms
  res.json(JSON.parse(data));
});

// ✅ NON-BLOCKING — event loop free to handle other requests
app.get('/users', async (req, res) => {
  // readFile delegates to OS async I/O, callback fires when done
  // Event loop handles other requests while OS reads the file
  const data = await fs.promises.readFile('./large-file.json');
  res.json(JSON.parse(data));
});

// ❌ CPU-BOUND blocking — image processing takes 2s, stalls server
app.post('/resize', (req, res) => {
  const resized = processImage(req.body.image); // Synchronous CPU work
  res.json({ url: resized });
});

// ✅ Offload CPU work to worker threads
import { Worker } from 'worker_threads';
app.post('/resize', (req, res) => {
  const worker = new Worker('./image-worker.js', {
    workerData: { image: req.body.image, width: 800 }
  });
  worker.on('message', (url) => res.json({ url }));
  worker.on('error', (err) => res.status(500).json({ error: err.message }));
});

// ✅ Parallel async operations with Promise.all
app.get('/dashboard', async (req, res) => {
  // These 3 DB queries run CONCURRENTLY, not sequentially
  const [user, orders, notifications] = await Promise.all([
    db.users.findById(req.user.id),
    db.orders.findByUser(req.user.id),
    db.notifications.findUnread(req.user.id),
  ]);
  // Total time ≈ slowest query, not sum of all queries
  res.json({ user, orders, notifications });
});` },
      { type: 'callout', calloutType: 'danger', heading: 'Blocking the Event Loop is a P0 Production Incident', content: 'Any synchronous operation that takes more than a few milliseconds stalls ALL concurrent users. Common culprits: fs.readFileSync on large files, JSON.parse on massive payloads (>100KB), complex regex on long strings (catastrophic backtracking), bcrypt without async/await, and tight CPU loops. Use clinic.js or Node --prof to detect event loop blocking in production.' },
      { type: 'callout', calloutType: 'gold', heading: 'How Netflix Uses Node.js', content: "Netflix's API gateway is built on Node.js specifically because of the event loop. Their gateway fans out each request to 30+ backend microservices simultaneously. Non-blocking I/O means it waits for all 30 in parallel, not sequentially. A thread-per-request model would require 30 threads per user — with 100K concurrent users, that is 3 million threads. Node handles this with a handful of threads." },
    ],
    quiz: [
      { question: 'In Node.js, what happens when you call fs.readFileSync() inside an HTTP request handler serving 1000 concurrent users?', options: ['Node parallelizes the file read automatically', 'All 1000 users wait while the file is read — the event loop is blocked', 'The other requests are handled by worker threads automatically', 'Node throws an error preventing synchronous I/O in handlers'], correctIndex: 1, explanation: 'readFileSync blocks the single event loop thread. While the file reads (potentially hundreds of milliseconds for large files), no other requests can be processed. All 1000 concurrent users experience the full delay. This is why async I/O is mandatory in Node.js servers.' },
      { question: 'Which always executes before the other inside an I/O callback?', options: ['setTimeout(fn, 0) before setImmediate', 'setImmediate before setTimeout(fn, 0)', 'They execute in the order they were registered', 'Order is non-deterministic inside I/O callbacks'], correctIndex: 1, explanation: 'Inside an I/O callback, setImmediate (CHECK phase) always runs before setTimeout(fn, 0) (TIMERS phase next tick). Outside I/O callbacks, the order between setTimeout(0) and setImmediate is non-deterministic due to OS timer precision variance.' },
      { question: 'You have three database queries that do not depend on each other. What is the most efficient approach?', options: ['Run them sequentially with await', 'Use Promise.all() to run them concurrently', 'Create worker threads for each query', 'Use setImmediate between queries'], correctIndex: 1, explanation: 'Promise.all() fires all three queries simultaneously and waits for all to complete. Total time ≈ slowest query. Sequential await would take sum of all query times. Worker threads are for CPU-bound work, not I/O.' },
    ]
  },

  'async-programming': {
    slug: 'async-programming',
    title: 'Async Programming',
    tagline: 'Callbacks, Promises, and async/await — mastering asynchronous Node.js',
    sections: [
      { type: 'text', heading: 'The Evolution of Async in JavaScript', content: 'JavaScript has three generations of async patterns, each solving problems of the previous:\n\n**Callbacks (Node.js original)** — Pass a function to be called when async work completes. Simple but leads to "callback hell" with nested operations.\n\n**Promises (ES2015)** — Objects representing eventual completion. Enable chaining and better error handling. Eliminates deep nesting.\n\n**async/await (ES2017)** — Syntactic sugar over Promises. Async code reads like synchronous code. Modern standard for all new code.' },
      { type: 'code', heading: 'Three Generations of Async', language: 'typescript', label: 'async-evolution.ts', code: `// ── GENERATION 1: Callbacks (avoid in new code) ──────────────
fs.readFile('./data.json', 'utf8', (err, data) => {
  if (err) return handleError(err);
  
  db.query('SELECT * FROM users', (err2, users) => {
    if (err2) return handleError(err2);
    
    sendEmail(users[0].email, data, (err3) => {
      // Callback hell — deeply nested, error handling repeated
      if (err3) return handleError(err3);
      console.log('Done');
    });
  });
});

// ── GENERATION 2: Promises ────────────────────────────────────
fs.promises.readFile('./data.json', 'utf8')
  .then(data => db.query('SELECT * FROM users').then(users => ({ data, users })))
  .then(({ data, users }) => sendEmail(users[0].email, data))
  .then(() => console.log('Done'))
  .catch(err => handleError(err));

// ── GENERATION 3: async/await (modern standard) ───────────────
async function processData() {
  try {
    const [data, users] = await Promise.all([
      fs.promises.readFile('./data.json', 'utf8'),
      db.query('SELECT * FROM users'),
    ]);
    
    await sendEmail(users[0].email, data);
    console.log('Done');
  } catch (err) {
    handleError(err);
  }
}` },
      { type: 'code', heading: 'Common Async Patterns', language: 'typescript', label: 'async-patterns.ts', code: `// ── Error handling in async routes ───────────────────────────
// Wrap async route handlers — unhandled promise rejections crash Node
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await db.users.findById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ data: user });
}));

// ── Retry with exponential backoff ───────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 100
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, attempt); // 100ms, 200ms, 400ms
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}

// Usage: const data = await withRetry(() => fetchFromUnstableAPI());

// ── Timeout wrapper ───────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(\`Timed out after \${ms}ms\`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// ── Process items in batches (avoid overwhelming DB) ─────────
async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processor: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  return results;
}

// Process 1000 users in batches of 50
const results = await processBatch(allUserIds, 50, async (id) => {
  return sendNotification(id);
});` },
      { type: 'callout', calloutType: 'warning', heading: 'Common async/await Mistakes', content: 'Forgetting await — calling an async function without await returns a Promise, not the value. Using await in a loop sequentially when queries are independent — use Promise.all(). Not handling rejected promises — always use try/catch or .catch(). Using Promise.all when one failure should not cancel others — use Promise.allSettled() instead.' },
    ],
    quiz: [
      { question: 'What does Promise.all() do when one of the promises rejects?', options: ['Waits for all promises to settle then returns results', 'Ignores the rejection and continues with other promises', 'Immediately rejects with the first rejection, cancelling nothing', 'Retries the failed promise automatically'], correctIndex: 2, explanation: 'Promise.all() is "fail fast" — if any promise rejects, the entire Promise.all immediately rejects with that error. The other promises continue executing but their results are discarded. Use Promise.allSettled() if you want all results regardless of individual failures.' },
    ]
  },

  'streams': {
    slug: 'streams',
    title: 'Streams & Buffers',
    tagline: 'Processing data as it flows rather than loading everything into memory',
    sections: [
      { type: 'text', heading: 'Why Streams Exist', content: 'Imagine reading a 10GB log file to search for an error. Loading it entirely into memory before searching would require 10GB of RAM and take minutes. Streams process data chunk by chunk — read 64KB, process it, discard it, read next 64KB. Memory usage stays constant regardless of file size.\n\nStreams are fundamental to Node.js I/O: HTTP requests and responses, file reads and writes, database result sets, network connections, and compression are all streams.' },
      { type: 'code', heading: 'Stream Types and Usage', language: 'typescript', label: 'streams.ts', code: `import { Readable, Writable, Transform, pipeline } from 'stream';
import { promisify } from 'util';
import fs from 'fs';
import zlib from 'zlib';
import csv from 'csv-parser';

const pipelineAsync = promisify(pipeline);

// ── Readable Stream — produce data ───────────────────────────
class DatabaseStream extends Readable {
  private cursor: number = 0;
  
  constructor(private query: string) {
    super({ objectMode: true, highWaterMark: 100 }); // 100 objects buffered
  }
  
  async _read() {
    try {
      const rows = await db.query(this.query, { offset: this.cursor, limit: 100 });
      this.cursor += rows.length;
      
      if (rows.length === 0) {
        this.push(null); // Signal end of stream
      } else {
        rows.forEach(row => this.push(row));
      }
    } catch (err) {
      this.destroy(err as Error);
    }
  }
}

// ── Transform Stream — process chunks ────────────────────────
class JsonLineTransform extends Transform {
  constructor() {
    super({ objectMode: true });
  }
  
  _transform(chunk: any, encoding: string, callback: Function) {
    // Convert each object to JSON line
    this.push(JSON.stringify(chunk) + '\\n');
    callback();
  }
}

// ── Pipeline: Read DB → Transform → Compress → Write file ────
async function exportData() {
  await pipelineAsync(
    new DatabaseStream('SELECT * FROM users'),
    new JsonLineTransform(),
    zlib.createGzip(),
    fs.createWriteStream('./users-export.json.gz')
  );
  console.log('Export complete');
}

// ── HTTP Streaming Response ───────────────────────────────────
app.get('/stream-csv', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  // Stream DB results directly to HTTP response — no buffering
  const dbStream = new DatabaseStream('SELECT * FROM large_table');
  
  dbStream
    .pipe(new Transform({
      objectMode: true,
      transform(row, enc, cb) {
        cb(null, \`\${row.id},\${row.name},\${row.email}\\n\`);
      }
    }))
    .pipe(res); // Stream directly to HTTP response
    
  dbStream.on('error', (err) => {
    res.status(500).end('Stream error');
  });
});

// ── Process large CSV without loading into memory ─────────────
async function processCsv(filePath: string) {
  let count = 0;
  
  await pipelineAsync(
    fs.createReadStream(filePath),
    csv(),
    new Writable({
      objectMode: true,
      async write(row, enc, callback) {
        await db.upsert('users', row);
        count++;
        callback();
      }
    })
  );
  
  console.log(\`Processed \${count} rows with constant memory usage\`);
}` },
      { type: 'callout', calloutType: 'gold', heading: 'Backpressure — The Critical Stream Concept', content: 'Backpressure is when a fast producer overwhelms a slow consumer. Without it: you read a 10GB file at disk speed and try to send it over a 10Mbps network — millions of chunks pile up in memory. Streams handle backpressure automatically: when the consumer signals it is full, the producer pauses. The pipe() and pipeline() methods manage this automatically.' },
    ],
    quiz: [
      { question: 'What is the main memory advantage of using streams for large file processing?', options: ['Streams use multiple CPU cores', 'Streams process data in fixed-size chunks — memory usage stays constant regardless of file size', 'Streams store data in SSD cache instead of RAM', 'Streams automatically compress data during processing'], correctIndex: 1, explanation: 'Streams process data incrementally in chunks (default 64KB). After each chunk is processed, it can be garbage collected. Whether the file is 1MB or 100GB, memory usage stays roughly the same — the size of one chunk. Loading everything into memory first requires memory proportional to total data size.' },
    ]
  },

  'clustering': {
    slug: 'clustering',
    title: 'Clustering & Worker Threads',
    tagline: 'Using all CPU cores in Node.js — horizontal scaling on a single machine',
    sections: [
      { type: 'text', heading: 'The CPU Core Problem', content: 'Node.js runs on a single thread — by default it uses only one CPU core regardless of how many cores the machine has. A modern server with 32 cores runs one core at ~100% while 31 sit idle. For I/O-bound workloads, this is usually fine since the bottleneck is I/O, not CPU. But for CPU-intensive tasks, or to maximize throughput, you need to use all cores.' },
      { type: 'code', heading: 'Cluster Module for Multi-Core HTTP', language: 'typescript', label: 'cluster.ts', code: `import cluster from 'cluster';
import os from 'os';
import process from 'process';

const WORKERS = os.cpus().length; // One worker per CPU core

if (cluster.isPrimary) {
  console.log(\`Primary process \${process.pid} starting \${WORKERS} workers\`);
  
  // Fork one worker per CPU core
  for (let i = 0; i < WORKERS; i++) {
    cluster.fork();
  }
  
  // Restart workers that crash
  cluster.on('exit', (worker, code, signal) => {
    console.warn(\`Worker \${worker.process.pid} died (code: \${code}). Restarting...\`);
    cluster.fork();
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Primary received SIGTERM, shutting down workers');
    for (const id in cluster.workers) {
      cluster.workers[id]?.send('shutdown');
    }
  });
  
} else {
  // Worker process: run the HTTP server
  const app = require('./app').default;
  const port = process.env.PORT || 3000;
  
  const server = app.listen(port, () => {
    console.log(\`Worker \${process.pid} listening on port \${port}\`);
  });
  
  // Graceful shutdown of worker
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      server.close(() => process.exit(0));
    }
  });
}` },
      { type: 'code', heading: 'Worker Threads for CPU-Bound Tasks', language: 'typescript', label: 'worker-threads.ts', code: `// worker-threads solve the different problem:
// CPU-intensive tasks that WOULD block the event loop

// ── image-worker.js ───────────────────────────────────────────
import { workerData, parentPort } from 'worker_threads';
import sharp from 'sharp';

async function processImage() {
  const { imageBuffer, width, quality } = workerData;
  
  const resized = await sharp(imageBuffer)
    .resize(width)
    .jpeg({ quality })
    .toBuffer();
    
  // Send result back to main thread
  parentPort!.postMessage(resized.toString('base64'));
}

processImage().catch(err => parentPort!.postMessage({ error: err.message }));

// ── main-thread.ts ────────────────────────────────────────────
import { Worker } from 'worker_threads';

// Worker thread pool for image processing
class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{ data: any; resolve: Function; reject: Function }> = [];
  private available: Worker[] = [];
  
  constructor(workerScript: string, size: number) {
    for (let i = 0; i < size; i++) {
      const worker = new Worker(workerScript);
      this.workers.push(worker);
      this.available.push(worker);
    }
  }
  
  run(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.available.length > 0) {
        this.runWorker(this.available.pop()!, data, resolve, reject);
      } else {
        this.queue.push({ data, resolve, reject });
      }
    });
  }
  
  private runWorker(worker: Worker, data: any, resolve: Function, reject: Function) {
    worker.once('message', (result) => {
      resolve(result);
      this.available.push(worker);
      if (this.queue.length > 0) {
        const next = this.queue.shift()!;
        this.runWorker(worker, next.data, next.resolve, next.reject);
      }
    });
    worker.postMessage(data);
  }
}

const imagePool = new WorkerPool('./image-worker.js', os.cpus().length);

app.post('/resize', upload.single('image'), async (req, res) => {
  // CPU work runs in worker thread — event loop stays free
  const result = await imagePool.run({
    imageBuffer: req.file!.buffer,
    width: parseInt(req.query.width as string) || 800,
    quality: 85,
  });
  res.json({ image: result });
});` },
      { type: 'comparison', heading: 'Cluster vs Worker Threads vs Child Process', headers: ['Cluster', 'Worker Threads', 'Child Process'], rows: [
        { aspect: 'Use case',   Cluster: 'Multiple HTTP servers on all CPU cores', 'Worker Threads': 'CPU-intensive tasks off main thread', 'Child Process': 'Run external programs or scripts' },
        { aspect: 'Memory',     Cluster: 'Separate memory per worker', 'Worker Threads': 'Shared memory via SharedArrayBuffer', 'Child Process': 'Completely separate process' },
        { aspect: 'IPC',        Cluster: 'process.send/message', 'Worker Threads': 'postMessage, SharedArrayBuffer', 'Child Process': 'stdin/stdout/IPC channel' },
        { aspect: 'Load share', Cluster: 'OS round-robins incoming connections', 'Worker Threads': 'Manual task dispatch', 'Child Process': 'Manual management' },
        { aspect: 'Best for',   Cluster: 'Maximizing HTTP server throughput', 'Worker Threads': 'Image processing, crypto, ML inference', 'Child Process': 'Running Python scripts, ffmpeg, etc.' },
      ]},
    ],
    quiz: [
      { question: 'What problem does the Node.js cluster module solve?', options: ['Running async code without callbacks', 'Utilizing multiple CPU cores for HTTP servers', 'Managing database connection pools', 'Handling WebSocket connections'], correctIndex: 1, explanation: 'Node.js runs on one thread and uses one CPU core by default. The cluster module forks child processes (one per CPU core), each running the same HTTP server. The OS distributes incoming connections across workers, effectively multiplying throughput by the number of cores.' },
    ]
  },

  'memory': {
    slug: 'memory',
    title: 'Memory Management',
    tagline: 'Understanding V8 heap, garbage collection, and eliminating memory leaks',
    sections: [
      { type: 'text', heading: 'V8 Memory Structure', content: 'Node.js uses the V8 JavaScript engine which manages memory in several regions:\n\n**Heap** — Where JavaScript objects, strings, and closures live. Divided into Young Generation (new objects, collected frequently) and Old Generation (long-lived objects, collected less often).\n\n**Stack** — Function call frames, primitive values. Automatically managed.\n\n**External memory** — Buffers and native add-ons. Outside V8 heap but tracked.\n\nV8\'s garbage collector (GC) automatically frees unreachable objects. But if your code inadvertently keeps references to objects that should be freed, memory grows indefinitely — a memory leak.' },
      { type: 'code', heading: 'Common Memory Leaks and Fixes', language: 'typescript', label: 'memory-leaks.ts', code: `// ── LEAK 1: Global variable accumulation ─────────────────────
const cache: Map<string, any> = new Map(); // Global, never pruned

app.get('/data/:id', async (req, res) => {
  const { id } = req.params;
  if (!cache.has(id)) {
    cache.set(id, await db.fetch(id)); // Grows forever!
  }
  res.json(cache.get(id));
});

// FIX: Use LRU cache with size limit
import LRU from 'lru-cache';
const cache = new LRU<string, any>({ max: 500, ttl: 1000 * 60 * 5 }); // 500 items, 5min TTL

// ── LEAK 2: Event listener accumulation ──────────────────────
app.get('/stream', (req, res) => {
  const onData = (data: Buffer) => res.write(data);
  eventEmitter.on('data', onData); // Added per request, never removed!
  // If 1000 requests hit this, 1000 listeners accumulate
});

// FIX: Always remove listeners on cleanup
app.get('/stream', (req, res) => {
  const onData = (data: Buffer) => res.write(data);
  eventEmitter.on('data', onData);
  req.on('close', () => eventEmitter.off('data', onData)); // Remove on disconnect
});

// ── LEAK 3: Timer not cleared ─────────────────────────────────
class MetricsCollector {
  private timer: NodeJS.Timeout;
  private data: any[] = [];
  
  constructor() {
    // This timer holds a reference, preventing GC of this object
    this.timer = setInterval(() => this.flush(), 5000);
  }
  
  // If destroy() is never called, the object lives forever
  destroy() {
    clearInterval(this.timer); // MUST clear timers for cleanup
  }
}

// ── LEAK 4: Closure capturing large object ────────────────────
async function processLargeData() {
  const largeBuffer = await fs.promises.readFile('./huge-file'); // 500MB
  
  // This closure captures largeBuffer — it cannot be GC'd until
  // the timeout fires (even though we only need the length)
  setTimeout(() => {
    console.log('Done:', largeBuffer.length); // holds ref for 60s
  }, 60000);
}

// FIX: Extract only needed data before async boundary
async function processLargeData() {
  const largeBuffer = await fs.promises.readFile('./huge-file');
  const length = largeBuffer.length; // Extract what we need
  // largeBuffer can now be GC'd
  setTimeout(() => console.log('Done:', length), 60000);
}

// ── Monitoring memory usage ───────────────────────────────────
setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    heapUsed: \`\${Math.round(mem.heapUsed / 1024 / 1024)}MB\`,
    heapTotal: \`\${Math.round(mem.heapTotal / 1024 / 1024)}MB\`,
    rss: \`\${Math.round(mem.rss / 1024 / 1024)}MB\`, // Resident set size
    external: \`\${Math.round(mem.external / 1024 / 1024)}MB\`,
  });
}, 30000);` },
      { type: 'steps', heading: 'Diagnosing a Memory Leak in Production', steps: [
        { title: 'Confirm the leak', detail: 'Monitor process.memoryUsage().heapUsed over time. A genuine leak shows steady growth without leveling off after GC.' },
        { title: 'Take heap snapshots', detail: 'Use node --inspect and Chrome DevTools (chrome://inspect). Take snapshots before and after suspected leak-triggering operations. Compare "New" allocations.' },
        { title: 'Identify retained objects', detail: 'In DevTools Heap Snapshot, sort by "Retained Size". Large unexpected object counts indicate the leak source.' },
        { title: 'Use clinic.js', detail: 'clinic heap --on-port "autocannon -c 100 http://localhost:$PORT" -- node server.js. Generates detailed flame graphs of allocations.' },
        { title: 'Fix and verify', detail: 'Apply fix. Re-run load test and confirm heapUsed stabilizes rather than growing indefinitely.' },
      ]},
    ],
    quiz: [
      { question: 'Which is a common cause of memory leaks in Node.js HTTP servers?', options: ['Using async/await instead of callbacks', 'Event listeners added per request but never removed', 'Using Promise.all() for parallel queries', 'Reading files with fs.promises'], correctIndex: 1, explanation: 'Adding event listeners per request without removing them on disconnect causes "listener leak". Each request adds a new listener, they accumulate, and both the listeners and their closure references prevent garbage collection. Always pair .on() with .off() or .once() for cleanup.' },
    ]
  },

  // ─── DATABASES ───────────────────────────────────────────────────────────

  'sql-basics': {
    slug: 'sql-basics',
    title: 'SQL Fundamentals',
    tagline: 'The language of relational databases — the most valuable data skill in backend',
    sections: [
      { type: 'text', heading: 'What is SQL?', content: 'SQL (Structured Query Language) is the standard language for interacting with relational databases. It handles four categories of operations:\n\n**DQL (Data Query Language)** — SELECT: retrieving data\n**DML (Data Manipulation Language)** — INSERT, UPDATE, DELETE: modifying data\n**DDL (Data Definition Language)** — CREATE, ALTER, DROP: defining structure\n**DCL (Data Control Language)** — GRANT, REVOKE: managing permissions\n\nSQL is declarative — you describe WHAT you want, not HOW to get it. The database engine figures out the most efficient execution plan.' },
      { type: 'code', heading: 'Core SQL Queries', language: 'sql', label: 'fundamentals.sql', code: `-- ── Table creation ───────────────────────────────────────────
CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  role        VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at  TIMESTAMP WITH TIME ZONE  -- NULL = active (soft delete)
);

CREATE TABLE orders (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total       NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  status      VARCHAR(50) DEFAULT 'pending',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Basic queries ─────────────────────────────────────────────
SELECT id, name, email FROM users WHERE deleted_at IS NULL;

-- Filtering, sorting, pagination
SELECT * FROM users
WHERE role = 'admin' AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 20 OFFSET 40;  -- Page 3, 20 per page

-- Aggregation
SELECT
  status,
  COUNT(*) AS count,
  SUM(total) AS revenue,
  AVG(total) AS avg_order,
  MIN(total) AS min_order,
  MAX(total) AS max_order
FROM orders
GROUP BY status
HAVING COUNT(*) > 10  -- Filter after aggregation
ORDER BY revenue DESC;

-- ── Joins ─────────────────────────────────────────────────────
-- INNER JOIN: only rows with matching records in both tables
SELECT u.name, o.id AS order_id, o.total, o.status
FROM users u
INNER JOIN orders o ON o.user_id = u.id
WHERE o.status = 'completed'
ORDER BY o.created_at DESC;

-- LEFT JOIN: all users, even with no orders
SELECT u.name, COUNT(o.id) AS order_count, COALESCE(SUM(o.total), 0) AS total_spent
FROM users u
LEFT JOIN orders o ON o.user_id = u.id AND o.status = 'completed'
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.name;

-- ── Subqueries and CTEs ───────────────────────────────────────
-- CTE (Common Table Expression): readable multi-step queries
WITH user_revenue AS (
  SELECT user_id, SUM(total) AS lifetime_value
  FROM orders WHERE status = 'completed'
  GROUP BY user_id
),
ranked_users AS (
  SELECT u.name, u.email, ur.lifetime_value,
    RANK() OVER (ORDER BY ur.lifetime_value DESC) AS rank
  FROM users u
  JOIN user_revenue ur ON ur.user_id = u.id
)
SELECT * FROM ranked_users WHERE rank <= 10;  -- Top 10 customers` },
      { type: 'code', heading: 'Window Functions — The SQL Power Tool', language: 'sql', label: 'window-functions.sql', code: `-- Window functions compute across a set of rows related to current row
-- WITHOUT collapsing rows like GROUP BY does

-- Running total and ranking per user
SELECT
  user_id,
  created_at,
  total,
  SUM(total) OVER (PARTITION BY user_id ORDER BY created_at) AS running_total,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY total DESC) AS order_rank,
  LAG(total, 1) OVER (PARTITION BY user_id ORDER BY created_at) AS prev_order_amount,
  total - LAG(total, 1) OVER (PARTITION BY user_id ORDER BY created_at) AS change_from_prev
FROM orders
WHERE status = 'completed';

-- Month-over-month growth
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS orders,
  SUM(total) AS revenue,
  SUM(total) - LAG(SUM(total)) OVER (ORDER BY DATE_TRUNC('month', created_at)) AS mom_growth
FROM orders
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;` },
      { type: 'callout', calloutType: 'warning', heading: 'SQL Injection — Never Interpolate User Input', content: 'Never build SQL by string concatenation with user input: `"SELECT * FROM users WHERE id = " + userId`. If userId is "1 OR 1=1", you return all users. If it is "1; DROP TABLE users;", you lose your data. Always use parameterized queries: db.query("SELECT * FROM users WHERE id = $1", [userId]). All modern DB clients support this.' },
    ],
    quiz: [
      { question: 'What is the difference between WHERE and HAVING?', options: ['WHERE filters before aggregation, HAVING filters after GROUP BY', 'HAVING filters rows, WHERE filters groups', 'They are identical — just alternative syntax', 'WHERE is for JOIN conditions, HAVING is for subqueries'], correctIndex: 0, explanation: 'WHERE filters individual rows before any grouping or aggregation occurs. HAVING filters groups after GROUP BY and aggregation. You cannot use aggregate functions (COUNT, SUM) in WHERE because rows have not been grouped yet. Example: WHERE age > 18 (row filter), HAVING COUNT(*) > 5 (group filter).' },
    ]
  },

  'nosql': {
    slug: 'nosql',
    title: 'NoSQL',
    tagline: 'When relational databases are not the right tool — and the alternatives',
    sections: [
      { type: 'text', heading: 'What is NoSQL?', content: 'NoSQL ("Not Only SQL") encompasses database systems that do not use the traditional relational table/row model. They trade ACID guarantees and relational capabilities for different trade-offs: flexible schemas, horizontal scalability, specific data model optimizations, or extreme performance for specific access patterns.' },
      { type: 'comparison', heading: 'NoSQL Database Types', headers: ['Type', 'Examples', 'Data Model', 'Best For'], rows: [
        { aspect: 'Document',     Type: 'Document',     Examples: 'MongoDB, CouchDB, Firestore', 'Data Model': 'JSON-like documents, nested objects', 'Best For': 'Flexible schemas, hierarchical data, catalogs' },
        { aspect: 'Key-Value',    Type: 'Key-Value',    Examples: 'Redis, DynamoDB, etcd',        'Data Model': 'Simple key → value pairs',           'Best For': 'Caching, sessions, leaderboards, counters' },
        { aspect: 'Column-family',Type: 'Column-family',Examples: 'Cassandra, HBase',             'Data Model': 'Rows with dynamic column sets',      'Best For': 'Time-series, analytics, write-heavy at scale' },
        { aspect: 'Graph',        Type: 'Graph',        Examples: 'Neo4j, Amazon Neptune',        'Data Model': 'Nodes and edges with properties',   'Best For': 'Social networks, recommendation engines, fraud detection' },
        { aspect: 'Time-series',  Type: 'Time-series',  Examples: 'InfluxDB, TimescaleDB',        'Data Model': 'Timestamped measurements',           'Best For': 'Metrics, IoT sensors, logs, monitoring' },
        { aspect: 'Search',       Type: 'Search',       Examples: 'Elasticsearch, OpenSearch',    'Data Model': 'Inverted index documents',           'Best For': 'Full-text search, log analysis, faceted search' },
      ]},
      { type: 'comparison', heading: 'SQL vs NoSQL Trade-offs', headers: ['SQL (Relational)', 'NoSQL'], rows: [
        { aspect: 'Schema',        'SQL (Relational)': 'Strict, enforced at DB level',       NoSQL: 'Flexible or schema-less' },
        { aspect: 'Relationships', 'SQL (Relational)': 'Foreign keys, JOINs — first class', NoSQL: 'Embedded documents or application-level' },
        { aspect: 'ACID',          'SQL (Relational)': 'Full ACID by default',               NoSQL: 'Varies — often eventual consistency' },
        { aspect: 'Scaling',       'SQL (Relational)': 'Primarily vertical (bigger server)', NoSQL: 'Horizontal (add more nodes)' },
        { aspect: 'Query power',   'SQL (Relational)': 'Arbitrary complex queries',          NoSQL: 'Optimized for specific access patterns' },
        { aspect: 'Best for',      'SQL (Relational)': 'Complex relationships, ACID needs', NoSQL: 'Specific patterns, massive scale, flexible schema' },
      ]},
      { type: 'callout', calloutType: 'gold', heading: 'The Real Rule: Use the Right Tool', content: 'There is no universal winner. Most production systems use multiple databases. A typical architecture: PostgreSQL for transactional data (orders, users, payments), Redis for caching and sessions, Elasticsearch for search, Cassandra or DynamoDB for high-write-volume time-series data. Choose based on access patterns, consistency requirements, and scale needs — not hype.' },
    ],
    quiz: [
      { question: 'When does a document database like MongoDB make more sense than PostgreSQL?', options: ['When you need complex multi-table JOINs', 'When your data has highly variable structure and is naturally hierarchical', 'When strict ACID transactions are required', 'When you need full-text search capabilities'], correctIndex: 1, explanation: 'Document databases excel when data is naturally hierarchical (a product with variable attributes, a blog post with embedded comments) and schema varies between records. PostgreSQL\'s rigid schema becomes a burden when every product type has different fields. For complex joins and strict consistency, PostgreSQL wins.' },
    ]
  },

  'postgresql': {
    slug: 'postgresql',
    title: 'PostgreSQL Deep Dive',
    tagline: "The world's most advanced open-source relational database",
    sections: [
      { type: 'text', heading: 'Why PostgreSQL?', content: 'PostgreSQL is a full ACID-compliant relational database with 35+ years of development. It combines the reliability of enterprise databases (Oracle, SQL Server) with open-source freedom. Features that make it stand out: advanced JSON/JSONB support, full-text search, robust extensions (PostGIS for geospatial, TimescaleDB for time-series), table partitioning, powerful window functions, and excellent concurrent write performance via MVCC.' },
      { type: 'code', heading: 'PostgreSQL-Specific Features', language: 'sql', label: 'postgres-features.sql', code: `-- ── JSONB — flexible semi-structured data ─────────────────────
CREATE TABLE products (
  id       SERIAL PRIMARY KEY,
  name     VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  attrs    JSONB DEFAULT '{}'  -- Flexible attributes per product type
);

-- Insert with nested JSON
INSERT INTO products (name, category, attrs) VALUES (
  'MacBook Pro 14"',
  'laptop',
  '{"cpu": "M3 Pro", "ram": 18, "storage": 512, "color": "Space Gray", "ports": ["USB-C", "HDMI", "SD"]}'
);

-- Query JSONB fields
SELECT name, attrs->>'cpu' AS cpu, (attrs->>'ram')::int AS ram
FROM products
WHERE category = 'laptop'
  AND (attrs->>'ram')::int >= 16
  AND attrs->'ports' ? 'HDMI';  -- Contains 'HDMI' in array

-- GIN index for fast JSONB queries
CREATE INDEX idx_products_attrs ON products USING GIN (attrs);

-- ── Full-text search ──────────────────────────────────────────
CREATE INDEX idx_products_search ON products
  USING GIN (to_tsvector('english', name || ' ' || COALESCE(attrs->>'description', '')));

SELECT name, ts_rank(
  to_tsvector('english', name),
  plainto_tsquery('english', 'MacBook Pro')
) AS rank
FROM products
WHERE to_tsvector('english', name) @@ plainto_tsquery('english', 'MacBook Pro')
ORDER BY rank DESC;

-- ── Table partitioning for large tables ──────────────────────
-- Range partition by month for events table (100M+ rows)
CREATE TABLE events (
  id         BIGSERIAL,
  user_id    INTEGER NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  payload    JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions (automate this)
CREATE TABLE events_2024_01 PARTITION OF events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
CREATE TABLE events_2024_02 PARTITION OF events
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Query auto-routes to relevant partition only
SELECT * FROM events WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01';

-- ── Advisory locks for distributed coordination ───────────────
-- Ensure only one process runs a specific job at a time
SELECT pg_try_advisory_lock(12345) AS got_lock;
-- Returns true if acquired, false if another session holds it

-- ── LISTEN/NOTIFY for real-time events ───────────────────────
-- Worker 1: subscribe to events
LISTEN user_created;

-- Worker 2: emit event (e.g., after INSERT trigger)
NOTIFY user_created, '{"userId": 123, "email": "alice@example.com"}';` },
      { type: 'code', heading: 'Connection Pooling with pg and Prisma', language: 'typescript', label: 'pg-pool.ts', code: `import { Pool } from 'pg';

// Always use connection pooling in production
// Direct connections are expensive (TCP handshake + auth each time)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,              // Maximum pool size (match DB max_connections)
  min: 2,               // Keep 2 connections warm
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail fast if pool exhausted
  statement_timeout: 30000,    // Kill queries running > 30s
});

// Always release connections back to pool
async function query<T>(sql: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release(); // ALWAYS release — use try/finally
  }
}

// For transactions: use same client
async function transfer(fromId: number, toId: number, amount: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND balance >= $1',
      [amount, fromId]
    );
    
    const { rowCount } = await client.query(
      'SELECT id FROM accounts WHERE id = $1', [fromId]
    );
    if (rowCount === 0) throw new Error('Insufficient funds or invalid account');
    
    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toId]
    );
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}` },
      { type: 'callout', calloutType: 'gold', heading: 'PostgreSQL at Scale', content: 'Instagram served 1 billion users primarily on PostgreSQL by aggressive sharding (1000+ shards) via their Django-ORM abstraction. Shopify processes Black Friday traffic on PostgreSQL with careful read replica routing and connection pooling via PgBouncer. The key: a well-tuned PostgreSQL with proper indexing, connection pooling, and read replicas handles enormous scale before you need to consider alternatives.' },
    ],
    quiz: [
      { question: 'What is the advantage of JSONB over JSON column type in PostgreSQL?', options: ['JSONB allows longer strings', 'JSONB is stored in binary form enabling indexing and efficient operators', 'JSONB validates JSON schema automatically', 'JSONB is human-readable when exported'], correctIndex: 1, explanation: 'JSON stores the raw text (preserving whitespace, key order). JSONB stores parsed binary — it enables GIN indexes for fast key/value lookups, supports the @> containment operator, and is generally faster to query. The only advantage of JSON over JSONB is exact text preservation and slightly faster writes for single-use data.' },
    ]
  },

  'redis': {
    slug: 'redis',
    title: 'Redis',
    tagline: 'In-memory data structures at microsecond speed — the Swiss Army knife of backends',
    sections: [
      { type: 'text', heading: 'What is Redis?', content: 'Redis (Remote Dictionary Server) is an in-memory data structure store used as a database, cache, message broker, and streaming engine. It stores data in RAM, making reads and writes microsecond-fast (typically 0.1-1ms).\n\nKey characteristics: data structures (not just key-value), optional persistence, pub/sub messaging, Lua scripting, atomic operations, and cluster mode for horizontal scaling.' },
      { type: 'code', heading: 'Redis Data Structures', language: 'typescript', label: 'redis-structures.ts', code: `import Redis from 'ioredis';
const r = new Redis(process.env.REDIS_URL);

// ── Strings — cache, counters, simple values ──────────────────
await r.set('user:123:name', 'Alice Smith', 'EX', 3600); // TTL 1 hour
await r.get('user:123:name');                // 'Alice Smith'
await r.incr('api:requests:today');          // Atomic increment
await r.incrby('user:123:credits', 50);      // Add 50 credits atomically

// ── Hashes — object fields ────────────────────────────────────
await r.hset('user:123', { name: 'Alice', email: 'alice@ex.com', role: 'admin' });
await r.hget('user:123', 'name');            // 'Alice'
await r.hmget('user:123', 'name', 'email');  // ['Alice', 'alice@ex.com']
await r.hgetall('user:123');                 // { name: 'Alice', ... }
await r.hincrby('user:123', 'loginCount', 1);

// ── Sorted Sets — leaderboards, rate limiting ─────────────────
// Score = numeric value for ranking
await r.zadd('leaderboard', 1000, 'alice', 850, 'bob', 1200, 'charlie');
await r.zrange('leaderboard', 0, -1, 'WITHSCORES'); // All, ascending
await r.zrevrange('leaderboard', 0, 9, 'WITHSCORES'); // Top 10
await r.zrank('leaderboard', 'alice');       // Position (0-based)
await r.zincrby('leaderboard', 50, 'alice'); // Add 50 points

// ── Sets — unique collections, tags ──────────────────────────
await r.sadd('product:123:tags', 'electronics', 'apple', 'laptop');
await r.smembers('product:123:tags');
await r.sinterstore('result', 'set1', 'set2'); // Intersection of two sets

// ── Lists — queues, recent activity ──────────────────────────
await r.lpush('queue:emails', JSON.stringify({ to: 'alice@ex.com', subject: 'Welcome' }));
await r.rpop('queue:emails');                // Dequeue (FIFO)
await r.lrange('activity:user:123', 0, 9);  // Last 10 activity items

// ── Pub/Sub — real-time messaging ────────────────────────────
const sub = r.duplicate();
await sub.subscribe('notifications:user:123');
sub.on('message', (channel, message) => {
  console.log('New notification:', JSON.parse(message));
});

// Publisher (different connection)
await r.publish('notifications:user:123', JSON.stringify({ text: 'You have a new message' }));` },
      { type: 'code', heading: 'Redis Patterns in Production', language: 'typescript', label: 'redis-patterns.ts', code: `// ── Rate limiting with sliding window ────────────────────────
async function rateLimitCheck(userId: string, limit = 100, windowSecs = 60): Promise<boolean> {
  const key = \`ratelimit:\${userId}:\${Math.floor(Date.now() / 1000 / windowSecs)}\`;
  
  const pipeline = r.pipeline();
  pipeline.incr(key);
  pipeline.expire(key, windowSecs * 2);
  const [[, count]] = await pipeline.exec() as [null, number][];
  
  return count <= limit; // true = allowed
}

// ── Distributed lock ──────────────────────────────────────────
async function withLock<T>(lockKey: string, ttl: number, fn: () => Promise<T>): Promise<T | null> {
  const lockId = crypto.randomUUID();
  const acquired = await r.set(lockKey, lockId, 'NX', 'EX', ttl);
  
  if (!acquired) return null; // Another process holds the lock
  
  try {
    return await fn();
  } finally {
    // Only release if we still own the lock (Lua script for atomicity)
    await r.eval(
      'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end',
      1, lockKey, lockId
    );
  }
}

// ── Session storage ───────────────────────────────────────────
async function storeSession(sessionId: string, userId: string, data: object) {
  await r.setex(
    \`session:\${sessionId}\`,
    7 * 24 * 60 * 60, // 7 days
    JSON.stringify({ userId, ...data, lastAccess: Date.now() })
  );
}

// ── Cache-aside helper ────────────────────────────────────────
async function cached<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<T> {
  const hit = await r.get(key);
  if (hit) return JSON.parse(hit);
  
  const value = await loader();
  await r.setex(key, ttl, JSON.stringify(value));
  return value;
}` },
      { type: 'callout', calloutType: 'warning', heading: 'Redis Persistence Trade-offs', content: 'By default Redis is in-memory only — a restart loses all data. For caches this is fine. For persistent data, enable AOF (Append-Only File) which logs every write, or RDB snapshots (periodic dumps). AOF gives stronger durability but larger files and slower restarts. For production, use Redis Cluster with replicas plus AOF for true HA.' },
    ],
    quiz: [
      { question: 'You need to implement a leaderboard that ranks users by score and supports efficient top-10 queries. Which Redis data structure fits best?', options: ['String with JSON encoding', 'Hash with user IDs as fields', 'Sorted Set with scores as the sort key', 'List with manual sorting'], correctIndex: 2, explanation: 'Sorted Sets maintain elements ordered by a numeric score automatically. ZADD is O(log N), ZRANGE/ZREVRANGE for top-N is O(log N + N). This makes leaderboards trivially efficient — Redis was essentially designed for this use case. Hash would require loading all entries to find rankings.' },
    ]
  },

  'acid': {
    slug: 'acid',
    title: 'ACID & Transactions',
    tagline: 'The four guarantees that make databases trustworthy for financial and critical data',
    sections: [
      { type: 'text', heading: 'Why Transactions Exist', content: 'Databases handle multiple operations that must succeed or fail together. Transferring $100 from Account A to Account B requires: debit A, credit B. If the server crashes between these two operations, money disappears. Transactions bundle multiple operations into an all-or-nothing unit, providing four guarantees summarized as ACID.' },
      { type: 'text', heading: 'The Four ACID Properties', content: '**Atomicity** — All operations in a transaction succeed or all fail. No partial completion. The bank transfer either completes fully or is fully rolled back.\n\n**Consistency** — A transaction brings the database from one valid state to another. Invariants are preserved. Account balances cannot go negative if that constraint is defined.\n\n**Isolation** — Concurrent transactions do not interfere with each other. Each transaction sees a consistent snapshot of data regardless of concurrent modifications.\n\n**Durability** — Once a transaction commits, it persists even through crashes. Data written to disk survives a server restart.' },
      { type: 'code', heading: 'Transactions in PostgreSQL and Prisma', language: 'typescript', label: 'transactions.ts', code: `// ── Raw SQL transaction ───────────────────────────────────────
async function transferFunds(fromId: number, toId: number, amount: number) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Lock both rows to prevent concurrent modification
    const { rows: [from] } = await client.query(
      'SELECT balance FROM accounts WHERE id = $1 FOR UPDATE',
      [fromId]
    );
    
    if (!from || from.balance < amount) {
      throw new Error('Insufficient funds');
    }
    
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [amount, fromId]);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [amount, toId]);
    
    // Audit log — same transaction guarantees consistency
    await client.query(
      'INSERT INTO audit_log (from_id, to_id, amount, type) VALUES ($1, $2, $3, $4)',
      [fromId, toId, amount, 'transfer']
    );
    
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── Prisma transactions ───────────────────────────────────────
async function createOrderWithInventory(userId: number, items: OrderItem[]) {
  return prisma.$transaction(async (tx) => {
    // All operations use the same transaction client (tx)
    
    // Check and reserve inventory atomically
    for (const item of items) {
      const product = await tx.product.update({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      // If no product found (stock check failed), Prisma throws → auto rollback
    }
    
    // Create order
    const order = await tx.order.create({
      data: {
        userId,
        total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
        items: { createMany: { data: items } },
      },
    });
    
    // Create payment record
    await tx.payment.create({
      data: { orderId: order.id, amount: order.total, status: 'pending' }
    });
    
    return order;
    // If any step throws, entire transaction rolls back automatically
  }, {
    timeout: 10000,                    // 10 second transaction timeout
    isolationLevel: 'Serializable',    // Highest isolation
  });
}` },
      { type: 'comparison', heading: 'Transaction Isolation Levels', headers: ['Level', 'Dirty Read', 'Non-repeatable Read', 'Phantom Read', 'Use For'], rows: [
        { aspect: 'Read Uncommitted', Level: 'Read Uncommitted', 'Dirty Read': 'Possible',    'Non-repeatable Read': 'Possible', 'Phantom Read': 'Possible', 'Use For': 'Rarely used — reporting where absolute accuracy not critical' },
        { aspect: 'Read Committed',   Level: 'Read Committed',   'Dirty Read': 'Prevented',   'Non-repeatable Read': 'Possible', 'Phantom Read': 'Possible', 'Use For': 'Default in PostgreSQL — most general purpose work' },
        { aspect: 'Repeatable Read',  Level: 'Repeatable Read',  'Dirty Read': 'Prevented',   'Non-repeatable Read': 'Prevented','Phantom Read': 'Possible', 'Use For': 'Reports requiring consistent snapshot across multiple reads' },
        { aspect: 'Serializable',     Level: 'Serializable',     'Dirty Read': 'Prevented',   'Non-repeatable Read': 'Prevented','Phantom Read': 'Prevented','Use For': 'Financial transfers, inventory management, any critical correctness' },
      ]},
      { type: 'callout', calloutType: 'gold', heading: 'Stripe on Transactions', content: 'Stripe processes millions of payments daily with strong ACID guarantees. Every payment involves multiple database writes that must succeed atomically: charge the card, record the payment, update the balance, trigger webhook. A single transaction failure could mean charging a customer without recording the payment. Stripe uses PostgreSQL serializable transactions with idempotency keys to ensure exactly-once processing even with network retries.' },
    ],
    quiz: [
      { question: 'What does Atomicity guarantee in a database transaction?', options: ['The transaction completes in atomic (nanosecond) time', 'All operations in the transaction succeed or all are rolled back — no partial completion', 'Only one transaction can run at a time', 'Data is written to all replicas atomically'], correctIndex: 1, explanation: 'Atomicity means a transaction is an indivisible unit — either all operations commit or all are rolled back. If a server crash occurs mid-transaction, the database recovers to the state before the transaction began. This prevents partial updates that would leave data in an inconsistent state.' },
    ]
  },

  'indexing': {
    slug: 'indexing',
    title: 'Indexing & Query Optimization',
    tagline: 'The difference between queries taking 0.1ms and taking 10 seconds',
    sections: [
      { type: 'text', heading: 'What is a Database Index?', content: 'An index is a separate data structure that maintains a sorted copy of specific column(s) with pointers back to the original rows. It trades disk space and write overhead for dramatically faster reads.\n\nWithout an index: `WHERE email = "alice@example.com"` on 10M rows requires scanning every row — O(n) with n=10,000,000. With a B-tree index on email: binary search finds the target in O(log n) — about 23 comparisons regardless of table size.' },
      { type: 'analogy', heading: 'Book Index Analogy', content: 'A 1000-page textbook without an index: to find "TCP handshake," read every page front to back. A textbook with a back-of-book index: look up "TCP handshake → pages 47, 312, 678." Done in seconds.\n\nThe database index IS the back-of-book index. It is stored separately, maintained automatically on writes, and searched first before the main table ("heap") is accessed.' },
      { type: 'code', heading: 'Index Types and Usage', language: 'sql', label: 'indexes.sql', code: `-- ── B-tree (default) — equality, range, sorting ─────────────
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Composite index — column order matters (leftmost prefix rule)
CREATE INDEX idx_orders_user_status ON orders(user_id, status, created_at DESC);
-- Supports: WHERE user_id = 1
-- Supports: WHERE user_id = 1 AND status = 'completed'
-- Supports: WHERE user_id = 1 AND status = 'completed' ORDER BY created_at DESC
-- Does NOT use index: WHERE status = 'completed' (missing leftmost column)

-- ── Partial index — index only relevant rows ──────────────────
-- Index only active users (not soft-deleted) — smaller and faster
CREATE INDEX idx_active_users_email ON users(email)
  WHERE deleted_at IS NULL;

-- ── Expression index — index on computed value ────────────────
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
-- Query MUST match: WHERE LOWER(email) = 'alice@example.com'  ✅
-- Not used for:     WHERE email = 'alice@example.com'          ❌

-- ── Covering index — include extra columns (avoid heap access)
CREATE INDEX idx_users_email_covering ON users(email)
  INCLUDE (name, role, created_at);
-- Query only needing email, name, role never touches main table
SELECT name, role FROM users WHERE email = 'alice@example.com'; -- Index only!

-- ── GIN — full-text search, JSONB, arrays ────────────────────
CREATE INDEX idx_products_search ON products
  USING GIN (to_tsvector('english', name || ' ' || description));

CREATE INDEX idx_products_attrs ON products USING GIN (attrs); -- JSONB

-- ── EXPLAIN ANALYZE — see the actual query plan ───────────────
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.name, COUNT(o.id) AS orders
FROM users u
JOIN orders o ON o.user_id = u.id
WHERE u.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.name;

-- Look for:
-- Seq Scan on large table → MISSING INDEX (add one!)
-- Index Scan using idx_name → good
-- Nested Loop with many rows → might need better index or query rewrite
-- Bitmap Heap Scan → partial index scan (fine for moderate selectivity)` },
      { type: 'callout', calloutType: 'warning', heading: 'Index Overhead on Writes', content: 'Every index adds overhead to INSERT, UPDATE, and DELETE — the database must maintain all indexes synchronously. A table with 10 indexes has 11 data structures to update on every write. Heavy write workloads can suffer from over-indexing. Rule: add indexes based on measured slow queries, not speculation. Use pg_stat_user_tables to find tables with many seq_scans.' },
      { type: 'steps', heading: 'Diagnosing Slow Queries', steps: [
        { title: 'Enable pg_stat_statements', detail: 'CREATE EXTENSION pg_stat_statements. Query pg_stat_statements to find top queries by total_time — these are highest priority to optimize.' },
        { title: 'Run EXPLAIN ANALYZE', detail: 'EXPLAIN (ANALYZE, BUFFERS) on the slow query. Look for Seq Scan on large tables — that is a missing index. Check actual vs estimated row counts — large discrepancies mean stale statistics.' },
        { title: 'Run ANALYZE to refresh statistics', detail: 'ANALYZE tablename updates query planner statistics. Run after bulk inserts or if estimated row counts are wildly off.' },
        { title: 'Add targeted index', detail: 'Add index on the column(s) in WHERE, JOIN ON, and ORDER BY. Use CONCURRENTLY to avoid table lock: CREATE INDEX CONCURRENTLY idx_name ON table(col).' },
        { title: 'Verify improvement', detail: 'Re-run EXPLAIN ANALYZE. Confirm Seq Scan replaced by Index Scan. Measure actual query time before and after.' },
      ]},
    ],
    quiz: [
      { question: 'You have a composite index on (user_id, status, created_at). Which query can use this index?', options: ['WHERE status = "completed" — only second column', 'WHERE user_id = 1 — leftmost column only', 'WHERE created_at > "2024-01-01" — rightmost column only', 'WHERE status = "completed" AND created_at > "2024-01-01" — skipping leftmost'], correctIndex: 1, explanation: 'Composite indexes follow the leftmost prefix rule: they can be used starting from the leftmost column. WHERE user_id = 1 uses the index (leftmost prefix). WHERE user_id = 1 AND status = "completed" also uses it. WHERE status = "completed" without user_id cannot use this index — the leftmost column is not constrained.' },
    ]
  },

  'replication': {
    slug: 'replication',
    title: 'Replication & Sharding',
    tagline: 'Scaling databases beyond a single machine for availability and throughput',
    sections: [
      { type: 'text', heading: 'When a Single Database Is Not Enough', content: 'A single database server has finite limits: storage capacity, write throughput, read throughput, and a single point of failure. As applications scale, you need strategies to distribute the load and ensure availability.\n\n**Replication** — Copy data to multiple servers. Reads can be distributed. If the primary fails, a replica becomes primary.\n\n**Sharding (horizontal partitioning)** — Split data across multiple servers. Each server holds a subset of rows. Writes and reads both scale horizontally.' },
      { type: 'comparison', heading: 'Replication Types', headers: ['Approach', 'How It Works', 'Pros', 'Cons'], rows: [
        { aspect: 'Primary-Replica',   Approach: 'Primary-Replica (read replicas)', 'How It Works': 'Writes go to primary, replicated to replicas. Reads distributed across replicas.', Pros: 'Simple, no schema changes needed, replicas handle read scaling', Cons: 'Writes still bottleneck on primary, replication lag on replicas' },
        { aspect: 'Multi-Primary',     Approach: 'Multi-Primary', 'How It Works': 'Any node accepts writes. Conflicts resolved by timestamps or application.', Pros: 'Writes scale horizontally', Cons: 'Conflict resolution complexity, harder consistency guarantees' },
        { aspect: 'Synchronous',       Approach: 'Synchronous replication', 'How It Works': 'Primary waits for replica to confirm write before committing.', Pros: 'Zero data loss on failover', Cons: 'Higher write latency (cross-DC can be 50-100ms)' },
        { aspect: 'Asynchronous',      Approach: 'Asynchronous replication', 'How It Works': 'Primary commits, replicates in background.', Pros: 'Faster writes', Cons: 'Potential data loss if primary fails before replica catches up' },
      ]},
      { type: 'code', heading: 'Read Replica Routing', language: 'typescript', label: 'read-replicas.ts', code: `// Route reads to replicas, writes to primary
class DatabaseRouter {
  private primary: Pool;
  private replicas: Pool[];
  private replicaIndex = 0;
  
  constructor() {
    this.primary = new Pool({ connectionString: process.env.DB_PRIMARY });
    this.replicas = [
      new Pool({ connectionString: process.env.DB_REPLICA_1 }),
      new Pool({ connectionString: process.env.DB_REPLICA_2 }),
    ];
  }
  
  // Round-robin across replicas
  private nextReplica(): Pool {
    const replica = this.replicas[this.replicaIndex % this.replicas.length];
    this.replicaIndex++;
    return replica;
  }
  
  async read(sql: string, params?: any[]): Promise<any[]> {
    try {
      const result = await this.nextReplica().query(sql, params);
      return result.rows;
    } catch (err) {
      // Fallback to primary on replica failure
      console.error('Replica failed, falling back to primary');
      const result = await this.primary.query(sql, params);
      return result.rows;
    }
  }
  
  async write(sql: string, params?: any[]): Promise<any> {
    return this.primary.query(sql, params);
  }
  
  // For reads that must see own writes: read from primary
  async readAfterWrite(sql: string, params?: any[]): Promise<any[]> {
    const result = await this.primary.query(sql, params);
    return result.rows;
  }
}` },
      { type: 'text', heading: 'Sharding Strategies', content: '**Range-based** — Shard by ID range: users 1-1M on shard 1, 1M-2M on shard 2. Simple but can create hot spots.\n\n**Hash-based** — shard = hash(user_id) % numShards. Even distribution but makes range queries across shards expensive.\n\n**Directory-based** — Lookup table maps each entity to its shard. Flexible but adds lookup overhead.\n\n**Geographic** — Shard by user location. European users on EU shards for latency and compliance.\n\nSharding dramatically increases operational complexity: cross-shard joins are expensive/impossible, transactions spanning shards require distributed protocols, adding/removing shards requires resharding.' },
      { type: 'callout', calloutType: 'gold', heading: 'Instagram Sharding', content: 'Instagram sharded PostgreSQL into 12 shards early on, later to thousands. Their schema used a compound ID (shard_id + local_id) so they could route any ID to its shard without a lookup table. All photos by a user live on one shard — their feed queries touch one shard. Cross-user aggregations are avoided by design. Sharding shaped their entire data model.' },
    ],
    quiz: [
      { question: 'What is the main limitation of read replicas for scaling?', options: ['Reads cannot be distributed across replicas', 'Writes still go only to the primary — write capacity does not scale', 'Replicas require different schema than primary', 'Read replicas increase write latency by 10x'], correctIndex: 1, explanation: 'Read replicas distribute read load across multiple servers — excellent for read-heavy workloads. But all writes must go to the primary. If your bottleneck is write throughput (high insert/update rate), read replicas do not help. Sharding or multi-primary replication is needed for write scaling.' },
    ]
  },

  'cap-theorem': {
    slug: 'cap-theorem',
    title: 'CAP Theorem',
    tagline: 'Why distributed systems must choose between consistency and availability during partitions',
    sections: [
      { type: 'text', heading: 'The CAP Theorem', content: 'CAP theorem, proven by Eric Brewer in 2000, states that a distributed data system cannot simultaneously provide all three of:\n\n**Consistency (C)** — Every read receives the most recent write or an error. All nodes see the same data at the same time.\n\n**Availability (A)** — Every request receives a response (not necessarily the most recent data). The system is always operational.\n\n**Partition Tolerance (P)** — The system continues operating when network messages are dropped or delayed between nodes.\n\nNetwork partitions in distributed systems are inevitable — hardware fails, network cables break. So **P is not optional**. The real choice is: when a partition occurs, do you sacrifice C or A?' },
      { type: 'analogy', heading: 'Two Bank Branches Analogy', content: 'Imagine two bank branches with a shared account. Communication between them breaks (network partition).\n\n**CP choice (Consistency over Availability)**: Both branches refuse transactions until communication is restored. You maintain consistency but the bank is unavailable.\n\n**AP choice (Availability over Consistency)**: Both branches continue serving customers. Account might go negative if both branches allow withdrawals simultaneously. Available but potentially inconsistent.\n\nNeither is "wrong" — it depends on the use case. Financial systems often choose CP. Social media likes/counts often choose AP.' },
      { type: 'comparison', heading: 'CP vs AP Systems', headers: ['CP Systems', 'AP Systems'], rows: [
        { aspect: 'During partition', 'CP Systems': 'Reject requests rather than serve stale data', 'AP Systems': 'Serve potentially stale data rather than reject requests' },
        { aspect: 'Examples', 'CP Systems': 'PostgreSQL, HBase, ZooKeeper, etcd', 'AP Systems': 'Cassandra, DynamoDB, CouchDB, Riak' },
        { aspect: 'Consistency model', 'CP Systems': 'Strong consistency — all nodes agree', 'AP Systems': 'Eventual consistency — nodes converge over time' },
        { aspect: 'Best for', 'CP Systems': 'Financial data, inventory, user accounts, anything requiring correctness', 'AP Systems': 'Shopping carts, social feeds, analytics, caches, anything tolerating staleness' },
        { aspect: 'Error behavior', 'CP Systems': 'Returns error during partition', 'AP Systems': 'Returns possibly outdated data during partition' },
      ]},
      { type: 'callout', calloutType: 'info', heading: 'PACELC — A More Complete Model', content: 'CAP only considers behavior during partitions. PACELC extends it: even when the system is running normally (no partition), you must choose between Latency (faster but possibly inconsistent) and Consistency (slower but always consistent). DynamoDB lets you configure this per-query: eventually consistent reads (fast, cheap) vs strongly consistent reads (slower, double cost).' },
      { type: 'callout', calloutType: 'gold', heading: 'Amazon DynamoDB Example', content: 'DynamoDB is an AP system by default (eventual consistency for reads). It prioritizes availability — during AWS availability zone failures, DynamoDB keeps serving reads. The trade-off: a read might return data that is milliseconds stale. For most use cases (shopping cart, user preferences, gaming state) this is acceptable. DynamoDB offers "strongly consistent reads" as an option when you need CP behavior at 2x the cost.' },
    ],
    quiz: [
      { question: 'In the CAP theorem, why is Partition Tolerance considered mandatory for distributed systems?', options: ['Network partitions are required by protocol design', 'P is not actually mandatory — it is just one of three optional choices', 'Network partitions are inevitable in real distributed systems — hardware fails, networks split', 'Partition tolerance is only needed for global systems, not single-region'], correctIndex: 2, explanation: 'Network partitions are a physical reality — hardware fails, network cables break, switches reboot. Assuming a distributed system will never experience a partition is unrealistic. Therefore P is not optional. The actual design choice is: when a partition occurs, do you sacrifice C (serve errors to maintain consistency) or A (serve stale data to maintain availability)?' },
    ]
  },
};

export default TOPIC_CONTENT_PART2;
