/**
 * MCP Tool Coding Agent
 *
 * AI agent that generates JavaScript code for MCP tools.
 * Adapted from the Dynamic API coding agent but uses
 * the MCP tool pattern: export default async function execute(params, context) { ... }
 */

import { stepCountIs, streamText, tool } from "ai";
import type { LanguageModel } from "ai";
import TurndownService from "turndown";
import { z } from "zod";
import { getModelForProvider } from "../llm-providers/llm-provider.chat.js";
import { executeMcpTool } from "./mcp-tool-executor.js";
import { getMcpToolById, updateMcpTool } from "./mcp-tool-server.service.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface McpCodingAgentRequest {
  providerId: string;
  model: string;
  prompt: string;
  currentCode: string;
  serverId: string;
  toolId: string;
  toolName: string;
  toolDescription: string;
  inputSchema: string;
  authToken?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface McpAgentEvent {
  type: "thinking" | "tool_call" | "tool_result" | "text" | "text_delta" | "code" | "done" | "error";
  message?: string;
  code?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: unknown;
  duration?: number;
}

// Event type for code change — includes toolId for frontend to match
export interface McpCodeChangeEvent {
  toolId: string;
  code: string;
}

// ── Test execution ───────────────────────────────────────────────────────────

async function testToolCode(
  code: string,
  serverId: string,
  params: Record<string, unknown>,
  authToken?: string,
): Promise<{
  success: boolean;
  result: unknown;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
}> {
  // Use a stable tool ID for the coding agent sandbox
  const sandboxId = `agent_${serverId}`;
  const result = await executeMcpTool(sandboxId, code, params, {
    timeoutMs: 15_000,
    baseUrl: `http://127.0.0.1:${process.env.PORT ?? "18080"}`,
    authToken: authToken ?? "",
  });
  return result;
}

// ── Fetch Web utility ────────────────────────────────────────────────────────

async function fetchWebContent(url: string, mode: "raw" | "md" = "raw"): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "AgentHands/1.0" } });
    clearTimeout(timeout);
    if (!res.ok) return `HTTP Error ${res.status}: ${res.statusText}`;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return JSON.stringify(await res.json(), null, 2).slice(0, 8000);
    }
    const html = await res.text();
    if (mode === "md") {
      const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
      return td.turndown(html).slice(0, 8000);
    }
    return html.slice(0, 8000);
  } catch (err) {
    return `Fetch error: ${(err as Error).message}`;
  }
}

// ── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a JavaScript MCP tool code generator for the Agent Hands.

MCP Tool pattern — EVERY tool MUST use this exact JSDoc + code structure:
\`\`\`javascript
/**
 * @name tool_name_here
 * @description What this tool does (clear and concise)
 * @param {string} query (required) - A search query
 * @param {number} limit (optional) - Max results to return
 */
export default async function execute(params, context) {
  // params: input from AI agent (matches the @param declarations above)
  // context: { log, http, kv, tables }
  //
  // context.log(...args)            — log for debugging
  //
  // ── HTTP helpers ──
  // context.http.get(url, headers?)           — HTTP GET
  // context.http.post(url, data?, headers?)   — HTTP POST
  // context.http.patch(url, data?, headers?)  — HTTP PATCH
  // context.http.delete(url, headers?)        — HTTP DELETE
  //
  // IMPORTANT: http behavior depends on the URL type:
  //   • External URLs (starting with http/https): returns RAW TEXT string.
  //     You MUST call JSON.parse() yourself if the response is JSON.
  //     No Authorization header is sent — the request goes directly to the external API.
  //   • Internal API paths (starting with /api/...): returns parsed JSON object.
  //     Authorization header is sent automatically.
  //
  // ── KV Store ──
  // context.kv.get(key)      — read a value (returns parsed JSON)
  // context.kv.set(key, val) — write a value
  //
  // ── Tables ──
  // context.tables.query(projectId, tableId, filters)
  // context.tables.insert(projectId, tableId, data)

  return { result: "Hello!" };
}
\`\`\`

CRITICAL JSDoc RULES:
- You MUST declare EVERY parameter used in the code as a @param in the JSDoc header
- Format: @param {type} name (required|optional) - description
- Supported types: string, number, boolean, object, array, object[], string[]
- For nested objects: @param {object} filters (optional) - Filter options
                      @param {string} filters.category (optional) - Category filter
- The @param declarations are used to generate the tool's input schema for MCP — if you skip them, AI agents won't know what parameters to send
- @name must be snake_case (lowercase letters, numbers, underscores only)
- @description must be a clear, concise explanation of what the tool does

GENERAL RULES:
- Always export default the execute function
- Return a JSON-serializable value (object, array, string, number)
- You can use fetch() directly for external API calls, but context.http is preferred
- You can import npm packages (e.g. import _ from "lodash")
- NEVER use process.env
- Use context.log() for debugging output
- When calling external APIs via context.http.get(url), the response is a RAW TEXT string — always use JSON.parse() to parse JSON responses
- When calling internal APIs via context.http.get("/api/..."), the response is already a parsed JSON object

WORKFLOW — follow these steps strictly:
1. Analyze the user's request
2. Call write_code with the COMPLETE code
3. Call run_test with realistic params — this step is MANDATORY after every write_code
4. If the test fails, call write_code with FIXED code, then call run_test again
5. Repeat until tests pass, then respond with a short text summary

RULES:
- After EVERY write_code call, your VERY NEXT tool call MUST be run_test. No exceptions.
- NEVER call write_code twice without calling run_test in between.
- NEVER respond to the user without first calling run_test after write_code.
- Do NOT write code in markdown code blocks. Always use the write_code tool.
- Prefer writing and testing code over fetching.`;

