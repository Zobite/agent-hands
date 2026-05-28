<feature>
  <meta>
    <id>mcp_management_page</id>
    <title>MCP server management page</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Central management page for all MCP servers. Displays list of servers
    (builtin + custom), tool count per server, active/inactive status,
    and CRUD actions.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>navigate to MCP Servers page from sidebar</action>
      <benefit>view all MCP servers and manage tools</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] Route: /mcp-servers. Sidebar menu item "MCP Servers" with appropriate icon.
- [ ] List displays as cards or list: - Server name - Badge: "System" (builtin) or "Custom" - Description - Tool count - Status: Active / Inactive - MCP endpoint URL (copyable) - Actions: Edit, Delete (custom only), Toggle active
- [ ] API: GET /api/mcp-servers → { items: McpServer[], meta: { total } }.

## Web
- [ ] Built-in server always displayed first, pinned on top.
- [ ] "New MCP Server" button in top-right corner.
- [ ] Click server → navigate to detail page: /mcp-servers/:id (displays tool list for that server).
- [ ] Empty state when no custom servers exist: guide to create first server.
