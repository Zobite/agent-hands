<feature>
  <meta>
    <id>mcp_create_tool</id>
    <title>Create new tool</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User creates a new tool in a custom MCP server. A tool is a JavaScript
    function running in a Bun sandbox. User defines: tool name, description,
    input schema (parameters), and JavaScript processing code.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "New Tool" on MCP server detail page</action>
      <benefit>create a new tool for AI agents to call via MCP protocol</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] API: POST /api/mcp-servers/:serverId/tools → { name, description, inputSchema?, code }.
- [ ] DB schema for tools: id, serverId (FK → mcp_servers), name, description, inputSchema (JSON), code (TEXT), isActive, createdAt, updatedAt.

## Web
- [ ] "New Tool" button on MCP server detail page (custom server only).
- [ ] Navigate to tool creation page: /mcp-servers/:serverId/tools/new.
- [ ] Tool creation form includes: - **Name** (required): tool name, snake_case, unique within server. E.g. get_weather, send_email. - **Description** (required): tool description for AI agent to understand when to use it. - **Input Schema** (optional): JSON Schema defining parameters. UI has visual schema builder or raw JSON editor. - **JavaScript Code** (required): processing code when tool is called.
- [ ] Name must be snake_case, only lowercase alphanumeric and underscore. Max 100 characters.
- [ ] Name must be unique within the same MCP server.
- [ ] Default JavaScript code template: ```javascript export default async function execute(params, context) { /** * params: object — input parameters from AI agent (per input schema) * context: object — SDK to access internal services * - context.log(...args) — debug logging * - context.http.get(url) / post(url, data) * - context.kv.get(key) / set(key, value, ttl?) * - context.tables.query(projectId, tableId, filters?) * - context.tables.insert(projectId, tableId, data) */ // Your tool logic here return { result: "Hello from tool!" }; } ```
- [ ] Save → tool appears in server's tool list, defaults to isActive = true.
