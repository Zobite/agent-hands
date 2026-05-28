<feature>
  <meta>
    <id>mcp_tool_logs</id>
    <title>Tool execution logs</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p2</priority>
  </meta>

  <overview>
    Log each tool execution: who called it, input params, output result,
    execution time, status (success/error). Logs help with debugging and
    monitoring tools.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>open Logs tab on tool detail page</action>
      <benefit>view execution history, debug errors, monitor performance</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] Each tool execution → write 1 log record to DB.
- [ ] API: GET /api/mcp-servers/:serverId/tools/:toolId/logs?page=1&limit=50.
- [ ] DB schema: tool_execution_logs table.

## Web
- [ ] Log record contains: id, toolId, serverId, callerType (mcp_agent | test_panel), callerInfo (agent name or user), inputParams (JSON), outputResult (JSON), status (success | error), errorMessage, executionTimeMs, createdAt.
- [ ] "Logs" tab on tool detail page: table with pagination.
- [ ] Each log row displays: timestamp, caller, status badge (success/error), execution time.
- [ ] Click log → expand to show input/output JSON.
- [ ] Filter logs by: status, date range.
- [ ] Auto-cleanup: logs older than 30 days are automatically deleted (configurable).
