<feature>
  <meta>
    <id>mcp_create_server</id>
    <title>Create custom MCP server</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User creates a new MCP server (type "custom"). This server will contain
    Tools defined by the user. Each custom server has its own endpoint for
    AI agents to connect.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "New MCP Server" on MCP Management page</action>
      <benefit>create a new MCP server to group tools by domain/purpose</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] API: POST /api/mcp-servers → { name, description? }.
- [ ] Response: MCP server object with id, name, description, type, isActive, endpoint URL, createdAt.

## Web
- [ ] "New MCP Server" button on MCP Management page.
- [ ] Dialog to create MCP server with fields: Name (required, unique), Description (optional).
- [ ] Name only allows alphanumeric, hyphens, underscores. Max 100 characters.
- [ ] Save → MCP server appears in the list with "Custom" badge.
- [ ] Newly created server defaults to isActive = true, type = "custom", no tools yet.
