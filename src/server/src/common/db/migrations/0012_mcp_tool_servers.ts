import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0012_mcp_tool_servers",
  up: [
    `CREATE TABLE IF NOT EXISTS mcp_tool_servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      type TEXT NOT NULL DEFAULT 'custom',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    )`,

    // Seed built-in System Tools server
    `INSERT OR IGNORE INTO mcp_tool_servers (id, name, description, type, is_active, created_at, updated_at)
     VALUES ('mts_system', 'System Tools', 'Built-in MCP server exposing toolkit system tools (Variables, Tables, Documents, Storage)', 'builtin', 1, (unixepoch() * 1000), (unixepoch() * 1000))`,
  ],
};

export default migration;
