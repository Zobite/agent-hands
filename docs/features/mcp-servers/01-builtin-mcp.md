<feature>
  <meta>
    <id>mcp_builtin</id>
    <title>Built-in MCP Server (System Tools)</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    MCP server tích hợp sẵn, expose toàn bộ tính năng hệ thống (Variables, Tables,
    Documents, Storage) cho AI agents qua 3 meta-tools: get_overview, get_docs, execute.
    Agents gọi execute({ action, payload }) để thực hiện bất kỳ action nào.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>AI Agent (Claude, GPT, etc.)</actor>
      <action>connect MCP server → gọi get_overview → chọn action → execute</action>
      <benefit>truy cập toàn bộ hệ thống qua MCP protocol</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] MCP server chạy tại /api/mcp/:serverId (Streamable HTTP transport)
- [x] 3 meta-tools: get_overview, get_docs({ action }), execute({ action, payload })
- [x] Action registry quản lý tất cả actions, validate payload bằng Zod
- [x] Danh sách actions đã register:
  - Variables: `variables.list`, `variables.get`, `variables.set`, `variables.delete`
  - Variable Namespaces: `variable_namespaces.list`, `variable_namespaces.create`, `variable_namespaces.update`, `variable_namespaces.delete`
  - Databases & Tables: `databases.list`, `tables.list`, `tables.query`, `tables.insert`, `tables.update`, `tables.delete`
  - Documents: `projects.list`, `documents.list`, `documents.get`, `documents.create`, `documents.update`
  - Storage: `storage.list_buckets`, `storage.list_objects`, `storage.get_object_info`, `storage.get_download_url`, `storage.delete_object`
  - Web: `web.fetch`
- [x] Auth: JWT Bearer hoặc API key

## Web
- [x] Trang MCP Server detail hiển thị 3 meta-tools với usage examples
- [x] Tab "Connect" hiển thị endpoint URL + config snippets (Cursor, Claude Code, Antigravity)
- [x] Hướng dẫn authentication (API Key recommended, JWT fallback)