// ── Tool factory ─────────────────────────────────────────────────────────────

function createTools(
  reqData: McpCodingAgentRequest,
  fetchWebCount: { count: number },
  codeChangedThisTurn: { value: boolean },
  onEvent: (event: McpAgentEvent) => void,
) {
  return {
    fetch_web: tool({
      description: "Fetch content from a URL. Use ONLY when you need to inspect a specific target URL or read unknown API documentation.",
      inputSchema: z.object({
        url: z.string().url(),
        mode: z.enum(["raw", "md"]).optional(),
      }),
      execute: async ({ url, mode }) => {
        fetchWebCount.count++;
        if (fetchWebCount.count > 3) {
          return `[LIMIT REACHED] You have already made 3 fetch_web calls. Use the information you have to write the code.`;
        }
        return await fetchWebContent(url, mode ?? "raw");
      },
    }),
    write_code: tool({
      description: "Save the generated code as a draft. After calling this tool, you MUST call run_test as your very next action.",
      inputSchema: z.object({
        code: z.string().describe("The complete JavaScript code including JSDoc header"),
      }),
      execute: async ({ code }) => {
        await updateMcpTool(reqData.serverId, reqData.toolId, { draftCode: code });
        codeChangedThisTurn.value = true;
        onEvent({ type: "code", code });
        return { success: true, nextStep: "REQUIRED: Now call run_test with realistic params to test this code." };
      },
    }),
    run_test: tool({
      description: "Test the current draft code with the given params. Reads draftCode from the database. Returns success, result, stdout, stderr, executionTimeMs.",
      inputSchema: z.object({
        params: z.record(z.unknown()).optional().describe("Test input params matching the tool's input schema"),
      }),
      execute: async ({ params }) => {
        const dbTool = await getMcpToolById(reqData.toolId);
        const codeToRun = dbTool?.draftCode ?? dbTool?.code;
        if (!codeToRun) {
          return { success: false, result: { error: "no_code", message: "No code found. Call write_code first." } };
        }
        return await testToolCode(codeToRun, reqData.serverId, params ?? {}, reqData.authToken);
      },
    }),
  };
}

// ── Stream agent and emit events ─────────────────────────────────────────────

