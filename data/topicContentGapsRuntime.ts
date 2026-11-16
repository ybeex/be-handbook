// Gap content: Runtimes & Frameworks
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_GAPS_RUNTIME: Record<string, TopicContent> = {
  // ─── PYTHON ─────────────────────────────────────────────────────────────

  "python-backend": {
    slug: "python-backend",
    title: "Python for Backend",
    tagline: "The GIL, async I/O, ASGI, and packaging that survives production",
    sections: [
      {
        type: "text",
        heading: "Why Python Still Runs Backends",
        content:
          "Python trades raw execution speed for developer speed, and for most backends the trade pays off. Requests are usually waiting on a database, a cache, or another service — not burning the CPU — so the language's interpreter overhead is rarely the bottleneck.\n\nThe practical backends split two ways. **Django** ships an opinionated ORM, migrations, admin, and auth, and rewards teams that want batteries included. **FastAPI** is a thin ASGI layer over type hints, Pydantic validation, and dependency injection, and rewards teams that want a small, typed, async-first core. Both eventually meet the same hard constraints: the **GIL**, the choice between **WSGI** and **ASGI**, and reproducible packaging.",
      },
      {
        type: "analogy",
        heading: "One Checkout Lane, Many Shoppers",
        content:
          "CPython is a supermarket with a single checkout lane and a strict rule: only one cashier may ring up items at a time. That rule is the **GIL** (Global Interpreter Lock). If a shopper is slow to find their wallet (waiting on I/O), the cashier just steps aside and serves the next shopper — that is concurrency under the GIL, and it works well.\n\nBut if every shopper needs a hundred items rung up by hand (CPU-bound work), the single lane is the bottleneck: hiring more cashiers changes nothing because only one may operate at a time. To use multiple cores you open a second, entirely separate store — a separate interpreter process — which is exactly what multiprocessing does.",
      },
      {
        type: "text",
        heading: "The GIL: One Thread Executes Bytecode at a Time",
        content:
          "In CPython, the GIL is a mutex that lets only one thread execute Python bytecode at any instant. Threads still interleave, but never truly in parallel for pure-Python CPU work. The lock is released around blocking I/O (sockets, disk, sleep) and inside C extensions that opt out, such as NumPy or most database drivers.\n\nThe consequence is a decision rule. **I/O-bound** work — HTTP calls, database queries, file reads — benefits from threads or async, because the wait releases the GIL. **CPU-bound** work — serialization, hashing, numeric loops — does not; it needs multiprocessing, a native extension, or another language. Python 3.13 introduced an experimental **free-threaded** build (PEP 703) that removes the GIL, but it is opt-in and many C extensions are not yet safe against it.",
      },
      {
        type: "code",
        heading: "Threads vs Processes vs Async",
        language: "plaintext",
        label: "concurrency_models.py",
        code: `import threading, multiprocessing, time

def burn(n: int) -> int:
    x = 0
    for i in range(n):
        x += i * i
    return x

# CPU-bound: threads do NOT help — the GIL serializes bytecode execution
threads = [threading.Thread(target=burn, args=(10_000_000,)) for _ in range(4)]
start = time.perf_counter()
[t.start() for t in threads]
[t.join() for t in threads]
print("4 threads:", time.perf_counter() - start)   # ~ same as running one after another

# CPU-bound: processes DO help — each has its own interpreter and its own GIL
start = time.perf_counter()
with multiprocessing.Pool(4) as pool:
    pool.map(burn, [10_000_000] * 4)
print("4 processes:", time.perf_counter() - start)  # ~ 4x faster on a 4-core box

# I/O-bound: threads (or asyncio) DO help — the GIL is released during the wait
# On Python 3.13+ an opt-in free-threaded build changes the CPU-bound story.`,
      },
      {
        type: "text",
        heading: "async/await and the Event Loop",
        content:
          "Asyncio is single-threaded concurrency built on **cooperative multitasking**. An async def function is a coroutine; it does no work until it is awaited or scheduled on the event loop. The keyword await is the yield point: it suspends the coroutine and hands control back to the loop, which runs other ready work until the awaited operation completes.\n\nThe golden rule is that you must never block the loop. A synchronous time.sleep(1) or a blocking requests.get freezes **every** coroutine in the process for that full second, because there is only one thread. Use asyncio.sleep, httpx.AsyncClient, or an async database driver instead. When you are forced to call a blocking library, push it to a thread pool with await asyncio.to_thread(fn) so the loop keeps spinning.",
      },
      {
        type: "code",
        heading: "A FastAPI Endpoint With Real Async I/O",
        language: "plaintext",
        label: "app/main.py",
        code: `from contextlib import asynccontextmanager
from fastapi import FastAPI
import httpx

@asynccontextmanager
async def lifespan(app: FastAPI):
    # One shared connection pool for the whole process, not one per request
    app.state.client = httpx.AsyncClient(timeout=5.0)
    yield
    await app.state.client.aclose()

app = FastAPI(lifespan=lifespan)

@app.get("/orders/{order_id}")
async def get_order(order_id: str):
    # await yields the event loop to other requests while we wait on the network
    resp = await app.state.client.get("https://api.internal/orders/" + order_id)
    resp.raise_for_status()
    return resp.json()

# Never do this inside an async def: it blocks the entire event loop.
#   requests.get(...)        -> use httpx.AsyncClient
#   time.sleep(1)            -> use asyncio.sleep(1)
#   heavy_cpu_work()         -> use await asyncio.to_thread(heavy_cpu_work)`,
      },
      {
        type: "text",
        heading: "WSGI vs ASGI",
        content:
          "**WSGI** is the long-standing synchronous interface between a Python web app and a server like gunicorn. One worker handles one request at a time; concurrency comes from running many worker processes and threads. It is simple and battle-tested, but it cannot hold thousands of idle connections or speak WebSocket.\n\n**ASGI** is the asynchronous successor. A single event loop can multiplex thousands of concurrent connections, which makes it the right choice for WebSockets, server-sent events, long-polling, and I/O-heavy APIs. The catch is discipline: one blocking call stalls all of those connections at once. Django now supports ASGI and FastAPI is ASGI-native, so the server choice is often uvicorn or hypercorn behind gunicorn.",
      },
      {
        type: "comparison",
        heading: "WSGI vs ASGI",
        headers: ["WSGI", "ASGI"],
        rows: [
          {
            aspect: "Programming model",
            WSGI: "Synchronous functions, one request per worker thread",
            ASGI: "Async coroutines multiplexed on an event loop",
          },
          {
            aspect: "Concurrency source",
            WSGI: "Scale by adding processes and threads",
            ASGI: "Scale by awaiting; one loop holds thousands of connections",
          },
          {
            aspect: "WebSocket / SSE",
            WSGI: "Not supported natively",
            ASGI: "First-class, because the protocol is connection-oriented",
          },
          {
            aspect: "Blocking code",
            WSGI: "Expected and harmless",
            ASGI: "Poisonous — it stalls the entire loop",
          },
          {
            aspect: "Typical server",
            WSGI: "gunicorn with sync workers",
            ASGI: "uvicorn or hypercorn, often under gunicorn",
          },
          {
            aspect: "Best fit",
            WSGI: "Classic request/response CRUD",
            ASGI: "I/O-heavy APIs, streaming, realtime endpoints",
          },
        ],
      },
      {
        type: "text",
        heading: "Packaging with uv and Poetry",
        content:
          "Requirements files pin versions but cannot describe the project: no metadata, no dev/prod split, no lockfile semantics. Modern Python packaging moves everything into **pyproject.toml** (PEP 621) plus a lockfile.\n\n**Poetry** pioneered the ergonomic single tool: poetry add edits pyproject and the lock together, and poetry install reproduces the exact tree. **uv** is the newer, dramatically faster entry (written in Rust): uv sync resolves a universal uv.lock and installs in milliseconds, uv add mutates pyproject and the lock atomically, and uv run executes inside the managed environment. Pick one and commit the lockfile; a lockfile that is not committed is not a lockfile.",
      },
      {
        type: "code",
        heading: "A pyproject.toml and the uv Workflow",
        language: "plaintext",
        label: "pyproject.toml",
        code: `# PEP 621 project metadata — the single source of truth
[project]
name = "orders-api"
version = "0.3.1"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.111",
    "httpx>=0.27",
    "uvicorn[standard]>=0.30",
]

# Dev-only tools, kept out of the production dependency set
[dependency-groups]
dev = ["pytest>=8", "ruff>=0.5", "mypy>=1.10"]

# Typical commands:
#   uv sync                       -> create .venv and install exactly uv.lock
#   uv add httpx                  -> edit pyproject + refresh lock atomically
#   uv run uvicorn app.main:app --workers 4
#   uv lock --upgrade-package httpx   -> bump one dependency across the graph`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "One Blocking Call Freezes Every Coroutine",
        content:
          "Because asyncio runs on a single thread, a synchronous requests.get, a psycopg2 query, or a CPU-heavy loop inside an async def stops the whole event loop — not just the current request. Symptoms look like random p99 latency spikes that vanish under low load. Audit every dependency for an async driver, wrap unavoidable blocking calls in asyncio.to_thread, and never call time.sleep in async code. A single offender can turn a 5 ms p50 into a multi-second p99.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "The GIL lets one thread run Python bytecode at a time; threads help I/O, processes help CPU",
          "Async is cooperative: await yields the loop, but any blocking call freezes all coroutines",
          "Choose WSGI for classic CRUD, ASGI for WebSockets, streaming, and I/O-heavy APIs",
          "Share one connection pool per process via the app lifespan, not one per request",
          "Put dependencies and metadata in pyproject.toml and commit the lockfile",
          "Python 3.13 free-threaded builds remove the GIL, but are opt-in and extension-dependent",
        ],
      },
    ],
    quiz: [
      {
        question:
          "A service spends most of its time at 100% CPU resizing images in pure Python. Which change actually uses more cores?",
        options: [
          "Switching from threads to asyncio",
          "Running the work in a multiprocessing pool",
          "Adding more threads to the same process",
          "Increasing the worker thread count in gunicorn",
        ],
        correctIndex: 1,
        explanation:
          "Pure-Python CPU work is serialized by the GIL, so extra threads do not run in parallel. Separate processes each have their own interpreter and GIL, so a multiprocessing pool spreads the work across cores. Async and more threads only help when the work is I/O-bound.",
      },
      {
        question: "What does await do inside an async function?",
        options: [
          "Starts a new OS thread for the awaited call",
          "Blocks the current thread until the result is ready",
          "Suspends the coroutine and returns control to the event loop",
          "Acquires the GIL before continuing",
        ],
        correctIndex: 2,
        explanation:
          "await suspends the coroutine at a yield point and hands control back to the event loop, which runs other ready coroutines while the awaited operation completes. It does not spawn a thread and should never block the loop.",
      },
      {
        question: "Which workload most strongly argues for ASGI over WSGI?",
        options: [
          "A nightly batch job that computes reports",
          "An endpoint that holds thousands of open WebSocket connections",
          "A static file server",
          "A cron-triggered email sender",
        ],
        correctIndex: 1,
        explanation:
          "ASGI's event loop can multiplex thousands of long-lived connections in one process, which is exactly what WebSockets and server-sent events need. WSGI is synchronous and request-per-worker, so it cannot hold many idle connections efficiently.",
      },
      {
        question:
          "What is the purpose of committing a lockfile such as uv.lock or poetry.lock?",
        options: [
          "It compiles the Python code for faster startup",
          "It records the exact resolved dependency versions so builds are reproducible",
          "It lists only the direct dependencies",
          "It replaces pyproject.toml",
        ],
        correctIndex: 1,
        explanation:
          "A lockfile pins the full resolved dependency graph — every transitive package and version — so CI and production install byte-for-byte identical environments. Without it, a loose version range can resolve differently on each machine.",
      },
    ],
  },

  // ─── GO ─────────────────────────────────────────────────────────────────

  "go-backend": {
    slug: "go-backend",
    title: "Go for Backend",
    tagline: "Goroutines, explicit errors, and context that cancels cleanly",
    sections: [
      {
        type: "text",
        heading: "Why Go Fits Network Services",
        content:
          "Go was designed for exactly the shape of modern backends: many concurrent network connections, compiled binaries with no runtime to install, and a small language that whole teams can read. Its concurrency model, error handling, and garbage collector are the three pillars you must understand.\n\nThe language is deliberately boring. There is one loop keyword, one formatter, and no exceptions. That minimalism is the point: the cognitive budget goes into the service's behaviour, not into mastering a sprawling feature set.",
      },
      {
        type: "analogy",
        heading: "A Fleet of Cheap Workers and Mailroom Slots",
        content:
          "A **goroutine** is a worker you can hire for almost nothing — a couple of kilobytes to start, not a megabyte like an OS thread. The Go scheduler multiplexes thousands of these workers onto a handful of real OS threads, so you write simple blocking code and the runtime makes it concurrent.\n\nA **channel** is a labeled mailroom slot. Instead of workers rummaging through shared shelves and colliding, they drop a package in a slot and someone else picks it up. The channel both carries the data and synchronizes the handoff, which is why the Go proverb says not to communicate by sharing memory but to share memory by communicating.",
      },
      {
        type: "text",
        heading: "Goroutines and Channels",
        content:
          "Start a goroutine with the go keyword. Because it is cheap, the idiomatic pattern is one goroutine per connection, per task, or per outbound call. **Channels** come in two flavors: unbuffered channels synchronize the sender and receiver (a handoff), while buffered channels absorb bursts until the buffer fills.\n\nThe rule that trips people up: only the **sender** closes a channel, and only when no more values will ever be sent. Closing signals 'no more values', and receiving from a closed channel returns the zero value immediately with ok == false. Sending on a closed channel panics, so multiple senders must coordinate — most often with a sync.WaitGroup that closes the channel after the last sender finishes.",
      },
      {
        type: "code",
        heading: "Fan-Out With a WaitGroup and a Closed Channel",
        language: "plaintext",
        label: "fanout.go",
        code: `package main

import (
	"context"
	"errors"
	"fmt"
	"sync"
	"time"
)

func fetch(ctx context.Context, id string, out chan<- string) error {
	select {
	case <-time.After(50 * time.Millisecond): // stand-in for a network call
		out <- "order-" + id
		return nil
	case <-ctx.Done(): // caller cancelled or the deadline passed
		return ctx.Err()
	}
}

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel() // always release the timer to avoid a context leak

	var wg sync.WaitGroup
	out := make(chan string, 3) // buffered: senders never block if the reader lags
	for _, id := range []string{"1", "2", "3"} {
		wg.Add(1)
		go func(id string) {
			defer wg.Done()
			if err := fetch(ctx, id, out); err != nil && !errors.Is(err, context.Canceled) {
				fmt.Println("error:", err)
			}
		}(id)
	}

	go func() { wg.Wait(); close(out) }() // exactly one closer, after all senders

	for v := range out {
		fmt.Println("got", v)
	}
}`,
      },
      {
        type: "text",
        heading: "Errors Are Values: Wrap, Don't Panic",
        content:
          "Go has no exceptions; functions return an error as the last value and you handle it explicitly with if err != nil. Tedious at first, illuminating in production: every failure path is visible in the code you are reading.\n\nUse fmt.Errorf with the %w verb to **wrap** an error and preserve the chain, then test the chain with errors.Is (for sentinel errors like io.EOF) and errors.As (to extract a typed error carrying detail). Add context to each layer — 'reading config: opening file: permission denied' — because a bare error that reaches a log without a call site forces a debugging expedition. panic is for programmer bugs and unrecoverable startup failures, never for expected runtime errors.",
      },
      {
        type: "text",
        heading: "context.Context: Deadlines and Cancellation",
        content:
          "context.Context threads cancellation, deadlines, and request-scoped values through your whole call stack. Every network call — database query, HTTP request, gRPC call — should accept a context and honour its cancellation.\n\nCreate a root with context.Background or context.TODO, then derive children: WithTimeout and WithCancel for cancellation, WithValue only for request-scoped metadata such as a trace id. When a deadline passes or cancel() is called, the context's Done() channel closes and anything selecting on it unblocks. Two disciplines are non-negotiable: always defer cancel() to release the associated timer, and never store a context inside a struct — pass it as the first argument, explicitly, from request handler to driver.",
      },
      {
        type: "code",
        heading: "Honouring a Context in an Outbound Call",
        language: "plaintext",
        label: "client.go",
        code: `func (c *Client) GetOrder(ctx context.Context, id string) (*Order, error) {
	// The context deadline propagates into the HTTP request; if the caller
	// cancels, this request is aborted instead of leaking a slow connection.
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.base+"/orders/"+id, nil)
	if err != nil {
		return nil, fmt.Errorf("build request: %w", err)
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("get order %s: %w", id, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("get order %s: unexpected status %d", id, resp.StatusCode)
	}

	var order Order
	if err := json.NewDecoder(resp.Body).Decode(&order); err != nil {
		return nil, fmt.Errorf("decode order %s: %w", id, err)
	}
	return &order, nil
}`,
      },
      {
        type: "text",
        heading: "net/http and the Standard Library",
        content:
          "Go's standard library ships a production-grade HTTP server and client, so most services need no framework at all. http.ServeMux handles routing; since Go 1.22 the mux supports method patterns and path wildcards like 'POST /orders/{id}'. Middleware is just a function that takes an http.Handler and returns one, which makes logging, recovery, and auth trivial to compose.\n\nThe server is also a collection of timeouts you must set, because the zero value means 'wait forever'. Configure ReadTimeout, WriteTimeout, ReadHeaderTimeout, and IdleTimeout, and set a MaxHeaderBytes cap. An unbounded server is a slow-loris DoS waiting to happen. On the client side, always reuse a single http.Client with a tuned Transport so connection pooling actually works.",
      },
      {
        type: "comparison",
        heading: "Goroutines vs OS Threads",
        headers: ["Goroutines", "OS Threads"],
        rows: [
          {
            aspect: "Initial stack",
            Goroutines: "A few KB, grows and shrinks on demand",
            "OS Threads": "Roughly 1 MB reserved by the OS",
          },
          {
            aspect: "Scheduling",
            Goroutines: "In userspace by the Go runtime (M:N)",
            "OS Threads": "By the kernel, with a context switch cost",
          },
          {
            aspect: "Practical count",
            Goroutines: "Hundreds of thousands per process",
            "OS Threads": "Thousands before memory and switching hurt",
          },
          {
            aspect: "Creation cost",
            Goroutines: "Nanoseconds; just a go statement",
            "OS Threads": "Microseconds and a syscall",
          },
          {
            aspect: "Blocking calls",
            Goroutines: "Runtime parks the goroutine, not the thread",
            "OS Threads": "The OS blocks the whole thread",
          },
          {
            aspect: "Main failure mode",
            Goroutines: "Leaks when a goroutine blocks on a channel forever",
            "OS Threads": "Exhaustion and scheduler thrash",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Goroutine Leaks Are Silent Until They Are Not",
        content:
          "A goroutine blocked forever on a channel send, a time.Ticker, or an unresponsive dependency never exits, and nothing crashes — the process just grows. A leak of a few goroutines per request looks fine under test and kills the service in production after a day. Always give blocking work a cancel path via context, stop tickers with defer ticker.Stop(), and expose runtime.NumGoroutine() as a metric so a slow climb is visible before the OOM.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Goroutines are cheap; the runtime multiplexes thousands onto a few OS threads",
          "Only the sender closes a channel, and only when no more values will be sent",
          "Wrap errors with %w and inspect them with errors.Is and errors.As",
          "Thread context.Context through every call; always defer cancel()",
          "The standard net/http is production-grade — set read, write, header, and idle timeouts",
          "Watch goroutine count as a metric; a slow rise means a leak you cannot see in code review",
        ],
      },
    ],
    quiz: [
      {
        question: "In Go, who is responsible for closing a channel?",
        options: [
          "The receiver, once it is done reading",
          "Any goroutine, whenever convenient",
          "The sender, once it will send no more values",
          "The garbage collector, automatically",
        ],
        correctIndex: 2,
        explanation:
          "Closing a channel signals 'no more values'. Only the sender knows when it is finished sending, and closing from the receiver or multiple senders risks a panic from sending on a closed channel. With multiple senders, coordinate with a WaitGroup and close after the last one.",
      },
      {
        question:
          "Which verb wraps an error so that errors.Is and errors.As can still walk the chain?",
        options: ["%v", "%s", "%w", "%+v"],
        correctIndex: 2,
        explanation:
          "fmt.Errorf with %w wraps the underlying error, preserving the chain for errors.Is (sentinel matching) and errors.As (typed extraction). %v and %s flatten it into a string and lose the chain.",
      },
      {
        question:
          "Why must you call the cancel function returned by context.WithCancel or WithTimeout?",
        options: [
          "It is required for the context to be usable at all",
          "It releases the associated timer and signals children to stop",
          "It closes all channels created from the context",
          "It restarts the deadline for the next call",
        ],
        correctIndex: 1,
        explanation:
          "The cancel function releases the resources (such as a timer) held by the context and propagates cancellation to all derived contexts. Skipping it via defer cancel() leaks them until the parent is garbage-collected, which may be never for a long-lived parent.",
      },
      {
        question:
          "A goroutine is blocked forever sending on an unbuffered channel nobody reads. What happens?",
        options: [
          "The runtime kills it after a timeout",
          "It is garbage-collected automatically",
          "It leaks and keeps its memory for the life of the process",
          "Sending panics immediately",
        ],
        correctIndex: 2,
        explanation:
          "A goroutine with no exit path is a leak. It stays parked holding its stack, and the count climbs silently. Standard defenses are context-based cancellation, buffering where appropriate, and monitoring runtime.NumGoroutine().",
      },
    ],
  },

  // ─── JAVA ────────────────────────────────────────────────────────────────

  "java-backend": {
    slug: "java-backend",
    title: "Java & Spring Boot",
    tagline: "The JVM, virtual threads, and the sprawling Spring ecosystem",
    sections: [
      {
        type: "text",
        heading: "The JVM: Write Once, Tune Everywhere",
        content:
          "Java's real product is not the language but the **JVM** — a runtime that compiles bytecode to native code with a just-in-time compiler, manages memory with a garbage collector, and runs the same artifact on any platform. That runtime is why enterprise backends standardised on Java for two decades.\n\nTwo properties define how Java services behave. **JIT compilation** means the first few thousand calls are interpreted and then hot code is compiled to native and aggressively optimised, so throughput warms up over minutes. **Automatic memory management** means you do not free objects, but you must understand the collector, because GC pauses and heap sizing drive your tail latency. Modern stacks are Java 21+ with Spring Boot 3.",
      },
      {
        type: "analogy",
        heading: "A Factory Floor With an Automated Cleaning Crew",
        content:
          "Every object you allocate is a crate set down on the factory floor. When you are done, you do not carry it out yourself — a **garbage collector** (the cleaning crew) periodically patrols and clears crates no worker can still reach.\n\nA stop-the-world pause is the moment the crew locks the doors so it can sweep safely without crates moving. A small, frequent sweep of the young area is cheap. A sweep of a crowded old area, with no time budget, causes a visible stall. Choosing and tuning the collector is really about deciding how long, and how often, you are willing to lock the doors.",
      },
      {
        type: "text",
        heading: "Platform Threads vs Virtual Threads",
        content:
          "For years, Java's concurrency unit was the **platform thread**, a thin wrapper over an OS thread costing roughly a megabyte of stack. To serve thousands of concurrent requests you either pooled threads and made callers wait, or went fully reactive with a callback monad — powerful but hard to read and debug.\n\nJava 21 shipped **virtual threads** (Project Loom). They are scheduled by the JVM onto a small pool of carrier OS threads, are cheap enough to create one per task, and — crucially — **unmount** from the carrier whenever the code blocks on I/O. That means you can write plain blocking, sequential code and still scale to massive concurrency. The old assumption 'blocking is expensive' flips: with virtual threads, blocking is the normal, cheap thing, and pools of platform threads become an anti-pattern.",
      },
      {
        type: "code",
        heading: "A Spring Boot Service With Constructor Injection",
        language: "plaintext",
        label: "OrdersApplication.java",
        code: `@SpringBootApplication
public class OrdersApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrdersApplication.class, args);
    }
}

@RestController
@RequestMapping("/orders")
class OrderController {
    private final OrderService orders;

    // Constructor injection: Spring supplies the singleton, no field magic,
    // and the dependency is final so it cannot change after construction.
    OrderController(OrderService orders) {
        this.orders = orders;
    }

    @GetMapping("/{id}")
    OrderDto get(@PathVariable String id) {
        return orders.find(id);
    }
}

@Service
class OrderService {
    private final OrderRepository repo;

    OrderService(OrderRepository repo) {
        this.repo = repo;
    }

    OrderDto find(String id) {
        return repo.findById(id)
                   .map(OrderDto::from)
                   .orElseThrow(() -> new OrderNotFound(id));
    }
}`,
      },
      {
        type: "text",
        heading: "Dependency Injection and the Spring Container",
        content:
          "Spring's core is an **IoC container**: you declare beans and their dependencies, and the container constructs, wires, and hands them out. **Dependency injection** inverts the usual 'this class builds its collaborators' flow — instead the class declares what it needs and the framework provides it.\n\nPrefer **constructor injection** over field injection. It makes dependencies explicit and final, guarantees the object is never partially built, and lets you construct the class in a plain unit test with no Spring harness running. Scope matters too: beans are singletons by default, so they must be **stateless** or thread-safe. The classic production bug is caching request data in a singleton field and watching one user's data leak into another's response.",
      },
      {
        type: "text",
        heading: "The Spring Ecosystem",
        content:
          "Spring Boot is an opinionated layer over the Spring Framework: starters pull in curated dependency sets, auto-configuration wires beans from the classpath, and an embedded server means your artifact is a runnable jar. Around it sits an ecosystem that covers almost every backend concern.\n\n**Spring Data** gives you repository interfaces that generate queries from method names and derive from JPA. **Spring Security** handles authentication, authorization, and filters. **Spring WebFlux** is the reactive stack, now often unnecessary once virtual threads make blocking code scale. **Spring Cloud** adds config, service discovery, and gateway patterns. The trap is breadth: every starter you add is a dependency you now own and upgrade. Add them deliberately, and keep the surface small.",
      },
      {
        type: "code",
        heading: "Scaling With Virtual Threads",
        language: "plaintext",
        label: "VirtualThreads.java",
        code: `// Java 21: one thread per task, no pool sizing, blocking code is fine again
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (var orderId : orderIds) {
        executor.submit(() -> processOrder(orderId)); // each blocks on its own I/O
    }
} // close() waits for every task to finish

// Spring Boot 3.2+: opt in with a single property in application.properties
//   spring.threads.virtual.enabled=true
// Tomcat then hands each request to a virtual thread instead of a pooled one.

// Watch out: synchronized blocks pin a virtual thread to its carrier.
// Prefer java.util.concurrent.locks.ReentrantLock, which unmounts correctly.`,
      },
      {
        type: "comparison",
        heading: "Platform Threads vs Virtual Threads",
        headers: ["Platform Threads", "Virtual Threads"],
        rows: [
          {
            aspect: "Backing",
            "Platform Threads": "One-to-one with an OS thread",
            "Virtual Threads":
              "Many-to-few, scheduled by the JVM onto carriers",
          },
          {
            aspect: "Memory per thread",
            "Platform Threads": "About 1 MB of stack reserved",
            "Virtual Threads": "A few hundred bytes, on the heap",
          },
          {
            aspect: "Practical scale",
            "Platform Threads": "Hundreds to low thousands",
            "Virtual Threads": "Hundreds of thousands",
          },
          {
            aspect: "Blocking I/O",
            "Platform Threads": "Pools threads so callers queue",
            "Virtual Threads": "Unmounts from the carrier, no cost",
          },
          {
            aspect: "Programming model",
            "Platform Threads": "Pools, or a fully reactive stack",
            "Virtual Threads": "Plain sequential blocking code",
          },
          {
            aspect: "Main pitfall",
            "Platform Threads": "Thread exhaustion under load",
            "Virtual Threads": "Pinning via synchronized or native calls",
          },
        ],
      },
      {
        type: "text",
        heading: "GC Tuning: Pause vs Throughput",
        content:
          "The garbage collector is a dial between **throughput** (total work done) and **pause** (how long the app stops). For a request-serving backend, tail latency is usually king, so the modern default is **G1** and, for very large heaps and low-latency SLAs, **ZGC** or **Shenandoah**, both of which keep pauses in the low milliseconds even on heaps of tens of gigabytes.\n\nTuning follows measurement, not folklore. Give the heap a fixed -Xms equal to -Xmx to avoid resize churn, size the young generation so short-lived objects die cheaply, and cap the pause goal where the collector supports it. If you are chasing pauses, enable GC logging, look at allocation rate and promotion, and fix the allocating code path before turning collector knobs. Most 'GC problems' are really 'allocating in a hot loop' problems.",
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Warmup Is Real: Do Not Read Latency From the First Minute",
        content:
          "A freshly started JVM interprets bytecode, and the JIT only optimises methods after they become hot, so early requests are slower and early throughput is misleading. This matters in autoscaling clusters: a new instance that scales in cold serves tail latency for a while. Mitigations include warming endpoints called before the instance joins the pool, tiered compilation tuned for faster warmup, and AppCDS or ahead-of-time tooling. Never benchmark or alert on the first minute after a deploy.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "The JVM's JIT and garbage collector define Java's warmup and latency profile",
          "Virtual threads make blocking code scale cheaply — one thread per task",
          "Prefer constructor injection, and keep singleton beans stateless",
          "Add Spring starters deliberately; every one is a dependency you must upgrade",
          "Tune GC with logs and allocation data, not folklore; fix allocating code first",
          "Never judge latency or performance from the first minute after a deploy",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What is the main advantage of virtual threads over platform threads?",
        options: [
          "They run bytecode faster on each core",
          "They let blocking, sequential code scale to enormous concurrency cheaply",
          "They eliminate garbage collection pauses",
          "They remove the need for dependency injection",
        ],
        correctIndex: 1,
        explanation:
          "Virtual threads are cheap to create and unmount from their carrier OS thread when they block on I/O, so you can write plain sequential blocking code and still handle hundreds of thousands of concurrent tasks. They do not make bytecode run faster or change GC.",
      },
      {
        question:
          "Why is constructor injection generally preferred over field injection?",
        options: [
          "Field injection is not supported by newer Spring versions",
          "Constructor injection makes dependencies explicit, final, and testable without a container",
          "Constructor injection is required for virtual threads to work",
          "Field injection prevents bean scoping",
        ],
        correctIndex: 1,
        explanation:
          "Constructor injection forces the dependency to be provided at construction, keeps the field final, and guarantees the object is never partially initialized. It also lets you build the class directly in a unit test without booting Spring.",
      },
      {
        question:
          "A Java service must keep pause times in the low milliseconds on a very large heap. Which collector is the best fit?",
        options: ["Serial GC", "Parallel GC", "G1", "ZGC"],
        correctIndex: 3,
        explanation:
          "ZGC (and Shenandoah) are designed for very low, bounded pause times even on heaps of many gigabytes. Serial and Parallel optimise throughput at the cost of longer stop-the-world pauses, and G1 is a solid general default but still has higher worst-case pauses than ZGC.",
      },
      {
        question:
          "You cache the current request's user id in a mutable field of a singleton @Service bean. What is the likely bug?",
        options: [
          "The bean will fail to start",
          "Requests will see each other's user data under concurrency",
          "Virtual threads will throw an exception",
          "The JIT will refuse to compile the method",
        ],
        correctIndex: 1,
        explanation:
          "Singleton beans are shared across all requests, so a mutable field is shared state. Under concurrency one request overwrites another's data. Keep beans stateless and pass request-scoped data as method arguments or through injection.",
      },
    ],
  },

  // ─── RUST ────────────────────────────────────────────────────────────────

  "rust-backend": {
    slug: "rust-backend",
    title: "Rust for Backend",
    tagline: "Ownership, tokio, and concurrency the compiler proves is safe",
    sections: [
      {
        type: "text",
        heading: "Why Reach for Rust on the Server",
        content:
          "Rust offers C-level performance with a memory-safety guarantee enforced at compile time: no null dereferences, no use-after-free, no data races, and no garbage collector pausing your service. That combination — predictable latency, low memory, and safety — is why it increasingly powers databases, proxies, and high-throughput services.\n\nThe cost is a steeper learning curve, especially the ownership and borrow rules, and slower compile times. For a typical CRUD API the ergonomics of Go or TypeScript usually win. Rust earns its place where performance, resource ceilings, or correctness under concurrency are the binding constraints.",
      },
      {
        type: "analogy",
        heading: "A Library, Not a Photocopier",
        content:
          "In most languages, handing a value to a function is like photocopying a document — cheap to give away, but now two copies can drift apart. Rust treats each value like a **library book with exactly one owner**. You may **lend** it out (borrow) to as many readers as you like, but only while nobody is editing it. To let someone edit it, you lend it exclusively, and nobody else may touch it until it is returned.\n\nThe shadow of data races is gone because it is simply illegal for one person to edit the book while another is reading. The compiler is the strict librarian who refuses to let you break the rule — which is why so many Rust services are correct under concurrency by construction.",
      },
      {
        type: "code",
        heading: "Ownership and Borrowing in Twenty Lines",
        language: "plaintext",
        label: "ownership.rs",
        code: `fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}

fn take_ownership(s: String) -> String { s } // moves in, moves out

fn main() {
    let mut names = vec!["Ada".to_string(), "Linus".to_string()];

    // Many immutable borrows are allowed at once.
    let longest_name = longest(&names[0], &names[1]);
    println!("longest = {longest_name}");

    // A mutable borrow is exclusive; the compiler forbids any alias at the same time.
    names.push("Grace".to_string());

    // take_ownership(names);  // would move names out of scope,
    // println!("{names:?}");  // so this line would fail to compile after the move.
    println!("{names:?}");
}`,
      },
      {
        type: "text",
        heading: "The Borrow Checker Is Your Reviewer",
        content:
          "Ownership has three rules: every value has a single owner, a value is dropped when its owner goes out of scope, and a value can be either **mutably borrowed once** or **immutably borrowed many times**, but never both at the same time. The borrow checker verifies these rules statically.\n\nThis is why Rust needs no runtime race detector: aliasing a mutable reference is a compile error, so the classic 'two threads write the same field without a lock' bug cannot compile. Lifetimes are just the notation the compiler uses to prove that a reference never outlives the data it points to. Fighting the borrow checker usually means your design wanted a lock, a clone, or a restructuring — not that the compiler is wrong.",
      },
      {
        type: "text",
        heading: "Async With tokio",
        content:
          "Rust's async/await is **zero-cost**: an async function compiles into a state machine that implements the Future trait and does nothing until polled. Unlike Go, Rust ships no runtime in the language, so you choose one — and **tokio** is the de facto standard, providing a work-stealing multi-threaded executor, timers, and async I/O.\n\nThe #[tokio::main] attribute spins up the runtime. Inside it, an async fn returns a future that the executor drives, and .await suspends without blocking the worker thread. The subtle trap is blocking: a synchronous std::thread::sleep or a blocking file or CPU call inside an async task blocks a worker thread and can starve the executor. Use tokio::task::spawn_blocking for unavoidable blocking work, and tokio::time::sleep for delays.",
      },
      {
        type: "code",
        heading: "An Axum Handler on the tokio Runtime",
        language: "plaintext",
        label: "main.rs",
        code: `use axum::{extract::Path, routing::get, Json, Router};
use serde::Serialize;

#[derive(Serialize)]
struct Order {
    id: String,
    total_cents: i64,
}

async fn get_order(Path(id): Path<String>) -> Json<Order> {
    // An async fn returns a future; tokio drives it on a work-stealing executor.
    Json(Order { id, total_cents: 4200 })
}

#[tokio::main]
async fn main() {
    let app = Router::new().route("/orders/{id}", get(get_order));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}`,
      },
      {
        type: "text",
        heading: "Fearless Concurrency",
        content:
          "Rust's headline promise is 'fearless concurrency': the type system makes data races a compile-time error. The traits Send (safe to move across threads) and Sync (safe to share references across threads) are checked automatically, and the borrow rules mean shared mutation must go through explicit synchronization such as Arc<Mutex<T>> or a channel.\n\nIn practice you share immutable state with Arc<T>, share mutable state with Arc<Mutex<T>> (or RwLock for read-heavy data), and prefer message passing with channels where it fits. Because the compiler enforces these rules, a whole class of production incidents — the race that fires once a week under load and is impossible to reproduce — simply does not compile.",
      },
      {
        type: "comparison",
        heading: "When Rust Beats Go",
        headers: ["Rust", "Go"],
        rows: [
          {
            aspect: "Memory safety",
            Rust: "Enforced at compile time, no GC",
            Go: "Enforced at runtime by a GC",
          },
          {
            aspect: "Latency profile",
            Rust: "Deterministic; no GC pauses",
            Go: "Occasional GC pauses, usually small",
          },
          {
            aspect: "Peak throughput",
            Rust: "Highest; near-C performance",
            Go: "Very good, a step behind Rust",
          },
          {
            aspect: "Learning curve",
            Rust: "Steep — ownership and borrow checker",
            Go: "Gentle — small language, quick ramp",
          },
          {
            aspect: "Compile times",
            Rust: "Slow, especially with heavy generics",
            Go: "Fast by design",
          },
          {
            aspect: "Sweet spot",
            Rust: "Databases, proxies, tight resource budgets, correctness-critical",
            Go: "Network services, CLIs, teams trading speed for velocity",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Blocking Inside an Async Task Starves the Executor",
        content:
          "tokio runs many async tasks on a small pool of worker threads, so a single blocking call — std::thread::sleep, a synchronous database driver, or a heavy CPU loop — holds a worker and prevents other tasks from making progress. As enough workers block, the whole runtime stalls even though nothing is 'busy' in the CPU sense. Wrap unavoidable blocking work in tokio::task::spawn_blocking, use async drivers throughout, and never reach for the standard library's blocking primitives inside an async task.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Ownership gives one owner per value; borrowing is many readers or one writer, never both",
          "The borrow checker makes data races a compile error — that is 'fearless' concurrency",
          "async/await is zero-cost; you bring your own runtime, and tokio is the standard",
          "Never block inside an async task; use spawn_blocking for unavoidable blocking calls",
          "Share immutable state with Arc, mutable state with Arc<Mutex<T>>, or use channels",
          "Pick Rust for resource ceilings and correctness-critical paths, not for ordinary CRUD",
        ],
      },
    ],
    quiz: [
      {
        question: "Which statement matches Rust's borrowing rules?",
        options: [
          "You may have many mutable borrows at once",
          "You may have either many immutable borrows or one mutable borrow, never both",
          "References never expire",
          "A value can have multiple owners via plain assignment",
        ],
        correctIndex: 1,
        explanation:
          "Rust allows many shared (immutable) borrows or exactly one exclusive (mutable) borrow at a time. Aliasing mutable references is a compile error, which is precisely what rules out data races statically.",
      },
      {
        question: "What role does tokio play in a Rust backend?",
        options: [
          "It is the garbage collector",
          "It is the async runtime that drives futures and provides I/O and timers",
          "It is the package manager",
          "It compiles Rust to bytecode",
        ],
        correctIndex: 1,
        explanation:
          "Rust's async is runtime-agnostic; tokio provides the executor that polls futures, plus async I/O, timers, and task spawning. Cargo is the package manager and there is no garbage collector or bytecode step.",
      },
      {
        question:
          "Why is calling std::thread::sleep inside an async task dangerous?",
        options: [
          "It panics at runtime",
          "It blocks a tokio worker thread, starving other tasks on the executor",
          "It uses too much memory",
          "It invalidates all borrows",
        ],
        correctIndex: 1,
        explanation:
          "Blocking calls hold a worker thread, so other tasks scheduled on that thread cannot run. Enough blocked workers and the whole runtime grinds to a halt. Use tokio::time::sleep and wrap unavoidable blocking work in spawn_blocking.",
      },
      {
        question:
          "For a typical CRUD API with a moderate team, what is the most defensible reason to choose Rust over Go?",
        options: [
          "Rust has a much gentler learning curve",
          "Rust compiles faster",
          "A hard resource ceiling or latency requirement demands no GC and near-C performance",
          "Go cannot handle concurrent requests",
        ],
        correctIndex: 2,
        explanation:
          "Rust's advantage is deterministic latency, no GC, and top-tier throughput, which matters when resources or tail latency are the binding constraints. Go is easier to learn and faster to compile, so for ordinary CRUD it usually wins on velocity.",
      },
    ],
  },

  // ─── SERVERLESS ──────────────────────────────────────────────────────────

  "serverless-faas": {
    slug: "serverless-faas",
    title: "Serverless & FaaS",
    tagline: "Cold starts, per-invocation scaling, and knowing when it fits",
    sections: [
      {
        type: "text",
        heading: "What Serverless Actually Means",
        content:
          "Serverless does not remove servers; it removes server **management** from you. You deploy a function or container image, the platform provisions capacity on demand, scales with traffic, and bills per invocation and per millisecond of execution. There is no instance to patch, size, or keep warm yourself.\n\nThe trade is control for elasticity. You cannot pick your kernel flags, you have hard limits on time and memory, and the platform decides when to reuse a warm environment and when to start a cold one. Serverless pays off when traffic is **bursty or unpredictable** and the work is short and stateless. It hurts when traffic is steady and high, when requests are long-lived, or when you need a warm connection pool held open continuously.",
      },
      {
        type: "analogy",
        heading: "Taxis vs Owning a Car",
        content:
          "Owning a car (a container or VM) means paying for it around the clock, whether you drive it or not, but it is ready the instant you turn the key. A taxi (a serverless function) costs nothing to have available and you only pay per ride — but you must wait at the curb for one to arrive, and at peak times the wait is longer.\n\nFor a commute that happens every single day at 8 a.m., owning is cheaper and always ready. For a handful of unpredictable trips, taxis win easily. Serverless has the same shape: unbeatable for spiky, occasional work, beaten soundly by a warm fleet for steady, constant load. The 'wait at the curb' is the **cold start**.",
      },
      {
        type: "text",
        heading: "Cold Starts and Warm Reuse",
        content:
          "A **cold start** is the latency of creating a fresh execution environment: the platform schedules capacity, starts the runtime, and runs your initialization code before your handler runs. Depending on language and dependencies, that can be tens of milliseconds for a small JavaScript function or several seconds for a JVM service loading a framework.\n\nThe key mental model is that the platform keeps environments **warm** and reuses them for subsequent invocations, so a warm call skips initialization entirely. That reuse is also why **global or module-scope state persists** between invocations — a place to cache configuration and hold a reused database connection, and a trap if you accidentally keep per-request state there. Reduce cold starts by trimming dependencies, using a faster runtime, provisioning a small amount of concurrency to keep a warm pool, and moving expensive clients up to module scope (or into a lifecycle extension).",
      },
      {
        type: "code",
        heading: "A Lambda Handler With Module-Scope Reuse",
        language: "typescript",
        label: "handler.ts",
        code: `import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

// Module scope runs ONCE per cold start, then is reused by every warm invocation.
const region = process.env.AWS_REGION;
let pool: Pool | undefined;

export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  // Lazily initialize the pool; a warm container reuses the same connections
  // instead of paying a TCP and TLS handshake on every single request.
  pool ??= await createPool({ region });

  const orderId = event.pathParameters?.orderId;
  if (!orderId) {
    return { statusCode: 400, body: JSON.stringify({ error: "missing orderId" }) };
  }

  const order = await pool.query("select * from orders where id = $1", [orderId]);
  return { statusCode: 200, body: JSON.stringify(order.rows[0] ?? null) };
};`,
      },
      {
        type: "text",
        heading: "The Concurrency and Scaling Model",
        content:
          "The default serverless model is **one invocation per environment instance**, and the platform scales by starting more instances in parallel — often to hundreds or thousands within seconds. Each environment handles one request at a time, so a function that blocks for two seconds caps each instance at half a request per second, and scale means more instances, not more threads.\n\nThis has sharp consequences for downstream systems. A burst of traffic that spawns two thousand function instances opens two thousand database connections at once, which can topple a database sized for a few hundred. Use connection **pooling at a proxy layer** (RDS Proxy, PgBouncer) rather than per-instance pools, and add backpressure. Some platforms also offer **provisioned concurrency** to keep a floor of warm environments, at extra cost.",
      },
      {
        type: "comparison",
        heading: "Serverless Functions vs Containers",
        headers: ["Serverless (FaaS)", "Containers (K8s / ECS)"],
        rows: [
          {
            aspect: "Cost model",
            "Serverless (FaaS)":
              "Per invocation and per millisecond of execution",
            "Containers (K8s / ECS)":
              "Per running instance, billed whether busy or idle",
          },
          {
            aspect: "Scale to zero",
            "Serverless (FaaS)": "Native; you pay nothing when idle",
            "Containers (K8s / ECS)":
              "Requires extra work; usually a floor of replicas",
          },
          {
            aspect: "Startup latency",
            "Serverless (FaaS)": "Cold starts of tens of ms to several seconds",
            "Containers (K8s / ECS)": "Warm and predictable once running",
          },
          {
            aspect: "Execution limit",
            "Serverless (FaaS)": "Hard cap, for example 15 minutes",
            "Containers (K8s / ECS)": "Runs as long as you want",
          },
          {
            aspect: "Runtime control",
            "Serverless (FaaS)": "Managed runtime and OS",
            "Containers (K8s / ECS)": "Full control of image and environment",
          },
          {
            aspect: "Sweet spot",
            "Serverless (FaaS)": "Spiky, short, stateless event processing",
            "Containers (K8s / ECS)":
              "Steady high load, long-lived connections, custom runtimes",
          },
        ],
      },
      {
        type: "text",
        heading: "Event Sources: More Than HTTP",
        content:
          "Serverless is at its best when the platform triggers your function from an event, so you write no polling loop and no scaling logic. Common sources include HTTP via an API gateway, a **queue** (SQS) where each message becomes an invocation with automatic retries and a dead-letter queue, a **stream** (Kinesis or Kafka) where invocations process batches in shard order, object storage events on upload, scheduled cron triggers, and database or log change streams.\n\nChoosing the source decides your delivery semantics. Queue-based invocations are **at-least-once**, so your handler must be idempotent. Stream sources preserve order per shard but reprocess a batch on failure unless you isolate the poison record. Always configure a dead-letter queue and a retry cap, or a single malformed message will retry forever and, on stream sources, block the shard behind it.",
      },
      {
        type: "text",
        heading: "Limits You Must Design Around",
        content:
          "Every platform imposes limits, and design that ignores them fails in production. Expect a maximum execution time (commonly **15 minutes** for Lambda), a memory cap that also scales CPU (more memory buys more vCPU), a bounded deployment package and image size, a limited number of concurrent executions per account, and a short-lived request/response payload size.\n\nThese shape architecture. Long-running work belongs on a queue plus a worker, not in the HTTP path. Large payloads go to object storage with the function passing only a reference. CPU-hungry work needs more memory because CPU scales with it. And account-level concurrency limits are shared, so one runaway function can throttle every other function in the account — reserve concurrency for critical paths and cap the rest.",
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Warm Environments Keep Your State Alive",
        content:
          "Because a warm environment is reused, anything you store in module scope persists across invocations of different users. Caching immutable config is right; caching request-scoped data such as 'the current user' is a data-leak bug that only manifests when the environment happens to stay warm. Treat every module-level mutable variable as shared global state and default to stateless handlers. The same reuse is why a stale connection can linger: recycle pools and handle reconnects, or a warm container will keep failing against a database it was severed from.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Serverless removes server management, not servers; you trade control for elasticity",
          "Cold starts add latency; trim dependencies and keep a warm pool where latency matters",
          "The default model is one invocation per instance, scaled by adding instances",
          "Shared downstream connections must be pooled at a proxy, not per instance",
          "Event sources decide delivery semantics — assume at-least-once and make handlers idempotent",
          "Design within hard limits: execution time, memory, package size, and account concurrency",
        ],
      },
    ],
    quiz: [
      {
        question: "What is a cold start?",
        options: [
          "A request served by an already-warm environment",
          "The latency of provisioning a fresh environment and running initialization before the handler",
          "A function that has been scaled to zero permanently",
          "The first frame of a video stream",
        ],
        correctIndex: 1,
        explanation:
          "A cold start is the extra latency paid when the platform must create a new execution environment: scheduling capacity, booting the runtime, and running initialization code. Warm invocations reuse an existing environment and skip that cost.",
      },
      {
        question:
          "By default, how does a serverless platform scale to handle more concurrent requests?",
        options: [
          "By adding more threads inside one instance",
          "By running more instances in parallel, one invocation each",
          "By upgrading the CPU of a single instance",
          "By queueing requests until the single instance is free",
        ],
        correctIndex: 1,
        explanation:
          "The default model is one invocation per instance. Concurrency scales by starting more instances, not by adding threads to one. This is why a burst can open a flood of downstream connections and why you proxy-pool to the database.",
      },
      {
        question:
          "Why must a function triggered from an SQS queue be idempotent?",
        options: [
          "The queue delivers messages at-least-once, so duplicates and retries can occur",
          "Functions cannot read from the queue more than once",
          "The queue delivers messages in strict global order",
          "Idempotency is required by the runtime to compile the function",
        ],
        correctIndex: 0,
        explanation:
          "Queue-based invocations are at-least-once: a message may be delivered or processed more than once on retries. Handlers must therefore be safe to run repeatedly, for example by keying on a message id or making writes upserts.",
      },
      {
        question:
          "A team caches the current request's user id in a module-scope variable. What is the risk?",
        options: [
          "The function will not deploy",
          "A warm environment is reused, so one user's data can leak into another's invocation",
          "The cold start will increase",
          "The runtime will reject requests without an Authorization header",
        ],
        correctIndex: 1,
        explanation:
          "Module scope persists across warm invocations. Storing per-request state there means a later invocation from a different user can observe the previous user's value — a data-leak bug that only appears when the environment stays warm.",
      },
    ],
  },

  // ─── PROFILING ───────────────────────────────────────────────────────────

  profiling: {
    slug: "profiling",
    title: "Performance Profiling",
    tagline: "Flame graphs, hot paths, and benchmarks that tell the truth",
    sections: [
      {
        type: "text",
        heading: "Measure Before You Optimize",
        content:
          "The first rule of performance work is that your intuition about the bottleneck is usually wrong. Engineers reliably optimise the code they enjoy reading, only to discover afterwards that the time was in a serialization library or a database call. Profiling replaces guessing with evidence.\n\nA profiler answers three questions: **where** is the time going (CPU), **where** is the memory going (heap), and **what changed** between two builds. The output usually follows a power law — a small number of functions own most of the time. The job is to find that small number and leave the rest alone, because optimisation reduces readability and invites bugs.",
      },
      {
        type: "analogy",
        heading: "A Doctor With an X-Ray, Not a Guess",
        content:
          "A clinician who treats pain by guessing at the cause will prescribe the wrong medicine more often than not. A profiler is the X-ray: it shows exactly where the pressure is instead of leaving you to speculate about which organ is failing.\n\nJust as an X-ray of a moving patient is blurrier than one of a still patient, a profile taken under unrealistic load misleads. You want the patient doing the activity that hurts — a representative workload, real data sizes, production-like latency — because a profile of an idle system is a portrait of nothing.",
      },
      {
        type: "text",
        heading: "CPU Profiling: Find the Hot Path",
        content:
          "CPU profilers come in two families. **Sampling** profilers periodically capture the call stack (say, 100 times per second) and build a statistical picture of where time is spent; they have low overhead and are safe in production. **Instrumentation** profilers record every function entry and exit; they are precise but slower, and distort the very timing they measure.\n\nThe output you want is the **hot path**: the chain of calls that, in aggregate, is burning the most CPU. Attach the profiler under a representative workload, look for functions that are unexpectedly prominent (a naive JSON library, a regex compiled in a loop, an N+1 helper), and confirm the suspicion with a microbenchmark before changing code. A profiler that changes what it measures is telling you about its own instrumentation, not your program.",
      },
      {
        type: "code",
        heading: "Capturing Profiles Across Runtimes",
        language: "bash",
        label: "profile.sh",
        code: `# Go: capture a 30-second CPU profile over HTTP, then inspect it
go tool pprof -seconds 30 http://localhost:6060/debug/pprof/profile
#   (pprof) top20         -> the twenty hottest functions
#   (pprof) list handleOrder  -> annotated source lines
#   (pprof) web           -> flame graph in the browser

# Python: py-spy samples a running process with zero code changes
py-spy record -o profile.svg --pid 12345 --duration 30

# Node.js: write a V8 CPU profile that Chrome DevTools can open
node --cpu-prof --cpu-prof-dir=./profiles server.js

# Linux perf: system-wide sampling, folded into a flame graph
perf record -F 99 -g -- ./myservice
perf script | stackcollapse-perf.pl | flamegraph.pl > flame.svg`,
      },
      {
        type: "text",
        heading: "Heap and Allocation Profiling",
        content:
          "High CPU is not the only symptom; runaway memory or constant garbage collection is just as common. A **heap profile** shows what is allocated and, more importantly, what is still **retained** — the objects alive because something still references them. Retention is where leaks live.\n\nTwo questions matter. **Allocation rate**: who allocates the most bytes, which drives GC pressure even if nothing leaks. **Retention**: which call path holds a growing set of objects, the classic unbounded cache, a listener never removed, or a closure capturing request data. Go's pprof, the JVM's heap dumps with tools like Eclipse MAT, and Node's --heapsnapshot all answer these. Compare two snapshots taken minutes apart; whatever grew and never shrank is your leak.",
      },
      {
        type: "text",
        heading: "Reading a Flame Graph",
        content:
          "A **flame graph** stacks call stacks: each bar is a function, the y-axis is stack depth, and the **width is the proportion of samples** — time, allocations, or whatever the profiler measured. Reading it is simple once you know the rules. Wide bars are where the resource goes; you are looking for the widest bar you can act on.\n\nThe **x-axis order is not time**; it is alphabetical or otherwise sorted, so you must not read the graph left-to-right as a timeline. A tall stack that narrows quickly is normal; a wide plateau means many samples share that path. The most actionable targets are wide bars low in the graph (leaf work you can optimise directly) and any surprising wide bar — a function you did not expect to see at all, which is exactly where intuition failed.",
      },
      {
        type: "text",
        heading: "Benchmarking Without Lying to Yourself",
        content:
          "A benchmark is an experiment, and it is easy to run one that proves nothing. Warm up before measuring so the JIT and caches settle. Use realistic inputs — a 100-element array tells you nothing about a 100,000-element one. Isolate the code under test from I/O and network noise, and repeat enough iterations for a stable median, not a single lucky run.\n\nLanguage tooling helps: Go's testing.B and -benchmem report allocations, and the JVM has JMH to defeat dead-code elimination and JIT reordering. Track the metric you actually care about — throughput at a target latency percentile, not raw mean. And always keep the previous profile or benchmark result so you can prove a change helped; an optimisation that 'feels faster' but moves the p99 the wrong way is a regression.",
      },
      {
        type: "comparison",
        heading: "Sampling vs Instrumentation Profilers",
        headers: ["Sampling", "Instrumentation"],
        rows: [
          {
            aspect: "How it works",
            Sampling: "Interrupts periodically and records the current stack",
            Instrumentation: "Records entry and exit of every function call",
          },
          {
            aspect: "Overhead",
            Sampling: "Low; safe for production",
            Instrumentation: "High; distorts the timing it measures",
          },
          {
            aspect: "Accuracy",
            Sampling: "Statistical; short-lived calls may be missed",
            Instrumentation: "Exact call counts and timings",
          },
          {
            aspect: "Run length",
            Sampling: "Run long enough to collect useful samples",
            Instrumentation: "Best on short, targeted runs",
          },
          {
            aspect: "Typical tools",
            Sampling: "perf, Go pprof, py-spy",
            Instrumentation: "Tracing profilers, manual timers",
          },
          {
            aspect: "Best for",
            Sampling: "Understanding a live system's hot path",
            Instrumentation: "Precise counts in a controlled benchmark",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Profiling the Wrong Workload Leads Nowhere",
        content:
          "A profile is only as representative as the load under which it was taken. A microbenchmark with a two-element input, or a soak test against an empty database, will point you confidently at code that is irrelevant in production. Before trusting a profile, confirm the workload matches production on data size, request mix, concurrency, and cache hit rate. When in doubt, profile a canary or a shadow copy of real traffic — an X-ray of a healthy patient cannot find the disease.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Profile before optimising; the bottleneck is rarely where intuition points",
          "Sampling profilers are cheap enough for production; instrumentation distorts timing",
          "Heap profiles reveal both allocation rate and the retained objects behind leaks",
          "In a flame graph, width is cost and the x-axis is not a timeline",
          "Benchmark with warmup, realistic inputs, and enough iterations for a stable median",
          "Track percentiles at a target load and keep prior results to prove a change helped",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why is a sampling profiler often preferred for profiling a production service?",
        options: [
          "It records every function call exactly",
          "It has low overhead and captures a statistical picture of hot paths",
          "It requires no representative workload",
          "It replaces the need for benchmarks",
        ],
        correctIndex: 1,
        explanation:
          "A sampling profiler interrupts periodically and records the current stack, so overhead is low enough to run against live traffic and still reveal where time concentrates. Instrumentation profilers are exact but slow and distort the timings they measure.",
      },
      {
        question: "In a flame graph, what does the width of a bar represent?",
        options: [
          "The wall-clock order in which the function ran",
          "The proportion of samples attributed to that function",
          "The number of lines of code in the function",
          "The memory the function allocates",
        ],
        correctIndex: 1,
        explanation:
          "Bar width is the fraction of samples (time or allocations, depending on the profile) attributed to that stack frame. The x-axis is not a timeline — ordering is arbitrary — so you read width, not left-to-right position.",
      },
      {
        question:
          "When hunting a memory leak with heap profiles, what should you focus on?",
        options: [
          "The functions that allocate the most bytes in total",
          "The objects retained across two snapshots taken minutes apart",
          "The oldest object in the program",
          "The number of garbage collections per second",
        ],
        correctIndex: 1,
        explanation:
          "Allocation rate indicates GC pressure, but a leak is about retention: objects still alive because something holds them. Comparing two heap snapshots and finding the set that only grows pinpoints the leak.",
      },
      {
        question: "Which practice most improves the honesty of a benchmark?",
        options: [
          "Running a single iteration for speed",
          "Warming up the runtime and using production-like input sizes",
          "Measuring only the mean and ignoring percentiles",
          "Testing with a two-element input for clarity",
        ],
        correctIndex: 1,
        explanation:
          "Warmup lets JIT and caches settle, and realistic input sizes expose the behaviour that matters. Single runs, toy inputs, and mean-only reporting all produce numbers that mislead and hide regressions in the tail.",
      },
    ],
  },

  // ─── MONOREPO & PACKAGE MANAGEMENT ───────────────────────────────────────

  "monorepo-package-management": {
    slug: "monorepo-package-management",
    title: "Monorepos & Package Management",
    tagline: "Workspaces, task graphs, and dependency hell kept at bay",
    sections: [
      {
        type: "text",
        heading: "Monorepo vs Polyrepo",
        content:
          "A **monorepo** keeps many packages and applications in one repository, so a change that spans an API and its consumers lands in a single atomic commit. A **polyrepo** gives each package its own repository, so ownership and release cadence stay isolated but cross-cutting changes require coordinated version bumps and pull requests.\n\nThe monorepo wins when packages share a lot of code and change together, because refactors, dependency upgrades, and type checks run across the whole graph at once. It taxes you in tooling: without workspaces, a task graph, and cache, a monorepo becomes a slow, entangled repository. Polyrepos invert the trade — clean boundaries, painful cross-repo coordination. Many organisations use a middle path: a monorepo per domain, polyrepo between domains.",
      },
      {
        type: "analogy",
        heading: "One Shared Kitchen, Many Stations",
        content:
          "A monorepo is a single large kitchen with many stations — one for appetisers, one for mains. Ingredients are shared on open shelves, and a chef can grab a sauce another station just improved without any delivery delay. The upside is coordination made trivial; the downside is that a spill at one station can block the aisle for everyone.\n\nWorkspaces are the labeled shelves that keep each station's ingredients organised. The task runner is the head chef's call sheet, deciding which stations cook first and which can run in parallel — and remembering what has already been cooked so nobody re-prepares a dish that has not changed. Get those two right and the shared kitchen outpaces a street of separate restaurants; get them wrong and everybody trips over each other.",
      },
      {
        type: "text",
        heading: "Workspaces: One Lockfile, Many Packages",
        content:
          "A **workspace** tells the package manager that a set of directories are local packages that may depend on each other. Instead of publishing and reinstalling a local package, the manager **symlinks** it into node_modules, so edits are picked up immediately. Crucially, all packages share a **single root lockfile**, so the whole repository resolves to one consistent dependency tree.\n\nnpm, Yarn, and pnpm all support workspaces, but their strategies differ. **npm** and **Yarn** hoist dependencies up to the root node_modules, which is fast to install but permits a package to import something it never declared — an undeclared dependency that breaks the day it is published. **pnpm** uses a content-addressable store and symlinks each package's exact declared dependencies, so node_modules is strict: importing an undeclared package fails loudly. That strictness is pnpm's headline feature.",
      },
      {
        type: "code",
        heading: "Declaring a pnpm Workspace",
        language: "yaml",
        label: "pnpm-workspace.yaml",
        code: `# Every workspace package, evaluated from the repository root.
packages:
  - "apps/*"          # deployable applications (web, admin, api)
  - "packages/*"      # shared libraries, imported by apps and each other
  - "!**/test-fixtures/**"   # never treat fixtures as a package

# Typical commands:
#   pnpm install -w                          install for the whole workspace
#   pnpm --filter api... build               build api and everything it depends on
#   pnpm --filter "./packages/*" test        run tests only in packages/*
#   pnpm add -w -D typescript                add a root dev dependency`,
      },
      {
        type: "text",
        heading: "Task Orchestration: Turborepo and Nx",
        content:
          "A workspace installs and links packages; a **task runner** decides how to build, test, and lint them efficiently. Both Turborepo and Nx model the repository as a graph: each task has inputs (source files, config, environment) and outputs (build artifacts), and the runner schedules tasks in dependency order while parallelising independent ones.\n\nThe killer feature is **caching**. If a task's inputs have not changed, the runner restores the previous outputs instead of recomputing them — locally, and in CI via a remote cache shared across machines. Turborepo is deliberately lightweight, configured by a turbo.json pipeline. Nx is a fuller platform with plugins, generators, and a rich project graph. Either turns a monorepo from 'CI runs everything on every push' into 'CI runs only what changed'.",
      },
      {
        type: "comparison",
        heading: "pnpm vs npm vs Yarn",
        headers: ["pnpm", "npm", "Yarn"],
        rows: [
          {
            aspect: "node_modules layout",
            pnpm: "Symlinks to a content-addressable store; strict",
            npm: "Flat hoisting to the root",
            Yarn: "Hoisting (Classic) or Plug'n'Play (Berry)",
          },
          {
            aspect: "Undeclared imports",
            pnpm: "Fail, because only declared deps are linked",
            npm: "May succeed by accident via hoisting",
            Yarn: "Classic hoists; Berry forbids by default",
          },
          {
            aspect: "Disk usage",
            pnpm: "Low; one copy per version across projects",
            npm: "Higher; duplicates across projects",
            Yarn: "Classic like npm; Berry has no node_modules",
          },
          {
            aspect: "Install speed",
            pnpm: "Very fast with a warm store",
            npm: "Improved, still slower",
            Yarn: "Fast, especially Berry",
          },
          {
            aspect: "Workspaces",
            pnpm: "First-class and mature",
            npm: "Supported natively",
            Yarn: "First-class, original pioneer",
          },
          {
            aspect: "Main gotcha",
            pnpm: "Strictness surfaces previously hidden bad deps",
            npm: "Phantom dependencies hide until publish",
            Yarn: "Split ecosystem between Classic and Berry",
          },
        ],
      },
      {
        type: "text",
        heading: "The Dependency Graph and Phantom Deps",
        content:
          "Your dependencies list is not the dependency graph; it is the graph's roots. Transitive dependencies can be dozens of layers deep, and a single vulnerable or heavy package deep in the tree affects you whether you named it or not. Understanding the graph is how you audit supply-chain risk and untangle version conflicts.\n\nA **phantom dependency** is a package you use but never declared, made available only because a transitive dependency happened to hoist it to the root. It works locally and breaks the moment that transitive dependency changes or you switch to a strict installer. Keep the tree observable with npm ls, pnpm why <pkg>, and pnpm list --depth Infinity, add a lockfile so the graph is reproducible, and audit regularly with tooling like npm audit or pnpm audit.",
      },
      {
        type: "text",
        heading: "Private Registries and Publishing",
        content:
          "Internal packages live in a **private registry** — GitHub Packages, Verdaccio, Artifactory, or a cloud-native registry — configured per scope so a scoped package such as @acme/orders resolves to your registry while the public packages still resolve to npm. In a monorepo you often avoid publishing altogether: internal packages are consumed by workspace link, and only the packages that genuinely need to ship are versioned and published.\n\nWhen you do publish, treat it as a release, not a git push. Authenticate with a scoped token injected by CI, publish immutable versions, and never overwrite a published version — consumers may already have it cached. Mark internal-only packages private so an accidental publish fails loudly, and consider changesets or a release tool to coordinate version bumps across the graph.",
      },
      {
        type: "text",
        heading: "Semver and Peer Dependencies",
        content:
          "**Semantic versioning** encodes a promise: MAJOR for breaking changes, MINOR for backward-compatible additions, PATCH for fixes. Ranges read from that promise — a caret range such as ^1.4.2 accepts any 1.x.y at or above 1.4.2 but not 2.0.0, while a tilde range such as ~1.4.2 stays within 1.4.x. The promise is only as good as the maintainer's discipline, which is why lockfiles matter more than ranges.\n\n**Peer dependencies** express a different relationship: 'I need the host project to provide this package, and I will not bundle my own copy.' A React component library declares React as a peer so there is exactly one React instance. Getting it wrong is the root of duplicate-instance bugs — two copies of React, two of a DI container, two of a state store — where context and singletons silently stop working. In a monorepo, manage the peer's version once at the root so every consumer agrees.",
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "Cache Everything, Trust Nothing Withdrawn",
        content:
          "Task caching and lockfiles are the two pillars of a healthy monorepo. A lockfile makes installs reproducible, so a build that passed in CI also passes on a colleague's machine. Task caching makes CI fast by skipping work whose inputs are unchanged. But declare cache inputs honestly: if a task reads an environment variable or a file outside its declared inputs and you omit it from the cache key, the cache will serve stale results that pass in CI and fail in production. A cache with wrong inputs is worse than no cache at all.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Monorepos trade tooling complexity for atomic cross-package changes",
          "Workspaces link local packages and share a single root lockfile",
          "pnpm's strict node_modules surfaces phantom dependencies that hoisting hides",
          "Task runners like Turborepo and Nx build a graph and cache unchanged work",
          "Classify every dependency as regular, dev, or peer, and declare all three honestly",
          "Semver promises are only trustworthy when paired with a committed lockfile",
        ],
      },
    ],
    quiz: [
      {
        question: "What does a workspace give you in a monorepo?",
        options: [
          "A separate lockfile for every package",
          "Local packages linked together and resolved under one root lockfile",
          "Automatic publishing of every package on every commit",
          "A runtime that executes packages in parallel",
        ],
        correctIndex: 1,
        explanation:
          "A workspace marks directories as local packages that link to each other without publishing, and the whole repository resolves to a single root lockfile for a consistent dependency tree.",
      },
      {
        question: "Why does pnpm's strict node_modules layout help catch bugs?",
        options: [
          "It compiles TypeScript at install time",
          "It only links a package's declared dependencies, so importing an undeclared package fails",
          "It disables peer dependencies",
          "It makes installs slower but more thorough",
        ],
        correctIndex: 1,
        explanation:
          "pnpm symlinks exactly the declared dependencies, so a package cannot accidentally import something it never listed. npm and Yarn hoisting can make phantom dependencies appear to work until they break in production.",
      },
      {
        question:
          "A React component library declares react as a peer dependency rather than a regular one. Why?",
        options: [
          "Peer dependencies install faster",
          "It ensures the host app provides exactly one React instance, avoiding duplicate-instance bugs",
          "Peer dependencies are required for TypeScript",
          "It makes React optional at runtime",
        ],
        correctIndex: 1,
        explanation:
          "A peer dependency means the consuming project supplies it. For libraries that rely on singletons or context — React, state stores, DI containers — this guarantees a single shared instance instead of two copies that silently stop cooperating.",
      },
      {
        question: "In the caret range ^1.4.2, which versions are accepted?",
        options: [
          "Only exactly 1.4.2",
          "Any 1.4.x at or above 1.4.2",
          "Any 1.x.y at or above 1.4.2, but not 2.0.0",
          "Any version at or above 1.4.2, including 2.0.0",
        ],
        correctIndex: 2,
        explanation:
          "The caret allows backward-compatible updates within the same major version: any 1.x.y at or above the specified version, excluding 2.0.0. The tilde range such as ~1.4.2 is narrower, allowing only 1.4.x.",
      },
    ],
  },
};

