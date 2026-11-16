// Gap content: Distributed Systems — consensus, coordination, consistency
import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_GAPS_DIST: Record<string, TopicContent> = {
  // ─── CONSENSUS ──────────────────────────────────────────────────────────

  consensus: {
    slug: "consensus",
    title: "Consensus: Raft & Paxos",
    tagline: "Quorums, log replication, and why majority always wins",
    sections: [
      {
        type: "text",
        heading: "What Consensus Actually Solves",
        content:
          "Consensus is the problem of getting a set of independent machines to agree on a single sequence of decisions, even when some of them crash and messages are lost or delayed. It is the foundation under replicated logs, distributed locks, leader election, and configuration stores — every one of those is consensus wearing a different hat.\n\nThe output of consensus is a **replicated log**: an ordered list of commands that every node applies in the same order, so all healthy nodes end up in the same state. A node may crash and restart, lag behind, or vote against the leader; the log still cannot diverge. In a network where clocks cannot be trusted and machines fail independently, agreeing on an order is the hard part — agreeing on the values is comparatively easy.",
      },
      {
        type: "analogy",
        heading: "A Committee Recording Minutes",
        content:
          "Imagine a committee that must keep one official minute-book, but any member may fall asleep mid-sentence, and notes passed between members sometimes vanish. To stay legitimate, a decision only becomes official once a **majority** has written it into their own copies. A member woken after a nap checks the book against the majority's and copies over anything it missed.\n\nTwo members who each think they are the secretary would record competing minutes — a split brain. Consensus protocol prevents this by making the pen a **quorum-protected** resource: only whoever holds a fresh majority mandate may write, and that mandate expires.",
      },
      {
        type: "text",
        heading: "Quorums: Why a Majority Is Enough",
        content:
          "The single idea behind every consensus protocol is the **quorum**. If a decision requires agreement from more than half the nodes, then any two quorums must overlap in at least one node. That shared node prevents two conflicting decisions from both being accepted, because it cannot vote for two things in the same term.\n\nFor a cluster of N nodes the quorum is floor(N/2) + 1. A 3-node cluster survives 1 failure (quorum 2); a 5-node cluster survives 2 (quorum 3). Even-sized clusters are wasteful: 4 nodes still need 3 to make progress but tolerate only 1 failure, the same as 3 nodes. This is why production clusters are almost always odd-sized: **3, 5, or 7**.",
      },
      {
        type: "code",
        heading: "The Raft Log and Persistent State",
        language: "typescript",
        label: "raft-log.ts",
        code: `// Raft: a leader-driven replicated log. Every node persists this before replying.
type Term = number;

interface LogEntry {
  term: Term;      // the term in which the leader created the entry
  index: number;   // 1-based position in the log
  command: string; // state-machine command, e.g. "SET x 5"
}

interface PersistentState {
  currentTerm: Term;         // the latest term this node has seen
  votedFor: string | null;   // candidateId we voted for in currentTerm
  log: LogEntry[];           // append-only; entries are never rewritten
}

// A write commits only after a majority has stored it.
const quorum = (clusterSize: number) => Math.floor(clusterSize / 2) + 1;
// 3 nodes -> 2, 5 nodes -> 3: a 5-node cluster tolerates 2 simultaneous failures.`,
      },
      {
        type: "text",
        heading: "Raft: Leader, Log, and Terms",
        content:
          "Raft decomposes consensus into three relatively independent pieces: **leader election**, **log replication**, and **safety**. Time is divided into **terms** — monotonically increasing integers, each acting as a logical epoch. Every term has at most one leader, elected by a majority.\n\nThe leader accepts client commands, appends them to its log, and replicates them via `AppendEntries` RPCs. A follower accepts an entry only if it can match the leader's log at the preceding index and term — the **log matching property**. Once a majority has acknowledged entry N, the leader marks it **committed** and, in a later message, tells followers to commit it too. Every node applies committed entries to its state machine in index order.",
      },
      {
        type: "code",
        heading: "The AppendEntries Rule",
        language: "plaintext",
        label: "append-entries.txt",
        code: `AppendEntries(term, leaderId, prevLogIndex, prevLogTerm, entries[], leaderCommit)

A follower accepts the RPC only if:
  - term >= its currentTerm, and
  - its log has an entry at prevLogIndex with term == prevLogTerm

If it fails the second check, the follower rejects, and the leader
backs up and retries at an earlier index until the logs align.
That is how a lagging or divergent follower is repaired.

The leader advances commitIndex to N once a majority of followers
have ACKed entry N in the CURRENT term.

Never overwrite a committed entry. A candidate's log must be at least
as up-to-date as a majority before it may win an election — this is the
rule that guarantees a committed entry can never be lost.`,
      },
      {
        type: "text",
        heading: "Elections and Terms",
        content:
          "When a follower hears nothing from the leader for a randomized **election timeout** (typically 150–300ms), it becomes a candidate: it increments `currentTerm`, votes for itself, and requests votes from peers. A node grants at most one vote per term and only to a candidate whose log is at least as complete as its own.\n\nIf the candidate wins a majority it becomes leader and immediately appends a no-op entry, which lets it commit any older entries without violating safety. If nobody wins, the term ends and a new election begins. Randomizing timeouts makes it unlikely that two candidates split the vote indefinitely. Once a leader is elected, supporters reset their election timers only on contact with the **current** leader — a stale or partitioned leader cannot keep them from starting a new election, which is why at most one leader exists per term.",
      },
      {
        type: "comparison",
        heading: "Raft vs Paxos",
        headers: ["Raft", "Paxos"],
        rows: [
          {
            aspect: "Primary goal",
            Raft: "Understandability first, then performance",
            Paxos: "Minimal, provably correct agreement primitive",
          },
          {
            aspect: "Composition",
            Raft: "Integrated leader election + log replication + safety",
            Paxos: "Single-decree; Multi-Paxos layers a leader on top",
          },
          {
            aspect: "Ordering unit",
            Raft: "Explicit terms and a strictly ordered log",
            Paxos: "Proposal/ballot numbers; the log is an add-on",
          },
          {
            aspect: "Gaps and holes",
            Raft: "Logs have no gaps — contiguous indices",
            Paxos: "The log can have holes needing fill-in later",
          },
          {
            aspect: "Understandability",
            Raft: "Designed for clarity; widely taught",
            Paxos: "Notoriously subtle, hard to implement correctly",
          },
          {
            aspect: "Real systems",
            Raft: "etcd, Consul, CockroachDB, TiKV, RethinkDB",
            Paxos: "Chubby, Spanner, Cassandra (LWT), drawer of history",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Consensus Is Not Free",
        content:
          "Every consensus write costs a **round trip to a majority** and an fsync on each. That is a floor of one or two network hops plus disk latency — often several milliseconds, sometimes tens across regions. Never put consensus on a hot per-request path if you can avoid it. The right pattern is to use it for **small, critical decisions** — who leads, what the cluster config is, the placement of a shard — and keep bulk data flow out of it. A common production mistake is routing every write through a Raft-replicated store; throughput then collapses to the speed of a quorum round trip.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Consensus produces a single ordered log; replicated logs, locks, and elections all reduce to it",
          "Progress requires a majority quorum of floor(N/2)+1, so clusters should be odd-sized: 3, 5, or 7",
          "Raft separates leader election, log replication, and safety, and marks time with monotonic terms",
          "A candidate can only win if its log is at least as complete as a majority — the safety guarantee",
          "Paxos is the minimal primitive; Raft is its pragmatic, teachable sibling with contiguous logs and clear terms",
          "Consensus pays a quorum round trip plus fsyncs, so reserve it for small critical decisions, not bulk writes",
        ],
      },
    ],
    quiz: [
      {
        question:
          "In a 5-node Raft cluster (quorum 3), how many simultaneous node failures can it tolerate and still make progress?",
        options: ["0", "1", "2", "3"],
        correctIndex: 2,
        explanation:
          "The quorum is floor(5/2)+1 = 3, so up to 2 nodes may fail while 3 remain to form a quorum. A third failure leaves only 2 nodes, below quorum, and the cluster stalls until a node returns.",
      },
      {
        question: "What role do Raft terms (epochs) play?",
        options: [
          "They order leadership tenure and let nodes discard stale messages from older eras",
          "They encrypt the replicated log",
          "They compress log entries on disk",
          "They distribute work evenly across followers",
        ],
        correctIndex: 0,
        explanation:
          "Terms are monotonic epochs. Each term has at most one leader, and messages carrying an old term are rejected. Terms provide the logical clock that makes stale leaders harmless and elections well-defined.",
      },
      {
        question:
          "Why must a Raft leader persist (fsync) log entries before acknowledging them?",
        options: [
          "To survive crashes without losing entries a majority already committed",
          "To speed up subsequent reads",
          "To compress the log more aggressively",
          "To trigger a new election sooner",
        ],
        correctIndex: 0,
        explanation:
          "If an acknowledged entry lived only in memory, a crash could erase it after followers rely on it. Durably logging before replying is what lets a new leader recover a committed prefix and preserve the replicated log.",
      },
      {
        question: "Both Raft and Paxos depend on what to make progress?",
        options: [
          "A majority quorum agreeing on the decision",
          "A single designated writer that never fails",
          "Perfectly synchronized physical clocks",
          "Broadcasting to every node and waiting for all",
        ],
        correctIndex: 0,
        explanation:
          "Majority quorums are what let the protocols tolerate crashes: any two quorums overlap, so no two conflicting decisions can both be accepted. Requiring all nodes would block on any single failure.",
      },
    ],
  },

  // ─── LEADER ELECTION ────────────────────────────────────────────────────

  "leader-election": {
    slug: "leader-election",
    title: "Leader Election",
    tagline: "One leader at a time — leases, quorums, and split brain",
    sections: [
      {
        type: "text",
        heading: "Why Exactly One Leader",
        content:
          "Many distributed systems need a single node to own a privileged role: the shard that accepts writes, the worker that runs a cron job, the node that assigns offsets. A **leader election** algorithm must guarantee that at most one node holds the role at any time, that the role eventually transfers if the holder dies, and that all nodes agree on who holds it.\n\nThat single-writer invariant is the entire game. Consequences of getting it wrong range from duplicated billing runs to two primaries accepting conflicting writes. The election mechanism is often a thin layer over consensus: whoever can write to a quorum-protected key holds the leadership.",
      },
      {
        type: "analogy",
        heading: "The Classroom Raising Hands",
        content:
          "In the **bully algorithm**, each student has a fixed rank. When the class monitor stops responding, everyone notices and the highest-ranked student who is still awake raises a hand and becomes the new monitor, after announcing it to anyone lower-ranked who will listen.\n\nIf a higher-ranked student then wakes up, it calls an election and takes over, demoting the current monitor. Rank is stable even when the network is not, so the outcome is deterministic once the highest awake student is known. The subtlety is proving that everyone agrees on exactly who is awake at that moment.",
      },
      {
        type: "text",
        heading: "The Bully Algorithm",
        content:
          "The bully algorithm elects the process with the **highest identifier** among those reachable. It is simple and deterministic, which makes it a good teaching model and a reasonable fit for small, static clusters.\n\nIt does not tolerate network partitions well: two halves of a split cluster can each elect their own leader, because each half only knows who is reachable within it. It also assumes reliable failure detection with bounded timeouts, which is impossible to guarantee over an unreliable network — a slow node is indistinguishable from a dead one. For those reasons, practical systems prefer quorum-based elections that make split brain impossible by construction.",
      },
      {
        type: "steps",
        heading: "How the Bully Algorithm Elects a Leader",
        steps: [
          {
            title: "Detect the failure",
            detail:
              "A process notices the coordinator has not responded within its timeout and starts an election.",
          },
          {
            title: "Challenge higher ranks",
            detail:
              "It sends an ELECT message to every process with a higher identifier and waits for replies.",
          },
          {
            title: "Yield if someone higher answers",
            detail:
              "Any higher-ranked responder sends OK and takes over the election; the initiator steps back.",
          },
          {
            title: "Declare victory if unchallenged",
            detail:
              "If no higher process replies within the timeout, the initiator declares itself coordinator to all lower ranks.",
          },
          {
            title: "Announce and re-check",
            detail:
              "The new coordinator broadcasts COORDINATOR; a higher-ranked process waking later restarts the whole process.",
          },
        ],
      },
      {
        type: "text",
        heading: "Leases: Leadership That Expires",
        content:
          "A **lease** is leadership with an explicit expiry. Instead of holding power forever, a leader holds it for a bounded time and must renew before the lease lapses. If the leader crashes or pauses, the lease simply expires and any candidate may take over. This turns the ambiguous question of is the leader dead into the simpler one of has the lease expired.\n\nLeases are the mechanism inside etcd, Chubby, and most primary-election systems. The critical design rule: the lease **must outlast the worst-case pause** you can tolerate. If a leader can be paused by a stop-the-world garbage collection longer than the lease, it may resume believing it is still the leader after another node has taken over.",
      },
      {
        type: "code",
        heading: "Election via an etcd Lease",
        language: "typescript",
        label: "etcd-election.ts",
        code: `import { Etcd3 } from "etcd3";

const client = new Etcd3();

// A lease is a self-expiring grant. If the holder dies, the lease expires
// and its keys vanish, so leadership is automatically released.
const lease = client.lease(15); // 15-second TTL, renewed well before expiry

// Campaign blocks until this node wins the named election.
// the key is written through a quorum, so only one node can win.
const election = client.election("orders-primary");
const campaign = election.campaign("node-a");

const leadership = await campaign;      // resolves once we are the leader
await lease.keepalive();                // keep renewing while we hold it

// Followers can discover the current leader without campaigning.
const observed = await election.observe();
console.log("current leader:", await observed.leader());

// On completion, relinquish so the next candidate is promoted promptly.
await campaign.resign();`,
      },
      {
        type: "text",
        heading: "Designing Against Split Brain",
        content:
          "**Split brain** is the failure where two nodes both believe they are the leader. It happens when failure detection lies: a partition or long pause makes each side conclude the other is gone. A lease alone does not fully solve it, because clocks drift and a paused leader can wake up mid-lease.\n\nThe robust fix is **fencing**: every leadership grant is paired with a monotonically increasing **fencing token**, and every resource the leader touches rejects tokens lower than the highest it has seen. Even if a stale leader resumes and issues a write, the storage layer refuses it because a newer leader has already presented a larger token. Lease-based leadership, quorum-protected election keys, and fencing tokens together make split brain harmless rather than merely unlikely.",
      },
      {
        type: "comparison",
        heading: "Lease-based vs Quorum-based Elections",
        headers: ["Lease-based", "Quorum-based (ZooKeeper/etcd)"],
        rows: [
          {
            aspect: "Correctness source",
            "Lease-based": "Bounded time; depends on clock-drift assumptions",
            "Quorum-based":
              "Majority agreement; no clock assumptions for safety",
          },
          {
            aspect: "Split brain risk",
            "Lease-based": "Possible if a pause exceeds the lease",
            "Quorum-based": "Prevented by quorum overlap",
          },
          {
            aspect: "Failover latency",
            "Lease-based": "Bounded by the lease TTL",
            "Quorum-based": "A session timeout plus an election",
          },
          {
            aspect: "Tolerance of pauses",
            "Lease-based": "None beyond the TTL",
            "Quorum-based": "A silent node simply loses its vote",
          },
          {
            aspect: "Typical examples",
            "Lease-based": "Chubby, etcd leases, database primaries",
            "Quorum-based": "ZooKeeper znodes, etcd elections",
          },
          {
            aspect: "Best combined with",
            "Lease-based": "Fencing tokens on every guarded resource",
            "Quorum-based": "Session ownership and watches",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "A Paused Leader Is Still a Leader",
        content:
          "A process that is stopped by a garbage-collection pause, VM freeze, or scheduler stall has not crashed — it resumes with all its in-memory state intact, still believing it holds leadership. If its lease expired during the pause, another node is now the leader, and for a moment there are two. The only durable defense is fencing at the resource: the resumed leader's writes carry an old token and are rejected. Never rely on a leader voluntarily stepping down; assume it will wake up and misbehave.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Leader election must guarantee at most one leader, eventual failover, and cluster-wide agreement on who leads",
          "The bully algorithm picks the highest reachable id but cannot prevent split brain under partition",
          "A lease bounds leadership in time and releases it automatically when the holder fails",
          "The lease TTL must exceed the worst-case pause, or a resumed leader can conflict with its successor",
          "Quorum-protected election keys (etcd, ZooKeeper) make split brain structurally impossible",
          "Pair every leadership grant with a fencing token so stale leaders cannot write to guarded resources",
        ],
      },
    ],
    quiz: [
      {
        question: "In the bully algorithm, which process becomes coordinator?",
        options: [
          "The lowest-id process still reachable",
          "The highest-id process still reachable",
          "A process chosen at random",
          "The process that has been running longest",
        ],
        correctIndex: 1,
        explanation:
          "The bully algorithm always elects the highest-id process among those that respond. Any procid with a higher id preempts, so the winner is deterministic given who is currently reachable.",
      },
      {
        question:
          "What is the primary risk of a lease-based leader that lacks fencing tokens?",
        options: [
          "Split brain — a paused old leader resumes and writes conflicting data",
          "Loss of encryption in transit",
          "Increased read latency on replicas",
          "Corruption of the replicated log on disk",
        ],
        correctIndex: 0,
        explanation:
          "A stalled leader does not crash; it wakes with stale state. If its lease expired during the pause, a successor is already active, and without fencing the resumed leader can still write, producing two writers.",
      },
      {
        question:
          "How do ZooKeeper and etcd ensure only one node holds leadership?",
        options: [
          "By writing a leadership key/znode through a majority consensus write",
          "By comparing the system clocks of all nodes",
          "By assigning leadership in round-robin order",
          "By hard-coding the leader at deployment time",
        ],
        correctIndex: 0,
        explanation:
          "Leadership is represented by a key written through consensus, so it requires a quorum. Two nodes cannot both write the same leadership key in the same term, which prevents two simultaneous leaders.",
      },
      {
        question:
          "A node holds a 10-second lease and is paused by a 12-second GC stop. What happens?",
        options: [
          "It safely retains leadership the whole time",
          "The lease expires and another node may become leader, so two nodes can briefly lead",
          "The entire cluster shuts down",
          "Nothing changes and leadership is unaffected",
        ],
        correctIndex: 1,
        explanation:
          "Because the pause exceeds the lease, the lease lapses and a successor can be elected. When the original node resumes it may still believe it leads, so fencing tokens are required to reject its stale writes.",
      },
    ],
  },

  // ─── DISTRIBUTED LOCKING ────────────────────────────────────────────────

  "distributed-locking": {
    slug: "distributed-locking",
    title: "Distributed Locking",
    tagline: "Fencing tokens, leases, and why Redlock is controversial",
    sections: [
      {
        type: "text",
        heading: "What a Distributed Lock Must Guarantee",
        content:
          "A distributed lock lets multiple processes across different machines coordinate exclusive access to a shared resource — a file, a database row, a queue partition, a billing run. It must offer **mutual exclusion** (at most one holder at a time), **liveness** (it is eventually released so progress is possible), and **fault tolerance** (a crashed holder does not wedge the resource forever).\n\nThese guarantees interact cruelly. The easy way to guarantee liveness — auto-expire the lock after a timeout — quietly threatens mutual exclusion, because a holder that runs longer than the timeout loses the lock while still working. Most real-world locking bugs are exactly this collision between expiry and slow holders.",
      },
      {
        type: "analogy",
        heading: "The Single Bathroom Key",
        content:
          "At a house party there is one bathroom and one key. The rule is simple: take the key, use the room, return the key. Mutual exclusion is trivial because there is physically one key.\n\nThe trouble starts when the host adds a rule: if the key is not returned within five minutes, assume the guest is unwell and cut a copy. Now two people can hold a key at once — and one of them may not know their key is invalid. Distributed locks inherit exactly this hazard: the safety rule that frees a stuck locker is the same rule that can free it too early.",
      },
      {
        type: "text",
        heading: "The Redis Lock and Its Classic Bug",
        content:
          "The canonical Redis lock is `SET key value NX PX ttl`: set the key only if it does not exist, with a millisecond TTL in a single atomic command. Acquiring is easy. Releasing is where people get it wrong.\n\nThe naive release is GET-then-DEL: read the value, check it belongs to you, then delete. That is **not atomic**. If your lock expires between the GET and the DEL, another process may have acquired it, and your DEL then deletes *their* lock. The fix is to release only if the value still matches your unique token, and to do the compare-and-delete in a single server-side operation — a Lua script via `EVAL`.",
      },
      {
        type: "code",
        heading: "Acquire a Lock Atomically",
        language: "typescript",
        label: "redis-lock.ts",
        code: `import Redis from "ioredis";
import { randomUUID } from "crypto";

const redis = new Redis();

// Acquire: SET key <token> NX PX <ttl> in a single round trip.
// NX = only if absent (mutual exclusion); PX = auto-expire (liveness).
async function acquire(key: string, ttlMs: number): Promise<string | null> {
  const token = randomUUID(); // unique to THIS caller, never reused
  const result = await redis.set(key, token, "PX", ttlMs, "NX");
  return result === "OK" ? token : null; // null means someone else holds it
}

// The lock must be renewed for long work, otherwise it expires mid-operation.
async function renew(key: string, token: string, ttlMs: number): Promise<boolean> {
  const current = await redis.get(key);
  return current === token ? (await redis.pexpire(key, ttlMs)) === 1 : false;
}`,
      },
      {
        type: "code",
        heading: "Release Only If You Still Own It",
        language: "plaintext",
        label: "release-and-fence.txt",
        code: `// Compare-and-delete must be ONE atomic operation on the server.

if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end

// A plain GET-then-DEL races: if your TTL expires between the two calls,
// someone else owns the lock and your DEL deletes THEIR lock.

// Even a correct lock needs a FENCING TOKEN for the guarded resource.
// The lock server hands out a monotonically increasing number on acquire:

//   lock.order-42  ->  token #31  (worker A)
//   lock.order-42  ->  token #32  (worker B, after A's lease expired)

// The storage layer remembers the highest token it has seen (32) and
// rejects worker A's later write when it presents token #31.
// This makes a stale holder harmless instead of catastrophic.`,
      },
      {
        type: "text",
        heading: "The Redlock Debate",
        content:
          "**Redlock** acquires locks from a majority of independent Redis instances to avoid a single point of failure. Martin Kleppmann's famous critique is that Redlock is unsafe because it has no fencing tokens and its correctness depends on **bounded clock drift** and bounded operation time — assumptions that stop-the-world pauses and clock jumps break. Antirez (Redis' author) responded that the assumptions are acceptable with a good clock bound.\n\nThe practical lesson: a lock without fencing cannot protect a resource whose writer can be paused. If you must coordinate a resource that cannot enforce tokens (a plain file, an external API), no Redis lock is fully safe. If the resource can verify tokens — a database, an object store with conditional writes — use the lock only as an optimization and let the token be the real guard.",
      },
      {
        type: "comparison",
        heading: "Redis Lock vs ZooKeeper/etcd Lock",
        headers: ["Redis (single-instance)", "ZooKeeper / etcd"],
        rows: [
          {
            aspect: "Consensus basis",
            "Redis (single-instance)": "None; a single node's memory",
            "ZooKeeper / etcd": "Quorum consensus underneath",
          },
          {
            aspect: "Split brain safety",
            "Redis (single-instance)":
              "At risk if the node is partitioned or restarted",
            "ZooKeeper / etcd": "Prevented by a majority requirement",
          },
          {
            aspect: "Lock release on crash",
            "Redis (single-instance)": "TTL expiry",
            "ZooKeeper / etcd": "Ephemeral node/session expiry",
          },
          {
            aspect: "Latency",
            "Redis (single-instance)": "Sub-millisecond",
            "ZooKeeper / etcd": "A consensus round trip",
          },
          {
            aspect: "Fencing support",
            "Redis (single-instance)": "Manual; use the value as the token",
            "ZooKeeper / etcd": "Combine with a monotonic version/key",
          },
          {
            aspect: "Best fit",
            "Redis (single-instance)":
              "Throughput-sensitive optimistic coordination",
            "ZooKeeper / etcd": "Correctness-critical leadership and locks",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Locks Do Not Survive a Pause",
        content:
          "Any lock based on a TTL assumes the holder finishes, or at least pauses, within that TTL. A long GC pause, a slow disk write, or a network stall violates that assumption. If the work can exceed the TTL, do not trust the lock alone: use a **fencing token** so the guarded resource can reject a stale writer, or redesign so the operation is idempotent and retryable. The lock protects coordination, not correctness — correctness comes from fencing or idempotency.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "A distributed lock needs mutual exclusion, liveness, and fault tolerance — and expiry trades safety for liveness",
          "Acquire with one atomic SET NX PX; never use a separate check-then-set",
          "Release with an atomic compare-and-delete (Lua/EVAL), or you will delete someone else's lock",
          "Redlock is controversial because it lacks fencing and relies on bounded clock drift",
          "Fencing tokens are the durable defense: the resource rejects any token older than the newest it has seen",
          "When work can outlast the TTL, prefer idempotency and fencing over trusting the lock",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why is a plain GET-then-DEL unsafe for releasing a Redis lock?",
        options: [
          "It is not atomic: the TTL can expire between the calls and you delete another holder's lock",
          "Redis does not support the GET command on lock keys",
          "It is too slow to use in production",
          "It permanently leaks memory in the key space",
        ],
        correctIndex: 0,
        explanation:
          "Between reading the value and deleting it, your lock may have expired and been acquired by another process; the DEL then removes their lock. The compare-and-delete must run as a single server-side operation.",
      },
      {
        question: "What problem does a fencing token solve?",
        options: [
          "A stale holder's write is rejected because it carries an older token than one already seen",
          "It encrypts the data protected by the lock",
          "It reduces lock acquisition latency",
          "It removes the need for a TTL",
        ],
        correctIndex: 0,
        explanation:
          "A fencing token is a monotonically increasing number issued on each acquisition. The guarded resource remembers the highest token and refuses older ones, so a paused leader that resumes cannot clobber a newer holder's work.",
      },
      {
        question: "What is the core of Kleppmann's criticism of Redlock?",
        options: [
          "It depends on bounded clock drift and lacks fencing, so it is unsafe under pauses and clock jumps",
          "It requires more than five Redis instances to work",
          "It cannot expire keys automatically",
          "It is too slow to acquire a lock in practice",
        ],
        correctIndex: 0,
        explanation:
          "Redlock's safety argument assumes clocks advance at roughly the same rate and operations finish within bounds. Stop-the-world pauses and clock adjustments break those assumptions, and without fencing tokens a stale holder can still act.",
      },
      {
        question:
          "Which locking mechanism is built on consensus and therefore inherently split-brain resistant?",
        options: [
          "ZooKeeper ephemeral nodes and etcd leases (quorum writes)",
          "A single Redis SETNX",
          "A process-local mutex",
          "An unindexed database row selected without constraints",
        ],
        correctIndex: 0,
        explanation:
          "ZooKeeper and etcd place locks behind a quorum: acquiring the lock is a consensus write, and any two candidates cannot both succeed. Single-instance Redis, local mutexes, and unconstrained rows offer no such guarantee.",
      },
    ],
  },

  // ─── CLOCKS & ORDERING ──────────────────────────────────────────────────

  "time-ordering": {
    slug: "time-ordering",
    title: "Clocks & Ordering",
    tagline: "Lamport, vector, and hybrid logical clocks for causality",
    sections: [
      {
        type: "text",
        heading: "Why Wall-Clock Time Lies",
        content:
          "Physical clocks in a distributed system cannot be trusted to order events. Each machine has its own quartz oscillator that drifts; NTP corrects it by stepping the clock, sometimes jumping it backwards. Two events that look ordered by timestamp may have actually occurred in the opposite order, and two events on different machines can share a timestamp to the microsecond.\n\nThe question distributed systems actually care about is not what time did this happen but what could have influenced what. Answering that requires **logical** time — ordering derived from communication and causality, not from a shared physical clock.",
      },
      {
        type: "analogy",
        heading: "Two People Diarizing Events",
        content:
          "Ada and Ben each keep a diary. If Ada writes an entry, letters Ben, and Ben writes back before he replies, then Ada's entry must come before Ben's — causality is unambiguous regardless of whose watch is fast.\n\nBut suppose Ada writes at the same moment Ben does, with no letter between them. Their entries are **concurrent**: neither could have influenced the other, and there is no true order. Wall-clock time forces a fake order onto this pair. Logical clocks instead say 'these are concurrent', which is the honest answer.",
      },
      {
        type: "text",
        heading: "Happens-Before and Causality",
        content:
          "The **happens-before** relation, denoted by an arrow, defines causality. Event A happens-before B if A and B are on the same process and A occurs first, or A is the send of a message and B is the receive of that same message, or the relation is transitive through a chain of such links.\n\nIf two events cannot be ordered by happens-before, they are **concurrent**. A correct distributed system must respect this: a replica that has seen an event must not be shown an effect that contradicts it, and a merge must combine concurrent writes without pretending one preceded the other. Every logical clock is a mechanism for encoding happens-before into comparable numbers.",
      },
      {
        type: "code",
        heading: "A Lamport Clock",
        language: "typescript",
        label: "lamport.ts",
        code: `// A Lamport clock is a single counter per process, advanced on every event.
class LamportClock {
  private counter = 0;

  // A local event or a message send: tick before you act.
  tick(): number {
    return ++this.counter;
  }

  // Receiving a message stamped with the sender's logical time:
  // take the max of both, then tick. This guarantees that if
  // A happens-before B, then clock(A) < clock(B).
  receive(remoteTime: number): number {
    this.counter = Math.max(this.counter, remoteTime) + 1;
    return this.counter;
  }
}

// Limitation: if clock(A) < clock(B), A may still be CONCURRENT with B.
// Lamport clocks give a consistent TOTAL order but lose concurrency info.
// Ties are broken arbitrarily (e.g. by node id).`,
      },
      {
        type: "text",
        heading: "Vector Clocks: Detecting Concurrency",
        content:
          "A **vector clock** keeps one counter **per process**, so each node can tell whether two events are causally ordered or concurrent — information a Lamport clock throws away. When a process acts, it increments its own slot; when it receives a message, it takes the element-wise maximum with the incoming vector and then increments its own slot.\n\nComparing two vectors: if every component of X is less-than-or-equal to Y and at least one is strictly less, X causally precedes Y. If neither dominates, the events are concurrent. Vector clocks power conflict detection in Dynamo-style stores (Riak, Cassandra's original design) and collaborative editors. Their cost is size: the vector grows with the number of participants, so they do not scale to thousands of nodes without trimming.",
      },
      {
        type: "code",
        heading: "A Vector Clock",
        language: "typescript",
        label: "vector-clock.ts",
        code: `type Vector = Record<string, number>;

function tick(v: Vector, self: string): Vector {
  return { ...v, [self]: (v[self] ?? 0) + 1 };
}

function merge(a: Vector, b: Vector): Vector {
  const out: Vector = { ...a };
  for (const [node, t] of Object.entries(b)) {
    out[node] = Math.max(out[node] ?? 0, t);
  }
  return out;
}

// Returns whether a precedes b, b precedes a, or they are concurrent.
function compare(a: Vector, b: Vector): "before" | "after" | "concurrent" {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let aLess = false;
  let bLess = false;
  for (const k of keys) {
    if ((a[k] ?? 0) < (b[k] ?? 0)) aLess = true;
    if ((b[k] ?? 0) < (a[k] ?? 0)) bLess = true;
  }
  if (aLess && !bLess) return "before";
  if (bLess && !aLess) return "after";
  return "concurrent";
}`,
      },
      {
        type: "text",
        heading: "Hybrid Logical Clocks",
        content:
          "Lamport clocks give causality but produce timestamps meaningless to humans; physical clocks are human-friendly but unsafe for ordering. **Hybrid logical clocks (HLC)** combine both: each timestamp carries a physical component close to NTP time plus a logical counter that breaks ties and preserves causality.\n\nHLC timestamps stay within a bounded distance of real time, so they remain useful for debugging and for time-based queries, while still guaranteeing that if A happens-before B then timestamp(A) < timestamp(B). CockroachDB, MongoDB, and YugabyteDB use HLCs to timestamp transactions. They give you the order of a logical clock with the readability of a wall clock — the best of both, as long as you never assume the physical part equals true time.",
      },
      {
        type: "comparison",
        heading: "Lamport vs Vector vs Hybrid Logical Clocks",
        headers: ["Lamport", "Vector", "Hybrid Logical (HLC)"],
        rows: [
          {
            aspect: "State per node",
            Lamport: "One integer",
            Vector: "One integer per process",
            "Hybrid Logical (HLC)": "Physical time + one counter",
          },
          {
            aspect: "Captures causality",
            Lamport: "Partial: A<B does not imply happens-before",
            Vector: "Exact: detects concurrency",
            "Hybrid Logical (HLC)": "Yes, like Lamport",
          },
          {
            aspect: "Detects concurrency",
            Lamport: "No",
            Vector: "Yes",
            "Hybrid Logical (HLC)": "No",
          },
          {
            aspect: "Timestamp close to wall clock",
            Lamport: "No",
            Vector: "No",
            "Hybrid Logical (HLC)": "Yes, within a bounded skew",
          },
          {
            aspect: "Scalability",
            Lamport: "Excellent",
            Vector: "Poor: size grows with nodes",
            "Hybrid Logical (HLC)": "Excellent (fixed size)",
          },
          {
            aspect: "Used by",
            Lamport: "Logical ordering, snapshot algorithms",
            Vector: "Riak, Dynamo-style conflict detection",
            "Hybrid Logical (HLC)": "CockroachDB, MongoDB, YugabyteDB",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Timestamps Are Not Causality",
        content:
          "A timestamp tells you when a machine *believed* something happened; a logical clock tells you what *could have caused* what. Use physical time for user-facing display, retention windows, and approximate analytics. Use logical time — Lamport, vector, or HLC — whenever correctness depends on ordering events across machines. Mixing the two up is how you ship a system that occasionally resurrects an older value after a newer one.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Physical clocks drift and get stepped by NTP, so they cannot safely order events across machines",
          "Happens-before captures causality; unordered events are concurrent and must not be forced into an order",
          "Lamport clocks give a consistent total order but can order concurrent events and lose concurrency info",
          "Vector clocks detect concurrency exactly, at the cost of state that grows with the number of nodes",
          "Hybrid logical clocks keep timestamps near wall-clock time while preserving causality in a fixed size",
          "Reserve wall-clock time for display; use logical time whenever cross-machine ordering affects correctness",
        ],
      },
    ],
    quiz: [
      {
        question: "What does the happens-before relation express?",
        options: [
          "Causal ordering: events where one could have influenced another",
          "The wall-clock distance between two events",
          "The network latency between two data centers",
          "The absolute physical time an event occurred",
        ],
        correctIndex: 0,
        explanation:
          "Happens-before captures causality via same-process order and message send/receive links, extended transitively. Events that cannot be related this way are concurrent, regardless of their timestamps.",
      },
      {
        question: "What is the key limitation of a Lamport clock?",
        options: [
          "It cannot distinguish causality from concurrency; ties are broken by node id",
          "It requires tightly synchronized physical clocks",
          "Its message size grows with the number of nodes",
          "Its values cannot be compared across nodes",
        ],
        correctIndex: 0,
        explanation:
          "If clock(A) < clock(B), A might still be concurrent with B. Lamport clocks yield a consistent total order but lose the ability to tell concurrency from causal ordering, unlike vector clocks.",
      },
      {
        question: "How do vector clocks overcome that limitation?",
        options: [
          "They keep one counter per process, allowing concurrency to be detected",
          "They rely on GPS-synchronized time",
          "They hash each event into a fixed-size digest",
          "They route all events through a single leader",
        ],
        correctIndex: 0,
        explanation:
          "A vector clock tracks progress on every process. Comparing two vectors reveals whether one causally precedes the other or whether they are concurrent, which a single-counter Lamport clock cannot do.",
      },
      {
        question:
          "Why do hybrid logical clocks (for example in CockroachDB) exist?",
        options: [
          "They combine physical time for human-friendly timestamps with a logical counter for causality",
          "They remove the need for any ordering guarantee",
          "They replace vector clocks with lossy hashing",
          "They disable replication for consistency",
        ],
        correctIndex: 0,
        explanation:
          "HLC timestamps stay close to real time (bounded by NTP skew) so they remain readable, while the logical component preserves happens-before. This gives causality plus wall-clock-friendly ordering at fixed cost.",
      },
    ],
  },

  // ─── DISTRIBUTED TRANSACTIONS ───────────────────────────────────────────

  "distributed-transactions": {
    slug: "distributed-transactions",
    title: "Distributed Transactions",
    tagline: "2PC, Saga, TCC, and the transactional outbox",
    sections: [
      {
        type: "text",
        heading: "One Unit of Work, Many Resources",
        content:
          "A single logical operation often spans several independent resources: debit one account, credit another, then hand off to a shipping service. On one database this is a transaction with ACID guarantees. Across separate services, each with its own database, there is no shared transaction manager and no shared lock table — so the same all-or-nothing semantics must be reconstructed from a protocol.\n\nThere are two broad families. **Atomic commitment** protocols (2PC, 3PC) try to give true atomicity, at the cost of coordination and blocking. **Compensation** protocols (Saga, TCC) accept that atomicity cannot be enforced cheaply across services and instead undo work when a later step fails. The right choice depends on how strict the consistency requirement is and how much latency you can afford.",
      },
      {
        type: "analogy",
        heading: "Two Banks and a Wire Transfer",
        content:
          "You want to move money from Bank A to Bank B. Neither bank controls the other's ledger, so there is no single vault where both debits and credits happen together.\n\nOne approach is 2PC: ask Bank A to *reserve* the money and Bank B to *promise* to accept it, and only once both agree does either move real funds. This is safe but slow, and if the coordinator goes silent after both say yes, both banks are stuck waiting. The other approach is a saga: debit A immediately, send the wire, and if the wire ultimately fails, reverse the debit with a compensating credit. Faster and non-blocking — but there is a window where the money is in flight and neither ledger alone tells the whole truth.",
      },
      {
        type: "text",
        heading: "Two-Phase Commit",
        content:
          "**Two-phase commit (2PC)** uses a coordinator and two rounds. In phase one (**prepare**), the coordinator asks each participant to do everything except commit: acquire locks, write its changes, and durably log that it is prepared. Each votes yes or no. In phase two (**commit**), if every participant voted yes, the coordinator tells them all to commit; otherwise it tells them all to abort.\n\n2PC gives atomicity but has a fatal property: it is **blocking**. If the coordinator crashes after collecting the votes but before sending the decision, participants hold their locks and wait, unable to commit or abort safely, until the coordinator recovers. One slow participant also stalls everyone, and locks held across the wait degrade throughput badly.",
      },
      {
        type: "code",
        heading: "The Two-Phase Commit Protocol",
        language: "typescript",
        label: "two-phase-commit.ts",
        code: `interface Participant {
  prepare(tx: Transaction): Promise<"yes" | "no">;
  commit(tx: Transaction): Promise<void>;
  abort(tx: Transaction): Promise<void>;
}

async function twoPhaseCommit(
  participants: Participant[],
  tx: Transaction,
): Promise<boolean> {
  // Phase 1 — PREPARE: each participant locks and logs intent,
  // but does NOT make its changes visible yet.
  const votes = await Promise.all(participants.map((p) => p.prepare(tx)));

  // A single "no" aborts the whole transaction.
  if (votes.some((v) => v === "no")) {
    await Promise.all(participants.map((p) => p.abort(tx)));
    return false;
  }

  // Phase 2 — COMMIT: the decision is written to the coordinator's
  // durable log BEFORE it is sent, so a crash after deciding cannot
  // change the outcome. Participants holding locks wait for this.
  await coordinator.logDecision(tx.id, "commit");
  await Promise.all(participants.map((p) => p.commit(tx)));
  return true;
}`,
      },
      {
        type: "text",
        heading: "Three-Phase Commit and Why It Rarely Ships",
        content:
          "**Three-phase commit (3PC)** adds a preliminary step — an intermediate can-commit phase — so that a prepared participant can time out safely rather than block forever. The extra round narrows the window during which a coordinator crash wedges everyone.\n\nThe catch is that 3PC assumes a **synchronous network** with bounded message delays and no partitions. Real networks can partition arbitrarily, and under a partition 3PC can still produce inconsistent decisions. Because the assumption does not hold in practice, 3PC is mostly a textbook stepping stone; production systems either use 2PC where blocking is acceptable (single-region, low-latency, well-controlled) or avoid atomic commitment entirely in favour of sagas.",
      },
      {
        type: "text",
        heading: "Sagas: Consistency Through Compensation",
        content:
          "A **saga** models a long-lived distributed workflow as a sequence of local transactions, each committing in its own service. If a step fails or a business rule rejects the result, the saga runs **compensating actions** for the steps already completed, in reverse order — refund the charge, release the reservation, restore the inventory.\n\nSagas are non-blocking and scale well because each step is a normal local transaction. The trade-off is that there is no global atomicity: intermediate states are visible to other readers, and compensations are business operations, not rollbacks — they can themselves fail and must be retried. Sagas are best when the workflow is long and the business can tolerate tentative intermediate states.",
      },
      {
        type: "comparison",
        heading: "2PC vs Saga",
        headers: ["2PC", "Saga"],
        rows: [
          {
            aspect: "Consistency",
            "2PC": "Atomic: all commit or all abort",
            Saga: "Temporal: intermediate states are visible",
          },
          {
            aspect: "Blocking",
            "2PC": "Blocking; locks held until the decision",
            Saga: "Non-blocking between steps",
          },
          {
            aspect: "Failure handling",
            "2PC": "Abort; no compensation logic needed",
            Saga: "Run compensating actions in reverse",
          },
          {
            aspect: "Latency",
            "2PC": "Two synchronous rounds, one slow node stalls all",
            Saga: "Step-by-step; slow steps do not block others",
          },
          {
            aspect: "Isolation",
            "2PC": "Locks give strong isolation",
            Saga: "No isolation; other readers see partial state",
          },
          {
            aspect: "Best fit",
            "2PC": "Short, tightly coupled, low-latency operations",
            Saga: "Long business workflows across independent services",
          },
        ],
      },
      {
        type: "text",
        heading: "TCC and the Transactional Outbox",
        content:
          "**TCC (Try-Confirm-Cancel)** is the reservation-shaped sibling of Saga. Each participant implements three operations: **Try** reserves resources (hold the funds, hold the seat), **Confirm** finalizes the reservation once all tries succeed, and **Cancel** releases the reservation. Because it reserves before committing, TCC gives better isolation than a naive saga at the cost of more work per participant.\n\nA separate, simpler problem is the **dual write**: updating your database and publishing an event are two operations that cannot both be made atomic with a broker. The **transactional outbox** solves it by writing the event into an `outbox` table in the *same local transaction* as the state change. A separate relay process reads the outbox in order and publishes to the broker; delivery is at-least-once, so consumers must be idempotent.",
      },
      {
        type: "code",
        heading: "The Transactional Outbox",
        language: "sql",
        label: "outbox.sql",
        code: `-- The business change and the event to publish commit together,
-- in ONE local transaction. Either both land or neither does.
BEGIN;

UPDATE accounts
   SET balance_cents = balance_cents - 5000
 WHERE id = 42 AND balance_cents >= 5000;

INSERT INTO outbox (id, aggregate_id, type, payload, created_at)
VALUES (gen_random_uuid(), '42', 'FundsDebited',
        jsonb_build_object('account', 42, 'amount', 5000),
        now());

COMMIT;
-- A relay reads outbox rows in id order and publishes them to the broker,
-- marking each row as sent. Delivery is at-least-once; make consumers
-- idempotent (dedupe on the event id) so a replay has no extra effect.`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Compensations Are Not Rollbacks",
        content:
          "A compensating action is a new business operation that offsets a previous one — it does not rewind time. If a compensation itself fails, the saga is left half-compensated, so compensations must be idempotent and retried until they succeed. They also cannot always restore the exact prior state: a sent email cannot be unsent, a seat released may already be rebooked. Model the business to tolerate these windows rather than pretending a saga gives you atomicity.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Atomic commitment (2PC) gives true all-or-nothing but blocks while locks are held",
          "2PC's fatal weakness is a coordinator crash between prepare and commit, stalling all participants",
          "3PC reduces blocking but assumes a synchronous network, so it rarely ships in production",
          "Sagas trade atomicity for non-blocking execution, using compensating actions on failure",
          "TCC reserves resources in a Try phase, then Confirm or Cancel — better isolation than a plain saga",
          "The transactional outbox avoids dual writes by committing the state change and the event together",
        ],
      },
    ],
    quiz: [
      {
        question:
          "In 2PC, what happens if the coordinator crashes after all participants vote yes but before sending the decision?",
        options: [
          "Participants hold their locks and block until the coordinator recovers",
          "All participants automatically commit",
          "All participants automatically abort",
          "The transaction silently restarts from scratch",
        ],
        correctIndex: 0,
        explanation:
          "After voting yes, a participant cannot unilaterally commit or abort. It must wait for the coordinator's decision, so a coordinator crash leaves everyone blocked with locks held — 2PC's classic blocking problem.",
      },
      {
        question: "What is a saga?",
        options: [
          "A sequence of local transactions with compensating actions on failure",
          "A single distributed transaction coordinated by two phases",
          "A locking protocol for shared rows",
          "A replication scheme for read replicas",
        ],
        correctIndex: 0,
        explanation:
          "A saga breaks a long workflow into independent local transactions. If a step fails, it runs compensating actions in reverse to offset completed work, trading atomicity for non-blocking progress.",
      },
      {
        question: "Why is the transactional outbox pattern used?",
        options: [
          "To atomically record a state change and the event to publish, avoiding unsafe dual writes",
          "To encrypt messages before they reach the broker",
          "To order events across replicas by timestamp",
          "To replace 2PC with distributed locks",
        ],
        correctIndex: 0,
        explanation:
          "Writing to the database and publishing to a broker are two operations that cannot be made atomic together. The outbox stores the event in the same local transaction as the state change, and a relay publishes it afterward.",
      },
      {
        question: "What does TCC (Try-Confirm-Cancel) do?",
        options: [
          "Reserves resources in Try, then finalizes with Confirm or releases with Cancel",
          "Runs a two-phase commit with a synchronous network assumption",
          "Uses logical clocks to order transactions",
          "Caches results to avoid recomputation",
        ],
        correctIndex: 0,
        explanation:
          "TCC is a reservation-based pattern: each participant first reserves resources (Try), and once all reservations succeed they are confirmed, or they are cancelled if any step fails. It offers better isolation than a naive saga.",
      },
    ],
  },

  // ─── DELIVERY SEMANTICS ─────────────────────────────────────────────────

  "delivery-semantics": {
    slug: "delivery-semantics",
    title: "Delivery Semantics",
    tagline: "At-most-once to exactly-once, and why idempotency wins",
    sections: [
      {
        type: "text",
        heading: "Three Promises You Can Make",
        content:
          "When a producer sends a message and a consumer processes it, the system can promise one of three things about how many times the message is delivered: **at-most-once** (never more than once, may be lost), **at-least-once** (never lost, may repeat), and **exactly-once** (once and only once). The choice determines whether you need deduplication, retries, or nothing at all.\n\nThe decision is forced by the **acknowledgement problem**. The consumer must tell the producer it succeeded, but that acknowledgement can be lost. If the producer retries, the message may be processed twice; if it does not retry, the message may be lost. There is no way around this loop with a lossy network — you can only choose which side of it to fail toward.",
      },
      {
        type: "analogy",
        heading: "Mailing a Letter",
        content:
          "You post a letter and want it to reach a friend. **At-most-once** is dropping it in the box and never checking — it may arrive, or it may be lost, but it will never arrive twice. **At-least-once** is resending until the friend confirms receipt — it always arrives, but your impatience may deliver two copies. **Exactly-once** would be knowing for certain it arrived once.\n\nThe postal service cannot give you that last guarantee, because a confirmation card can itself be lost. What it *can* do is give you at-least-once delivery plus a friend who checks whether they already read that letter before acting on it. That habit — idempotency — is what makes repetition harmless.",
      },
      {
        type: "text",
        heading: "At-Most-Once: Fire and Forget",
        content:
          "With **at-most-once**, the producer sends a message and does not retry. If it is lost, it is gone. This is the cheapest option: no acknowledgement bookkeeping, no deduplication, no persistent state. Its clear fit is high-volume, low-value signals where losing an occasional message is acceptable — metrics, trace spans, occasional log lines.\n\nIts danger is silent loss. Because there is no retry, failures look like quiet gaps in data rather than errors. If a downstream consumer depends on every message for correctness, at-most-once will eventually produce wrong results that are hard to diagnose precisely because nothing failed loudly.",
      },
      {
        type: "text",
        heading: "At-Least-Once: Retry Until Acknowledged",
        content:
          "With **at-least-once**, the producer retries until it receives an acknowledgement, so messages are never lost — but they may be delivered more than once. This is the pragmatic default for most systems, including Kafka producers with retries enabled and virtually every queue-based workflow.\n\nThe cost is that consumers must tolerate duplicates. A retry can happen when the acknowledgement was lost even though the work succeeded, so the consumer is reprocessing a message it already handled. It is not enough to make the *producer* retry-safe; the *consumer* must be idempotent, and side effects such as sending an email or charging a card must be guarded against replay.",
      },
      {
        type: "text",
        heading: "Exactly-Once: The Useful Illusion",
        content:
          "True **exactly-once** delivery over an unreliable network is impossible in general: because acknowledgements can be lost, a producer can never be sure whether to retry, so it cannot guarantee exactly one processing without help. What systems advertise as exactly-once is really **effectively-once**: at-least-once delivery combined with deduplication or a transactional commit that makes the duplicate a no-op.\n\nKafka's exactly-once semantics, for example, use an **idempotent producer** (sequence numbers let the broker drop duplicates), **transactions** that atomically commit offsets alongside output, and a **read_committed** isolation level so consumers never see uncommitted writes. That gives exactly-once *within Kafka's boundaries*; the moment data leaves for an external system, you are back to at-least-once plus idempotency.",
      },
      {
        type: "code",
        heading: "An Idempotent Consumer",
        language: "typescript",
        label: "idempotent-consumer.ts",
        code: `// At-least-once means the same message can arrive twice.
// Make the effect idempotent by recording processed message ids.
async function handlePayment(msg: { id: string; amount: number }) {
  await db.transaction(async (tx) => {
    // Mark-then-act in ONE transaction: a duplicate insert hits the
    // unique constraint, so the whole handler becomes a no-op.
    const inserted = await tx
      .insertInto("processed_messages")
      .values({ id: msg.id })
      .onConflict(doNothing) // 0 rows if this id was already seen
      .execute();

    if (inserted === 0) return; // duplicate delivery: already applied

    await tx.insertInto("charges").values({
      messageId: msg.id,
      amount: msg.amount,
    });
  });
}`,
      },
      {
        type: "comparison",
        heading: "At-Most-Once vs At-Least-Once vs Exactly-Once",
        headers: ["At-Most-Once", "At-Least-Once", "Exactly-Once"],
        rows: [
          {
            aspect: "Message loss",
            "At-Most-Once": "Possible",
            "At-Least-Once": "None (with retries)",
            "Exactly-Once": "None (with dedup/transactions)",
          },
          {
            aspect: "Duplicate delivery",
            "At-Most-Once": "Never",
            "At-Least-Once": "Possible",
            "Exactly-Once": "Effectively suppressed",
          },
          {
            aspect: "Producer effort",
            "At-Most-Once": "Fire and forget",
            "At-Least-Once": "Retry until acked",
            "Exactly-Once": "Idempotent producer + transactions",
          },
          {
            aspect: "Consumer requirement",
            "At-Most-Once": "None",
            "At-Least-Once": "Must be idempotent",
            "Exactly-Once": "Uses broker-provided dedup/offsets",
          },
          {
            aspect: "Cost",
            "At-Most-Once": "Lowest",
            "At-Least-Once": "Moderate",
            "Exactly-Once": "Highest; often bound to one broker",
          },
          {
            aspect: "Typical use",
            "At-Most-Once": "Metrics, traces, sampled logs",
            "At-Least-Once": "Orders, payments, general messaging",
            "Exactly-Once": "Stream processing with transactional sinks",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Exactly-Once Usually Ends at the Broker",
        content:
          "Every claim of exactly-once has a boundary, and it is almost always the broker's edge. Kafka can guarantee it *from producer to consumer within Kafka*, because the broker controls offsets and can deduplicate by sequence number. The instant your consumer calls an external payment API, sends an email, or writes to another database, that boundary is crossed and you are back to at-least-once. Design the external side effect to be idempotent rather than assuming the broker will protect you.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "The lost-acknowledgement problem forces a choice: risk loss or risk duplicates, never neither for free",
          "At-most-once is cheapest but silently loses messages, so it fits only low-value signals",
          "At-least-once never loses messages but can repeat them, so consumers must be idempotent",
          "True exactly-once is impossible end-to-end; what ships is effectively-once via dedup or transactions",
          "Idempotency (dedupe on a message id) is the real tool that makes repeats harmless",
          "Exactly-once guarantees end at the broker boundary — protect external side effects yourself",
        ],
      },
    ],
    quiz: [
      {
        question: "What does at-least-once delivery guarantee?",
        options: [
          "Messages are never lost but may be delivered more than once",
          "Messages are never duplicated",
          "Messages may be silently lost",
          "Messages always arrive in strict order",
        ],
        correctIndex: 0,
        explanation:
          "At-least-once retries until acknowledged, so nothing is lost. Because a lost acknowledgement triggers a resend even when the work succeeded, the same message can be processed more than once.",
      },
      {
        question:
          "Why can true exactly-once delivery not be guaranteed over an unreliable network?",
        options: [
          "An acknowledgement can be lost, forcing a retry that duplicates the effect",
          "Brokers are inherently too slow to avoid timeouts",
          "TCP can silently drop acknowledged bytes",
          "Serialization formats like JSON are lossy",
        ],
        correctIndex: 0,
        explanation:
          "The producer cannot distinguish a lost message from a lost acknowledgement. If it retries it risks duplication; if it does not, it risks loss. Perfect exactly-once would require certainty the network cannot provide.",
      },
      {
        question: "What is the practical route to effectively-once processing?",
        options: [
          "At-least-once delivery combined with idempotent consumers",
          "At-most-once delivery with aggressive retries",
          "Disabling acknowledgements to reduce overhead",
          "Switching the transport to UDP",
        ],
        correctIndex: 0,
        explanation:
          "Since exactly-once is unattainable end-to-end, systems pair at-least-once delivery with deduplication. Duplicates still arrive but have no additional effect, so the observable outcome is once.",
      },
      {
        question: "What makes a consumer idempotent?",
        options: [
          "Recording processed message ids so a replay of the same message has no extra effect",
          "Spawning more worker threads per message",
          "Compressing message payloads before processing",
          "Increasing processing timeouts to avoid retries",
        ],
        correctIndex: 0,
        explanation:
          "An idempotent consumer detects that a message was already handled — typically by a unique constraint on the message id — and skips the effect, so redelivery changes nothing.",
      },
    ],
  },

  // ─── CONSISTENCY MODELS ─────────────────────────────────────────────────

  "consistency-models": {
    slug: "consistency-models",
    title: "Consistency Models",
    tagline: "Linearizability, causal, and eventual — and what each costs",
    sections: [
      {
        type: "text",
        heading: "A Spectrum, Not a Switch",
        content:
          "A **consistency model** is a contract between a storage system and its clients describing what values reads may return after writes. It is not a feature you switch on; it is a spectrum from strongest (behaves like one machine) to weakest (replicas converge eventually). The stronger the guarantee, the more coordination it requires, and the more latency and lower availability you pay.\n\nChoosing a model is choosing which anomalies your application can tolerate. The engineering question is never what is the strongest model I can get but what is the weakest model my application remains correct under, because weaker models are faster, more available, and cheaper across regions.",
      },
      {
        type: "analogy",
        heading: "Editing One Shared Document",
        content:
          "Imagine colleagues editing one shared document. **Linearizable** access is a single administrator who hands out an up-to-the-second copy and refuses to hand out a stale one — everyone always sees the latest edit, but they queue behind the administrator. **Causal** access lets people read their own edits and any edits they have seen, but two people editing different sections may briefly disagree about the overall state. **Eventual** access hands out whatever copy is nearby and trusts that, with no new edits, everyone's copy drifts into agreement.\n\nThe administrator is correct and slow; the nearby copy is fast but can be stale. Most real systems sit somewhere between, and the trick is picking the point where your users never notice the difference.",
      },
      {
        type: "text",
        heading: "Linearizability: As If One Machine",
        content:
          "**Linearizability** (often called strong consistency) guarantees that every operation appears to take effect atomically at a single point between its start and its completion, and that this order respects real time. If write W completes before read R begins, R must see W or a later value — never an older one. The system behaves as if there were one copy with no replication lag.\n\nThis is the strongest single-object model and the most expensive: reads and writes typically require a quorum round trip, and availability drops if a majority is unreachable. Single-region consensus stores (etcd, ZooKeeper, Spanner with TrueTime) provide it; it is what you use when correctness depends on every reader seeing the latest write.",
      },
      {
        type: "text",
        heading: "Sequential and Causal Consistency",
        content:
          "**Sequential consistency** requires that operations appear in some total order that is consistent with each client's program order — but that order need not respect real time. Writes from one client are seen in the order that client made them, and all clients agree on one interleaving, yet a later write may be observed before an earlier one that did not causally depend on it.\n\n**Causal consistency** is weaker still and preserves exactly the **happens-before** relation: if write A causally precedes write B, no client sees B without A. Concurrent writes may be observed in different orders by different replicas. It captures the ordering users actually perceive — replies after posts — without paying for a global total order, and it is the strongest model that stays available under network partitions.",
      },
      {
        type: "text",
        heading: "Eventual Consistency",
        content:
          "**Eventual consistency** promises only that, if writes stop, all replicas will eventually converge to the same value. It says nothing about how long convergence takes or what intermediate reads return. It is the model of Dynamo-style stores, DNS, and CDNs, and it is what enables low-latency writes anywhere in the world.\n\nThe price is observable anomalies. A reader may see a value that never existed as a settled state (a **stale read**), or see its own writes disappear momentarily (**read-your-writes violation**). Eventual consistency is fine for likes, view counts, and social feeds — where a brief disagreement is invisible — and dangerous for inventory counts, balances, and anything that decides who owns what.",
      },
      {
        type: "text",
        heading: "Session Guarantees: Read-Your-Writes",
        content:
          "Between full linearizability and raw eventual consistency sits a family of **session guarantees** that hold per client rather than globally. The most important is **read-your-writes**: a client that has just written will see that write on subsequent reads, even if other clients briefly see something older. Others include **monotonic reads** (a client never moves backward in time) and **monotonic writes** (a client's writes apply in order).\n\nThese are cheap and enormously useful: they remove the single most jarring user-visible glitch — updating your profile, refreshing, and seeing the old value. They are usually implemented by tagging each read with the position of the last write the client observed and routing it to a replica that has caught up at least that far.",
      },
      {
        type: "code",
        heading: "Enforcing Read-Your-Writes",
        language: "typescript",
        label: "read-your-writes.ts",
        code: `// After a write, return the log position (or LSN) to the client.
const { lsn } = await primary.updateProfile(userId, patch);
res.setHeader("x-read-lsn", String(lsn));

// On the next read, only accept a replica that has caught up to that LSN.
async function readFromQualifiedReplica(userId: string, minLsn: number) {
  for (const replica of replicas) {
    if ((await replica.knownLsn()) >= minLsn) {
      return replica.getProfile(userId); // sees at least our own write
    }
  }
  return primary.getProfile(userId); // fall back to the source of truth
}`,
      },
      {
        type: "comparison",
        heading: "Strong vs Causal vs Eventual",
        headers: ["Strong (Linearizable)", "Causal", "Eventual"],
        rows: [
          {
            aspect: "Guarantee",
            "Strong (Linearizable)": "Single up-to-date copy, real-time order",
            Causal: "Preserves happens-before; concurrent writes may differ",
            Eventual: "Replicas converge once writes stop",
          },
          {
            aspect: "Read latency",
            "Strong (Linearizable)": "High: a quorum or leader round trip",
            Causal: "Moderate",
            Eventual: "Low: read any nearby replica",
          },
          {
            aspect: "Availability under partition",
            "Strong (Linearizable)": "Drops on the minority side",
            Causal: "Preserved",
            Eventual: "Preserved",
          },
          {
            aspect: "Anomalies possible",
            "Strong (Linearizable)": "None within the contract",
            Causal: "Concurrent writes reorder per replica",
            Eventual: "Stale reads, lost own writes",
          },
          {
            aspect: "Coordination",
            "Strong (Linearizable)": "Consensus on every operation",
            Causal: "Track and ship dependency metadata",
            Eventual: "Best-effort replication",
          },
          {
            aspect: "Typical use",
            "Strong (Linearizable)": "Balances, inventory, locks, config",
            Causal: "Comments, messaging, collaborative apps",
            Eventual: "Feeds, likes, view counts, CDNs",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "CAP Is a Trade-off, Not a Menu",
        content:
          "The CAP theorem says only that under a network partition you must choose between consistency and availability — it says nothing about the common case where the network is fine. Use the strong model where an anomaly would be a correctness bug (money, ownership, capacity) and the weaker models where it is a cosmetic one (a like count, a follower number). The mature move is to mix models per operation: linearizable for the checkout, eventual for the activity feed on the same screen.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Pick the weakest model your application is correct under; stronger means more coordination and latency",
          "Linearizability gives a single up-to-date copy with real-time order, at the cost of quorums and availability",
          "Causal consistency preserves happens-before and is the strongest model available under partition",
          "Eventual consistency only guarantees convergence, allowing stale reads and lost-own-write anomalies",
          "Session guarantees like read-your-writes are cheap and remove the most visible user-facing glitches",
          "Mix models per operation: linearizable where anomalies are correctness bugs, eventual where they are cosmetic",
        ],
      },
    ],
    quiz: [
      {
        question: "What does linearizability guarantee?",
        options: [
          "Each operation appears atomic at a point between its start and end, respecting real time",
          "Replicas converge given no further writes",
          "Only that causally related writes are ordered",
          "No ordering guarantees at all",
        ],
        correctIndex: 0,
        explanation:
          "Linearizability makes the system look like a single up-to-date copy: if a write completes before a read starts, the read sees that write or later. It is the strongest single-object consistency model.",
      },
      {
        question: "What is the read-your-writes guarantee?",
        options: [
          "A client that wrote a value will see that value on its own subsequent reads",
          "All clients see a single global total order of writes",
          "Replicas eventually converge to the same value",
          "Writes are guaranteed to be durable on all replicas",
        ],
        correctIndex: 0,
        explanation:
          "Read-your-writes is a per-session guarantee: a client sees its own writes immediately even if other clients briefly see older data. It is typically enforced by routing reads to a replica caught up to the client's last write.",
      },
      {
        question: "What does eventual consistency guarantee?",
        options: [
          "Replicas converge to the same value once writes stop",
          "Every read sees the latest write immediately",
          "Writes are observed in a global total order",
          "Reads are always linearizable",
        ],
        correctIndex: 0,
        explanation:
          "Eventual consistency promises only convergence in the absence of new writes. It makes no promise about how long that takes or what a read returns in the meantime, so stale reads are possible.",
      },
      {
        question: "What does causal consistency preserve?",
        options: [
          "The happens-before ordering across the system, while concurrent operations may be ordered differently per replica",
          "Strict real-time ordering of all operations",
          "Full serializability of transactions",
          "No ordering guarantees whatsoever",
        ],
        correctIndex: 0,
        explanation:
          "Causal consistency ensures that if write A happens-before write B, no replica shows B before A. Concurrent writes, however, may appear in different orders to different replicas — it is the strongest model that remains available under partition.",
      },
    ],
  },
};

