<feature>
  <meta>
    <id>dynamic_api_ai_agent</id>
    <title>AI Coding Agent for Dynamic API</title>
    <group>Dynamic API</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    AI Coding Agent sidebar on the right of Monaco editor that auto-generates
    handler code. Uses LangGraph JS to build an agentic workflow:
    generate code → dry-run test → fix if error → repeat until pass.
    Uses models from the configured LLM Providers list.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>describe requirements in natural language, AI generates handler code</action>
      <benefit>no need to write code from scratch, speeds up development</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>AI automatically runs dry-run test after generating code</action>
      <benefit>ensure code works before applying</benefit>
    </story>
    <story id="US-03">
      <actor>User</actor>
      <action>AI analyzes errors and fixes code, repeating up to 3 times</action>
      <benefit>reduce debugging time, higher quality generated code</benefit>
    </story>
    <story id="US-04">
      <actor>User</actor>
      <action>select LLM provider and model from configured list</action>
      <benefit>flexibility to use different models</benefit>
    </story>
    <story id="US-05">
      <actor>User</actor>
      <action>receive notification to configure LLM provider if none exists</action>
      <benefit>know what setup is needed before using the feature</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] **LangGraph Agent** (`llm-provider.chat.ts`):
  - StateGraph with 3 nodes: `generate`, `test`, `fix`
  - Conditional edges: test pass → END, test fail → fix → test (max 3 attempts)
  - Dry-run test reuses sandbox execution logic
  - `ChatOpenAI` with custom baseURL supports all providers (OpenAI, OpenRouter, Anthropic, Ollama, Custom)
- [x] **SSE Streaming Endpoint** (`POST /api/llm-providers/chat/coding-agent`):
  - Request: `{ providerId, model, prompt, currentCode, apiId, method, path }`
  - Response: SSE stream of `AgentEvent` (thinking, code, test_start, test_result, fix, done, error)
  - Auth: `requireAuth`

## Web
- [x] **AiCodingPanel** (`components/AiCodingPanel.tsx`):
  - Provider/Model selector (dropdown from LLM providers list)
  - Prompt textarea (Enter to send, Shift+Enter for newline)
  - Event timeline displays real-time: thinking → code generated → test → fix → done
  - Code preview (truncated), test result (status, body, error)
  - "Apply Code to Editor" button when code is available
  - Empty state if no LLM provider configured → link to /llm-providers
  - Stop button to abort agent
- [x] **DynamicApiDetailPage** — right panel tab switcher:
  - Tab "Test" → TestPanel (existing)
  - Tab "AI Agent" → AiCodingPanel (new)
  - AI panel receives currentCode, pushes code to editor via `onApplyCode` callback
