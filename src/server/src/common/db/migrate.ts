import { Database as BunSQLite } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { migrations } from "./migrations/index.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Migration {
  /** Unique name, e.g. "0001_initial_schema". Used as the tracking key. */
  name: string;
  /** Array of SQL statements executed in order within a transaction. */
  up: string[];
}

// ─── Migration tracking table ─────────────────────────────────────────────────

const MIGRATIONS_TABLE_DDL = `
  CREATE TABLE IF NOT EXISTS _migrations_v2 (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL UNIQUE,
    applied_at INTEGER NOT NULL
  )
`;

// ─── Backward-compat: bridge from old counter-based _migrations ───────────────

/**
 * If the DB has the old `_migrations` table (counter-based) but not the new
 * `_migrations_v2` table, seed _migrations_v2 with migration names matching
 * the count of rows already applied. This ensures we never re-run old
 * migrations on an existing DB.
 */
function bridgeFromLegacy(sqlite: BunSQLite) {
  // Check if old table exists
  const oldTable = sqlite
    .query<{ name: string }, []>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='_migrations'"
    )
    .get();

  if (!oldTable) return; // fresh DB, nothing to bridge

  // Check if new table already has rows (already bridged)
  const newCount = sqlite
    .query<{ cnt: number }, []>("SELECT COUNT(*) as cnt FROM _migrations_v2")
    .get()!.cnt;

  if (newCount > 0) return; // already bridged

  // Count old migrations
  const oldCount = sqlite
    .query<{ cnt: number }, []>("SELECT COUNT(*) as cnt FROM _migrations")
    .get()!.cnt;

  if (oldCount === 0) return;

  // The old system tracked each individual SQL statement as one row.
  // The new system groups them into migration files. We use cumulative
  // statement counts to determine which migration files are fully applied.
  const now = Date.now();
  let cumulativeStatements = 0;
  const bridged: string[] = [];

  sqlite.transaction(() => {
    for (const m of migrations) {
      cumulativeStatements += m.up.length;
      if (cumulativeStatements <= oldCount) {
        sqlite.exec(
          `INSERT OR IGNORE INTO _migrations_v2(name, applied_at) VALUES ('${m.name}', ${now})`
        );
        bridged.push(m.name);
      } else {
        break; // remaining migrations are not yet applied
      }
    }
  })();

  console.log(
    `[DB] Bridged ${bridged.length} legacy migration(s) → _migrations_v2`
  );
}

// ─── Runner ───────────────────────────────────────────────────────────────────

export function runMigrations(dataDir: string) {
  mkdirSync(dataDir, { recursive: true });
  const sqlite = new BunSQLite(`${dataDir}/data.db`, { create: true });
  sqlite.exec("PRAGMA journal_mode=WAL;");
  sqlite.exec("PRAGMA foreign_keys=ON;");

  // Ensure tracking table exists
  sqlite.exec(MIGRATIONS_TABLE_DDL);

  // Bridge old counter-based tracker if needed
  bridgeFromLegacy(sqlite);

  // Get already-applied migration names
  const applied = new Set(
    sqlite
      .query<{ name: string }, []>("SELECT name FROM _migrations_v2")
      .all()
      .map((r) => r.name)
  );

  // Determine pending migrations (preserve order, skip already applied)
  const pending = migrations.filter((m) => !applied.has(m.name));

  if (pending.length === 0) {
    console.log("[DB] No pending migrations.");
    sqlite.close();
    return;
  }

  // Apply pending migrations inside a single transaction
  sqlite.transaction(() => {
    for (const m of pending) {
      for (const sql of m.up) {
        sqlite.exec(sql);
      }
      sqlite.exec(
        `INSERT INTO _migrations_v2(name, applied_at) VALUES ('${m.name}', ${Date.now()})`
      );
      console.log(`[DB]   ✓ ${m.name}`);
    }
  })();

  console.log(`[DB] Applied ${pending.length} migration(s).`);
  sqlite.close();
}

// ─── CLI: bun src/common/db/migrate.ts ────────────────────────────────────────

if (import.meta.main) {
  const dataDir =
    process.env.DATA_DIR ?? `${process.env.HOME}/.agent-hands`;
  runMigrations(dataDir);
}
