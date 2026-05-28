<feature>
  <meta>
    <id>mcp_connection_endpoint</id>
    <title>MCP server connection endpoint</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Each MCP server (builtin + custom) has an HTTP endpoint supporting MCP
    protocol. AI agents connect to this endpoint via SSE (Server-Sent Events)
    transport to discover and call tools. Endpoint requires authentication
    (API key or JWT).
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>AI Agent</actor>
      <action>connect to MCP endpoint URL</action>
      <benefit>discover available tools and call them via standard MCP protocol</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>copy MCP endpoint URL from UI</action>
      <benefit>configure AI agent to connect to server</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] Endpoint URL format: /api/mcp/:serverId/sse (SSE transport).
- [ ] Authentication: Bearer token (JWT) or API key via header x-api-key.
- [ ] When AI agent connects → return list of available tools in that server.
- [ ] If server isActive = false → reject connection, return error.
- [ ] UI displays endpoint URL as copyable input on server detail page.

## Web
- [ ] Support MCP protocol via SSE transport (Server-Sent Events).
- [ ] When AI agent calls tool → execute tool and stream result.
- [ ] Support Streamable HTTP transport (newer than SSE, per latest MCP spec).
