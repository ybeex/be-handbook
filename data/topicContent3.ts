// Part 3: Architecture, Scaling, DevOps, System Design topics

import type { TopicContent } from './contentTypes';

export const TOPIC_CONTENT_PART3: Record<string, TopicContent> = {

  // ─── ARCHITECTURE ─────────────────────────────────────────────────────────

  'monolith': {
    slug: 'monolith',
    title: 'Monoliths vs Microservices',
    tagline: 'Choosing the right architecture for your stage — and why most teams should start monolithic',
    sections: [
      { type: 'text', heading: 'What is a Monolith?', content: 'A monolith is a single deployable unit containing all application functionality. The frontend, backend API, business logic, and data access layer are all in one codebase, deployed together as one process.\n\nMonoliths are not inherently bad. They are simpler to develop, test, and deploy. Netflix, Amazon, and Shopify all started as monoliths. The monolith becomes a problem when the codebase grows to the point where teams step on each other, or when specific parts need to scale independently.' },
      { type: 'analogy', heading: 'Swiss Army Knife vs Toolbox', content: 'A monolith is like a Swiss Army knife — everything in one compact tool. Perfect for most tasks. Simple to carry, simple to use. But if you are a professional carpenter who cuts wood all day, you want a dedicated saw, not a tiny blade among 20 other tools.\n\nMicroservices are a professional toolbox — specialized tools, each excellent at its job, all working together. More powerful for specialists, but you need a bigger workshop to store them and coordination to use them.' },
      { type: 'comparison', heading: 'Monolith vs Microservices', headers: ['Monolith', 'Microservices'], rows: [
        { aspect: 'Deployment',   Monolith: 'Deploy entire application as one unit', Microservices: 'Deploy each service independently' },
        { aspect: 'Development',  Monolith: 'Fast initially, slows as codebase grows', Microservices: 'Slower to start, scales better with many teams' },
        { aspect: 'Testing',      Monolith: 'Simple end-to-end testing', Microservices: 'Complex — integration and contract testing needed' },
        { aspect: 'Scaling',      Monolith: 'Scale entire app even if only one feature is hot', Microservices: 'Scale only bottleneck services' },
        { aspect: 'Data',         Monolith: 'Single shared database — easy JOINs', Microservices: 'Each service owns its data — no cross-service JOINs' },
        { aspect: 'Debugging',    Monolith: 'Single log stream, single debugger', Microservices: 'Distributed tracing required (Jaeger, Zipkin)' },
        { aspect: 'Team size',    Monolith: 'Best for 1-20 engineers', Microservices: 'Worth complexity at 20+ engineers, multiple teams' },
        { aspect: 'Latency',      Monolith: 'In-process function calls (nanoseconds)', Microservices: 'Network calls (1-10ms per hop)' },
      ]},
      { type: 'text', heading: 'The Modular Monolith', content: 'The underrated middle ground: a **modular monolith**. A single deployable unit but internally organized into well-defined modules with clear interfaces between them. Modules cannot directly access each other\'s database tables or internal classes — they communicate through APIs.\n\nBenefits: simplicity of deployment with the organizational clarity of microservices. When you eventually need to extract a service, the module boundary is already defined. Shopify, Stack Overflow, and GitHub run largely on well-organized monoliths or modular monoliths.' },
      { type: 'code', heading: 'Modular Monolith Structure', language: 'typescript', label: 'modular-monolith.ts', code: `// Modular monolith: clear module boundaries, no cross-module DB access
// src/
//   modules/
//     users/
//       users.controller.ts
//       users.service.ts
//       users.repository.ts  (only users module touches users table)
//       users.types.ts
//     orders/
//       orders.controller.ts
//       orders.service.ts    (calls users.service via interface, not DB)
//       orders.repository.ts
//     payments/
//       payments.service.ts  (calls orders.service, not orders table)
//   shared/
//     events/event-bus.ts    (in-process event bus for decoupling)
//     database/connection.ts

// Module interface — what orders can call on users
interface UserService {
  findById(id: string): Promise<User | null>;
  getUserEmail(id: string): Promise<string>;
}

// Order service depends on UserService interface, not UserRepository
class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private userService: UserService, // Injected — swappable
    private eventBus: EventBus,
  ) {}

  async createOrder(userId: string, items: OrderItem[]) {
    const user = await this.userService.findById(userId);
    if (!user) throw new Error('User not found');

    const order = await this.orderRepo.create({ userId, items });

    // Event-based decoupling — payments module subscribes
    this.eventBus.emit('order.created', { orderId: order.id, userId, total: order.total });

    return order;
  }
}

// Later: extracting OrderService to a microservice requires
// only changing the UserService implementation from
// direct function call → HTTP call to users-service` },
      { type: 'callout', calloutType: 'gold', heading: 'The Migration Path', content: 'Martin Fowler calls the pattern "Strangler Fig" — gradually replace monolith functionality with microservices, like a strangler fig vine slowly replacing a host tree. Route specific endpoints to new services while the monolith still handles everything else. Never attempt a full rewrite. Amazon, Netflix, Twitter — all migrated from monoliths using this incremental approach over years.' },
    ],
    quiz: [
      { question: 'When does moving from a monolith to microservices make sense?', options: ['Immediately — always start with microservices', 'When the application handles more than 1000 requests per second', 'When organizational friction (teams blocking each other, slow deployments) outweighs the operational complexity cost', 'When the programming language needs to change'], correctIndex: 2, explanation: 'Microservices solve organizational scale problems — multiple teams interfering with each other\'s deployments, inability to scale specific features independently. The cost is massive operational complexity. If you do not have the organizational problem, microservices create complexity with no benefit. Start monolithic, extract services when friction is demonstrated.' },
    ]
  },

  'microservices': {
    slug: 'microservices',
    title: 'Microservices Deep Dive',
    tagline: 'Building distributed systems — patterns, challenges, and production reality',
    sections: [
      { type: 'text', heading: 'Microservices Defined', content: 'Microservices architecture structures an application as a collection of small, independently deployable services. Each service:\n\n- Has a **single responsibility** (bounded context from domain-driven design)\n- **Owns its data** (no shared database tables)\n- **Communicates via APIs** (HTTP/REST, gRPC, or async messaging)\n- **Deploys independently** (releases on its own schedule)\n- **Fails independently** (a bug in recommendations does not crash checkout)\n\nThe "micro" in microservices refers not to size but to scope of responsibility.' },
      { type: 'code', heading: 'Service Communication Patterns', language: 'typescript', label: 'service-communication.ts', code: `// ── Synchronous: HTTP/gRPC (request-response) ────────────────
// Simple but creates temporal coupling — caller waits
class OrderService {
  constructor(private http: HttpClient) {}

  async getOrderWithUser(orderId: string) {
    // Parallel HTTP calls — don't await sequentially
    const [order, user] = await Promise.all([
      this.http.get<Order>(\`http://order-service/orders/\${orderId}\`),
      this.http.get<User>(\`http://user-service/users/\${order?.userId}\`),
    ]);
    return { ...order, user };
  }
}

// ── Asynchronous: Message Queue (event-driven) ─────────────────
// Decoupled — publisher doesn't wait, consumer processes when ready
import { Kafka } from 'kafkajs';
const kafka = new Kafka({ brokers: [process.env.KAFKA_BROKER!] });

// Order service PUBLISHES event (doesn't know who consumes it)
const producer = kafka.producer();
await producer.connect();

async function placeOrder(order: Order) {
  const saved = await db.orders.create(order);

  await producer.send({
    topic: 'order.placed',
    messages: [{
      key: saved.id,
      value: JSON.stringify({
        orderId: saved.id,
        userId: order.userId,
        total: order.total,
        items: order.items,
        placedAt: new Date().toISOString(),
      }),
    }],
  });

  return saved;
}

// Inventory service SUBSCRIBES (independent lifecycle)
const consumer = kafka.consumer({ groupId: 'inventory-service' });
await consumer.connect();
await consumer.subscribe({ topic: 'order.placed', fromBeginning: false });

await consumer.run({
  eachMessage: async ({ message }) => {
    const order = JSON.parse(message.value!.toString());
    await reserveInventory(order.items);
  },
});` },
      { type: 'text', heading: 'Critical Patterns', content: '**API Gateway** — Single entry point. Handles auth, rate limiting, routing, SSL termination, request aggregation. Clients talk to gateway, not individual services.\n\n**Service Discovery** — Services register themselves (Consul, Kubernetes Services). Others find them dynamically without hardcoded addresses.\n\n**Circuit Breaker** — When a downstream service fails repeatedly, stop calling it for a cooldown period. Prevents cascade failures. Libraries: Resilience4j, opossum.\n\n**Saga Pattern** — Distributed transactions using a sequence of local transactions with compensating rollbacks if any step fails. Essential for operations spanning multiple services.\n\n**Sidecar Pattern** — Deploy infrastructure concerns (logging, auth, TLS, tracing) as a separate container alongside each service. Kubernetes implements this via Istio service mesh.' },
      { type: 'code', heading: 'Circuit Breaker Implementation', language: 'typescript', label: 'circuit-breaker.ts', code: `import CircuitBreaker from 'opossum';

// Wrap the unreliable service call
const options = {
  timeout: 3000,           // If takes longer than 3s, fail
  errorThresholdPercentage: 50, // Open circuit if 50% of calls fail
  resetTimeout: 30000,     // Try again after 30s
  volumeThreshold: 5,      // Min 5 calls before evaluating error rate
};

const breaker = new CircuitBreaker(
  (userId: string) => userService.getUser(userId),
  options
);

breaker.on('open', () => console.error('Circuit breaker OPENED — user-service is unhealthy'));
breaker.on('halfOpen', () => console.log('Circuit breaker testing user-service...'));
breaker.on('close', () => console.log('Circuit breaker CLOSED — user-service recovered'));

// Usage — automatically handles failure states
async function getOrderWithUser(orderId: string) {
  const order = await db.orders.findById(orderId);

  try {
    // Falls back to cached data if circuit is open
    const user = await breaker.fire(order.userId);
    return { ...order, user };
  } catch {
    // Circuit open or call failed — return partial data
    return { ...order, user: { id: order.userId, name: 'Unknown' } };
  }
}` },
      { type: 'callout', calloutType: 'danger', heading: 'Microservices Failure Modes', content: 'Cascade failures: Service A calls Service B which calls Service C. C is slow. B\'s threads all block waiting for C. B becomes slow. A\'s threads block on B. The entire system grinds to a halt from one slow service. Solutions: timeouts on all outbound calls, circuit breakers, bulkheads (dedicated thread pools per downstream), and async messaging where possible.' },
    ],
    quiz: [
      { question: 'What is the main purpose of a Circuit Breaker in microservices?', options: ['Load balancing requests across service instances', 'Encrypting service-to-service communication', 'Stopping calls to a failing service to prevent cascade failures', 'Routing requests based on URL path'], correctIndex: 2, explanation: 'A Circuit Breaker monitors calls to a downstream service. When failures exceed a threshold, it "trips open" — subsequent calls immediately fail fast without attempting the downstream call. After a cooldown period it "half-opens" to test recovery. This prevents a slow/failed service from cascading into full system failure.' },
    ]
  },

  'event-driven': {
    slug: 'event-driven',
    title: 'Event-Driven Architecture',
    tagline: 'Decoupling systems with asynchronous events — the backbone of scalable distributed systems',
    sections: [
      { type: 'text', heading: 'What is Event-Driven Architecture?', content: 'In event-driven architecture (EDA), components communicate by producing and consuming events — immutable records of something that happened. Producers emit events without knowing who will consume them. Consumers subscribe to event types they care about.\n\nThis creates **temporal decoupling**: the producer does not wait for consumers. And **spatial decoupling**: the producer does not know consumer addresses or even if any consumers exist.' },
      { type: 'analogy', heading: 'Newspaper Publisher Analogy', content: 'A newspaper publisher prints the daily edition and sends it to subscribers. The publisher does not know who reads it or when. Each subscriber reads it independently and acts on the information however they choose. New subscribers can be added without the publisher changing anything.\n\nEDA works identically. The "order.placed" event is the newspaper. The inventory service, email service, and analytics service are subscribers — each acting independently on the same event.' },
      { type: 'code', heading: 'Event-Driven Order Processing', language: 'typescript', label: 'event-driven.ts', code: `// ── Event definitions (immutable records) ────────────────────
interface OrderPlacedEvent {
  eventType: 'order.placed';
  eventId: string;
  timestamp: string;
  aggregateId: string; // orderId
  payload: {
    orderId: string;
    userId: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    total: number;
  };
}

// ── Producer: Order Service ───────────────────────────────────
class OrderService {
  async placeOrder(userId: string, items: CartItem[]) {
    // 1. Save order (local transaction)
    const order = await this.db.orders.create({ userId, items, status: 'pending' });

    // 2. Publish event (outbox pattern for reliability)
    await this.db.outbox.create({
      eventType: 'order.placed',
      payload: JSON.stringify({
        eventId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        aggregateId: order.id,
        payload: { orderId: order.id, userId, items, total: order.total },
      }),
    });
    // Background worker reads outbox and publishes to Kafka
    // This ensures event is published even if the process crashes

    return order;
  }
}

// ── Consumers: independent services ──────────────────────────
// Inventory Service
kafkaConsumer.subscribe('order.placed', async (event: OrderPlacedEvent) => {
  for (const item of event.payload.items) {
    await inventory.decrement(item.productId, item.quantity);
  }
});

// Email Service
kafkaConsumer.subscribe('order.placed', async (event: OrderPlacedEvent) => {
  const user = await userService.getUser(event.payload.userId);
  await emailService.sendOrderConfirmation(user.email, event.payload);
});

// Analytics Service (eventual consistency is fine here)
kafkaConsumer.subscribe('order.placed', async (event: OrderPlacedEvent) => {
  await analytics.recordPurchase({
    userId: event.payload.userId,
    revenue: event.payload.total,
    timestamp: event.timestamp,
  });
});` },
      { type: 'callout', calloutType: 'warning', heading: 'The Outbox Pattern — Avoiding Dual Write Problems', content: 'A common mistake: write to DB AND publish to Kafka in the same operation. If the server crashes after the DB write but before publishing, the event is lost. The outbox pattern: write the event to an outbox table in the same DB transaction as the business data. A background worker reads the outbox and publishes to Kafka. Guarantees exactly-once delivery.' },
      { type: 'comparison', heading: 'Choreography vs Orchestration', headers: ['Choreography', 'Orchestration'], rows: [
        { aspect: 'Control',      Choreography: 'Services react to events autonomously', Orchestration: 'Central orchestrator directs each step' },
        { aspect: 'Coupling',     Choreography: 'Decoupled — no central brain', Orchestration: 'Orchestrator knows all participants' },
        { aspect: 'Visibility',   Choreography: 'Hard to see overall flow', Orchestration: 'Easy to visualize end-to-end' },
        { aspect: 'Error handling',Choreography: 'Each service handles own failures', Orchestration: 'Orchestrator manages retries and rollbacks' },
        { aspect: 'Best for',     Choreography: 'Loose coupling, independent evolution', Orchestration: 'Complex multi-step workflows, financial transactions' },
        { aspect: 'Examples',     Choreography: 'Kafka event streams', Orchestration: 'AWS Step Functions, Temporal.io' },
      ]},
    ],
    quiz: [
      { question: 'What is the primary benefit of event-driven architecture over synchronous request-response?', options: ['Events are faster than HTTP calls', 'Producers and consumers are temporally and spatially decoupled', 'Events automatically handle authentication', 'Event-driven systems require less infrastructure'], correctIndex: 1, explanation: 'The core benefit is decoupling: the producer does not wait for consumers (temporal decoupling), does not need to know consumer addresses (spatial decoupling), and is not affected if a consumer is temporarily unavailable. New consumers can subscribe without any changes to the producer.' },
    ]
  },

  'cqrs': {
    slug: 'cqrs',
    title: 'CQRS & Event Sourcing',
    tagline: 'Separating reads from writes for performance, scalability, and auditability',
    sections: [
      { type: 'text', heading: 'Command Query Responsibility Segregation', content: 'CQRS separates the **write model** (commands: create, update, delete) from the **read model** (queries: get, list, search). Instead of one model doing both, you have two:\n\n**Command side** — Validates and processes mutations. Optimized for correctness and consistency. Typically a normalized relational model.\n\n**Query side** — Optimized for specific read patterns. Can be denormalized, cached, or a completely different data store. Projections are built from events or DB changes.\n\nThis unlocks independent scaling: scale your read database without touching your write database, and vice versa.' },
      { type: 'code', heading: 'CQRS Implementation', language: 'typescript', label: 'cqrs.ts', code: `// ── COMMAND SIDE (writes) ─────────────────────────────────────
// Commands are intentions: "do this"
interface PlaceOrderCommand {
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
}

class PlaceOrderHandler {
  constructor(
    private orderRepo: OrderRepository,     // Write DB (PostgreSQL)
    private eventBus: EventBus,
  ) {}

  async handle(cmd: PlaceOrderCommand): Promise<string> {
    // Validate
    await this.validateInventory(cmd.items);

    // Write to normalized write model
    const order = await this.orderRepo.create({
      userId: cmd.userId,
      items: cmd.items,
      status: 'pending',
      placedAt: new Date(),
    });

    // Emit event — read models will update asynchronously
    await this.eventBus.emit('order.placed', { orderId: order.id, ...cmd });

    return order.id;
  }
}

// ── QUERY SIDE (reads) ────────────────────────────────────────
// Queries return DTOs optimized for UI — not domain objects

// Denormalized read model (could be in Elasticsearch, Redis, or a read replica)
interface OrderListItemView {
  orderId: string;
  customerName: string;
  customerEmail: string;
  itemCount: number;
  total: number;
  statusLabel: string;
  placedAt: string;
}

class OrderQueryService {
  // Read from denormalized view — no JOINs needed
  async listOrders(filters: OrderFilters): Promise<OrderListItemView[]> {
    return this.readDb.query(
      'SELECT * FROM order_list_view WHERE user_id = $1 ORDER BY placed_at DESC LIMIT $2',
      [filters.userId, filters.limit]
    );
  }
}

// ── PROJECTION: Builds the read model ────────────────────────
// Runs asynchronously when 'order.placed' event fires
eventBus.on('order.placed', async (event) => {
  const user = await userReadRepo.findById(event.userId);
  const products = await productReadRepo.findMany(event.items.map(i => i.productId));

  // Build and store denormalized view
  await readDb.query(\`
    INSERT INTO order_list_view (order_id, customer_name, customer_email, item_count, total, placed_at)
    VALUES ($1, $2, $3, $4, $5, $6)
  \`, [event.orderId, user.name, user.email, event.items.length, computeTotal(event.items, products), event.timestamp]);
});` },
      { type: 'text', heading: 'Event Sourcing', content: 'Event sourcing stores the **sequence of events** that led to current state, rather than current state itself. Instead of "account balance = $500," you store: "deposited $1000, withdrew $300, deposited $100, withdrew $300 = $500."\n\nBenefits: complete audit trail, ability to replay events to rebuild state, ability to project events into any read model, temporal queries ("what was the balance on March 1st?").\n\nChallenges: complexity, eventual consistency between write and read models, "versioning" events as schemas change, and performance (replaying millions of events to rebuild state requires snapshotting).' },
      { type: 'callout', calloutType: 'gold', heading: 'When to Use CQRS', content: 'CQRS adds significant complexity — do not use it by default. It shines when: read and write loads are dramatically different (reads 100x writes), read requirements are complex (many different views of same data), you need a full audit trail, or different teams own reads vs writes. Avoid for simple CRUD applications — the overhead exceeds the benefit.' },
    ],
    quiz: [
      { question: 'What is the core idea behind CQRS?', options: ['All database queries must be cached', 'Write operations and read operations use separate models optimized for each purpose', 'Commands are synchronous and queries are asynchronous', 'SQL SELECT statements are separated from INSERT/UPDATE/DELETE'], correctIndex: 1, explanation: 'CQRS separates the write model (commands) from the read model (queries). The write model is optimized for correctness and transactional integrity. The read model is optimized for query performance — often denormalized, pre-computed projections. This enables independent scaling and optimization of each side.' },
    ]
  },

  'clean-arch': {
    slug: 'clean-arch',
    title: 'Clean Architecture',
    tagline: 'Organizing code so business logic is independent of frameworks, databases, and delivery mechanisms',
    sections: [
      { type: 'text', heading: 'What is Clean Architecture?', content: 'Clean Architecture (Robert Martin, 2012) organizes code into concentric layers where the **dependency rule** is absolute: dependencies only point inward. Inner layers define interfaces; outer layers implement them.\n\n**Entities (innermost)** — Core business objects and rules. Independent of everything.\n\n**Use Cases** — Application-specific business logic. Orchestrates entities.\n\n**Interface Adapters** — Converts data between use cases and external agencies (HTTP controllers, database mappers).\n\n**Frameworks & Drivers (outermost)** — Express, Prisma, Redis, external APIs. Easily replaceable.' },
      { type: 'code', heading: 'Clean Architecture in TypeScript', language: 'typescript', label: 'clean-arch.ts', code: `// ── LAYER 1: Entities — pure business rules, no dependencies ──
// entities/Order.ts
export class Order {
  private items: OrderItem[];
  private status: OrderStatus;

  constructor(private readonly userId: string, items: OrderItem[]) {
    if (items.length === 0) throw new Error('Order must have at least one item');
    this.items = items;
    this.status = 'pending';
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  confirm() {
    if (this.status !== 'pending') throw new Error('Only pending orders can be confirmed');
    this.status = 'confirmed';
  }
}

// ── LAYER 2: Use Cases — application logic, defines interfaces ─
// use-cases/PlaceOrder.ts
interface OrderRepository {        // Interface defined HERE, implemented in layer 4
  save(order: Order): Promise<string>;
}
interface PaymentGateway {
  charge(amount: number, userId: string): Promise<{ transactionId: string }>;
}
interface NotificationService {
  send(userId: string, message: string): Promise<void>;
}

export class PlaceOrderUseCase {
  constructor(
    private orderRepo: OrderRepository,
    private payment: PaymentGateway,
    private notifications: NotificationService,
  ) {}

  async execute(userId: string, items: OrderItem[]): Promise<string> {
    const order = new Order(userId, items);
    const { transactionId } = await this.payment.charge(order.total, userId);
    order.confirm();
    const orderId = await this.orderRepo.save(order);
    await this.notifications.send(userId, \`Order \${orderId} confirmed!\`);
    return orderId;
  }
}

// ── LAYER 3: Interface Adapters ───────────────────────────────
// controllers/OrderController.ts
export class OrderController {
  constructor(private useCase: PlaceOrderUseCase) {}

  async handlePost(req: Request, res: Response) {
    try {
      const orderId = await this.useCase.execute(req.user.id, req.body.items);
      res.status(201).json({ orderId });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  }
}

// ── LAYER 4: Frameworks — implements interfaces from layer 2 ───
// infrastructure/PrismaOrderRepository.ts
export class PrismaOrderRepository implements OrderRepository {
  async save(order: Order): Promise<string> {
    const saved = await prisma.order.create({
      data: { userId: order.userId, total: order.total, status: 'confirmed' }
    });
    return saved.id;
  }
}

// Dependency injection — wire everything together at startup
const orderRepo = new PrismaOrderRepository();
const payment = new StripePaymentGateway();
const notifications = new SendGridNotificationService();
const useCase = new PlaceOrderUseCase(orderRepo, payment, notifications);
const controller = new OrderController(useCase);
app.post('/orders', (req, res) => controller.handlePost(req, res));` },
      { type: 'callout', calloutType: 'gold', heading: 'Testability is the Key Benefit', content: 'Clean Architecture\'s primary payoff is testability. Your use case tests inject mock implementations of all dependencies — no database, no HTTP, no external services needed. Tests run in milliseconds. Swapping PostgreSQL for DynamoDB requires changing only the repository implementation, not any business logic. The business rules become the stable core that outlives any specific framework or database.' },
    ],
    quiz: [
      { question: 'What is the Dependency Rule in Clean Architecture?', options: ['Outer layers must implement interfaces defined by inner layers', 'All dependencies must point inward — inner layers know nothing about outer layers', 'Frameworks are not allowed to have dependencies', 'Use cases depend on controllers for their inputs'], correctIndex: 1, explanation: 'The Dependency Rule states all source code dependencies can only point inward. The Entity layer knows nothing about Use Cases. Use Cases know nothing about Controllers. Controllers know nothing about Express. This means business logic is completely isolated from implementation details, making it independently testable and replaceable.' },
    ]
  },

  // ─── SCALING ──────────────────────────────────────────────────────────────

  'caching': {
    slug: 'caching',
    title: 'Caching Strategies',
    tagline: 'The fastest query is the one you never make — cache patterns and invalidation',
    hasVisualizer: 'cache',
    sections: [
      { type: 'text', heading: 'Why Cache?', content: 'Database queries take 1-10ms. Redis cache reads take 0.1-0.5ms. For data that is read frequently and changes infrequently, serving from cache is 10-100x faster and eliminates database load entirely. A well-tuned cache can serve 99% of read traffic without touching the database.\n\nThe goal: serve the most popular data from memory, use the database only for cache misses and writes.' },
      { type: 'analogy', heading: 'Memory and Textbooks', content: 'Before an exam, you study and remember key facts (cache them in your short-term memory). During the exam, you recall from memory instantly rather than reopening the textbook (database query). When your memory fails, you glance at your notes (cache miss → database hit). After the exam ends (TTL expires), you forget the specific facts.\n\nSmart caching: cache what is asked most often. Evict what is rarely asked. Refresh before it goes stale.' },
      { type: 'code', heading: 'Cache Patterns', language: 'typescript', label: 'cache-patterns.ts', code: `import Redis from 'ioredis';
const r = new Redis(process.env.REDIS_URL);

// ── Cache-Aside (Lazy Loading) — most common ──────────────────
async function getUser(id: string): Promise<User> {
  const key = \`user:\${id}\`;
  const cached = await r.get(key);
  if (cached) return JSON.parse(cached);          // Cache HIT

  const user = await db.users.findById(id);       // Cache MISS
  if (user) await r.setex(key, 300, JSON.stringify(user)); // Store 5 min
  return user;
}

// Invalidate on update
async function updateUser(id: string, data: Partial<User>) {
  const user = await db.users.update(id, data);
  await r.del(\`user:\${id}\`);                     // Invalidate cache
  return user;
}

// ── Write-Through — always write to cache AND DB ──────────────
async function updateUserWriteThrough(id: string, data: Partial<User>) {
  const user = await db.users.update(id, data);
  await r.setex(\`user:\${id}\`, 300, JSON.stringify(user));  // Always update cache
  return user; // Cache always fresh — no stale reads
}

// ── Cache stampede protection ─────────────────────────────────
// Problem: 1000 requests hit expired key simultaneously → DB overload
async function getWithLock(key: string, loader: () => Promise<any>, ttl: number) {
  const cached = await r.get(key);
  if (cached) return JSON.parse(cached);

  // Only one requester fetches from DB
  const lockKey = \`lock:\${key}\`;
  const lockId = crypto.randomUUID();
  const acquired = await r.set(lockKey, lockId, 'NX', 'EX', 10);

  if (!acquired) {
    // Wait for lock holder to populate cache
    await new Promise(r => setTimeout(r, 50));
    return getWithLock(key, loader, ttl); // Retry
  }

  try {
    const value = await loader();
    await r.setex(key, ttl, JSON.stringify(value));
    return value;
  } finally {
    // Release lock (only if we still own it)
    const script = \`
      if redis.call('get', KEYS[1]) == ARGV[1] then
        return redis.call('del', KEYS[1])
      else return 0 end\`;
    await r.eval(script, 1, lockKey, lockId);
  }
}

// ── Cache invalidation strategies ────────────────────────────
// Strategy 1: TTL (simplest — accept brief staleness)
await r.setex('product:catalog', 3600, data); // Stale for up to 1 hour

// Strategy 2: Event-based invalidation (strong consistency)
eventBus.on('product.updated', async ({ productId }) => {
  await r.del(\`product:\${productId}\`);          // Immediate invalidation
  await r.del('product:list:*');                 // Invalidate related lists
});

// Strategy 3: Cache versioning (for bulk invalidation)
const version = await r.get('product:version') || '0';
const key = \`product:list:v\${version}\`;
// To invalidate ALL product caches: incr('product:version')
await r.incr('product:version');` },
      { type: 'comparison', heading: 'Eviction Policies', headers: ['Policy', 'Evicts', 'Best For'], rows: [
        { aspect: 'LRU',       Policy: 'LRU',       Evicts: 'Least recently accessed item',      'Best For': 'General caches — keeps hot data warm' },
        { aspect: 'LFU',       Policy: 'LFU',       Evicts: 'Least frequently accessed item',    'Best For': 'Popularity-skewed data (top 20% of items = 80% of traffic)' },
        { aspect: 'TTL',       Policy: 'TTL',        Evicts: 'Items past their expiry time',     'Best For': 'Time-sensitive data, API responses, sessions' },
        { aspect: 'FIFO',      Policy: 'FIFO',       Evicts: 'Oldest-inserted item',             'Best For': 'Simple queues, rarely used for caches' },
        { aspect: 'Random',    Policy: 'Random',     Evicts: 'Random item',                      'Best For': 'Surprisingly effective when access patterns are unpredictable' },
        { aspect: 'allkeys-lru',Policy:'allkeys-lru', Evicts: 'LRU across all keys when full', 'Best For': 'Redis configured as pure cache (maxmemory-policy)' },
      ]},
      { type: 'callout', calloutType: 'gold', heading: 'Cache Hit Rate Targets', content: 'For read-heavy applications: target 95%+ hit rate. At 80% hit rate, 20% of requests still hit the database — if traffic doubles, database load grows significantly. Measure hit rate by tracking cache hits vs misses. Low hit rate causes: TTL too short, cache too small, poor key design, or caching wrong data. Start with the highest-traffic endpoints.' },
    ],
    quiz: [
      { question: 'What is a cache stampede?', options: ['When cached data becomes corrupted', 'When many requests simultaneously hit an expired cache key and all query the database', 'When the cache server runs out of memory', 'When TTL is set too low causing rapid eviction'], correctIndex: 1, explanation: 'A cache stampede (dog-piling) occurs when a popular key expires and many concurrent requests all miss the cache simultaneously, all hitting the database at once. Solutions: mutex/locking (only one request fetches), probabilistic early expiry (refresh before expiry with probability proportional to time remaining), or background refresh.' },
    ]
  },

  'load-balancing': {
    slug: 'load-balancing',
    title: 'Load Balancing',
    tagline: 'Distributing traffic across servers for scale and high availability',
    hasVisualizer: 'loadbalancer',
    sections: [
      { type: 'text', heading: 'What is Load Balancing?', content: 'A load balancer distributes incoming network traffic across multiple backend servers. This provides:\n\n**Scalability** — Add more servers to handle more load. The load balancer automatically distributes traffic to new instances.\n\n**High Availability** — If one server fails, the load balancer stops sending traffic to it and routes to healthy servers. No single point of failure.\n\n**SSL Termination** — The load balancer handles TLS, reducing CPU load on backend servers.\n\n**Health Checking** — Continuously monitors backend health, removing failed instances from the rotation.' },
      { type: 'code', heading: 'Nginx Load Balancer Configuration', language: 'nginx', label: 'nginx-lb.conf', code: `# /etc/nginx/sites-available/api.example.com

upstream api_backend {
  # Algorithm: least_conn, ip_hash, or round-robin (default)
  least_conn;

  # Backend servers with weights and health check params
  server api1.internal:3000 weight=3 max_fails=3 fail_timeout=30s;
  server api2.internal:3000 weight=2 max_fails=3 fail_timeout=30s;
  server api3.internal:3000 weight=1 max_fails=3 fail_timeout=30s;
  server api4.internal:3000 backup;  # Only used when others are down

  # Keep connections warm to backends (avoid TCP handshake per request)
  keepalive 32;
}

server {
  listen 443 ssl http2;
  server_name api.example.com;

  ssl_certificate     /etc/ssl/certs/api.example.com.pem;
  ssl_certificate_key /etc/ssl/private/api.example.com.key;
  ssl_protocols       TLSv1.2 TLSv1.3;

  location / {
    proxy_pass         http://api_backend;
    proxy_http_version 1.1;

    # Forward real client info to backends
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Connection        "";

    # Timeouts
    proxy_connect_timeout  5s;
    proxy_send_timeout     30s;
    proxy_read_timeout     30s;

    # Retry on failure
    proxy_next_upstream error timeout http_502 http_503;
    proxy_next_upstream_tries 2;
  }

  # Health check endpoint (do not proxy — Nginx answers directly)
  location /health {
    return 200 'ok\n' ;
    add_header Content-Type text/plain;
  }
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name api.example.com;
  return 301 https://$host$request_uri;
}` },
      { type: 'comparison', heading: 'Load Balancing Algorithms', headers: ['Algorithm', 'How It Works', 'Best For'], rows: [
        { aspect: 'Round Robin',          Algorithm: 'Round Robin',          'How It Works': 'Each request to next server in rotation',       'Best For': 'Uniform requests, equal server capacity' },
        { aspect: 'Weighted Round Robin', Algorithm: 'Weighted Round Robin', 'How It Works': 'Proportion by weight — server 3 gets 3x server 1', 'Best For': 'Mixed server capacities' },
        { aspect: 'Least Connections',    Algorithm: 'Least Connections',    'How It Works': 'Route to server with fewest active connections', 'Best For': 'Variable request duration (some fast, some slow)' },
        { aspect: 'IP Hash',              Algorithm: 'IP Hash',              'How It Works': 'Same client IP always routes to same server',     'Best For': 'Session affinity (stateful backends)' },
        { aspect: 'Random',               Algorithm: 'Random',               'How It Works': 'Pick a random healthy server',                   'Best For': 'Similar to round robin with less overhead' },
        { aspect: 'Least Response Time',  Algorithm: 'Least Response Time',  'How It Works': 'Route to server with lowest avg latency',        'Best For': 'Mixed workloads with performance variance' },
      ]},
      { type: 'callout', calloutType: 'gold', heading: 'AWS Application Load Balancer', content: 'AWS ALB is a Layer 7 load balancer supporting path-based routing (/api/* → API servers, /static/* → S3), host-based routing (api.example.com vs app.example.com), and weighted target groups for canary deployments (5% traffic to new version). It integrates with ECS, EKS, and Lambda. ALB with Auto Scaling Groups automatically adds/removes EC2 instances based on CPU or custom CloudWatch metrics.' },
    ],
    quiz: [
      { question: 'Which load balancing algorithm ensures the same user always reaches the same backend server?', options: ['Round Robin', 'Least Connections', 'IP Hash (sticky sessions)', 'Random'], correctIndex: 2, explanation: 'IP Hash computes a hash of the client\'s IP address and maps it to a specific backend. The same IP always maps to the same server, creating "sticky sessions." This is needed when session state is stored in-process on the backend. The better solution is storing session state externally (Redis) so any backend can serve any user.' },
    ]
  },

  'cdn': {
    slug: 'cdn',
    title: 'CDN',
    tagline: 'Serving content from the edge — closer to users, faster responses globally',
    sections: [
      { type: 'text', heading: 'What is a CDN?', content: 'A Content Delivery Network (CDN) is a globally distributed network of servers ("Points of Presence" or PoPs) that cache and serve content from the location geographically closest to the requesting user.\n\nWithout CDN: a user in Lagos requesting your content from your US-East server experiences 200ms+ round-trip latency. With CDN: their request hits a Cloudflare PoP in Lagos serving the cached content in <20ms.\n\nCDNs cache: static assets (images, CSS, JS, fonts), API responses, HTML pages, and increasingly, edge-computed dynamic responses.' },
      { type: 'comparison', heading: 'What to Cache vs Not Cache', headers: ['Cache at CDN Edge', 'Do Not Cache at Edge'], rows: [
        { aspect: 'Static',   'Cache at CDN Edge': 'Images, fonts, CSS, JS files', 'Do Not Cache at Edge': 'User-specific API responses' },
        { aspect: 'Content',  'Cache at CDN Edge': 'Public blog posts, product pages', 'Do Not Cache at Edge': 'Authenticated account data' },
        { aspect: 'Assets',   'Cache at CDN Edge': 'Video/audio files, PDFs', 'Do Not Cache at Edge': 'Real-time data (prices, inventory)' },
        { aspect: 'Pages',    'Cache at CDN Edge': 'Marketing/landing pages', 'Do Not Cache at Edge': 'Shopping carts, checkout flows' },
        { aspect: 'API',      'Cache at CDN Edge': 'Public product catalog, public search results', 'Do Not Cache at Edge': 'Anything requiring auth or per-user personalization' },
      ]},
      { type: 'code', heading: 'Cache-Control Headers for CDN', language: 'typescript', label: 'cdn-headers.ts', code: `// Static assets — cache forever (use versioned filenames)
app.use('/static', express.static('public', {
  maxAge: '1y',      // Cache for 1 year at CDN and browser
  immutable: true,   // Content never changes at this URL
  // Use: /static/app.abc123def.js (hash in filename)
  // When code changes, filename changes → cache busting automatic
}));

// Public API responses — cache at CDN for short period
app.get('/api/products', async (req, res) => {
  const products = await getProducts();

  res.set({
    'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
    // public = CDN can cache
    // max-age=300 = browser caches for 5 minutes
    // s-maxage=600 = CDN caches for 10 minutes (overrides max-age for shared caches)
    // stale-while-revalidate=86400 = serve stale for up to 24h while revalidating
    'Vary': 'Accept-Encoding', // Cache separate copies per encoding
    'ETag': generateETag(products), // For conditional requests
  });

  res.json(products);
});

// User-specific — never cache at CDN
app.get('/api/profile', authenticate, (req, res) => {
  res.set('Cache-Control', 'private, no-cache'); // private = only browser cache
  res.json(req.user);
});

// Purge CDN cache via API (Cloudflare example)
async function purgeCdnCache(paths: string[]) {
  await fetch(\`https://api.cloudflare.com/client/v4/zones/\${ZONE_ID}/purge_cache\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${CLOUDFLARE_TOKEN}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: paths.map(p => \`https://example.com\${p}\`) }),
  });
}

// Purge when product changes
await purgeCdnCache(['/api/products', '/api/products/123', '/products/widget-pro']);` },
      { type: 'callout', calloutType: 'gold', heading: 'Edge Computing', content: 'Modern CDNs like Cloudflare Workers and Vercel Edge Functions let you run JavaScript at the CDN edge — 200+ locations globally. This enables: A/B testing at edge (no origin hit), personalization without latency, authentication at edge before hitting origin, geolocation-based routing, and request/response transformation. Edge computing is blurring the line between CDN and application server.' },
    ],
    quiz: [
      { question: 'What HTTP header controls how long a CDN can cache a response independently of browser cache?', options: ['X-Cache-TTL', 'Surrogate-Control', 's-maxage directive in Cache-Control', 'CDN-Cache-Control'], correctIndex: 2, explanation: 'The s-maxage directive in the Cache-Control header sets the cache duration specifically for shared caches (CDNs, proxies). It overrides max-age for CDNs while max-age still controls browser cache. Example: Cache-Control: public, max-age=60, s-maxage=3600 means browsers cache for 1 minute, CDN caches for 1 hour.' },
    ]
  },

  'queues': {
    slug: 'queues',
    title: 'Message Queues',
    tagline: 'Kafka, RabbitMQ, and BullMQ — async processing for scalable, resilient systems',
    sections: [
      { type: 'text', heading: 'Why Message Queues?', content: 'Message queues decouple producers from consumers, enabling:\n\n**Traffic buffering** — Absorb traffic spikes. If 10,000 orders arrive in a second, they queue rather than overwhelming the payment processor.\n\n**Reliability** — Messages persist until processed. If a consumer crashes mid-processing, the message is requeued and retried.\n\n**Async processing** — The HTTP request returns immediately after enqueuing. Heavy processing happens in the background.\n\n**Fan-out** — One event consumed by multiple independent consumers.' },
      { type: 'comparison', heading: 'Queue Systems Compared', headers: ['Kafka', 'RabbitMQ', 'BullMQ (Redis)'], rows: [
        { aspect: 'Architecture', Kafka: 'Distributed log — consumers track offsets', RabbitMQ: 'Broker-based — routes and acknowledges', 'BullMQ (Redis)': 'Redis-based job queue' },
        { aspect: 'Throughput',   Kafka: 'Millions of events/sec', RabbitMQ: 'Tens of thousands/sec', 'BullMQ (Redis)': 'Thousands/sec' },
        { aspect: 'Retention',    Kafka: 'Configurable (days to forever)', RabbitMQ: 'Until acknowledged', 'BullMQ (Redis)': 'Configurable (Redis memory)' },
        { aspect: 'Replay',       Kafka: 'Yes — any consumer can re-read history', RabbitMQ: 'No — once consumed, gone', 'BullMQ (Redis)': 'Limited (failed job history)' },
        { aspect: 'Complexity',   Kafka: 'High — needs ZooKeeper or KRaft', RabbitMQ: 'Medium — broker to manage', 'BullMQ (Redis)': 'Low — just Redis' },
        { aspect: 'Best for',     Kafka: 'Event streaming, audit logs, big data pipelines', RabbitMQ: 'Task queues, RPC, complex routing', 'BullMQ (Redis)': 'Job queues, scheduled tasks, background processing' },
      ]},
      { type: 'code', heading: 'BullMQ Job Queue', language: 'typescript', label: 'bullmq.ts', code: `import { Queue, Worker, QueueScheduler } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

// ── Define queues ─────────────────────────────────────────────
const emailQueue = new Queue('emails', { connection });
const imageQueue = new Queue('images', { connection,
  defaultJobOptions: {
    attempts: 3,                // Retry failed jobs 3 times
    backoff: { type: 'exponential', delay: 2000 }, // 2s, 4s, 8s delays
    removeOnComplete: 100,      // Keep last 100 completed jobs for inspection
    removeOnFail: 500,          // Keep last 500 failed jobs for debugging
  }
});

// ── Add jobs from HTTP request (returns immediately) ──────────
app.post('/orders', async (req, res) => {
  const order = await db.orders.create(req.body);

  // Queue background jobs — HTTP response doesn't wait for these
  await emailQueue.add('order-confirmation', {
    to: req.user.email,
    orderId: order.id,
  });

  await imageQueue.add('generate-invoice', {
    orderId: order.id,
  }, {
    delay: 5000,  // Process 5 seconds from now
    priority: 1,  // Higher priority than default
  });

  res.status(201).json({ orderId: order.id }); // Immediate response
});

// ── Workers: process jobs in background ───────────────────────
const emailWorker = new Worker('emails', async (job) => {
  const { to, orderId } = job.data;
  await sendEmail(to, 'Order Confirmation', renderTemplate(orderId));
  return { sent: true };
}, { connection, concurrency: 10 }); // Process 10 emails simultaneously

const imageWorker = new Worker('images', async (job) => {
  const { orderId } = job.data;
  const pdf = await generateInvoicePDF(orderId);
  const url = await uploadToS3(pdf, \`invoices/\${orderId}.pdf\`);
  await db.orders.update(orderId, { invoiceUrl: url });
  return { url };
}, { connection, concurrency: 3 }); // Fewer — CPU intensive

// ── Job events ────────────────────────────────────────────────
emailWorker.on('completed', (job, result) => {
  console.log(\`Email job \${job.id} done:\`, result);
});

emailWorker.on('failed', (job, err) => {
  console.error(\`Email job \${job?.id} failed (attempt \${job?.attemptsMade}):\`, err.message);
});

// ── Scheduled/recurring jobs ──────────────────────────────────
const scheduler = new QueueScheduler('emails', { connection });

// Every day at 9am
await emailQueue.add(
  'daily-digest',
  { type: 'digest' },
  { repeat: { cron: '0 9 * * *' } }
);` },
      { type: 'callout', calloutType: 'gold', heading: 'Kafka at LinkedIn', content: 'LinkedIn created Kafka in 2011 to handle their activity stream — 7 trillion messages per day across 4,400 brokers. Every page view, click, message, and job application is an event flowing through Kafka. Consumers include real-time analytics, machine learning pipelines, activity feeds, and email triggers. Kafka\'s key insight: treating an event stream like a distributed, replicated, ordered log that any consumer can read from any offset.' },
    ],
    quiz: [
      { question: 'What is the key advantage of Kafka over traditional message queues like RabbitMQ?', options: ['Kafka is easier to set up', 'Kafka allows consumers to replay events by re-reading from any offset in the log', 'Kafka delivers messages faster', 'Kafka handles larger individual message sizes'], correctIndex: 1, explanation: 'Kafka stores messages in an immutable distributed log with configurable retention. Any consumer can seek to any position and re-read events. This enables: adding new consumers that process historical data, replaying events to rebuild read models, debugging by replaying production events, and multiple independent consumers of the same event stream.' },
    ]
  },

  'rate-limiting': {
    slug: 'rate-limiting',
    title: 'Rate Limiting',
    tagline: 'Protecting your APIs from abuse, DoS attacks, and runaway clients',
    sections: [
      { type: 'text', heading: 'Why Rate Limiting?', content: 'Without rate limiting, a single client can overwhelm your API — whether malicious (DoS attack), buggy (runaway retry loop), or just heavy (crawler). Rate limiting protects your infrastructure, ensures fair usage across clients, and prevents abuse.\n\nRate limiting occurs at multiple levels: per IP, per API key, per user, per endpoint, or globally. Different limits apply to different operations — a search endpoint can handle 60 req/min, a payment endpoint might be capped at 10 req/min.' },
      { type: 'code', heading: 'Rate Limiting Algorithms', language: 'typescript', label: 'rate-limiting.ts', code: `import Redis from 'ioredis';
const r = new Redis(process.env.REDIS_URL);

// ── Fixed Window Counter (simplest) ──────────────────────────
// Problem: burst attack at window boundary (200 req in last second of window + 200 in first second of next)
async function fixedWindow(clientId: string, limit: number, windowSecs: number): Promise<boolean> {
  const window = Math.floor(Date.now() / 1000 / windowSecs);
  const key = \`ratelimit:fixed:\${clientId}:\${window}\`;

  const count = await r.incr(key);
  if (count === 1) await r.expire(key, windowSecs * 2);

  return count <= limit;
}

// ── Sliding Window Log (most accurate) ───────────────────────
// Stores timestamp of each request — memory intensive at scale
async function slidingWindowLog(clientId: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const key = \`ratelimit:log:\${clientId}\`;

  const pipeline = r.pipeline();
  pipeline.zremrangebyscore(key, 0, now - windowMs); // Remove old entries
  pipeline.zadd(key, now, \`\${now}-\${Math.random()}\`);
  pipeline.zcard(key);
  pipeline.expire(key, Math.ceil(windowMs / 1000));

  const results = await pipeline.exec();
  const count = results![2][1] as number;
  return count <= limit;
}

// ── Token Bucket (allows bursts) ──────────────────────────────
// Tokens accumulate at a rate; each request consumes one token
async function tokenBucket(
  clientId: string,
  capacity: number,     // Max burst size
  refillRate: number,   // Tokens per second
): Promise<boolean> {
  const key = \`ratelimit:bucket:\${clientId}\`;
  const now = Date.now() / 1000;

  const script = \`
    local tokens = tonumber(redis.call('hget', KEYS[1], 'tokens'))
    local lastRefill = tonumber(redis.call('hget', KEYS[1], 'last_refill'))
    local capacity = tonumber(ARGV[1])
    local refillRate = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])

    if tokens == nil then
      tokens = capacity
      lastRefill = now
    end

    -- Refill tokens based on time elapsed
    local elapsed = now - lastRefill
    tokens = math.min(capacity, tokens + elapsed * refillRate)
    lastRefill = now

    local allowed = 0
    if tokens >= 1 then
      tokens = tokens - 1
      allowed = 1
    end

    redis.call('hset', KEYS[1], 'tokens', tokens, 'last_refill', lastRefill)
    redis.call('expire', KEYS[1], 3600)
    return allowed
  \`;

  const result = await r.eval(script, 1, key, capacity, refillRate, now);
  return result === 1;
}

// ── Express middleware using express-rate-limit + Redis ───────
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                    // 100 requests per window
  standardHeaders: true,       // Include RateLimit-* headers
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip, // Per-user limit
  store: new RedisStore({ sendCommand: (...args) => r.call(...args) }),
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      retryAfter: Math.ceil((res.getHeader('RateLimit-Reset') as number - Date.now() / 1000)),
    });
  },
});

// Stricter limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 5,                      // 5 attempts per minute
  skipSuccessfulRequests: true, // Only count failures
  store: new RedisStore({ sendCommand: (...args) => r.call(...args) }),
});

app.use('/api/', apiLimiter);
app.use('/auth/login', authLimiter);
app.use('/auth/register', authLimiter);` },
      { type: 'comparison', heading: 'Rate Limit Key Strategies', headers: ['Key', 'Scope', 'Use Case'], rows: [
        { aspect: 'IP',       Key: 'IP address',          Scope: 'Per IP — anonymous',        'Use Case': 'Public APIs, preventing scraping' },
        { aspect: 'User',     Key: 'User ID (JWT sub)',   Scope: 'Per authenticated user',    'Use Case': 'Fair use enforcement for logged-in users' },
        { aspect: 'API Key',  Key: 'API key',             Scope: 'Per developer/tenant',      'Use Case': 'Tiered access — free vs paid plans' },
        { aspect: 'Endpoint', Key: 'IP + endpoint path',  Scope: 'Per endpoint per client',   'Use Case': 'Tighter limits on expensive operations (search, export)' },
        { aspect: 'Global',   Key: 'Service-level',       Scope: 'All traffic combined',      'Use Case': 'Protecting downstream dependencies (DB, 3rd party APIs)' },
      ]},
      { type: 'callout', calloutType: 'info', heading: 'Rate Limit Headers', content: 'Always include rate limit information in response headers so clients can back off gracefully: RateLimit-Limit (total requests allowed), RateLimit-Remaining (requests left in current window), RateLimit-Reset (Unix timestamp when limit resets), and Retry-After (seconds to wait) on 429 responses. This prevents clients from hammering your API when rate-limited.' },
    ],
    quiz: [
      { question: 'What is the boundary burst problem with fixed window rate limiting?', options: ['Fixed windows use too much memory', 'A client can make 2x the intended limit by sending requests at the end and start of consecutive windows', 'Fixed windows cannot handle distributed systems', 'The window size is too large for real-time APIs'], correctIndex: 1, explanation: 'With a 100 req/min fixed window, a client can send 100 requests in the last second of window 1, then 100 more in the first second of window 2 — 200 requests in 2 seconds, doubling the intended rate. Sliding window algorithms prevent this by tracking requests within a rolling time period rather than fixed boundaries.' },
    ]
  },

  // ─── DEVOPS ───────────────────────────────────────────────────────────────

  'docker': {
    slug: 'docker',
    title: 'Docker',
    tagline: 'Package once, run anywhere — the foundation of modern deployment',
    sections: [
      { type: 'text', heading: 'What is Docker?', content: 'Docker packages your application and ALL its dependencies (runtime, libraries, config) into a **container** — a portable, isolated unit that runs identically everywhere: your laptop, CI server, staging, and production.\n\nThis solves "works on my machine" permanently. The container is the artifact — what runs in CI is exactly what runs in production, byte for byte.' },
      { type: 'analogy', heading: 'Shipping Container Analogy', content: 'Before standardized shipping containers, loading goods onto ships was chaotic — different sizes, different handling equipment for each cargo type. Containers standardized everything: any container fits any ship, truck, or crane worldwide, regardless of contents.\n\nDocker containers do the same for software. Your app in a Docker container runs on any Docker host — development MacBook, CI Linux VM, production Kubernetes cluster — without modification.' },
      { type: 'code', heading: 'Production-Ready Dockerfile', language: 'dockerfile', label: 'Dockerfile', code: `# Multi-stage build — separate build from runtime
# Result: tiny production image without build tools

# Stage 1: Dependencies (cached layer)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
# Separate layer: npm ci only reruns when package.json changes

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# TypeScript compiled, unnecessary files excluded

# Stage 3: Production runtime (smallest possible image)
FROM node:20-alpine AS runner
WORKDIR /app

# Security: never run as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only what production needs
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/package.json ./

USER nextjs

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Use exec form to properly handle signals (not shell form)
CMD ["node", "dist/server.js"]` },
      { type: 'code', heading: 'Docker Compose for Local Development', language: 'yaml', label: 'docker-compose.yml', code: `version: '3.8'

services:
  api:
    build: .
    ports: ['3000:3000']
    environment:
      - DATABASE_URL=postgresql://postgres:dev@db:5432/myapp
      - REDIS_URL=redis://cache:6379
      - NODE_ENV=development
    volumes:
      - .:/app              # Mount source for hot reload
      - /app/node_modules   # Exclude — use container's node_modules
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    command: npm run dev

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: dev
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redisdata:/data

  # Runs database migrations before api starts (in CI)
  migrate:
    build: .
    command: npx prisma migrate deploy
    environment:
      - DATABASE_URL=postgresql://postgres:dev@db:5432/myapp
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata:
  redisdata:` },
      { type: 'checklist', heading: 'Docker Best Practices', items: [
        'Use multi-stage builds — build image contains compilers, runtime image does not',
        'Never run containers as root — create a non-root user in Dockerfile',
        'Pin base image versions — node:20.11-alpine, not node:latest',
        'Add .dockerignore to exclude node_modules, .git, .env from build context',
        'One process per container — do not run Nginx + Node + Postgres in one container',
        'Use COPY --chown to set correct file ownership in one layer',
        'Set HEALTHCHECK instructions so orchestrators know container health',
        'Use exec form CMD ["node", "server.js"] not shell form CMD "node server.js" for signal handling',
      ]},
    ],
    quiz: [
      { question: 'What is the primary advantage of multi-stage Docker builds?', options: ['They make builds faster', 'They produce smaller production images by excluding build tools and dependencies', 'They allow running multiple processes per container', 'They automatically set up networking between containers'], correctIndex: 1, explanation: 'Multi-stage builds use separate FROM stages. The build stage has TypeScript compiler, dev dependencies, and build tools. The runtime stage starts fresh — copies only compiled output and production node_modules. A typical Node.js image drops from 1.2GB (with dev tools) to 200MB (runtime only), reducing attack surface and deploy time.' },
    ]
  },

  'kubernetes': {
    slug: 'kubernetes',
    title: 'Kubernetes',
    tagline: 'Container orchestration at scale — automated deployment, scaling, and self-healing',
    sections: [
      { type: 'text', heading: 'What is Kubernetes?', content: 'Kubernetes (K8s) is a container orchestration platform that automates: deploying containers across a cluster, scaling containers up/down based on load, restarting failed containers (self-healing), rolling updates with zero downtime, service discovery and load balancing, and secrets/configuration management.\n\nK8s abstracts your application away from specific machines — you declare what you want (3 replicas of my API) and Kubernetes figures out how to achieve and maintain it.' },
      { type: 'code', heading: 'Kubernetes Deployment and Service', language: 'yaml', label: 'k8s-deployment.yaml', code: `# Deployment: declares desired state for your application
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
  namespace: production
spec:
  replicas: 3               # Keep 3 pods running at all times
  selector:
    matchLabels:
      app: api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1           # 1 extra pod during update
      maxUnavailable: 0     # No downtime during update
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: myregistry.io/api:v1.2.3  # Always pin to exact version
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:          # From Kubernetes Secret
              name: db-credentials
              key: url
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"        # Guaranteed minimum
            cpu: "100m"            # 0.1 CPU core minimum
          limits:
            memory: "512Mi"        # Hard maximum — OOMKilled if exceeded
            cpu: "500m"            # 0.5 CPU core maximum
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10        # Check every 10s before sending traffic
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 30        # Restart pod if unhealthy

---
# Service: stable network endpoint in front of pods
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    app: api                       # Routes to pods with this label
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP                  # Internal only — Ingress handles external

---
# HorizontalPodAutoscaler: auto-scale based on CPU
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-deployment
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70    # Scale up when CPU > 70%` },
      { type: 'text', heading: 'Core Kubernetes Concepts', content: '**Pod** — Smallest deployable unit. One or more containers sharing network and storage. Usually 1 container per pod.\n\n**Deployment** — Manages a set of identical pods. Handles rolling updates and rollbacks.\n\n**Service** — Stable network endpoint for a set of pods. Load balances across pod replicas.\n\n**Ingress** — Routes external HTTP traffic to internal services. Handles SSL termination, path-based routing.\n\n**ConfigMap / Secret** — Configuration and sensitive data injected into pods as env vars or files.\n\n**Namespace** — Virtual cluster within a cluster. Isolates environments (dev, staging, production).' },
      { type: 'callout', calloutType: 'gold', heading: 'Kubernetes Self-Healing', content: 'K8s continuously reconciles desired state with actual state. If a pod crashes, the Deployment controller immediately starts a replacement. If a node fails, pods are rescheduled to healthy nodes. Readiness probes prevent traffic from reaching pods that are not ready. Liveness probes restart pods that are alive but not functioning. This makes K8s clusters self-healing with minimal human intervention.' },
    ],
    quiz: [
      { question: 'What is the difference between a Readiness Probe and a Liveness Probe in Kubernetes?', options: ['They are identical — both restart unhealthy containers', 'Readiness controls traffic routing — failing pods receive no traffic. Liveness restarts non-functional pods.', 'Readiness checks CPU, Liveness checks memory', 'Liveness runs before container starts, Readiness runs after'], correctIndex: 1, explanation: 'Readiness: is the pod ready to receive traffic? Failing readiness removes the pod from the Service load balancer until it recovers. Liveness: is the pod still functioning? Failing liveness causes Kubernetes to kill and restart the pod. A pod can be alive (not liveness-killed) but not ready (not receiving traffic) during startup or database connection issues.' },
    ]
  },

  'cicd': {
    slug: 'cicd',
    title: 'CI/CD Pipelines',
    tagline: 'Automating build, test, and deploy so code reaches production safely and fast',
    sections: [
      { type: 'text', heading: 'What is CI/CD?', content: '**Continuous Integration (CI)** — Automatically build and test code on every push. Catch bugs before they reach main. Every developer\'s changes are integrated and validated continuously.\n\n**Continuous Delivery (CD)** — Automatically deploy to staging after CI passes. One-click deploy to production.\n\n**Continuous Deployment** — Automatically deploy to production after all checks pass. Every commit that passes tests ships automatically.\n\nThe goal: eliminate the fear of deploying. When deployments are automated, tested, and reversible, teams deploy multiple times per day instead of once per quarter.' },
      { type: 'code', heading: 'GitHub Actions CI/CD Pipeline', language: 'yaml', label: '.github/workflows/ci-cd.yml', code: `name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}/api

jobs:
  # ── CI: Test and Build ────────────────────────────────────────
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        options: >-
          --health-cmd pg_isready
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: TypeScript check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Unit tests
        run: npm run test:unit

      - name: Integration tests
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/testdb
        run: |
          npx prisma migrate deploy
          npm run test:integration

      - name: Build
        run: npm run build

  # ── CD: Build and Push Docker Image ──────────────────────────
  build-push:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    outputs:
      image-tag: \${{ steps.meta.outputs.tags }}
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix={{branch}}-   # main-abc1234
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # ── Deploy to Production ──────────────────────────────────────
  deploy:
    needs: build-push
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production    # Requires manual approval
    steps:
      - name: Deploy to Kubernetes
        run: |
          # Update image tag in deployment
          kubectl set image deployment/api-deployment \\
            api=\${{ needs.build-push.outputs.image-tag }} \\
            --record

          # Wait for rollout to complete
          kubectl rollout status deployment/api-deployment --timeout=300s

      - name: Smoke test
        run: |
          sleep 10
          curl -f https://api.example.com/health || exit 1

      - name: Rollback on failure
        if: failure()
        run: kubectl rollout undo deployment/api-deployment` },
      { type: 'callout', calloutType: 'gold', heading: 'Deployment Strategies', content: 'Blue-Green: run two identical environments. Route traffic to blue, deploy to green, switch traffic. Instant rollback by switching back. Canary: send 5% of traffic to new version. Monitor error rates. Gradually increase to 100% or roll back. Feature Flags: deploy code with features disabled. Enable for specific users or percentage. Decouple deployment from feature release. All three enable shipping without fear.' },
    ],
    quiz: [
      { question: 'What is the difference between Continuous Delivery and Continuous Deployment?', options: ['They are the same thing', 'Continuous Delivery requires manual approval for production deploy; Continuous Deployment deploys automatically after all checks pass', 'Continuous Delivery is for databases; Continuous Deployment is for applications', 'Continuous Deployment only works with Kubernetes'], correctIndex: 1, explanation: 'Continuous Delivery: every commit is deployable to production with one click, but a human approves the production deploy. Continuous Deployment: every commit that passes all automated checks is automatically deployed to production without human intervention. CD (Deployment) requires extremely high test confidence and feature flag infrastructure.' },
    ]
  },

  'nginx': {
    slug: 'nginx',
    title: 'Nginx & Reverse Proxies',
    tagline: 'The web server handling 500 million sites — SSL, load balancing, and static serving',
    sections: [
      { type: 'text', heading: 'What is Nginx?', content: 'Nginx (pronounced "engine-x") is a high-performance web server, reverse proxy, and load balancer. It uses an asynchronous, event-driven architecture — one worker process can handle thousands of concurrent connections.\n\nIn backend systems, Nginx typically sits in front of your application servers as a **reverse proxy**: it accepts client connections, terminates SSL, and forwards requests to backend processes. It also serves static files directly, handles compression, and implements rate limiting.' },
      { type: 'code', heading: 'Complete Production Nginx Config', language: 'nginx', label: 'nginx.conf', code: `# /etc/nginx/sites-available/api.example.com

# Upstream backend servers (your Node.js/Python/Go app)
upstream api {
  least_conn;
  server 127.0.0.1:3001;
  server 127.0.0.1:3002;
  server 127.0.0.1:3003;
  keepalive 32;
}

# Redirect HTTP to HTTPS
server {
  listen 80;
  server_name api.example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.example.com;

  # TLS configuration
  ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
  ssl_protocols       TLSv1.2 TLSv1.3;
  ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
  ssl_session_cache   shared:SSL:10m;
  ssl_session_timeout 1d;

  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options DENY always;
  add_header X-Content-Type-Options nosniff always;
  add_header X-XSS-Protection "1; mode=block" always;

  # Gzip compression
  gzip on;
  gzip_vary on;
  gzip_types text/plain application/json application/javascript text/css;
  gzip_min_length 1000;

  # Rate limiting zone (defined in nginx.conf http block)
  # limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

  # Serve static files directly (no app server needed)
  location /static/ {
    alias /var/www/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
  }

  # API proxy
  location /api/ {
    # Rate limiting: 10 req/s per IP, burst of 20
    # limit_req zone=api burst=20 nodelay;

    proxy_pass http://api;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Connection        "";

    # Timeouts
    proxy_connect_timeout  5s;
    proxy_send_timeout     30s;
    proxy_read_timeout     30s;

    # Buffer settings
    proxy_buffering    on;
    proxy_buffer_size  4k;
    proxy_buffers      8 4k;
  }

  # WebSocket proxy
  location /ws {
    proxy_pass http://api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400s;   # Long timeout for WebSocket connections
  }

  # Health check endpoint
  location /health {
    return 200 'ok\n';
    add_header Content-Type text/plain;
    access_log off;
  }
}` },
      { type: 'comparison', heading: 'Nginx vs Alternatives', headers: ['Nginx', 'Apache', 'Caddy', 'Traefik'], rows: [
        { aspect: 'Model',         Nginx: 'Event-driven, async', Apache: 'Process/thread per connection', Caddy: 'Event-driven, Go', Traefik: 'Event-driven, Go' },
        { aspect: 'Config',        Nginx: 'Manual config files', Apache: 'Manual + .htaccess', Caddy: 'Automatic HTTPS, simple', Traefik: 'Docker/K8s label-driven' },
        { aspect: 'Auto HTTPS',    Nginx: 'Manual (certbot)', Apache: 'Manual', Caddy: 'Automatic (built-in)', Traefik: 'Automatic (built-in)' },
        { aspect: 'Performance',   Nginx: 'Excellent', Apache: 'Good', Caddy: 'Excellent', Traefik: 'Good' },
        { aspect: 'Best for',      Nginx: 'High-traffic production, full control', Apache: 'Shared hosting, .htaccess needed', Caddy: 'Simplicity, small teams', Traefik: 'Kubernetes, microservices auto-discovery' },
      ]},
    ],
    quiz: [
      { question: 'What is the difference between a forward proxy and a reverse proxy?', options: ['Forward proxies are for HTTP, reverse proxies for HTTPS', 'Forward proxy sits in front of clients (client uses it to reach internet). Reverse proxy sits in front of servers (clients reach it to access backend servers).', 'They are identical — just different names', 'Reverse proxies only work with load balancers'], correctIndex: 1, explanation: 'Forward proxy: client → proxy → internet. The client knows about the proxy. Used for anonymity, access control, caching for outbound requests. Reverse proxy: client → reverse proxy → backend servers. The client thinks it is talking directly to the server. Used for load balancing, SSL termination, caching, hiding backend topology. Nginx is almost always used as a reverse proxy.' },
    ]
  },

  'monitoring': {
    slug: 'monitoring',
    title: 'Monitoring & Observability',
    tagline: 'Knowing what is happening in your system — logs, metrics, and distributed traces',
    sections: [
      { type: 'text', heading: 'The Three Pillars of Observability', content: '**Logs** — Timestamped records of discrete events. What happened and when. Best for debugging specific errors.\n\n**Metrics** — Numeric measurements over time. Request rate, error rate, latency p99, CPU usage. Best for dashboards, alerting, and trending.\n\n**Traces** — Records of a request\'s path through distributed services. Shows exactly where latency occurs across microservices. Best for diagnosing slow requests in complex systems.\n\nAll three are needed. Logs tell you what happened. Metrics tell you it is happening. Traces tell you where it is slow.' },
      { type: 'code', heading: 'Structured Logging', language: 'typescript', label: 'logging.ts', code: `import pino from 'pino';

// Structured JSON logging — parseable by log aggregators
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',     // Human-readable in dev
  } : undefined,               // Raw JSON in production (shipped to Datadog/CloudWatch)
  base: {
    service: 'api',
    version: process.env.APP_VERSION,
    env: process.env.NODE_ENV,
  },
  redact: ['req.headers.authorization', 'body.password'], // Never log secrets
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const reqLogger = logger.child({ requestId: req.headers['x-request-id'] });
  req.log = reqLogger;

  reqLogger.info({ method: req.method, url: req.url, userAgent: req.headers['user-agent'] }, 'Request started');

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    reqLogger[level]({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
    }, 'Request completed');
  });

  next();
});

// Business event logging
app.post('/orders', async (req, res) => {
  const order = await createOrder(req.body);

  req.log.info({
    event: 'order.created',
    orderId: order.id,
    userId: req.user.id,
    total: order.total,
    itemCount: order.items.length,
  }, 'Order created successfully');

  res.status(201).json({ orderId: order.id });
});` },
      { type: 'code', heading: 'Metrics with Prometheus', language: 'typescript', label: 'metrics.ts', code: `import client from 'prom-client';

// Auto-collect default metrics (CPU, memory, event loop lag)
client.collectDefaultMetrics({ prefix: 'api_' });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'api_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

const activeConnections = new client.Gauge({
  name: 'api_active_websocket_connections',
  help: 'Number of active WebSocket connections',
});

const ordersCreated = new client.Counter({
  name: 'api_orders_created_total',
  help: 'Total orders created',
  labelNames: ['payment_method'],
});

// Middleware to record request metrics
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer({ method: req.method });
  res.on('finish', () => {
    end({ route: req.route?.path || 'unknown', status_code: res.statusCode });
  });
  next();
});

// Expose /metrics endpoint for Prometheus to scrape
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Record business metric on order creation
ordersCreated.inc({ payment_method: order.paymentMethod });` },
      { type: 'callout', calloutType: 'gold', heading: 'SRE Golden Signals', content: 'Google SRE defines four golden signals to monitor for any service: Latency (p50/p95/p99 request duration — slow requests are as bad as errors), Traffic (requests per second — baseline for capacity planning), Errors (error rate — 5xx responses, failed jobs), and Saturation (how full is the system — CPU, memory, queue depth). Alert on these four before anything else. They cover 90% of user-impacting incidents.' },
    ],
    quiz: [
      { question: 'What is the difference between metrics and logs?', options: ['Logs are for errors only; metrics are for successful operations', 'Metrics are numeric measurements over time (rate, latency, count); logs are timestamped records of discrete events', 'Logs are stored in databases; metrics are stored in files', 'They are the same — just different names in different platforms'], correctIndex: 1, explanation: 'Metrics: numeric, time-series, aggregatable — request rate, p99 latency, error percentage. Queryable across time ranges, used for dashboards and alerts. Logs: discrete event records — "User 123 logged in at 14:32:01, from IP 1.2.3.4". Queryable per event, used for debugging specific incidents. Both are needed: metrics detect that something is wrong, logs explain what happened.' },
    ]
  },

  // ─── SYSTEM DESIGN ────────────────────────────────────────────────────────

  'url-shortener': {
    slug: 'url-shortener',
    title: 'Design URL Shortener',
    tagline: 'System design interview: build a bit.ly clone handling 100M redirects per day',
    sections: [
      { type: 'text', heading: 'Requirements', content: '**Functional:**\n- POST /shorten — accept a long URL, return a short code (e.g., abc123)\n- GET /:code — redirect to the original URL\n- Optional: custom aliases, expiry, click analytics\n\n**Non-functional:**\n- 100M redirects per day (~1,200 RPS average, ~10,000 RPS peak)\n- Sub-10ms p99 redirect latency\n- 99.99% availability (URLs must not break)\n- Short codes: 6-8 characters, globally unique\n- Read:write ratio ≈ 100:1' },
      { type: 'text', heading: 'Short Code Generation', content: '**Option 1: MD5/Hash** — Hash the long URL, take first 6 chars. Risk: collisions (two URLs produce same hash prefix). Requires collision detection and retry.\n\n**Option 2: Random string** — Generate random 6-char Base62 string. Check for uniqueness in DB. Risk: more DB lookups as table fills.\n\n**Option 3: Auto-increment ID + Base62** — Use database auto-increment ID, encode in Base62. ID 125 → "cb". Guaranteed unique, no collision, compact. No DB read needed to check uniqueness.\n\nBase62 alphabet: [0-9][a-z][A-Z]. 6 chars = 62^6 = 56 billion possible codes. Recommended: approach 3.' },
      { type: 'code', heading: 'Core Implementation', language: 'typescript', label: 'url-shortener.ts', code: `// Base62 encoding: converts database auto-increment ID to short code
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = ALPHABET.length; // 62

function encode(num: number): string {
  let result = '';
  while (num > 0) {
    result = ALPHABET[num % BASE] + result;
    num = Math.floor(num / BASE);
  }
  return result.padStart(6, '0'); // Min 6 chars
}

// ID=1 → "000001", ID=1000000 → "4c92"

// Database schema
// CREATE TABLE urls (
//   id          BIGSERIAL PRIMARY KEY,
//   long_url    TEXT NOT NULL,
//   short_code  VARCHAR(10) UNIQUE NOT NULL,
//   user_id     INTEGER REFERENCES users(id),
//   expires_at  TIMESTAMP,
//   created_at  TIMESTAMP DEFAULT NOW()
// );
// CREATE INDEX idx_urls_short_code ON urls(short_code);

// Shorten endpoint
app.post('/shorten', async (req, res) => {
  const { longUrl, customAlias, expiresIn } = req.body;

  // Validate URL
  try { new URL(longUrl); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

  // Check if already shortened (deduplication)
  const existing = await db.query(
    'SELECT short_code FROM urls WHERE long_url = $1 AND user_id = $2',
    [longUrl, req.user?.id]
  );
  if (existing.rows.length > 0) {
    return res.json({ shortUrl: \`https://sho.rt/\${existing.rows[0].short_code}\` });
  }

  // Insert and get auto-increment ID
  const { rows: [row] } = await db.query(
    'INSERT INTO urls (long_url, user_id, expires_at) VALUES ($1, $2, $3) RETURNING id',
    [longUrl, req.user?.id, expiresIn ? new Date(Date.now() + expiresIn) : null]
  );

  const shortCode = customAlias || encode(row.id);

  await db.query('UPDATE urls SET short_code = $1 WHERE id = $2', [shortCode, row.id]);

  res.json({ shortUrl: \`https://sho.rt/\${shortCode}\` });
});

// Redirect endpoint — CRITICAL PATH: must be <10ms
app.get('/:code', async (req, res) => {
  const { code } = req.params;
  const cacheKey = \`url:\${code}\`;

  // 1. Check Redis cache first (0.5ms)
  const cached = await redis.get(cacheKey);
  if (cached) {
    // Async analytics (don't await — never block redirect)
    setImmediate(() => trackClick(code, req.ip));
    return res.redirect(301, cached); // 301 = permanent (browser caches it too)
  }

  // 2. Cache miss — query DB (1-3ms)
  const { rows: [url] } = await db.query(
    'SELECT long_url, expires_at FROM urls WHERE short_code = $1',
    [code]
  );

  if (!url || (url.expires_at && url.expires_at < new Date())) {
    return res.status(404).send('URL not found or expired');
  }

  // 3. Store in Redis (TTL matches expiry or 24h)
  const ttl = url.expires_at
    ? Math.floor((url.expires_at - Date.now()) / 1000)
    : 86400; // 24 hours default
  await redis.setex(cacheKey, ttl, url.long_url);

  setImmediate(() => trackClick(code, req.ip));
  res.redirect(301, url.long_url);
});` },
      { type: 'text', heading: 'Scaling to 100M Redirects/Day', content: '**Caching** — Redis caches hot short codes (Pareto principle: top 20% of URLs account for 80% of traffic). Target 99% cache hit rate. Cache misses hit read replicas, not primary.\n\n**Read replicas** — Redirect queries go to PostgreSQL read replicas. Primary handles only writes (URL creation, analytics aggregation).\n\n**CDN** — Put redirect logic at the CDN edge. Cloudflare Workers can execute the redirect from the nearest PoP without hitting origin for cached URLs.\n\n**Analytics async** — Never block the redirect for analytics. Publish click events to Kafka. Analytics consumers process asynchronously — eventual consistency is fine.\n\n**Global deployment** — Multi-region with regional Redis and DB read replicas. DNS routes users to nearest region.' },
    ],
    quiz: [
      { question: 'Why is Base62 encoding of auto-increment IDs better than random string generation for short codes?', options: ['Base62 codes are shorter', 'Auto-increment + Base62 guarantees uniqueness without any collision check — no DB lookup needed to verify uniqueness', 'Base62 is more readable to humans', 'Random strings are slower to generate'], correctIndex: 1, explanation: 'Database auto-increment IDs are guaranteed unique by the database. Encoding the ID in Base62 produces a unique code without any uniqueness check. Random string generation requires checking the database for each candidate code to detect collisions — increasingly expensive as the table fills. Auto-increment + Base62 is O(1) while random generation degrades over time.' },
    ]
  },

  'chat-app': {
    slug: 'chat-app',
    title: 'Design Chat Application',
    tagline: 'Real-time messaging at scale — WebSockets, fan-out, and presence systems',
    sections: [
      { type: 'text', heading: 'Requirements', content: '**Functional:**\n- 1-on-1 and group messaging\n- Real-time delivery (online users get messages instantly)\n- Offline delivery (push notifications for offline users)\n- Message history (last 30 days)\n- Online presence (see who is online)\n- Message status (sent, delivered, read)\n\n**Non-functional:**\n- 1 million concurrent WebSocket connections\n- 100,000 messages per second peak\n- <100ms delivery latency for online users\n- 99.99% availability' },
      { type: 'text', heading: 'Key Design Decisions', content: '**WebSocket connection affinity** — Each chat server holds WebSocket connections in memory. IP hash at the load balancer ensures the same user always connects to the same server. Alternatively, use Redis to track which server holds each user\'s connection.\n\n**Fan-out strategy** — When Alice (server 1) sends to Bob (server 2): Alice\'s server publishes to Redis Pub/Sub. Bob\'s server subscribes and delivers to Bob\'s WebSocket. For group chats: publish once, fan out to all member servers.\n\n**Message storage** — Cassandra partitioned by (chat_id, timestamp) enables O(1) chat history queries. Wide-column stores are ideal for append-heavy, time-ordered data.\n\n**Presence** — Each connected user\'s server publishes a heartbeat to Redis every 30 seconds with a 60-second TTL. Absence of heartbeat means offline.' },
      { type: 'code', heading: 'WebSocket Message Flow', language: 'typescript', label: 'chat-server.ts', code: `import { WebSocketServer, WebSocket } from 'ws';
import Redis from 'ioredis';

const wss = new WebSocketServer({ port: 8080 });
const pub = new Redis(process.env.REDIS_URL!);
const sub = pub.duplicate();

// Track connections on THIS server
const connections = new Map<string, WebSocket>(); // userId → ws

// Subscribe to messages for users connected to this server
sub.subscribe('chat:messages');
sub.on('message', async (_channel, data) => {
  const { recipientId, message } = JSON.parse(data);

  const ws = connections.get(recipientId);
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    // Update delivery status
    await updateMessageStatus(message.id, recipientId, 'delivered');
  }
});

wss.on('connection', async (ws, req) => {
  const userId = authenticateFromToken(req.headers['authorization']!);
  if (!userId) { ws.close(4001, 'Unauthorized'); return; }

  connections.set(userId, ws);

  // Mark as online in Redis (expires in 60s, refreshed every 30s)
  await pub.setex(\`presence:\${userId}\`, 60, 'online');

  // Deliver queued offline messages
  await deliverOfflineMessages(userId, ws);

  // Heartbeat to maintain presence
  const heartbeat = setInterval(() => pub.setex(\`presence:\${userId}\`, 60, 'online'), 30000);

  ws.on('message', async (data) => {
    const { type, recipientId, content, chatId } = JSON.parse(data.toString());

    if (type === 'message') {
      // 1. Save to Cassandra
      const message = await saveMessage({ senderId: userId, recipientId, content, chatId });

      // 2. Fan-out via Redis Pub/Sub
      await pub.publish('chat:messages', JSON.stringify({ recipientId, message }));

      // 3. If recipient offline: queue for push notification
      const isOnline = await pub.exists(\`presence:\${recipientId}\`);
      if (!isOnline) {
        await notificationQueue.add('push', { userId: recipientId, message });
      }

      // Acknowledge to sender
      ws.send(JSON.stringify({ type: 'ack', messageId: message.id }));
    }
  });

  ws.on('close', () => {
    connections.delete(userId);
    clearInterval(heartbeat);
    pub.del(\`presence:\${userId}\`);
  });
});` },
    ],
    quiz: [
      { question: 'Why does a chat server need sticky session (IP hash) load balancing?', options: ['WebSockets require more bandwidth than HTTP', 'WebSocket connection state (which user is connected) is held in server memory — the same user must reach the same server', 'IP hash improves security of WebSocket connections', 'Sticky sessions reduce database load'], correctIndex: 1, explanation: 'The chat server maintains a Map<userId, WebSocket> in memory. When a message arrives for User 123, the server looks up their WebSocket in its local map. If a load balancer routes a new message to a different server, that server has no record of User 123\'s connection and cannot deliver the message. IP hash ensures the same user always hits the same server.' },
    ]
  },

  'notification-system': {
    slug: 'notification-system',
    title: 'Notification System',
    tagline: 'Delivering push notifications to millions of users across iOS, Android, and email',
    sections: [
      { type: 'text', heading: 'Requirements', content: '**Functional:**\n- Push notifications to iOS (APNs), Android (FCM), email (SendGrid), SMS (Twilio)\n- User preference management (which channels, what types)\n- Notification templates with dynamic content\n- Delivery tracking (sent, delivered, opened, failed)\n- Rate limiting (max N notifications per user per day)\n\n**Non-functional:**\n- 10 million notifications per day\n- <5 second delivery for urgent notifications\n- At-least-once delivery (retry on failure)\n- Notification deduplication (idempotency)' },
      { type: 'steps', heading: 'Architecture Components', steps: [
        { title: 'Event sources', detail: 'Services publish events (order.shipped, message.received, payment.failed). These are the triggers for notifications.' },
        { title: 'Notification service', detail: 'Receives events. Looks up user preferences. Applies rate limits. Generates notification content from templates. Publishes to channel-specific queues.' },
        { title: 'Channel workers', detail: 'Separate workers for APNs, FCM, email, SMS. Each reads from its queue, calls the provider API, handles retries and failures.' },
        { title: 'Device token management', detail: 'Users register device tokens (FCM/APNs) on app install. Tokens expire — workers must handle InvalidRegistration errors and delete stale tokens.' },
        { title: 'Delivery tracking', detail: 'Workers record delivery status. APNs and FCM provide delivery receipts. Email open tracking via pixel. SMS receipts via webhook.' },
      ]},
      { type: 'code', heading: 'Notification Pipeline', language: 'typescript', label: 'notifications.ts', code: `// Notification service — orchestrates channel selection and queuing
class NotificationService {
  async send(event: NotificationEvent): Promise<void> {
    const users = await this.resolveRecipients(event);

    for (const userId of users) {
      // Check user preferences
      const prefs = await this.getUserPreferences(userId);
      if (!prefs.enabled || !prefs.types.includes(event.type)) continue;

      // Rate limit check
      const withinLimit = await this.checkRateLimit(userId, event.type);
      if (!withinLimit) continue;

      // Deduplication — prevent duplicate notifications
      const dedupeKey = \`notif:\${userId}:\${event.idempotencyKey}\`;
      const alreadySent = await redis.set(dedupeKey, '1', 'NX', 'EX', 86400);
      if (!alreadySent) continue;

      // Generate content
      const content = await this.renderTemplate(event.templateId, event.payload);

      // Queue to appropriate channels
      const jobs = [];
      if (prefs.channels.push && prefs.deviceTokens.length > 0) {
        jobs.push(pushQueue.add('send', { userId, tokens: prefs.deviceTokens, content }));
      }
      if (prefs.channels.email && prefs.email) {
        jobs.push(emailQueue.add('send', { to: prefs.email, ...content }));
      }
      await Promise.all(jobs);
    }
  }
}

// Push notification worker with APNs/FCM
const pushWorker = new Worker('push-notifications', async (job) => {
  const { userId, tokens, content } = job.data;

  for (const token of tokens) {
    try {
      if (token.platform === 'ios') {
        await apns.send({
          deviceToken: token.value,
          alert: { title: content.title, body: content.body },
          badge: content.badge,
          sound: 'default',
        });
      } else {
        await fcm.send({
          token: token.value,
          notification: { title: content.title, body: content.body },
          android: { priority: 'high' },
        });
      }
    } catch (err: any) {
      // Handle invalid tokens
      if (err.code === 'BadDeviceToken' || err.code === 'registration-token-not-registered') {
        await db.deviceTokens.delete(token.id); // Clean up expired token
      }
      throw err; // Re-throw for retry
    }
  }

  await db.notifications.updateStatus(job.data.notificationId, 'delivered');
}, { connection, attempts: 3, backoff: { type: 'exponential', delay: 5000 } });` },
    ],
    quiz: [
      { question: 'Why is idempotency important in a notification system?', options: ['To make notifications faster', 'To prevent sending duplicate notifications if a worker retries after partial failure', 'To reduce database storage costs', 'Idempotency is not relevant for notifications'], correctIndex: 1, explanation: 'When a notification worker crashes mid-delivery, the job queue retries it. Without idempotency, the user receives the same notification twice (or more). An idempotency key (unique per notification event) checked in Redis/DB before sending ensures at-most-once delivery to the user even with at-least-once processing by the queue.' },
    ]
  },

  'payment-system': {
    slug: 'payment-system',
    title: 'Payment System',
    tagline: 'Building reliable financial infrastructure — correctness, idempotency, and reconciliation',
    sections: [
      { type: 'text', heading: 'Why Payments Are Hard', content: 'Payment systems are uniquely challenging because errors are financially costly. Specifically:\n\n**Double charging** — A payment request retried due to network timeout charges the customer twice.\n\n**Lost payment** — A payment succeeds at Stripe but your server crashes before recording it. Customer is charged, order is not created.\n\n**Race conditions** — Two simultaneous requests both check "has credit been used?" and both find no, both deduct balance.\n\n**Distributed failures** — Payment succeeds, inventory reservation fails. How do you roll back a completed charge?\n\nSolutions: idempotency keys, outbox pattern, distributed sagas, and obsessive reconciliation.' },
      { type: 'code', heading: 'Idempotent Payment Processing', language: 'typescript', label: 'payments.ts', code: `// ── Idempotency key prevents double-charging ─────────────────
app.post('/payments', async (req, res) => {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency-Key header required' });
  }

  // Check if this key was already processed
  const existing = await db.payments.findByIdempotencyKey(idempotencyKey);
  if (existing) {
    // Return the same response as the original request
    return res.status(existing.statusCode).json(existing.responseBody);
  }

  // Process the payment
  let stripeCharge: Stripe.PaymentIntent;
  let statusCode: number;
  let responseBody: object;

  try {
    stripeCharge = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: 'usd',
      customer: req.body.customerId,
      idempotencyKey, // Also pass to Stripe — they deduplicate too
    });

    const order = await db.$transaction(async (tx) => {
      // Record payment first
      await tx.payment.create({
        data: {
          stripePaymentIntentId: stripeCharge.id,
          amount: req.body.amount,
          status: 'completed',
          idempotencyKey,
        },
      });

      // Create order in same transaction
      return tx.order.create({
        data: {
          userId: req.user.id,
          paymentId: stripeCharge.id,
          items: req.body.items,
          status: 'confirmed',
        },
      });
    });

    statusCode = 201;
    responseBody = { orderId: order.id, paymentIntentId: stripeCharge.id };
  } catch (err) {
    statusCode = 500;
    responseBody = { error: 'Payment failed' };
  }

  // Store result for idempotency (even failures)
  await db.idempotencyKeys.create({
    data: { key: idempotencyKey, statusCode, responseBody: JSON.stringify(responseBody) }
  });

  res.status(statusCode).json(responseBody);
});

// ── Webhook handler for async Stripe events ───────────────────
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  // Verify webhook signature (prevent spoofed webhooks)
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return res.status(400).send('Webhook signature verification failed');
  }

  // Handle events idempotently (Stripe may retry webhooks)
  const processed = await redis.set(\`webhook:\${event.id}\`, '1', 'NX', 'EX', 86400);
  if (!processed) return res.json({ received: true }); // Already processed

  switch (event.type) {
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    case 'charge.refunded':
      await handleRefund(event.data.object as Stripe.Charge);
      break;
  }

  res.json({ received: true });
});` },
      { type: 'checklist', heading: 'Payment System Checklist', items: [
        'Require Idempotency-Key on all payment endpoints — clients must retry safely',
        'Pass idempotency keys through to payment providers (Stripe supports this)',
        'Use database transactions to atomically record payment + create order',
        'Implement webhook handlers idempotently — Stripe retries webhooks for 24 hours',
        'Verify webhook signatures to prevent spoofed events',
        'Run daily reconciliation — compare your DB records against Stripe dashboard',
        'Never trust client-sent amounts — calculate prices server-side',
        'Use Stripe\'s test mode and test cards extensively before going live',
        'Implement refund flows before launch — customers will request them',
        'Store raw payment provider responses for audit trails',
      ]},
    ],
    quiz: [
      { question: 'A customer clicks "Pay" twice because the page was slow. How do idempotency keys prevent double charging?', options: ['The browser prevents double-click automatically', 'The first request creates an idempotency key record. The second request finds it and returns the original response without recharging', 'Stripe automatically deduplicates payment requests', 'Rate limiting blocks the second request'], correctIndex: 1, explanation: 'The client generates a unique idempotency key per payment attempt (UUID tied to the cart/order). Both clicks send the same key. The server checks: "have I processed this key?" First request: no match — processes payment, stores key+result. Second request: finds the stored key — returns the original successful response without any database write or Stripe API call. The customer is charged exactly once.' },
    ]
  },
};

export default TOPIC_CONTENT_PART3;
