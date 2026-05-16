<feature>
  <meta>
    <id>mcp_tool_logs</id>
    <title>Tool execution logs</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p2</priority>
  </meta>

  <overview>
       Ghi log mỗi lần tool được thực thi: ai gọi, input params, output result,
    execution time, status (success/error). Log giúp debug và monitoring tools.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>mở tab Logs trên trang tool detail</action>
      <benefit>xem lịch sử thực thi, debug lỗi, monitoring performance</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] Mỗi lần tool execute → ghi 1 log record vào DB.
- [ ] API: GET /api/mcp-servers/:serverId/tools/:toolId/logs?page=1&limit=50.
- [ ] DB schema: tool_execution_logs table.

## Web
- [ ] Log record chứa: id, toolId, serverId, callerType (mcp_agent | test_panel), callerInfo (agent name hoặc user), inputParams (JSON), outputResult (JSON), status (success | error), errorMessage, executionTimeMs, createdAt.
- [ ] Tab "Logs" trên trang tool detail: table với pagination.
- [ ] Mỗi log row hiển thị: timestamp, caller, status badge (success/error), execution time.
- [ ] Click log → expand hiển thị input/output JSON.
- [ ] Filter logs theo: status, date range.
- [ ] Auto-cleanup: logs cũ hơn 30 ngày bị xoá tự động (configurable).
