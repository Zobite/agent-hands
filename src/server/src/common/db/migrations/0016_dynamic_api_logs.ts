import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0016_dynamic_api_logs",
  up: [
    `CREATE TABLE IF NOT EXISTS dynamic_api_logs (
      id TEXT PRIMARY KEY,
      api_id TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      execution_time_ms INTEGER NOT NULL,
      execution_mode TEXT NOT NULL DEFAULT 'fast',
      request_headers TEXT,
      request_body TEXT,
      response_body TEXT,
      console_output TEXT,
      error TEXT,
      ip TEXT,
      created_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_dynamic_api_logs_api_id ON dynamic_api_logs(api_id)`,
    `CREATE INDEX IF NOT EXISTS idx_dynamic_api_logs_created_at ON dynamic_api_logs(created_at)`,
  ],
};

export default migration;
