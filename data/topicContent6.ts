// Part 6: Data modeling, storage, and data engineering topics

import type { TopicContent } from "./contentTypes";

export const TOPIC_CONTENT_PART6: Record<string, TopicContent> = {
  // ─── DATA MODELING & SCHEMAS ────────────────────────────────────────────

  "data-modeling": {
    slug: "data-modeling",
    title: "Data Modeling",
    tagline: "From entities and relationships to durable schemas",
    sections: [
      {
        type: "text",
        heading: "Three Levels of Modeling",
        content:
          "A schema is not discovered, it is designed. Data modeling happens at three levels and each answers a different question.\n\nThe **conceptual model** captures the business vocabulary: entities, relationships, and cardinalities, with no thought of tables or types. The **logical model** refines that into relations, attributes, keys, and normal form, still independent of any specific database. The **physical model** maps the logical design onto real storage — column types, indexes, partitioning, and engine-specific features. Skipping the first two and jumping straight to DDL is how teams end up with tables named after whatever endpoint shipped first.",
      },
      {
        type: "analogy",
        heading: "Blueprints Before Bricks",
        content:
          "An architect does not pour concrete while sketching. First comes the concept — a family needs three bedrooms and one bathroom. Then the logical plan — a floor plan showing rooms, doors, and load-bearing walls. Only then the physical build — which bricks, which beams, which wiring.\n\nData modeling works the same way. The conceptual model is the family brief, the logical model is the floor plan, and the physical model is the actual construction. Changing the brief is cheap; changing a load-bearing wall after the building is occupied is not.",
      },
      {
        type: "text",
        heading: "Entities, Relationships, and Keys",
        content:
          "An **entity** is a thing you store facts about — a customer, an order, a product. A **relationship** describes how entities relate: a customer places many orders (one-to-many), or an order references many products and a product appears in many orders (many-to-many, resolved with a join table).\n\nEvery entity needs a **primary key**: a stable, unique, non-null identifier. Prefer a surrogate key (a generated identity or UUID) over a natural key such as an email address, because natural keys change. Foreign keys enforce referential integrity — the database refuses to delete a customer that still has orders unless you handle the dependents explicitly.",
      },
      {
        type: "code",
        heading: "A Normalized Core Schema",
        language: "sql",
        label: "schema.sql",
        code: `CREATE TABLE customers (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

CREATE TABLE orders (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id  BIGINT NOT NULL REFERENCES customers (id),
  status       TEXT NOT NULL DEFAULT 'pending',
  placed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_cents  BIGINT NOT NULL CHECK (total_cents >= 0)
);

CREATE INDEX orders_customer_placed_idx
  ON orders (customer_id, placed_at DESC);

CREATE TABLE order_items (
  order_id    BIGINT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id  BIGINT NOT NULL REFERENCES products (id),
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  unit_cents  BIGINT NOT NULL,
  PRIMARY KEY (order_id, product_id)
);`,
      },
      {
        type: "text",
        heading: "Normalization: Removing Redundancy",
        content:
          "Normalization is the discipline of storing each fact exactly once so it cannot contradict itself.\n\n**1NF** requires atomic values — no comma-separated lists crammed into a column. **2NF** requires every non-key attribute to depend on the whole key, eliminating partial dependencies in composite keys. **3NF** requires no transitive dependencies — a non-key attribute must not depend on another non-key attribute (store the customer city on the customer, not on each order). **BCNF** tightens this further for overlapping candidate keys.\n\nMost transactional schemas stop at 3NF. Going beyond trades write simplicity for query cost, and reads then reconstruct rows through joins.",
      },
      {
        type: "comparison",
        heading: "Normalized vs Denormalized",
        headers: ["Normalized (OLTP)", "Denormalized (read path)"],
        rows: [
          {
            aspect: "Redundancy",
            "Normalized (OLTP)": "Each fact stored once",
            "Denormalized (read path)": "Facts copied into many rows",
          },
          {
            aspect: "Write consistency",
            "Normalized (OLTP)": "Single point of update",
            "Denormalized (read path)": "Must update copies in step",
          },
          {
            aspect: "Read shape",
            "Normalized (OLTP)": "Joins reconstruct the view",
            "Denormalized (read path)": "One row is the full view",
          },
          {
            aspect: "Storage",
            "Normalized (OLTP)": "Minimal",
            "Denormalized (read path)": "Larger, duplicative",
          },
          {
            aspect: "Typical fit",
            "Normalized (OLTP)": "Transactional core, source of truth",
            "Denormalized (read path)": "Search indexes, analytics, caches",
          },
          {
            aspect: "Failure mode",
            "Normalized (OLTP)": "Slow reads under heavy joins",
            "Denormalized (read path)": "Stale or conflicting copies",
          },
        ],
      },
      {
        type: "text",
        heading: "Modeling Polymorphic Relations",
        content:
          "A comment can attach to a post, a photo, or a product. Forcing three nullable foreign keys into one table, or dumping the target id into an untyped column, both hurt integrity. There are three honest options.\n\n**Exclusive arc**: one nullable FK per target plus a CHECK constraint ensuring exactly one is set — referential integrity is preserved, but the column list grows with each target. **Discriminator + generic id**: a type column plus a target id with no FK — flexible but the database can no longer guarantee the target exists. **Inheritance table**: a base table for the shared shape and one child table per target — the cleanest when targets share most of their columns.",
      },
      {
        type: "code",
        heading: "Exclusive Arc with a Check Constraint",
        language: "sql",
        label: "polymorphic.sql",
        code: `CREATE TABLE comments (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  body        TEXT NOT NULL,
  post_id     BIGINT REFERENCES posts (id),
  photo_id    BIGINT REFERENCES photos (id),
  product_id  BIGINT REFERENCES products (id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Exactly one target must be set
  CONSTRAINT one_target CHECK (
    (post_id IS NOT NULL)::int +
    (photo_id IS NOT NULL)::int +
    (product_id IS NOT NULL)::int = 1
  )
);`,
      },
      {
        type: "text",
        heading: "Soft Deletes and Audit Columns",
        content:
          "Hard deletes destroy history and break foreign keys that still point at the row. A **soft delete** sets a deleted_at timestamp instead, so the row remains for audit, recovery, and referential integrity. It buys safety at a cost: every query must now filter deleted_at IS NULL, and unique constraints must ignore soft-deleted rows.\n\n**Audit columns** record who created and last changed a row and when. At minimum store created_at and updated_at as TIMESTAMPTZ. Higher-stakes tables add created_by and updated_by, or a full history table written by a trigger.",
      },
      {
        type: "code",
        heading: "Partial Unique Index for Soft Deletes",
        language: "sql",
        label: "soft-delete.sql",
        code: `-- A customer may re-register the same email after the old row is soft-deleted
CREATE UNIQUE INDEX customers_email_active_key
  ON customers (lower(email))
  WHERE deleted_at IS NULL;

-- Keep updated_at honest without relying on application code
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $fn$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

CREATE TRIGGER customers_touch
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();`,
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Soft Deletes Leak Everywhere",
        content:
          "The moment a table gets a deleted_at column, every join, every aggregate, and every unique constraint must account for it. A forgotten filter silently double-counts revenue or resurfaces deleted users. Consider a partial index, a view that hides deleted rows, or row-level security so the filter cannot be omitted. If you never need the history, a hard delete plus a separate archive table is simpler and safer.",
      },
      {
        type: "text",
        heading: "Time Zones: Store UTC, Render Locally",
        content:
          "Timestamps are the most common source of data-modeling bugs. The rule is absolute: store an absolute instant in UTC, convert to a local zone only at the presentation boundary.\n\nIn PostgreSQL that means costing TIMESTAMPTZ (which stores UTC and remembers nothing about the input zone) rather than TIMESTAMP (which stores a wall-clock value with no zone, and lies during DST transitions). If you must record user intent — a reminder at 09:00 in Lagos regardless of where the server is — store the IANA zone name alongside the timestamp, never a numeric offset, because offsets change with daylight-saving rules.",
      },
      {
        type: "steps",
        heading: "A Practical Modeling Workflow",
        steps: [
          {
            title: "Name the entities",
            detail:
              "List the nouns the business talks about and the facts it must remember about each.",
          },
          {
            title: "Draw relationships",
            detail:
              "Set cardinality for each pair and decide where the foreign key lives.",
          },
          {
            title: "Choose keys",
            detail:
              "Pick stable surrogate primary keys and add unique constraints for natural keys.",
          },
          {
            title: "Normalize to 3NF",
            detail:
              "Eliminate the obvious redundancies, then denormalize only where a measured read demands it.",
          },
          {
            title: "Add audit and lifecycle columns",
            detail:
              "created_at, updated_at, and a deletion strategy — chosen up front, not retrofitted.",
          },
          {
            title: "Design indexes from queries",
            detail:
              "Drive indexes from the real access paths, not from guesswork about future ones.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Model at three levels: conceptual, logical, then physical — never start at DDL",
          "Normalize to 3NF by default; denormalize only for measured read paths",
          "Prefer surrogate keys; natural keys such as email change and break references",
          "Polymorphic relations need an explicit strategy: exclusive arc, discriminator, or inheritance",
          "Soft deletes require filters and partial unique indexes everywhere — treat them as a schema-wide decision",
          "Always store instants as TIMESTAMPTZ in UTC and keep IANA zone names for user intent",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Which normal form eliminates transitive dependencies, where a non-key attribute depends on another non-key attribute?",
        options: ["1NF", "2NF", "3NF", "BCNF"],
        correctIndex: 2,
        explanation:
          "Third normal form removes transitive dependencies. 1NF requires atomic values, 2NF removes partial dependencies on part of a composite key, and 3NF additionally requires non-key attributes to depend only on the key, not on other non-key attributes.",
      },
      {
        question:
          "What is the main correctness risk introduced by a soft-delete column?",
        options: [
          "It cannot be indexed",
          "Every query and unique constraint must remember to exclude deleted rows",
          "It converts timestamps to the wrong zone",
          "It prevents foreign keys",
        ],
        correctIndex: 1,
        explanation:
          "A soft delete leaves the row in place, so every read, join, aggregate, and unique constraint must filter or account for deleted_at. A single forgotten filter double-counts rows or resurfaces records the user thought were gone.",
      },
      {
        question:
          'You must store "a reminder fires at 09:00 local time for this user". What should the column hold?',
        options: [
          "A TIMESTAMP in UTC only",
          "A UTC instant plus the IANA time-zone name",
          "A fixed numeric UTC offset like +01:00",
          "The server local wall-clock time",
        ],
        correctIndex: 1,
        explanation:
          "User intent is tied to a local wall-clock time in a named zone, and offsets change with daylight-saving rules. Store the UTC instant for ordering plus the IANA zone name (for example Africa/Lagos) to reconstruct the intended local time later.",
      },
      {
        question:
          "A comment can belong to a post, a photo, or a product. Which approach preserves database-level referential integrity?",
        options: [
          "A single untyped target_id column",
          "An exclusive arc with nullable foreign keys and a CHECK constraint",
          "Serializing the target as JSON",
          "Storing the target name as free text",
        ],
        correctIndex: 1,
        explanation:
          "An exclusive arc keeps real foreign keys to each target table and a CHECK constraint guarantees exactly one is set, so the database can still enforce that the referenced row exists. Generic ids and free text abandon that guarantee.",
      },
    ],
  },

  // ─── STORAGE ENGINES ────────────────────────────────────────────────────

  "storage-engines": {
    slug: "storage-engines",
    title: "Storage Engines: B-Tree vs LSM",
    tagline: "How databases actually put bytes on disk",
    sections: [
      {
        type: "text",
        heading: "Two Families of Storage",
        content:
          "Almost every database you use is built on one of two storage engine families. **B-trees** keep data in a balanced, sorted tree updated in place. **Log-structured merge trees (LSM)** never update in place — they append writes to an in-memory buffer and immutable sorted files, merging them in the background.\n\nThe choice decides the engine write, read, and space behaviour long before you tune a single query. InnoDB, PostgreSQL, and SQL Server are B-tree engines. RocksDB, LevelDB, Cassandra, ScyllaDB, HBase, and the storage layer of ClickHouse are LSM.",
      },
      {
        type: "analogy",
        heading: "Filing Cabinet vs Inbox",
        content:
          "A B-tree is a filing cabinet: every document has one correct place, and inserting a page means pulling the drawer and sliding it into the right slot. Reading any document is quick and predictable because everything is already sorted.\n\nAn LSM tree is an overflowing inbox: new pages are dropped on top immediately, and every so often you tip the whole stack out, sort it, and merge it into the master archive. Writes are instant, but to find a page you may have to check the inbox, the last merge, and the archive before you know it is not there.",
      },
      {
        type: "text",
        heading: "B-Trees and the Clustered Index",
        content:
          "A B-tree is a shallow, high-fanout tree of pages. Each node holds keys and pointers; leaves hold either the row itself or a pointer to it. Because the tree is balanced, any lookup takes O(log N) page reads.\n\nInnoDB stores the entire row inside the primary key B-tree — this is the **clustered index**. Secondary indexes store the indexed columns plus the primary key, so a secondary-index lookup that needs other columns must do a second trip to the clustered index (a **bookmark lookup**). This makes the primary key choice matter enormously: a wide or random primary key inflates every secondary index and causes page splits.",
      },
      {
        type: "code",
        heading: "Clustered vs Secondary Index in InnoDB",
        language: "sql",
        label: "innodb-index.sql",
        code: `-- The primary key IS the table: rows are stored inside this B-tree.
-- A BIGINT identity key keeps entries compact and insert order monotonic.
CREATE TABLE events (
  id          BIGINT NOT NULL AUTO_INCREMENT,
  tenant_id   BIGINT NOT NULL,
  type        VARCHAR(32) NOT NULL,
  payload     JSON NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- Secondary index: leaf pages store (tenant_id, created_at, id).
-- The trailing id lets the engine reach the full row in the clustered index.
CREATE INDEX events_tenant_created_idx
  ON events (tenant_id, created_at);

-- A covering index answers the query without touching the clustered index.
CREATE INDEX events_tenant_type_cover_idx
  ON events (tenant_id, type, created_at);`,
      },
      {
        type: "text",
        heading: "LSM Trees: Memtable and SSTables",
        content:
          "An LSM engine accepts writes into a sorted in-memory structure called the **memtable**. When the memtable fills, it is flushed to an immutable, sorted file on disk — an **SSTable** — and a new memtable takes over. A write-ahead log (WAL) makes the memtable durable across a crash.\n\nReads check the memtable first, then the newest SSTable, then progressively older ones. Because a key can exist in several SSTables, a key found in a newer file is the current value (writes are timestamped). **Bloom filters** — a compact probabilistic structure per SSTable — let the engine skip files that definitely do not contain the key.",
      },
      {
        type: "code",
        heading: "The LSM Write Path",
        language: "plaintext",
        label: "lsm-write-path.txt",
        code: `PUT user:42 {name: "Ada", plan: "pro"}

1. Append the record to the write-ahead log (durable, sequential I/O)
2. Apply it to the in-memory memtable (a sorted structure, e.g. a skiplist)
3. Acknowledge the write  <-- write complete, no disk seek for the data itself

Background, asynchronously:

4. When the memtable exceeds its threshold, freeze it
5. Flush the frozen memtable to a new immutable SSTable on disk
6. Compaction merges overlapping SSTables into fewer, larger ones
7. Obsolete versions and deleted keys (tombstones) are dropped during compaction`,
      },
      {
        type: "text",
        heading: "Write, Read, and Space Amplification",
        content:
          "Three amplification factors explain LSM behaviour. **Write amplification** is bytes written to disk divided by bytes the user wrote — an LSM amplifies writes because every record is written to the WAL, flushed to an SSTable, and rewritten many times during compaction. **Read amplification** is how many files a single read must consult. **Space amplification** is disk used divided by the logical data size, inflated by old versions awaiting compaction.\n\nB-trees suffer less write amplification (a record is written roughly once per level of the tree, plus a WAL) but pay in random I/O and page splits. LSM engines trade extra writes for purely sequential I/O, which is why they shine on write-heavy workloads and SSDs.",
      },
      {
        type: "comparison",
        heading: "B-Tree vs LSM Tree",
        headers: ["B-Tree", "LSM Tree"],
        rows: [
          {
            aspect: "Write pattern",
            "B-Tree": "Random, update in place",
            "LSM Tree": "Sequential append, never in place",
          },
          {
            aspect: "Write throughput",
            "B-Tree": "Good, bounded by random I/O",
            "LSM Tree": "Higher, sequential I/O only",
          },
          {
            aspect: "Point read",
            "B-Tree": "One predictable tree walk",
            "LSM Tree": "Check memtable plus several SSTables",
          },
          {
            aspect: "Range scan",
            "B-Tree": "Excellent, data already ordered",
            "LSM Tree": "Good, merges across SSTables",
          },
          {
            aspect: "Write amplification",
            "B-Tree": "Moderate",
            "LSM Tree": "High, driven by compaction",
          },
          {
            aspect: "Space amplification",
            "B-Tree": "Low, some page slack",
            "LSM Tree": "Higher until compaction catches up",
          },
          {
            aspect: "Example engines",
            "B-Tree": "InnoDB, PostgreSQL, SQL Server",
            "LSM Tree": "RocksDB, LevelDB, Cassandra, ScyllaDB",
          },
        ],
      },
      {
        type: "text",
        heading: "Compaction Strategies",
        content:
          "Compaction is the LSM background process that merges SSTables and reclaims space. Its strategy determines the amplification tradeoff.\n\n**Size-tiered compaction** merges SSTables of similar size into bigger ones. It writes least, so it favours write-heavy workloads, but a single key can live in many files, hurting read and space amplification, and worst-case latency spikes. **Leveled compaction** organises files into levels with non-overlapping key ranges and a size ratio between levels. Reads touch few files and space stays tight, at the cost of more rewriting. RocksDB and LevelDB default to leveled; Cassandra offers both.",
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Where LSM Engines Live",
        content:
          "RocksDB and its predecessor LevelDB are embeds, not servers — they are libraries you link in. MySQL and MariaDB use MyRocks, a RocksDB-backed storage engine tuned for write-heavy and compression-sensitive workloads. Cassandra, ScyllaDB, and HBase build their distributed tables on LSM storage. Kafka relies on sequential log files that behave much like SSTables. When a service needs millions of writes per second and can tolerate slightly higher read latency, an LSM engine is usually the right foundation.",
      },
      {
        type: "text",
        heading: "Column Stores: A Third Shape",
        content:
          "Both B-trees and LSMs are **row stores** — they keep all columns of a row together, which suits fetching or updating whole records. **Column stores** keep each column in its own contiguous segment, which is ideal for analytics: a query summing one column reads only that column and skips the rest.\n\nColumns of similar values compress dramatically (run-length, dictionary, and delta encoding), often 10x or more, and modern engines vectorise scans across them. ClickHouse, DuckDB, and the warehouses BigQuery, Snowflake, and Redshift are column-oriented. Row stores win on point lookups and single-row writes; column stores win on scanning a few columns across billions of rows.",
      },
      {
        type: "code",
        heading: "Why Column Layout Wins a Big Scan",
        language: "sql",
        label: "columnar.sql",
        code: `-- Table with 40 columns, 2 billion rows.
-- This query touches exactly two of them.

SELECT region, sum(revenue_cents) AS revenue
FROM orders
WHERE order_date >= DATE '2026-01-01'
GROUP BY region;

-- Row store: each row read pulls all 40 columns off disk, 95% discarded.
-- Column store: reads only order_date and revenue_cents segments,
--               decompresses them, and vectorises the aggregate.
-- Even better: the engine skips whole segments via min/max zone maps,
-- so partitions outside the date range are never decompressed at all.`,
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "B-trees update in place with a shallow, balanced tree; LSM trees append and merge",
          "InnoDB stores the row inside the primary key B-tree — the clustered index",
          "LSM writes hit a WAL and memtable first, then flush to immutable SSTables",
          "LSMs trade write amplification for sequential I/O; B-trees trade random I/O for fewer writes",
          "Bloom filters let LSMs skip SSTables a key cannot be in",
          "Compaction strategy (size-tiered vs leveled) sets the read, write, and space amplification balance",
          "Column stores separate columns for analytics; row stores keep rows together for transactions",
        ],
      },
    ],
    quiz: [
      {
        question:
          "In InnoDB, why does a wide or randomly distributed primary key hurt performance?",
        options: [
          "It disables the write-ahead log",
          "Every secondary index stores the primary key, so a large key inflates them, and random keys cause page splits",
          "It forces the storage engine to become an LSM tree",
          "It disables secondary indexes entirely",
        ],
        correctIndex: 1,
        explanation:
          "InnoDB stores rows in the primary key B-tree and copies the primary key into every secondary index entry. A wide key bloats all secondary indexes, and random keys cause mid-tree page splits instead of sequential appends.",
      },
      {
        question: "Which statement about LSM trees is correct?",
        options: [
          "They update rows in place on disk to avoid compaction",
          "Writes go to a WAL and memtable, then flush to immutable SSTables that are merged by compaction",
          "They have lower write amplification than B-trees because they never rewrite data",
          "Reads always check exactly one file",
        ],
        correctIndex: 1,
        explanation:
          "LSM writes are buffered in the memtable and made durable by the WAL, then flushed to immutable SSTables. Background compaction merges those files, which is what causes high write amplification — data is rewritten many times.",
      },
      {
        question:
          "A workload is dominated by point updates to single rows with strict low-latency reads. Which engine family generally fits best?",
        options: [
          "A column store",
          "An LSM tree with size-tiered compaction",
          "A B-tree row store such as InnoDB",
          "An in-memory only store with no durability",
        ],
        correctIndex: 2,
        explanation:
          "Point updates and latency-sensitive point reads favour a B-tree row store, which updates in place and answers a lookup with one predictable tree walk. Column stores are poor at single-row updates, and size-tiered LSMs can show latency spikes during compaction.",
      },
      {
        question: "What does a Bloom filter do in an LSM engine?",
        options: [
          "Compresses SSTables on disk",
          "Quickly rules out SSTables that cannot contain a key, avoiding unnecessary reads",
          "Encrypts records before flushing",
          "Replaces the write-ahead log",
        ],
        correctIndex: 1,
        explanation:
          "A Bloom filter is a compact probabilistic structure stored per SSTable. It can say a key is definitely absent, letting the engine skip files without reading them — at the cost of occasional false positives but never false negatives.",
      },
    ],
  },

  // ─── MIGRATIONS ─────────────────────────────────────────────────────────

  "schema-migrations": {
    slug: "schema-migrations",
    title: "Schema Migrations",
    tagline: "Evolving a live database without downtime",
    sections: [
      {
        type: "text",
        heading: "The Schema Change Problem",
        content:
          "Application code and database schema are deployed separately and cannot be updated at the same instant. During any deploy, old and new code run side by side against one shared database. A migration that renames a column, changes its type, or drops it will break whichever version is on the wrong side of the change.\n\nThe solution is to make every schema change backward compatible: the database supports both the old and new code paths for a window, and only after the last old instance is gone do you remove the old shape. Migrations are versioned, ordered, and applied exactly once.",
      },
      {
        type: "steps",
        heading: "A Versioned Migration Workflow",
        steps: [
          {
            title: "Author the migration",
            detail:
              "Add one file with a monotonic version and both an up and a down path.",
          },
          {
            title: "Commit it with the code",
            detail:
              "Review the migration in the same pull request as the code that depends on it.",
          },
          {
            title: "Apply in staging",
            detail:
              "Run it against a production-sized copy to surface locking and timing problems.",
          },
          {
            title: "Apply in production",
            detail:
              "Run migrations as a controlled deploy step, not at application startup under race conditions.",
          },
          {
            title: "Record the version",
            detail:
              "The migration tool writes the applied version so the next run knows where to resume.",
          },
          {
            title: "Verify the new shape",
            detail:
              "Confirm columns, indexes, and constraints exist before the dependent code serves traffic.",
          },
        ],
      },
      {
        type: "analogy",
        heading: "Renovating a Bridge",
        content:
          "You cannot close a busy bridge to rebuild it. Instead you build a temporary parallel lane, shift traffic onto it, rebuild the original, then retire the temporary lane.\n\nThe **expand-contract** pattern is that bridge work. Expand: add the new column or table without touching the old one. Migrate: dual-write and backfill so both shapes are correct. Contract: once nothing reads the old shape, drop it in a later release. At every moment there is a working path.",
      },
      {
        type: "text",
        heading: "Zero-Downtime Column Changes",
        content:
          "Adding a nullable column with no default is instant on modern PostgreSQL and MySQL — it is a metadata-only change. Adding a column with a default used to rewrite the whole table; since PostgreSQL 11 and MySQL 8.0 this is also metadata-only for most types. Dropping a column or adding a NOT NULL constraint without a default forces a full table rewrite and takes an exclusive lock.\n\nRenaming a column is the deadliest change: old code still writes the old name while new code writes the new one. Never rename directly — add a new column, backfill, and drop the old one across separate releases.",
      },
      {
        type: "code",
        heading: "Expand-Contract: Rename Without Downtime",
        language: "sql",
        label: "expand-contract.sql",
        code: `-- RELEASE 1 (expand): add the new column, keep the old one
ALTER TABLE users ADD COLUMN display_name TEXT;
CREATE INDEX CONCURRENTLY users_display_name_idx ON users (display_name);

-- Dual-write from application code: write both full_name and display_name.

-- RELEASE 2 (migrate): backfill in small batches, then read from the new column
UPDATE users SET display_name = full_name
WHERE display_name IS NULL AND id BETWEEN 1 AND 10000;  -- repeat per batch

-- RELEASE 3 (contract): nothing reads or writes full_name any more
ALTER TABLE users DROP COLUMN full_name;`,
      },
      {
        type: "text",
        heading: "Backfills in Batches",
        content:
          "A single UPDATE over 200 million rows locks rows, bloats the table, and spikes replication lag that can stall the whole cluster. Backfills must be chunked: update a bounded range of rows, commit, wait, repeat.\n\nBatch on the primary key so each statement touches a contiguous, index-friendly range, and add a small sleep between batches to let replication catch up and vacuum keep pace. Make the backfill idempotent — safe to re-run from the last unprocessed key — so a failed batch does not require starting over.",
      },
      {
        type: "code",
        heading: "Batched Backfill with Resumable Cursor",
        language: "typescript",
        label: "backfill.ts",
        code: `async function backfill(db: Pool, batchSize = 1000): Promise<void> {
  let lastId = 0;

  for (;;) {
    const { rows } = await db.query(
      'UPDATE accounts SET tier = ' + "'basic' " +
      'WHERE id > $1 AND tier IS NULL ' +
      'AND id IN (SELECT id FROM accounts WHERE id > $1 ORDER BY id LIMIT $2) ' +
      'RETURNING id',
      [lastId, batchSize],
    );

    if (rows.length === 0) break;
    lastId = rows[rows.length - 1].id;

    // Yield so replication can catch up and autovacuum can reclaim dead tuples
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}`,
      },
      {
        type: "text",
        heading: "Locking and Online DDL",
        content:
          "Every ALTER TABLE takes a lock, and the lock level decides whether readers and writers proceed. A plain ALTER takes ACCESS EXCLUSIVE in PostgreSQL, blocking all traffic for the duration of the rewrite. But acquiring that lock can be worse than holding it: the ALTER queues behind any long-running query, and every subsequent query queues behind the ALTER, producing a pile-up.\n\nAvoid this with a lock timeout so the migration fails fast instead of blocking, or use online DDL. PostgreSQL offers **CREATE INDEX CONCURRENTLY** and **ALTER TABLE ... ADD COLUMN** as metadata-only. MySQL exposes **ALGORITHM=INPLACE, LOCK=NONE** for many operations, and external tools such as gh-ost and pt-online-schema-change perform a shadow-table rebuild for the rest.",
      },
      {
        type: "comparison",
        heading: "Blocking DDL vs Online DDL",
        headers: ["Naive DDL", "Online DDL"],
        rows: [
          {
            aspect: "Lock level",
            "Naive DDL": "Exclusive; blocks all reads and writes",
            "Online DDL": "Shared or none; readers and writers continue",
          },
          {
            aspect: "Duration",
            "Naive DDL": "Holds lock for the whole rewrite",
            "Online DDL": "Brief locks only at start and end",
          },
          {
            aspect: "Index builds",
            "Naive DDL": "CREATE INDEX blocks writes",
            "Online DDL": "CREATE INDEX CONCURRENTLY does not",
          },
          {
            aspect: "Failure handling",
            "Naive DDL": "Partial change rolled back",
            "Online DDL":
              "Concurrent index build can leave an invalid index to drop",
          },
          {
            aspect: "Replication",
            "Naive DDL": "Causes lag from the bulk rewrite",
            "Online DDL": "Spreads work, limiting lag",
          },
          {
            aspect: "Typical use",
            "Naive DDL": "Small tables and maintenance windows",
            "Online DDL": "Large production tables with continuous traffic",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Not Every Migration Is Reversible",
        content:
          "A drop column or truncate throws data away — the down migration can recreate the column but not its contents. Treat destructive migrations as one-way: back up the affected data first, keep the change in its own release after the code no longer references it, and pause before running it. A down migration that claims to reverse a data loss is a lie you will discover during an incident.",
      },
      {
        type: "text",
        heading: "Tooling: Prisma, Flyway, and Friends",
        content:
          "**Prisma Migrate** generates SQL from your schema and tracks applied migrations in a _prisma_migrations table; the generated SQL is still yours to review and hand-edit for zero-downtime patterns. **Flyway** and **Liquibase** are database-agnostic, running ordered versioned scripts and recording checksums so a modified applied migration is detected as drift. **Alembic** plays the same role for SQLAlchemy projects, and **Rails Active Record Migrations** and **Django migrations** embed versioning in the framework.\n\nWhatever the tool, the operating discipline is identical: migrations are immutable once applied, ordered by version, run as a separate deploy step, and reviewed like code.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Every schema change must be backward compatible while old and new code run together",
          "Use expand-contract for renames and type changes: add, dual-write, backfill, then drop",
          "Adding a nullable column is metadata-only; dropping, renaming, and NOT NULL are not",
          "Backfill in bounded batches on the primary key, with sleeps and idempotent resumes",
          "Set a lock timeout so DDL fails fast instead of queueing behind long queries",
          "Prefer CREATE INDEX CONCURRENTLY and online DDL over exclusive-lock rewrites",
          "Treat destructive migrations as one-way and never trust a down migration to restore data",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why must a column rename be split across multiple releases instead of done in one migration?",
        options: [
          "PostgreSQL cannot rename columns",
          "Old code still references the old name while new code uses the new one, so one instant rename breaks whichever version is on the wrong side",
          "Renaming always loses data",
          "Renames require a cluster restart",
        ],
        correctIndex: 1,
        explanation:
          "During a deploy, old and new application versions run at the same time. A single atomic rename breaks the version that still uses the other name. Add the new column, dual-write and backfill, then drop the old column after the last old instance is gone.",
      },
      {
        question:
          "What is the main risk of running an ALTER TABLE that needs an exclusive lock on a busy table?",
        options: [
          "It silently deletes rows",
          "It queues behind long queries while every subsequent query queues behind it, causing a pile-up",
          "It disables replication permanently",
          "It always corrupts indexes",
        ],
        correctIndex: 1,
        explanation:
          "The ALTER waits to acquire ACCESS EXCLUSIVE, and once it is waiting, all later queries queue behind it. That pile-up can take the table offline even though the ALTER itself would have been quick. A lock timeout or online DDL avoids it.",
      },
      {
        question: "Why should a large backfill UPDATE be split into batches?",
        options: [
          "To make the SQL shorter",
          "A single massive UPDATE locks many rows, bloats the table, and causes replication lag that can stall the cluster",
          "Because UPDATE cannot affect more than 1000 rows",
          "To avoid needing an index",
        ],
        correctIndex: 1,
        explanation:
          "Row-by-row updates in bounded batches commit incrementally, limiting lock scope, table bloat, and replication lag, and allowing a failed run to resume from the last processed key instead of starting over.",
      },
      {
        question:
          "Which change is typically metadata-only and therefore safe to run with minimal locking on a large table?",
        options: [
          "Dropping a column",
          "Adding a nullable column without a default",
          "Adding a NOT NULL constraint to an existing column",
          "Changing a column data type",
        ],
        correctIndex: 1,
        explanation:
          "Adding a nullable column with no default is a metadata-only change on modern PostgreSQL and MySQL — no table rewrite. Dropping a column, adding NOT NULL without a default, and changing types generally force a full rewrite under an exclusive lock.",
      },
    ],
  },

  // ─── SEARCH ─────────────────────────────────────────────────────────────

  "full-text-search": {
    slug: "full-text-search",
    title: "Full-Text Search",
    tagline: "Inverted indexes, analyzers, and relevance ranking",
    sections: [
      {
        type: "text",
        heading: "Why LIKE Does Not Scale",
        content:
          "The naive search is WHERE body LIKE '%term%'. Because of the leading wildcard, no B-tree index can help — the database reads and scans every row. It also cannot rank results, understand stemming, or handle typos.\n\nA real search engine flips the problem. Instead of asking \"does this document contain the term\", it precomputes, for every term, the list of documents containing it. That structure is the **inverted index**, and lookup becomes a set intersection over posting lists rather than a full scan.",
      },
      {
        type: "analogy",
        heading: "The Index at the Back of a Book",
        content:
          'A textbook index lists every important word alphabetically and, next to each, the page numbers where it appears. To find where "normalization" is discussed you flip to "N" and read a handful of page numbers — you never re-read the book.\n\nAn inverted index is exactly that, built automatically for every document in the corpus. The word is the term, the list of page numbers is the posting list, and a multi-word search is finding documents whose posting lists overlap.',
      },
      {
        type: "code",
        heading: "The Inverted Index",
        language: "json",
        label: "inverted-index.json",
        code: `{
  "terms": {
    "data":     { "posting": [ { "doc": 1, "tf": 3 }, { "doc": 2, "tf": 1 } ] },
    "modeling": { "posting": [ { "doc": 1, "tf": 2 } ] },
    "schema":   { "posting": [ { "doc": 1, "tf": 1 }, { "doc": 3, "tf": 5 } ] },
    "migration":{ "posting": [ { "doc": 2, "tf": 4 }, { "doc": 3, "tf": 1 } ] }
  },
  "doc_count": 3,
  "field_length": { "1": 42, "2": 30, "3": 55 }
}`,
      },
      {
        type: "text",
        heading: "Tokenization, Stemming, and Analyzers",
        content:
          'Text cannot be indexed raw — it is broken into terms by an **analyzer**, a pipeline of steps. **Tokenization** splits on word boundaries and punctuation. **Normalization** lowercases and folds accents so "Data" and "data" match. **Stemming** reduces words to a root — "running", "runs", and "ran" collapse to "run" — while **lemmatization** uses a dictionary for a linguistically correct base form. **Stop-word removal** drops high-frequency words like "the" and "and".\n\nThe index time and query time analyzers must match. If you stem at index time but not at query time, a search for "running" will never hit a document indexed under "run".',
      },
      {
        type: "text",
        heading: "Ranking: TF-IDF and BM25",
        content:
          "Once matching documents are found, they must be ordered by relevance. **TF-IDF** scores a document by term frequency (how often the term appears) times inverse document frequency (how rare the term is corpus-wide) — a rare term is more informative than a common one.\n\n**BM25** is the modern default, refining TF-IDF with two corrections: term-frequency saturation, so a document repeating a word 50 times does not score 50x higher, and document-length normalization, so long documents do not win by sheer size. Elasticsearch, OpenSearch, and PostgreSQL's ts_rank all lean on BM25-style scoring.",
      },
      {
        type: "code",
        heading: "PostgreSQL Full-Text Search",
        language: "sql",
        label: "postgres-fts.sql",
        code: `-- Add a generated tsvector column and index it with GIN
ALTER TABLE articles
  ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body,  '')), 'B')
  ) STORED;

CREATE INDEX articles_search_idx ON articles USING GIN (search_vector);

-- Ranked search: websearch_to_tsquery understands quoted phrases and OR
SELECT id, title,
       ts_rank_cd(search_vector, query) AS rank
FROM articles,
     websearch_to_tsquery('english', 'data modeling -legacy') AS query
WHERE search_vector @@ query
ORDER BY rank DESC
LIMIT 20;`,
      },
      {
        type: "text",
        heading: "Elasticsearch and OpenSearch Architecture",
        content:
          "Elasticsearch indexes each document into a **shard** using an inverted index built on **Lucene segments**. A shard is the unit of distribution — itself effectively a small Lucene index — and a cluster spreads shards across nodes with replicas for failover. A search request fans out to every shard, each returns its top matches, and a coordinating node merges the ranked lists.\n\nDocuments are near-real-time: a write is buffered, then committed to a Lucene segment and made searchable on the next **refresh** (default one second). The segment-based design is an LSM-like structure — segments are immutable and merged in the background, exactly like SSTables.",
      },
      {
        type: "code",
        heading: "An Elasticsearch Mapping and Query",
        language: "json",
        label: "elasticsearch.json",
        code: `PUT /articles
{
  "settings": { "number_of_shards": 3, "number_of_replicas": 1 },
  "mappings": {
    "properties": {
      "title":  { "type": "text", "analyzer": "english" },
      "body":   { "type": "text", "analyzer": "english" },
      "author": { "type": "keyword" },
      "published_at": { "type": "date" }
    }
  }
}

GET /articles/_search
{
  "query": {
    "bool": {
      "must":     { "multi_match": { "query": "data model", "fields": ["title^3", "body"] } },
      "filter":   { "range": { "published_at": { "gte": "2026-01-01" } } },
      "must_not": { "term": { "author": "spam-bot" } }
    }
  }
}`,
      },
      {
        type: "text",
        heading: "Fuzzy Matching and Typo Tolerance",
        content:
          'Users mistype. **Fuzzy matching** finds terms within an edit distance of the query — an edit distance of 1 catches a single insertion, deletion, or substitution, so "modling" still matches "modeling". Elasticsearch implements this with a Levenshtein automaton over the term dictionary.\n\nEdit distance is powerful but expensive and returns noise, so bound it: edit distance greater than 2 is rarely worth the cost, and enabling fuzziness on every field multiplies the work. **Prefix matching** and **completion suggesters** are cheaper alternatives for autocomplete, and **n-gram** indexing trades index size for substring support.',
      },
      {
        type: "comparison",
        heading: "PostgreSQL FTS vs Elasticsearch",
        headers: ["PostgreSQL FTS", "Elasticsearch"],
        rows: [
          {
            aspect: "Operational cost",
            "PostgreSQL FTS": "None — it is already there",
            Elasticsearch: "A separate cluster to run and scale",
          },
          {
            aspect: "Consistency",
            "PostgreSQL FTS": "Transactional, always current",
            Elasticsearch: "Near-real-time, refresh lag",
          },
          {
            aspect: "Ranking",
            "PostgreSQL FTS": "ts_rank/ts_rank_cd, coarser",
            Elasticsearch: "BM25 plus boosting, articulately tunable",
          },
          {
            aspect: "Analyzers",
            "PostgreSQL FTS": "Dictionaries and stemming configs",
            Elasticsearch: "Rich pipelines, per-field analyzers",
          },
          {
            aspect: "Scale",
            "PostgreSQL FTS": "Single node, one database",
            Elasticsearch: "Sharded and replicated across a cluster",
          },
          {
            aspect: "Best for",
            "PostgreSQL FTS": "Moderate corpora that must stay consistent",
            Elasticsearch:
              "Large corpora needing relevance tuning and suggesters",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Two-Way Sync Is the Hard Part",
        content:
          "Running a search engine alongside your primary database means keeping the index in sync. CDC via the write-ahead log, a transactional outbox, or a message queue feeds changes to the indexer. Whatever the mechanism, expect eventual consistency and make the indexer idempotent, because reorders and retries will happen. Design the read path so a brief indexing lag does not surface as a missing result the user just created.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "LIKE with a leading wildcard cannot use an index and forces a full scan",
          "An inverted index maps each term to the documents containing it for fast lookup",
          "Analyzer pipelines tokenize, normalize, stem, and remove stop words — and must match at index and query time",
          "BM25 is the standard relevance score, refining TF-IDF with saturation and length normalization",
          "PostgreSQL tsvector with a GIN index gives transactional full-text search with no extra infrastructure",
          "Elasticsearch/OpenSearch shard Lucene segments across a cluster for scale and tunable ranking",
          "Fuzzy matching tolerates typos but is expensive — bound the edit distance and scope the fields",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why does a query using LIKE '%term%' perform a full table scan?",
        options: [
          "LIKE is not a valid SQL operator",
          "A leading wildcard gives no fixed prefix, so a B-tree index cannot narrow the search",
          "It is always faster than an index",
          "The database stores text in reverse",
        ],
        correctIndex: 1,
        explanation:
          "A B-tree index can only be used when a fixed prefix is known. With a leading %, the match could start anywhere in the string, so the engine must examine every row — which is why full-text search uses an inverted index instead.",
      },
      {
        question:
          "What happens if the index-time analyzer and query-time analyzer differ?",
        options: [
          "Nothing — analyzers are independent",
          "Stemmed query terms may never match indexed roots, producing missed results",
          "The index is automatically rebuilt",
          "Ranking becomes exact",
        ],
        correctIndex: 1,
        explanation:
          "Posting lists store the analyzed forms produced at index time. If a query is analyzed differently — for example stemming only on one side — the terms will not line up, and matching documents are silently dropped.",
      },
      {
        question: "What advantage does BM25 have over raw TF-IDF?",
        options: [
          "It never needs an inverted index",
          "It saturates term frequency and normalizes by document length, so repetition and length do not dominate the score",
          "It ignores rare terms entirely",
          "It only works in Elasticsearch",
        ],
        correctIndex: 1,
        explanation:
          "BM25 keeps the TF-IDF idea but adds term-frequency saturation and document-length normalization, so a document repeating a word many times, or simply being long, does not automatically outrank a genuinely more relevant one.",
      },
      {
        question:
          "Which PostgreSQL feature makes full-text search fast without scanning rows?",
        options: [
          "A btree index on the text column",
          "A GIN index over a tsvector column",
          "A hash index on the body column",
          "A full table vacuum",
        ],
        correctIndex: 1,
        explanation:
          "Full-text search matches a tsvector against a tsquery, and a GIN index over the tsvector gives fast lookups of terms to documents. GIN is designed for the many-keys-per-row shape of an inverted index.",
      },
    ],
  },

  // ─── OBJECT STORAGE ─────────────────────────────────────────────────────

  "object-storage": {
    slug: "object-storage",
    title: "Object Storage",
    tagline: "S3 semantics for files at any scale",
    sections: [
      {
        type: "text",
        heading: "The S3 Model",
        content:
          "Object storage replaces the file-system hierarchy of folders with a flat namespace. Data lives as **objects** inside **buckets**. An object is a blob of bytes plus metadata, addressed by a key — a string like avatars/42/headshot.png. There are no directories; the slashes in keys are just characters, and prefixes are a naming convention the console renders as folders.\n\nThis model removes the constraints that break traditional file servers at scale: no inodes per directory, no single metadata server, no mount point that runs out of space. You address billions of objects by key, and the storage layer distributes them across many machines.",
      },
      {
        type: "analogy",
        heading: "A Valet Coat Check",
        content:
          "At a coat check you hand over a coat and get a ticket with a number. Later you present the ticket and the same coat comes back. You do not know or care which rack it sits on — you only need the ticket.\n\nObject storage works exactly this way. The key is the ticket. The service stores the bytes wherever it likes and returns them when you present the key. You cannot walk behind the counter and rearrange the racks, and you do not need to.",
      },
      {
        type: "text",
        heading: "Buckets, Keys, and Prefixes",
        content:
          "Buckets are globally unique top-level containers with their own configuration: region, encryption, versioning, lifecycle rules, and access policies. Keys are arbitrary up to about 1 KB and must be unique within a bucket. Overwriting a key replaces the object.\n\nChoose key prefixes to spread load. Because listings and many workloads group by prefix, a poorly chosen prefix — such as a date — can concentrate requests on one partition. Randomise a component of the key (a hash or UUID) when you expect high write throughput, and keep the human-readable portion for discoverability.",
      },
      {
        type: "text",
        heading: "Consistency: Strong, Now",
        content:
          'S3 historically offered read-after-write consistency for new objects and eventual consistency for overwrites and listings, causing the infamous "list shows a deleted object" bug. Since December 2020, S3 provides **strong read-after-write consistency** for all operations — a PUT is immediately visible to subsequent GET and LIST calls.\n\nThat said, strong consistency applies to the object store itself. A CDN in front of it still caches aggressively, so an update may not reach edge locations until the cache entry expires or is invalidated. And a multi-region replication policy is asynchronous by nature — the replica, not the source, is eventually consistent.',
      },
      {
        type: "code",
        heading: "Presigned URLs: Upload Without Proxy",
        language: "typescript",
        label: "presign.ts",
        code: `import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: 'eu-west-1' });

// Let the browser upload directly to S3 — the API server never buffers the file
export async function createUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: 'app-uploads',
    Key: key,
    ContentType: contentType,
  });

  // URL is valid for 15 minutes and is bound to this exact key and content type
  return getSignedUrl(s3, command, { expiresIn: 900 });
}

// Signed download for a private object, expiring quickly
export async function createDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: 'app-uploads', Key: key });
  return getSignedUrl(s3, command, { expiresIn: 300 });
}`,
      },
      {
        type: "text",
        heading: "Presigned URLs Keep Credentials Off the Client",
        content:
          "Uploading a multi-gigabyte file through your API wastes bandwidth, holds connections open, and forces your servers to buffer bytes they never inspect. The standard pattern is a **presigned URL**: the client asks your API for a URL, the API signs a specific operation with its own credentials, and the client uploads straight to the bucket.\n\nThe signature authorises one method, one key, and one expiry. The secret never leaves the server, the URL cannot be reused for a different object, and it self-destructs after the expiry window. For downloads of private objects, sign a short-lived GET instead of making the bucket public.",
      },
      {
        type: "text",
        heading: "Multipart Upload for Large Objects",
        content:
          "A single PUT can fail part-way through a 10 GB upload and leave you to start over. **Multipart upload** splits an object into parts, uploads them independently and in parallel, and lets you retry only the failed parts. S3 assembles the parts when the upload completes.\n\nEach part must be at least 5 MB except the last, and you should use multipart for anything above roughly 100 MB. Track the upload ID so an interrupted upload can be resumed, and configure a lifecycle rule to abort incomplete multipart uploads after a few days — otherwise the orphaned parts accumulate and quietly bill you.",
      },
      {
        type: "code",
        heading: "Everyday S3 Operations with the CLI",
        language: "bash",
        label: "s3-cli.sh",
        code: `# Sync a local directory to a bucket (only changed files transfer)
aws s3 sync ./dist s3://app-static/ --delete

# Upload a large file with tunable concurrency and part size
aws s3 cp dataset.parquet s3://data-lake/raw/ \\
  --expected-size 5368709120 \\
  --cli-write-timeout 0

# Make an object public only via a bucket policy — never per-object ACLs
aws s3api put-bucket-policy --bucket app-static --policy file://policy.json

# Abort multipart uploads older than 7 days (usually a lifecycle rule, shown here manually)
aws s3api list-multipart-uploads --bucket app-uploads`,
      },
      {
        type: "text",
        heading: "Versioning and Lifecycle Policies",
        content:
          "**Versioning** keeps every prior version of an object. A delete inserts a delete marker rather than removing data, so an accidental overwrite is recoverable. The cost is storage: old versions pile up until you expire them.\n\n**Lifecycle policies** automate the object's journey. A typical rule transitions objects to cheaper storage after 30 days, to archive after 90, and expires them entirely after 365. You can also expire non-current versions and abort incomplete multipart uploads. Lifecycle rules are the primary cost-control lever in object storage — data that nobody configured to expire stays on the most expensive tier forever.",
      },
      {
        type: "comparison",
        heading: "Storage Classes",
        headers: ["Hot (Standard)", "Archive (Glacier Deep)"],
        rows: [
          {
            aspect: "Access latency",
            "Hot (Standard)": "Milliseconds",
            "Archive (Glacier Deep)": "Minutes to 12 hours",
          },
          {
            aspect: "Retrieval fee",
            "Hot (Standard)": "None",
            "Archive (Glacier Deep)": "Charged per GB retrieved",
          },
          {
            aspect: "Durability",
            "Hot (Standard)": "Eleven nines",
            "Archive (Glacier Deep)": "Eleven nines",
          },
          {
            aspect: "Cost per GB",
            "Hot (Standard)": "Highest",
            "Archive (Glacier Deep)": "Roughly 20x lower",
          },
          {
            aspect: "Minimum storage",
            "Hot (Standard)": "None",
            "Archive (Glacier Deep)": "180 days billed",
          },
          {
            aspect: "Fit",
            "Hot (Standard)": "Serving users, active data",
            "Archive (Glacier Deep)": "Compliance and cold retention",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "Put a CDN in Front",
        content:
          "Object storage is durable and cheap but geographically distant from users. A CDN caches objects at edge locations near the audience, cutting latency and origin egress bills. Point the CDN at the bucket as origin (using an origin access identity so the bucket stays private), set long cache lifetimes on content-addressed or fingerprinted assets, and invalidate explicitly when a mutable object changes. For user uploads, serve through signed CDN URLs so private content stays access-controlled at the edge.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Object storage is a flat namespace of keyed blobs inside buckets — there are no real directories",
          "S3 is now strongly read-after-write consistent, but CDNs and cross-region replicas remain eventually consistent",
          "Presigned URLs let clients upload and download directly, keeping credentials on the server",
          "Use multipart upload above roughly 100 MB to parallelise and retry individual parts",
          "Versioning protects against overwrites; lifecycle rules expire old versions and abort orphaned uploads",
          "Cheaper storage classes trade retrieval latency and fees for much lower per-GB cost",
          "Front buckets with a CDN and keep the bucket private via an origin access identity",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why use a presigned URL instead of streaming an upload through your API server?",
        options: [
          "Presigned URLs are unauthenticated",
          "The client uploads directly to the bucket, saving server bandwidth and memory, while the signature scopes the operation",
          "It makes the bucket public",
          "It disables versioning",
        ],
        correctIndex: 1,
        explanation:
          "The API signs one operation with its own credentials and returns a URL bound to that method, key, and expiry. The client uploads straight to the object store, so the server never buffers the bytes and the secret never reaches the client.",
      },
      {
        question:
          "What is the minimum part size for a multipart upload (except the final part), and when should you use multipart?",
        options: [
          "1 KB, for tiny files",
          "5 MB, for objects above roughly 100 MB",
          "1 GB, always",
          "There is no minimum",
        ],
        correctIndex: 1,
        explanation:
          "S3 requires parts of at least 5 MB except the last, and multipart upload is worthwhile above roughly 100 MB because it parallelises transfer and lets you retry only the failed parts.",
      },
      {
        question: "How does enabling versioning change a DELETE of an object?",
        options: [
          "It permanently removes all versions",
          "It inserts a delete marker, so the object appears deleted but prior versions remain recoverable",
          "It rejects the delete",
          "It copies the object to another bucket",
        ],
        correctIndex: 1,
        explanation:
          "With versioning on, a delete adds a delete marker rather than removing data. The object no longer appears in normal reads, but the previous versions survive and can be restored until a lifecycle rule expires them.",
      },
      {
        question:
          "A workload writes millions of objects per hour under keys beginning with a single date prefix. What should you change?",
        options: [
          "Turn off versioning",
          "Randomise part of the key prefix so requests spread across partitions",
          "Move to archive storage",
          "Use multipart upload",
        ],
        correctIndex: 1,
        explanation:
          "Prefixes that concentrate writes can hot-spot a partition and throttle throughput. Adding a randomised component such as a hash to the prefix spreads requests, while keeping a readable portion for discoverability.",
      },
    ],
  },

  // ─── ANALYTICS ──────────────────────────────────────────────────────────

  "olap-analytics": {
    slug: "olap-analytics",
    title: "OLAP & Analytical Databases",
    tagline: "Columnar storage, star schemas, and batch ELT",
    sections: [
      {
        type: "text",
        heading: "OLTP and OLAP Ask Different Questions",
        content:
          "An **OLTP** database serves transactions: fetch one order, insert one payment, update one row. It is optimised for many small, concurrent reads and writes, and it stores data row by row so a single record can be found and modified quickly.\n\nAn **OLAP** system answers analytical questions: total revenue by region by month, funnel conversion, cohort retention. These queries scan enormous ranges and aggregate, but read only a few of the many columns. Row storage makes them read far more data than they need, which is why analytical databases are columnar.",
      },
      {
        type: "analogy",
        heading: "Reading a Whole Shelf vs One Column",
        content:
          "Imagine 40 binders, each holding all of a customer's records for one year. To compute the average order value you must open all 40 binders and read one number from each — most of what you carry back is irrelevant.\n\nNow imagine 40 binders where each binder holds one field for everyone — all the totals in one, all the dates in another. You need only two binders, and because every entry is the same kind of value they compress tightly. That is the columnar layout, and it is why analytics engines are so fast at aggregation.",
      },
      {
        type: "text",
        heading: "Columnar Storage and Compression",
        content:
          "A column store keeps the values of one column contiguous. A query touching two columns reads two segments and ignores the rest, often speeding up a scan by an order of magnitude on wide tables. Because a column holds values of one type with low cardinality, it compresses well: **dictionary encoding** stores distinct values once with integer references, **run-length encoding** collapses long repeats, and **delta encoding** stores differences for sorted or monotonic data.\n\nEngines also keep **zone maps** or segment metadata with min/max per block, so a filtered query can skip entire segments without decompressing them at all. Together, columnar layout plus compression plus zone maps is why a warehouse can scan a terabyte in seconds.",
      },
      {
        type: "code",
        heading: "The Same Query, Two Layouts",
        language: "sql",
        label: "row-vs-column.sql",
        code: `-- Wide table: 200 columns, 500 million rows, revenue_cents is column 137.

SELECT region, date_trunc('month', order_date) AS month,
       sum(revenue_cents) AS revenue
FROM orders
WHERE order_date >= DATE '2026-01-01'
  AND status = 'completed'
GROUP BY region, month
ORDER BY month, region;

-- Row store  : reads all 200 columns for every matching row -> huge I/O.
-- Column store: reads order_date, status, region, revenue_cents only.
-- Zone maps    : the date and status filters skip most segments entirely.
-- The aggregate then runs vectorised over tightly packed integer values.`,
      },
      {
        type: "text",
        heading: "Star and Snowflake Schemas",
        content:
          "Analytical schemas are built around a **fact table** — the events or transactions, long and narrow — surrounded by **dimension tables** — the descriptive context such as date, customer, and product.\n\nIn a **star schema** each dimension is denormalized into a single flat table, so a query joins the fact to a few wide dimensions. In a **snowflake schema** dimensions are further normalized into nested tables — a product dimension points at a category dimension which points at a department dimension. Snowflake normalisation saves space and enforces consistency, but every extra join costs query time, and most modern warehouses favour the star for its simplicity.",
      },
      {
        type: "comparison",
        heading: "Star vs Snowflake Schema",
        headers: ["Star Schema", "Snowflake Schema"],
        rows: [
          {
            aspect: "Dimension shape",
            "Star Schema": "One flat table per dimension",
            "Snowflake Schema": "Dimensions normalised into sub-tables",
          },
          {
            aspect: "Joins per query",
            "Star Schema": "Few",
            "Snowflake Schema": "More, one per normalised level",
          },
          {
            aspect: "Query performance",
            "Star Schema": "Faster, fewer joins",
            "Snowflake Schema": "Slower, more joins",
          },
          {
            aspect: "Storage",
            "Star Schema": "More redundant",
            "Snowflake Schema": "Less redundant",
          },
          {
            aspect: "Maintenance",
            "Star Schema": "Simpler to reason about",
            "Snowflake Schema": "Schema changes ripple through the hierarchy",
          },
          {
            aspect: "Fit",
            "Star Schema": "Most warehouses and BI tools",
            "Snowflake Schema": "Strictly governed, highly shared dimensions",
          },
        ],
      },
      {
        type: "text",
        heading: "OLAP Cubes and Pre-Aggregation",
        content:
          "Even on a fast column store, recomputing the same aggregate across billions of rows for every dashboard refresh is wasteful. **Pre-aggregation** answers this: compute the aggregate once, store it, and read it back. A classic **OLAP cube** stores measures (revenue) along dimensions (product, region, time), often with a **materialized view** that the engine keeps current.\n\nThe tradeoff is freshness and flexibility. A materialized view must be refreshed, introducing staleness, and a cube only answers the dimension combinations it was built for. Modern engines offer a middle path: query rewriting picks a matching materialized view automatically when one exists, so the analyst writes the raw query and the engine decides.",
      },
      {
        type: "code",
        heading: "Materialized View in a Warehouse",
        language: "sql",
        label: "materialized-view.sql",
        code: `-- ClickHouse: an incremental materialized view keeps a summary table current
CREATE TABLE revenue_by_day (
  day       Date,
  region    LowCardinality(String),
  revenue   AggregateFunction(sum, Int64)
) ENGINE = AggregatingMergeTree()
ORDER BY (day, region);

CREATE MATERIALIZED VIEW revenue_by_day_mv TO revenue_by_day AS
SELECT
  toDate(order_date) AS day,
  region,
  sumState(revenue_cents) AS revenue
FROM orders
WHERE status = 'completed'
GROUP BY day, region;

-- The dashboard reads the small summary instead of scanning raw orders
SELECT day, region, sumMerge(revenue) AS revenue
FROM revenue_by_day
WHERE day >= today() - 30
GROUP BY day, region;`,
      },
      {
        type: "text",
        heading: "Choosing an Engine: ClickHouse, DuckDB, BigQuery",
        content:
          "**ClickHouse** is an open-source, columnar, massively parallel engine built for sub-second aggregation over billions of rows; it favours wide denormalized tables and AggregatingMergeTree summaries. **DuckDB** is an in-process analytical database — like SQLite for analytics — that runs embedded in a process and crunches gigabytes from a Parquet file without a server. **BigQuery**, **Snowflake**, and **Redshift** are managed cloud warehouses that separate storage from compute and scale elastically.\n\nThe pragmatic rule: DuckDB for local exploration and small datasets, ClickHouse for high-throughput self-hosted analytics, and a managed warehouse when you want an elastic, fully-operated platform.",
      },
      {
        type: "text",
        heading: "Batch ELT: Extract, Load, Transform",
        content:
          "Classical ETL transformed data before loading it into the warehouse. Modern pipelines flip the order: **ELT** loads raw data into cheap warehouse storage first, then transforms it in place with SQL. Because warehouses store and scan data cheaply, keeping the raw immutable copy is an asset — you can reprocess history when a transformation bug is found.\n\nA typical stack extracts into a **data lake** (Parquet files in object storage), loads into the warehouse, and transforms with a scheduler such as Airflow or dbt. Pipeline runs are usually incremental, processing only new partitions, and every run should be idempotent so a retry cannot double-load a day.",
      },
      {
        type: "steps",
        heading: "Anatomy of a Batch ELT Pipeline",
        steps: [
          {
            title: "Extract",
            detail:
              "Pull changes or daily partitions from source systems into object storage as Parquet.",
          },
          {
            title: "Load",
            detail:
              "Copy raw files into the warehouse, append-only and partitioned by ingestion date.",
          },
          {
            title: "Stage",
            detail:
              "Build typed staging models that clean and cast the raw data without business logic.",
          },
          {
            title: "Model",
            detail:
              "Compose staging models into fact and dimension tables in a star schema.",
          },
          {
            title: "Schedule",
            detail:
              "Run on a dependency-aware scheduler with incremental, idempotent steps.",
          },
          {
            title: "Test and monitor",
            detail:
              "Assert row counts, uniqueness, and freshness; alert on anomalies before dashboards mislead.",
          },
        ],
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "OLTP optimises for small transactional reads and writes; OLAP optimises for large scans and aggregates",
          "Columnar storage reads only the needed columns and compresses tightly with dictionary and run-length encoding",
          "Zone maps let engines skip whole segments that cannot match a filter",
          "Star schemas favour fewer joins; snowflake schemas trade query speed for less redundancy",
          "Materialized views and cubes pre-aggregate expensive queries at the cost of freshness",
          "DuckDB, ClickHouse, and managed warehouses cover local, self-hosted, and elastic needs",
          "ELT loads raw data first and transforms in place, so history can be reprocessed",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why is a columnar layout much faster for an analytical aggregate over a wide table?",
        options: [
          "It stores rows in reverse order",
          "It reads only the columns the query needs and compresses each column tightly",
          "It skips the WHERE clause",
          "It always runs in memory",
        ],
        correctIndex: 1,
        explanation:
          "A row store reads every column for each matching row, discarding most of it. A column store reads only the referenced columns, which are contiguous and highly compressible, and zone maps skip segments that cannot match the filter.",
      },
      {
        question:
          "What is the main tradeoff of using a materialized view for a dashboard?",
        options: [
          "It cannot store numbers",
          "It must be refreshed, so results can be stale and it only answers the pre-aggregated shapes",
          "It disables the WHERE clause",
          "It forces a snowflake schema",
        ],
        correctIndex: 1,
        explanation:
          "Materialized views trade freshness and flexibility for speed. The stored aggregate must be refreshed, introducing staleness, and it can only answer the dimension and measure combinations it was built for.",
      },
      {
        question: "How does ELT differ from classic ETL?",
        options: [
          "ELT transforms before loading, ETL after",
          "ELT loads raw data first and transforms it in place inside the warehouse",
          "ELT never uses SQL",
          "ELT does not use object storage",
        ],
        correctIndex: 1,
        explanation:
          "ELT reverses the classic order: extract to object storage, load raw into the warehouse, then transform with SQL. Keeping the immutable raw copy lets you reprocess history when a transformation bug is discovered.",
      },
      {
        question: "In a star schema, what is the fact table?",
        options: [
          "A flat descriptive lookup table",
          "The long, narrow table of events or transactions surrounded by dimension tables",
          "A table of unique product categories",
          "Another name for a materialized view",
        ],
        correctIndex: 1,
        explanation:
          "The fact table holds the measurable events or transactions and foreign keys to the dimension tables that provide descriptive context. Dimensions are the descriptive lookups; the fact table is the long, narrow core.",
      },
    ],
  },

  // ─── TIME SERIES ────────────────────────────────────────────────────────

  "time-series": {
    slug: "time-series",
    title: "Time-Series Databases",
    tagline: "Metrics, retention, and downsampling at scale",
    sections: [
      {
        type: "text",
        heading: "What Makes Time-Series Data Special",
        content:
          'Time-series data is a stream of timestamped measurements: CPU usage every 10 seconds, a temperature reading, a request count per minute. It has three properties that a general-purpose database handles poorly.\n\nIt is **append-only and time-ordered** — new points arrive at the end, old points are almost never updated. It is **high-volume** — millions of points per minute from thousands of sources. And queries are almost always **range plus aggregate** — "average latency over the last hour, grouped by host". A dedicated time-series database exploits all three: partitioning by time, aggressive compression, and built-in downsampling.',
      },
      {
        type: "analogy",
        heading: "A Weather Diary",
        content:
          "A weather station writes one line per hour: a date and a temperature. Nobody edits yesterday's line; the diary only ever grows at the end. When you want a yearly summary you do not reread every hour — you average each day, then each month, then the year.\n\nA time-series database is that diary with machinery. Points append in time order, old points are cheap to keep because similar values compress together, and the daily and monthly averages are computed once and stored as rollups rather than recomputed on every query.",
      },
      {
        type: "text",
        heading: "Retention and Downsampling",
        content:
          "You rarely need raw per-second resolution forever. A common policy keeps raw points for days or weeks, then **downsamples** to minute, then hour, then day averages for older data, and finally **expires** data past a retention horizon.\n\nDownsampling is not just storage savings — it is query speed. A one-year chart grouped by day reads 365 rolled-up points instead of 31 million raw ones. Retention policies automate the process: keep high resolution hot, roll it up as it ages, and delete it once its legal or operational value has passed.",
      },
      {
        type: "code",
        heading: "TimescaleDB Hypertables",
        language: "sql",
        label: "hypertables.sql",
        code: `-- A hypertable is a normal PostgreSQL table auto-partitioned by time
CREATE TABLE metrics (
  time        TIMESTAMPTZ NOT NULL,
  device_id   BIGINT NOT NULL,
  metric      TEXT NOT NULL,
  value       DOUBLE PRECISION NOT NULL
);

SELECT create_hypertable('metrics', 'time', chunk_time_interval => INTERVAL '1 day');

-- Space partitioning spreads a wide device set across chunks
SELECT add_dimension('metrics', 'device_id', number_partitions => 8);

CREATE INDEX metrics_device_time_idx ON metrics (device_id, time DESC);

-- Compression: older chunks are columnar-compressed automatically
ALTER TABLE metrics SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'device_id, metric',
  timescaledb.compress_orderby   = 'time DESC'
);
SELECT add_compression_policy('metrics', INTERVAL '7 days');`,
      },
      {
        type: "text",
        heading: "Continuous Aggregates",
        content:
          "A **continuous aggregate** is a materialized view over time buckets that refreshes incrementally as new data arrives. Instead of recomputing the whole history, it only aggregates the new or changed buckets, so a dashboard on hourly averages stays current with near-zero cost.\n\nTimescaleDB implements continuous aggregates on top of hypertables; Prometheus has **recording rules** that precompute expressions; InfluxDB has **continuous queries** and **tasks**. The pattern is identical everywhere: define the bucket interval and aggregate, let the engine maintain it, and read the small rollup table for charts.",
      },
      {
        type: "code",
        heading: "An Hourly Continuous Aggregate",
        language: "sql",
        label: "continuous-aggregate.sql",
        code: `CREATE MATERIALIZED VIEW metrics_hourly
WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  device_id,
  metric,
  avg(value)  AS avg_value,
  max(value)  AS max_value,
  count(*)    AS samples
FROM metrics
GROUP BY bucket, device_id, metric;

-- Refresh the last few hours every 30 minutes, leaving older buckets frozen
SELECT add_continuous_aggregate_policy('metrics_hourly',
  start_offset => INTERVAL '3 hours',
  end_offset   => INTERVAL '30 minutes',
  schedule_interval => INTERVAL '30 minutes'
);`,
      },
      {
        type: "text",
        heading: "Cardinality: The Real Limit",
        content:
          "The number of unique series — each combination of metric name and label values — is the **cardinality**, and it is what actually breaks time-series systems. A metric with a user_id label and a million users is a million series; Prometheus keeps an in-memory index per series and will exhaust memory long before it runs out of disk.\n\nHigh cardinality is often a design mistake: an unbounded label such as a request id or a timestamp belongs in a log or trace, not a metric label. Bound the label values (region, status code, endpoint template), never the raw inputs. Elasticsearch and ClickHouse can absorb high cardinality by trading query speed, but Prometheus and many TSDBs cannot.",
      },
      {
        type: "text",
        heading: "Compression and Encoding",
        content:
          "Time-series points are extremely compressible because consecutive timestamps differ by a small constant and values drift slowly. **Delta-of-delta** encoding stores the change in the interval between samples, collapsing a regular 10-second cadence to near zero bits. **Gorilla-style XOR** compression XORs a value with its predecessor and stores only the differing bits.\n\nCombined, these techniques routinely achieve 10x to 100x compression versus raw storage. Fields are also stored columnar, and because retention drops old partitions wholesale, deletion is an O(1) directory operation rather than a row-by-row delete.",
      },
      {
        type: "comparison",
        heading: "Prometheus vs InfluxDB vs TimescaleDB",
        headers: ["Prometheus", "TimescaleDB"],
        rows: [
          {
            aspect: "Model",
            Prometheus: "Pull-based metrics with labels",
            TimescaleDB: "Full PostgreSQL with time partitioning",
          },
          {
            aspect: "Query language",
            Prometheus: "PromQL",
            TimescaleDB: "SQL plus time functions",
          },
          {
            aspect: "Cardinality tolerance",
            Prometheus: "Low; in-memory per-series cost",
            TimescaleDB: "High; backed by PostgreSQL",
          },
          {
            aspect: "Storage engine",
            Prometheus: "Custom TSDB blocks",
            TimescaleDB: "PostgreSQL B-tree and columnar compression",
          },
          {
            aspect: "Best for",
            Prometheus: "Monitoring and alerting of infrastructure metrics",
            TimescaleDB: "Metrics needing SQL, joins, and long retention",
          },
          {
            aspect: "Relational joins",
            Prometheus: "None",
            TimescaleDB: "Full, against regular tables",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "info",
        heading: "Rollups Are the Answer to Dashboards",
        content:
          "A live dashboard that re-scans raw resolution across a wide time range will get slower as your data grows, no matter how fast the engine is. Insert a rollup layer: continuous aggregates or recording rules that precompute the per-minute, per-hour, and per-day summaries. Have the dashboard choose the finest rollup that satisfies its time range, and keep raw data only as long as alerts and investigations need it. This is the single highest-leverage change for a time-series workload.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Time-series data is append-only, time-ordered, high-volume, and queried as range plus aggregate",
          "Partition by time so retention drops whole chunks and queries prune to the relevant range",
          "Downsample as data ages and expire it past the retention horizon",
          "Continuous aggregates and recording rules precompute rollups incrementally",
          "Cardinality, not volume, is the usual limit — keep metric labels bounded",
          "Delta-of-delta and XOR encoding compress regular time-series points by 10x to 100x",
          "Choose Prometheus for low-cardinality monitoring and TimescaleDB when you need SQL and joins",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Why is high cardinality more dangerous than high volume in a time-series database?",
        options: [
          "It compresses poorly but is otherwise free",
          "Each unique label combination becomes a tracked series with per-series overhead, exhausting memory long before disk",
          "It disables queries",
          "It only affects retention",
        ],
        correctIndex: 1,
        explanation:
          "The number of active series drives memory resident index and metadata costs. A label like user_id with millions of values explodes the series count, so Prometheus and similar systems run out of memory well before they run out of storage.",
      },
      {
        question: "What does a continuous aggregate do?",
        options: [
          "Deletes old data permanently",
          "Incrementally maintains a materialized rollup over time buckets as new data arrives",
          "Sends alerts",
          "Compresses the raw table on disk",
        ],
        correctIndex: 1,
        explanation:
          "A continuous aggregate keeps a bucketed aggregation fresh by only processing new or changed buckets, so dashboards read a small summary table instead of rescanning raw data. Prometheus recording rules serve the same purpose.",
      },
      {
        question:
          "Which encoding best exploits a metric sampled at a perfectly regular interval?",
        options: [
          "Dictionary encoding",
          "Delta-of-delta encoding of timestamps",
          "Random shuffling",
          "Base64 encoding",
        ],
        correctIndex: 1,
        explanation:
          "When the interval between samples is constant, the change in the interval (delta-of-delta) is zero, which compresses timestamps to almost no space. Gorilla-style XOR handles the value side by storing only differing bits.",
      },
      {
        question:
          "Why does partitioning a time-series table by time make queries and retention cheaper?",
        options: [
          "It duplicates the data",
          "The engine prunes to the relevant time chunks and can drop old chunks wholesale at retention",
          "It converts timestamps to UTC",
          "It eliminates the need for indexes",
        ],
        correctIndex: 1,
        explanation:
          "Time partitioning lets the planner read only the chunks overlapping the query range, and retention becomes an O(1) removal of whole partitions rather than a row-by-row delete across a huge table.",
      },
    ],
  },

  // ─── DATA INTEGRATION ───────────────────────────────────────────────────

  "change-data-capture": {
    slug: "change-data-capture",
    title: "Change Data Capture",
    tagline: "Streaming database changes to downstream systems",
    sections: [
      {
        type: "text",
        heading: "Why CDC Exists",
        content:
          "Most systems have one source of truth — the transactional database — and many consumers that need to react to it: a search index, a cache, an analytics warehouse, another service. Polling the database for what changed is slow, load-heavy, and misses deletes unless you add a change timestamp and a soft-delete convention.\n\n**Change Data Capture (CDC)** reads the database's own change log — the write-ahead log in PostgreSQL, the binlog in MySQL — and turns every insert, update, and delete into an ordered event stream. Consumers subscribe to that stream instead of polling, and the database becomes an event producer without any application changes.",
      },
      {
        type: "analogy",
        heading: "Reading the Till Roll",
        content:
          "A shopkeeper who wants to know what sold today could stop and count the shelves every hour — slow, disruptive, and easy to miss a sale. Or he could simply read the till roll, the continuous tape the register already prints for every transaction.\n\nThe till roll is the database write-ahead log. It records every change in order, as the system already writes it for its own crash recovery. CDC reads that tape rather than re-examining the shelves, so it captures every change exactly, in order, and for free.",
      },
      {
        type: "text",
        heading: "Log-Based CDC and Logical Replication",
        content:
          "The physical write-ahead log is internal to the engine and not portable, so CDC reads it through a **logical decoding** interface. PostgreSQL exposes this via logical replication slots with the **wal2json** or **pgoutput** plugins; MySQL exposes the **row-based binlog** through its replication protocol.\n\nA replication slot or reader position marks how far the consumer has progressed. The engine retains log segments the consumer has not yet read, so a slow consumer applies backpressure rather than losing events — but if it stalls long enough, log retention exhausts disk, so slot lag must be monitored.",
      },
      {
        type: "code",
        heading: "A Debezium PostgreSQL Connector",
        language: "yaml",
        label: "debezium-postgres.yaml",
        code: `# Deploy on Kafka Connect; Debezium streams WAL changes into Kafka topics
name: orders-connector
config:
  connector.class: io.debezium.connector.postgresql.PostgresConnector
  database.hostname: orders-db.internal
  database.port: 5432
  database.user: debezium
  database.dbname: orders
  # Logical replication slot name created automatically
  slot.name: debezium_orders
  plugin.name: pgoutput
  publication.autocreate.mode: filtered
  table.include.list: public.orders,public.order_items
  # Emit change events with the before and after image of each row
  tombstones.on.delete: 'true'
  topic.prefix: orders
  transforms: unwrap
  transforms.unwrap.type: io.debezium.transforms.ExtractNewRecordState
  key.converter: org.apache.kafka.connect.json.JsonConverter
  value.converter: org.apache.kafka.connect.json.JsonConverter`,
      },
      {
        type: "text",
        heading: "The Outbox Pattern vs Raw CDC",
        content:
          "Raw CDC captures every change to the tables it watches, including internal ones, and its event shape is tied to the table schema. When a service needs to publish a **business event** — OrderPlaced, PaymentRefunded — that spans several rows, raw CDC is the wrong abstraction.\n\nThe **transactional outbox** solves this: business events are written to a dedicated outbox table inside the same database transaction as the state change, guaranteeing atomicity, and CDC tails only the outbox. Because the event is written transactionally with the state, you never publish an event for a change that rolled back, and the event carries the domain shape rather than a table shape.",
      },
      {
        type: "comparison",
        heading: "Outbox vs Raw CDC",
        headers: ["Transactional Outbox", "Raw Table CDC"],
        rows: [
          {
            aspect: "Event shape",
            "Transactional Outbox": "Domain events you design",
            "Raw Table CDC": "Row snapshots tied to table schema",
          },
          {
            aspect: "Atomicity",
            "Transactional Outbox":
              "Event written in the same transaction as state",
            "Raw Table CDC":
              "Event derived from committed rows, same guarantee via log",
          },
          {
            aspect: "Coupling",
            "Transactional Outbox": "Consumers decoupled from table shape",
            "Raw Table CDC": "Any table change can break consumers",
          },
          {
            aspect: "Internal tables",
            "Transactional Outbox": "Only the outbox is streamed",
            "Raw Table CDC": "Every watched table, including scratch data",
          },
          {
            aspect: "Extra work",
            "Transactional Outbox": "Requires an outbox table and writes",
            "Raw Table CDC": "No application change",
          },
          {
            aspect: "Best for",
            "Transactional Outbox":
              "Cross-service events with stable contracts",
            "Raw Table CDC": "Search indexes, caches, near real-time replicas",
          },
        ],
      },
      {
        type: "text",
        heading: "Delivery Guarantees and Ordering",
        content:
          "CDC pipelines are typically **at-least-once**: a consumer may see an event twice after a rebalance or crash. Exactly-once end-to-end delivery is achievable only where both the stream and the sink support transactions — Kafka transactions plus a transactional sink, or an idempotent consumer keyed on the event id.\n\nOrdering matters more than many teams expect. CDC preserves order **per log position**, and every consumer of the same partition sees the same order, but once events fan out across Kafka partitions, records for the same entity can be reordered unless the partition key is the entity id. Always key events by the entity they describe so updates to one row stay in order.",
      },
      {
        type: "callout",
        calloutType: "warning",
        heading: "Schema Evolution Breaks Naive Consumers",
        content:
          "A CDC stream reflects the source schema, so an ALTER TABLE — adding, renaming, or dropping a column — changes every event. Consumers that assume a fixed shape break at deploy time. Register event schemas in a schema registry, adopt a compatibility policy (backward compatibility lets old consumers keep reading new events), and prefer additive changes. The expand-contract discipline you use for the database also applies to the event contract.",
      },
      {
        type: "steps",
        heading: "Building a CDC Pipeline",
        steps: [
          {
            title: "Enable the log",
            detail:
              "Set the database to logical or row-based replication and grant the CDC user replication rights.",
          },
          {
            title: "Create a slot and publication",
            detail:
              "Define which tables are watched and where the reader starts.",
          },
          {
            title: "Run the connector",
            detail:
              "Translate log records into an ordered event stream keyed by entity id.",
          },
          {
            title: "Land events in a sink",
            detail:
              "Write to Kafka, then to a search index, cache, or warehouse via a sink connector.",
          },
          {
            title: "Make consumers idempotent",
            detail:
              "Handle duplicates by event id so at-least-once delivery does no harm.",
          },
          {
            title: "Monitor lag and slots",
            detail:
              "Alert on replication slot lag before it fills the log disk.",
          },
        ],
      },
      {
        type: "text",
        heading: "Where CDC Pays Off",
        content:
          "The highest-value uses are the ones that need the database to behave as an event source with minimal overhead. **Search indexing**: stream changes into Elasticsearch so the index stays fresh without dual writes in application code. **Cache invalidation**: evict or refresh cache entries the moment a row changes. **Read replicas and warehouses**: replicate a subset of tables in near real time. **Microservice integration**: publish domain events across services without a shared database.\n\nIn every case the win is the same — the transactional database stays the source of truth, and downstream systems converge toward it automatically.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "CDC reads the database write-ahead log instead of polling tables for changes",
          "Logical decoding turns the physical WAL or binlog into consumable change events",
          "Replication slots provide backpressure but must be monitored to avoid filling disk",
          "Use a transactional outbox for stable domain events; use raw CDC to sync search, caches, and replicas",
          "Expect at-least-once delivery — make consumers idempotent by event id",
          "Key events by entity id so per-row updates stay ordered across partitions",
          "Treat the event schema as a contract and evolve it additively",
        ],
      },
    ],
    quiz: [
      {
        question:
          "What is the core advantage of log-based CDC over polling the database?",
        options: [
          "It requires schema changes to every table",
          "It reads the change log the database already writes, capturing every insert, update, and delete in order without extra query load",
          "It only works for inserts",
          "It makes the database eventually consistent",
        ],
        correctIndex: 1,
        explanation:
          "The write-ahead log and binlog already record every committed change for crash recovery. Reading that log yields ordered, complete change events with no polling queries and no need to alter application code or add change-timestamp columns.",
      },
      {
        question:
          "Why use a transactional outbox instead of streaming raw table changes for domain events?",
        options: [
          "It is faster",
          "It writes a domain-shaped event in the same transaction as the state change, decoupling consumers from the table schema",
          "It avoids needing a database",
          "It removes the need for ordering",
        ],
        correctIndex: 1,
        explanation:
          "The outbox writes a designed business event atomically with the state change, so no event is published for a rolled-back transaction and consumers depend on a stable contract rather than the shape of the source table.",
      },
      {
        question:
          "A CDC consumer may receive the same event twice. What is the standard mitigation?",
        options: [
          "Assume events are unique and ignore it",
          "Make the consumer idempotent, keyed on the event id or a deduplication table",
          "Disable retries entirely",
          "Switch to polling",
        ],
        correctIndex: 1,
        explanation:
          "CDC pipelines are usually at-least-once, because a crash or partition rebalance can replay events. Exactly-once end-to-end requires transactional support throughout, so the practical answer is an idempotent consumer that safely reprocesses duplicates.",
      },
      {
        question: "Why key CDC events by entity id rather than round-robin?",
        options: [
          "To reduce throughput",
          "So all changes to the same row land in the same partition and stay ordered",
          "To encrypt the events",
          "To disable the outbox",
        ],
        correctIndex: 1,
        explanation:
          "Kafka preserves order only within a partition. Keying by entity id keeps all updates for one row or aggregate in a single partition, so consumers observe them in log order rather than interleaved with unrelated updates.",
      },
    ],
  },

  // ─── VECTOR DATA ────────────────────────────────────────────────────────

  "vector-databases": {
    slug: "vector-databases",
    title: "Vector Databases",
    tagline: "Embeddings and approximate nearest-neighbour search",
    sections: [
      {
        type: "text",
        heading: "Embeddings Turn Meaning Into Geometry",
        content:
          'An embedding is a dense vector of floats — often 384 to 1536 dimensions — produced by a model so that semantically similar items end up close together in vector space. A photo of a dog and the text "a puppy playing" land near each other even though they share no tokens.\n\nTraditional indexes match exact values or terms. Vector search instead asks for the **nearest neighbours** of a query vector: the stored items whose embeddings are closest. This is what powers semantic search, recommendation, deduplication, and the retrieval step of retrieval-augmented generation (RAG).',
      },
      {
        type: "analogy",
        heading: "A Map of Everything",
        content:
          'Imagine every document, image, and product plotted as a pin on a huge map, where nearby pins mean "similar in meaning". A search is now a simple question: I am standing here with my query pin — which pins are closest?\n\nYou do not need to read every document to answer that; you need the pins nearest you. A vector database is a map with an index that finds those nearest pins quickly without checking all of them.',
      },
      {
        type: "text",
        heading: "Similarity Metrics",
        content:
          "Three metrics dominate. **Cosine similarity** measures the angle between vectors and ignores magnitude, so it is the default for text embeddings where length should not matter. **Dot product** combines angle and magnitude and equals cosine when vectors are normalised; it is common in models trained with dot-product objectives. **Euclidean distance (L2)** measures straight-line distance and suits embeddings where magnitude carries meaning.\n\nThe metric must match how the model was trained. Using cosine on vectors a model expected to be compared by dot product gives subtly wrong rankings, so check the model card before choosing.",
      },
      {
        type: "code",
        heading: "Cosine Similarity in Application Code",
        language: "typescript",
        label: "cosine.ts",
        code: `function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function magnitude(v: number[]): number {
  return Math.sqrt(dot(v, v));
}

// Cosine similarity: 1 means identical direction, 0 orthogonal, -1 opposite
function cosineSimilarity(a: number[], b: number[]): number {
  const denom = magnitude(a) * magnitude(b);
  if (denom === 0) return 0;
  return dot(a, b) / denom;
}

// Normalising once lets dot product stand in for cosine later
function normalize(v: number[]): number[] {
  const m = magnitude(v);
  return m === 0 ? v : v.map((x) => x / m);
}

const query = normalize(new Array(1536).fill(0.01));
const doc = normalize(new Array(1536).fill(0.02));
console.log(cosineSimilarity(query, doc)); // ~1.0, same direction`,
      },
      {
        type: "text",
        heading: "ANN: Approximate Nearest Neighbour",
        content:
          "Finding the exact nearest neighbour means comparing the query against every vector — O(N) per query, hopeless beyond a few hundred thousand items. **Approximate nearest neighbour (ANN)** indexes trade a tiny amount of recall for orders-of-magnitude speed, and the two dominant families are graphs and clustering.\n\n**HNSW** (Hierarchical Navigable Small World) builds a multi-layer graph and greedily walks toward the query, fast and high-recall but memory-hungry. **IVF** (Inverted File) partitions vectors into clusters via k-means and probes only the nearest few clusters, cheaper to build and lighter in memory but with lower recall unless you probe more clusters.",
      },
      {
        type: "comparison",
        heading: "HNSW vs IVF",
        headers: ["HNSW", "IVF"],
        rows: [
          {
            aspect: "Structure",
            HNSW: "Multi-layer proximity graph",
            IVF: "K-means clusters plus inverted lists",
          },
          {
            aspect: "Query speed",
            HNSW: "Very fast at high recall",
            IVF: "Fast when probing few clusters",
          },
          {
            aspect: "Recall",
            HNSW: "High by default",
            IVF: "Tunable via nprobe, lower by default",
          },
          {
            aspect: "Memory",
            HNSW: "High, the graph is kept in memory",
            IVF: "Lower, lists can spill to disk",
          },
          {
            aspect: "Build cost",
            HNSW: "Slower to build and insert",
            IVF: "Faster to build, needs retraining on drift",
          },
          {
            aspect: "Tuning knob",
            HNSW: "efSearch and M",
            IVF: "nlist and nprobe",
          },
        ],
      },
      {
        type: "code",
        heading: "Semantic Search with pgvector",
        language: "sql",
        label: "pgvector.sql",
        code: `-- Store 1536-dimension embeddings alongside the source rows
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  embedding  vector(1536) NOT NULL
);

-- HNSW index for cosine distance (smaller distance = more similar)
CREATE INDEX documents_embedding_idx
  ON documents USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Nearest neighbours: the <=> operator is cosine distance
SELECT id, title, 1 - (embedding <=> $1) AS similarity
FROM documents
ORDER BY embedding <=> $1
LIMIT 10;`,
      },
      {
        type: "text",
        heading: "Dedicated Vector Databases",
        content:
          "**pgvector** keeps embeddings in PostgreSQL, so you get SQL, joins, transactions, and filtering for free — often the right first choice. Dedicated databases add scale and features beyond a single Postgres instance: **Pinecone** is fully managed with no infrastructure to run, **Milvus** is built for billions of vectors with GPU-accelerated indexes, and **Qdrant** emphasises rich payload filtering and quantisation to cut memory.\n\nSkip the dedicated store until you outgrow pgvector. The moment you need sharding beyond one node, sub-10-millisecond latency over hundreds of millions of vectors, or filtered search at extreme scale, the specialised engines earn their operational cost.",
      },
      {
        type: "text",
        heading: "Hybrid Search: Dense Plus Sparse",
        content:
          'Pure vector search is strong at semantics but weak at exact matches — a product code, a rare name, a quoted phrase. Pure keyword search is exact but misses paraphrase. **Hybrid search** runs both and fuses the results, so a query for "SKU 88213 red shoes" finds the exact code and the semantically similar items.\n\nFusion is usually done with **Reciprocal Rank Fusion (RRF)**, which combines ranked lists by summing 1 / (k + rank) for each result, needing no score calibration between the two systems. Hybrid search reliably beats either retriever alone on real corpora and is the default in production RAG.',
      },
      {
        type: "text",
        heading: "Tuning Recall vs Latency",
        content:
          "ANN search exposes a dial between speed and accuracy. HNSW's efSearch sets how many candidates the graph walk explores — raise it for higher recall at more latency. IVF's nprobe sets how many clusters to search — more clusters, higher recall, more distance computations.\n\nMeasure exactly this tradeoff rather than guessing: hold out a set of queries, compute the true nearest neighbours by brute force, and plot recall@k against latency across settings. Choose the operating point that meets your latency budget with acceptable recall, and re-measure after any change to the embedding model, because a new model changes the whole geometry.",
      },
      {
        type: "steps",
        heading: "Retrieval-Augmented Generation in Practice",
        steps: [
          {
            title: "Chunk the source",
            detail:
              "Split documents into passages of a few hundred tokens with some overlap so context is not cut mid-idea.",
          },
          {
            title: "Embed and index",
            detail:
              "Run each chunk through the embedding model and store the vector plus its text and metadata.",
          },
          {
            title: "Embed the query",
            detail:
              "Use the same model and prefix conventions the index was built with.",
          },
          {
            title: "Retrieve",
            detail:
              "Fetch the top-k nearest chunks, optionally reranked by a cross-encoder for precision.",
          },
          {
            title: "Augment the prompt",
            detail:
              "Insert the retrieved chunks into the model prompt as grounding context with citations.",
          },
          {
            title: "Generate and cite",
            detail:
              "Have the model answer only from the supplied context and cite the source chunks.",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "gold",
        heading: "Chunking and Reranking Beat Index Tuning",
        content:
          "Teams often reach for exotic ANN parameters when retrieval quality disappoints, but the biggest wins are usually upstream. Chunk size and overlap determine what can be retrieved at all — too large and the embedding blurs several ideas, too small and it lacks context. A cross-encoder reranker over the top 50 candidates, reducing to the best 5, frequently lifts answer quality more than any index setting. Fix chunking and add a reranker before you spend time on HNSW knobs.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "Embeddings place semantically similar items close together in vector space",
          "Match the similarity metric — cosine, dot product, or L2 — to how the model was trained",
          "ANN indexes (HNSW, IVF) trade a little recall for large speed gains over brute force",
          "HNSW is fast and high-recall but memory-heavy; IVF is lighter and tunable with nprobe",
          "pgvector gives transactional vector search inside PostgreSQL; reach for Pinecone, Milvus, or Qdrant only at scale",
          "Hybrid dense plus sparse search, fused with RRF, beats either alone",
          "Measure recall@k against brute force and fix chunking and reranking before tuning index parameters",
        ],
      },
    ],
    quiz: [
      {
        question:
          "Which similarity metric ignores vector magnitude and compares only direction?",
        options: [
          "Euclidean distance (L2)",
          "Cosine similarity",
          "Manhattan distance",
          "Hamming distance",
        ],
        correctIndex: 1,
        explanation:
          "Cosine similarity measures the angle between two vectors and is invariant to their magnitudes, which is why it is the usual default for text embeddings where length should not affect similarity.",
      },
      {
        question:
          "What does an ANN index sacrifice, and why is that acceptable?",
        options: [
          "Nothing — it is exact",
          "A small amount of recall, in exchange for orders-of-magnitude faster search than brute force",
          "Durability of the stored vectors",
          "The ability to filter results",
        ],
        correctIndex: 1,
        explanation:
          "Approximate nearest neighbour indexes such as HNSW and IVF may occasionally miss a true neighbour, but the tiny recall loss is far outweighed by the speedup versus comparing against every vector, which becomes infeasible at scale.",
      },
      {
        question: "In HNSW tuning, what does the efSearch parameter control?",
        options: [
          "The embedding dimension",
          "How many candidate nodes the graph walk explores, trading recall for latency",
          "The number of clusters",
          "The similarity metric",
        ],
        correctIndex: 1,
        explanation:
          "efSearch sets the size of the candidate list during the graph traversal. Raising it explores more of the graph for higher recall at the cost of more comparisons and latency — the classic recall versus latency dial for HNSW.",
      },
      {
        question: "Why does hybrid search usually beat pure vector search?",
        options: [
          "It stores more vectors",
          "It combines semantic matching with exact keyword matching, catching both paraphrases and exact terms like product codes",
          "It removes the need for embeddings",
          "It always returns fewer results",
        ],
        correctIndex: 1,
        explanation:
          "Dense vector search captures meaning but can miss exact tokens such as codes or rare names; sparse keyword search captures those but misses paraphrase. Fusing the two, typically with Reciprocal Rank Fusion, covers both cases.",
      },
    ],
  },

  // ─── RESILIENCE & RECOVERY ──────────────────────────────────────────────

  "backup-dr": {
    slug: "backup-dr",
    title: "Backups & Disaster Recovery",
    tagline: "RPO, RTO, and proving restores actually work",
    sections: [
      {
        type: "text",
        heading: "Two Numbers Define the Plan",
        content:
          "Every disaster recovery conversation reduces to two numbers. **RPO (Recovery Point Objective)** is how much data you can afford to lose — a 5-minute RPO means backups or replication must capture changes within 5 minutes. **RTO (Recovery Time Objective)** is how long you can afford to be down — a 1-hour RTO means you must be serving traffic again within an hour of failure.\n\nThese numbers, not the technology, drive the design. An RPO of zero demands synchronous replication; a 24-hour RPO tolerates a nightly dump. An RTO of minutes rules out restoring from tape. Decide the numbers with the business first, then engineer to them.",
      },
      {
        type: "analogy",
        heading: "The Fire Drill",
        content:
          "A building can have flawless fire exits on paper, but nobody trusts them until a drill proves people get out in time. A fire extinguisher that has never been checked is a decoration.\n\nA backup is the same. A backup you have never restored is a hope, not a plan — the corruption, the missing key, the wrong version, or the command that fails under pressure are all discovered only during a real restore. The drill, a scheduled restore into a scratch environment, is what turns a backup into a guarantee.",
      },
      {
        type: "comparison",
        heading: "Full vs Incremental vs Differential",
        headers: ["Full Backup", "Incremental Backup"],
        rows: [
          {
            aspect: "What it contains",
            "Full Backup": "Every byte of data, every time",
            "Incremental Backup":
              "Only changes since the last backup of any type",
          },
          {
            aspect: "Backup time",
            "Full Backup": "Longest",
            "Incremental Backup": "Shortest",
          },
          {
            aspect: "Storage",
            "Full Backup": "Largest",
            "Incremental Backup": "Smallest",
          },
          {
            aspect: "Restore time",
            "Full Backup": "Fastest, one file",
            "Incremental Backup": "Slowest, replay the chain",
          },
          {
            aspect: "Restore complexity",
            "Full Backup": "Simple",
            "Incremental Backup": "Every link in the chain must be intact",
          },
          {
            aspect: "Risk",
            "Full Backup": "One file to lose",
            "Incremental Backup": "A single missing segment breaks the restore",
          },
        ],
      },
      {
        type: "text",
        heading: "Point-in-Time Recovery",
        content:
          "A nightly full backup loses up to a day of data. **Point-in-time recovery (PITR)** closes that gap: take a periodic base backup, then continuously archive the write-ahead log. To restore, replay the base backup and then apply WAL up to a chosen timestamp.\n\nThis is how you recover from the most common disaster of all — a bad migration or an erroneous DELETE at 14:03. PITR lets you restore to 14:02, before the damage, rather than to last night. It needs continuous WAL archiving (for example to object storage) and, ideally, a **restore drill** that replays into a scratch instance to prove the chain is complete.",
      },
      {
        type: "code",
        heading: "PostgreSQL PITR Setup",
        language: "bash",
        label: "pitr.sh",
        code: `# 1. Base backup: copy the data directory, streaming to object storage
pg_basebackup --pgdata=/var/backups/base \\
  --wal-method=stream \\
  --checkpoint=fast \\
  --progress --verbose

# 2. Continuous WAL archiving (postgresql.conf)
#    archive_mode = on
#    archive_command = 'aws s3 cp %p s3://db-wal-archive/%f'

# 3. Restore to a point in time -- stop just before the bad migration
#    recovery.signal tells PostgreSQL to recover rather than start fresh
cat > /var/lib/postgresql/data/recovery.signal <<'EOF'
EOF

cat >> /var/lib/postgresql/data/postgresql.auto.conf <<EOF
restore_command = 'aws s3 cp s3://db-wal-archive/%f %p'
recovery_target_time = '2026-11-15 14:02:00+00'
recovery_target_action = 'promote'
EOF

pg_ctl start --wait   # replays WAL to the target time, then promotes`,
      },
      {
        type: "text",
        heading: "Snapshots and Storage-Level Copies",
        content:
          "A **snapshot** is a point-in-time image of a volume taken by the storage layer, usually copy-on-write and near-instant. Snapshots are excellent for scheduled protection and for cloning a production dataset into staging, because they do not touch the database process.\n\nThey are not a substitute for logical backups. A snapshot captures whatever inconsistent state existed at that instant unless the database was quiesced or the snapshot is coordinated with crash recovery, and it lives inside one storage system — a bad actor or a region failure can take snapshots with it. Use snapshots for speed and clone convenience, and logical or WAL-based backups for true portability.",
      },
      {
        type: "steps",
        heading: "Running a Restore Drill",
        steps: [
          {
            title: "Schedule it",
            detail:
              "Put a restore drill on the calendar at a fixed cadence, monthly or quarterly, not after the incident.",
          },
          {
            title: "Provision scratch capacity",
            detail:
              "Stand up a temporary instance and storage large enough to hold the restored data.",
          },
          {
            title: "Restore from the real source",
            detail:
              "Pull from the same object store or archive production uses, not a convenient local copy.",
          },
          {
            title: "Time it against RTO",
            detail:
              "Record how long the restore takes and compare it with the target.",
          },
          {
            title: "Verify the data",
            detail:
              "Run checksums, row counts, and application smoke tests against the restored instance.",
          },
          {
            title: "Record and fix gaps",
            detail:
              "Write down what broke or was missing, and fix the process before the next drill.",
          },
        ],
      },
      {
        type: "text",
        heading: "The 3-2-1 Rule",
        content:
          "The classic durability guidance is **3-2-1**: keep at least **3** copies of your data, on **2** different media or systems, with **1** copy off-site. A modern restatement adds a fourth: ensure **1** copy is offline or immutable, so ransomware or a compromised credential cannot encrypt or delete every copy at once.\n\nConcretely: the live database, a snapshot or replica on separate storage, and an encrypted backup in a different region or account with object-lock (immutability) enabled. The separation of accounts matters — an attacker who compromises the production account must not also own the backup account.",
      },
      {
        type: "comparison",
        heading: "DR Strategies",
        headers: ["Backup and Restore", "Warm Standby"],
        rows: [
          {
            aspect: "RTO",
            "Backup and Restore": "Hours",
            "Warm Standby": "Minutes",
          },
          {
            aspect: "RPO",
            "Backup and Restore": "Hours",
            "Warm Standby": "Seconds to minutes",
          },
          {
            aspect: "Cost",
            "Backup and Restore": "Lowest",
            "Warm Standby": "Moderate, duplicate running capacity",
          },
          {
            aspect: "Standby state",
            "Backup and Restore": "Nothing running until recovery",
            "Warm Standby": "Scaled-down but live replica",
          },
          {
            aspect: "Failover",
            "Backup and Restore": "Manual restore and rebuild",
            "Warm Standby": "Promote the replica, scale up",
          },
          {
            aspect: "Fit",
            "Backup and Restore": "Non-critical systems",
            "Warm Standby": "Business-critical with tight RTO",
          },
        ],
      },
      {
        type: "callout",
        calloutType: "danger",
        heading: "Untested Backups Fail Silently",
        content:
          "The worst outcome is a backup that looks healthy for years and cannot be restored when it matters — a corrupted archive, a forgotten encryption key, a version mismatch, or an incremental chain broken by one missing segment weeks ago. Alert on backup success, encryption key availability, and restore-drill results, and treat a failed drill as a production incident. A backup nobody has restored from is an assumption, and assumptions are what incidents are made of.",
      },
      {
        type: "text",
        heading: "Cross-Region Replication",
        content:
          "Replication protects against a whole-region failure that snapshots in one zone cannot. **Asynchronous replication** to another region keeps RPO in seconds and adds no write latency, at the cost of possibly losing the last few seconds of writes on failover. **Synchronous replication** across regions gives an RPO of zero but adds the round-trip latency of the distant region to every commit, which few workloads tolerate.\n\nMost production systems replicate asynchronously to a warm standby in a second region, monitor replication lag as the real RPO measure, and rehearse promotion so failover is a known procedure rather than an improvisation.",
      },
      {
        type: "checklist",
        heading: "Key Takeaways",
        items: [
          "RPO sets how much data you can lose; RTO sets how long you can be down — decide both with the business first",
          "Full backups are simple to restore; incrementals are smaller but every link in the chain must survive",
          "Point-in-time recovery needs a base backup plus continuous WAL archiving to recover from a bad change",
          "Snapshots are fast and clone-friendly but live inside one storage system and are not portable backups",
          "Run scheduled restore drills and treat a failed drill as a production incident",
          "Follow 3-2-1 with an offline or immutable copy in a separate account",
          "Cross-region async replication keeps a low RPO at the cost of a few seconds of possible loss on failover",
        ],
      },
    ],
    quiz: [
      {
        question:
          "A system must lose no more than 5 minutes of data but can be down for up to an hour. Which pair describes these requirements?",
        options: [
          "RTO 5 minutes, RPO 1 hour",
          "RPO 5 minutes, RTO 1 hour",
          "RPO 1 hour, RTO 5 minutes",
          "RTO 5 minutes and RPO 5 minutes",
        ],
        correctIndex: 1,
        explanation:
          "RPO is the maximum tolerable data loss, so 5 minutes of allowed loss is a 5-minute RPO. RTO is the maximum tolerable downtime, so an hour of allowed downtime is a 1-hour RTO.",
      },
      {
        question:
          "Why is point-in-time recovery valuable for recovering from an erroneous DELETE or bad migration?",
        options: [
          "It makes backups smaller",
          "It replays a base backup plus archived WAL to a timestamp just before the mistake, losing only the intervening changes",
          "It prevents all future errors",
          "It removes the need for backups",
        ],
        correctIndex: 1,
        explanation:
          "A nightly backup would lose up to a day of data. PITR restores a base backup and applies archived WAL up to a chosen point, so you can recover to moments before the bad change and lose only the few transactions since.",
      },
      {
        question:
          "Why is a storage snapshot not a sufficient substitute for a logical backup?",
        options: [
          "Snapshots are too slow to take",
          "They may capture an inconsistent state and live inside a single storage system, offering no portability",
          "They cannot be scheduled",
          "They compress too much",
        ],
        correctIndex: 1,
        explanation:
          "Snapshots are fast and clone-friendly but reflect whatever state existed at that instant, which may not be a consistent database state unless coordinated, and they reside in one storage system — so a region failure or a compromised account can take them too.",
      },
      {
        question:
          "Which practice most reduces the risk that a backup cannot actually be restored?",
        options: [
          "Increasing backup frequency only",
          "Running regular restore drills into a scratch environment and treating failures as incidents",
          "Encrypting backups",
          "Storing more copies in one account",
        ],
        correctIndex: 1,
        explanation:
          "Untested backups fail silently for reasons like corruption, key loss, or a broken incremental chain. Scheduled restore drills against the real backup source verify the whole chain and surface failures while there is still time to fix them.",
      },
    ],
  },
};

export default TOPIC_CONTENT_PART6;

