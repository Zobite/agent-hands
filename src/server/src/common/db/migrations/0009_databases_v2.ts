import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0009_databases_v2",
  up: [
    `CREATE TABLE IF NOT EXISTS databases_v2 (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `ALTER TABLE dynamic_tables ADD COLUMN database_id TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_dynamic_tables_database_id ON dynamic_tables(database_id)`,
  ],
};

export default migration;
