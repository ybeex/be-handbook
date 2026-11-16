# BackendCraft — Backend Engineering Handbook

A premium interactive backend engineering academy built with Next.js 15.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## 🏗️ Tech Stack

- **Next.js 15** App Router with TypeScript
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualizations  
- **Zustand** for progress state
- **Google Fonts**: Playfair Display, Inter, JetBrains Mono

## 📚 Content Coverage

### 8 Learning Tracks, 40+ Topics:
1. **Foundations** — HTTP, DNS, TCP/IP, REST, GraphQL, WebSockets, gRPC
2. **Auth & Security** — JWT, OAuth 2.0, CORS, CSRF, Password Hashing
3. **Node.js** — Event Loop, Async Programming, Streams, Clustering
4. **Databases** — SQL, PostgreSQL, Redis, ACID, Indexing, Sharding, CAP
5. **Architecture** — Monoliths, Microservices, Event-Driven, CQRS, Clean Arch
6. **Scaling** — Caching, Load Balancing, CDN, Message Queues, Rate Limiting
7. **DevOps** — Docker, Kubernetes, CI/CD, Nginx, Monitoring
8. **System Design** — URL Shortener, Chat App, Notification System, Payment System

## 🎮 Interactive Features

| Feature | Description |
|---------|-------------|
| 🌐 HTTP Visualizer | Full request lifecycle with step-by-step animation |
| 🔄 Event Loop Sim | Node.js event loop with call stack, micro/macrotask queues |
| 🎟️ JWT Decoder | Paste any JWT to decode header/payload/signature |
| ⚖️ Load Balancer | Compare Round-Robin, Least-Connections, Random algorithms |
| ⚡ Cache Simulator | LRU/LFU/FIFO eviction with hit rate tracking |
| 🏛️ System Design | Interactive architecture diagrams for URL Shortener & Chat App |
| 🧪 Quiz Mode | 13+ interview-level questions with explanations |
| 📖 Glossary | 30+ backend terms, searchable and alphabetically indexed |

## 📁 Project Structure

```
app/
  page.tsx              — Landing page
  docs/
    page.tsx            — Curriculum overview
    [category]/
      page.tsx          — Category listing
      [topic]/
        page.tsx        — Individual topic page
  playground/page.tsx   — Interactive demos hub
  quiz/page.tsx         — Quiz mode
  glossary/page.tsx     — Terminology reference
  system-design/page.tsx — Architecture explorer

components/
  layout/
    Sidebar.tsx         — Navigation sidebar
    ThemeProvider.tsx   — Theme context
  content/
    CodeBlock.tsx       — Syntax-highlighted code with copy
    Quiz.tsx            — Interactive quiz system
    Callout.tsx         — Info/warning/success boxes
    Tabs.tsx            — Tabbed content
    ComparisonTable.tsx — Side-by-side comparisons
    TopicHeader.tsx     — Topic metadata + breadcrumb
    TopicContentRenderer.tsx — Content section renderer
  visualizers/
    HttpVisualizer.tsx          — HTTP lifecycle
    EventLoopVisualizer.tsx     — Node.js event loop
    JwtVisualizer.tsx           — JWT decoder
    LoadBalancerVisualizer.tsx  — LB simulator
    CacheSimulator.tsx          — Cache hit/miss sim
    LatencyChart.tsx            — Recharts latency comparison
    SystemDesignExplorer.tsx    — Interactive architecture

data/
  curriculum.ts     — All categories, topics, glossary
  topicContent.ts   — Full written content for 10+ topics

store/
  progress.ts       — Zustand progress tracking (localStorage)

types/
  index.ts          — TypeScript interfaces
```

## ✍️ Adding New Topic Content

In `data/topicContent.ts`, add an entry to `TOPIC_CONTENT`:

```typescript
'your-topic-slug': {
  slug: 'your-topic-slug',
  title: 'Your Topic',
  tagline: 'One line description',
  hasVisualizer: 'http', // optional: 'http' | 'eventloop' | 'jwt' | 'loadbalancer' | 'cache'
  sections: [
    { type: 'text', heading: 'Introduction', content: 'Content with **bold** and `code`...' },
    { type: 'analogy', heading: '🍕 Analogy', content: 'Real-world comparison...' },
    { type: 'code', language: 'typescript', label: 'example.ts', code: '...' },
    { type: 'callout', calloutType: 'warning', heading: 'Warning', content: '...' },
    { type: 'comparison', headers: ['A', 'B'], rows: [{aspect: '...', A: '...', B: '...'}] },
    { type: 'steps', heading: 'Steps', steps: [{title: '...', detail: '...'}] },
    { type: 'checklist', heading: 'Summary', items: ['Point 1', 'Point 2'] },
  ],
  quiz: [
    { question: '...', options: ['A', 'B', 'C', 'D'], correctIndex: 0, explanation: '...' }
  ]
}
```

## 🎨 Design System

- **Primary Background**: `#0A0A0F`
- **Card Background**: `#12121E`  
- **Gold Accent**: `#C9A84C` / `#E8C96B`
- **Text Primary**: `#F0F0F8`
- **Text Secondary**: `#8888AA`
- **Borders**: `#1E1E35`

## 📦 Scripts

```bash
npm run dev      # Development server with hot reload
npm run build    # Production build  
npm run start    # Start production server
npm run lint     # ESLint
```
