import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0004_variables",
  up: [
    `CREATE TABLE IF NOT EXISTS variables (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'string',
      namespace TEXT NOT NULL DEFAULT 'default',
      ttl INTEGER,
      expires_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_variables_ns_key ON variables(namespace, key)`,
    `CREATE INDEX IF NOT EXISTS idx_variables_namespace ON variables(namespace)`,
    `CREATE INDEX IF NOT EXISTS idx_variables_expires_at ON variables(expires_at)`,
  ],
};

export default migration;
