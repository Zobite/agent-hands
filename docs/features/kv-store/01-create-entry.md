<feature>
  <meta>
    <id>kv_create</id>
    <title>Create KV entry</title>
    <group>KV Store</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User creates a new KV entry (key-value pair). Key is unique within
    the namespace, value can be string, number, boolean, or JSON object.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "Add Entry" on the KV Store page</action>
      <benefit>store key-value data for agents or APIs to use</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] POST /api/kv-namespaces/:namespaceId/entries { key, value, type?, ttl? } → create entry
- [x] Key unique within namespace — if key already exists → upsert (update value)
- [x] Key only allows alphanumeric, hyphens, underscores, dots, max 255 characters
- [x] Auto-detect type if not provided: "123" → number, "true"/"false" → boolean, "{...}" → json
- [x] TTL = 0 or null → persistent (no expiration)

## Web
- [x] "Add Entry" button on the KV browser page
- [x] Click → dialog: Key (required), Value (required), Type (auto-detect or select), TTL (optional, seconds)
- [x] Save → entry appears in the list
- [x] Entry is created in the currently selected namespace
