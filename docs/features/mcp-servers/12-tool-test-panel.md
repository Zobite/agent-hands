<feature>
  <meta>
    <id>mcp_tool_test_panel</id>
    <title>Tool test panel</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    Test panel embedded in the tool editor page. User enters input params as
    JSON, clicks "Run" → executes tool in sandbox and displays result directly
    on the UI. Supports debugging tools without a real AI agent.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>enter test params and click Run on tool editor page</action>
      <benefit>verify tool works correctly before AI agent uses it</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] "Run" button → call API to execute tool → display result.
- [ ] API: POST /api/mcp-servers/:serverId/tools/:toolId/test → { params: object }.
- [ ] Test API runs JavaScript code in Bun sandbox same as when AI agent calls, but with additional detailed logging.

## Web
- [ ] Test panel on the right or below code editor (toggle visible).
- [ ] Input: JSON editor for params (pre-populated from inputSchema if available).
- [ ] Display: Result (JSON), console logs (from context.log), stderr, execution time.
- [ ] On error → display error message + stacktrace with highlighted error line.
- [ ] History: keep last 10 test runs (in localStorage).
