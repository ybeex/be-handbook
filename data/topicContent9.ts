// Part 9: Testing, reliability engineering, and resilience topics

import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_PART9: Record<string, TopicContent> = {
  // ─── TESTING ────────────────────────────────────────────────────────────

  "testing-fundamentals": {
    slug: "testing-fundamentals",
    title: "Testing Fundamentals",
    tagline: "The test pyramid, test doubles, and deterministic tests",
    sections: [
      {
        type: "text",
        heading: "Why Tests Exist",
        content:
          'A test suite is not a checkbox for code review — it is an executable specification that lets you change code without fear. A test that catches a regression in production costs seconds to write and saves an incident; a test that only proves the author remembered the code they just wrote is theatre. The goal is confidence to refactor, not a coverage number.\n\nThe productive question is never "do we have tests" but "which tests give the strongest signal per unit of maintenance cost, and where is the highest-value place to put the next one".',
      },
      {
        type: "text",
        heading: "The Test Pyramid",
        content:
          "The pyramid, popularised by Mike Cohn, puts many fast unit tests at the base, fewer integration tests in the middle, and a handful of end-to-end tests at the top. Unit tests run in milliseconds and localise failures precisely; integration tests verify that components and real dependencies agree; end-to-end tests exercise the whole system through a user-visible surface.\n\nThe shape is a cost curve. Each layer up is slower, flakier, and more expensive to maintain, so you want fewer of them. Inverting the pyramid — a thick band of brittle e2e tests — produces a suite that takes an hour, fails intermittently, and nobody trusts.",
      },
      {
        type: "analogy",
        heading: "The Ice Cream Cone Anti-Pattern",
        content:
          "An ice cream cone is the pyramid flipped: a tiny scoop of unit tests on top of an enormous base of end-to-end tests. It is the most common shape in immature codebases because e2e tests feel like they verify everything.\n\nWhat actually happens is predictable. The suite takes 40 minutes to run, so people stop running it locally. Failures point at a symptom far from the cause, so debugging takes an hour. Two tests are flaky, so the team re-runs the pipeline until green. The suite stops being a safety net and becomes a tax.",
      },
      {
        type: "text",
        heading: "The Testing Trophy",
        content:
          "Kent C. Dodds proposed a competing shape for frontend and application code: a wide band of integration tests in the middle, with unit tests and static analysis below and a small number of e2e tests above. The argument is that integration tests — hitting a real HTTP handler and a real database — catch the majority of bugs that actually occur, because most bugs live in the wiring between components rather than in a single pure function.\n\nThe letter of this book does not matter; the principle does. Write the cheapest tests that would actually catch the class of bug you are worried about, and let the shape follow from your system, not dogma.",
      },
      {
        type: "comparison",
        heading: "Unit vs Integration vs End-to-End",
        headers: ["Unit", "Integration", "End-to-End"],
        rows: [
          {
            aspect: "Scope",
            Unit: "One function or class, dependencies replaced",
            Integration: "Several real components plus real infrastructure",
            "End-to-End": "The entire deployed system from the user surface",
          },
          {
            aspect: "Speed",
            Unit: "Milliseconds",
            Integration: "Hundreds of milliseconds to seconds",
            "End-to-End": "Seconds to minutes",
          },
          {
            aspect: "Confidence per test",
            Unit: "High for logic, low for wiring",
            Integration: "High for wiring and queries",
            "End-to-End": "Highest, but fewest failures localised",
          },
          {
            aspect: "Flakiness",
            Unit: "Almost never, if deterministic",
            Integration: "Occasionally, if not isolated",
            "End-to-End": "Frequently, due to timing and environment",
          },
          {
            aspect: "Typical share",
            Unit: "About 70%",
            Integration: "About 20%",
            "End-to-End": "About 10%",
          },
        ],
      },
      {
        type: "text",
        heading: "Arrange, Act, Assert",
        content:
          "Almost every good test has three phases. Arrange sets up the world: build the object under test, insert fixture rows, configure a fake. Act performs the single behaviour being verified. Assert checks the outcome.\n\nKeeping these phases distinct — often with a blank line between them — makes intent obvious. Two common smells are multiple Act phases in one test (you are testing two things, split it) and no Assert at all (you forgot what the test proves). One behaviour per test means one precise reason to fail.",
      },
      {
        type: "code",
        heading: "A Well-Structured Unit Test",
        language: "typescript",
        label: "discount.spec.ts",
        code: `import { describe, it, expect } from 'vitest';
import { applyDiscount } from './pricing';

describe('applyDiscount', () => {
  it('caps the discount at 50 percent of the subtotal', () => {
    // Arrange
    const subtotal = 100;

    // Act
    const result = applyDiscount(subtotal, 0.8);

    // Assert
    expect(result).toBe(50);
  });

  it('throws on a negative subtotal', () => {
    expect(() => applyDiscount(-1, 0.1)).toThrow('subtotal must be non-negative');
  });
});`,
      },
      {
        type: "text",
        heading: "Test Doubles: Mocks, Stubs, Spies, Fakes",
        content:
          'A test double stands in for a real dependency. They are not interchangeable, and using the right one changes what the test proves.\n\nA stub returns canned answers ("this call returns 42"). A spy wraps a real or fake object and records how it was called so you can assert on the interaction. A mock is pre-programmed with expectations and fails if they are not met. A fake is a working but simplified implementation — an in-memory repository instead of a real database. Fakes are usually the strongest choice because they preserve real behaviour without the infrastructure cost.',
      },
      {
        type: "code",
        heading: "A Fake Repository Beats a Mock",
        language: "typescript",
        label: "fake-repo.spec.ts",
        code: `interface UserRepo {
  save(user: { id: string; email: string }): Promise<void>;
  findById(id: string): Promise<{ id: string; email: string } | null>;
}

class InMemoryUserRepo implements UserRepo {
  private users = new Map<string, { id: string; email: string }>();
  async save(user: { id: string; email: string }): Promise<void> {
    this.users.set(user.id, user);
  }
  async findById(id: string): Promise<{ id: string; email: string } | null> {
    return this.users.get(id) ?? null;
  }
}

it('persists a created user and reads it back', async () => {
  const repo = new InMemoryUserRepo();
  await repo.save({ id: 'u1', email: 'a@acme.dev' });
  expect(await repo.findById('u1')).toEqual({ id: 'u1', email: 'a@acme.dev' });
});`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Over-Mocking Tests Nothing",
        content:
          "If you mock every collaborator, the test only verifies that you called the mocks in an order you also wrote in the test. Change the implementation, the test breaks; change nothing meaningful and it still passes. Mocking is appropriate at genuine boundaries — third-party APIs, clocks, randomness, payment gateways — not between your own classes. Prefer real objects and fakes for anything you own.",
      },
      {
        type: "text",
        heading: "Test-Driven Development",
        content:
          "TDD is a short loop: write a failing test (red), make it pass with the simplest code (green), then clean up duplication (refactor). The test is written first, so it cannot accidentally encode the implementation — you are forced to think about the interface and behaviour before the mechanics.\n\nThe benefit is not the tests themselves, it is the design pressure. Writing the caller before the callee pushes you toward small, testable units. TDD is a tool, not a religion; use it where the design is uncertain, and write tests after where it is obvious.",
      },
      {
        type: "steps",
        heading: "The Red-Green-Refactor Loop",
        steps: [
          {
            title: "Red",
            detail:
              "Write the smallest failing test that describes the next behavior. Run it and confirm it fails for the right reason.",
          },
          {
            title: "Green",
            detail:
              "Write the minimum code that makes the test pass. Resist building more than the test demands.",
          },
          {
            title: "Refactor",
            detail:
              "With the test green, remove duplication and improve names. The suite guarantees you did not break behaviour.",
          },
          {
            title: "Repeat",
            detail:
              "Take the next small step. Keep each cycle under a few minutes.",
          },
        ],
      },
      {
        type: "comparison",
        heading: "Test Double Cheat Sheet",
        headers: ["Stub", "Spy", "Mock", "Fake"],
        rows: [
          {
            aspect: "What it does",
            Stub: "Returns canned values",
            Spy: "Records calls for later assertion",
            Mock: "Has pre-set expectations, fails if unmet",
            Fake: "A working simplified implementation",
          },
          {
            aspect: "Assertion style",
            Stub: "Assert on the result of the unit",
            Spy: "Assert that a method was called",
            Mock: "Expectation set before the act",
            Fake: "Assert on the resulting state",
          },
          {
            aspect: "Fragility",
            Stub: "Low",
            Spy: "Medium",
            Mock: "High",
            Fake: "Low",
          },
          {
            aspect: "Best for",
            Stub: "Forcing a branch or error",
            Spy: "Verifying an external side effect",
            Mock: "Strict interaction contracts",
            Fake: "Databases, queues, and stores",
          },
        ],
      },
      {
        type: "text",
        heading: "Coverage Is a Diagnostic, Not a Goal",
        content:
          "Line coverage tells you which lines executed, not which lines were checked, and certainly not which edge cases were tested. A test can execute every line of a function while asserting almost nothing. Chasing 100% coverage produces assertion-free tests written to satisfy a badge.\n\nCoverage is useful as a map of the untested, and as a ratchet to stop the number slipping. Treat a sudden drop as a signal to look, not as a failure of policy. The metric that matters is mutation score — do the tests actually fail when you break the code — which tools like Stryker measure directly.",
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Flaky Tests Destroy Trust",
        content:
          "A flaky test passes and fails on identical code. The first response is a re-run; soon re-runs are routine; then the team ignores red builds altogether, including the real failures. Flakiness comes from shared state between tests, dependence on wall-clock time, real network calls, unawaited async work, and port or resource collisions in parallel runs. Quarantine a flaky test the day you find it, fix or delete it within a week, and never let it stay green-by-retry.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Tests are an executable specification; the goal is confidence to refactor, not a coverage number",
          "The pyramid keeps fast unit tests numerous and slow e2e tests rare; the inverted cone is an anti-pattern",
          "Arrange, Act, Assert with one behaviour per test makes failures precise",
          "Prefer fakes for dependencies you own; reserve mocks for genuine external boundaries",
          "Over-mocking verifies your own assumptions, not your behaviour",
          "TDD is a design tool — red, green, refactor in short cycles",
          "Coverage is a diagnostic; flaky tests must be quarantined and fixed fast",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What is the main problem with the inverted test pyramid (the ice cream cone)?",
        options: [
          "Tests run too fast",
          "A large brittle e2e layer is slow, flaky, and poorly localises failures, so trust erodes",
          "Unit tests catch too many bugs",
          "It requires no infrastructure",
        ],
        correctIndex: 1,
        explanation:
          "End-to-end tests are slow, flaky, and expensive to maintain. A thick e2e base makes the suite take tens of minutes and fail intermittently, so teams stop trusting it. The pyramid keeps fast, precise unit tests numerous and e2e tests rare.",
      },
      {
        question:
          "Which test double is a working but simplified implementation, such as an in-memory repository?",
        options: ["Stub", "Spy", "Mock", "Fake"],
        correctIndex: 3,
        explanation:
          "A fake is a real, working implementation with a lightweight substitute — an in-memory store instead of a database. It preserves real behaviour without infrastructure cost, making it stronger than a stub or mock for dependencies you own.",
      },
      {
        question: "Why is 100% line coverage a poor target?",
        options: [
          "Coverage tools are inaccurate",
          "Executing a line says nothing about whether its behaviour was actually asserted",
          "It slows down CI",
          "Only integration tests can raise coverage",
        ],
        correctIndex: 1,
        explanation:
          "Line coverage measures execution, not verification. Tests can run every line while asserting almost nothing. Mutation testing, which checks whether tests fail when code is deliberately broken, measures real test strength.",
      },
      {
        question:
          "In Arrange-Act-Assert, what does having two Act phases in one test usually indicate?",
        options: [
          "The test is faster",
          "You are testing two behaviours and should split the test",
          "The test is deterministic",
          "Coverage will be higher",
        ],
        correctIndex: 1,
        explanation:
          "One behaviour per test keeps failures precise. Two Act phases mean two behaviours are being verified at once, so a failure does not clearly indicate which one broke — split it into separate tests.",
      },
    ],
  },

  "integration-testing": {
    slug: "integration-testing",
    title: "Integration Testing",
    tagline: "Real databases, Testcontainers, and isolated parallel runs",
    sections: [
      {
        type: "text",
        heading: "What Integration Testing Proves",
        content:
          "A unit test with a mocked database proves your code calls a method named save. It does not prove the SQL is valid, the migration ran, the unique index is honoured, the transaction commits, or the ORM maps the row correctly. Integration tests run your code against the real infrastructure and catch exactly the bugs unit tests cannot see: query and schema mismatches, serialization errors, transaction and isolation mistakes, and wiring bugs between components.\n\nThe cost is complexity — you need a real database, real network behaviour, and isolation — which is why this is the layer teams under-invest in, and also the layer that catches the most production bugs per test.",
      },
      {
        type: "text",
        heading: "The Docker-Compose Approach",
        content:
          "The oldest approach is a docker-compose file that brings up Postgres, Redis, and any other dependency, with a healthcheck so the test runner waits until they are ready. Tests point at localhost ports and run against a dedicated test database.\n\nIt works well for local development but scales poorly: port collisions on shared CI machines, version drift between the compose file and production, and the need to tear down and reset state between runs. It remains a fine default for a single service with one or two dependencies.",
      },
      {
        type: "code",
        heading: "A Compose File for Tests",
        language: "yaml",
        label: "docker-compose.test.yaml",
        code: `services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: app_test
    ports:
      - '5433:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U test -d app_test']
      interval: 2s
      timeout: 2s
      retries: 15
  redis:
    image: redis:7-alpine
    ports:
      - '6380:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 2s
      timeout: 2s
      retries: 15`,
      },
      {
        type: "text",
        heading: "Testcontainers",
        content:
          "Testcontainers starts real dependencies as throwaway Docker containers from within the test process, then stops them when the suite ends. Instead of a hand-maintained compose file, each test suite declares the image and version it needs, and the library allocates a free port, waits for readiness, and injects the connection string.\n\nBecause each run creates its own containers, there are no shared-state collisions, versions are pinned in code next to the tests, and the same suite runs identically on a laptop and in CI. The trade-off is that Docker must be available wherever the tests run — fine on developer machines and GitHub Actions runners, less so inside a locked-down build system.",
      },
      {
        type: "code",
        heading: "Testcontainers Spins Up Postgres",
        language: "typescript",
        label: "db.integration.spec.ts",
        code: `import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { Pool } from 'pg';

let container: any;
let pool: Pool;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('app_test')
    .start();
  pool = new Pool({ connectionString: container.getConnectionUri() });
  await pool.query('CREATE TABLE users (id text PRIMARY KEY, email text UNIQUE)');
}, 60_000);

afterAll(async () => {
  await pool.end();
  await container.stop();
});

it('rejects a duplicate email at the database level', async () => {
  await pool.query('INSERT INTO users (id, email) VALUES ($1, $2)', ['u1', 'a@acme.dev']);
  await expect(
    pool.query('INSERT INTO users (id, email) VALUES ($1, $2)', ['u2', 'a@acme.dev']),
  ).rejects.toThrow(/duplicate key/);
});`,
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Never Mock What You Are Trying to Test",
        content:
          "If the bug lives in SQL, an ORM mapping, or a serialization format, a mocked driver will faithfully hide it. Integration tests exist precisely to cross those boundaries. Mock the slow, external, non-deterministic things — a payment gateway, an email provider, a third-party API — and use real instances of everything you own.",
      },
      {
        type: "text",
        heading: "Database Isolation: The Two Strategies",
        content:
          "Every integration test on a shared database must start from a known state. There are two dominant strategies, and picking the wrong one for your suite causes either slowness or mysterious cross-test failures.\n\nRollback-per-test wraps each test in a transaction and rolls it back at the end, so nothing persists. It is fast and simple but cannot test code that manages its own transactions or commits internally. Truncate-and-seed empties tables and re-inserts fixtures between tests; it is slower but works with any code path. Most mature suites use rollback for the common case and truncate for the transaction-sensitive tests.",
      },
      {
        type: "code",
        heading: "Transaction Rollback Per Test",
        language: "typescript",
        label: "rollback.ts",
        code: `import { beforeEach, afterEach } from 'vitest';

let client: any;

beforeEach(async () => {
  client = await pool.connect();
  await client.query('BEGIN');
});

afterEach(async () => {
  await client.query('ROLLBACK');   // discard everything the test wrote
  client.release();
});

// Repositories under test receive this same client so their
// queries participate in the surrounding transaction.`,
      },
      {
        type: "text",
        heading: "Fixtures and Seeding",
        content:
          "A fixture is the starting data a test needs. Two failure modes dominate. Hand-written SQL inserts duplicated across dozens of tests decay the moment a column is added — one migration makes twenty tests fail. A single enormous global fixture file couples every test to every row, so unrelated changes cascade.\n\nFactory functions that build default objects and let each test override only the fields it cares about strike the right balance. They keep tests readable, absorb schema changes in one place, and make the data each test depends on explicit.",
      },
      {
        type: "code",
        heading: "Factory Functions",
        language: "typescript",
        label: "factory.ts",
        code: `interface User { id: string; email: string; role: 'user' | 'admin'; createdAt: Date; }

let seq = 0;

export function userFactory(overrides: Partial<User> = {}): User {
  seq += 1;
  return {
    id: 'u' + seq,
    email: 'user' + seq + '@acme.dev',
    role: 'user',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

// In a test: only the field under test is stated explicitly
const admin = userFactory({ role: 'admin' });`,
      },
      {
        type: "text",
        heading: "Testing HTTP with Supertest",
        content:
          "Supertest drives your HTTP layer in-process: it boots the Express, Fastify, or Nest app and issues real HTTP requests against it without binding a port. You get full request parsing, routing, middleware, validation, and error handling, plus assertions on status, headers, and body.\n\nThis catches the bugs unit tests miss on the API surface — a missing status code, a validation error returning 500 instead of 400, or a serialization field name mismatch — while staying fast because no network stack is involved.",
      },
      {
        type: "code",
        heading: "Supertest Against a Real App",
        language: "typescript",
        label: "api.e2e.spec.ts",
        code: `import request from 'supertest';
import { app } from '../src/app';

it('creates a user and returns 201 with the new id', async () => {
  const res = await request(app)
    .post('/v1/users')
    .send({ email: 'new@acme.dev' })
    .expect(201);

  expect(res.body).toMatchObject({ email: 'new@acme.dev' });
  expect(res.body.id).toBeDefined();
});

it('rejects a malformed email with 400', async () => {
  await request(app)
    .post('/v1/users')
    .send({ email: 'not-an-email' })
    .expect(400);
});`,
      },
      {
        type: "comparison",
        heading: "Database Isolation Strategies",
        headers: ["Rollback per test", "Truncate and seed"],
        rows: [
          {
            aspect: "Speed",
            "Rollback per test": "Fast — no writes survive",
            "Truncate and seed": "Slower — full reset between tests",
          },
          {
            aspect: "State after test",
            "Rollback per test": "Unchanged",
            "Truncate and seed": "Emptied then reseeded",
          },
          {
            aspect: "Works with code that commits",
            "Rollback per test":
              "No — the commit escapes the outer transaction",
            "Truncate and seed": "Yes",
          },
          {
            aspect: "Works with code that manages its own transaction",
            "Rollback per test": "No",
            "Truncate and seed": "Yes",
          },
          {
            aspect: "Best for",
            "Rollback per test":
              "The common case — repository and service tests",
            "Truncate and seed": "Transaction-sensitive and migration tests",
          },
        ],
      },
      {
        type: "steps",
        heading: "Setting Up Isolated Parallel Tests",
        steps: [
          {
            title: "One database per worker",
            detail:
              "Give each parallel worker its own schema or database name so workers never share rows.",
          },
          {
            title: "Random free ports",
            detail:
              "Let Testcontainers or the test harness allocate ports dynamically instead of hard-coding them.",
          },
          {
            title: "Run migrations once per worker",
            detail:
              "Apply the real migration chain at startup, not a hand-written schema, so migrations are tested too.",
          },
          {
            title: "Seed within the test",
            detail:
              "Insert only the rows each test needs, using factories, and clean up or roll back after.",
          },
          {
            title: "Reset sequences and caches",
            detail:
              "Clear Redis and reset database sequences so ordering-dependent tests stay deterministic.",
          },
          {
            title: "Fail fast on readiness",
            detail:
              "Wait for container healthchecks before the first test so the suite never races startup.",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "CI Setup That Stays Fast",
        content:
          "Cache the container images in CI so pulls are instant, run integration tests in a separate job from unit tests so a slow database never blocks fast feedback, and shard the suite across runners once it exceeds a few minutes. GitHub Actions provides Docker out of the box on ubuntu runners, so Testcontainers just works. Publish a JUnit report so failures are visible per test, and treat a flaky integration test as a bug to fix the same day, not a retry.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Integration tests catch schema, SQL, transaction, and wiring bugs that mocked unit tests cannot",
          "Testcontainers gives each run its own dependency containers with pinned versions and free ports",
          "Mock external third parties; use real instances of everything you own",
          "Rollback-per-test is fast but breaks for code that commits; truncate-and-seed works everywhere",
          "Factory functions with default overrides absorb schema change better than hand-written fixtures",
          "Supertest drives the real HTTP app in-process and catches API surface bugs cheaply",
          "Isolate parallel runs with a database per worker and dynamic ports",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why use Testcontainers instead of a hand-maintained docker-compose file?",
        options: [
          "It is the only way to run Postgres",
          "Each run gets its own containers with pinned versions and dynamically allocated ports, avoiding shared-state collisions",
          "It does not require Docker",
          "It makes tests run on the network stack",
        ],
        correctIndex: 1,
        explanation:
          "Testcontainers starts dependencies from within the test process, allocating free ports and waiting for readiness. Because each run is isolated and versions live next to the tests, the suite runs identically on a laptop and in CI without port or state collisions.",
      },
      {
        question: "When does transaction rollback per test not work?",
        options: [
          "When the database is Postgres",
          "When the code under test commits or manages its own transaction, so the write escapes the outer transaction",
          "When tests run in parallel",
          "When using factory functions",
        ],
        correctIndex: 1,
        explanation:
          "Rollback works by wrapping the test in a transaction it rolls back. If the code commits internally or opens its own transaction, that work is not undone, so the test leaks state — truncate-and-seed is needed there.",
      },
      {
        question:
          "What is the main advantage of factory functions over a single global fixture file?",
        options: [
          "They run faster",
          "They let each test specify only the fields it cares about and absorb schema changes in one place",
          "They remove the need for a database",
          "They automatically roll back",
        ],
        correctIndex: 1,
        explanation:
          "Factories build a default object and accept overrides, so a test states only the relevant fields and stays readable. Schema changes are absorbed in the factory rather than in dozens of hand-written inserts.",
      },
    ],
  },

  "contract-testing": {
    slug: "contract-testing",
    title: "Contract Testing",
    tagline:
      "Consumer-driven contracts that catch breaking changes before deploy",
    sections: [
      {
        type: "text",
        heading: "The Microservices Testing Gap",
        content:
          "In a monolith, a breaking change to an internal function fails the build immediately — the compiler or the test suite catches it. In microservices, the same breaking change to a response field ships and only breaks the consumer in production, hours later, with a 500 in a service the producer team does not own.\n\nEnd-to-end tests are meant to catch this, but they require every service running together with real, in-sync data. That environment is slow, flaky, and often infeasible across team and deployment boundaries. The result is that integration between teams is tested by hope.",
      },
      {
        type: "analogy",
        heading: "The Two Halves of a Jigsaw",
        content:
          "Two teams each hold one half of a jigsaw puzzle. Neither can see the other half, and neither can meet to check the fit. End-to-end testing means physically assembling both halves every time either changes — expensive and slow.\n\nContract testing is different: each team photographs the shape of its edge and publishes it to a shared board. Before either side changes, it verifies its edge still fits the published shape of the other. Only when a change genuinely breaks the fit does anything fail, and it fails in that team own build, before deploy.",
      },
      {
        type: "text",
        heading: "Consumer-Driven Contracts",
        content:
          "A consumer-driven contract is generated by the consumer and describes exactly what the consumer needs: which endpoints it calls, with what bodies, and which fields it reads from the response. The producer then verifies its real implementation against every consumer contract.\n\nThis is the crucial inversion. The contract is not the producer documented API surface — it is the subset that consumers actually depend on. A producer can add fields, change unrelated data, or restructure everything the consumer ignores; only the promised subset must keep working.",
      },
      {
        type: "text",
        heading: "Pact: How It Works",
        content:
          "Pact is the dominant contract-testing tool. In the consumer test, a mock provider is configured with the expected interaction, and the consumer code is run against it. Pact records the real requests the consumer made and the responses the mock returned, and emits a contract file (a pact).\n\nThat file is published to a Pact Broker. In the producer pipeline, the provider verification step replays every recorded request against the real provider and checks the real response satisfies the assertions the consumer made. If a producer change violates any consumer expectation, the producer build fails.",
      },
      {
        type: "code",
        heading: "A Consumer Test with Pact",
        language: "typescript",
        label: "user-client.pact.spec.ts",
        code: `import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { getUser } from './user-client';

const { like, integer, string } = MatchersV3;

const provider = new PactV3({
  consumer: 'web-app',
  provider: 'user-service',
});

describe('UserClient', () => {
  it('fetches a user by id', () => {
    provider
      .given('a user with id 42 exists')
      .uponReceiving('a request for user 42')
      .withRequest({ method: 'GET', path: '/v1/users/42' })
      .willRespondWith({
        status: 200,
        body: { id: integer(42), email: like('a@acme.dev'), active: like(true) },
      });

    return provider.executeTest(async (mock) => {
      const user = await getUser(mock.url, '42');
      expect(user.email).toBe('a@acme.dev');
    });
  });
});`,
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Matchers Describe Shape, Not Values",
        content:
          "The `like` and `integer` matchers in a Pact interaction describe the type and presence of a field, not its exact value. The consumer asserts it received an email of the right shape; the provider verification confirms it still sends one. This is why a producer can freely change the actual email value without breaking the contract — only removing or type-changing the field does.",
      },
      {
        type: "text",
        heading: "Provider Verification",
        content:
          'On the producer side, provider verification loads each contract and replays its interactions against the running service. State handlers set up the preconditions named in the tested `given` clause — "a user with id 42 exists" becomes a call that inserts that user. The verification then compares the real response against the consumer expectations.\n\nWhen it runs in CI on every producer commit, this is the moment a breaking change is caught: not in a downstream service at 3am, but in the pull request that introduced it. Tools like Pact, Spring Cloud Contract, and Dredd all implement some form of this verification.',
      },
      {
        type: "code",
        heading: "Provider Verification",
        language: "typescript",
        label: "user-service.provider.spec.ts",
        code: `import { Verifier } from '@pact-foundation/pact';

it('honours every consumer contract', async () => {
  const verifier = new Verifier({
    providerBaseUrl: 'http://localhost:8080',
    pactBrokerUrl: process.env.PACT_BROKER_URL!,
    pactBrokerToken: process.env.PACT_BROKER_TOKEN!,
    consumerVersionSelectors: [{ mainBranch: true }, { deployed: true }],
    stateHandlers: {
      'a user with id 42 exists': async () => {
        await db.insertUser({ id: '42', email: 'a@acme.dev', active: true });
      },
    },
  });
  await verifier.verifyProvider();
});`,
      },
      {
        type: "comparison",
        heading: "Contract Testing vs End-to-End Testing",
        headers: ["Contract Testing", "End-to-End Testing"],
        rows: [
          {
            aspect: "What runs",
            "Contract Testing": "One consumer and one provider, separately",
            "End-to-End Testing": "Every service deployed together",
          },
          {
            aspect: "Speed",
            "Contract Testing": "Seconds, runs in each team CI",
            "End-to-End Testing": "Minutes, needs a full environment",
          },
          {
            aspect: "Where bugs surface",
            "Contract Testing": "In the offending team build, pre-deploy",
            "End-to-End Testing": "In a shared environment, hard to localise",
          },
          {
            aspect: "Coverage of real integration",
            "Contract Testing": "Only the promised surface between two parties",
            "End-to-End Testing":
              "The whole chain, including cross-cutting concerns",
          },
          {
            aspect: "Flakiness",
            "Contract Testing": "Low — no combined environment",
            "End-to-End Testing":
              "High — timing, data, and environment coupling",
          },
          {
            aspect: "Best use",
            "Contract Testing": "Microservice boundaries between teams",
            "End-to-End Testing": "A few critical user journeys",
          },
        ],
      },
      {
        type: "text",
        heading: "The Pact Broker and Deployability",
        content:
          "The Pact Broker is the shared registry where contracts live. Beyond storage, it answers the question that makes contract testing safe to deploy against: can this version go to production? Using recorded consumer versions and provider versions from CI (tags and environment tracking), the broker computes a matrix of which provider version is verified against which consumer versions.\n\nThe `can-i-deploy` command queries that matrix and gates the pipeline. It prevents the classic failure of deploying a producer while an old consumer that still depends on the old contract is running somewhere in production.",
      },
      {
        type: "steps",
        heading: "Wiring Contract Testing Into CI",
        steps: [
          {
            title: "Consumer writes the contract",
            detail:
              "Consumer tests generate the pact file describing exactly what is required.",
          },
          {
            title: "Publish the pact",
            detail:
              "Push the pact to the broker tagged with the consumer version and branch.",
          },
          {
            title: "Trigger provider verification",
            detail:
              "A webhook tells the provider pipeline to verify the new contract against the real service.",
          },
          {
            title: "Publish verification results",
            detail:
              "The provider reports which contract versions it satisfied back to the broker.",
          },
          {
            title: "Gate deployment",
            detail:
              "Run can-i-deploy against the target environment; fail the pipeline if the pair is unverified.",
          },
          {
            title: "Track versions over time",
            detail:
              "Use branch and environment tags so old deployed consumers are still considered.",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Versioning Contracts Without Breaking Everyone",
        content:
          "The safest change is additive: add an optional field, add a new endpoint, keep the old one. A field the consumer does not use can be removed once no verified consumer version still reads it — and the broker matrix tells you when that is true. Renaming, changing a type, or changing an enum value is breaking and needs a new API version or a coordinated rollout. Expanding and contracting — serve both shapes during a migration window — lets consumers move without a simultaneous deploy.",
      },
      {
        type: "text",
        heading: "What Contract Testing Does Not Cover",
        content:
          "Contracts verify the agreed surface between a specific consumer and provider. They do not verify that ten services behave correctly together under load, that cross-cutting authentication works end to end, or that a real user journey completes. They complement, not replace, end-to-end tests.\n\nA healthy microservices test strategy uses contract tests for every service boundary — cheap, fast, and precise — and keeps a small number of end-to-end tests for the few critical journeys that span the whole system.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Contract tests close the gap where microservice changes break consumers only in production",
          "Consumer-driven contracts describe exactly what a consumer needs, not the whole API surface",
          "Pact generates consumer contracts and verifies them against the real provider in the provider build",
          "Matchers describe field shape, so values can change without breaking the contract",
          "The Pact Broker and can-i-deploy gate deployment on a verified consumer-provider pair",
          "Prefer additive, expand-and-contract changes; a broker matrix shows when a field is safe to remove",
          "Contract tests complement a small e2e suite; they do not cover multi-service behaviour",
        ],
      },
    ],
    quiz: [
      {
        question: 'What does "consumer-driven" mean in contract testing?',
        options: [
          "The producer defines the full API and everyone obeys it",
          "The consumer defines the subset of behaviour it actually depends on, and the producer verifies against it",
          "A third team writes contracts for both",
          "Contracts are generated from production traffic only",
        ],
        correctIndex: 1,
        explanation:
          "The consumer authors the contract, specifying only the endpoints and fields it uses. The producer then verifies its real implementation satisfies every consumer contract, so only the promised subset must keep working.",
      },
      {
        question: "When does a contract test catch a breaking change?",
        options: [
          "During the nightly e2e run",
          "In the provider build, when verifying contracts, before deploy",
          "Only in production",
          "When a user reports it",
        ],
        correctIndex: 1,
        explanation:
          "Provider verification replays consumer interactions against the real service on every provider commit. A breaking change fails that build — in the pull request that introduced it — instead of surfacing downstream in production.",
      },
      {
        question:
          "What does the pact broker can-i-deploy check protect against?",
        options: [
          "Slow database queries",
          "Deploying a producer/consumer version that has not been verified against the versions running in the target environment",
          "High CPU usage",
          "Missing migrations",
        ],
        correctIndex: 1,
        explanation:
          "can-i-deploy queries the broker verification matrix to confirm the version you are about to deploy is verified against the consumer/provider versions deployed in that environment, preventing a deploy that breaks a still-running counterpart.",
      },
    ],
  },

  // ─── RELIABILITY ENGINEERING ────────────────────────────────────────────

  "slo-error-budgets": {
    slug: "slo-error-budgets",
    title: "SLOs & Error Budgets",
    tagline: "Turning reliability into an engineering budget",
    sections: [
      {
        type: "text",
        heading: "SLI, SLO, SLA",
        content:
          "Three terms that are commonly conflated. An SLI (service level indicator) is a measurement — the fraction of requests that succeed, or the fraction faster than 300ms, over a window. An SLO (service level objective) is the target for that indicator — 99.9% of requests succeed over 28 days. An SLA (service level agreement) is a contract with financial consequences for missing the target.\n\nSLOs are the internal engineering tool; SLAs are the external promise and should always be looser than the SLO so there is room to fail without breaching the contract. Google guidance is blunt: pick SLIs users can feel, set SLOs you are willing to enforce with actions, and treat the SLA as a business commitment derived from the SLO, never the other way around.",
      },
      {
        type: "analogy",
        heading: "The Reliability Budget",
        content:
          'Think of reliability as a monthly budget. An SLO of 99.9% says that 0.1% of requests — the error budget — may fail without anyone panicking. Spending it is allowed and even desirable: it buys faster releases, riskier experiments, and less bureaucracy.\n\nThe budget reframes the eternal argument between product (ship faster) and operations (be safer) into a single shared number. If the budget is full, ship boldly. If it is exhausted, freeze feature changes and spend the budget on reliability. Nobody has to argue about whether the system is "reliable enough" — the number decides.',
      },
      {
        type: "text",
        heading: "Availability Math",
        content:
          "Availability is the fraction of the time or the fraction of requests that succeed. The distinction matters enormously: a one-hour total outage in a 30-day month is 99.86% time-based availability, but if that hour is the peak and carries 5% of the traffic, request-based availability is far worse.\n\nSmall differences in the nines are large differences in allowed downtime. At 99.9% you may fail 43.2 minutes per month. At 99.99% that drops to 4.3 minutes. At 99.999% it is 26 seconds. Each nine roughly multiplies engineering cost, which is why the right SLO is the loosest one users would not notice.",
      },
      {
        type: "comparison",
        heading: "Downtime Allowed by Availability Target",
        headers: ["Availability", "Downtime per month", "Downtime per year"],
        rows: [
          {
            aspect: "99%",
            Availability: "99%",
            "Downtime per month": "7.2 hours",
            "Downtime per year": "3.65 days",
          },
          {
            aspect: "99.9%",
            Availability: "99.9%",
            "Downtime per month": "43.2 minutes",
            "Downtime per year": "8.77 hours",
          },
          {
            aspect: "99.99%",
            Availability: "99.99%",
            "Downtime per month": "4.32 minutes",
            "Downtime per year": "52.6 minutes",
          },
          {
            aspect: "99.999%",
            Availability: "99.999%",
            "Downtime per month": "26 seconds",
            "Downtime per year": "5.26 minutes",
          },
        ],
      },
      {
        type: "text",
        heading: "Choosing Good SLIs",
        content:
          "The right SLIs measure what users experience, across four common classes: availability (successful responses over total), latency (responses faster than a threshold), throughput (successful operations per unit time), and correctness or freshness (data matches the source of truth).\n\nMeasure at the point closest to the user you control — the load balancer or edge, not a single internal service — because that is what the user actually feels. And define the denominator carefully: a 4xx caused by bad client input is not a failure of your service, but a 5xx is. Getting the error-ratio definition right is half the work.",
      },
      {
        type: "code",
        heading: "A Request-Based SLI Query",
        language: "yaml",
        label: "sli-recording-rule.yaml",
        code: `groups:
  - name: sli-checkout
    rules:
      # Errors: server errors only, not client-caused 4xx
      - record: service:request_error_ratio:rate5m
        expr: |
          sum(rate(http_requests_total{service="checkout",code=~"5.."}[5m]))
            / sum(rate(http_requests_total{service="checkout"}[5m]))
      # Latency SLI: fraction of requests faster than 300ms
      - record: service:request_latency_ok:rate5m
        expr: |
          sum(rate(http_request_duration_seconds_bucket{service="checkout",le="0.3"}[5m]))
            / sum(rate(http_request_duration_seconds_count{service="checkout"}[5m]))`,
      },
      {
        type: "text",
        heading: "Error Budget and the Policy",
        content:
          "An error budget is simply the inverse of the SLO over a window. A 99.9% objective over 28 days grants about 40 minutes of full outage, or equivalently 0.1% of requests. When the budget is spent, the policy — agreed in advance, in writing, by engineering and product — dictates what stops.\n\nThe strength of an error budget is that it is written down before the argument. A typical policy: at 50% budget consumed, slow down risky changes; at 100% consumed, freeze feature releases and staff a reliability workstream until the budget recovers. Without a written policy, the budget is just a dashboard nobody acts on.",
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "Burn-Rate Alerting",
        content:
          "Page on how fast the budget is being spent, not on a raw error-rate threshold. Burn rate is the multiple of the sustainable error rate you are currently experiencing. The Google SRE workbook uses multi-window, multi-burn-rate alerts: a fast-burn pair (14.4x over 1 hour, and 6x over 6 hours) fires a page, while a slow-burn pair (3x over 1 day, 1x over 3 days) creates a ticket. A 14.4x burn over 1 hour, if sustained, exhausts a 28-day budget in about 2 days — so paging is justified. This catches both sudden outages and slow leaks with far less noise than static thresholds.",
      },
      {
        type: "code",
        heading: "Multi-Window Burn-Rate Alert",
        language: "yaml",
        label: "burn-rate-rules.yaml",
        code: `groups:
  - name: slo-burn-rate
    rules:
      - alert: CheckoutErrorBudgetFastBurn
        # 14.4x burn over 1h AND 5m, page immediately
        expr: |
          (service:request_error_ratio:rate1h > (14.4 * 0.001))
          and
          (service:request_error_ratio:rate5m > (14.4 * 0.001))
        for: 2m
        labels:
          severity: page
        annotations:
          summary: "Checkout burning error budget 14.4x — page"
      - alert: CheckoutErrorBudgetSlowBurn
        # 3x burn over 1d, create a ticket
        expr: service:request_error_ratio:rate1d > (3 * 0.001)
        for: 1h
        labels:
          severity: ticket`,
      },
      {
        type: "text",
        heading: "Latency and Correctness SLOs",
        content:
          'Availability is not the only axis. A latency SLO — "95% of requests complete under 300ms" — captures the experience of a service that answers every request but slowly, which availability alone would call perfect. Threshold-based latency SLIs are common because averages hide the tail: a p50 of 80ms with a p99 of 9 seconds describes a service most users experience as fine and a meaningful minority experience as broken.\n\nCorrectness or freshness SLOs matter for data pipelines and caches: "99% of cached values are under 5 minutes old" or "99% of records match the source of truth within one minute". These catch the failures that look healthy to a liveness probe but serve stale or wrong data — arguably worse than an error, because users cannot tell.',
      },
      {
        type: "steps",
        heading: "Defining and Rolling Out an SLO",
        steps: [
          {
            title: "Pick the journey",
            detail:
              "Choose a user-visible critical journey such as checkout, login, or search.",
          },
          {
            title: "Choose the SLI",
            detail:
              "Define a measurable indicator — success ratio, latency threshold — at the edge closest to the user.",
          },
          {
            title: "Set the target",
            detail:
              "Set the loosest target users would not notice missing; start lower and tighten deliberately.",
          },
          {
            title: "Write the policy",
            detail:
              "Agree in writing what happens at 50% and 100% budget consumption, signed off by product and engineering.",
          },
          {
            title: "Wire the alerts",
            detail:
              "Implement multi-window burn-rate alerts for page and ticket severities.",
          },
          {
            title: "Review on the window",
            detail:
              "Review budget consumption each window, and adjust targets that are trivially met or constantly missed.",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Unachievable SLOs Cause Their Own Incident",
        content:
          "Setting 99.99% on a service whose dependencies are only 99.9% guarantees the SLO is missed no matter how hard the team works — you cannot be more available than your critical dependencies allow. Chase only the nines your architecture can actually deliver, or invest in the architecture first. Similarly, do not set a target so loose it never triggers a policy: an SLO nobody ever misses provides no signal and no risk limit.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "SLIs measure, SLOs set the internal target, SLAs are the external contract",
          "The error budget is 100% minus the SLO; spending it is allowed, exhausting it triggers the policy",
          "Each additional nine roughly multiplies cost — pick the loosest target users would not notice",
          "Measure SLIs at the edge closest to the user, counting 5xx as errors but not client-caused 4xx",
          "Page on multi-window burn rate, not raw thresholds, to catch fast outages and slow leaks",
          "Latency and correctness SLOs cover slow and stale failures that availability alone misses",
          "A written error budget policy, agreed before the incident, is what makes the budget act",
        ],
      },
    ],
    quiz: [
      {
        question: "What is the difference between an SLO and an SLA?",
        options: [
          "They are the same thing",
          "An SLO is an internal engineering target; an SLA is an external contract with financial consequences",
          "An SLA is set by engineers and an SLO by legal",
          "An SLA is always tighter than the SLO",
        ],
        correctIndex: 1,
        explanation:
          "An SLO is the internal objective the team enforces with actions. An SLA is the external promise, usually looser than the SLO, with money attached if breached. Set an SLA no tighter than what the SLO demonstrates you can deliver.",
      },
      {
        question:
          "A service has a 99.9% availability SLO over 28 days. How much downtime does that allow?",
        options: [
          "About 4 minutes",
          "About 40 minutes",
          "About 7 hours",
          "None at all",
        ],
        correctIndex: 1,
        explanation:
          "0.1% of 28 days (40,320 minutes) is about 40 minutes of full outage, or equivalently 0.1% of requests. That budget is what you may spend on releases and experiments before the policy triggers.",
      },
      {
        question:
          "Why is multi-window burn-rate alerting preferred over a static error-rate threshold?",
        options: [
          "It is cheaper to compute",
          "It catches both fast outages and slow leaks with fewer false pages by measuring how quickly the budget is spent",
          "It needs no metrics",
          "It removes the need for SLOs",
        ],
        correctIndex: 1,
        explanation:
          "A fast-burn window (for example 14.4x over an hour) pages for sudden outages, while a slow-burn window catches gradual leaks via a ticket. Comparing burn rate against the sustainable rate reduces alert noise compared to a fixed threshold.",
      },
      {
        question:
          'Beyond availability, what does a latency SLO such as "95% of requests under 300ms" capture?',
        options: [
          "The cost of running the service",
          "Requests that succeed but slowly, which availability alone would count as perfectly healthy",
          "The number of deploys",
          "Database storage growth",
        ],
        correctIndex: 1,
        explanation:
          "A service can answer every request and still feel broken if the tail is slow. Threshold-based latency SLOs measure the user experience of slow-but-successful requests, which an availability-only objective would rate as 100% healthy.",
      },
    ],
  },

  "chaos-engineering": {
    slug: "chaos-engineering",
    title: "Chaos Engineering",
    tagline: "Finding weaknesses by injecting controlled failure",
    sections: [
      {
        type: "text",
        heading: "What Chaos Engineering Is",
        content:
          "Chaos engineering is the discipline of experimenting on a system to build confidence in its ability to withstand turbulent conditions in production. The key word is experiment: unlike testing, which checks a known expectation, a chaos experiment probes an unknown to discover a weakness before a real failure does.\n\nIt is not random destruction. Every experiment starts from a steady-state hypothesis, injects a controlled fault, observes whether the hypothesis holds, and either confirms resilience or reveals a gap to fix. The output is knowledge, and ideally a smaller blast radius than the one an unnoticed failure would have produced.",
      },
      {
        type: "analogy",
        heading: "The Fire Drill",
        content:
          "A fire drill does not set the building on fire to see what happens. It simulates an evacuation under controlled conditions, at a chosen time, with observers and a rollback plan, to find out whether people actually reach the exits and whether the alarms work.\n\nChaos engineering is a fire drill for infrastructure. You inject a controlled fault — kill a pod, add latency, partition a network — at a time you choose, with the ability to stop, precisely so that when the uncontrolled version arrives you already know how the system behaves and have fixed what the drill revealed.",
      },
      {
        type: "text",
        heading: "Principles of Chaos",
        content:
          "The Principles of Chaos, first articulated by Netflix, define the practice: build a hypothesis around steady-state behaviour; vary real-world events such as server death and network failure; run experiments in production because staging never matches production; continuously run experiments to automate discovery; and minimise blast radius so an experiment never becomes the incident.\n\nThe production point is the one teams resist most and is also the most important. Staging diverges from production in traffic shape, data volume, topology, and configuration, so a fault injected in staging proves far less than one injected in production against real traffic — held within a blast radius you control.",
      },
      {
        type: "steps",
        heading: "Running a Chaos Experiment",
        steps: [
          {
            title: "Define steady state",
            detail:
              "Choose measurable normal behaviour — error rate, latency percentiles, throughput — that you will check before and after.",
          },
          {
            title: "Form the hypothesis",
            detail:
              'State what you expect: "if one AZ loses network, checkout error rate stays under 0.5%".',
          },
          {
            title: "Scope the blast radius",
            detail:
              "Decide exactly which instances, percentage of traffic, and duration the fault may touch.",
          },
          {
            title: "Prepare rollback",
            detail:
              "Have an immediate abort switch and a runbook, and tell the on-call team the experiment is running.",
          },
          {
            title: "Inject the fault",
            detail:
              "Start with the smallest fault and shortest duration; expand only after the hypothesis holds.",
          },
          {
            title: "Observe and compare",
            detail: "Check whether steady state held; capture what broke.",
          },
          {
            title: "Fix and automate",
            detail:
              "Fix any weakness found and, once the experiment reliably passes, automate it to run continuously.",
          },
        ],
      },
      {
        type: "comparison",
        heading: "Common Fault-Injection Types",
        headers: ["Fault", "What it simulates", "Typical check"],
        rows: [
          {
            aspect: "Latency injection",
            Fault: "A slow dependency or network",
            "What it simulates": "Congestion, distant region, overloaded peer",
            "Typical check":
              "Timeout and latency SLOs hold; no runaway retries",
          },
          {
            aspect: "Error injection",
            Fault: "Returning 5xx or corrupt responses",
            "What it simulates": "A dependency bug or partial outage",
            "Typical check": "Fallbacks and circuit breakers engage",
          },
          {
            aspect: "Pod kill",
            Fault: "Terminating instances",
            "What it simulates": "Node death, crash, OOM kill",
            "Typical check":
              "Traffic rebalances; no data loss; recovery within target",
          },
          {
            aspect: "Network partition",
            Fault: "Dropping packets between zones",
            "What it simulates": "Split brain, AZ isolation",
            "Typical check": "Quorum and consistency behaviour is correct",
          },
          {
            aspect: "Resource stress",
            Fault: "CPU, memory, or disk exhaustion",
            "What it simulates": "Noisy neighbour, capacity shortfall",
            "Typical check": "Load shedding and prioritisation work",
          },
          {
            aspect: "Clock skew",
            Fault: "Offsetting system time",
            "What it simulates": "Drift across hosts",
            "Typical check": "Time-based logic and tokens stay correct",
          },
        ],
      },
      {
        type: "code",
        heading: "A Chaos Mesh Network Partition",
        language: "yaml",
        label: "network-partition.yaml",
        code: `apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: partition-payments-az
  namespace: payments
spec:
  action: partition          # drop traffic between the selected pods and the target
  mode: one                  # affect one pod per round to limit blast radius
  duration: '2m'
  selector:
    namespaces: [payments]
    labelSelectors:
      app: payments-api
  direction: both
  target:
    mode: all
    selector:
      namespaces: [payments]
      labelSelectors:
        app: ledger`,
      },
      {
        type: "text",
        heading: "Tools: Chaos Monkey, Litmus, Chaos Mesh, Gremlin",
        content:
          "Chaos Monkey, part of Netflix Simian Army, randomly terminates production instances to force teams to build for instance failure. It is deliberately blunt and continuous — surviving it is a baseline requirement, not an event.\n\nModern tools are Kubernetes-native and far more precise. LitmusChaos and Chaos Mesh are open-source and let you target specific pods, namespaces, and percentages with fault types for latency, errors, network loss, stress, and DNS. Gremlin and AWS Fault Injection Simulator are managed options with guardrails. All of them share the same controls: scope selectors, duration, and an abort mechanism.",
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Never Run Chaos Without Blast-Radius Limits",
        content:
          "An unbounded experiment is just an outage you scheduled. Always: start with a single instance or a small traffic percentage; set a hard duration and an automatic stop; make sure the abort path itself does not depend on the faulted component; and exclude the systems the experiment could truly take down. The goal is to find a weakness safely, not to cause the incident. Run it during business hours with the team watching, never unattended at 3am.",
      },
      {
        type: "text",
        heading: "Game Days",
        content:
          "A game day is a scheduled, team-wide chaos exercise: pick a failure mode, hypothesise the impact, inject it, and practise responding as if it were real. It combines chaos engineering with incident-response rehearsal, so people learn both how the system fails and how to run the incident.\n\nGood game days have a facilitator, a clear scope, a rollback plan, observers capturing what happened, and a written retrospective afterwards producing concrete fixes and runbook updates. They are the single highest-leverage way to convert tribal knowledge into documented, tested procedures before an unplanned outage demands it.",
      },
      {
        type: "steps",
        heading: "A Safe First Experiment in Production",
        steps: [
          {
            title: "Start with read-only, non-critical traffic",
            detail:
              "Inject latency on a low-stakes internal service first, not on checkout during peak.",
          },
          {
            title: "Use a tiny blast radius",
            detail:
              "One pod or 1% of traffic, for a duration measured in a couple of minutes.",
          },
          {
            title: "Notify and watch",
            detail:
              "Tell the on-call team, open the dashboards, and keep a human on the abort switch.",
          },
          {
            title: "Verify the hypothesis",
            detail:
              "Compare steady-state metrics before, during, and after the fault.",
          },
          {
            title: "Expand gradually",
            detail:
              "Only scale the fault after it reliably passes, and only for proven-safe components.",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "The Value Is in the Fixes",
        content:
          "Netflix runs continuous chaos specifically because finding a weakness that would have caused a 3am outage and fixing it during a controlled drill is worth far more than the drill cost. Amber alerts, better fallbacks, and correct quorum behaviour in Cassandra all came from production chaos experiments. The measure of a chaos programme is not how many experiments you run — it is how many weaknesses you found and fixed before your users did.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Chaos engineering is controlled experimentation from a steady-state hypothesis, not random destruction",
          "Run in production because staging diverges in traffic, topology, and configuration",
          "Every experiment needs a blast-radius limit, a duration, an abort switch, and a rollback plan",
          "Fault types span latency, errors, pod kills, network partitions, resource stress, and clock skew",
          "Chaos Mesh and Litmus are precise and Kubernetes-native; Chaos Monkey is deliberately blunt",
          "Game days rehearse incidents and convert tribal knowledge into tested runbooks",
          "Success is measured by weaknesses found and fixed, not by experiments run",
        ],
      },
    ],
    quiz: [
      {
        question: "What is the first step of a chaos experiment?",
        options: [
          "Kill a random pod",
          "Define steady-state behaviour and a hypothesis about how it should survive",
          "Increase production traffic",
          "Disable all monitoring",
        ],
        correctIndex: 1,
        explanation:
          "Experiments begin with a measurable steady state and a hypothesis (for example, losing an AZ keeps checkout errors under 0.5%). Only then do you inject a scoped fault and check whether steady state held.",
      },
      {
        question:
          "Why does chaos engineering recommend running experiments in production?",
        options: [
          "Production is cheaper",
          "Staging diverges from production in traffic, data, topology, and configuration, so it proves far less",
          "Production has no users",
          "It is required by Kubernetes",
        ],
        correctIndex: 1,
        explanation:
          "Staging rarely matches production in traffic shape, data volume, and topology, so a fault injected there may behave differently. Running in production against real traffic — within a controlled blast radius — gives confidence that reflects reality.",
      },
      {
        question: "What is a blast radius limit?",
        options: [
          "The speed at which a fault spreads",
          "The scope — instances, traffic percentage, and duration — a fault may affect",
          "The cost of the experiment",
          "The number of alerts fired",
        ],
        correctIndex: 1,
        explanation:
          "A blast-radius limit bounds exactly which instances or fraction of traffic the fault can touch and for how long, plus an abort mechanism, so an experiment never becomes the incident it was meant to prevent.",
      },
      {
        question: "What is the primary purpose of a game day?",
        options: [
          "To increase throughput",
          "To rehearse a failure mode and incident response as a team, producing fixes and updated runbooks",
          "To reduce cloud cost",
          "To benchmark latency",
        ],
        correctIndex: 1,
        explanation:
          "A game day combines chaos engineering with incident rehearsal: the team injects a chosen failure, practises responding, and captures findings. Its value is turning tribal knowledge into documented, tested procedures and concrete fixes.",
      },
    ],
  },

  "incident-response": {
    slug: "incident-response",
    title: "Incident Response",
    tagline: "Declaring, running, and learning from incidents",
    sections: [
      {
        type: "text",
        heading: "What an Incident Is",
        content:
          "An incident is any unplanned event that degrades or risks degrading service to users enough that it needs a coordinated response. The definition is deliberately about coordination, not severity: a single engineer debugging quietly is not an incident; the moment paging, communication, and roles are needed, it is.\n\nThe goal of incident response is not to be calm under pressure — it is to make good decisions under pressure, with clear roles, shared information, and a bias toward restoring service before diagnosing the root cause. Mitigate first, investigate second.",
      },
      {
        type: "text",
        heading: "Severity Levels",
        content:
          "Severity levels give everyone a shared vocabulary for impact and trigger the right response automatically. The exact ladder varies, but a common five-level scheme works well: SEV1 is a full or near-total outage or data loss; SEV2 is major degradation affecting most users; SEV3 is partial degradation with a workaround; SEV4 is minor impact; SEV5 is a cosmetic or latent issue worth tracking.\n\nEach level should define who gets paged, how often updates go out, and whether an incident commander is required. Defining this in advance removes the worst failure mode — debating severity while users are down.",
      },
      {
        type: "comparison",
        heading: "A Workable Severity Ladder",
        headers: ["SEV1", "SEV2", "SEV3"],
        rows: [
          {
            aspect: "Impact",
            SEV1: "Full outage, data loss, or security breach",
            SEV2: "Major degradation, most users affected, no workaround",
            SEV3: "Partial degradation with a workaround",
          },
          {
            aspect: "Who is paged",
            SEV1: "On-call plus leadership, all hands",
            SEV2: "On-call plus service owners",
            SEV3: "On-call, best effort during hours",
          },
          {
            aspect: "Commander",
            SEV1: "Required immediately",
            SEV2: "Required",
            SEV3: "Optional",
          },
          {
            aspect: "Update cadence",
            SEV1: "Every 15-30 minutes",
            SEV2: "Every 30-60 minutes",
            SEV3: "At start and resolution",
          },
          {
            aspect: "Postmortem",
            SEV1: "Blameless postmortem required",
            SEV2: "Blameless postmortem required",
            SEV3: "Optional review",
          },
        ],
      },
      {
        type: "text",
        heading: "Incident Roles",
        content:
          "Incidents fail from unclear roles far more often than from lack of skill. Four roles cover almost everything. The Incident Commander (IC) owns the response: they decide priorities, delegate, and control who talks to whom — but they do not debug. The Operations lead does the hands-on technical work. The Communications lead keeps stakeholders informed and shields the responders from inbound questions. The Scribe records the timeline, decisions, and actions so the postmortem writes itself.\n\nSeparating command from debugging is the single most important structure. An engineer who is both running the incident and deep in logs cannot also see the whole picture or delegate.",
      },
      {
        type: "analogy",
        heading: "Captain and Crew",
        content:
          "A ship captain does not steer, navigate, and fix the engine simultaneously — especially in a storm. The captain decides where the ship goes, keeps the crew coordinated, and communicates with the fleet. The crew executes.\n\nAn incident is a storm. The Incident Commander is the captain: they take the broader view while others work the problem. Putting one person in command — and keeping them out of the engine room — is what turns a panicked group into a coordinated response.",
      },
      {
        type: "text",
        heading: "Declaration and the Incident Channel",
        content:
          "Incidents should be declared early and often. The cost of declaring a non-incident is a few minutes of someone time; the cost of under-declaring is an unnoticed, spreading outage. Whoever spots the symptom can declare and, if they are the right person, become IC — or hand it off.\n\nA dedicated incident channel (a Slack channel or a video call) becomes the single source of truth. Keep a running timeline posted there, pin the runbook and dashboards, and route all updates through it. This is what the Communications lead curates and what the Scribe records.",
      },
      {
        type: "text",
        heading: "Runbooks and Playbooks",
        content:
          'A runbook turns hard-won knowledge into a procedure anyone can follow at 3am when their judgment is worst. An effective runbook is concrete and specific: it names the alert that fires, the dashboards to open, the exact commands to run, the likely causes ranked by probability, and the escalate-to contact.\n\nRunbooks should be linked directly from the alert that triggers them, kept in version control next to the code, and updated after every incident and game day. A runbook that is stale or that says "investigate the root cause" is worse than none — it wastes the responder time and erodes trust.',
      },
      {
        type: "code",
        heading: "A Runbook Linked From an Alert",
        language: "yaml",
        label: "alert-with-runbook.yaml",
        code: `groups:
  - name: payments
    rules:
      - alert: PaymentsErrorRateHigh
        expr: |
          sum(rate(http_requests_total{service="payments",code=~"5.."}[5m]))
            / sum(rate(http_requests_total{service="payments"}[5m])) > 0.02
        for: 10m
        labels:
          severity: page
        annotations:
          summary: "Payments error rate above 2% for 10 minutes"
          runbook_url: "https://runbooks.acme.dev/payments-error-rate"
          dashboard: "https://grafana.acme.dev/d/payments"`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Time To Detect and Time To Mitigate",
        content:
          "Two metrics govern whether an incident is survivable. MTTD (mean time to detect) is how long before anyone notices; MTTR (mean time to recover or mitigate) is how long from detection to restored service. Users feel the sum, and the leverage is usually in detection, not heroics. Invest in symptom-based alerting to shrink MTTD, and in runbooks, feature flags, and a reliable rollback path to shrink MTTR. Also track the percentage of incidents detected by monitoring versus reported by users — a high user-reported rate means your observability has holes.",
      },
      {
        type: "text",
        heading: "Communication Cadence",
        content:
          'During an incident, silence is corrosive. Stakeholders and support need a predictable rhythm even when there is nothing new. Commit to a cadence by severity — every 15-30 minutes for SEV1, hourly for SEV2 — and send an update on schedule even if it says "no change, still investigating".\n\nEach update follows the same shape: current impact, what is known, what is being done, what is needed, when the next update comes. A status page and pre-written templates reduce the cognitive load, and the Communications lead owns them so responders never stop working to answer questions.',
      },
      {
        type: "steps",
        heading: "Running an Incident End to End",
        steps: [
          {
            title: "Detect and declare",
            detail:
              "An alert fires or a user reports; declare early, assign a severity, and open the incident channel.",
          },
          {
            title: "Assign roles",
            detail:
              "Name an IC, Ops lead, Comms lead, and Scribe; the IC runs the response and delegates tasks.",
          },
          {
            title: "Stabilise",
            detail:
              "Mitigate before diagnosing. Roll back, fail over, disable the feature flag, or shed load to restore service.",
          },
          {
            title: "Communicate on cadence",
            detail:
              "Send updates at the agreed interval with impact, actions, needs, and next update time.",
          },
          {
            title: "Confirm recovery",
            detail:
              "Verify steady state with SLO dashboards before standing down, and watch for recurrence.",
          },
          {
            title: "Close and schedule the postmortem",
            detail:
              "Write the timeline from the Scribe notes, and book the blameless postmortem within days.",
          },
        ],
      },
      {
        type: "text",
        heading: "Blameless Postmortems",
        content:
          "A blameless postmortem assumes people acted rationally given the information and tools they had, and that the failure lies in the system, not the individual. This is not softness — it is the only way to get the truth. If people fear blame, they omit details, and the organisation learns nothing.\n\nA good postmortem states the impact, a precise timeline, the contributing factors (plural — incidents rarely have one cause), what went well, what went badly, and — most importantly — action items with owners and due dates. The document matters less than the actions; a postmortem with no follow-through is a group therapy session, not an improvement.",
      },
      {
        type: "code",
        heading: "Postmortem Action Items Template",
        language: "plaintext",
        label: "postmortem-actions.txt",
        code: `Impact:      Payments returned 5xx for 12% of requests,
             18 minutes, ~4,300 failed checkouts.
Timeline:    09:14 deploy of payments-api v1.42 begins
             09:19 error rate crosses alert threshold
             09:21 page fires, IC assigned
             09:23 rollback started
             09:32 error rate back to baseline
             09:40 incident closed

Contributing factors (not "root cause"):
  - New code path skipped a cache key, causing a thundering herd
  - Retry budget unbounded during the surge
  - Detection relied on error-rate alert only

Action items:
  [ ] Fix cache key regression            @alex   due 2026-11-18  (SEV2)
  [ ] Add retry budget cap                 @sam    due 2026-11-22
  [ ] Add latency SLO alert for checkout   @robin  due 2026-11-25
  [ ] Update runbook with rollback steps   @alex   due 2026-11-18`,
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "Fight Alert Fatigue Actively",
        content:
          "On-call quality decides whether incidents get handled. If a team is paged repeatedly for non-actionable, self-resolving alerts, they will start sleeping through the pager and miss the real one. Every page should be urgent, actionable, and about real user impact. Review paging alert volume per rotation, delete or downgrade anything that did not require action, and target a small number of genuine incidents per shift. A quiet pager that only rings for real problems is the sign of a mature on-call, not a bored one.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "An incident needs coordination; define severity levels and their response in advance",
          "Separate command from debugging: IC, Ops, Communications, and Scribe are distinct roles",
          "Declare early — under-declaring hides spreading outages; mitigate before diagnosing",
          "Runbooks must be concrete, version-controlled, linked from alerts, and updated after incidents",
          "Track MTTD and MTTR; investment in detection usually beats heroics",
          "Communicate on a fixed cadence with a consistent update shape",
          "Blameless postmortems produce action items with owners and dates — otherwise nothing improves",
          "Cut alert fatigue aggressively; every page must be urgent and actionable",
        ],
      },
    ],
    quiz: [
      {
        question:
          "In a well-run incident, what does the Incident Commander do?",
        options: [
          "Debug the hardest problem personally",
          "Coordinate the response, delegate tasks, and manage priorities without doing the hands-on debugging",
          "Write the status page only",
          "Communicate with customers",
        ],
        correctIndex: 1,
        explanation:
          "The IC owns the response — deciding priorities and delegating — but stays out of the debugging so they can see the whole picture. Separating command from operations is what keeps the response coordinated rather than a group of individuals in logs.",
      },
      {
        question:
          "What is the guiding principle for mitigating during an incident?",
        options: [
          "Fully diagnose the root cause before acting",
          "Restore service first — roll back, fail over, or disable the feature — then investigate",
          "Wait for the next deployment window",
          "Reboot everything immediately",
        ],
        correctIndex: 1,
        explanation:
          "Mitigate before diagnosing. Users care about restored service, not a complete root-cause analysis in the moment. Roll back, fail over, or toggle a feature flag to stabilise, and investigate afterwards.",
      },
      {
        question: "What makes a postmortem blameless, and why does it matter?",
        options: [
          "It never assigns action items",
          "It assumes people acted rationally with the information they had and seeks systemic causes, so the truth is not hidden by fear",
          "It avoids mentioning the timeline",
          "It only credits the responders",
        ],
        correctIndex: 1,
        explanation:
          "Blamelessness is about learning, not leniency. If people fear punishment, they omit details and the organisation cannot fix the systemic causes. A blameless postmortem surfaces contributing factors and produces owned action items.",
      },
      {
        question: "Users feel the sum of which two metrics most directly?",
        options: [
          "MTTR and deployment frequency",
          "Mean time to detect plus mean time to mitigate/recover",
          "CPU and memory utilisation",
          "Lines of code and test coverage",
        ],
        correctIndex: 1,
        explanation:
          "Outage duration as users experience it is roughly time-to-detect plus time-to-recover. Shrinking either helps; investment usually pays off best in detection through symptom-based alerting, and in mitigation through runbooks and reliable rollback.",
      },
    ],
  },

  "multi-region": {
    slug: "multi-region",
    title: "Multi-Region Architecture",
    tagline: "Active-passive and active-active across the globe",
    sections: [
      {
        type: "text",
        heading: "Why Multiple Regions",
        content:
          'A single-region deployment has three exposure points: a region-wide outage at the provider, distance from far-away users that adds unavoidable latency, and legal or contractual demands to keep certain data within a jurisdiction. Multi-region architecture addresses all three — but at a cost in complexity, data consistency, and operating effort that must be justified by the requirement.\n\nThe first question is never "how do we go active-active"; it is "which of these three requirements do we actually have, and what recovery time and data loss can we tolerate." That answer determines the entire design.',
      },
      {
        type: "text",
        heading: "RTO and RPO",
        content:
          "Two numbers frame every multi-region decision. RTO (recovery time objective) is how long a region may be down before service must be restored elsewhere. RPO (recovery point objective) is how much data you may lose, expressed as time — five minutes of writes, or none.\n\nAn RPO of zero across regions forces synchronous replication, which means every write pays a cross-region round trip and must survive the latency and partial-failure of the wide-area link. A non-zero RPO permits asynchronous replication, which is far simpler and faster but means a failover loses the writes that had not yet propagated. Choose RPO and RTO deliberately, because they dictate sync versus async and active-passive versus active-active.",
      },
      {
        type: "comparison",
        heading: "Active-Passive vs Active-Active",
        headers: ["Active-Passive", "Active-Active"],
        rows: [
          {
            aspect: "Traffic",
            "Active-Passive": "One region serves; the other stands by",
            "Active-Active": "All regions serve concurrently",
          },
          {
            aspect: "Failover",
            "Active-Passive":
              "Requires traffic switch and often data promotion",
            "Active-Active": "Failover is just removing a region from rotation",
          },
          {
            aspect: "Data model",
            "Active-Passive": "Single writer; simple consistency",
            "Active-Active": "Multi-writer; conflict resolution required",
          },
          {
            aspect: "Cost",
            "Active-Passive": "Standby capacity is largely idle",
            "Active-Active": "All regions serve, better utilisation",
          },
          {
            aspect: "Latency for global users",
            "Active-Passive": "Distant users cross the globe",
            "Active-Active": "Users hit a nearby region",
          },
          {
            aspect: "Complexity",
            "Active-Passive": "Lower, but failover is untested until needed",
            "Active-Active":
              "Much higher — conflicts, routing, and consistency",
          },
        ],
      },
      {
        type: "analogy",
        heading: "The Backup Generator",
        content:
          'Active-passive is a building with one live power feed and a backup generator that starts when the mains fail. It works, but the generator sits idle most of the year and the day you need it is the day you discover it was never maintained.\n\nActive-active is a grid where every region is always generating and feeding the same load. There is no "start the generator" moment — losing one source just shifts load to the others. The trade-off is coordinating many always-on sources, which is exactly why active-active is harder and why passive failovers so often fail when finally exercised.',
      },
      {
        type: "text",
        heading: "Data Replication Strategies",
        content:
          "Single-writer with read replicas is the simplest: all writes go to a primary region, reads are served from local read replicas near users. Replication is asynchronous, so replicas lag slightly and serve potentially stale reads; it scales read latency beautifully and keeps writes consistent. It is the right default for read-heavy workloads.\n\nMulti-writer replication lets every region accept writes and propagates them to the others. It removes the cross-region write latency of a single primary but creates the hard problem: the same record can be modified in two regions at once, and the system must decide what wins.",
      },
      {
        type: "code",
        heading: "Replication Strategies Sketch",
        language: "yaml",
        label: "replication-strategies.yaml",
        code: `strategies:
  single_primary_read_replicas:
    writes: one region (us-east-1)
    reads: local replica in each region
    consistency: eventual on replicas (lag ~50-500ms)
    fits: read-heavy workloads, non-zero RPO
  multi_writer:
    writes: any region
    propagation: async, bi-directional
    consistency: eventual; conflicts must be resolved
    fits: globally distributed writes, latency-sensitive
  synchronous_quorum:
    writes: replicated to a quorum across regions before ack
    consistency: strong, but adds cross-region latency to every write
    fits: financial or inventory correctness with RPO zero`,
      },
      {
        type: "text",
        heading: "Conflict Resolution",
        content:
          "When two regions can write the same entity, conflicts are inevitable and must be resolved deterministically at every node. Last-write-wins is simplest: attach a timestamp (with a tiebreaker for identical times) and keep the latest. It is deterministic but silently discards a write, which is fine for a profile nickname and catastrophic for an account balance.\n\nBetter approaches preserve intent. Conflict-free replicated data types (CRDTs) merge without loss — counters add, sets union, last-writer-wins registers resolve by a rule. Application-level merges route each entity type to a strategy that matches its semantics: a shopping cart unions its lines; a bank balance is not mergeable at all and needs a single primary. Vector clocks or version vectors detect that a conflict exists so the application can merge or prompt for a decision rather than silently overwrite.",
      },
      {
        type: "comparison",
        heading: "Conflict Resolution Strategies",
        headers: ["Last-Write-Wins", "CRDT Merge", "Single-Primary per Key"],
        rows: [
          {
            aspect: "Mechanism",
            "Last-Write-Wins": "Highest timestamp wins",
            "CRDT Merge": "Types that combine losslessly",
            "Single-Primary per Key": "One region owns each key",
          },
          {
            aspect: "Data loss",
            "Last-Write-Wins": "Loses the losing write silently",
            "CRDT Merge": "None for compatible operations",
            "Single-Primary per Key": "None; writes queue to the owner",
          },
          {
            aspect: "Deterministic",
            "Last-Write-Wins": "Yes, with a tiebreaker",
            "CRDT Merge": "Yes, by construction",
            "Single-Primary per Key": "Yes",
          },
          {
            aspect: "Fits",
            "Last-Write-Wins": "Profiles, settings, last-seen",
            "CRDT Merge": "Carts, counters, collaborative edits",
            "Single-Primary per Key": "Balances, inventory, unique constraints",
          },
        ],
      },
      {
        type: "text",
        heading: "Global Load Balancing and Latency Routing",
        content:
          "Global load balancing in front of every region uses DNS-based routing or anycast to send each user to the closest healthy region. Latency-based routing measures or estimates the round trip from the user network to each endpoint and picks the fastest. Geoproximity and weighted routing let you bias traffic deliberately — for example, keep most traffic in one region until it fills.\n\nHealth checks are the failover trigger: when a region fails its health probe, the global load balancer removes it from rotation and new connections go elsewhere. This makes failover in an active-active design nearly invisible — but only if sessions carry no server-side state that lives solely in the failed region.",
      },
      {
        type: "code",
        heading: "Latency-Based Global Routing in Route 53",
        language: "json",
        label: "route53-latency.json",
        code: `{
  "Comment": "Latency-based routing to the nearest healthy region",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.acme.dev",
        "Type": "A",
        "SetIdentifier": "us-east-1",
        "Region": "us-east-1",
        "AliasTarget": { "DNSName": "alb-us-east-1.acme.dev", "EvaluateTargetHealth": true }
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "api.acme.dev",
        "Type": "A",
        "SetIdentifier": "eu-west-1",
        "Region": "eu-west-1",
        "AliasTarget": { "DNSName": "alb-eu-west-1.acme.dev", "EvaluateTargetHealth": true }
      }
    }
  ]
}`,
      },
      {
        type: "text",
        heading: "Data Residency and Sovereignty",
        content:
          "Regulations such as GDPR and data-localisation laws require certain personal data to remain within a jurisdiction. A naive global user table violates this the moment a European record is replicated to a US database. The usual pattern is data segmentation: partition user data by residency region, keep each partition in its region, and design services to operate on the partition for a user locality.\n\nCross-region features that need global views then work on aggregated or pseudonymised data, or query each partition through a coordination layer that respects residency. This is architecture driven by law, so it must be a first-class design input, not a later patch.",
      },
      {
        type: "steps",
        heading: "Building and Failing Over a Multi-Region Setup",
        steps: [
          {
            title: "Set RTO and RPO",
            detail:
              "Agree the recovery time and acceptable data loss; they determine sync versus async and the topology.",
          },
          {
            title: "Choose the data strategy",
            detail:
              "Single-writer with read replicas, multi-writer with conflict resolution, or synchronous quorum.",
          },
          {
            title: "Deploy every region identically",
            detail:
              "Same infrastructure-as-code, same version, no region drift; region-specific hacks break failover.",
          },
          {
            title: "Route globally with health checks",
            detail:
              "Use latency-based or anycast routing with health probes that eject an unhealthy region.",
          },
          {
            title: "Keep sessions stateless or externalised",
            detail:
              "Store session state in a replicated store so any region can serve any user after a switch.",
          },
          {
            title: "Test failover deliberately",
            detail:
              "Drain a region in a game day and measure how traffic, data, and latency behave.",
          },
          {
            title: "Plan failback",
            detail:
              "Promoting a region back is often harder than failing over; rehearse it too.",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Replication Lag Is a Correctness Bug Waiting",
        content:
          "With asynchronous replication, a user can write in one region and immediately read stale data from another. Read-your-own-writes can break right after a failover. Mitigate by pinning a user to the region that holds their latest write for a short window, routing reads for recently written keys to the primary, or returning the count of replica confirms for the few operations that need it. Never assume a replica is current — assert the consistency each endpoint actually needs.",
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Failover Is Only Real If You Test It",
        content:
          "An untested failover path is not a failover path; it is an assumption. Passive-region databases that have never been promoted, DNS records that never flipped, and runbooks nobody has run all fail at the worst moment. Schedule regular failover drills, ideally automated and even destructive, so that the real event is a repeat of something you already did on purpose.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Multi-region solves provider-region failure, global latency, and data residency — justify it against those needs",
          "RTO and RPO drive every choice: synchronous replication for RPO zero, asynchronous otherwise",
          "Active-passive is simpler but failover is untested until needed; active-active serves globally at higher complexity",
          "Single-writer with read replicas suits read-heavy workloads; multi-writer needs conflict resolution",
          "Resolve conflicts by entity semantics — LWW for settings, CRDTs for carts, single-primary for balances",
          "Global load balancing with latency routing and health checks makes active-active failover near-invisible",
          "Data residency forces partitioned data by jurisdiction; keep region deployments identical and test failover and failback",
        ],
      },
    ],
    quiz: [
      {
        question: "What do RTO and RPO control in a multi-region design?",
        options: [
          "The cost of the regions",
          "RTO is how long a region may be down, RPO is how much data may be lost — together they dictate sync vs async and the topology",
          "The number of regions required",
          "The DNS TTL",
        ],
        correctIndex: 1,
        explanation:
          "Recovery time objective bounds acceptable downtime and recovery point objective bounds acceptable data loss. RPO zero forces synchronous replication; a non-zero RPO permits simpler asynchronous replication.",
      },
      {
        question:
          "Which conflict resolution strategy is appropriate for a bank account balance across regions?",
        options: [
          "Last-write-wins",
          "CRDT counter merge",
          "Single-primary per key, with writes routed to the owner",
          "Random selection",
        ],
        correctIndex: 2,
        explanation:
          "Balances and inventory cannot silently lose or merge writes. A single primary per key serialises writes so there is no conflict to resolve. LWW would discard a deposit, and a naive merge would be incorrect for balances.",
      },
      {
        question: "Why is active-active more complex than active-passive?",
        options: [
          "It serves less traffic",
          "It requires multi-writer replication with conflict resolution, plus global routing",
          "It uses fewer regions",
          "It has no failover",
        ],
        correctIndex: 1,
        explanation:
          "Active-active lets every region accept writes, which makes concurrent modification of the same record possible — so conflict resolution becomes mandatory — and it needs global load balancing with latency routing and health checks. Active-passive has a single writer and far simpler consistency.",
      },
      {
        question:
          "What consistency risk does asynchronous replication introduce?",
        options: [
          "Writes are lost immediately",
          "A user can read stale data from a distant replica, breaking read-your-own-writes",
          "The database becomes read-only",
          "Latency drops to zero",
        ],
        correctIndex: 1,
        explanation:
          "Asynchronous replicas lag behind the primary, so a read from another region can return data that predates the user own write. Mitigations include pinning the user to the write region briefly and routing reads of recently written keys to the primary.",
      },
    ],
  },
};

export default TOPIC_CONTENT_PART9;

