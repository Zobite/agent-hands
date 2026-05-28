import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0022_rebrand_agent_hands",
  up: [
    `UPDATE mcp_tool_servers SET name = 'Agent Hands' WHERE id = 'mts_system' AND name != 'Agent Hands'`,
  ],
};

export default migration;
