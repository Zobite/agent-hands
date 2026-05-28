<feature>
  <meta>
    <id>mcp_builtin</id>
    <title>Built-in MCP Server (System Tools)</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Built-in MCP server that exposes all system features (KV Store, Tables,
    Object Storage) to AI agents via 3 meta-tools: get_overview, get_docs, execute.
    Agents call execute({ action, payload }) to perform any action.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>AI Agent (Claude, GPT, etc.)</actor>
      <action>connect MCP server → call get_overview → choose action → execute</action>
      <benefit>access the entire system via MCP protocol</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] MCP server runs at /api/mcp/:serverId (Streamable HTTP transport)
- [x] 3 meta-tools: list_actions, get_action_docs({ action }), execute({ action, payload })
- [x] Action registry manages all actions, validates payload with Zod
- [x] Registered actions list:
  - KV Store: `kv.list`, `kv.get` (single/bulk), `kv.set` (single/bulk upsert), `kv.delete` (single/bulk)
  - DataTables: `datatables.list_projects`, `datatables.list_tables`, `datatables.query_rows` (MQL), `datatables.insert_row`, `datatables.update_row`, `datatables.delete_row`
  - Object Storage: `storage.list_buckets`, `storage.list_objects`, `storage.get_object_info`, `storage.get_download_url`, `storage.delete_object`
- [x] Auth: JWT Bearer or API key

## Web
- [x] MCP Server detail page displays 3 meta-tools (list_actions, get_action_docs, execute) with usage examples
- [x] "Connect" tab shows endpoint URL + config snippets (Cursor, Claude Code, Antigravity)
- [x] Authentication guide (API Key recommended, JWT fallback)
