<feature>
  <meta>
    <id>kv_edit</id>
    <title>Edit KV entry</title>
    <group>KV Store</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User edits the value, type, and TTL of a KV entry. Key cannot be changed
    (delete and recreate if key change is needed).
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click on an entry in the list → edit value</action>
      <benefit>update runtime value without having to delete and recreate</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] PATCH /api/kv-namespaces/:namespaceId/entries/:id { value?, type?, ttl? }
- [x] Key displayed as read-only, cannot be edited
- [x] Reset TTL countdown if TTL changes

## Web
- [x] Click entry row → inline edit or edit dialog
- [x] Editable fields: Value, Type, TTL
- [x] Key displayed as read-only
- [x] Value editor changes by type: text input (string), number input (number), toggle (boolean), JSON editor (json)
- [x] Save → list updates immediately
