<feature>
  <meta>
    <id>mcp_servers_overview</id>
    <title>MCP Servers — Overview</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p0</priority>
    <updated>2026-05-27</updated>
  </meta>

  <overview>
    Manage MCP (Model Context Protocol) servers. The system has a default
    MCP server (Built-in) containing system tools — this is the gateway for
    AI agents to interact with all toolkit resources (KV Store, Tables,
    Storage). Additionally, users can create **Custom MCP servers** — each
    server is a collection of Tools defined by the user with JavaScript code.

    **Architecture:**
    - **Built-in MCP Server**: Always exists, cannot be deleted. Automatically
      exposes system tools (CRUD KV Store, Tables, Files).
    - **Custom MCP Server**: User-created. Contains Tools written in JavaScript
      code by the user. Each server has its own endpoint for AI agents to connect.
    - **Tools**: The smallest unit — a JavaScript function running in a Bun sandbox.
      A tool belongs to a specific MCP server.
  </overview>
</feature>

## Features (atomic — in priority order)

### MCP Server Management

| #  | Feature                           | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | Built-in MCP server (system)      | [01-builtin-mcp.md](01-builtin-mcp.md)                         | ✅ Done    | p0       |
| 02 | Create custom MCP server          | [02-create-mcp-server.md](02-create-mcp-server.md)              | ✅ Done    | p0       |
| 03 | Edit MCP server                   | [03-edit-mcp-server.md](03-edit-mcp-server.md)                  | ✅ Done    | p0       |
| 04 | Delete MCP server                 | [04-delete-mcp-server.md](04-delete-mcp-server.md)              | ✅ Done    | p0       |
| 05 | MCP server management page        | [05-mcp-management.md](05-mcp-management.md)                    | ✅ Done    | p0       |
| 06 | MCP server connection endpoint    | [06-mcp-endpoint.md](06-mcp-endpoint.md)                        | ⬜ Planned | p0       |

### Tool Management

| #  | Feature                           | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 07 | Create new tool                   | [07-create-tool.md](07-create-tool.md)                          | ✅ Done    | p0       |
| 08 | Edit tool                         | [08-edit-tool.md](08-edit-tool.md)                              | ✅ Done    | p0       |
| 09 | Delete tool                       | [09-delete-tool.md](09-delete-tool.md)                          | ✅ Done    | p0       |
| 10 | Tool code editor                  | [10-tool-code-editor.md](10-tool-code-editor.md)                | ✅ Done    | p0       |
| 11 | JavaScript sandbox executor       | [11-js-sandbox.md](11-js-sandbox.md)                            | ✅ Done    | p0       |
| 12 | Tool test panel                   | [12-tool-test-panel.md](12-tool-test-panel.md)                  | ✅ Done    | p1       |
| 13 | Toggle tool active/inactive       | [13-toggle-tool.md](13-toggle-tool.md)                          | ✅ Done    | p1       |
| 14 | Tool execution logs               | [14-tool-logs.md](14-tool-logs.md)                              | ⬜ Planned | p2       |
