import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0011_variable_projects",
  up: [
    `CREATE TABLE IF NOT EXISTS variable_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
  ],
};

export default migration;
