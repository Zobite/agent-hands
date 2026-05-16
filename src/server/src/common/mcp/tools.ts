/**
 * Register 3 meta-tools on the MCP server:
 *   1. get_overview  — Summary of all available actions
 *   2. get_docs      — Detailed docs for a specific action
 *   3. execute       — Validate payload and run an action
 *
 * All 25 individual tools are replaced by this dispatch-based architecture,
 * reducing LLM context usage while keeping full functionality.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerActions,
  generateOverview,
  generateActionDocs,
  executeAction,
} from "./registry.js";
import { variableActions, variableNamespaceActions } from "./actions/variable.js";
import { databaseActions, tableActions } from "./actions/table.js";
import { projectActions, documentActions } from "./actions/document.js";
import { storageActions } from "./actions/storage.js";
import { fetchActions } from "../agent_tools/index.js";

// ── Bootstrap all actions into the registry ────────────────────────────────────

registerActions([
  ...variableActions,
  ...variableNamespaceActions,
  ...databaseActions,
  ...tableActions,
  ...projectActions,
  ...documentActions,
  ...storageActions,
  ...fetchActions,
]);

// ── Register MCP Tools ─────────────────────────────────────────────────────────

export function registerAllSystemTools(server: McpServer) {
  server.tool(
    "get_overview",
    "Get a summary of all available actions and resources in Moro LLM Toolkit",
    {},
    async () => ({
      content: [{ type: "text" as const, text: generateOverview() }],
    }),
  );

  // @ts-expect-error — TS2589: MCP SDK generic type depth issue with Zod
  server.tool(
    "get_docs",
    "Get detailed documentation (params, types, examples) for a specific action",
    { action: z.string().describe("Action name, e.g. 'variables.set'") },
    async ({ action }) => {
      const docs = generateActionDocs(action);
      if (!docs) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: `Unknown action "${action}". Call get_overview() to see available actions.` }) }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(docs, null, 2) }],
      };
    },
  );

  server.tool(
    "execute",
    "Execute a system action. Call get_docs(action) first to see required params.",
    {
      action: z.string().describe("Action name, e.g. 'variables.set'"),
      payload: z.any().optional().default({}).describe("Action payload — see get_docs for params"),
    },
    async ({ action, payload }) => {
      const p = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;
      const result = await executeAction(action, p);
      if (!result.success) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: result.error }) }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result.data, null, 2) }],
      };
    },
  );
}
