import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0007_projects",
  up: [
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,
    `ALTER TABLE documents ADD COLUMN project_id TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id)`,
  ],
};

export default migration;
