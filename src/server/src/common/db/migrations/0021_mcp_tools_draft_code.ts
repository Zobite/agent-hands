import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0021_mcp_tools_draft_code",
  up: [
    `ALTER TABLE mcp_tools ADD COLUMN draft_code TEXT`,
  ],
};

export default migration;
