<feature>
  <meta>
    <id>kv_browser</id>
    <title>KV browser UI</title>
    <group>KV Store</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    UI for managing KV entries in two levels: namespace list page
    and entry detail page within each namespace. Supports search,
    displaying key, value (truncated), type, TTL remaining, timestamps.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>open the KV Store page to browse and manage key-value pairs</action>
      <benefit>get an overview of all KV entries in the system</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] GET /api/kv-namespaces — list namespaces (name, description, entry count)
- [x] GET /api/kv-namespaces/:namespaceId/entries — list entries (query: search, sort, order, page, limit)
- [x] Auto-filter expired entries (do not return entries that have exceeded TTL)

## Web
- [x] Page /kv displays namespace list: Name, Description, Icon, entry count
- [x] Click namespace → /kv/namespace/:namespaceId → entries table
- [x] Entries table: Key, Value (truncated 100 chars), Type, TTL remaining, Updated At
- [x] Search bar: search by key (debounce 300ms)
- [x] Sort by: key, type, updated_at
- [x] Click row → expand to show full value (JSON formatted if type=json)
- [x] Badge showing TTL remaining (countdown or "No expiry")
- [x] Toolbar: Add Entry, Flush namespace
