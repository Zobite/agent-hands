/**
 * Register 3 meta-tools on the MCP server:
 *   1. list_actions      — Summary of all available actions
 *   2. get_action_docs   — Detailed docs for a specific action
 *   3. execute           — Validate payload and run an action
 *
 * All individual tools are replaced by this dispatch-based architecture,
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
import { kvStoreActions } from "./actions/kv-store.js";
import { datatableProjectActions, tableActions } from "./actions/table.js";
import { storageActions } from "./actions/storage.js";

// ── Bootstrap all actions into the registry ────────────────────────────────────

registerActions([
  ...kvStoreActions,
  ...datatableProjectActions,
  ...tableActions,
  ...storageActions,
]);

// ── Register MCP Tools ─────────────────────────────────────────────────────────

export function registerAllSystemTools(server: McpServer) {
  server.tool(
    "list_actions",
    "List all available actions in Agent Hands with descriptions",
    {},
    async () => ({
      content: [{ type: "text" as const, text: generateOverview() }],
    }),
  );

  // @ts-expect-error — TS2589: MCP SDK generic type depth issue with Zod
  server.tool(
    "get_action_docs",
    "Get detailed documentation (params, types, examples) for a specific action",
    { action: z.string().describe("Action name, e.g. 'kv.set'") },
    async ({ action }) => {
      const docs = generateActionDocs(action);
      if (!docs) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: `Unknown action "${action}". Call list_actions() to see available actions.` }) }],
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
    "Execute a system action. Call get_action_docs(action) first to see required params.",
    {
      action: z.string().describe("Action name, e.g. 'kv.set'"),
      payload: z.any().optional().default({}).describe("Action payload — see get_action_docs for params"),
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
