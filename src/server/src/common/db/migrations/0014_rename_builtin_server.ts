import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0014_rename_builtin_server",
  up: [
    `UPDATE mcp_tool_servers SET name = 'Moro Agent Toolkit', description = 'Built-in MCP server providing system tools for AI agents to interact with Variables, Tables, Documents, and Storage.' WHERE id = 'mts_system'`,
    `UPDATE mcp_tool_servers SET name = 'Moro LLM Toolkit' WHERE id = 'mts_system'`,
  ],
};

export default migration;
