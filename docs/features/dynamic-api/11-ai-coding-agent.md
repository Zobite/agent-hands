<feature>
  <meta>
    <id>dynamic_api_ai_agent</id>
    <title>AI Coding Agent cho Dynamic API</title>
    <group>Dynamic API</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    AI Coding Agent sidebar bên phải Monaco editor giúp sinh code handler
    tự động. Sử dụng LangGraph JS để xây dựng agentic workflow:
    generate code → dry-run test → fix nếu lỗi → lặp lại cho đến khi pass.
    Lấy model từ danh sách LLM Providers đã cấu hình.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>mô tả yêu cầu bằng ngôn ngữ tự nhiên, AI sinh code handler</action>
      <benefit>không cần viết code từ đầu, tăng tốc phát triển</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>AI tự chạy dry-run test sau khi sinh code</action>
      <benefit>đảm bảo code hoạt động trước khi apply</benefit>
    </story>
    <story id="US-03">
      <actor>User</actor>
      <action>AI tự phân tích lỗi và fix code, lặp lại max 3 lần</action>
      <benefit>giảm thời gian debug, code sinh ra chất lượng cao hơn</benefit>
    </story>
    <story id="US-04">
      <actor>User</actor>
      <action>chọn LLM provider và model từ danh sách đã cấu hình</action>
      <benefit>linh hoạt sử dụng nhiều model khác nhau</benefit>
    </story>
    <story id="US-05">
      <actor>User</actor>
      <action>nhận thông báo cần cấu hình LLM provider nếu chưa có</action>
      <benefit>biết cần setup gì trước khi dùng tính năng</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] **LangGraph Agent** (`llm-provider.chat.ts`):
  - StateGraph với 3 nodes: `generate`, `test`, `fix`
  - Conditional edges: test pass → END, test fail → fix → test (max 3 attempts)
  - Dry-run test reuse sandbox execution logic
  - `ChatOpenAI` với custom baseURL hỗ trợ tất cả providers (OpenAI, OpenRouter, Anthropic, Ollama, Custom)
- [x] **SSE Streaming Endpoint** (`POST /api/llm-providers/chat/coding-agent`):
  - Request: `{ providerId, model, prompt, currentCode, apiId, method, path }`
  - Response: SSE stream các `AgentEvent` (thinking, code, test_start, test_result, fix, done, error)
  - Auth: `requireAuth`

## Web
- [x] **AiCodingPanel** (`components/AiCodingPanel.tsx`):
  - Provider/Model selector (dropdown từ danh sách LLM providers)
  - Prompt textarea (Enter to send, Shift+Enter for newline)
  - Event timeline hiển thị real-time: thinking → code generated → test → fix → done
  - Code preview (truncated), test result (status, body, error)
  - "Apply Code to Editor" button khi có code
  - Empty state nếu chưa cấu hình LLM provider → link tới /llm-providers
  - Stop button để abort agent
- [x] **DynamicApiDetailPage** — right panel tab switcher:
  - Tab "Test" → TestPanel (existing)
  - Tab "AI Agent" → AiCodingPanel (new)
  - AI panel nhận currentCode, push code về editor via `onApplyCode` callback
