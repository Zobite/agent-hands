<feature>
  <meta>
    <id>mcp_edit_tool</id>
    <title>Edit tool</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User edits an existing tool: update name, description, input schema,
    or JavaScript code. Changes take effect immediately — next AI agent tool
    call will run the new code.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click on a tool in the list to open editor</action>
      <benefit>update tool logic or description without recreating</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] API: PATCH /api/mcp-servers/:serverId/tools/:toolId → { name?, description?, inputSchema?, code? }.

## Web
- [ ] Click tool name → navigate to edit page: /mcp-servers/:serverId/tools/:toolId.
- [ ] Edit page displays all fields same as creation page: Name, Description, Input Schema, Code.
- [ ] Code editor retains current JavaScript code content.
- [ ] Validation same rules as creation (name unique, snake_case, etc.).
- [ ] Save → update tool, success toast. New code takes effect immediately.
- [ ] If tool does not exist → 400 not_found.
- [ ] Cannot edit system tools of built-in server → 403 forbidden.
