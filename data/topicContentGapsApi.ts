// Gap content: Advanced API Patterns
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_GAPS_API: Record<string, TopicContent> = {
  // ─── GRAPHQL ADVANCED ───────────────────────────────────────────────────

  "graphql-advanced": {
    slug: "graphql-advanced",
    title: "GraphQL Advanced",
    tagline: "Batching, federation, persisted queries, and defending the graph",
    sections: [
      {
        type: "text",
        heading: "Why Basic GraphQL Skills Are Not Enough",
        content:
          "Writing a schema and a few resolvers is the easy part. The hard part starts the first time a single query fans out into thousands of database calls, or an unauthenticated client sends a query nested forty levels deep and takes down your API. GraphQL gives clients enormous power — the power to compose, to traverse, and to decide the shape and size of the response. That power must be bounded.\n\nThis lesson covers the problems that only appear at scale: the N+1 query explosion and how DataLoader solves it, persisted queries for security and bandwidth, schema federation across teams, and the depth and complexity limits that keep the graph from being weaponised against you.",
      },
      {
        type: "analogy",
        heading: "The Kitchen With a Thousand Waiters",
        content:
          "Ordering from a normal REST endpoint is like a fixed menu: ask for the chicken dish and the kitchen already knows how to serve it as one plate. There is no room to improvise.\n\nGraphQL is a kitchen where the customer writes the recipe. Order a user profile plus their last twenty orders plus each order's line items plus each item's product, and a naive kitchen sends a separate waiter to the pantry for every single ingredient — one trip per database row. The meal takes an hour. DataLoader is the maître d' who collects every waiter's requests onto one tray and makes a single trip, then hands each waiter the piece they asked for.",
      },
      {
        type: "text",
        heading: "The N+1 Query Problem",
        content:
          "The N+1 bug appears whenever a field resolver runs once per parent object and each invocation hits the database. A query for 100 posts, each with an author, executes 1 query for the posts plus 100 queries — one per post — to load each author. Hence N+1.\n\nThe damage scales with the response, not the request. Fetch 500 posts and you fire 501 queries. Add a nested comments field and each post fires another query for its comments. Databases handle a handful of round trips well and thousands terribly: connection pools saturate, p99 latency explodes, and a single slow client can exhaust the pool for everyone. The fix is not to ban nesting — it is to batch.",
      },
      {
        type: "code",
        heading: "N+1 in the Naive Resolver",
        language: "typescript",
        label: "n-plus-one.ts",
        code: `// Schema: type Post { id, title, author: User }
// The Post.author resolver runs ONCE PER POST in the result set.

const resolvers = {
  Post: {
    author: async (post: Post, _args: unknown, ctx: Context) => {
      // Fires once per post. A query for 500 posts => 501 round trips.
      return ctx.db.user.findById(post.authorId);
    },
  },
};

// query { posts { id title author { name } } }
// => SELECT * FROM posts;                  (1 query)
// => SELECT * FROM users WHERE id = $1;    x500   (N queries)`,
      },
      {
        type: "code",
        heading: "Batching with DataLoader",
        language: "typescript",
        label: "dataloader.ts",
        code: `import DataLoader from 'dataloader';

// batchFn receives ALL keys requested during one tick and MUST return an
// array of the SAME LENGTH in the SAME ORDER as the input keys.
function createUserLoader(db: Db) {
  return new DataLoader<string, User>(async (ids) => {
    // One query for the entire batch, regardless of how many ids arrive.
    const rows = await db.user.findByIds([...ids]);
    const byId = new Map(rows.map((u) => [u.id, u]));
    // Preserve order; return an Error for any missing key.
    return ids.map((id) => byId.get(id) ?? new Error('User ' + id + ' not found'));
  });
}

const ctx: Context = { userLoader: createUserLoader(db) };

const resolvers = {
  Post: {
    author: (post, _args, ctx) => ctx.userLoader.load(post.authorId),
  },
};
// 500 posts now produce 2 queries total: the posts, plus one batched user query.`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "DataLoader Is Per-Request",
        content:
          "The single biggest DataLoader mistake is creating loaders once at startup and reusing them across requests. The cache inside a loader is keyed only by the id, so a shared loader leaks User A's data into User B's request and serves stale rows forever.\n\nCreate a fresh DataLoader for every request, store it on the GraphQL context, and let it be garbage-collected when the request ends. The cache is a request-scoped optimisation, never a persistent store.",
      },
      {
        type: "comparison",
        heading: "Schema Stitching vs Apollo Federation",
        headers: ["Schema Stitching", "Apollo Federation"],
        rows: [
          {
            aspect: "Core idea",
            "Schema Stitching": "A gateway merges remote schemas into one",
            "Apollo Federation": "Subgraphs declare types; the gateway composes a supergraph",
          },
          {
            aspect: "Ownership",
            "Schema Stitching": "Gateway owns all the merge logic",
            "Apollo Federation": "Each team owns its subgraph independently",
          },
          {
            aspect: "Type extension",
            "Schema Stitching": "Gateway remaps and re-resolves fields",
            "Apollo Federation": "Entities keyed by @key, fields resolved across subgraphs",
          },
          {
            aspect: "Coupling",
            "Schema Stitching": "High — the gateway must know every schema in detail",
            "Apollo Federation": "Low — subgraphs evolve independently",
          },
          {
            aspect: "Tooling",
            "Schema Stitching": "Hand-written transforms",
            "Apollo Federation": "Federation composition, Rover CLI, managed supergraph",
          },
          {
            aspect: "Best for",
            "Schema Stitching": "Merging a few independent APIs",
            "Apollo Federation": "Many teams owning one unified graph",
          },
        ],
      },
      {
        type: "code",
        heading: "Persisted Queries",
        language: "typescript",
        label: "persisted-queries.ts",
        code: `// Clients send a short hash instead of the full query text.
// GET /graphql?extensions={"persistedQuery":{"sha256Hash":"abc123..."}}

// APQ (Automatic Persisted Queries): the first request carries the query and
// the server caches hash -> document; later requests send only the hash.

// Allow-listing is APQ done properly: only pre-registered hashes are accepted,
// generated from the client build. Nothing else can execute in production.
const allowed = new Set<string>(loadQueryManifest());

function validate(req: Request): void {
  const hash = req.body?.extensions?.persistedQuery?.sha256Hash;
  if (!hash || !allowed.has(hash)) {
    throw new Error('PERSISTED_QUERY_NOT_ALLOWED'); // reject arbitrary documents
  }
}
// Payoff: smaller payloads, a hardened attack surface, and free GET caching.`,
      },
      {
        type: "steps",
        heading: "Defending the Graph",
        steps: [
          {
            title: "Cap query depth",
            detail:
              "Reject documents nested beyond a fixed limit (commonly 7-15 levels). Depth is cheap to compute and stops the most obvious abuse, but nested lists hide the real cost.",
          },
          {
            title: "Score query complexity",
            detail:
              "Assign each field a cost and multiply by list size. Reject anything above the budget before execution — a field declared to return a large list should cost accordingly.",
          },
          {
            title: "Disable introspection in production",
            detail:
              "Turning off __schema prevents attackers from discovering types to abuse. Shipping persisted queries means clients never need to introspect at runtime anyway.",
          },
          {
            title: "Rate limit by cost, not requests",
            detail:
              "Charge each query's computed cost against a budget that refills over time. This treats one expensive query as many cheap ones, which request-count limits cannot do.",
          },
          {
            title: "Add timeouts and bounded pagination",
            detail:
              "Require first or last on list fields with a sane default size, and set an execution timeout so one runaway resolver cannot hold a worker forever.",
          },
        ],
      },
      {
        type: "text",
        heading: "Subscriptions at Scale",
        content:
          "Subscriptions keep a long-lived connection open and push events as they occur. On a single server, in-memory PubSub works fine. In a multi-instance deployment it breaks immediately: the client that subscribed may be on instance A while the event is published on instance B, so the message is never delivered.\n\nProduction subscriptions use a distributed broker as the pub/sub layer — Redis Pub/Sub or NATS for low latency, Kafka for durable, replayable streams — and every GraphQL instance subscribes to the broker and fans events out to its own connected clients. Treat subscriptions as event delivery, not an afterthought: authenticate the connection once at handshake, authorise every event, and bound concurrency so a surge of events cannot overwhelm one customer.",
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "How Big Companies Run GraphQL",
        content:
          "GitHub runs a single public GraphQL schema fronting hundreds of services and enforces strict rate limiting by query cost, returning a cost value and an x-ratelimit-reset based on points. Netflix and Apollo federate many subgraphs into one supergraph. Facebook, where GraphQL originated, gates every query through a persisted-query allow-list and per-field complexity budgets. Shopify requires persisted queries plus depth and complexity limits on its Storefront API. The pattern is consistent: bound the graph, batch the access, and make the contract explicit.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Resolvers that fire per parent cause the N+1 problem — 500 posts can mean 501 queries",
          "Batch and cache reads per request with DataLoader; create a fresh loader per request",
          "A DataLoader batch function must return results in the exact order of the input keys",
          "Cap depth and score complexity, and reject over-budget queries before execution",
          "Persisted queries shrink payloads, harden the surface, and enable GET caching",
          "Federate a large graph into independently owned subgraphs joined by a gateway",
          "Back subscriptions with a distributed broker; in-memory PubSub only works on one instance",
        ],
      },
    ],
    quiz: [
      {
        question: "What exactly causes the N+1 query problem in a GraphQL server?",
        options: [
          "The schema declares too many types",
          "A resolver runs once per parent object and each run issues its own database query",
          "Clients send queries that are too large",
          "GraphQL always executes one query per field",
        ],
        correctIndex: 1,
        explanation:
          "N+1 appears when a field resolver executes per parent object. Fetching 500 posts and resolving each post's author naively issues 1 query for the posts plus 500 separate queries for the authors. Batching those lookups with DataLoader collapses them into a single query.",
      },
      {
        question:
          "A DataLoader batch function is given the keys ['a','b','c'] but returns results ordered ['c','a','b']. What happens?",
        options: [
          "DataLoader sorts them automatically",
          "Each key receives the wrong value because DataLoader matches results to keys by array position",
          "DataLoader throws and retries the batch",
          "Nothing — order is irrelevant to DataLoader",
        ],
        correctIndex: 1,
        explanation:
          "DataLoader assigns results to keys positionally; it does not look at ids inside the returned objects. If the array is out of order every caller gets the wrong record. The batch function must map over the input keys and return a value (or an Error) for each one in the same order.",
      },
      {
        question:
          "Why must a DataLoader instance be created per request rather than once at startup?",
        options: [
          "Because loaders cannot be reused after a query completes",
          "Its internal cache is keyed only by id, so a shared loader would leak data between users and cache stale rows",
          "Creating a loader is expensive and must be amortised",
          "Startup loaders are not supported by DataLoader",
        ],
        correctIndex: 1,
        explanation:
          "A loader caches every key it resolves for as long as it lives. A process-wide loader would return one user's data inside another user's request and never see updated rows. Per-request loaders on the GraphQL context give request-scoped batching and a request-scoped cache that is discarded when the request ends.",
      },
      {
        question:
          "You run subscriptions on four GraphQL instances behind a load balancer. Events published on instance A never reach a subscriber connected to instance C. Why?",
        options: [
          "WebSockets cannot cross a load balancer",
          "In-memory PubSub is per-process; you need a shared broker such as Redis Pub/Sub or NATS so all instances receive and fan out events",
          "GraphQL subscriptions do not support horizontal scaling at all",
          "The schema is missing a Subscription type",
        ],
        correctIndex: 1,
        explanation:
          "An in-memory pub/sub layer only reaches clients connected to the same process. With several instances the subscriber and publisher often land on different processes. Publishing through a shared broker (Redis Pub/Sub, NATS, or Kafka) means every instance receives each event and forwards it to its own connected clients.",
      },
    ],
  },

  // ─── ASYNCAPI ───────────────────────────────────────────────────────────

  asyncapi: {
    slug: "asyncapi",
    title: "AsyncAPI & Event Contracts",
    tagline: "Describing event-driven APIs as governed, machine-readable contracts",
    sections: [
      {
        type: "text",
        heading: "Why Events Need a Contract",
        content:
          "A REST endpoint has an obvious contract: a URL, a method, a request shape, a response shape. An event has none of that. A producer publishes a message to a topic; consumers subscribe and parse it — and nothing in the topic name says what the payload contains, which fields are required, or who owns it.\n\nAsyncAPI is the OpenAPI of the asynchronous world. It is a machine-readable specification describing channels (topics or queues), the messages that flow across them, their payload schemas, and the operations a service performs. Once that contract exists you get schemas you can validate, code you can generate, docs consumers can read, and a governance point where breaking changes are caught before they reach production.",
      },
      {
        type: "analogy",
        heading: "The Shipping Manifest",
        content:
          "Imagine a port where containers arrive with no paperwork. A crane operator picks one up not knowing whether it holds fragile glass, frozen fish, or hazardous chemicals. Every recipient opens the container to find out, and any mistake is discovered only on arrival.\n\nAn event contract is the manifest taped to every container: what is inside, how it is packed, which fields are mandatory, and who to call if it is malformed. The spec is written before the ship sails, so everyone handling the cargo — producers, broker, consumers, monitoring — works from the same declared truth.",
      },
      {
        type: "text",
        heading: "Anatomy of an AsyncAPI Document",
        content:
          "Modern AsyncAPI (3.0) is organised around a few core concepts. **Channels** are the named destinations — a Kafka topic, a NATS subject, an AMQP queue. **Operations** are the actions a service performs on a channel, either send or receive. **Messages** describe what travels across a channel, with a payload defined as JSON Schema or Avro plus optional headers and correlation IDs.\n\nAdditional sections name the **servers** (broker endpoints and protocols), group reusable message and schema definitions under components, and let you attach security schemes. Crucially, AsyncAPI is protocol-agnostic: the same document can describe a Kafka topic, an MQTT feed, a WebSocket stream, or a RabbitMQ queue.",
      },
      {
        type: "code",
        heading: "An AsyncAPI 3.0 Document",
        language: "yaml",
        label: "asyncapi.yaml",
        code: `asyncapi: 3.0.0
info:
  title: Order Events
  version: 1.0.0
  description: Domain events emitted by the Orders service.
servers:
  production:
    host: kafka.example.com:9092
    protocol: kafka
channels:
  orderCreated:
    address: orders.created.v1
    messages:
      orderCreated:
        $ref: '#/components/messages/OrderCreated'
operations:
  publishOrderCreated:
    action: send
    channel:
      $ref: '#/channels/orderCreated'
components:
  messages:
    OrderCreated:
      name: OrderCreated
      contentType: application/json
      headers:
        type: object
        properties:
          idempotencyKey: { type: string }
      payload:
        $ref: '#/components/schemas/OrderCreatedPayload'
  schemas:
    OrderCreatedPayload:
      type: object
      required: [eventId, orderId, total, occurredAt]
      properties:
        eventId: { type: string, format: uuid }
        orderId: { type: string }
        total: { type: integer, description: Total in cents }
        occurredAt: { type: string, format: date-time }`,
      },
      {
        type: "comparison",
        heading: "OpenAPI vs AsyncAPI",
        headers: ["OpenAPI", "AsyncAPI"],
        rows: [
          {
            aspect: "Describes",
            OpenAPI: "Request/response HTTP APIs",
            AsyncAPI: "Event- and message-driven APIs",
          },
          {
            aspect: "Core unit",
            OpenAPI: "Path plus HTTP method",
            AsyncAPI: "Channel plus operation (send/receive)",
          },
          {
            aspect: "Interaction",
            OpenAPI: "Client pulls a response",
            AsyncAPI: "Producer pushes; consumers subscribe",
          },
          {
            aspect: "Protocols",
            OpenAPI: "HTTP only",
            AsyncAPI: "Kafka, MQTT, AMQP, WebSocket, NATS, and more",
          },
          {
            aspect: "Schema formats",
            OpenAPI: "JSON Schema",
            AsyncAPI: "JSON Schema or Avro",
          },
          {
            aspect: "Best for",
            OpenAPI: "Synchronous endpoints",
            AsyncAPI: "Broker-based messaging and streaming",
          },
        ],
      },
      {
        type: "text",
        heading: "Schemas, Versioning, and Compatibility",
        content:
          "The payload schema is the heart of the contract. In event-driven systems the compatibility rules are stricter than in REST because you cannot redeploy every consumer on demand. Consumers may be owned by other teams, running as durable old builds, or replaying a backlog of days-old messages.\n\nFor topics named with a version suffix such as orders.created.v1, adding an optional field is backward compatible and safe. Removing a field, renaming it, or changing its type is breaking: consumers that read it break silently. The safe discipline is additive change plus an explicit compatibility mode — BACKWARD, FORWARD, or FULL — enforced by the schema registry so a producer cannot publish an incompatible schema at all.",
      },
      {
        type: "steps",
        heading: "Contract Governance Workflow",
        steps: [
          {
            title: "Author the contract",
            detail:
              "Write the AsyncAPI document describing channels, operations, and message schemas. Keep it in the producer's repository as the source of truth and review it in pull requests.",
          },
          {
            title: "Register and validate schemas",
            detail:
              "Push payload schemas to a schema registry (Confluent, Apicurio, AWS Glue) with a compatibility rule. The registry rejects incompatible versions before they are published.",
          },
          {
            title: "Generate producers and consumers",
            detail:
              "Run codegen (asyncapi-generator) to produce typed models, payload validators, and broker client scaffolding so nobody hand-writes a parser that drifts from the schema.",
          },
          {
            title: "Enforce at runtime",
            detail:
              "Validate every produced and consumed message against the schema. Quarantine malformed messages to a dead-letter channel instead of crashing the consumer.",
          },
          {
            title: "Detect breakage in CI",
            detail:
              "Diff the new spec against the last published version and fail the build on a breaking change, exactly as oasdiff does for OpenAPI.",
          },
        ],
      },
      {
        type: "code",
        heading: "Generating Typed Models from the Contract",
        language: "typescript",
        label: "codegen.ts",
        code: `// Generate a typed consumer package straight from the AsyncAPI document.
// npx @asyncapi/cli generate fromTemplate ./asyncapi.yaml \\
//   @asyncapi/nodejs-template --output ./generated

// The generated payload types match the schema exactly.
interface OrderCreatedPayload {
  eventId: string;    // uuid
  orderId: string;
  total: number;      // cents
  occurredAt: string; // ISO date-time
}

// Validate inbound messages against the same schema before handling them.
import { validate } from './generated/validators/OrderCreated';

function onMessage(message: unknown): void {
  if (!validate(message)) {
    deadLetter(message, 'schema-invalid'); // never crash the consumer
    return;
  }
  handleOrderCreated(message as OrderCreatedPayload);
}`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Compatibility Is Not Optional",
        content:
          "A producer team can rename a field and deploy in seconds; the consumers that read that field may not be redeployed for weeks. In event-driven systems the log is the database of record and old messages may be replayed long after the change. This asymmetry is why schema registries exist and why compatibility is enforced at the broker rather than by convention.\n\nPrefer additive evolution: add optional fields, deprecate old ones, and only remove them after a major version bump onto a new channel such as orders.created.v2. Never mutate the meaning of an existing field — consumers you cannot see will interpret it the old way.",
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "How Real Teams Govern Events",
        content:
          "Confluent Schema Registry is the de facto standard for Kafka, enforcing backward, forward, or full compatibility per subject. Apicurio and AWS Glue play the same role elsewhere. Teams at Zalando, Uber, and many banks publish AsyncAPI documents alongside their event catalogs and generate consumers from them. The pattern that holds up: the schema registry gates what can be published, the AsyncAPI document is the human-readable contract, and CI fails any build whose spec breaks compatibility.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Events are not self-describing; AsyncAPI makes the payload, channel, and operations explicit",
          "Channels are topics or queues, operations are send/receive, messages carry schema-defined payloads",
          "AsyncAPI is protocol-agnostic: Kafka, MQTT, AMQP, WebSocket, and NATS all describe the same way",
          "Enforce schema compatibility at a registry so producers cannot publish a breaking change",
          "Generate typed consumers and validators from the spec instead of hand-writing parsers",
          "Evolve additively and version breaking changes onto a new channel; never mutate a field's meaning",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What is the core difference between what OpenAPI and AsyncAPI describe?",
        options: [
          "OpenAPI describes gRPC, AsyncAPI describes HTTP",
          "OpenAPI describes request/response HTTP APIs; AsyncAPI describes event- and message-driven APIs over channels",
          "They describe the same thing with different file extensions",
          "AsyncAPI only covers WebSockets",
        ],
        correctIndex: 1,
        explanation:
          "OpenAPI models pull-based HTTP request/response APIs around paths and methods. AsyncAPI models push-based messaging around channels and send/receive operations, and it is protocol-agnostic across Kafka, MQTT, AMQP, WebSocket, and NATS.",
      },
      {
        question:
          "Why are payload compatibility rules stricter for events than for REST responses?",
        options: [
          "Events are always larger than REST responses",
          "Consumers may be owned by other teams and cannot be redeployed on demand, and old messages can be replayed long after a change",
          "Brokers reject any schema change",
          "Kafka does not support schema evolution",
        ],
        correctIndex: 1,
        explanation:
          "You cannot redeploy every event consumer at will, and the log holds messages that may be replayed long after a change. That means a field rename or type change can break consumers silently and retroactively, so compatibility must be enforced up front.",
      },
      {
        question:
          "What does a schema registry enforce in an event-driven system?",
        options: [
          "Message ordering guarantees",
          "A compatibility mode (backward, forward, or full) so a producer cannot publish a schema version that breaks existing consumers",
          "Exactly-once delivery",
          "Topic partitioning strategy",
        ],
        correctIndex: 1,
        explanation:
          "A schema registry stores every schema version per subject and applies a compatibility rule when a new version is registered. If the new schema would break existing consumers under the chosen mode, registration fails — stopping the breaking change before it reaches the broker.",
      },
      {
        question:
          "You must rename a field in an order event payload. What is the safe approach?",
        options: [
          "Rename it in place — JSON is schemaless anyway",
          "Add the new field as optional data, deprecate the old one, and publish the breaking change on a versioned channel such as orders.created.v2",
          "Delete the old field and expect consumers to adapt",
          "Change the type of the existing field instead",
        ],
        correctIndex: 1,
        explanation:
          "Additive change is backward compatible: consumers keep reading the old field while new ones use the new field. Only once the change is genuinely breaking (the old field is removed) should it move to a versioned channel so old and new consumers can run side by side.",
      },
    ],
  },

  // ─── TRPC ───────────────────────────────────────────────────────────────

  trpc: {
    slug: "trpc",
    title: "tRPC & End-to-End Types",
    tagline: "Type-safe RPC between TS client and server with zero codegen",
    sections: [
      {
        type: "text",
        heading: "What tRPC Is (and Is Not)",
        content:
          "tRPC is a TypeScript library for building end-to-end type-safe APIs without schemas, code generation, or a spec document. You write procedures on the server; the client imports the server's types and calls those procedures with full autocomplete and compile-time checking. Rename a field on the server and the client fails to compile — before anything is deployed.\n\nThe trick is that tRPC never sends types over the wire. It relies on TypeScript's structural type inference: the client type is derived directly from the router type through a generic parameter. That is also its main limitation — it only works when both sides share the same TypeScript code or a published type package.",
      },
      {
        type: "analogy",
        heading: "The Shared Playbook",
        content:
          "With REST, the frontend and backend agree on a playbook (the OpenAPI spec) and each keeps a copy. If the backend changes a play and forgets to update the playbook, the frontend calls the old route and breaks at runtime.\n\ntRPC is a single shared playbook kept on one desk that both teams read from. There is no copy that can fall out of date. Change a play and everyone standing at the desk sees it immediately — the compiler flags anyone still calling the old one.",
      },
      {
        type: "text",
        heading: "Type Inference, Not Codegen",
        content:
          "The usual alternative to runtime safety is generating types: an OpenAPI document produces a typed client, a protobuf file produces stubs. That is a build step you must run and keep in sync with reality.\n\ntRPC has no generated artifact. The server exports an AppRouter type, the client is created with createTRPCProxyClient<AppRouter>(), and TypeScript infers every procedure's input and output straight from the router definition. Because the wire format is ordinary JSON over HTTP, the client can live in the same repo, a monorepo package, or a shared types build — anywhere the type can be imported.",
      },
      {
        type: "code",
        heading: "Defining a Router and Procedures",
        language: "typescript",
        label: "server/router.ts",
        code: `import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return next({ ctx: { user: ctx.user } }); // narrows ctx.user to non-null
});

const protectedProcedure = t.procedure.use(isAuthed);

export const appRouter = t.router({
  user: t.router({
    // Input is validated with Zod; the output type flows to the client.
    getById: t.procedure
      .input(z.object({ id: z.string() }))
      .query(({ input, ctx }) => ctx.db.user.findById(input.id)),

    updateName: protectedProcedure
      .input(z.object({ name: z.string().min(1) }))
      .mutation(({ input, ctx }) =>
        ctx.db.user.update(ctx.user.id, { name: input.name })
      ),
  }),
});

// The entire public API surface, captured as one type.
export type AppRouter = typeof appRouter;`,
      },
      {
        type: "code",
        heading: "Calling from the Client",
        language: "typescript",
        label: "client.ts",
        code: `import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../server/router';

const client = createTRPCProxyClient<AppRouter>({
  // The batch link coalesces many calls from one render into a single request.
  links: [httpBatchLink({ url: 'http://localhost:3000/trpc' })],
});

// Fully typed: the input is required and checked, and the result is inferred.
const user = await client.user.getById.query({ id: 'usr_123' });
const renamed = await client.user.updateName.mutate({ name: 'Ada' });

// client.user.getById.query({ userId: 'x' }); // compile error: wrong key
// client.user.getById.query({ id: 123 });      // compile error: wrong type`,
      },
      {
        type: "comparison",
        heading: "tRPC vs REST vs GraphQL",
        headers: ["tRPC", "REST", "GraphQL"],
        rows: [
          {
            aspect: "Type safety",
            tRPC: "End-to-end, inferred from server code",
            REST: "Manual or generated from a spec",
            GraphQL: "Generated from schema or codegen",
          },
          {
            aspect: "Codegen",
            tRPC: "None — pure TypeScript inference",
            REST: "Often (OpenAPI to client)",
            GraphQL: "Yes (schema to types)",
          },
          {
            aspect: "Contract for non-TS clients",
            tRPC: "None — TypeScript only",
            REST: "Yes — OpenAPI or plain JSON is universal",
            GraphQL: "Yes — the schema is introspectable",
          },
          {
            aspect: "Over/under-fetching",
            tRPC: "Fixed endpoints with predictable payloads",
            REST: "Frequently over- or under-fetches",
            GraphQL: "Client selects exact fields",
          },
          {
            aspect: "Infrastructure cost",
            tRPC: "Very low — no new protocol",
            REST: "Low",
            GraphQL: "High — gateway, batching, complexity limits",
          },
          {
            aspect: "Best for",
            tRPC: "TS client and TS server in one codebase",
            REST: "Public APIs and polyglot clients",
            GraphQL: "Many clients with shifting data needs",
          },
        ],
      },
      {
        type: "text",
        heading: "Context, Middleware, and Validation",
        content:
          "tRPC procedures receive a **context** built per request — the authenticated user, a database handle, a logger. Middleware wraps a procedure and can enrich or reject it: authenticate, check a permission, start a timer, log, or rate-limit. Because middleware runs before the resolver, a protectedProcedure guarantees ctx.user is non-null for every handler that uses it.\n\nInput validation happens at the boundary with a schema library such as Zod. The same schema produces both the runtime validation and the static input type the client sees, so the client cannot even call a procedure with the wrong shape. That is how tRPC gets its ergonomics: the schema is authored once and used everywhere.",
      },
      {
        type: "code",
        heading: "Context, Middleware, and Errors",
        language: "typescript",
        label: "middleware.ts",
        code: `// Context is created per request from the raw HTTP request.
export async function createContext({ req }: { req: Request }): Promise<Context> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  return { db, user: token ? await verifyToken(token) : null, log: logger() };
}

const withTiming = t.middleware(async ({ path, next, ctx }) => {
  const start = Date.now();
  const result = await next();
  ctx.log.info({ path, ms: Date.now() - start });
  return result;
});

const requireRole = (role: Role) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.user || ctx.user.role !== role) {
      throw new TRPCError({ code: 'FORBIDDEN' }); // server-side authority
    }
    return next();
  });

export const adminProcedure = t.procedure.use(withTiming).use(requireRole('admin'));`,
      },
      {
        type: "steps",
        heading: "When to Choose tRPC",
        steps: [
          {
            title: "Both ends are TypeScript",
            detail:
              "The guarantee depends on the client importing the server's types. If your clients are Swift, Kotlin, or an external partner in another language, tRPC gives them nothing — use REST or GraphQL.",
          },
          {
            title: "You control the whole stack",
            detail:
              "tRPC is ideal for a Next.js app, a monorepo, or a first-party SPA talking to a first-party backend where one team owns both sides and they ship together.",
          },
          {
            title: "You do not need a public contract",
            detail:
              "There is no OpenAPI document and no introspectable schema, so tRPC is a poor fit for a public or partner-facing API. For internal product APIs it is often the fastest path to a typed surface.",
          },
          {
            title: "You want fast, batched calls",
            detail:
              "The HTTP batch link coalesces many procedure calls from a single render into one request, cutting round trips and latency — a big win for dashboards and list-heavy screens.",
          },
          {
            title: "Keep an escape hatch",
            detail:
              "If a public or polyglot client appears later, expose a thin OpenAPI layer over the same handlers. Do not discover too late that your only contract lives inside TypeScript.",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Type Safety Stops at the Network",
        content:
          "tRPC gives compile-time safety, but the network is still the network. A version-skewed mobile client, a cached response, or a runtime type error can still send a payload that does not match the inferred type — inference is a promise the compiler makes about code, not a runtime guarantee about bytes.\n\nValidate inputs with Zod on the server (tRPC does this for you) and never trust the client for authorisation; the middleware runs on the server, so it is authoritative. Treat the type as a developer-ergonomics win, not a security boundary.",
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "Where tRPC Shines",
        content:
          "tRPC was created at Vercel and is the de facto default for the Next.js T3 stack, where one team owns a TypeScript frontend and a TypeScript backend. It removes an entire class of bugs — a renamed field breaking a page — and eliminates the codegen step that OpenAPI clients require. The trade-off is deliberate: the type-safe contract exists only inside the TypeScript world, so it is chosen for first-party apps and monorepos, not for public or polyglot APIs.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "tRPC delivers end-to-end type safety with no codegen — the client infers types from the server router",
          "It only works when both client and server are TypeScript and can share types",
          "Procedures are queries or mutations; input is validated at the boundary with a schema library like Zod",
          "Middleware runs before resolvers to authenticate, authorise, log, and rate-limit",
          "HTTP batch links coalesce multiple calls into one request, cutting round trips",
          "Choose tRPC for first-party TS apps; pick REST or GraphQL when clients are polyglot or public",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why does tRPC provide end-to-end type safety without code generation?",
        options: [
          "It sends TypeScript types over the network",
          "The client derives its types from the server router's type via TypeScript inference, shared through the import system",
          "It compiles the server into a schema file first",
          "It uses runtime reflection on every request",
        ],
        correctIndex: 1,
        explanation:
          "tRPC exports the router's type (AppRouter) and the client is typed with that generic, so TypeScript infers every procedure's input and output directly from the server code. No artifact is generated and no types travel over the wire.",
      },
      {
        question: "Which situation makes tRPC a poor choice?",
        options: [
          "A monorepo where one team owns a Next.js app and its backend",
          "A public API consumed by third-party clients written in Go, Python, and Swift",
          "An internal admin dashboard written in TypeScript",
          "A TypeScript SPA talking to a TypeScript server",
        ],
        correctIndex: 1,
        explanation:
          "tRPC's safety depends on the client importing the server's types, which requires a TypeScript client that shares the type package. A polyglot, third-party, public API cannot import those types, so REST or GraphQL — which have language-neutral contracts — fit far better.",
      },
      {
        question: "What is the role of the tRPC context and middleware?",
        options: [
          "They generate an OpenAPI document",
          "Context is built per request; middleware authenticates, authorises, logs, and enriches the procedure before it runs",
          "They define the wire protocol",
          "They replace input validation",
        ],
        correctIndex: 1,
        explanation:
          "Context carries per-request state such as the authenticated user and database handle. Middleware wraps a procedure to run authentication, authorisation, logging, or rate limiting before the resolver, and can narrow the context type so downstream handlers know the user exists.",
      },
      {
        question:
          "If tRPC gives compile-time type safety, why still validate input on the server?",
        options: [
          "Validation is required by the tRPC compiler",
          "Compile-time inference is not a runtime guarantee against version-skewed or malformed clients, and authorisation must be enforced server-side",
          "Zod makes queries faster",
          "Without validation the types are lost",
        ],
        correctIndex: 1,
        explanation:
          "Types are a promise about code you compile, not about bytes arriving at runtime. A skewed client can send an unexpected payload, so the server validates inputs and enforces authorisation itself rather than trusting the client.",
      },
    ],
  },

  // ─── HATEOAS & JSON:API ─────────────────────────────────────────────────

  "hateoas-jsonapi": {
    slug: "hateoas-jsonapi",
    title: "HATEOAS & JSON:API",
    tagline: "Hypermedia controls and the JSON:API spec for self-describing REST",
    sections: [
      {
        type: "text",
        heading: "What HATEOAS Actually Means",
        content:
          "REST is often reduced to HTTP verbs plus JSON, but the original dissertation describes something stricter: a **hypermedia-driven** API where responses contain links that tell the client what it can do next. This is HATEOAS — Hypermedia As The Engine Of Application State.\n\nThe idea is that a well-behaved client is not hard-coded to URL patterns. It starts from a single entry point, reads the available links, and follows them. The server can reorganise URLs, add capabilities, or change flows without breaking clients that follow links instead of constructing paths. Few APIs implement it fully, but the parts that do work — links, affordances, sparse fieldsets — are genuinely useful when clients cannot be redeployed on demand.",
      },
      {
        type: "analogy",
        heading: "Driving by Signs vs by Memory",
        content:
          "A HATEOAS client is a driver who navigates by road signs: at every junction the sign tells them where they can go, and the network can be re-routed without the driver memorising a map.\n\nA conventional hard-coded client is a driver who memorised the route at build time. Move a road and they are lost until someone reprints their map. Hypermedia puts the map into every response, so the directions are always current.",
      },
      {
        type: "text",
        heading: "Links and Affordances",
        content:
          "A hypermedia response carries **links** (where you can go) and **affordances** (what you can do there). A link has a relation (rel — self, next, edit, cancel), an href, and usually a method. Older formats such as HAL added embedded resources and a dedicated _links block. The goal is that a client can discover that an order can be cancelled from the response itself, without asking the server what state it is in.\n\nThe value is decoupling: the server owns the state machine and advertises the valid transitions. When a business rule changes — say cancellation is no longer allowed after shipping — the server simply stops emitting the cancel link, and a well-built client hides the option automatically.",
      },
      {
        type: "code",
        heading: "A Hypermedia Response (HAL-style)",
        language: "json",
        label: "hal.json",
        code: `{
  "id": "ord_123",
  "status": "pending",
  "total": 4999,
  "_links": {
    "self":   { "href": "/orders/ord_123" },
    "cancel": { "href": "/orders/ord_123/cancel", "method": "POST" },
    "pay":    { "href": "/orders/ord_123/payment", "method": "POST" },
    "items":  { "href": "/orders/ord_123/items" }
  },
  "_embedded": {
    "customer": {
      "id": "cus_9",
      "_links": { "self": { "href": "/customers/cus_9" } }
    }
  }
}`,
      },
      {
        type: "comparison",
        heading: "Plain JSON vs JSON:API",
        headers: ["Plain JSON", "JSON:API"],
        rows: [
          {
            aspect: "Standardisation",
            "Plain JSON": "Ad hoc, decided per team",
            "JSON:API": "A published spec with fixed conventions",
          },
          {
            aspect: "Resource shape",
            "Plain JSON": "Whatever the team chooses",
            "JSON:API": "type, id, attributes, relationships always present",
          },
          {
            aspect: "Relationships",
            "Plain JSON": "Nested objects or ids, team's choice",
            "JSON:API": "A relationships block plus an included array",
          },
          {
            aspect: "Query parameters",
            "Plain JSON": "Custom parameters per API",
            "JSON:API": "Standard filter, fields, include, sort, and page",
          },
          {
            aspect: "Tooling",
            "Plain JSON": "A client written per API",
            "JSON:API": "Shared clients and serialisers exist",
          },
          {
            aspect: "Best for",
            "Plain JSON": "Small, single-team APIs with controlled clients",
            "JSON:API": "Many clients needing one predictable shape",
          },
        ],
      },
      {
        type: "text",
        heading: "The JSON:API Specification",
        content:
          "JSON:API is a concrete, opinionated answer to what a standard REST payload looks like. Every resource has a type and an id and lives in a top-level data member, with attributes holding fields and relationships holding links to other resources. Related resources requested with include are sideloaded once in a top-level included array and referenced by type and id, which eliminates duplication.\n\nThe spec also standardises query parameters: **sparse fieldsets** (fields[article]=title,body), **sorts** (sort=-createdAt), compound documents (include=author,comments.author), and error objects with a consistent shape. Pagination follows a links object with first, prev, next, and last.",
      },
      {
        type: "code",
        heading: "A JSON:API Payload with Includes",
        language: "json",
        label: "jsonapi.json",
        code: `{
  "data": {
    "type": "articles",
    "id": "1",
    "attributes": { "title": "Designing APIs" },
    "relationships": {
      "author": { "data": { "type": "people", "id": "9" } }
    },
    "links": { "self": "/articles/1" }
  },
  "included": [
    {
      "type": "people",
      "id": "9",
      "attributes": { "name": "Ada" }
    }
  ],
  "links": {
    "first": "/articles?page[number]=1",
    "next":  "/articles?page[number]=3",
    "prev":  "/articles?page[number]=1",
    "last":  "/articles?page[number]=10"
  }
}`,
      },
      {
        type: "code",
        heading: "Requesting Sparse Fieldsets",
        language: "http",
        label: "request.http",
        code: `GET /articles?include=author,comments.author&fields[articles]=title,author&fields[people]=name HTTP/1.1
Host: api.example.com
Accept: application/vnd.api+json

# The response uses the media type application/vnd.api+json.
# fields[...] trims attributes; include sideloads relationships once, without duplication.`,
      },
      {
        type: "steps",
        heading: "When HATEOAS Pays Off",
        steps: [
          {
            title: "Long-lived or undisciplined clients",
            detail:
              "Mobile apps and partner integrations you cannot redeploy on demand benefit most: following links means a server-side flow change does not break a shipped client.",
          },
          {
            title: "Complex or fast-changing workflows",
            detail:
              "Order lifecycles, multi-step approvals, and state machines map naturally to affordances. Advertising valid transitions keeps business rules on the server where they belong.",
          },
          {
            title: "Multiple independent consumers",
            detail:
              "When several teams build clients against one API, a standard such as JSON:API removes the per-team negotiation over payload shape and query conventions.",
          },
          {
            title: "Hypermedia as discovery",
            detail:
              "A single entry point plus links lets clients explore capabilities without out-of-band documentation — useful for public APIs and developer directories.",
          },
          {
            title: "Be honest about the cost",
            detail:
              "Hypermedia adds payload size, client sophistication, and documentation overhead. For a small, first-party, fast-moving API, hand-crafted JSON is often the pragmatic choice.",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "The Cost of Hypermedia",
        content:
          "Full HATEOAS is rare in production, and for good reasons. Links bloat every response, most clients ignore them anyway, and building a generic hypermedia client is significantly harder than hard-coding a few URLs. Many teams implement a light version — a links block and maybe a next cursor — and stop there.\n\nAdopt hypermedia deliberately, not religiously. If every consumer is a first-party TypeScript client you ship weekly, the decoupling it buys is small and the ceremony is real. If consumers sit outside your control and live for years, the same ceremony is exactly the insurance you want.",
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "Who Actually Uses It",
        content:
          "GitHub's REST API returns a links object with pagination relations and expects clients to follow them rather than construct page URLs. PayPal, Stripe, and many finance APIs embed navigational links. JsonApiDotNetCore, Elide, and many enterprise stacks power large public APIs built on JSON:API. The pattern that endures is not full hypermedia clients but hypermedia ingredients: a links object, cursor-based next and prev, and standardised relationship expansion.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "HATEOAS means responses include links that drive the client's next action, not hard-coded URLs",
          "Links carry a relation, an href, and often a method; affordances advertise valid transitions",
          "The server owns the state machine: it emits or omits links as business rules change",
          "JSON:API standardises resource shape (type, id, attributes, relationships) and error objects",
          "Sparse fieldsets, include, sort, and page are standard JSON:API query parameters",
          "Hypermedia has real costs — adopt it when clients are external or long-lived, not by default",
        ],
      },
    ],
    quiz: [
      {
        question: "What is the central idea of HATEOAS?",
        options: [
          "Requests must use only GET and POST",
          "Responses include hypermedia links so clients discover available actions instead of hard-coding URLs",
          "The server pre-renders HTML for browsers",
          "Caching is disabled",
        ],
        correctIndex: 1,
        explanation:
          "HATEOAS (Hypermedia As The Engine Of Application State) puts navigational links and affordances into responses, so clients follow links the server provides rather than constructing URLs. That lets the server change flows and URLs without breaking clients that follow links.",
      },
      {
        question: "Every JSON:API resource object must include which members?",
        options: [
          "name and url",
          "type and id (plus optional attributes and relationships)",
          "links and meta",
          "errors and included",
        ],
        correctIndex: 1,
        explanation:
          "A JSON:API resource object is identified by its type and id; optional members are attributes and relationships. The top-level document may also carry included, links, and meta, but type and id are the mandatory identifiers of each resource.",
      },
      {
        question:
          "What does a JSON:API sparse fieldset request like fields[articles]=title,author do?",
        options: [
          "Deletes the other attributes from the record",
          "Limits the returned attributes to the requested subset, reducing payload size",
          "Requests all attributes except those listed",
          "Sorts articles by the listed fields",
        ],
        correctIndex: 1,
        explanation:
          "Sparse fieldsets let a client name exactly which attributes it wants per type. The server returns only those, shrinking the payload and reducing over-fetching without changing the resource's stored data.",
      },
      {
        question: "Why is full HATEOAS relatively rare in production?",
        options: [
          "It is impossible to implement in JSON",
          "It adds payload size and client complexity, and most consumers ignore links — many APIs adopt only hypermedia ingredients",
          "HTTP forbids links in responses",
          "It violates REST principles",
        ],
        correctIndex: 1,
        explanation:
          "Full hypermedia responses are larger, generic hypermedia clients are hard to build, and most consumers ignore the links. Many teams keep the useful parts — a links object and cursor pagination — and skip the rest of the ceremony.",
      },
    ],
  },

  // ─── SOAP & XML-RPC ─────────────────────────────────────────────────────

  "soap-xml": {
    slug: "soap-xml",
    title: "SOAP & XML-RPC",
    tagline: "The legacy enterprise protocols you will still have to integrate",
    sections: [
      {
        type: "text",
        heading: "Why SOAP Still Exists",
        content:
          "SOAP is a protocol for exchanging structured XML messages, traditionally over HTTP but also over SMTP or raw TCP. It predates REST's dominance and is still deeply embedded in banking, insurance, healthcare, telecom, and government systems, plus enterprise platforms such as SAP, Salesforce, and Microsoft Dynamics.\n\nYou will not choose SOAP for a greenfield service. You will meet it when a partner hands you a WSDL, when a payment or identity system only speaks it, or when you must talk to an ERP that has exposed the same interface for fifteen years. Knowing how it works — and where its strengths lie — turns a painful integration into a routine one.",
      },
      {
        type: "analogy",
        heading: "The Notarised Contract",
        content:
          "A REST call is a handshake: quick, casual, low ceremony. A SOAP call is a notarised legal document. Every message is formally written, signed, and stamped, and there are rules for exactly how it must be formatted and what each clause means.\n\nThe ceremony feels heavy for small exchanges, but it is precisely why regulated industries adopted it: when two parties must prove exactly what was said, that formal envelope and its signature scheme matter far more than the speed of an informal chat.",
      },
      {
        type: "text",
        heading: "The SOAP Envelope",
        content:
          "Every SOAP message is an XML document with a required **Envelope** holding an optional **Header** and a required **Body**. The Header carries cross-cutting concerns — authentication tokens, WS-Security signatures, transaction IDs. The Body carries the actual call: a method name and its parameters, or the response.\n\nA **Fault** element standardises errors with a fault code, a fault string, and optional detail. Because the message is ordinary XML it can carry attachments (MTOM or SwA) and traverse firewalls as regular HTTP traffic, which was a major advantage when many enterprise firewalls blocked arbitrary protocols.",
      },
      {
        type: "code",
        heading: "A SOAP Request Envelope",
        language: "plaintext",
        label: "request.xml",
        code: `POST /OrderService HTTP/1.1
Host: api.partner.example.com
Content-Type: text/xml; charset=utf-8
SOAPAction: "http://example.com/orders/CreateOrder"

<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsse:UsernameToken>
        <wsse:Username>svc-orders</wsse:Username>
        <wsse:Password>...</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soap:Header>
  <soap:Body>
    <CreateOrder xmlns="http://example.com/orders">
      <CustomerId>C123</CustomerId>
      <Total>4999</Total>
    </CreateOrder>
  </soap:Body>
</soap:Envelope>`,
      },
      {
        type: "text",
        heading: "WSDL: The Machine-Readable Contract",
        content:
          "A WSDL (Web Services Description Language) document is the SOAP equivalent of OpenAPI: a machine-readable description of the service's operations, message shapes, XML schema types, and endpoint addresses. Because it is machine-readable, tooling can generate a fully typed client from it — you rarely write SOAP by hand.\n\nA WSDL typically imports XSD schema definitions for the payload types, then defines messages, port types (the operations), bindings (SOAP over HTTP, in document/literal or rpc/encoded style), and services (the concrete endpoints). The two classic styles — document/literal and rpc/encoded — still trip up integrators; document/literal is the interoperable choice and the WS-I Basic Profile mandates it.",
      },
      {
        type: "code",
        heading: "A WSDL Fragment",
        language: "plaintext",
        label: "order.wsdl",
        code: `<wsdl:definitions targetNamespace="http://example.com/orders"
    xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/"
    xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    xmlns:tns="http://example.com/orders">
  <wsdl:types>
    <xsd:schema targetNamespace="http://example.com/orders">
      <xsd:element name="CreateOrder">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="CustomerId" type="xsd:string"/>
            <xsd:element name="Total" type="xsd:int"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
    </xsd:schema>
  </wsdl:types>

  <wsdl:message name="CreateOrderRequest">
    <wsdl:part name="parameters" element="tns:CreateOrder"/>
  </wsdl:message>

  <wsdl:portType name="OrderServicePort">
    <wsdl:operation name="CreateOrder">
      <wsdl:input message="tns:CreateOrderRequest"/>
    </wsdl:operation>
  </wsdl:portType>

  <wsdl:binding name="OrderServiceBinding" type="tns:OrderServicePort">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
  </wsdl:binding>
</wsdl:definitions>`,
      },
      {
        type: "comparison",
        heading: "SOAP vs REST",
        headers: ["SOAP", "REST"],
        rows: [
          {
            aspect: "Nature",
            SOAP: "A strict protocol with fixed rules",
            REST: "An architectural style with loose constraints",
          },
          {
            aspect: "Payload",
            SOAP: "XML only",
            REST: "Usually JSON, any media type",
          },
          {
            aspect: "Contract",
            SOAP: "WSDL plus XSD, machine-readable",
            REST: "OpenAPI often, but optional",
          },
          {
            aspect: "Transport",
            SOAP: "HTTP, SMTP, or raw TCP",
            REST: "HTTP",
          },
          {
            aspect: "Security",
            SOAP: "WS-Security, message-level signing and encryption",
            REST: "TLS plus OAuth2 or JWT at the transport layer",
          },
          {
            aspect: "Best for",
            SOAP: "Legacy, regulated, transactional enterprise integration",
            REST: "Modern web, mobile, and public APIs",
          },
        ],
      },
      {
        type: "text",
        heading: "WS-Security and the WS-* Landscape",
        content:
          "SOAP's enterprise appeal came from the WS-* standards, especially **WS-Security (WSSE)**, which signs and encrypts individual message parts so confidentiality and integrity survive intermediaries. WS-ReliableMessaging guarantees delivery over unreliable transports, and WS-AtomicTransaction coordinates distributed transactions — capabilities hard to replicate simply over REST.\n\nIn practice the security stack is the one you meet most: many enterprise partners require a signed UsernameToken or a SAML assertion in the SOAP header, so your client must produce canonical XML and a signature digest. Libraries such as node-soap on the client save you from hand-rolling this.",
      },
      {
        type: "text",
        heading: "XML-RPC: The Simpler Ancestor",
        content:
          "XML-RPC predates SOAP and is far simpler: a request is an XML document with a methodCall naming the method and a params list; the response is a methodResponse with a single param. Types are a small fixed set — string, int, boolean, double, dateTime, base64, struct, and array. There is no WSDL by default and no WS-* stack.\n\nYou will meet XML-RPC in older blogging platforms (WordPress, Blogger), legacy device APIs, and some monitoring systems. It is trivial to call — the request body is a handful of tags — and a reasonable bridge when a system exposes nothing more modern.",
      },
      {
        type: "code",
        heading: "An XML-RPC Call and Response",
        language: "plaintext",
        label: "xmlrpc.xml",
        code: `<!-- Request: call orders.getOrderTotal(orderId, includeTax) -->
<?xml version="1.0"?>
<methodCall>
  <methodName>orders.getOrderTotal</methodName>
  <params>
    <param><value><string>ord_123</string></value></param>
    <param><value><boolean>1</boolean></value></param>
  </params>
</methodCall>

<!-- Response: a single value, here a double -->
<?xml version="1.0"?>
<methodResponse>
  <params>
    <param><value><double>49.99</double></value></param>
  </params>
</methodResponse>`,
      },
      {
        type: "steps",
        heading: "Integrating with a Legacy SOAP Service",
        steps: [
          {
            title: "Start from the WSDL",
            detail:
              "Get the partner's WSDL, generate a typed client with a tool, and pin the WSDL in your repo. Treat it as the contract; never hand-craft the XML when a generator can produce it.",
          },
          {
            title: "Handle the envelope and headers",
            detail:
              "Authentication usually lives in the WS-Security header. Add the required token, timestamp, and signature exactly as the partner specifies, and expect strict canonical XML that rejects whitespace changes.",
          },
          {
            title: "Wrap it behind your own interface",
            detail:
              "Never let the SOAP shapes leak into your domain. Map requests and responses to your own types in an adapter, so when the partner upgrades or you replace the integration your core code does not change.",
          },
          {
            title: "Design for its failure modes",
            detail:
              "SOAP faults return HTTP 500 with a Fault body. Distinguish transport failures from application faults, set generous timeouts, and add retries with idempotency keys for operations safe to repeat.",
          },
          {
            title: "Instrument and contract-test",
            detail:
              "Log the SOAPAction and correlation IDs, monitor fault codes, and run contract tests against a partner sandbox so schema drift is caught before production.",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "SOAP Integration Pitfalls",
        content:
          "SOAP punishes assumptions. A partner may use rpc/encoded style, require a WS-Security signature over a specific canonicalisation, or demand exact namespace prefixes. XML is whitespace-sensitive in signature computation, so a pretty-printing library can silently break verification.\n\nThe most common production failures are: timeouts far longer than HTTP defaults (batch operations often take minutes), faults arriving as HTTP 500 that naive clients treat as network errors, and WSDL endpoints that differ between sandbox and production. Pin the WSDL, configure timeouts explicitly, and parse faults rather than status codes.",
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "Where SOAP Still Rules",
        content:
          "Banking, insurance policy systems, healthcare integrations, and large ERP and CRM platforms such as SAP, Salesforce, and Microsoft Dynamics expose or consume SOAP. Payment networks and government tax and identity services frequently mandate WS-Security. The pragmatic stance: keep SOAP at the edge behind an adapter, treat the WSDL as an external contract, and expose modern REST or events to your own systems.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "SOAP is a strict XML messaging protocol still dominant in banking, insurance, healthcare, and big ERP",
          "Every message is an Envelope with an optional Header and a Body; errors use a Fault element",
          "A WSDL is the machine-readable contract — generate typed clients from it rather than hand-writing XML",
          "WS-Security signs and encrypts message parts, which is why regulated industries rely on SOAP",
          "XML-RPC is a far simpler, WSDL-free ancestor still found in older platforms and device APIs",
          "Wrap legacy SOAP behind an adapter so its shapes do not leak into your domain model",
        ],
      },
    ],
    quiz: [
      {
        question: "What is the WSDL's role for a SOAP service?",
        options: [
          "It is the JSON schema for the response",
          "It is a machine-readable description of operations, message shapes, and endpoints, used to generate clients",
          "It stores the service's runtime logs",
          "It replaces WS-Security",
        ],
        correctIndex: 1,
        explanation:
          "A WSDL describes the service's operations, messages, XSD types, bindings, and endpoint addresses in a machine-readable form. Tooling consumes it to generate fully typed clients, which is why you rarely write SOAP XML by hand.",
      },
      {
        question: "Where do SOAP application errors appear?",
        options: [
          "In the HTTP status line only",
          "As a Fault element inside the SOAP Body, often returned with HTTP 500",
          "As a JSON error object",
          "In the SOAPAction header",
        ],
        correctIndex: 1,
        explanation:
          "SOAP standardises errors as a Fault element (code, string, optional detail) inside the envelope, typically returned alongside HTTP 500. Clients that only inspect the status code misread application faults as network errors — parse the Fault instead.",
      },
      {
        question: "Why do regulated industries still use SOAP with WS-Security?",
        options: [
          "SOAP is faster than REST",
          "WS-Security signs and encrypts individual message parts end-to-end, giving message-level integrity and confidentiality required for compliance",
          "SOAP supports more HTTP verbs",
          "SOAP payloads are smaller",
        ],
        correctIndex: 1,
        explanation:
          "WS-Security secures the message itself — signing and encrypting parts so confidentiality and integrity survive intermediaries — rather than relying only on transport security. That message-level guarantee is what compliance-driven and transactional enterprise systems require.",
      },
      {
        question: "How should a modern service integrate a legacy SOAP partner?",
        options: [
          "Expose the SOAP shapes directly through the whole codebase",
          "Wrap the SOAP client behind an adapter that maps to domain types, and treat the WSDL as an external contract",
          "Rewrite the partner's service as REST",
          "Skip the WSDL and hand-write the XML each time",
        ],
        correctIndex: 1,
        explanation:
          "The adapter isolates the legacy shapes so your domain model stays clean and the integration can be replaced without touching core code. Pin and treat the WSDL as the external contract, and generate the client from it rather than hand-writing XML.",
      },
    ],
  },
};
