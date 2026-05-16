import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0015_dynamic_apis",
  up: [
    `CREATE TABLE IF NOT EXISTS dynamic_apis (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      method TEXT NOT NULL DEFAULT 'GET',
      path TEXT NOT NULL,
      description TEXT,
      code TEXT NOT NULL DEFAULT '',
      dependencies TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      timeout INTEGER NOT NULL DEFAULT 30000,
      is_public INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_dynamic_apis_method_path ON dynamic_apis(method, path)`,
    `CREATE INDEX IF NOT EXISTS idx_dynamic_apis_is_active ON dynamic_apis(is_active)`,
  ],
};

export default migration;
