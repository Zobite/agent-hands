<feature>
  <meta>
    <id>mcp_toggle_tool</id>
    <title>Toggle tool active/inactive</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    User can enable/disable a tool without deleting it. Inactive tools
    are not exposed to AI agents when they list tools via MCP protocol.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>toggle switch on tool row</action>
      <benefit>temporarily hide tool without losing code/config</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] Toggle → call API to update isActive → UI reflects immediately (optimistic update).
- [ ] Inactive tool → does not appear in MCP tools/list response.
- [ ] API: PATCH /api/mcp-servers/:serverId/tools/:toolId → { isActive: boolean }.

## Web
- [ ] Toggle switch on each tool row in tool list.
- [ ] Inactive tool still visible on UI with dimmed style + "Inactive" badge.
- [ ] System tools (builtin) can also be toggled — allows admin to disable system tools if desired.