async function streamAgentLoop(
  model: LanguageModel,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  aiTools: ReturnType<typeof createTools>,
  maxSteps: number,
  onEvent: (event: McpAgentEvent) => void,
): Promise<{ text: string }> {
  const result = streamText({
    model,
    messages,
    tools: aiTools,
    stopWhen: stepCountIs(maxSteps),
    temperature: 0.2,
    onError({ error }) {
      console.error("[McpCodingAgent] streamText error:", error);
    },
  });

  let accumulatedText = "";
  let isInTextBlock = false;

  for await (const part of result.fullStream) {
    switch (part.type) {
      case "text-delta": {
        accumulatedText += part.text;
        onEvent({ type: "text_delta", message: part.text });
        if (!isInTextBlock) isInTextBlock = true;
        break;
      }
      case "tool-call": {
        if (isInTextBlock) isInTextBlock = false;
        const toolName = part.toolName as string;
        const displayArgs = { ...(part.input as Record<string, unknown>) };
        // Don't emit the full code in tool_call args for write_code (too large)
        if (toolName === "write_code") {
          const codeLen = typeof displayArgs.code === "string" ? displayArgs.code.length : 0;
          onEvent({ type: "tool_call", toolName, toolArgs: { code: `[${codeLen} chars]` } });
        } else {
          onEvent({ type: "tool_call", toolName, toolArgs: displayArgs });
        }
        break;
      }
      case "tool-result": {
        const toolName = part.toolName as string;
        let toolResult: unknown = part.output;
        if (toolName === "fetch_web" && typeof part.output === "string") {
          toolResult = part.output.slice(0, 300) + (part.output.length > 300 ? "…" : "");
        }
        onEvent({ type: "tool_result", toolName, toolResult });
        break;
      }
      case "start-step": {
        onEvent({ type: "thinking", message: "Analyzing and planning next step…" });
        break;
      }
      case "finish-step": {
        if (isInTextBlock) isInTextBlock = false;
        break;
      }
      case "error": {
        onEvent({ type: "error", message: String(part.error) });
        break;
      }
      default:
        break;
    }
  }

  return { text: accumulatedText };
}

// ── Run Agent ────────────────────────────────────────────────────────────────

export async function runMcpCodingAgent(reqData: McpCodingAgentRequest, onEvent: (event: McpAgentEvent) => void): Promise<void> {
  const model = await getModelForProvider(reqData.providerId, reqData.model);

  const fetchWebCount = { count: 0 };
  const codeChangedThisTurn = { value: false };

  // ── Build messages ──────────────────────────────────────────────────────

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [{ role: "system", content: SYSTEM_PROMPT }];

  // Build user message with tool context + conversation history
  let userMsg = "";

  // Embed history as context (avoids tool-call format issues across turns)
  if (reqData.history && reqData.history.length > 0) {
    userMsg += "Previous conversation:\n";
    for (const msg of reqData.history) {
      userMsg += `[${msg.role.toUpperCase()}]: ${msg.content}\n\n`;
    }
    userMsg += "---\n\nNew request:\n";
  }

  userMsg += reqData.prompt;
  if (reqData.currentCode) userMsg += `\n\nCurrent code:\n\`\`\`javascript\n${reqData.currentCode}\n\`\`\``;

  if (reqData.toolName) userMsg += `\n\nTool name: ${reqData.toolName}`;
  if (reqData.toolDescription) userMsg += `\nTool description: ${reqData.toolDescription}`;

  if (reqData.inputSchema) {
    userMsg += `\n\nInput Schema:\n\`\`\`json\n${reqData.inputSchema}\n\`\`\``;
    userMsg += `\n\n⚠️ Provide realistic \`test_params\` that match the input schema above.`;
  }

  messages.push({ role: "user", content: userMsg });

  // ── Create tools ────────────────────────────────────────────────────────

  const aiTools = createTools(reqData, fetchWebCount, codeChangedThisTurn, onEvent);
  console.log("[McpCodingAgent] Registered tools:", Object.keys(aiTools));

  try {
    await streamAgentLoop(model as LanguageModel, messages, aiTools, 50, onEvent);
  } catch (err) {
    const errObj = err as Record<string, unknown>;
    console.error("[McpCodingAgent] runMcpCodingAgent error:", err);
    if (errObj.responseBody) {
      console.error("[McpCodingAgent] Response body:", String(errObj.responseBody).slice(0, 500));
    }
    onEvent({ type: "error", message: (err as Error).message });
  }

  // Query DB for the latest code to include in done event
  const finalTool = await getMcpToolById(reqData.toolId);
  onEvent({ type: "done", code: finalTool?.draftCode ?? finalTool?.code ?? undefined });
}
