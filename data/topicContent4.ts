// Part 4: API Design, Contracts, Protocols, and Reliability topics

import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_PART4: Record<string, TopicContent> = {
  // ─── API DESIGN & CONTRACTS ───────────────────────────────────────────────

  "api-pagination": {
    slug: "api-pagination",
    title: "Pagination & Filtering",
    tagline: "Cursor vs offset pagination, and doing it efficiently at scale",
    sections: [
      {
        type: "text",
        heading: "Why Pagination Exists",
        content:
          "Every list endpoint eventually returns too much data. A table with 50 million rows cannot be serialized into a single JSON response — it would exhaust server memory, saturate bandwidth, and take seconds to transfer. Pagination splits a large result set into bounded, ordered windows.\n\nThe two industry-standard strategies are **offset pagination** (LIMIT/OFFSET) and **cursor pagination** (keyset). They differ in performance characteristics, correctness under concurrent writes, and the shape of the API contract they expose. Choosing the wrong one causes correctness bugs at moderate scale and database meltdowns at large scale.",
      },
      {
        type: "analogy",
        heading: "The Book and the Bookmark",
        content:
          "Offset pagination is like opening a book to page 40 by counting pages from the front. It works, but every time you want page 40 you recount from the beginning — page 40 is defined purely by its distance from the start.\n\nCursor pagination is like a bookmark. You do not care how far from the start you are; you remember exactly where you stopped and continue from there. If someone inserts new pages at the front, the bookmark still points at the same content. With the counting method, insertions shift everything and you re-read or skip content.",
      },
      {
        type: "text",
        heading: "Offset Pagination",
        content:
          "Offset pagination uses LIMIT and OFFSET to skip a fixed number of rows. It is trivial to implement, supports jumping to any page (page=500), and matches the mental model of page numbers in a UI.\n\nThe cost: the database must scan and discard OFFSET rows before returning any. Requesting page 10,000 means reading 199,980 rows it then throws away, so query time grows linearly with offset depth.\n\nWorse, offset pagination is unstable under concurrent writes. If a row is inserted at the top of the sort order between two requests, the client sees a duplicate; if a row is deleted, the client silently skips a row entirely.",
      },
      {
        type: "code",
        heading: "Offset Pagination",
        language: "sql",
        label: "offset.sql",
        code: `-- Requires an index on the sort column, but still scans the offset rows
SELECT id, email, created_at
FROM users
WHERE deleted_at IS NULL
ORDER BY created_at DESC, id DESC
LIMIT 20 OFFSET 40;   -- page 3, 20 rows per page

-- A total count is a second full scan — expensive on large tables
SELECT COUNT(*) FROM users WHERE deleted_at IS NULL;`,
      },
      {
        type: "code",
        heading: "Cursor (Keyset) Pagination",
        language: "sql",
        label: "cursor.sql",
        code: `-- The cursor encodes the last row's sort key.
-- Uses the composite index (created_at DESC, id DESC) directly.
SELECT id, email, created_at
FROM users
WHERE deleted_at IS NULL
  AND (created_at, id) < ('2024-05-01T10:00:00Z', 98123)
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- No COUNT(*). Detect a next page by fetching LIMIT + 1 rows.
-- Index: CREATE INDEX idx_users_cursor ON users (created_at DESC, id DESC) WHERE deleted_at IS NULL;`,
      },
      {
        type: "text",
        heading: "The Cursor Contract",
        content:
          "A cursor is an opaque, base64-encoded token that captures the position in the ordered result set — typically the sort key of the last returned row. Clients must treat it as opaque and pass back exactly what the server gave them. Encoding the sort values, not just a row ID, keeps the token stable even if the row is later modified.\n\nCritical rule: the ORDER BY must be **total** — deterministic and unique. Sorting only by created_at is ambiguous when two rows share a timestamp; always append the primary key as a tiebreaker. Without a unique tiebreaker, cursors can skip or repeat rows under concurrent writes.",
      },
      {
        type: "code",
        heading: "Cursor Encoding in Node.js",
        language: "typescript",
        label: "cursor.ts",
        code: `import { Request, Response } from 'express';

interface Cursor { createdAt: string; id: number; }

function encodeCursor(row: { createdAt: Date; id: number }): string {
  const payload = JSON.stringify({ createdAt: row.createdAt.toISOString(), id: row.id });
  return Buffer.from(payload).toString('base64url');
}

function decodeCursor(token: string): Cursor {
  return JSON.parse(Buffer.from(token, 'base64url').toString());
}

app.get('/api/v1/users', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100); // cap the page size
  const cursor = req.query.cursor ? decodeCursor(String(req.query.cursor)) : undefined;

  // Fetch limit + 1 rows to detect whether a next page exists
  const rows = await db.query(
    cursor
      ? 'SELECT id, email, created_at FROM users WHERE (created_at, id) < ($1, $2) ORDER BY created_at DESC, id DESC LIMIT $3'
      : 'SELECT id, email, created_at FROM users ORDER BY created_at DESC, id DESC LIMIT $1',
    cursor ? [cursor.createdAt, cursor.id, limit + 1] : [limit + 1]
  );

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);
  const endCursor = page.length ? encodeCursor(page[page.length - 1]) : null;

  res.json({
    data: page,
    pageInfo: { hasNextPage: hasMore, endCursor },
    next: hasMore ? \`/api/v1/users?limit=\${limit}&cursor=\${endCursor}\` : null,
  });
});`,
      },
      {
        type: "comparison",
        heading: "Offset vs Cursor Pagination",
        headers: ["Offset", "Cursor"],
        rows: [
          {
            aspect: "Performance at depth",
            Offset: "Degrades linearly — scans and discards OFFSET rows",
            Cursor: "Constant — seeks directly into the index",
          },
          {
            aspect: "Stability under writes",
            Offset:
              "Unstable — duplicates and skips on concurrent inserts/deletes",
            Cursor: "Stable — anchored to a real row sort key",
          },
          {
            aspect: "Random page jump",
            Offset: "Yes — page=500 is possible",
            Cursor: "No — forward or backward traversal only",
          },
          {
            aspect: "Total count",
            Offset: "Natural with COUNT(*), but expensive",
            Cursor: "Not provided; expose hasNextPage instead",
          },
          {
            aspect: "Index requirement",
            Offset: "Index on the sort column",
            Cursor: "Composite index matching the ORDER BY exactly",
          },
          {
            aspect: "Best for",
            Offset: "Small or static datasets and admin tables",
            Cursor: "Large feeds, infinite scroll, public APIs",
          },
        ],
      },
      {
        type: "text",
        heading: "Filtering and Sorting",
        content:
          "Filters are equality or range predicates on indexed columns. The classic failure is a **filter/sort mismatch**: if you filter by status but sort by created_at, the database may fall back to a sort step that ignores your cursor index and scans everything.\n\nSupporting arbitrary filter and sort combinations requires either one index per combination (a combinatorial explosion) or a whitelist. Real systems expose a whitelist: the GitHub, Stripe, and Slack list APIs accept a fixed set of sortable fields. If a filter is unindexed, expect a sequential scan and plan a partial index for the common access path.",
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "How Real APIs Paginate",
        content:
          "Stripe, GitHub, Slack, and Twitter all use cursor pagination on high-volume list endpoints, returning an opaque next_cursor that clients pass back untouched. GitHub caps per_page at 100. Stripe actively discourages deep pagination and pushes clients toward time-bounded filters such as created[gte]. Elasticsearch ships a search_after keyset parameter for the same reason: deep from/size offsets become unbounded in cost.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Offset pagination is easy but scans discarded rows — cost grows with page depth",
          "Cursor (keyset) pagination seeks directly into an index and stays fast at any depth",
          "Cursor pagination is stable under concurrent writes; offset pagination is not",
          "The ORDER BY must be total — always add a unique tiebreaker such as the primary key",
          "Return an opaque, base64-encoded cursor and let clients treat it as a black box",
          "Fetch limit + 1 rows to compute hasNextPage without a COUNT(*) query",
          "Cap the page size server-side and whitelist which fields are filterable and sortable",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why does cursor pagination stay fast as you page deeper while offset pagination slows down?",
        options: [
          "Cursors cache every result set in Redis",
          "Cursor pagination seeks into the index to the last row, while offset scans and discards every skipped row",
          "Offset pagination always falls back to a full table scan",
          "Cursor pagination compresses the result set before sending",
        ],
        correctIndex: 1,
        explanation:
          "A cursor encodes the sort key of the last row, so the database can seek into the index and read only the next page. OFFSET N forces the engine to read and discard N rows before returning anything, so cost grows linearly with page depth. This is why deep offset pagination on large tables is a common production incident.",
      },
      {
        question:
          "Why must a cursor-paginated ORDER BY include a unique tiebreaker like the primary key?",
        options: [
          "It makes the SQL statement shorter",
          "Without a unique tiebreaker the order is non-deterministic, so cursors can skip or repeat rows",
          "Databases reject ORDER BY on a single column",
          "It is required before the query can use any index",
        ],
        correctIndex: 1,
        explanation:
          "If 500 rows share the same created_at, the database is free to return them in any order. A cursor built only on created_at cannot distinguish them, so a subsequent page can duplicate or omit rows. Appending the unique primary key makes the ordering total and the cursor stable.",
      },
      {
        question:
          "A UI needs to let users jump to an arbitrary page number. Which strategy fits best?",
        options: [
          "Cursor pagination — it supports random access",
          "Offset pagination — it maps naturally to page numbers, accepting the cost trade-off",
          "Neither — pagination cannot support page jumps",
          "Both support page jumps equally well",
        ],
        correctIndex: 1,
        explanation:
          "Cursor pagination only traverses forward or backward from a known position; it cannot jump to an arbitrary page number. Offset pagination maps directly to page numbers. The right engineering choice is offset for small or static datasets where jumping matters, and cursor for large feeds where stability and performance dominate.",
      },
    ],
  },

  "api-versioning": {
    slug: "api-versioning",
    title: "API Versioning & Evolution",
    tagline: "Evolving APIs without breaking existing clients",
    sections: [
      {
        type: "text",
        heading: "Why Versioning Exists",
        content:
          "An API is a contract with clients you do not control. Mobile apps ship on a months-long release cycle, enterprise integrations are written once and never touched, and partners pick up your SDK and forget about it. When you change a response shape, you can break every one of them simultaneously.\n\nVersioning is the discipline of evolving an API over years while keeping every deployed client working. The best strategy is not a version scheme — it is **additive change**. Most changes can be made without a new version at all; a new version is the escape hatch for the rare genuinely breaking change.",
      },
      {
        type: "analogy",
        heading: "The Office Building Renovation",
        content:
          "You cannot rewire an office building while people are working inside. You either add a new wing and migrate teams gradually, or you give everyone notice, run a transition period, and only then tear down the old wiring.\n\nAPIs are the same. Adding a new conference room (a new endpoint or field) breaks nobody. Removing the load-bearing wall everyone leans on (renaming a field, changing a type) requires a plan: announce, support both, migrate, then remove.",
      },
      {
        type: "text",
        heading: "Breaking vs Non-Breaking Changes",
        content:
          "**Non-breaking (safe to ship anytime):** adding a new optional field, adding a new endpoint, adding a new enum value that clients should treat as unknown, relaxing a validation rule.\n\n**Breaking (requires a new version):** removing or renaming a field, changing a field type (integer to string), making an optional field required, changing the meaning of an existing field, changing a status code, or tightening validation.\n\nThe most common mistake is assuming a new field is safe. If a client uses strict deserialization, an unexpected field can throw. This is why the Stripe and Google API design guides require clients to tolerate unknown fields.",
      },
      {
        type: "comparison",
        heading: "Versioning Strategies",
        headers: ["URI Path", "Custom Header", "Media Type", "Query Param"],
        rows: [
          {
            aspect: "Example",
            "URI Path": "GET /v2/users/123",
            "Custom Header": "GET /users/123 + Stripe-Version: 2024-06-01",
            "Media Type": "Accept: application/vnd.api.v2+json",
            "Query Param": "GET /users/123?version=2",
          },
          {
            aspect: "Discoverability",
            "URI Path": "High — visible in the URL and logs",
            "Custom Header": "Low — hidden from casual view",
            "Media Type": "Medium — visible in Accept",
            "Query Param": "High — visible in the URL",
          },
          {
            aspect: "Caching",
            "URI Path": "Clean — each URL is one resource",
            "Custom Header": "Needs Vary header management",
            "Media Type": "Clean — part of content negotiation",
            "Query Param": "Caching can fragment",
          },
          {
            aspect: "Routing",
            "URI Path": "Simple — route by path prefix",
            "Custom Header": "Gateway reads a header to route",
            "Media Type": "Requires content negotiation",
            "Query Param": "Simple to parse",
          },
          {
            aspect: "Best for",
            "URI Path": "Most public REST APIs",
            "Custom Header": "Fine-grained, date-based versions",
            "Media Type": "REST purists",
            "Query Param": "Quick internal toggles",
          },
        ],
      },
      {
        type: "code",
        heading: "Date-Based Versioning (Stripe Style)",
        language: "typescript",
        label: "date-versioning.ts",
        code: `// Clients pin to a dated version. Every response is transformed to match it.
// POST /v1/charges
// Stripe-Version: 2023-10-16

const accountVersion = req.header('Stripe-Version') ?? account.defaultVersion;

// The server always stores and returns the CURRENT shape internally,
// then walks a chain of downgrade migrations back to the pinned version.
function renderForVersion(obj: unknown, pinnedVersion: string, currentVersion: string) {
  let result = obj;
  for (const migration of migrationsBetween(pinnedVersion, currentVersion)) {
    result = migration.downgrade(result); // reshape for the older contract
  }
  return result;
}

app.get('/v1/charges/:id', async (req, res) => {
  const charge = await db.charges.findById(req.params.id); // current shape
  const body = renderForVersion(charge, accountVersion, CURRENT_API_VERSION);
  res.json(body);
});`,
      },
      {
        type: "code",
        heading: "Prefer Additive Change",
        language: "typescript",
        label: "additive.ts",
        code: `// v1 contract that existing clients already parse
interface UserV1 { id: string; name: string; }

// v1 -> v2 intent: split name into first/last.
// REMOVING name would break every client that reads it.
// Instead, ADD fields. Old clients ignore the new keys.
interface UserV2 {
  id: string;
  name: string;        // kept for backward compatibility
  firstName: string;   // new
  lastName: string;    // new
}

// Mark the legacy field deprecated in docs and OpenAPI (deprecated: true),
// keep serving it, and remove it only in the next major version.`,
      },
      {
        type: "steps",
        heading: "Deprecation Lifecycle",
        steps: [
          {
            title: "Announce publicly",
            detail:
              "Document the deprecation with a deadline, migration guide, and the replacement. Give at least 6-12 months for public APIs — Stripe supports old versions for years.",
          },
          {
            title: "Add deprecation headers",
            detail:
              "Return Deprecation and Sunset headers (RFC 9745 and RFC 8594) so automated clients can detect the change programmatically.",
          },
          {
            title: "Instrument per-client usage",
            detail:
              "Log which API version and key each request uses. You cannot retire a version until you can prove no traffic is left — measure, do not guess.",
          },
          {
            title: "Run brownouts",
            detail:
              "Return errors or degraded responses for short windows on the deprecated path so remaining integrators notice before the final cutoff.",
          },
          {
            title: "Turn off and archive",
            detail:
              "Disable the version, keep logs and the schema snapshot for support and audit, then delete the migration code.",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "How Big Companies Version APIs",
        content:
          "Stripe uses date-based versions (Stripe-Version: 2023-10-16) and maintains them for years, letting each account pin to a version. GitHub uses URI versioning via the Accept header (application/vnd.github.v3+json) and requires clients to send a version. Google and Twilio publish explicit deprecation timelines, support overlapping versions, and run client-usage dashboards so they know exactly who is still on an old version before removing it.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Treat the API as a long-lived contract with clients you cannot redeploy on demand",
          "Default to additive change — new fields and endpoints rarely need a new version",
          "Removing, renaming, retyping, or tightening a field is breaking and needs a new version",
          "Pick a versioning strategy early: URI path, header, media type, or query param",
          "URL versions (/v1/, /v2/) are the most explicit and easiest to route and cache",
          "Deprecate with Sunset and Deprecation headers, measure real usage, then remove",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Which of these changes is NON-breaking and can ship without a new version?",
        options: [
          "Renaming a response field from name to fullName",
          "Adding a new optional field to a response object",
          "Changing a field from a string to an integer",
          "Making a previously optional request field required",
        ],
        correctIndex: 1,
        explanation:
          "Adding a new optional field is backward compatible — clients that ignore unknown fields are unaffected. Renaming a field, changing its type, or making a field required all break existing clients because their parsed responses or request payloads no longer match the contract.",
      },
      {
        question:
          "What is the main advantage of Stripe-style date-based versioning?",
        options: [
          "It makes APIs faster",
          "Each account can pin to a dated contract, so the server transforms responses to match the version the client expects",
          "It removes the need to test migrations",
          "It only works for GraphQL",
        ],
        correctIndex: 1,
        explanation:
          "With date-based versioning the server stores data in the current shape and applies a chain of downgrade migrations to render responses in whatever dated version the client pinned to. This lets the platform evolve internally while honoring many old contracts simultaneously — Stripe supports versions for years.",
      },
      {
        question:
          "Before removing a deprecated API version, what must you be able to prove?",
        options: [
          "That it is at least one year old",
          "That no production traffic still uses it, based on per-client usage instrumentation",
          "That the new version has better benchmarks",
          "That the marketing site has been updated",
        ],
        correctIndex: 1,
        explanation:
          "You can only safely retire a version once you have measured that no client still calls it. That requires per-version and per-key usage logging. Without instrumentation you are guessing, and removing a version still in use by a partner or an old mobile build causes an outage.",
      },
    ],
  },

  openapi: {
    slug: "openapi",
    title: "OpenAPI & API Contracts",
    tagline: "Contract-first API design, docs, and codegen",
    sections: [
      {
        type: "text",
        heading: "The Contract is the Source of Truth",
        content:
          "OpenAPI is a machine-readable specification format for describing HTTP APIs: every path, method, parameter, request body, response, and error. It is language-agnostic and versioned (OpenAPI 2.0, 3.0, 3.1 — the 3.1 spec aligns with JSON Schema 2020-12).\n\nA written spec turns your API into a contract that tools can act on: interactive documentation, client SDK generation, server stubs, request validation, and mock servers. Instead of prose docs that drift from reality, the spec is a single artifact that code, docs, and tests are all generated from.",
      },
      {
        type: "analogy",
        heading: "The Architectural Blueprint",
        content:
          "A builder does not improvise a house and write the blueprints afterward. The blueprint comes first: it is reviewed, it is what the electrician, plumber, and roofer all work from, and inspectors verify the build against it.\n\nContract-first API design works the same way. The OpenAPI document is the blueprint. Frontend and backend teams agree on it before writing code, clients are generated from it, and automated checks verify the running server actually matches it.",
      },
      {
        type: "code",
        heading: "An OpenAPI Document",
        language: "yaml",
        label: "openapi.yaml",
        code: `openapi: 3.1.0
info:
  title: Orders API
  version: 1.0.0
  description: Create and query orders.
servers:
  - url: https://api.example.com/v1
paths:
  /orders/{orderId}:
    get:
      operationId: getOrder
      summary: Fetch a single order
      parameters:
        - name: orderId
          in: path
          required: true
          schema: { type: string }
      responses:
        '200':
          description: The order
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Order'
        '404':
          description: Order not found
components:
  schemas:
    Order:
      type: object
      required: [id, status, total]
      properties:
        id: { type: string }
        status: { type: string, enum: [pending, paid, shipped] }
        total: { type: integer, description: Amount in cents }`,
      },
      {
        type: "comparison",
        heading: "Design-First vs Code-First",
        headers: ["Design-First", "Code-First"],
        rows: [
          {
            aspect: "Source of truth",
            "Design-First": "The OpenAPI document",
            "Code-First": "The implementation code",
          },
          {
            aspect: "When design happens",
            "Design-First": "Before implementation, reviewed with consumers",
            "Code-First": "Emerges from the code after writing handlers",
          },
          {
            aspect: "Frontend parallelism",
            "Design-First": "Clients can be generated and mocked immediately",
            "Code-First": "Frontend waits for the server to exist",
          },
          {
            aspect: "Drift risk",
            "Design-First": "Low — spec drives code via generation",
            "Code-First": "Higher — docs can lag behind the code",
          },
          {
            aspect: "Best for",
            "Design-First": "Public APIs, multi-team, SDK distribution",
            "Code-First": "Small internal services, rapid prototyping",
          },
        ],
      },
      {
        type: "code",
        heading: "Generating Types and Clients from the Spec",
        language: "typescript",
        label: "codegen.ts",
        code: `// Generated from the OpenAPI document — never hand-edited.
// npx openapi-typescript ./openapi.yaml -o ./src/api/types.ts

import type { paths } from './api/types';

type Order = paths['/orders/{orderId}']['get']['responses']['200']['content']['application/json'];

// Typed client generated for consumers (openapi-generator, orval, kubb)
const order = await client.getOrder({ orderId: 'ord_123' });
// order is fully typed — status is 'pending' | 'paid' | 'shipped'

// CI guard: fail the build if the running server drifts from the spec.
// npx schemathesis run ./openapi.yaml --checks all --base-url http://localhost:3000`,
      },
      {
        type: "steps",
        heading: "Contract-First Workflow",
        steps: [
          {
            title: "Write the spec",
            detail:
              "Authors describe each path, schema, and error response in OpenAPI. Review it with API consumers before any implementation code is written.",
          },
          {
            title: "Review in a PR",
            detail:
              "The spec is version-controlled as text. Schema changes are reviewed like code; breaking changes are flagged automatically by tools such as oasdiff.",
          },
          {
            title: "Generate artifacts",
            detail:
              "Generate server stubs or framework validation, typed clients, and interactive docs (Redoc, Swagger UI) from the single spec.",
          },
          {
            title: "Validate at runtime",
            detail:
              "Wire request and response validators to the spec so the running server cannot silently diverge from the contract.",
          },
          {
            title: "Test against the contract",
            detail:
              "Run contract tests and fuzzing (Schemathesis, Dredd) in CI to prove the live server honors the documented behavior.",
          },
        ],
      },
      {
        type: "text",
        heading: "What the Spec Unlocks",
        content:
          "Once a valid OpenAPI document exists, an entire toolchain activates. **Docs** render as interactive Swagger UI or Redoc. **Clients** generate in TypeScript, Go, Python, Java, and more. **Mocks** let frontend teams build against a fake server before the real one exists. **Validation** rejects malformed requests before they reach business logic. **Gateways** (Kong, AWS API Gateway, Apigee) import the spec to configure routing and rate limits.\n\nThe discipline is the point: one artifact that everything else derives from, so documentation, SDKs, and behavior cannot drift apart.",
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "How Big Companies Publish Contracts",
        content:
          "Stripe, GitHub, Twilio, and Cloudflare all publish OpenAPI documents for their public APIs; GitHub ships one covering the entire REST surface. Many teams run the spec through a linter (Spectral with the company style guide) in CI so naming and error shapes stay consistent. AWS API Gateway and Kong import OpenAPI to configure routes, and the Google API design guide makes an OpenAPI or protobuf description mandatory for every new service.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "OpenAPI is a machine-readable contract describing every path, schema, and error",
          "Design-first makes the spec the source of truth so docs and code cannot drift",
          "A single spec generates docs, typed clients, mocks, and server validation",
          "Review spec changes in pull requests and detect breaking changes automatically",
          "Validate live requests and responses against the spec so the server cannot diverge",
          "Lint the spec against a shared style guide to keep APIs consistent across teams",
        ],
      },
    ],
    quiz: [
      {
        question: "What does contract-first API design mean?",
        options: [
          "Writing the OpenAPI spec after the implementation is complete",
          "Authoring and reviewing the OpenAPI spec before implementation, then generating code and docs from it",
          "Only documenting endpoints that external clients use",
          "Replacing HTTP with GraphQL",
        ],
        correctIndex: 1,
        explanation:
          "Contract-first means the OpenAPI document is written and agreed on before implementation, and everything else — server stubs, typed clients, docs, and tests — is generated from or validated against it. This keeps the contract and the implementation from drifting apart.",
      },
      {
        question:
          "Which of these is NOT something you can generate from an OpenAPI document?",
        options: [
          "Interactive API documentation",
          "Typed client SDKs in multiple languages",
          "Runtime request and response validation",
          "The business logic inside your handlers",
        ],
        correctIndex: 3,
        explanation:
          "OpenAPI can drive docs, clients, validation, mocks, and gateway configuration, but the actual business logic must be written by humans. The spec describes the interface, not the behavior implementation behind it.",
      },
      {
        question: "How do teams catch breaking changes to an OpenAPI document?",
        options: [
          "By manually re-reading the spec each release",
          "By diffing the new spec against the previous one in CI with tools like oasdiff",
          "By waiting for clients to report errors in production",
          "Breaking changes cannot be detected automatically",
        ],
        correctIndex: 1,
        explanation:
          "Because the spec is version-controlled text, tools like oasdiff can compare two revisions and flag removed fields, retyped properties, or newly required parameters. Running this in CI blocks a breaking change from merging before it reaches clients.",
      },
    ],
  },

  // ─── PROTOCOLS & DATA FORMATS ─────────────────────────────────────────────

  "http-caching": {
    slug: "http-caching",
    title: "HTTP Caching & Conditional Requests",
    tagline: "ETags, Cache-Control, and revalidation done right",
    sections: [
      {
        type: "text",
        heading: "Why HTTP Caching Matters",
        content:
          "HTTP caching is the highest-leverage performance optimization on the web. A correctly cached response is served from memory on the client or from a CDN edge — zero server load, single-digit-millisecond latency, massive bandwidth savings. Cloudflare and Fastly serve a large share of global internet traffic straight from cache.\n\nThe protocol gives you precise control: how long a response stays fresh, whether it can be cached by shared proxies, and how to cheaply revalidate a stale copy instead of re-downloading it. Getting the headers right is the difference between a fast, cheap API and one that hammers your origin.",
      },
      {
        type: "analogy",
        heading: "The Fridge and the Expiry Date",
        content:
          "A response with Cache-Control: max-age is like food with an expiry date. Before the date, you eat it without question — no trip to the store. That is a fresh cache hit served with zero network cost.\n\nOnce it expires, you do not throw it away and buy new food; you first check whether anything changed. That check is a conditional request — you show the cashier your receipt (the ETag) and they tell you if the product is still the same. If nothing changed you keep your food (a 304 Not Modified, with no body transferred).",
      },
      {
        type: "code",
        heading: "Response Caching Headers",
        language: "http",
        label: "response-headers.http",
        code: `HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=30
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Tue, 14 May 2024 09:00:00 GMT
Vary: Accept-Encoding, Accept-Language
Age: 42

{ "data": { "id": 1, "name": "Alice" } }`,
      },
      {
        type: "comparison",
        heading: "Cache-Control Directives",
        headers: ["Directive", "Meaning", "Typical Use"],
        rows: [
          {
            aspect: "max-age",
            Directive: "max-age=60",
            Meaning: "Fresh for 60s in the browser cache",
            "Typical Use": "User-specific content",
          },
          {
            aspect: "s-maxage",
            Directive: "s-maxage=300",
            Meaning: "Fresh for 300s in shared proxy and CDN caches",
            "Typical Use": "Public API responses at the edge",
          },
          {
            aspect: "public / private",
            Directive: "private",
            Meaning: "Only the browser may cache; shared caches must not",
            "Typical Use": "Responses containing user data",
          },
          {
            aspect: "no-store",
            Directive: "no-store",
            Meaning: "Never write this response to any cache",
            "Typical Use": "Passwords, tokens, sensitive data",
          },
          {
            aspect: "no-cache",
            Directive: "no-cache",
            Meaning: "May cache, but must revalidate before every reuse",
            "Typical Use": "Content that changes often",
          },
          {
            aspect: "stale-while-revalidate",
            Directive: "stale-while-revalidate=30",
            Meaning:
              "Serve stale for 30s while fetching a fresh copy in the background",
            "Typical Use": "Fast responses on hot paths",
          },
          {
            aspect: "immutable",
            Directive: "immutable",
            Meaning: "Content will never change at this URL",
            "Typical Use": "Hashed static assets",
          },
        ],
      },
      {
        type: "code",
        heading: "ETag and Conditional Requests",
        language: "typescript",
        label: "etag.ts",
        code: `import { createHash } from 'crypto';

app.get('/api/v1/articles/:id', async (req, res) => {
  const article = await db.articles.findById(req.params.id);
  if (!article) return res.status(404).end();

  // Derive a strong ETag from the exact representation bytes
  const body = JSON.stringify({ data: article });
  const etag = '"' + createHash('sha1').update(body).digest('hex') + '"';

  res.set('ETag', etag);
  res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  res.set('Vary', 'Accept-Encoding');

  // Client already holds this version -> 304, no body transferred
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  res.type('application/json').send(body);
});`,
      },
      {
        type: "steps",
        heading: "How Revalidation Works",
        steps: [
          {
            title: "First request",
            detail:
              "The client has nothing. The server returns a 200 with the body plus an ETag (or Last-Modified). The client stores both.",
          },
          {
            title: "Cache still fresh",
            detail:
              "While within max-age, the client serves its stored copy directly with no request at all. This is the fastest possible path.",
          },
          {
            title: "Cache stale",
            detail:
              "Once max-age elapses, the client sends a conditional request with If-None-Match carrying the stored ETag (or If-Modified-Since with the date).",
          },
          {
            title: "Server compares",
            detail:
              "The server recomputes the validator. If it matches, the representation is unchanged.",
          },
          {
            title: "304 Not Modified",
            detail:
              "The server replies 304 with no body. The client reuses its stored copy and refreshes the freshness window — you saved the full payload transfer.",
          },
        ],
      },
      {
        type: "text",
        heading: "Strong vs Weak Validators",
        content:
          "A **strong ETag** changes whenever the bytes change and permits range requests; it is computed from the exact representation. A **weak ETag** (prefixed with W/) signals semantic equivalence — the resource content is the same even if bytes differ slightly, for example due to different whitespace or a reformatted JSON key order.\n\nThe **Last-Modified** and **If-Modified-Since** pair is a coarser, date-based alternative with one-second granularity, so it can miss changes that occur within the same second. Prefer ETags for precision. Never mismatch a weak validator with a strong comparison, and do not let user-specific responses be cached by shared caches.",
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Caching Mistakes That Cause Incidents",
        content:
          "The classic outage: a private response cached by a shared proxy and served to another user. Always send Cache-Control: private or no-store for anything containing user data, and set Vary correctly so caches key on Accept-Encoding and Authorization. Another common bug is a handler that sets an ETag but never handles If-None-Match, so clients re-download full payloads forever. And a cached logged-out page served to an authenticated user destroys sessions and leaks data.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "A fresh cache hit costs zero server load; caching is the highest-leverage web optimization",
          "max-age governs the browser cache; s-maxage governs shared CDN and proxy caches",
          "Use private or no-store for any response containing user-specific or sensitive data",
          "ETags enable conditional requests so unchanged resources return a bodyless 304",
          "stale-while-revalidate serves content instantly while refreshing it in the background",
          "Set Vary and always handle If-None-Match — a validator you never check saves nothing",
        ],
      },
    ],
    quiz: [
      {
        question: "What is the difference between max-age and s-maxage?",
        options: [
          "They are identical",
          "max-age controls the browser cache; s-maxage controls shared proxy and CDN caches",
          "max-age is for images; s-maxage is for JSON",
          "s-maxage overrides the server clock",
        ],
        correctIndex: 1,
        explanation:
          "max-age sets freshness for private browser caches. s-maxage sets a separate freshness lifetime for shared caches such as CDNs and proxies, and it overrides max-age for those shared caches. This lets you keep a long CDN cache while giving browsers a shorter one.",
      },
      {
        question:
          "A client sends If-None-Match with an ETag and the server finds the resource unchanged. What should it return?",
        options: [
          "200 OK with the full body again",
          "304 Not Modified with no body",
          "204 No Content",
          "412 Precondition Failed",
        ],
        correctIndex: 1,
        explanation:
          "When the stored validator matches the current representation, the server replies 304 Not Modified with no body. The client reuses its cached copy. 412 is for a failed precondition such as If-Match used for optimistic concurrency — a different mechanism entirely.",
      },
      {
        question: "Which response should never be stored by a shared cache?",
        options: [
          "A public list of countries with max-age=3600",
          "A JSON response containing the authenticated user details",
          "A hashed static asset marked immutable",
          "A public product image with a one-day TTL",
        ],
        correctIndex: 1,
        explanation:
          "Responses containing user-specific data must be marked Cache-Control: private or no-store. If a shared CDN or proxy caches them, one user could receive another user data. Public, non-user content such as country lists or hashed assets is exactly what you do want shared caches to store.",
      },
    ],
  },

  serialization: {
    slug: "serialization",
    title: "Serialization Formats",
    tagline: "JSON, Protobuf, Avro, and MessagePack trade-offs",
    sections: [
      {
        type: "text",
        heading: "What Serialization Solves",
        content:
          "Serialization converts in-memory data structures into bytes that can be stored or sent over a network; deserialization reverses it. Every network call, cache entry, message on a queue, and event log entry depends on it.\n\nThe format you choose sets the payload size, encode and decode CPU cost, human readability, and — crucially — how the schema can evolve over time. JSON dominates public HTTP APIs; binary formats dominate internal service communication and high-volume data pipelines.",
      },
      {
        type: "analogy",
        heading: "Packing for a Trip",
        content:
          "JSON is like packing in a clear plastic bag: anyone can see and inspect everything, you can add or remove items freely, but it takes up a lot of space.\n\nProtobuf and MessagePack are like vacuum-sealed compression bags: far smaller, faster to ship, and unreadable without opening them. Avro is like packing against a written manifest — the list of items is described in a schema both sides must agree on, which lets the packer omit the label on each item because the manifest already says what it is.",
      },
      {
        type: "comparison",
        heading: "Serialization Formats",
        headers: ["JSON", "Protobuf", "Avro", "MessagePack"],
        rows: [
          {
            aspect: "Encoding",
            JSON: "Text",
            Protobuf: "Binary",
            Avro: "Binary",
            MessagePack: "Binary",
          },
          {
            aspect: "Schema",
            JSON: "None (self-describing)",
            Protobuf: "Required .proto, field numbers",
            Avro: "Required schema, writer and reader",
            MessagePack: "None (self-describing)",
          },
          {
            aspect: "Human readable",
            JSON: "Yes",
            Protobuf: "No",
            Avro: "No",
            MessagePack: "No (compact)",
          },
          {
            aspect: "Typical payload size",
            JSON: "Baseline (largest)",
            Protobuf: "~2-10x smaller than JSON",
            Avro: "Comparable to Protobuf",
            MessagePack: "~1.5-2x smaller than JSON",
          },
          {
            aspect: "Encode and decode speed",
            JSON: "Moderate",
            Protobuf: "Fast",
            Avro: "Fast",
            MessagePack: "Fast",
          },
          {
            aspect: "Schema evolution",
            JSON: "Additive; clients tolerate unknown keys",
            Protobuf: "Field numbers; never reuse a number",
            Avro: "Explicit resolver rules (backward/forward)",
            MessagePack: "Additive, no schema enforcement",
          },
          {
            aspect: "Best for",
            JSON: "Public HTTP APIs, config, debugging",
            Protobuf: "gRPC, low-latency internal RPC",
            Avro: "Kafka, big-data pipelines, schema registries",
            MessagePack: "Cache values, WebSocket payloads",
          },
        ],
      },
      {
        type: "code",
        heading: "Protocol Buffers",
        language: "protobuf",
        label: "product.proto",
        code: `syntax = "proto3";
package catalog.v1;

message Product {
  string id = 1;            // field numbers are the wire contract
  string name = 2;
  int64 price_cents = 3;
  repeated string tags = 4;
  bool in_stock = 5;
  // Never reuse a removed field number — reserve it instead:
  reserved 6;
}

// Generated code encodes ~40% smaller and decodes 2-5x faster
// than the equivalent JSON for typical records.`,
      },
      {
        type: "code",
        heading: "Avro Schema (Kafka and Data Pipelines)",
        language: "json",
        label: "pageview.avsc",
        code: `{
  "type": "record",
  "name": "PageView",
  "namespace": "analytics",
  "fields": [
    { "name": "userId", "type": "string" },
    { "name": "url", "type": "string" },
    { "name": "ts", "type": { "type": "long", "logicalType": "timestamp-millis" } },
    { "name": "referrer", "type": ["null", "string"], "default": null }
  ]
}`,
      },
      {
        type: "text",
        heading: "Choosing a Format",
        content:
          "Pick **JSON** for public HTTP APIs and anything a human must read or debug — it is universally supported and self-describing. Use **Protobuf** for gRPC and internal service-to-service calls where latency and payload size matter, and where a strict schema is desirable. Use **Avro** with a schema registry (for example Confluent Schema Registry) for Kafka and data-lake pipelines because Avro readers and writers resolve schema differences explicitly, giving safe backward and forward compatibility across producers and consumers you do not control. Use **MessagePack** when you want a drop-in binary alternative to JSON, such as storing compact cache values.\n\nThe schema is the hard part: field numbering in Protobuf and reader/writer resolution in Avro are what actually govern whether you can evolve without breaking consumers.",
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "Field Numbers Are Forever",
        content:
          "In Protobuf, the field number is the wire identity, not the field name. Renaming a field is safe; reusing a retired field number corrupts data because old readers will interpret the new field with the old type. Google and every Protobuf style guide mandate that removed field numbers be reserved permanently. In Avro on Kafka, a schema registry enforces compatibility modes (BACKWARD, FORWARD, FULL) and refuses to register a schema that would break existing consumers — a safety net that has prevented countless data-pipeline incidents.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Serialization format choice drives payload size, CPU cost, and schema evolution strategy",
          "JSON is self-describing and universal — the default for public HTTP APIs",
          "Protobuf gives small, fast binary payloads and strict schemas, ideal for gRPC",
          "Avro pairs with a schema registry and explicit reader/writer resolution for data pipelines",
          "MessagePack is a compact drop-in binary alternative to JSON",
          "In Protobuf the field number is the contract — never reuse or renumber it",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why must a removed Protobuf field number be reserved rather than reused?",
        options: [
          "Reserved numbers are faster to encode",
          "The field number is the wire identity — reusing it makes old readers decode new data with the old type, corrupting values",
          "Protobuf requires sequential numbers",
          "It only matters for gRPC, not plain Protobuf",
        ],
        correctIndex: 1,
        explanation:
          "Protobuf encodes data as field number plus value, not field name. If you reuse a retired number for a new field, an old client that still knows the old number will parse the new bytes according to the old type, silently producing wrong values. Reserving the number prevents this class of data corruption.",
      },
      {
        question:
          "Which format is the best fit for a Kafka data pipeline where multiple producers and consumers evolve independently?",
        options: [
          "JSON, because it is readable",
          "Avro with a schema registry, because reader/writer schema resolution gives explicit compatibility rules",
          "Protobuf, because it has field numbers",
          "MessagePack, because it is compact",
        ],
        correctIndex: 1,
        explanation:
          "Avro stores or references a writer schema and resolves it against the reader schema. The schema registry enforces compatibility modes such as BACKWARD or FULL and rejects incompatible schemas. This is why it is the standard choice for Kafka and big-data pipelines spanning teams that deploy on different schedules.",
      },
      {
        question:
          "You are building a public HTTP API that external developers will integrate against. Which format should you default to?",
        options: [
          "Protobuf, for maximum performance",
          "JSON, because it is self-describing, universally supported, and human-debuggable",
          "Avro, for schema guarantees",
          "MessagePack, to save bandwidth",
        ],
        correctIndex: 1,
        explanation:
          "For public APIs, developer experience and universal tooling outweigh raw performance. JSON is readable, debuggable with curl, supported by every language and browser, and self-describing. Binary formats add client complexity that is rarely justified for public consumer APIs.",
      },
    ],
  },

  // ─── ARCHITECTURE & RELIABILITY ───────────────────────────────────────────

  webhooks: {
    slug: "webhooks",
    title: "Webhooks & Event Callbacks",
    tagline: "Reliably pushing events to external systems",
    sections: [
      {
        type: "text",
        heading: "What Are Webhooks",
        content:
          "A webhook is an HTTP callback: instead of a client polling for changes, your system sends an HTTP POST to a URL the client registered when an event occurs. Stripe does this for payment events, GitHub for repository pushes and pull requests, and Slack for incoming integrations.\n\nWebhooks invert the request direction — your server becomes the client. That inversion is what makes them hard: you are now initiating network calls to arbitrary third-party URLs you do not control, that may be slow, down, or returning garbage. Reliable webhook delivery is an exercise in retries, idempotency, and signing.",
      },
      {
        type: "analogy",
        heading: "The Doorbell vs Checking the Porch",
        content:
          "Polling is checking the porch every 30 seconds to see if a package arrived — mostly wasted trips, and you might notice late. A webhook is a doorbell: when the package arrives, you get a push notification instantly.\n\nBut a doorbell can fail. The visitor might not press it, the wiring could be broken, or they could press it twice. So a well-built webhook system is a doorbell with a backup: signed, timestamped, retried, and idempotent, so a pressed-twice button still rings the door exactly once.",
      },
      {
        type: "steps",
        heading: "Designing Reliable Delivery",
        steps: [
          {
            title: "Sign every payload",
            detail:
              "Compute an HMAC over the raw request bytes plus a timestamp. Receivers recompute and compare in constant time, so they can trust the payload actually came from you.",
          },
          {
            title: "Guarantee at-least-once",
            detail:
              "Senders retry on network failures and 5xx responses with exponential backoff and jitter, spread over hours or days. This means duplicates are inevitable — design for them.",
          },
          {
            title: "Make receivers idempotent",
            detail:
              "Every event carries a stable unique ID. Receivers store processed IDs and skip duplicates, so a redelivered event is harmless.",
          },
          {
            title: "Respond fast and process async",
            detail:
              "The receiver acknowledges with a 2xx immediately and processes the event in the background. Slow endpoints trigger unnecessary retries and look like failures.",
          },
          {
            title: "Monitor and expose failures",
            detail:
              "Track delivery success rates per endpoint, surface a delivery log in the dashboard, and allow manual replays. Blind retries without visibility leave integrations silently broken.",
          },
        ],
      },
      {
        type: "code",
        heading: "Sender: Signing with HMAC and Retrying",
        language: "typescript",
        label: "dispatch.ts",
        code: `import crypto from 'crypto';

interface Endpoint { id: string; url: string; secret: string; }

// Exponential backoff schedule, in seconds, spanning roughly 3 days
const RETRY_DELAYS = [10, 30, 120, 600, 3600, 21600, 86400, 172800];

async function deliver(endpoint: Endpoint, event: WebhookEvent, attempt = 0): Promise<void> {
  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify(event);

  // Sign the exact bytes sent: timestamp + '.' + body
  const signature = crypto
    .createHmac('sha256', endpoint.secret)
    .update(timestamp + '.' + body)
    .digest('hex');

  try {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Id': event.id,
        'X-Webhook-Timestamp': String(timestamp),
        'X-Webhook-Signature': 'v1=' + signature,
      },
      body,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (res.status >= 200 && res.status < 300) return;              // delivered
    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
      return markPermanentFailure(endpoint.id, event.id);          // do not retry 4xx
    }
    throw new Error('Retryable status: ' + res.status);            // 429 and 5xx: retry
  } catch {
    const delay = RETRY_DELAYS[attempt];
    if (delay === undefined) return markPermanentFailure(endpoint.id, event.id);
    await queue.add('deliver', { endpoint, event, attempt: attempt + 1 }, { delay: delay * 1000 });
  }
}`,
      },
      {
        type: "code",
        heading: "Receiver: Verifying and Processing Idempotently",
        language: "typescript",
        label: "receive.ts",
        code: `import express from 'express';
import crypto from 'crypto';

const app = express();

// MUST use the raw body — JSON re-serialization changes the signed bytes
app.post('/webhooks/provider', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.header('X-Webhook-Signature') ?? '';
  const timestamp = req.header('X-Webhook-Timestamp') ?? '';

  // 1. Reject stale deliveries to stop replay attacks (5-minute window)
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return res.status(400).send('Timestamp too old');
  }

  // 2. Recompute the HMAC and compare in constant time
  const expected = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(timestamp + '.' + req.body)
    .digest('hex');
  const received = signature.replace('v1=', '');

  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  ) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString());

  // 3. Acknowledge immediately; the sender must not time out waiting on us
  res.status(200).json({ received: true });

  // 4. Process idempotently — the sender WILL redeliver on any ambiguity
  await processOnce(event.id, () => handleEvent(event)).catch(console.error);
});`,
      },
      {
        type: "comparison",
        heading: "Webhooks vs Polling",
        headers: ["Webhooks", "Polling"],
        rows: [
          {
            aspect: "Latency",
            Webhooks: "Near-instant — pushed on the event",
            Polling: "Up to one poll interval, often seconds to minutes",
          },
          {
            aspect: "Load",
            Webhooks: "One request per event",
            Polling: "Constant request volume even when nothing changes",
          },
          {
            aspect: "Failure handling",
            Webhooks:
              "Requires retries, signing, and idempotency on both sides",
            Polling: "Simpler — client controls retry timing",
          },
          {
            aspect: "Firewall friendliness",
            Webhooks: "Sender must reach a public URL",
            Polling: "Client initiates outbound, works behind a firewall",
          },
          {
            aspect: "Delivery guarantee",
            Webhooks: "At-least-once with retries; duplicates possible",
            Polling: "Client-driven — easy to reason about",
          },
          {
            aspect: "Best for",
            Webhooks: "Event notifications, integrations, payments",
            Polling: "Clients behind firewalls or without a public endpoint",
          },
        ],
      },
      {
        type: "text",
        heading: "The Ordering Problem",
        content:
          "Webhooks do not guarantee ordering. Retries, parallel delivery workers, and network jitter mean event B can arrive before event A. Systems that assume ordering break: a subscription.updated arriving before subscription.created leaves the receiver with an update for a record it does not have.\n\nTwo standard fixes: carry a monotonically increasing sequence number and have receivers ignore events older than the last applied one, or make each event independently reconstruct state (send full snapshots rather than deltas). Stripe recommends fetching the current object from the API when processing a webhook, treating the webhook purely as a signal that something changed.",
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Never Trust an Unsigned Webhook",
        content:
          "An open webhook endpoint is a public write path into your system. Without signature verification, anyone who learns your URL can forge events — creating fake payments, fake refunds, or fake deployments. Always verify the HMAC signature over the raw bytes, always check the timestamp to prevent replay, and never parse the body before verification, because re-serializing JSON changes the bytes and breaks the signature.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Webhooks push events to a client-registered URL instead of being polled",
          "Sign the raw payload with an HMAC and a timestamp; verify in constant time",
          "Delivery is at-least-once — receivers must be idempotent using a stable event ID",
          "Acknowledge with 2xx immediately and process the event asynchronously",
          "Retry 5xx and 429 with backoff and jitter, but do not retry other 4xx responses",
          "Do not assume ordering — use sequence numbers or refresh state from the API",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why must a webhook receiver verify a signature over the RAW request body?",
        options: [
          "Raw bodies are smaller",
          "Re-serializing parsed JSON changes the bytes, so a signature computed over the original bytes will not match",
          "Only raw bodies support UTF-8",
          "It makes processing faster",
        ],
        correctIndex: 1,
        explanation:
          "The sender signs the exact bytes it transmitted. If the receiver parses JSON and re-stringifies it before verifying, key order, whitespace, and number formatting may change, producing different bytes and a failing signature. This is why frameworks must be configured to capture the raw body for webhook routes.",
      },
      {
        question:
          "A provider retries a webhook because it did not receive your 200 in time, so you receive the same event twice. What should happen?",
        options: [
          "Process it twice — duplicates are harmless",
          "Reject the second delivery with a 400",
          "Detect the repeated event ID and ignore the duplicate, processing the event exactly once",
          "Disable retries on the provider",
        ],
        correctIndex: 2,
        explanation:
          "At-least-once delivery means duplicates are normal, not exceptional. Receivers store processed event IDs and skip ones they have already handled, making the operation idempotent. Relying on the provider to never retry, or processing twice, both cause incorrect results such as double fulfillment.",
      },
      {
        question:
          "Why is webhook ordering not guaranteed, and what is a safe mitigation?",
        options: [
          "Ordering is guaranteed if you use HTTPS",
          "Retries and parallel workers can reorder events; carry a sequence number or refresh the object from the API",
          "Ordering only breaks for GET requests",
          "Ordering is guaranteed as long as the receiver replies quickly",
        ],
        correctIndex: 1,
        explanation:
          "Network jitter, concurrent delivery workers, and retries with backoff can deliver newer events before older ones. Since ordering is not guaranteed, receivers should either ignore events older than the last applied sequence number or treat the webhook only as a signal and re-fetch authoritative state from the API.",
      },
    ],
  },

  "api-gateway": {
    slug: "api-gateway",
    title: "API Gateway & BFF",
    tagline: "Central entry points and backend-for-frontend",
    sections: [
      {
        type: "text",
        heading: "What an API Gateway Is",
        content:
          "An API gateway is a single entry point that sits in front of many backend services and handles the concerns that would otherwise be duplicated in every service: routing, authentication, rate limiting, request validation, and observability.\n\nRather than exposing dozens of microservices directly, clients call one gateway. It terminates TLS, verifies tokens, applies quotas, and forwards requests to the right upstream. This centralization means cross-cutting features are implemented once, not reimplemented in every service in every language.",
      },
      {
        type: "analogy",
        heading: "The Hotel Front Desk",
        content:
          "Guests do not wander into the kitchen, the laundry, or the engineering room. They talk to the front desk, which knows who everyone is (authentication), how many requests each guest may make (rate limiting), which department handles each need (routing), and how to translate a request into the right action.\n\nA hotel front desk is an API gateway. It is not where the work happens — it is the single, controlled interface through which all work is requested, and it enforces the rules of the building.",
      },
      {
        type: "comparison",
        heading: "Reverse Proxy vs Load Balancer vs API Gateway",
        headers: ["Reverse Proxy", "Load Balancer", "API Gateway"],
        rows: [
          {
            aspect: "Primary job",
            "Reverse Proxy":
              "Forward requests to backends, terminate TLS, cache",
            "Load Balancer": "Distribute traffic across identical instances",
            "API Gateway": "Full API management layer in front of services",
          },
          {
            aspect: "Routing logic",
            "Reverse Proxy": "Path or host based",
            "Load Balancer": "Health and algorithm based",
            "API Gateway": "Path, method, header, and version aware",
          },
          {
            aspect: "Authentication",
            "Reverse Proxy": "Sometimes TLS client certs",
            "Load Balancer": "No",
            "API Gateway": "Yes — JWT, API keys, OAuth",
          },
          {
            aspect: "Rate limiting",
            "Reverse Proxy": "Basic",
            "Load Balancer": "No",
            "API Gateway": "Yes — per key, per route, per plan",
          },
          {
            aspect: "Request transformation",
            "Reverse Proxy": "Headers only",
            "Load Balancer": "No",
            "API Gateway": "Yes — rewrite, aggregate, validate",
          },
          {
            aspect: "Best for",
            "Reverse Proxy": "TLS, static serving, simple proxying",
            "Load Balancer": "Horizontal scale behind one endpoint",
            "API Gateway": "Public APIs, microservices, monetization",
          },
        ],
      },
      {
        type: "steps",
        heading: "Responsibilities a Gateway Centralizes",
        steps: [
          {
            title: "TLS termination and edge security",
            detail:
              "One place to manage certificates, enforce HTTPS, and add security headers such as HSTS, rather than in every service.",
          },
          {
            title: "Authentication and authorization",
            detail:
              "Verify JWTs or API keys at the edge so backend services receive only trusted, identified requests and can assume the caller identity is validated.",
          },
          {
            title: "Rate limiting and quotas",
            detail:
              "Enforce per-key and per-plan limits centrally. Stripe, GitHub, and Twilio all publish per-minute and per-hour API quotas enforced at this layer.",
          },
          {
            title: "Routing and versioning",
            detail:
              "Map /v2/orders to the correct upstream and the correct version, so service changes do not require client changes.",
          },
          {
            title: "Observability",
            detail:
              "Emit consistent request logs, metrics, and traces with a correlation ID at the boundary, so one request can be followed across every downstream service.",
          },
        ],
      },
      {
        type: "code",
        heading: "A Declarative Gateway Config",
        language: "yaml",
        label: "kong.yaml",
        code: `_format_version: '3.0'
services:
  - name: orders-api
    url: http://orders.internal:8081
    routes:
      - name: orders
        paths: [/v1/orders]
    plugins:
      - name: rate-limiting
        config: { minute: 600, policy: redis }
      - name: jwt
  - name: users-api
    url: http://users.internal:8082
    routes:
      - name: users
        paths: [/v1/users]
    plugins:
      - name: key-auth
      - name: request-validator    # validates against the service OpenAPI spec`,
      },
      {
        type: "text",
        heading: "The Backend-for-Frontend Pattern",
        content:
          "As clients multiply — web, iOS, Android, partner API — a single general-purpose gateway becomes awkward. The mobile app needs a compact home-screen payload; the web app needs more fields; the partner wants something else entirely. If one API serves all of them, it over-fetches for some and under-fetches for others.\n\nThe Backend-for-Frontend (BFF) pattern introduces a thin, client-specific service per frontend. Each BFF aggregates calls to the shared downstream microservices and shapes the response exactly for its client. Netflix popularized this pattern: a separate BFF for each device class (TV, mobile, web) sits between the client and the shared streaming, recommendation, and metadata services.",
      },
      {
        type: "code",
        heading: "A Backend-for-Frontend Endpoint",
        language: "typescript",
        label: "bff.ts",
        code: `// Mobile BFF — aggregates downstream services into one screen-shaped response
app.get('/bff/mobile/home', async (req, res) => {
  const userId = req.user.id;

  // Fan out to upstream microservices in parallel
  const [profile, orders, recommendations] = await Promise.all([
    calls.users.get(\`/users/\${userId}\`),
    calls.orders.get(\`/orders?userId=\${userId}&limit=3\`),
    calls.recs.get(\`/recommendations?userId=\${userId}&limit=10\`),
  ]);

  // Shape the payload exactly for the mobile Home screen — no over-fetching
  res.json({
    greeting: 'Welcome back, ' + profile.name.split(' ')[0],
    recentOrders: orders.data.map((o: any) => ({ id: o.id, total: o.totalFormatted })),
    recommendations: recommendations.items.map((r: any) => ({ id: r.id, title: r.title, image: r.thumb })),
  });
});`,
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "Gateway and BFF in Practice",
        content:
          "Netflix runs a BFF per device class so each client gets a payload tailored to its screen and bandwidth. Amazon runs API Gateway in front of thousands of internal services; AWS API Gateway, Apigee, and Kong are the common managed or self-hosted choices. The Google Front End (GFE) is the single external entry point for all Google services, handling TLS, load balancing, and DDoS protection. The pattern is consistent: one hardened edge in front of many internal services, with client-specific aggregation layers where clients diverge.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "An API gateway is a single entry point for routing, auth, rate limiting, and observability",
          "It centralizes cross-cutting concerns so services do not reimplement them in every language",
          "A gateway is more than a reverse proxy or load balancer — it is an API management layer",
          "The BFF pattern adds a client-specific aggregation service per frontend",
          "BFFs shape responses per client, avoiding over-fetching and under-fetching",
          "Keep the gateway thin on business logic; put domain logic in the services behind it",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What distinguishes an API gateway from a plain reverse proxy?",
        options: [
          "It is faster",
          "It adds API management concerns — authentication, rate limiting, request validation, and version-aware routing",
          "It only works with gRPC",
          "It removes the need for load balancing",
        ],
        correctIndex: 1,
        explanation:
          "A reverse proxy mainly forwards requests and terminates TLS. An API gateway adds an API management layer on top: token and key verification, per-plan rate limiting, request validation against a spec, and version-aware routing. Those cross-cutting concerns are implemented once at the edge instead of in every service.",
      },
      {
        question:
          "Why introduce a Backend-for-Frontend instead of one API for all clients?",
        options: [
          "BFFs remove the need for a gateway",
          "Each client has different data and payload needs, so a per-client aggregation layer avoids over-fetching and under-fetching",
          "BFFs make databases faster",
          "BFFs eliminate authentication",
        ],
        correctIndex: 1,
        explanation:
          "Web, mobile, and partner clients need different shapes and volumes of data. One shared API either sends too much to mobile or too little to web. A BFF per client fans out to the same downstream services but shapes the response precisely for its client, improving bandwidth and frontend iteration speed.",
      },
      {
        question: "Where should domain business logic live?",
        options: [
          "In the API gateway, so it runs once",
          "In the backend services, keeping the gateway thin and focused on cross-cutting concerns",
          "In the BFF only",
          "In the client application",
        ],
        correctIndex: 1,
        explanation:
          "The gateway and BFF are edge components handling routing, auth, rate limiting, and response shaping. Embedding domain logic there creates a new monolith at the edge, hurts independent deployability, and couples business rules to infrastructure. Domain logic belongs in the services that own the data.",
      },
    ],
  },

  "grpc-streaming": {
    slug: "grpc-streaming",
    title: "gRPC Streaming & Interceptors",
    tagline: "Server, client, and bidirectional streaming in gRPC",
    sections: [
      {
        type: "text",
        heading: "gRPC Beyond Unary Calls",
        content:
          "gRPC is a high-performance RPC framework that runs over HTTP/2 and uses Protocol Buffers for serialization. Most people know it for simple request-response calls, but HTTP/2 supports full multiplexing, and gRPC exploits that to offer three streaming modes in addition to unary calls: server streaming, client streaming, and bidirectional streaming.\n\nStreaming matters when a single call must carry many messages: live feeds, telemetry uploads, progress updates, or chat. Instead of polling or opening many connections, one gRPC stream carries a continuous flow of messages in one or both directions.",
      },
      {
        type: "analogy",
        heading: "Phone Call vs Conference Line",
        content:
          "A unary RPC is like a single question and answer. A server-streaming RPC is like calling a support line that keeps talking and sending you updates as events happen — you asked once, they keep delivering.\n\nClient streaming is the reverse: you send a long dictation and receive one summary at the end. Bidirectional streaming is a conference call where both sides talk continuously at once — like a live interpreter, messages flowing both ways in real time over the same connection.",
      },
      {
        type: "code",
        heading: "Defining the Four RPC Types",
        language: "protobuf",
        label: "feed.proto",
        code: `syntax = "proto3";
package feed.v1;

service FeedService {
  rpc GetFeed(FeedRequest) returns (FeedResponse);           // unary
  rpc StreamFeed(FeedRequest) returns (stream FeedEvent);    // server streaming
  rpc UploadMetrics(stream Metric) returns (UploadSummary);  // client streaming
  rpc Chat(stream ChatMessage) returns (stream ChatMessage); // bidirectional
}

message FeedRequest  { string user_id = 1; int32 limit = 2; }
message FeedResponse { repeated FeedEvent events = 1; }
message FeedEvent    { string id = 1; string type = 2; int64 ts = 3; }
message Metric       { string name = 1; double value = 2; }
message UploadSummary{ int32 received = 1; }
message ChatMessage  { string sender = 1; string text = 2; }`,
      },
      {
        type: "code",
        heading: "Server Streaming in Node.js",
        language: "typescript",
        label: "server-stream.ts",
        code: `import * as grpc from '@grpc/grpc-js';

// Server streaming: write zero or more messages, then end the stream
function streamFeed(call: grpc.ServerWritableStream<FeedRequest, FeedEvent>) {
  const { limit } = call.request;
  let sent = 0;

  const interval = setInterval(() => {
    if (sent >= limit) {
      clearInterval(interval);
      call.end();             // signals completion to the client
      return;
    }
    call.write({ id: \`evt_\${Date.now()}\`, type: 'like', ts: Date.now() });
    sent++;
  }, 100);

  // Clean up if the client cancels or disconnects mid-stream
  call.on('cancelled', () => clearInterval(interval));
}

server.addService(FeedServiceService, { streamFeed });`,
      },
      {
        type: "code",
        heading: "Interceptors for Cross-Cutting Concerns",
        language: "typescript",
        label: "interceptor.ts",
        code: `import * as grpc from '@grpc/grpc-js';

// An interceptor wraps every call — like HTTP middleware for gRPC.
// Use it for auth, metrics, tracing, and deadlines across all methods.
const authInterceptor: grpc.ServerInterceptor = (options, nextCall) => {
  return new grpc.InterceptingCall(nextCall(options), {
    start(metadata, listener, next) {
      listener.onReceiveMetadata(() => {
        const token = metadata.get('authorization')[0];
        if (!token) {
          throw { code: grpc.status.UNAUTHENTICATED, message: 'Missing authorization' };
        }
        // validate the token, attach identity for handlers...
      });
      next(metadata, listener);
    },
  });
};

const server = new grpc.Server({
  interceptors: [authInterceptor, metricsInterceptor, tracingInterceptor],
});`,
      },
      {
        type: "comparison",
        heading: "The Four RPC Types",
        headers: [
          "Unary",
          "Server Streaming",
          "Client Streaming",
          "Bidirectional",
        ],
        rows: [
          {
            aspect: "Requests",
            Unary: "Exactly one",
            "Server Streaming": "One",
            "Client Streaming": "Many",
            Bidirectional: "Many",
          },
          {
            aspect: "Responses",
            Unary: "Exactly one",
            "Server Streaming": "Many",
            "Client Streaming": "One",
            Bidirectional: "Many",
          },
          {
            aspect: "Typical use",
            Unary: "Lookups and commands",
            "Server Streaming": "Live feeds, progress, large downloads",
            "Client Streaming": "Telemetry upload, bulk ingest",
            Bidirectional: "Chat, real-time collaboration",
          },
          {
            aspect: "Backpressure",
            Unary: "N/A",
            "Server Streaming": "HTTP/2 flow control plus explicit pull",
            "Client Streaming": "Sender-driven",
            Bidirectional: "Both directions via HTTP/2 windows",
          },
          {
            aspect: "Cancellation",
            Unary: "Deadline",
            "Server Streaming": "Client cancels the stream",
            "Client Streaming": "Client half-closes",
            Bidirectional: "Either side closes",
          },
        ],
      },
      {
        type: "text",
        heading: "Deadlines, Cancellation, and Backpressure",
        content:
          "gRPC deadlines propagate through the call chain: if the client sets a 500ms deadline, every downstream hop inherits the remaining time and cancels work when it expires, preventing runaway requests. Always set deadlines; a call without one can hang indefinitely.\n\nStreaming also has backpressure. HTTP/2 flow-control windows cap how much unacknowledged data a stream can hold. If a producer writes faster than the network drains, call.write returns false and you should pause until the drain event fires. Ignoring backpressure buffers unbounded data in memory and eventually crashes the server. Server-streaming handlers should also listen for cancellation so they stop doing work nobody will receive.",
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "Interceptors Are gRPC Middleware",
        content:
          "Interceptors are how gRPC implements the middleware pattern that HTTP frameworks have: they wrap every inbound or outbound call. Companies use them consistently for authentication (validate the token and inject identity into metadata), observability (record latency and status per method, propagate trace IDs), and resilience (enforce deadlines and retries). Google, Netflix, and Uber all standardize on interceptors so every service gets auth and tracing automatically rather than each team wiring it by hand.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "gRPC runs over HTTP/2 and Protobuf, and supports four RPC types beyond unary",
          "Server streaming sends many responses to one request — live feeds and progress updates",
          "Client streaming sends many requests and receives one summary — bulk uploads",
          "Bidirectional streaming flows both ways simultaneously — chat and collaboration",
          "Interceptors wrap every call, ideal for auth, tracing, and metrics",
          "Set deadlines and honor backpressure and cancellation; never buffer streams unbounded",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Which gRPC streaming mode fits uploading thousands of telemetry points and receiving a single summary?",
        options: [
          "Unary",
          "Server streaming",
          "Client streaming",
          "Bidirectional streaming",
        ],
        correctIndex: 2,
        explanation:
          "Client streaming sends many messages from client to server and returns one response at the end. That maps exactly to uploading a batch of telemetry and receiving a single acknowledgement or summary. Server streaming is the reverse; bidirectional flows both ways at once.",
      },
      {
        question: "What is the purpose of a gRPC interceptor?",
        options: [
          "To compress messages",
          "To wrap every call so cross-cutting concerns like auth, metrics, and tracing are applied consistently",
          "To define the Protobuf schema",
          "To replace HTTP/2",
        ],
        correctIndex: 1,
        explanation:
          "Interceptors are the gRPC equivalent of HTTP middleware. They wrap inbound and outbound calls so a single implementation can enforce authentication, record per-method metrics, propagate tracing, or apply deadlines across every method, rather than each service wiring it manually.",
      },
      {
        question: "Why set a deadline on every gRPC call?",
        options: [
          "Deadlines improve serialization speed",
          "A deadline propagates through the call chain and cancels work when time runs out, preventing calls from hanging forever",
          "Deadlines are required by Protobuf",
          "Deadlines increase throughput",
        ],
        correctIndex: 1,
        explanation:
          "A gRPC deadline flows downstream so each hop knows the remaining budget and cancels when it expires. Without a deadline a call — and the work behind it across services — can hang indefinitely during a downstream slowdown, tying up resources. Deadlines are the standard defense against cascading latency.",
      },
    ],
  },

  idempotency: {
    slug: "idempotency",
    title: "Idempotency & Safe Retries",
    tagline: "Designing operations that survive retries and duplicates",
    sections: [
      {
        type: "text",
        heading: "Why Retries Break Things",
        content:
          "In a distributed system, a request can succeed while its response is lost. The client sees a timeout, assumes failure, and retries — but the first attempt already created the order, charged the card, or sent the email. Retrying naively duplicates the side effect.\n\nThis happens constantly: mobile networks drop responses, load balancers time out slow requests, SDKs retry automatically on connection errors, and message queues redeliver on acknowledgement failure. Idempotency is the property that lets a client retry safely, because applying the same operation twice produces the same result as applying it once.",
      },
      {
        type: "analogy",
        heading: "The Elevator Button",
        content:
          "Press an elevator call button once or ten times and the elevator still arrives once. The button is idempotent — the tenth press adds nothing.\n\nA light switch is idempotent in a different way: you set it to a state (on or off) rather than toggling relative to its current state. Pressing it twice leaves it on, not back off. A toggle button, by contrast, is not idempotent — each press flips the state, so an accidental re-press breaks the intent. Good API design makes write operations behave like the state-setting switch, not the toggle.",
      },
      {
        type: "comparison",
        heading: "Method Idempotency",
        headers: ["Safe", "Idempotent", "Retryable"],
        rows: [
          {
            aspect: "GET",
            Safe: "Yes",
            Idempotent: "Yes",
            Retryable: "Yes — freely",
          },
          {
            aspect: "HEAD",
            Safe: "Yes",
            Idempotent: "Yes",
            Retryable: "Yes — freely",
          },
          {
            aspect: "PUT",
            Safe: "No",
            Idempotent: "Yes",
            Retryable: "Yes — with the same body",
          },
          {
            aspect: "DELETE",
            Safe: "No",
            Idempotent: "Yes",
            Retryable: "Yes — deleting again is a no-op",
          },
          {
            aspect: "POST",
            Safe: "No",
            Idempotent: "No",
            Retryable: "Only with an idempotency key",
          },
          {
            aspect: "PATCH",
            Safe: "No",
            Idempotent: "Not guaranteed",
            Retryable: "Depends on the patch semantics",
          },
        ],
      },
      {
        type: "text",
        heading: "Concurrency and Race Conditions",
        content:
          "Idempotency keys must be claimed **atomically**. Two identical requests arriving at the same instant can both check the key store, both find nothing, and both proceed — a classic race condition producing a double charge. Reading and then writing are two operations, and another request can interleave between them.\n\nThe fix is an atomic claim: an insert that only succeeds if the key does not already exist (a unique constraint, or Redis SET with NX). The first request wins the claim and owns execution; the second sees the key is taken, waits for or replays the stored response, and never executes the side effect. This is the single most important detail in a correct idempotency implementation.",
      },
      {
        type: "code",
        heading: "Server-Side Idempotency Guard",
        language: "typescript",
        label: "idempotency.ts",
        code: `app.post('/api/v1/payments', async (req, res) => {
  const key = req.header('Idempotency-Key');
  if (!key) return res.status(400).json({ error: 'Idempotency-Key required' });

  // 1. Atomically claim the key. NX = only set if it does not already exist.
  const claimed = await redis.set(\`idem:KEY:\${key}\`, 'processing', 'NX', 'EX', 86400);

  if (!claimed) {
    // 2a. A previous request owns this key. If it finished, replay its response.
    const record = await db.idempotency.findUnique({ where: { key } });
    if (record?.status === 'done') {
      return res.status(record.statusCode).json(record.responseBody);
    }
    // 2b. Still in flight -> tell the client to retry shortly.
    return res.status(409).json({ error: 'Request in progress' });
  }

  try {
    // 3. Execute the side effect exactly once.
    const charge = await stripe.paymentIntents.create(
      { amount: req.body.amount, currency: 'usd' },
      { idempotencyKey: key },   // the provider deduplicates too
    );

    const body = { paymentId: charge.id, status: charge.status };
    await db.idempotency.create({
      data: { key, statusCode: 201, responseBody: body, status: 'done' },
    });
    res.status(201).json(body);
  } catch {
    // 4. On failure, release the key so a retry may legitimately try again.
    await redis.del(\`idem:KEY:\${key}\`);
    res.status(500).json({ error: 'Payment failed' });
  }
});`,
      },
      {
        type: "steps",
        heading: "Designing for Safe Retries",
        steps: [
          {
            title: "Let clients supply a key",
            detail:
              "Accept an Idempotency-Key header (Stripe, Square, and PayPal all use this header). The client generates one UUID per logical operation, not per HTTP attempt, and reuses it across retries.",
          },
          {
            title: "Claim the key atomically",
            detail:
              "Insert with a unique constraint or Redis SET NX. The winning request proceeds; concurrent duplicates do not.",
          },
          {
            title: "Store the result, not just the flag",
            detail:
              "Persist the status code and response body. On a duplicate, replay the exact original response so the client cannot tell the difference between the first call and a retry.",
          },
          {
            title: "Lock while in flight",
            detail:
              "A duplicate arriving during processing should get a 409 or be blocked until the original completes — never execute the side effect twice.",
          },
          {
            title: "Expire keys deliberately",
            detail:
              "Keys are scoped to the account or API key and expire after a window (Stripe uses 24 hours). Expire too soon and a late retry duplicates; expire too late and storage grows unbounded.",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Idempotency Is Not Free of Ordering Traps",
        content:
          "A subtle failure: the first request is claimed, then the server crashes before completing. The key is stuck in the processing state. If you treat any existing key as done, you will replay an empty response and the client loses its payment record. Store a state machine (claimed to done or failed), set a lease timeout on the processing state, and on failure either release the key or persist a definitive failed result. Also make sure keys are scoped per API key or account — a globally shared key space lets one client collide with another.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Lost responses cause clients to retry operations that may have already succeeded",
          "Idempotency means applying an operation twice equals applying it once",
          "GET, HEAD, PUT, and DELETE are idempotent; POST is not by default",
          "Use an Idempotency-Key header so clients can retry safely",
          "Claim the key atomically — atomic insert or SET NX — to defeat race conditions",
          "Store and replay the original response, and scope and expire keys deliberately",
        ],
      },
    ],
    quiz: [
      {
        question: "Why is POST considered non-idempotent by default?",
        options: [
          "POST cannot carry a request body",
          "Each POST typically creates a new resource, so sending it twice creates two resources",
          "POST is always cached",
          "POST does not support status codes",
        ],
        correctIndex: 1,
        explanation:
          "A POST to a collection usually creates a new resource each time, so replaying it produces a second resource. PUT, by contrast, replaces a resource at a known URL, so repeating it with the same body yields the same final state. This is why payment-like POSTs use an idempotency key to become safely retryable.",
      },
      {
        question: "Why must an idempotency key be claimed atomically?",
        options: [
          "Atomic operations are faster",
          "Two identical requests can both read the key store, both see nothing, and both execute — an atomic claim (unique insert or SET NX) lets only one win",
          "It reduces storage costs",
          "It is required by HTTP",
        ],
        correctIndex: 1,
        explanation:
          "A read-then-write check is a race: two concurrent requests can both read an empty key store and both proceed to charge the card. An atomic claim — a unique constraint or Redis SET with NX — makes exactly one request the owner while the other observes the key is taken. This is the core of correct idempotency.",
      },
      {
        question:
          "What should the server return when a duplicate request arrives with a key whose original operation already completed?",
        options: [
          "201 Created with a brand new resource",
          "A 500 error",
          "The same status code and response body as the original request",
          "204 No Content always",
        ],
        correctIndex: 2,
        explanation:
          "The stored result is replayed so the client cannot distinguish a retry from the original call. Returning a new resource would duplicate the side effect; a 500 would mislead the client into retrying again. Replaying the original status code and body makes the retry transparent and safe.",
      },
    ],
  },
};

export default TOPIC_CONTENT_PART4;

