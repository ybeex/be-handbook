// Part 10: System design interview case studies

import type { TopicContent } from './contentTypes';

export const TOPIC_CONTENT_PART10: Record<string, TopicContent> = {

  'design-news-feed': {
    slug: 'design-news-feed',
    title: 'Design a News Feed',
    tagline: 'Fanout, ranking, and caching at millions of DAU',
    sections: [
      { type: 'text', heading: 'Defining the Problem', content: 'Design the home feed of a social product — the ranked, paginated list of posts from the accounts a user follows. The interviewer is not asking for a Twitter clone in full; they are asking how you turn a follow graph and a stream of new posts into a fast, fresh, ranked page for hundreds of millions of readers.\n\nThe hard part is not storing posts. It is serving a personalized, ranked timeline at read time with single-digit-millisecond latency, while authors keep publishing and the follow graph keeps changing underneath you.' },
      { type: 'text', heading: 'Functional and Non-Functional Requirements', content: '**Functional:** a user can follow and unfollow accounts; a user can publish a post; the home feed shows recent posts from followed accounts, ranked, with cursor pagination; new posts appear with low delay; the feed survives refresh and does not duplicate entries.\n\n**Non-functional:** read-heavy (roughly 100:1 reads to writes); feed reads must be fast — p99 under 200ms — and available even if ranking degrades to a pure reverse-chronological fallback; posts should propagate to most followers within seconds; the system must handle millions of concurrent readers and a small number of accounts with tens of millions of followers.' },
      { type: 'analogy', heading: 'The Newspaper Analogy', content: 'A morning newspaper is printed once, for everyone. Every subscriber reads the same pages in the same order — cheap to produce, impossible to personalize.\n\nA personalized feed is the opposite: a bespoke edition assembled per reader, drawing headlines from thousands of sources and reordering them by what that reader is likely to want. Printing a separate edition on demand for every subscriber is absurd if you do it from scratch each time — so you pre-assemble (precompute) the edition for most readers, and only assemble the rare editions at the moment they are requested.' },
      { type: 'text', heading: 'Back-of-the-Envelope Estimation', content: 'Assume 300 million daily active users, each following about 200 accounts on average. If 5% of users post per day, that is 15 million posts daily. A post with 150 average followers generates fanout work proportional to follower count — the number that decides your whole architecture.\n\nReads dominate: 15 feed opens per user per day is 4.5 billion reads, versus 15 million writes. That ratio tells you to precompute and cache aggressively on the write side so the read side is a cheap lookup, not a fan-in query over hundreds of followed authors.' },
      { type: 'code', heading: 'Sizing the Feed', language: 'typescript', label: 'feed-sizing.ts', code: `// Back-of-the-envelope sizing for a news feed
const dau = 300_000_000;
const avgFollows = 200;
const postsPerUserPerDay = 0.05;
const avgFollowersPerAuthor = 150;
const feedReadsPerUserPerDay = 15;

// Write fanout volume
const newPostsPerDay = dau * postsPerUserPerDay;                   // 15M posts/day
const fanoutWritesPerDay = newPostsPerDay * avgFollowersPerAuthor; // 2.25B feed inserts/day

// Read volume
const feedReadsPerDay = dau * feedReadsPerUserPerDay;              // 4.5B feed reads/day
const peakReadRps = Math.ceil((feedReadsPerDay / 86_400) * 3);     // ~156k rps at 3x peak

// Cache each user's newest 500 post IDs (8 bytes each) in Redis
const cachedPerUser = 500 * 8;                                     // 4 KB per user
const redisMemoryGb = (dau * cachedPerUser) / 1e9;                 // ~1.2 TB of feed cache
console.log({ fanoutWritesPerDay, peakReadRps, redisMemoryGb });` },
      { type: 'code', heading: 'Feed API', language: 'http', label: 'feed-api.http', code: `GET /v1/feed?limit=20&cursor=eyJ0cyI6MTcyMzAwMDAwMCwiaWQiOiI5In0 HTTP/1.1
Host: api.example.com
Authorization: Bearer <token>

HTTP/1.1 200 OK
Content-Type: application/json

{
  "items": [
    { "id": "post_9f3", "authorId": "u_42", "createdAt": "2026-11-15T10:00:00Z", "score": 0.87 }
  ],
  "nextCursor": "eyJ0cyI6MTcyMjk5OTAwMCwiaWQiOiIxZjIifQ"
}

POST /v1/posts HTTP/1.1
Host: api.example.com
Content-Type: application/json

{ "text": "Shipping the feed today.", "mediaIds": [] }

HTTP/1.1 201 Created
{ "id": "post_9f3", "authorId": "u_42", "createdAt": "2026-11-15T10:00:00Z" }` },
      { type: 'text', heading: 'High-Level Architecture', content: 'A write path and a read path meet in the middle. On write, the post service persists the post and publishes a post-created event to a queue. A fleet of fanout workers consumes that event and pushes the post ID into the precomputed feed of every follower. On read, the feed service fetches the precomputed IDs, hydrates the posts from a post cache backed by the post store, applies ranking, and returns a cursor page.\n\nThe follow graph lives in its own service because it is read constantly by fanout and by ranking. The post store is a durable, sharded key-value or relational store keyed by post ID. The feed cache is a Redis cluster holding one sorted set per user. Every hop is designed so the hot read path is a handful of in-memory lookups.' },
      { type: 'comparison', heading: 'Fanout on Write vs Fanout on Read', headers: ['Fanout on Write', 'Fanout on Read'], rows: [
        { aspect: 'When work happens', 'Fanout on Write': 'At post creation, for every follower', 'Fanout on Read': 'At feed request, over followed authors' },
        { aspect: 'Read latency', 'Fanout on Write': 'Very low — a precomputed lookup', 'Fanout on Read': 'Higher — must read and merge many timelines' },
        { aspect: 'Write cost', 'Fanout on Write': 'High — one insert per follower', 'Fanout on Read': 'Low — store the post once' },
        { aspect: 'Celebrity authors', 'Fanout on Write': 'Pathological — 50M inserts per post', 'Fanout on Read': 'Natural — fan-in is capped by the reader' },
        { aspect: 'Inactive followers', 'Fanout on Write': 'Wasted work for users who never open the app', 'Fanout on Read': 'No work until the user reads' },
        { aspect: 'Used by', 'Fanout on Write': 'Classic timelines with mostly ordinary users', 'Fanout on Read': 'Ranked feeds that merge on demand' },
      ]},
      { type: 'callout', calloutType: 'warning', heading: 'The Celebrity Problem', content: 'Fanout on write collapses for accounts with tens of millions of followers. A single post from a celebrity would enqueue tens of millions of inserts, and a burst of such posts saturates the fanout queue and delays everyone else. If the same account posts five times an hour, the follower feed cache churns constantly.\n\nThe fix is a hybrid: push fanout for ordinary authors, but for authors above a follower threshold (say 100,000) skip the push and pull their recent posts at read time, merging them with the pushed entries. The reader only follows a handful of celebrities, so the read-time fan-in is tiny.' },
      { type: 'code', heading: 'Hybrid Fanout', language: 'typescript', label: 'hybrid-fanout.ts', code: `const CELEBRITY_THRESHOLD = 100_000;

async function onPostCreated(post: Post): Promise<void> {
  const followerCount = await socialGraph.followerCount(post.authorId);

  if (followerCount <= CELEBRITY_THRESHOLD) {
    // Fanout on write: enqueue a chunked push to every follower feed
    await fanoutQueue.enqueue('push-to-followers', { postId: post.id, authorId: post.authorId });
  } else {
    // Celebrity: skip push, keep the post in a per-author timeline for pull
    await celebrityTimeline.add(post.authorId, post.id, post.createdAtMs);
  }
}

async function buildFeed(userId: string, cursor: Cursor): Promise<Post[]> {
  const pushedIds = await feedCache.range(userId, cursor, 200);         // precomputed
  const celebrities = await socialGraph.celebritiesFollowedBy(userId);   // a few dozen
  const pulled = await mergeAuthorTimelines(celebrities, cursor);       // k-way merge
  const merged = dedupeById([...pushedIds, ...pulled]);
  return rank(merged).slice(0, 20);
}` },
      { type: 'text', heading: 'Feed Ranking and Feed Caching', content: 'Ranking turns a set of candidate posts into an order. A practical pipeline is a light scoring stage over a few hundred candidates, then a heavier model over the top few dozen. A simple transparent score is recency decayed exponentially, multiplied by affinity between reader and author, plus engagement signals and a small negative score for things already seen.\n\nThe cache holds the candidate list, not the ranked result, because ranking depends on per-user context that changes between sessions. The precomputed Redis sorted set stores post IDs scored by creation time, capped at the newest few hundred entries. Hydration reads full posts from a read-through cache keyed by post ID, and hydration happens after ranking the IDs so you fetch only the page you will actually show.' },
      { type: 'code', heading: 'Redis Feed Cache and Cursor Pagination', language: 'typescript', label: 'feed-cache.ts', code: `// Store feed entries in a sorted set scored by post timestamp in milliseconds
await redis.zadd('feed:u_42', post.createdAtMs, post.id);
await redis.zremrangebyrank('feed:u_42', 0, -501); // keep only the newest 500 IDs

// Cursor pagination: an exclusive range below the last seen score
const cursorScore = decodeCursor(cursor).ts; // e.g. 1723000000000
const ids = await redis.zrevrangebyscore(
  'feed:u_42',
  '(' + cursorScore,   // exclusive upper bound
  '-inf',
  'LIMIT', 0, 20,
);

// Hydrate IDs into full posts via a read-through post cache
const posts = await postCache.mget(ids);

// Offset pagination is unstable here: new posts shift every page.
// A score cursor (creation time + post id tiebreak) gives stable, gapless pages.` },
      { type: 'steps', heading: 'Writing a Post End to End', steps: [
        { title: 'Validate and persist', detail: 'The post service validates the request and writes the post to the durable post store.' },
        { title: 'Publish the event', detail: 'A post-created event is published to the fanout queue with the author and post ID.' },
        { title: 'Fanout workers resolve followers', detail: 'Workers read the follower list in chunks; ordinary authors push, celebrities are skipped.' },
        { title: 'Push IDs into feed caches', detail: 'Each follower sorted set gets the post ID and is trimmed to the newest 500 entries.' },
        { title: 'Read path assembles', detail: 'On request, the service merges pushed entries with pulled celebrity posts, ranks, and returns a cursor page.' },
      ]},
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'Reads outnumber writes about 100:1, so precompute fanout and keep the read path a cheap lookup',
        'Fanout on write gives fast reads but collapses for celebrity authors',
        'The hybrid approach pushes for ordinary authors and pulls celebrity posts at read time',
        'Cache the candidate ID list in Redis sorted sets, capped at the newest few hundred entries',
        'Rank IDs first, then hydrate only the page you will display',
        'Use a score cursor rather than an offset so pagination stays stable as new posts arrive',
      ]},
    ],
    quiz: [
      { question: 'Why does pure fanout on write fail for a celebrity with 50 million followers?', options: ['Their posts are too large to store', 'One post triggers tens of millions of cache inserts, saturating the fanout pipeline', 'Followers cannot be read from the graph at that scale', 'Redis sorted sets cannot exceed one million entries'], correctIndex: 1, explanation: 'Fanout on write performs one insert per follower. At 50 million followers a single post enqueues 50 million writes, and a burst of posts delays fanout for every other author. The hybrid approach pulls celebrity posts at read time instead.' },
      { question: 'What is stored in the per-user Redis feed cache?', options: ['The fully ranked and rendered page', 'A capped list of post IDs scored by creation time', 'Copies of every post body from followed authors', 'The follower list of the user'], correctIndex: 1, explanation: 'The cache holds a bounded sorted set of post IDs scored by creation time — the candidate list. Ranking is applied per request because it depends on reader context, and only the displayed page is hydrated from the post cache.' },
      { question: 'Why is a score cursor preferred over an offset for feed pagination?', options: ['It uses less memory', 'New posts shift offsets, causing duplicates and gaps between pages', 'Offsets are not supported by Redis', 'It returns more posts per request'], correctIndex: 1, explanation: 'With offset pagination, posts inserted between requests push items across page boundaries, so a reader sees duplicates or misses entries. A cursor anchored to the last item score and ID returns a stable, gapless sequence.' },
    ]
  },

  'design-file-storage': {
    slug: 'design-file-storage',
    title: 'Design File Storage',
    tagline: 'Chunking, deduplication, and multi-device sync',
    sections: [
      { type: 'text', heading: 'Defining the Problem', content: 'Design a Dropbox-style or Google Drive-style service: users upload files from multiple devices, the files sync across those devices, share links and permissions work, and storage is economical at petabyte scale. The visible product is a folder that looks local. The invisible product is a distributed system that stores, deduplicates, versions, and reconciles the same data across many machines and clients.\n\nThe interesting questions are not about copying bytes to a bucket. They are about how you split files so a small edit transfers little data, how you avoid storing the same bytes twice, how you reconcile edits made offline on two devices, and how you resume a 50 GB upload that drops at 90%.' },
      { type: 'text', heading: 'Functional and Non-Functional Requirements', content: '**Functional:** upload, download, and delete files; sync changes to all a user devices; folder hierarchy and sharing with view, comment, and edit permissions; version history; resumable uploads; conflict handling when two devices edit the same file.\n\n**Non-functional:** durable (no acknowledged upload is ever lost); strongly consistent for metadata within a user account; efficient — a one-byte edit should not re-upload a 1 GB file; deduplicating across users to cut physical storage; supporting files up to tens of gigabytes; and safe resumption across flaky mobile networks.' },
      { type: 'analogy', heading: 'The Moving House in Boxes', content: 'If you move to a new house and pack everything into one giant crate, then change a single book, you must unpack and repack the entire crate. If instead you pack many small labelled boxes, changing the book means touching one box.\n\nChunking is packing files into many labelled boxes. Each box gets a label computed from its contents (a hash). Two boxes with identical contents share a label, so you store one copy and reference it twice. This is deduplication, and it is what makes both small edits and shared files cheap.' },
      { type: 'text', heading: 'Back-of-the-Envelope Estimation', content: 'Assume 100 million users, 2,000 files each, and an average file size of 0.5 MB — dominated by small documents and a long tail of large media. That is on the order of 100 PB of logical data. Real workloads deduplicate and compress well, often 2-4x, so physical storage lands far lower.\n\nThe block count matters more than the byte count: chunking at a 4 MB average yields billions of blocks, each of which must be addressable, deduplicated, and garbage-collected. Metadata per file and per block becomes its own scale problem.' },
      { type: 'code', heading: 'Sizing Storage', language: 'typescript', label: 'storage-sizing.ts', code: `// Back-of-the-envelope sizing for a Dropbox-style service
const users = 100_000_000;
const filesPerUser = 2_000;
const avgFileSizeMb = 0.5;

const totalLogicalBytes = users * filesPerUser * avgFileSizeMb * 1e6;
const totalLogicalPb = totalLogicalBytes / 1e15;   // ~100 PB logical

// Deduplication and compression cut physical storage, often 2-4x in practice
const dedupFactor = 2.5;
const physicalPb = totalLogicalPb / dedupFactor;   // ~40 PB physical

// Content-defined chunking with a 4 MB average block size
const avgBlockMb = 4;
const blocks = totalLogicalBytes / (avgBlockMb * 1e6); // ~2.5e10 blocks
console.log({ totalLogicalPb, physicalPb, blocks });` },
      { type: 'code', heading: 'Sync and Upload API', language: 'http', label: 'sync-api.http', code: `POST /v1/files/upload/session HTTP/1.1
Host: api.example.com
Content-Type: application/json

{ "path": "/docs/report.pdf", "size": 104857600, "contentHash": "sha256:ab12..." }

HTTP/1.1 201 Created
{ "uploadId": "up_7f2a", "chunkSize": 4194304, "missingChunks": [12, 13, 14] }

# Client uploads only the chunks the server does not already have
PUT /v1/files/upload/up_7f2a/chunk/12 HTTP/1.1
Content-Range: bytes 50331648-54525951/104857600

HTTP/1.1 200 OK
{ "received": 13, "total": 25 }

# Other devices pull metadata deltas since their last cursor
GET /v1/changes?cursor=98213 HTTP/1.1
HTTP/1.1 200 OK
{ "changes": [ { "path": "/docs/report.pdf", "rev": 7 } ], "nextCursor": 98230 }` },
      { type: 'text', heading: 'High-Level Architecture', content: 'Split the system into a metadata plane and a data plane. The metadata service is a strongly consistent, transactional store (per-account sharded) holding files, versions, block lists, and permissions. The data plane is an object store such as S3 holding immutable blocks and whole-file blobs, keyed by content hash.\n\nClients run a sync engine: a local change watcher, a chunker, an uploader, and a downloader. A notification service (long poll or websocket) tells devices that a cursor advanced so they can fetch deltas without polling the metadata service hard. A garbage collector reclaims blocks whose reference count drops to zero.' },
      { type: 'comparison', heading: 'Full-File Sync vs Block Sync', headers: ['Full-File Sync', 'Block Sync'], rows: [
        { aspect: 'Unit transferred', 'Full-File Sync': 'The whole file every time', 'Block Sync': 'Only changed blocks' },
        { aspect: 'Cost of a small edit', 'Full-File Sync': 'Re-upload the entire file', 'Block Sync': 'A few blocks' },
        { aspect: 'Deduplication', 'Full-File Sync': 'Whole-file only', 'Block Sync': 'Per block, across files and users' },
        { aspect: 'Implementation complexity', 'Full-File Sync': 'Low', 'Block Sync': 'Higher — chunking, manifests, GC' },
        { aspect: 'Large media files', 'Full-File Sync': 'Painful on slow networks', 'Block Sync': 'Efficient and resumable' },
        { aspect: 'Sync latency', 'Full-File Sync': 'Higher for big files', 'Block Sync': 'Low — delta is small' },
      ]},
      { type: 'code', heading: 'Content-Defined Chunking', language: 'typescript', label: 'chunking.ts', code: `import crypto from 'crypto';

// Gear-based rolling hash: cut at a content boundary, not a fixed offset.
// Fixed offsets break dedup when bytes shift; content-defined boundaries survive inserts.
const MIN_CHUNK = 2 * 1024 * 1024; // 2 MB
const AVG_CHUNK = 4 * 1024 * 1024; // 4 MB
const MAX_CHUNK = 8 * 1024 * 1024; // 8 MB
const MASK = AVG_CHUNK - 1;        // cut when (hash & MASK) === 0

const GEAR = new BigUint64Array(256);
for (let i = 0; i < 256; i++) {
  GEAR[i] = crypto.randomBytes(8).readBigUInt64BE(0);
}

function chunkBuffer(buf: Buffer): Buffer[] {
  const chunks: Buffer[] = [];
  let start = 0;
  let hash = 0n;

  for (let i = 0; i < buf.length; i++) {
    hash = BigInt.asUint64((hash << 1n) + GEAR[buf[i]]);
    const size = i - start + 1;
    const atBoundary = (hash & BigInt(MASK)) === 0n;
    if ((size >= MIN_CHUNK && atBoundary) || size >= MAX_CHUNK) {
      chunks.push(buf.subarray(start, i + 1));
      start = i + 1;
      hash = 0n;
    }
  }
  if (start < buf.length) chunks.push(buf.subarray(start));
  return chunks;
}` },
      { type: 'text', heading: 'Deduplication, Metadata, and Sharing', content: 'Deduplication happens at two levels. Within a file, identical blocks collapse, so editing one page of a PDF re-uploads one block. Across files and users, the block store is content-addressed, so a popular installer or a forwarded document is stored once and referenced many times. Each block gets a reference count; the garbage collector deletes a block only when its count reaches zero.\n\nSharing and permissions live entirely in metadata. A share grant maps a file or folder to a grantee with a permission level, and the metadata service resolves effective access by walking the folder ancestors. Because permissions are checked when a download URL is minted, the data plane stays free of authorization logic — it serves signed, short-lived URLs whose issuance was already authorized.' },
      { type: 'code', heading: 'Metadata Schema', language: 'sql', label: 'metadata.sql', code: `CREATE TABLE files (
  file_id      BIGSERIAL PRIMARY KEY,
  owner_id     BIGINT NOT NULL,
  path         TEXT NOT NULL,
  version      INT NOT NULL DEFAULT 1,
  size_bytes   BIGINT NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at   TIMESTAMPTZ,
  UNIQUE (owner_id, path, version)
);
CREATE INDEX idx_files_owner_path ON files (owner_id, path) WHERE deleted_at IS NULL;

CREATE TABLE blocks (
  file_id      BIGINT NOT NULL REFERENCES files(file_id),
  block_index  INT NOT NULL,
  block_hash   CHAR(64) NOT NULL,        -- sha256 of the chunk contents
  size_bytes   INT NOT NULL,
  PRIMARY KEY (file_id, block_index)
);
CREATE INDEX idx_blocks_hash ON blocks (block_hash); -- dedup lookup by content

CREATE TABLE shares (
  share_id     BIGSERIAL PRIMARY KEY,
  file_id      BIGINT NOT NULL REFERENCES files(file_id),
  grantee_id   BIGINT NOT NULL,
  permission   TEXT NOT NULL CHECK (permission IN ('view', 'comment', 'edit')),
  UNIQUE (file_id, grantee_id)
);` },
      { type: 'steps', heading: 'Upload and Sync Protocol', steps: [
        { title: 'Create an upload session', detail: 'The client sends path, size, and content hash; the server returns missing chunk hashes and a chunk size.' },
        { title: 'Upload only missing chunks', detail: 'Content addressing lets the client skip chunks the server already stores, uploading only deltas.' },
        { title: 'Resume by offset', detail: 'Each chunk PUT carries a Content-Range, so a dropped connection resumes from the last acknowledged chunk.' },
        { title: 'Commit the new version', detail: 'The server writes a new file version with its block manifest inside a transaction.' },
        { title: 'Notify other devices', detail: 'A change cursor advances; other devices long-poll the metadata service and pull the deltas.' },
        { title: 'Resolve conflicts', detail: 'If two devices changed the same file, keep both versions or create a conflicted copy.' },
      ]},
      { type: 'callout', calloutType: 'warning', heading: 'Conflict Resolution', content: 'Two devices editing the same file offline produce two divergent versions with no automatic way to merge them byte-for-byte. Last-writer-wins by timestamp is simple but silently destroys work, so most products avoid it for user files.\n\nDropbox and similar services detect the conflict at sync time and preserve both: the winner keeps the original path and the loser becomes a keep-a-copy file with a device name appended. Google Docs instead avoids the problem at the source by making the document a CRDT with operational transformation, so concurrent edits merge field by field rather than at the file level.' },
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'Chunk files with content-defined boundaries so small edits transfer only a few blocks',
        'Content addressing gives deduplication within files, across files, and across users',
        'Separate a strongly consistent metadata plane from an eventually consistent object-store data plane',
        'Resumable uploads carry a Content-Range so transfers survive flaky networks',
        'Reference-count blocks and garbage-collect only at zero to reclaim space safely',
        'Never silently overwrite on conflict — preserve both versions or use collaborative editing',
      ]},
    ],
    quiz: [
      { question: 'Why use content-defined chunking instead of fixed-size chunk boundaries?', options: ['It is faster to compute', 'It keeps chunk boundaries stable when bytes are inserted or removed, preserving deduplication', 'It makes files smaller on disk', 'It removes the need for hashing'], correctIndex: 1, explanation: 'Fixed offsets shift every boundary after an insertion, so almost every chunk changes and dedup breaks. Content-defined boundaries are determined by the data itself, so inserted bytes affect only a couple of chunks and the rest still deduplicate.' },
      { question: 'What does the metadata service store versus the object store?', options: ['The metadata service stores file bytes and the object store stores permissions', 'The metadata service stores file structure, versions, and permissions; the object store holds content-addressed blocks', 'Both store identical copies for redundancy', 'The metadata service stores only user names'], correctIndex: 1, explanation: 'File structure, versions, block manifests, and permissions live in the transactional metadata store. Actual bytes live in the object store, addressed by content hash. Authorization happens at the metadata layer before signed URLs are minted.' },
      { question: 'How does a resumable upload recover after a dropped connection?', options: ['It restarts the whole file', 'Each chunk carries a Content-Range so upload resumes from the last acknowledged chunk', 'It compresses the remaining data', 'It switches to a different file'], correctIndex: 1, explanation: 'The upload session tracks which chunks were received. Because each PUT declares its byte range, a reconnecting client asks which chunks are missing and uploads only those, resuming exactly where it stopped.' },
    ]
  },

  'design-search-autocomplete': {
    slug: 'design-search-autocomplete',
    title: 'Design Search Autocomplete',
    tagline: 'Sub-100ms suggestions from prefix to ranked list',
    sections: [
      { type: 'text', heading: 'Defining the Problem', content: 'Design the type-ahead suggestions that appear as a user types into a search box. Every keystroke fires a request, the response must arrive in well under 100ms, and the suggestions must reflect what people actually search for, ranked by popularity and tuned to the user.\n\nThe hard part is the latency budget. With one request per keystroke and a hard deadline, you cannot afford to scan a large index or run a heavy ranking model on the hot path. Almost everything must be precomputed, cached, or served from memory.' },
      { type: 'text', heading: 'Functional and Non-Functional Requirements', content: '**Functional:** given a typed prefix, return the top 10 suggestions; rank by popularity with optional personalization; update the index as search traffic changes; support multiple languages and locales; return nothing gracefully for prefixes with no matches.\n\n**Non-functional:** p99 latency under 100ms and ideally under 50ms; extremely high throughput because each keystroke is a request; high availability — a slow autocomplete blocks typing feedback; freshness measured in minutes to hours, not seconds; and graceful degradation to a local cached list if the backend is slow.' },
      { type: 'analogy', heading: 'The Dictionary Index Analogy', content: 'A dictionary with a good index lets you find every word starting with "sys" instantly, because the index groups words by prefix. Without the index you would read every page.\n\nA trie is that index built as a tree: each letter is a branch, and each node knows the most popular completions beneath it. Looking up a prefix is walking down the branches; the answer is already waiting at the node you land on. The alternative, storing a hash map of every observed prefix to its top completions, is like photocopying the relevant index page for every prefix in advance — faster to read, far more to store.' },
      { type: 'text', heading: 'Back-of-the-Envelope Estimation', content: 'Assume 50 million daily users typing 10 queries a day, with suggestions firing on each of about 8 keystrokes. That is 4 billion suggestion requests a day, roughly 46,000 rps average and several times that at peak.\n\nThe saving grace is that only a small fraction of prefixes are ever typed. The most popular few hundred thousand prefixes account for the overwhelming majority of traffic, so a modest cache of top completions absorbs most requests. The long tail can tolerate slightly higher latency or a smaller result set.' },
      { type: 'code', heading: 'Sizing Suggestion Traffic', language: 'typescript', label: 'suggest-sizing.ts', code: `// Sizing an autocomplete service
const dau = 50_000_000;
const queriesPerUserPerDay = 10;
const keystrokesPerQuery = 8; // suggestions fire on each keystroke

const dailySuggestRequests = dau * queriesPerUserPerDay * keystrokesPerQuery; // 4B
const avgRps = dailySuggestRequests / 86_400;   // ~46k rps
const peakRps = avgRps * 5;                      // ~231k rps at peak

// Only the hottest prefixes need caching: about 1M distinct prefixes
const cacheEntryBytes = 1024;                    // ~1 KB for 10 suggestions
const hotCacheGb = (1_000_000 * cacheEntryBytes) / 1e9; // ~1 GB
console.log({ avgRps, peakRps, hotCacheGb });` },
      { type: 'code', heading: 'Suggestion API', language: 'http', label: 'suggest-api.http', code: `GET /v1/suggest?q=system+desi&limit=10&locale=en-US HTTP/1.1
Host: api.example.com
Accept: application/json

HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=60

{
  "prefix": "system desi",
  "suggestions": [
    { "text": "system design interview", "score": 98213 },
    { "text": "system design primer", "score": 44120 }
  ]
}` },
      { type: 'text', heading: 'High-Level Architecture', content: 'Two data paths feed one serving path. Offline, a batch job reads search logs, aggregates query frequency, and rebuilds or merges index shards. Online, a stream processor consumes the same logs in near real time and applies small increments — promoting trending queries and decaying old ones — without rebuilding the whole index.\n\nThe serving path is a cache in front of a sharded trie. A request hashes its prefix (via consistent hashing) to the shard that owns that prefix range, the shard walks the trie and returns its precomputed top-k, and a thin ranking layer adjusts the order with personalization signals. Latency is dominated by one cache lookup and one in-memory trie walk.' },
      { type: 'comparison', heading: 'Trie vs Prefix Hash Map', headers: ['Trie', 'Prefix Hash Map'], rows: [
        { aspect: 'Storage', 'Trie': 'Compact — shared prefixes are stored once', 'Prefix Hash Map': 'Large — one entry per observed prefix' },
        { aspect: 'Lookup', 'Trie': 'Walk one node per character', 'Prefix Hash Map': 'One hash lookup' },
        { aspect: 'Top-k retrieval', 'Trie': 'Precomputed at each node', 'Prefix Hash Map': 'Stored directly per prefix' },
        { aspect: 'Updates', 'Trie': 'Insert a query by walking and updating nodes', 'Prefix Hash Map': 'Update scores for every prefix of the query' },
        { aspect: 'Memory with huge vocabularies', 'Trie': 'Scales well', 'Prefix Hash Map': 'Grows with the number of distinct prefixes' },
        { aspect: 'Best for', 'Trie': 'Large corpora and exact prefix search', 'Prefix Hash Map': 'Small, hot prefix sets that must be blazing fast' },
      ]},
      { type: 'code', heading: 'A Trie with Precomputed Top-k', language: 'typescript', label: 'trie.ts', code: `interface Suggestion { phrase: string; score: number; }

class TrieNode {
  children = new Map<string, TrieNode>();
  topK: Suggestion[] = []; // top completions under this prefix, precomputed
}

function mergeTopK(list: Suggestion[], item: Suggestion, k: number): Suggestion[] {
  const merged = [...list, item].sort((a, b) => b.score - a.score);
  return merged.slice(0, k);
}

class AutocompleteTrie {
  root = new TrieNode();
  private k = 10;

  insert(phrase: string, score: number): void {
    let node = this.root;
    for (const ch of phrase.toLowerCase()) {
      node.topK = mergeTopK(node.topK, { phrase, score }, this.k);
      let next = node.children.get(ch);
      if (!next) { next = new TrieNode(); node.children.set(ch, next); }
      node = next;
    }
    node.topK = mergeTopK(node.topK, { phrase, score }, this.k);
  }

  suggest(prefix: string): Suggestion[] {
    let node: TrieNode | undefined = this.root;
    for (const ch of prefix.toLowerCase()) {
      node = node.children.get(ch);
      if (!node) return [];
    }
    return node.topK; // already the top 10, no traversal below this node
  }
}` },
      { type: 'text', heading: 'Real-Time vs Batch Updates and Personalization', content: 'Batch rebuilds give you clean, globally-correct frequencies but lag reality. Stream updates give you freshness — a breaking-news query shoots up the rankings within minutes — but they are approximate and can let a burst of spam skew results. Production systems run both: the batch index is the baseline, and the streaming layer applies bounded deltas on top with decay and anomaly guards.\n\nPersonalization is a light re-rank applied after the base top-k is fetched. It mixes the global ranking with the user recent queries, their locale, and their language, then reorders the top few. It is deliberately cheap: the expensive candidate generation stays global and cached, and only a handful of final items are reordered per request.' },
      { type: 'code', heading: 'Caching and Sharded Serving', language: 'typescript', label: 'suggest-serving.ts', code: `async function suggest(prefix: string, userId: string): Promise<Suggestion[]> {
  const key = 'suggest:' + prefix.toLowerCase();

  const cached = await redis.get(key);
  if (cached) return personalize(JSON.parse(cached), userId);

  // Route the prefix to its shard by consistent hashing
  const shard = ring.getNode(prefix);
  if (!shard) return personalize(LOCAL_FALLBACK, userId); // degrade, never block

  const base = trieShards[shard].suggest(prefix);
  await redis.set(key, JSON.stringify(base), 'EX', 600); // 10-minute TTL
  return personalize(base, userId);
}

// personalize mixes global scores with the reader recent queries and locale
function personalize(base: Suggestion[], userId: string): Suggestion[] {
  return rerank(base, recentQueries(userId), localeOf(userId)).slice(0, 10);
}` },
      { type: 'callout', calloutType: 'warning', heading: 'The Latency Budget and Hot Prefixes', content: 'The 100ms budget is spent across the network round trip (20-40ms), the cache lookup (1-2ms), the trie walk (5-10ms), personalization and serialization (5-10ms). There is little room for a database query, so there must not be one on the hot path — everything is memory or cache.\n\nSingle letters are the hottest prefixes and also the least selective, returning huge candidate sets. Precompute and cache them specially, serve them from a CDN or an edge cache close to the user, and cap the work so that a cold single-letter miss cannot stall typing feedback.' },
      { type: 'steps', heading: 'Serving a Suggestion Request', steps: [
        { title: 'Receive and normalize', detail: 'Trim and lowercase the prefix, and reject empty or too-long input immediately.' },
        { title: 'Check the cache', detail: 'A Redis or edge cache holds precomputed top-10 lists for hot prefixes.' },
        { title: 'Route to a shard', detail: 'Consistent hashing sends the prefix to the trie shard that owns its range.' },
        { title: 'Walk the trie', detail: 'The shard descends the prefix and returns the top-k already stored at that node.' },
        { title: 'Personalize and return', detail: 'A cheap re-rank mixes in the reader context, then the list is serialized and sent.' },
      ]},
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'The 100ms budget forbids any database query on the hot path — serve from memory and cache',
        'A trie stores shared prefixes once and caches top-k completions at each node',
        'A prefix hash map is faster to read but grows with the number of distinct prefixes',
        'Blend batch rebuilds for correctness with streamed deltas for freshness',
        'Cache only the hottest prefixes; they absorb the vast majority of traffic',
        'Personalization is a cheap re-rank over an already-fetched, globally-cached candidate list',
      ]},
    ],
    quiz: [
      { question: 'Why must the autocomplete hot path avoid database queries?', options: ['Databases cannot store text', 'The 100ms budget cannot absorb a disk-backed round trip on every keystroke', 'Database queries are forbidden by browsers', 'Queries would change the results'], correctIndex: 1, explanation: 'Suggestions fire on every keystroke with a hard deadline. A database round trip adds tens of milliseconds of variable latency, so the hot path serves from cache and in-memory tries, with the database confined to index-building offline.' },
      { question: 'How does a trie return suggestions so quickly?', options: ['It scans all phrases on each request', 'Each node precomputes and stores its top-k completions', 'It queries a SQL database', 'It uses a bloom filter'], correctIndex: 1, explanation: 'Walking down the prefix lands on a node that already holds its top-k completions, so no subtree traversal is needed at request time. The heavy work happens during index construction.' },
      { question: 'What is the role of the streaming layer versus the batch layer?', options: ['They are redundant and one can be removed', 'Batch gives accurate global frequencies; streaming adds fresh, bounded deltas', 'Streaming replaces the trie entirely', 'Batch handles personalization and streaming handles storage'], correctIndex: 1, explanation: 'The batch rebuild provides a correct baseline from full history. The stream layer promotes trending queries within minutes but is approximate, so it applies bounded deltas with decay and anomaly guards on top of the batch index.' },
    ]
  },

  'design-video-platform': {
    slug: 'design-video-platform',
    title: 'Design a Video Platform',
    tagline: 'Upload, transcode, distribute, and count views',
    sections: [
      { type: 'text', heading: 'Defining the Problem', content: 'Design a YouTube-style platform: users upload videos, the platform transcodes them into multiple qualities, viewers stream them smoothly on any device and connection, and the platform counts views and recommends what to watch. The visible product is a video that just plays. The invisible product is a pipeline that processes hundreds of hours of footage a minute and a distribution network that serves the same clip to millions of viewers at once.\n\nThe interesting problems are the asynchronous upload pipeline, transcoding into a ladder of renditions, adaptive bitrate delivery from the edge, and counting views — a write-heavy counter — without melting a single database.' },
      { type: 'text', heading: 'Functional and Non-Functional Requirements', content: '**Functional:** upload videos; transcode into multiple resolutions; stream with adaptive quality; store and serve thumbnails; count views; recommend related videos; support playback on web, mobile, and TV clients.\n\n**Non-functional:** smooth playback — start within a second or two and adapt on the fly to bandwidth changes; durability — an accepted upload is never lost; availability — popular videos must play even if a region degrades; cost efficiency — storage and egress dominate the bill, so tiering and CDN caching matter as much as correctness.' },
      { type: 'analogy', heading: 'The Print Shop and the Newsstand', content: 'A publisher does not hand a reader a manuscript. It prints the same book in hardcover, paperback, and large-print, then ships copies to newsstands in every neighbourhood so no reader travels to the one warehouse.\n\nTranscoding is printing the many versions of one video; a CDN is the network of newsstands holding copies near readers. Adaptive bitrate is letting the reader switch between the large-print and pocket edition mid-page depending on their eyesight — the client picks the rendition that fits the current bandwidth, seamlessly, without restarting.' },
      { type: 'text', heading: 'Back-of-the-Envelope Estimation', content: 'Take 500 hours of video uploaded per minute — YouTube scale — which is 720,000 hours a day. If a one-hour 1080p source is about 4 GB and the full transcoded ladder adds roughly 8 GB, each uploaded hour costs around 12 GB of storage, tens of exabytes a year at this rate.\n\nThe transcoding cost is the surprise. Six renditions means each uploaded minute becomes six minutes of encoding, so the encode fleet is a massive, continuously busy distributed system. Distribution, not storage, is usually the largest line item once videos are popular.' },
      { type: 'code', heading: 'Sizing the Pipeline', language: 'typescript', label: 'video-sizing.ts', code: `// Order-of-magnitude sizing for a YouTube-scale platform
const hoursUploadedPerMinute = 500;
const uploadHoursPerDay = hoursUploadedPerMinute * 60 * 24; // 720k hours/day

// A 1-hour 1080p source is ~4 GB; the ABR ladder adds ~8 GB
const sourceGbPerHour = 4;
const renditionsGbPerHour = 8;
const storageGbPerDay = uploadHoursPerDay * (sourceGbPerHour + renditionsGbPerHour);
const storagePbPerYear = (storageGbPerDay * 365) / 1e6;
console.log({ uploadHoursPerDay, storagePbPerYear }); // order of magnitude

// Transcode throughput: each uploaded minute becomes one job per rendition
const renditions = 6; // 240p, 360p, 480p, 720p, 1080p, 1440p
const transcodeMinutesPerDay = uploadHoursPerDay * 60 * renditions; // ~259M encode-minutes
console.log({ transcodeMinutesPerDay });` },
      { type: 'code', heading: 'Upload API', language: 'http', label: 'upload-api.http', code: `POST /v1/videos/upload/session HTTP/1.1
Host: api.example.com
Content-Type: application/json

{ "title": "Backend Handbook", "size": 4294967296, "mimeType": "video/mp4" }

HTTP/1.1 201 Created
{ "videoId": "vid_9a1", "uploadUrl": "https://upload.example.com/vid_9a1", "partSize": 16777216 }

# Client uploads multipart parts to object storage, then finalizes
POST /v1/videos/vid_9a1/complete HTTP/1.1
Content-Type: application/json

{ "parts": [ { "partNumber": 1, "etag": "9f2c..." }, { "partNumber": 2, "etag": "1a7b..." } ] }

HTTP/1.1 200 OK
{ "videoId": "vid_9a1", "status": "processing" }` },
      { type: 'text', heading: 'High-Level Architecture and the Upload Pipeline', content: 'Upload is asynchronous and durable before it is processed. The client requests an upload session, uploads parts directly to object storage via pre-signed URLs, then finalizes. The API records the video as raw, and an event kicks off the processing pipeline. The original source lands in durable object storage first, so a crash downstream never loses an accepted upload.\n\nThe transcoding pipeline is a directed acyclic graph of jobs rather than a single step. Validation (ffprobe) runs first; from it, thumbnail extraction and each rendition encode fan out in parallel; packaging waits for the renditions. A workflow engine (or a queue with dependency tracking) schedules the DAG, retries failed nodes, and emits a ready event when the last node completes so the video becomes playable.' },
      { type: 'code', heading: 'Transcoding as a DAG', language: 'yaml', label: 'transcode-dag.yaml', code: `job: transcode
input: s3://ingest/vid_9a1/source.mp4
output: s3://media/vid_9a1/
steps:
  - name: validate
    cmd: ffprobe -v error -show_streams source.mp4
  - name: thumbnails
    cmd: ffmpeg -i source.mp4 -vf fps=1/10 thumb-%03d.jpg
    depends_on: [validate]
  - name: hls-240p
    cmd: ffmpeg -i source.mp4 -vf scale=-2:240 -hls_time 6 ladder/240p/index.m3u8
    depends_on: [validate]
  - name: hls-1080p
    cmd: ffmpeg -i source.mp4 -vf scale=-2:1080 -b:v 5000k -hls_time 6 ladder/1080p/index.m3u8
    depends_on: [validate]
  - name: package
    cmd: packager --master ladder/master.m3u8 ladder/*/index.m3u8
    depends_on: [hls-240p, hls-1080p, thumbnails]` },
      { type: 'text', heading: 'Adaptive Bitrate, CDN, and Storage Tiering', content: 'Transcoding produces a ladder of renditions, each segmented into short chunks (typically 2-6 seconds) with a manifest describing them. The client downloads the manifest, picks the rendition that matches its measured bandwidth, and switches rendition at a segment boundary without restarting — this is HLS or DASH. Short segments mean quick adaptation but more overhead; long segments mean smoother throughput but slower reaction to bandwidth drops.\n\nA CDN caches segments at edge locations close to viewers. Cache hit ratio is the whole game: popular content served from the edge costs a fraction of origin egress. Storage is tiered by heat — new and popular videos on hot, fast storage; older, rarely watched videos moved to cheap cold object storage — with the platform transparently re-fetching and re-caching a cold video the moment it trends.' },
      { type: 'code', heading: 'An HLS Master Playlist', language: 'plaintext', label: 'master.m3u8', code: `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720
720p/index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p/index.m3u8` },
      { type: 'comparison', heading: 'Progressive Download vs Adaptive Bitrate', headers: ['Progressive Download', 'Adaptive Bitrate (HLS/DASH)'], rows: [
        { aspect: 'Delivery unit', 'Progressive Download': 'One whole file', 'Adaptive Bitrate (HLS/DASH)': 'Short segments per rendition' },
        { aspect: 'Bandwidth adaptation', 'Progressive Download': 'None after start', 'Adaptive Bitrate (HLS/DASH)': 'Switches rendition each segment' },
        { aspect: 'Startup time', 'Progressive Download': 'Fast if quality is low enough', 'Adaptive Bitrate (HLS/DASH)': 'Fast — starts low and ramps up' },
        { aspect: 'Mid-stream quality change', 'Progressive Download': 'Requires buffering or a restart', 'Adaptive Bitrate (HLS/DASH)': 'Seamless at segment boundaries' },
        { aspect: 'CDN caching', 'Progressive Download': 'Large objects, coarse caching', 'Adaptive Bitrate (HLS/DASH)': 'Many small segments, fine-grained caching' },
        { aspect: 'Client complexity', 'Progressive Download': 'Trivial', 'Adaptive Bitrate (HLS/DASH)': 'Manifest parsing and ABR logic' },
      ]},
      { type: 'callout', calloutType: 'warning', heading: 'Counting a Billion Views', content: 'A single viral view counter can receive hundreds of thousands of increments per second. Writing each increment to a database row is a guaranteed hotspot — a single contended row serializes all writes and becomes a bottleneck and a single point of failure.\n\nProduction systems count in memory and aggregate: increments go to a stream (Kafka) or an in-memory store (Redis), are windowed and deduplicated per user per video per time window, and are flushed to durable storage periodically. Counts are approximate — a sub-percent error is acceptable for a view tally — and the approximation is what makes the system cheap and fast. Never let counting share a code path with, or block, playback.' },
      { type: 'steps', heading: 'Upload to Playback Pipeline', steps: [
        { title: 'Upload session', detail: 'The client creates a session and uploads parts to object storage via pre-signed URLs.' },
        { title: 'Persist the source', detail: 'The original source is stored durably and the video is marked raw before any processing.' },
        { title: 'Run the transcode DAG', detail: 'Validate, then fan out thumbnail and rendition encodes in parallel, then package.' },
        { title: 'Publish assets', detail: 'Segments, manifests, and thumbnails land in the media bucket and are cached at the CDN.' },
        { title: 'Mark ready', detail: 'A ready event flips the video to playable and warms the CDN for the first viewers.' },
        { title: 'Serve and count', detail: 'Clients stream ABR segments from the edge while views are counted asynchronously.' },
      ]},
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'Persist the original source durably before processing — an accepted upload is never lost',
        'Model transcoding as a DAG so renditions and thumbnails encode in parallel with retries',
        'Adaptive bitrate switches renditions at segment boundaries for smooth playback',
        'CDN cache hit ratio determines egress cost — keep popular content at the edge',
        'Tier storage by heat and re-warm cold videos the moment they trend',
        'Count views in memory and aggregate asynchronously; never let counting block playback',
      ]},
    ],
    quiz: [
      { question: 'Why is transcoding modeled as a DAG rather than a single job?', options: ['DAGs are required by ffmpeg', 'Independent steps like renditions and thumbnails can run in parallel, with retries per node', 'It reduces the number of renditions', 'It removes the need for validation'], correctIndex: 1, explanation: 'Thumbnails and each rendition depend only on validation, so they fan out in parallel, and packaging waits for them all. Modeled as a DAG, a failed node retries without redoing the whole pipeline, and the ready event fires only when the last node finishes.' },
      { question: 'What does adaptive bitrate streaming change compared to progressive download?', options: ['It compresses the video more', 'The client switches renditions at segment boundaries to match bandwidth', 'It stores the video in a single file', 'It removes the need for a CDN'], correctIndex: 1, explanation: 'With HLS or DASH, content is split into short segments across several renditions described by a manifest. The client measures bandwidth and picks a rendition per segment, adapting quality mid-stream without buffering or restarting.' },
      { question: 'Why is a naive database row increment wrong for view counting?', options: ['Databases cannot store counters', 'A single viral video serializes hundreds of thousands of increments a second on one row', 'Increments are always inaccurate', 'It uses too much disk space'], correctIndex: 1, explanation: 'All increments contend on one row, turning counting into a bottleneck and a single point of failure. Counting in memory and aggregating through a stream makes it scalable and cheap, at the acceptable cost of a small, bounded approximation error.' },
    ]
  },

  'design-distributed-cache': {
    slug: 'design-distributed-cache',
    title: 'Design a Distributed Cache',
    tagline: 'Hashing, eviction, and stampede protection',
    sections: [
      { type: 'text', heading: 'Defining the Problem', content: 'Design a cache shared across many application servers: it absorbs read load from the database, distributes keys across many nodes, keeps working when a node dies, and does not collapse when a popular key expires. The cache is not the source of truth — the database is — so every design decision is about throughput, latency, and graceful degradation.\n\nThe interesting problems are where a key lives (and how that survives resizing), what to evict when memory fills, how to survive a node failure without a thundering herd, and how to keep the cache and the database from diverging.' },
      { type: 'text', heading: 'Functional and Non-Functional Requirements', content: '**Functional:** get, set, and delete by key; expiry (TTL); atomic increments for counters; namespace isolation so different applications can share the fleet; observability of hit rate and latency.\n\n**Non-functional:** sub-millisecond p99 latency; linear horizontal scalability by adding nodes; high availability — loss of one node must not lose the whole cache; bounded memory with a sensible eviction policy; protection against hot keys and stampedes; and eventual, not perfect, consistency with the database.' },
      { type: 'analogy', heading: 'The Kitchen Fridge', content: 'A cook does not walk to the market for every ingredient; a fridge near the counter holds what is used often. The fridge is small, so when it fills, the least recently used items go. Occasionally a favourite ingredient runs out and several cooks walk to the market for it at once — wasteful, and something you would coordinate to avoid.\n\nThe cache is that fridge, the database is the market, eviction is clearing out the oldest items, and the rare simultaneous trip to the market is a cache stampede waiting to happen. Good fridge discipline is what separates a fast kitchen from a chaotic one.' },
      { type: 'text', heading: 'Back-of-the-Envelope Estimation', content: 'Suppose the database serves 500,000 read requests per second at peak and a 95% hit rate moves most of that load off it. The cache then answers 475,000 rps, each hit reading about 2 KB, which is nearly 8 Tbps of cache egress spread across the fleet — the network, not just the CPU, is the constraint.\n\nMemory sizing follows from the working set, not the dataset. If 90% of reads hit 10% of keys, you cache that hot 10%. At 2 billion total keys and 2 KB average values, caching 10% is about 400 GB, before replication. Cache what is hot, not what exists.' },
      { type: 'code', heading: 'Sizing a Cache Fleet', language: 'typescript', label: 'cache-sizing.ts', code: `// Sizing a distributed cache in front of a read-heavy database
const dbReadRps = 500_000;              // peak read requests per second
const targetHitRate = 0.95;             // 95% served from cache
const cacheReadRps = dbReadRps * targetHitRate; // 475k rps

// Each hit reads about 2 KB of serialized value
const valueBytes = 2048;
const egressGbps = (cacheReadRps * valueBytes * 8) / 1e9; // ~7.8 Tbps of cache egress

// Cache the hot working set: 90% of reads touch 10% of keys
const totalKeys = 2_000_000_000;
const cachedKeys = totalKeys * 0.10;
const memoryTb = (cachedKeys * valueBytes) / 1e12; // ~0.4 TB, before replication
console.log({ cacheReadRps, egressGbps, memoryTb });` },
      { type: 'comparison', heading: 'Where the Caching Logic Lives', headers: ['Client-Side', 'Proxy', 'Server-Side'], rows: [
        { aspect: 'Who owns routing', 'Client-Side': 'Each application server hashes keys itself', 'Proxy': 'A dedicated tier routes requests', 'Server-Side': 'The cache cluster shards internally' },
        { aspect: 'Failover', 'Client-Side': 'Client must track node health', 'Proxy': 'Proxy handles it centrally', 'Server-Side': 'Built into the cluster' },
        { aspect: 'App complexity', 'Client-Side': 'High — hashing and pool logic in every app', 'Proxy': 'Low — apps speak one protocol', 'Server-Side': 'Lowest — behaves like one big cache' },
        { aspect: 'Hot-key handling', 'Client-Side': 'Manual, per app', 'Proxy': 'Centralized policies possible', 'Server-Side': 'Limited to what the cluster offers' },
        { aspect: 'Best for', 'Client-Side': 'Simple memcached fleets', 'Proxy': 'Multi-tenant shared caches', 'Server-Side': 'Managed clusters such as Redis Cluster' },
      ]},
      { type: 'code', heading: 'Routing Keys and Failing Over', language: 'typescript', label: 'routing.ts', code: `// Route a key to its owner, falling back to the replica, then to the database
function routeKey(key: string): CacheClient | undefined {
  const candidates = ring.getNodes(key, 2); // primary then replica, clockwise
  for (const node of candidates) {
    if (health.isHealthy(node)) return clients[node];
  }
  return undefined; // fail open to the database
}

async function get(key: string): Promise<string | null> {
  const client = routeKey(key);
  if (!client) return null; // cache bypass when all candidates are down
  try {
    return await client.get(key);
  } catch {
    return null; // treat any cache error as a miss, never fail the request
  }
}` },
      { type: 'text', heading: 'Eviction Policies and Replication', content: 'When memory fills, something must leave. LRU evicts the least recently used item and is the common default; it fits the usual access pattern where recently touched data stays hot. LFU evicts the least frequently used item and resists a one-time scan polluting the cache, but it can keep stale-but-once-popular items around and needs decay to forget old popularity. TTLs complement both by expiring data that must not be served stale.\n\nHigh availability comes from replication: each key is written to its primary and one or more replicas, so losing a primary promotes a replica with little data loss. Redis Cluster uses a primary-replica model with automatic failover; a client library or a proxy hides the promotion behind a stable key-to-node mapping. The tradeoff is that replication multiplies memory cost, so the replication factor is a deliberate capacity decision.' },
      { type: 'code', heading: 'An LRU Cache with TTL', language: 'typescript', label: 'lru.ts', code: `class LRUCache<T> {
  private map = new Map<string, { value: T; expiresAt: number }>();

  constructor(private capacity: number) {}

  get(key: string): T | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) { this.map.delete(key); return undefined; }
    // Re-insert to mark as most recently used
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: Date.now() + ttlMs });
    if (this.map.size > this.capacity) {
      // Map preserves insertion order, so the first key is the least recently used
      const oldest = this.map.keys().next().value as string;
      this.map.delete(oldest);
    }
  }
}` },
      { type: 'callout', calloutType: 'danger', heading: 'Cache Stampede and Thundering Herd', content: 'When a popular key expires, every request that misses it races to recompute the value from the database simultaneously. A single hot key can turn a cache miss into thousands of identical database queries — the thundering herd — and the database, sized for a 5% miss rate, collapses. The hotter the key, the worse the stampede.\n\nDefences stack. Stagger TTLs with random jitter so keys do not all expire at once. Use a short lock or single-flight so only one request recomputes while the rest wait or serve a slightly stale value. Recompute proactively in the background before expiry, and serve stale-while-revalidate: hand out the old value while fetching the new one.' },
      { type: 'code', heading: 'Single-Flight Recompute', language: 'typescript', label: 'single-flight.ts', code: `const inflight = new Map<string, Promise<string>>();

async function getOrLoad(key: string): Promise<string> {
  const cached = await cache.get(key);
  if (cached !== null) return cached;

  // If a load for this key is already running, await the same promise
  let pending = inflight.get(key);
  if (!pending) {
    pending = (async () => {
      try {
        const value = await loadFromDb(key);
        await cache.set(key, value, 60_000); // 60s TTL, jittered by caller
        return value;
      } finally {
        inflight.delete(key);
      }
    })();
    inflight.set(key, pending);
  }
  return pending;
}` },
      { type: 'text', heading: 'Hot Keys, Consistency, and Cluster Choice', content: 'A hot key defeats consistent hashing because it always lands on one node. Mitigations include local per-process caches in front of the distributed cache, splitting a hot key into sharded copies (key#1..key#N chosen at random) whose values are merged on read, and bounded-loads routing that overflows a saturated node to its neighbour. The genuinely hottest keys deserve a dedicated local cache that never expires under load.\n\nConsistency between cache and database is almost always eventual, and the standard safe pattern is write-through or cache-aside with cache invalidation on write: update the database, then delete the cache entry rather than trying to set it, so the next read repopulates it. Deleting avoids stale writes racing an old value in. Redis Cluster offers rich data structures, persistence, and cluster-wide sharding but is heavier per node; memcached is a simpler, multi-threaded key-value cache with less overhead per node and no replication of its own.' },
      { type: 'steps', heading: 'Adding and Failing Over a Cache Node', steps: [
        { title: 'Insert the new node on the ring', detail: 'Add its vnodes; only the arcs clockwise of the new positions move to it.' },
        { title: 'Warm before serving', detail: 'Stream or re-fetch the affected keys so the node does not serve cold misses on arrival.' },
        { title: 'Propagate the topology', detail: 'Update clients and proxies so they re-route to the new ring.' },
        { title: 'Detect a failed node', detail: 'Health checks or cluster gossip mark the node down and stop sending it writes.' },
        { title: 'Promote a replica', detail: 'The replica for each shard takes over, and the mapping is updated transparently.' },
        { title: 'Verify balance and hit rate', detail: 'Confirm key distribution stays near 1/N and the overall hit rate recovers.' },
      ]},
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'Consistent hashing keeps key movement near 1/N through resizing and failures',
        'Size memory for the hot working set, not the whole dataset',
        'LRU fits recency patterns; LFU resists scan pollution but needs decay',
        'Replicate each shard so a node failure promotes a replica with little loss',
        'Stagger TTLs and use single-flight to prevent cache stampedes and thundering herds',
        'Invalidate by deleting on write, and shard hot keys or cache them locally to spread load',
      ]},
    ],
    quiz: [
      { question: 'What is a cache stampede?', options: ['Too many cache nodes added at once', 'Many requests racing to recompute the same expired hot key, overwhelming the database', 'A cache that stores too much data', 'A network partition between cache nodes'], correctIndex: 1, explanation: 'When a popular key expires, every concurrent miss recomputes it from the database at once. A single hot key becomes thousands of identical queries, which the database cannot absorb. Jittered TTLs, single-flight locking, and stale-while-revalidate prevent it.' },
      { question: 'Why invalidate a cache entry by deleting it rather than setting a new value on write?', options: ['Deleting is faster than writing', 'It avoids a stale write racing a concurrent read and repopulating an outdated value', 'Deletes cost less memory', 'Redis cannot set after a delete'], correctIndex: 1, explanation: 'If two writes interleave, setting the cache can leave an older value in place after a newer one. Deleting leaves the key absent, so the next read repopulates it with the current database value, avoiding the stale-write race.' },
      { question: 'How can consistent hashing alone fail, and what helps?', options: ['It cannot fail', 'A single hot key always maps to one node; local caches and sharded hot-key copies spread the load', 'It requires a database', 'It stops working with more than ten nodes'], correctIndex: 1, explanation: 'Consistent hashing distributes keys but a genuinely hot key still lands on one node. Per-process local caches, splitting the key into sharded copies, and bounded-loads overflow routing spread that single key across resources.' },
    ]
  },

  'design-ticket-booking': {
    slug: 'design-ticket-booking',
    title: 'Design a Ticket Booking System',
    tagline: 'Seat locking, no overselling, and flash-sale spikes',
    sections: [
      { type: 'text', heading: 'Defining the Problem', content: 'Design a BookMyShow or Ticketmaster style system: users browse events, pick specific seats, hold them while paying, and confirm a booking — all without ever selling the same seat twice, even when a million people hit the site the moment tickets go on sale. The visible product is a seat map and a checkout. The invisible product is a concurrency-control system masquerading as an e-commerce site.\n\nThe interesting problems are holding a seat atomically, preventing overselling under extreme contention, expiring abandoned holds, making payments idempotent, and surviving the on-sale spike without queueing everyone to a crawl.' },
      { type: 'text', heading: 'Functional and Non-Functional Requirements', content: '**Functional:** search events; view a seat map with live availability; hold seats for a short window; pay and confirm a booking; release seats when a hold or payment fails; generate a ticket; prevent a user from double-booking the same seat.\n\n**Non-functional:** correctness above all — never oversell a seat; handle flash-sale spikes where demand vastly exceeds supply; keep the seat map responsive under load; make booking idempotent so retries never double-charge; and give fair, predictable behavior rather than a race that rewards the fastest click.' },
      { type: 'analogy', heading: 'The Coat Check Analogy', content: 'A coat check hands you a numbered tag for your coat. Two people cannot hold the same coat: the clerk physically has it. To reserve a coat while you pay, the clerk takes it off the rack and holds it for a minute — nobody else can claim it during that time. If you wander off, the clerk puts the coat back.\n\nA seat hold is exactly this: take the seat out of the pool (mark it held), keep it for a short window while the customer pays, and return it if payment does not arrive. The critical rule is that removing the coat from the rack and checking whether it is available must be one indivisible action.' },
      { type: 'text', heading: 'Back-of-the-Envelope Estimation', content: 'A single concert venue may hold 50,000 seats, but the on-sale event can draw 2 million people into the waiting room at once. The entire inventory for one event is tiny — 50,000 seats — so it fits comfortably in memory and is easy to cache; the challenge is the request volume and contention, not the data size.\n\nBooking throughput is bounded by payments, not by seat selection. If the system confirms 1,000 bookings a second, that is 1,000 payment authorizations a second at peak, and every one must be idempotent. The flash-sale spike is the defining load: a minute-long burst thousands of times a normal hour.' },
      { type: 'code', heading: 'Sizing the On-Sale', language: 'typescript', label: 'booking-sizing.ts', code: `// Flash-sale sizing for a concert on-sale
const seatsPerVenue = 50_000;
const usersWaiting = 2_000_000;   // people in the virtual queue at T-0
const bookingRpsTarget = 20_000;  // reads + holds we must sustain

// Inventory fits in memory: seat id + status + hold owner
const seatStateBytes = 64;
const inventoryMb = (seatsPerVenue * seatStateBytes) / 1e6; // ~3 MB, trivially cacheable

// Write volume: each confirmed booking is one payment plus one status update
const salesPerSecond = 1_000;
const peakPaymentRps = salesPerSecond * 1.2;
console.log({ inventoryMb, bookingRpsTarget, peakPaymentRps });` },
      { type: 'code', heading: 'Booking API', language: 'http', label: 'booking-api.http', code: `POST /v1/holds HTTP/1.1
Host: api.example.com
Idempotency-Key: 6f2c1a90-4e2b-4f1a-9c33-73a1b2c3d4e5
Content-Type: application/json

{ "eventId": "ev_882", "seatIds": ["A12", "A13"] }

HTTP/1.1 201 Created
{ "holdId": "hold_44f1", "expiresAt": "2026-11-15T10:08:00Z", "totalCents": 24000 }

POST /v1/bookings HTTP/1.1
Content-Type: application/json
Idempotency-Key: 6f2c1a90-4e2b-4f1a-9c33-73a1b2c3d4e5

{ "holdId": "hold_44f1", "paymentToken": "tok_visa_..." }

HTTP/1.1 200 OK
{ "bookingId": "bk_9201", "status": "confirmed", "seatIds": ["A12", "A13"] }` },
      { type: 'text', heading: 'High-Level Architecture, Seat Locking, and Hold Expiry', content: 'Seat state is the source of truth and must be manipulated atomically. The seat service owns a per-event seat map backed by an in-memory store such as Redis, with a durable database as the record. A hold is a compare-and-set: mark the requested seats held only if every one of them is currently available; if any is taken, the whole hold fails so the user is not left with a partial selection.\n\nHolds expire. A hold carries an expiry time, and a background expiry worker (or a Redis key TTL) releases seats that are never paid for, returning them to the pool. The booking flow is two-phase: hold, then confirm. Confirmation marks the seats sold inside a transaction; if payment fails or the hold lapses, the seats are released. Treating hold and confirm as separate steps is what lets payment — a slow, external call — happen without holding a database transaction open.' },
      { type: 'comparison', heading: 'Optimistic vs Pessimistic Concurrency', headers: ['Optimistic', 'Pessimistic'], rows: [
        { aspect: 'Locking model', 'Optimistic': 'Check a version, retry on conflict', 'Pessimistic': 'Lock the rows before updating' },
        { aspect: 'Behavior under contention', 'Optimistic': 'Many retries as conflicts rise', 'Pessimistic': 'Requests queue on the lock' },
        { aspect: 'Best for', 'Optimistic': 'Low-contention seats and read-heavy maps', 'Pessimistic': 'High-contention seats in a flash sale' },
        { aspect: 'Latency', 'Optimistic': 'Low when uncontended', 'Pessimistic': 'Higher, but predictable' },
        { aspect: 'Risk', 'Optimistic': 'Retry storms when everyone wants the same seat', 'Pessimistic': 'Lock held too long blocks others' },
        { aspect: 'Implementation', 'Optimistic': 'Version column, compare on update', 'Pessimistic': 'SELECT ... FOR UPDATE or an atomic SET NX' },
      ]},
      { type: 'code', heading: 'Atomic Seat Reservation', language: 'sql', label: 'reserve-seats.sql', code: `BEGIN;

-- Lock the requested seats; SKIP LOCKED lets concurrent buyers skip taken seats
SELECT seat_id, status
FROM seats
WHERE event_id = 882 AND seat_id IN ('A12', 'A13')
FOR UPDATE SKIP LOCKED;

-- Hold only the seats that are still available in a single statement
UPDATE seats
SET status = 'held',
    hold_id = 'hold_44f1',
    hold_expires_at = now() + interval '8 minutes'
WHERE event_id = 882
  AND seat_id IN ('A12', 'A13')
  AND status = 'available';

-- If the number of rows updated is fewer than requested, ROLLBACK
-- and ask the user to pick different seats. The whole-hold-or-nothing
-- rule is what prevents a partial, confusing reservation.
COMMIT;` },
      { type: 'callout', calloutType: 'danger', heading: 'Never Oversell a Seat', content: 'The classic bug is read-check-write: read the seat status, see available, then update it to held. Under concurrency two buyers both read available and both write held, so the seat is sold twice. The window between read and write is small, but at a flash sale the window is hit constantly.\n\nThe fix is to make the check and the write one atomic operation — an `UPDATE ... WHERE status = available` that succeeds only if exactly the expected number of rows changed, or an atomic Redis `SET key holder NX EX 480` that succeeds only if the key is absent. Never trust a separately-read status to still be true at write time, and add a unique constraint on the sold seat as a final backstop.' },
      { type: 'code', heading: 'Idempotent Booking with Hold Expiry', language: 'typescript', label: 'booking.ts', code: `async function createHold(req: HoldRequest, idempotencyKey: string): Promise<Hold> {
  // Idempotency: a repeated request returns the same hold, never a second one
  const existing = await store.getHoldByIdempotencyKey(idempotencyKey);
  if (existing) return existing;

  const holdId = randomId();
  const expiresAt = Date.now() + 8 * 60_000; // 8-minute hold window
  const acquired = await seats.tryHold(req.eventId, req.seatIds, holdId, expiresAt);

  if (!acquired) throw new ConflictError('Seats are no longer available');
  await store.saveHold({ holdId, idempotencyKey, expiresAt, seatIds: req.seatIds });

  // An expiry worker releases the seats if payment never completes
  await expiryQueue.schedule('release-hold', { holdId }, expiresAt);
  return { holdId, expiresAt };
}` },
      { type: 'text', heading: 'Payment Integration and Flash-Sale Queueing', content: 'Payment is a slow external call, so the booking service charges the payment provider with the same idempotency key it used for the hold. If the client retries, the provider recognizes the key and returns the original charge instead of a second one, so a network timeout never becomes a double charge. Only after the charge succeeds are the seats marked sold; a charge that succeeds while the hold expired is refunded automatically.\n\nThe on-sale spike is handled at the front door, not deeper in. A virtual waiting room queues arriving users and admits them at the rate the booking system can actually serve — say 20,000 a second — handing each a short-lived token that grants access to the seat map. This converts a thundering herd into a controlled flow, protects the database, and makes the experience fairer than a pure race.' },
      { type: 'steps', heading: 'Booking a Seat End to End', steps: [
        { title: 'Enter the waiting room', detail: 'At T-0 the queue admits users at a sustainable rate, issuing short-lived access tokens.' },
        { title: 'Hold seats atomically', detail: 'A compare-and-set takes all requested seats or none, with an 8-minute expiry.' },
        { title: 'Authorize payment', detail: 'The charge is sent with the hold idempotency key so retries never double-charge.' },
        { title: 'Confirm the booking', detail: 'On success the seats move from held to sold in one transaction and a booking is recorded.' },
        { title: 'Release on failure', detail: 'If payment fails or the hold expires, the seats return to the available pool.' },
        { title: 'Generate the ticket', detail: 'A signed ticket is issued and the seat map is updated for all other viewers.' },
      ]},
      { type: 'checklist', heading: 'Key Takeaways', items: [
        'Never oversell: make the availability check and the status write one atomic operation',
        'Two-phase hold-then-confirm keeps a slow payment call off the database transaction',
        'Holds expire; an expiry worker returns abandoned seats to the pool',
        'Every hold and charge carries an idempotency key so retries are safe',
        'Pessimistic locking suits high-contention seats; optimistic fits cheap, low-contention reads',
        'Absorb flash-sale spikes with a virtual waiting room that admits users at sustainable rate',
      ]},
    ],
    quiz: [
      { question: 'What causes overselling in a naive seat booking implementation?', options: ['Using too many database replicas', 'A read-check-write race where two buyers both read available and both write held', 'Storing seats in memory', 'Using UUIDs for seat IDs'], correctIndex: 1, explanation: 'If the status is read in one step and written in another, two or more concurrent buyers can all read available before any write lands, and each reserves the seat. Making the check and the write a single atomic update closes the race.' },
      { question: 'Why is booking split into a hold phase and a confirm phase?', options: ['To charge the customer twice', 'So a slow external payment call does not hold a database lock for its whole duration', 'Because seats cannot be updated twice', 'To avoid using idempotency keys'], correctIndex: 1, explanation: 'Hold takes the seats atomically for a short window and confirm finalizes them after payment. Keeping payment outside the database transaction bounds how long any lock or seat is held while an external provider responds.' },
      { question: 'How does an idempotency key prevent double charging?', options: ['It encrypts the payment', 'The payment provider returns the original charge for a repeated key instead of charging again', 'It cancels the first charge', 'It locks the user account'], correctIndex: 1, explanation: 'The client sends the same key on retries; the provider records the key with the first result and, on a repeat, returns that stored result rather than executing a second charge. This makes a network timeout safe to retry.' },
      { question: 'What is the purpose of a virtual waiting room during an on-sale?', options: ['To store seat data', 'To admit users at a rate the system can serve, converting a thundering herd into controlled flow', 'To encrypt access tokens', 'To increase the number of seats'], correctIndex: 1, explanation: 'Demand can exceed capacity by orders of magnitude. The waiting room meters admission to what the booking service can actually handle and issues short-lived tokens, protecting the database while giving users a fair, predictable place in line.' },
    ]
  },

};

export default TOPIC_CONTENT_PART10;
