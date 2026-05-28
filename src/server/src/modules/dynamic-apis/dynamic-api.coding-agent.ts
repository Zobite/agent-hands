import { streamText, tool, stepCountIs } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";
import TurndownService from "turndown";
import { getModelForProvider } from "../llm-providers/llm-provider.chat.js";
import { executeIsolated, hasNpmImports } from "../../common/sandbox/js-executor.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CodingAgentRequest {
  providerId: string;
  model: string;
  prompt: string;
  currentCode: string;
  apiId: string;
  method: string;
  path: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface AgentEvent {
  type: "thinking" | "tool_call" | "tool_result" | "text" | "text_delta" | "code" | "done" | "error";
  message?: string;
  code?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: unknown;
  duration?: number;
}

// ── Dry-run execution (sandbox) ──────────────────────────────────────────────

async function dryRunCode(
  code: string,
  apiId: string,
  method: string,
  path: string,
  testInput?: {
    body?: unknown;
    query?: Record<string, string>;
    params?: Record<string, string>;
    headers?: Record<string, string>;
  },
): Promise<{
  status: number;
  body: unknown;
  consoleLogs: string[];
  error?: string;
  executionTimeMs: number;
}> {
  const requestObj = {
    method,
    path,
    params: testInput?.params || {},
    query: testInput?.query || {},
    headers: testInput?.headers || {},
    body: testInput?.body ?? null,
  };

  const needsIsolation = hasNpmImports(code);

  if (needsIsolation) {
    const result = await executeIsolated({
      apiId,
      code,
      request: requestObj,
      timeoutMs: 15000,
    });
    return {
      status: result.status,
      body: result.body,
      consoleLogs: result.consoleLogs || [],
      error: result.error,
      executionTimeMs: result.executionTimeMs,
    };
  }

  const startTime = Date.now();
  const consoleLogs: string[] = [];
  const context = {
    log: (...args: unknown[]) => {
      consoleLogs.push(
        args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "),
      );
    },
  };

  try {
    const cleanCode = code
      .replace(/export\s+default\s+/g, "")
      .replace(/module\.exports\s*=\s*/g, "");

    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const factory = new AsyncFunction(
      `${cleanCode}
       if (typeof handler === 'function') return handler;
       throw new Error('No handler function found.');`,
    );

    const handler = await factory();
    const result = await Promise.race([
      handler(requestObj, context),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Execution timeout")), 15000)),
    ]) as Record<string, unknown>;

    return {
      status: (result?.status as number) ?? 200,
      body: result?.body ?? result,
      consoleLogs,
      executionTimeMs: Date.now() - startTime,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      status: 500,
      body: { error: "execution_error", message: error.message },
      consoleLogs,
      error: error.stack || error.message,
      executionTimeMs: Date.now() - startTime,
    };
  }
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

// ── Extract code block from LLM response ─────────────────────────────────────

function extractCode(content: string): string | null {
  const blockMatch = content.match(/```(?:javascript|js|typescript|ts)?\n([\s\S]*?)```/);
  if (blockMatch) return blockMatch[1].trim();
  if (content.includes("export default") || content.includes("function handler")) {
    return content.trim();
  }
  return null;
}

// ── System Prompts ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a JavaScript API handler code generator for the Agent Hands Dynamic API system.

Handler pattern:
\`\`\`javascript
export default async function handler(request, context) {
  // request: { method, path, params, query, headers, body }
  // context: { log(...args) }
  return { status: 200, body: { message: "Hello" } };
}
\`\`\`

PATH PARAMETERS:
- Route patterns like /videos/:videoId mean the handler receives request.params.videoId
- Route /users/:userId/posts/:postId → request.params = { userId: "...", postId: "..." }
- ALWAYS access path params via request.params, NOT by parsing request.path

RULES:
- Always export default the handler function
- Return { status, headers?, body? }
- You can use fetch() for external API calls
- You can import npm packages (e.g. import _ from "lodash")
- NEVER use process.env
- Do NOT use context.kv unless explicitly asked

WORKFLOW:
1. Analyze the user's request. If you already know how to implement it, go DIRECTLY to step 2.
2. ONLY use fetch_web if the task REQUIRES inspecting a specific URL or reading unknown API docs. Do NOT fetch if:
   - You already know the API format (e.g. common APIs like GitHub, OpenAI, weather services)
   - The user's request is straightforward (e.g. "create a calculator", "return JSON data")
   - You have already fetched sufficient information in this conversation
   - Maximum 2-3 fetch calls per conversation. Once you have enough info, STOP fetching and write code.
3. Write the handler code and use test_code to run it — pick realistic test inputs for the API.
   ⚠️ CRITICAL: When calling test_code, you MUST ALWAYS check if the route has path params.
   - If the route is /videos/:videoId → you MUST pass params: { videoId: "dQw4w9WgXcQ" }
   - If the route is /users/:userId/posts/:postId → you MUST pass params: { userId: "user_123", postId: "post_456" }
   - NEVER call test_code without params when the route has :paramName placeholders.
   - Omitting params will cause the test to fail with "Missing parameter" errors.
4. Fix any errors and test again until the test passes (status < 400, no error)
5. When the test passes, respond with ONLY a \`\`\`javascript code block. No explanation, no other text.

IMPORTANT: Prefer writing and testing code over fetching. Most tasks can be solved without any fetch_web calls.`;

const SUMMARY_SYSTEM_PROMPT = `You are a concise technical assistant. Write a short summary only — no code blocks. IMPORTANT: Always respond in the same language the user used in their original prompt.`;

// ── Shared tool factory ──────────────────────────────────────────────────────

function createTools(
  reqData: CodingAgentRequest,
  fetchWebCount: { count: number },
  codeTracker: { current: string },
  codeChangedThisTurn: { value: boolean },
  onEvent: (event: AgentEvent) => void,
) {
  return {
    fetch_web: tool({
      description:
        "Fetch content from a URL. Use ONLY when you need to inspect a specific target URL or read unknown API documentation. Do NOT use for well-known APIs you already know. mode='raw' for HTML, mode='md' for readable Markdown.",
      inputSchema: z.object({
        url: z.string().url(),
        mode: z.enum(["raw", "md"]).optional(),
      }),
      execute: async ({ url, mode }) => {
        fetchWebCount.count++;
        if (fetchWebCount.count > 3) {
          return `[LIMIT REACHED] You have already made 3 fetch_web calls. Use the information you have to write the code. Do NOT call fetch_web again.`;
        }
        return await fetchWebContent(url, mode ?? "raw");
      },
    }),
    test_code: tool({
      description:
        "Execute and test the handler code. Returns status, body, consoleLogs, error, and executionTimeMs. REQUIRED: If the route has path params (e.g. /items/:id), you MUST provide the `params` object with matching values. Omitting params for a route like /videos/:videoId will cause an error.",
      inputSchema: z.object({
        code: z.string().describe("The JavaScript handler code to test"),
        body: z.record(z.unknown()).optional().describe("Request body (for POST/PUT/PATCH)"),
        query: z.record(z.string()).optional().describe("Query string params (e.g. ?page=1)"),
        params: z.record(z.string()).optional().describe("URL path params — REQUIRED when route has :paramName placeholders. Example: { videoId: 'abc123' } for route /videos/:videoId"),
        headers: z.record(z.string()).optional().describe("Request headers"),
      }),
      execute: async ({ code, body, query, params, headers }) => {
        // Track code and emit code event
        codeTracker.current = code;
        codeChangedThisTurn.value = true;
        onEvent({ type: "code", code });

        const testResult = await dryRunCode(code, reqData.apiId, reqData.method, reqData.path, {
          body,
          query,
          params,
          headers,
        });
        return testResult;
      },
    }),
  };
}

// ── Stream agent and emit events from fullStream ─────────────────────────────

async function streamAgentLoop(
  model: LanguageModel,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  aiTools: ReturnType<typeof createTools>,
  maxSteps: number,
  onEvent: (event: AgentEvent) => void,
): Promise<{ text: string }> {
  const result = streamText({
    model,
    messages,
    tools: aiTools,
    stopWhen: stepCountIs(maxSteps),
    temperature: 0.2,
    onError({ error }) {
      console.error("[CodingAgent] streamText error:", error);
    },
  });

  let accumulatedText = "";
  let isInTextBlock = false;

  for await (const part of result.fullStream) {
    switch (part.type) {
      case "text-delta": {
        accumulatedText += part.text;
        // Stream text deltas to client in real-time
        onEvent({ type: "text_delta", message: part.text });
        if (!isInTextBlock) {
          isInTextBlock = true;
        }
        break;
      }

      case "tool-call": {
        // Tool call has been fully formed, about to execute
        if (isInTextBlock) {
          isInTextBlock = false;
        }
        const toolName = part.toolName as string;
        const displayArgs = { ...(part.input as Record<string, unknown>) };
        if (toolName === "test_code" && displayArgs.code) {
          displayArgs.code = `(${(displayArgs.code as string).length} chars)`;
        }
        onEvent({ type: "tool_call", toolName, toolArgs: displayArgs });
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
        // New step starting (LLM call) — emit thinking
        onEvent({ type: "thinking", message: "Analyzing and planning next step…" });
        break;
      }

      case "finish-step": {
        // Step completed — reset text tracking for next step
        if (isInTextBlock) {
          isInTextBlock = false;
        }
        break;
      }

      case "error": {
        onEvent({ type: "error", message: String(part.error) });
        break;
      }

      // Ignore: text-start, text-end, tool-input-start, tool-input-delta, tool-input-end,
      // reasoning-*, source, file, raw, start, finish, abort, etc.
      default:
        break;
    }
  }

  return { text: accumulatedText };
}

// ── Run Agent (AI SDK v6 — streamText) ───────────────────────────────────────

export async function runCodingAgent(
  reqData: CodingAgentRequest,
  onEvent: (event: AgentEvent) => void,
): Promise<void> {
  const model = await getModelForProvider(reqData.providerId, reqData.model);

  const fetchWebCount = { count: 0 };
  const codeTracker = { current: reqData.currentCode || "" };
  const codeChangedThisTurn = { value: false };
  const initialCode = reqData.currentCode || "";

  // ── Build messages ──────────────────────────────────────────────────────

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT },
  ];

  // Add history
  for (const msg of reqData.history ?? []) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Build user message with rich API context
  let userMsg = reqData.prompt;
  if (reqData.currentCode) userMsg += `\n\nCurrent code:\n\`\`\`javascript\n${reqData.currentCode}\n\`\`\``;

  // Parse path params from route pattern (e.g. /videos/:videoId → ["videoId"])
  const pathParams = (reqData.path.match(/:([a-zA-Z_][a-zA-Z0-9_]*)/g) || []).map((p) => p.slice(1));

  userMsg += `\n\nAPI: ${reqData.method} ${reqData.path}`;

  if (pathParams.length > 0) {
    userMsg += `\n\n⚠️ PATH PARAMETERS (REQUIRED for test_code):`;
    userMsg += `\nThis route has the following path parameters: ${pathParams.map((p) => `\`:${p}\``).join(", ")}`;
    userMsg += `\nWhen calling test_code, you MUST include: params: { ${pathParams.map((p) => `${p}: "<realistic_value>"`).join(", ")} }`;
    userMsg += `\nDo NOT omit params — the test will fail with a "Missing parameter" error if you do.`;
  }

  if (["POST", "PUT", "PATCH"].includes(reqData.method)) {
    userMsg += `\nThis endpoint uses ${reqData.method}, so the handler likely receives data in \`request.body\`. Provide a realistic \`body\` object when testing.`;
  }

  if (reqData.method === "GET" || reqData.method === "DELETE") {
    userMsg += `\nThis endpoint uses ${reqData.method}. Data is typically passed via \`request.query\` or \`request.params\`.`;
  }
  messages.push({ role: "user", content: userMsg });

  // ── Create tools ────────────────────────────────────────────────────────

  const aiTools = createTools(reqData, fetchWebCount, codeTracker, codeChangedThisTurn, onEvent);

  try {
    // ── Stream the agent loop ─────────────────────────────────────────────
    const { text: finalText } = await streamAgentLoop(
      model as LanguageModel,
      messages,
      aiTools,
      25,
      onEvent,
    );

    // ── Process final response ───────────────────────────────────────────

    // Check if final response has code
    const code = extractCode(finalText);

    // If there's new code in the final response that wasn't already tested
    const isNewCode = code && code !== initialCode && code !== codeTracker.current;

    if (isNewCode) {
      codeTracker.current = code;
      codeChangedThisTurn.value = true;
      onEvent({ type: "code", code });

      // Force test if code was in final message but not tested
      onEvent({ type: "tool_call", toolName: "test_code", toolArgs: {} });
      const testResult = await dryRunCode(code, reqData.apiId, reqData.method, reqData.path);
      onEvent({ type: "tool_result", toolName: "test_code", toolResult: testResult });

      if (testResult.error || testResult.status >= 400) {
        // If test fails, try to fix via a second stream
        onEvent({ type: "thinking", message: "Test failed — fixing code…" });

        const fixMessages = [
          ...messages,
          { role: "assistant" as const, content: finalText },
          {
            role: "user" as const,
            content: `Test failed:\n${JSON.stringify({ status: testResult.status, error: testResult.error, body: testResult.body, consoleLogs: testResult.consoleLogs }, null, 2)}\n\nOriginal requirement: ${reqData.prompt}\n\nFix the handler code.`,
          },
        ];

        const { text: fixText } = await streamAgentLoop(
          model as LanguageModel,
          fixMessages,
          aiTools,
          15,
          onEvent,
        );

        const fixCode = extractCode(fixText);
        if (fixCode) {
          codeTracker.current = fixCode;
          onEvent({ type: "code", code: fixCode });
        }
      }
    } else if (finalText && !code) {
      // Text-only response — mark end of streaming text
      onEvent({ type: "text", message: "" });
    }

    // Generate summary ONLY if code was actually changed during this turn
    if (codeChangedThisTurn.value && codeTracker.current) {
      onEvent({ type: "thinking", message: "Generating summary…" });
      const summaryModel = await getModelForProvider(reqData.providerId, reqData.model);

      // Stream the summary too
      const summaryStream = streamText({
        model: summaryModel as LanguageModel,
        messages: [
          { role: "system", content: SUMMARY_SYSTEM_PROMPT },
          {
            role: "user",
            content: `User's original prompt: "${reqData.prompt}"

The following handler code was generated:
\`\`\`javascript
${codeTracker.current}
\`\`\`

Write a concise summary: what the handler does, what test inputs were used, and what the test result was. Respond in the same language as the user's prompt above.`,
          },
        ],
      });

      for await (const delta of summaryStream.textStream) {
        onEvent({ type: "text_delta", message: delta });
      }
      // Signal end of text block
      onEvent({ type: "text", message: "" });
    }
  } catch (err) {
    const errObj = err as Record<string, unknown>;
    console.error("[CodingAgent] runCodingAgent error:", err);
    if (errObj.responseBody) {
      console.error("[CodingAgent] Response body:", String(errObj.responseBody).slice(0, 500));
    }
    if (errObj.cause) {
      console.error("[CodingAgent] Cause:", errObj.cause);
    }
    onEvent({ type: "error", message: (err as Error).message });
  }

  onEvent({ type: "done", code: codeTracker.current || undefined });
}
