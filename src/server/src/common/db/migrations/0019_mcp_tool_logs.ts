import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0019_mcp_tool_logs",
  up: [
    `CREATE TABLE IF NOT EXISTS mcp_tool_logs (
      id TEXT PRIMARY KEY,
      tool_id TEXT NOT NULL,
      server_id TEXT NOT NULL,
      caller_type TEXT NOT NULL DEFAULT 'test_panel',
      caller_info TEXT,
      input_params TEXT,
      output_result TEXT,
      status TEXT NOT NULL DEFAULT 'success',
      error_message TEXT,
      execution_time_ms INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS idx_mcp_tool_logs_tool_id ON mcp_tool_logs(tool_id)`,
    `CREATE INDEX IF NOT EXISTS idx_mcp_tool_logs_created_at ON mcp_tool_logs(created_at)`,
  ],
};

export default migration;
