<feature>
  <meta>
    <id>kv_data_types_ttl</id>
    <title>Data types & TTL</title>
    <group>KV Store</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    KV entries support multiple data types and configurable TTL (Time To Live).
    When TTL expires, the entry is automatically deleted or marked as expired.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User / Agent</actor>
      <action>create a KV entry with TTL for temporary caching</action>
      <benefit>data is automatically cleaned up after a set period</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] Data types: string, number, boolean, json (object/array)
- [x] Value stored as text in DB, type metadata used for parse/validate on read
- [x] TTL: seconds, 0 or null = persistent (no expiration)
- [x] expiresAt in DB = createdAt + TTL seconds, null if persistent
- [x] Lazy check: API returns 404 if entry has expired (even if not physically deleted)
- [x] Auto-detect type: "123" → number, "true"/"false" → boolean, "{...}" → json

## Web
- [x] TTL displayed as countdown or "No expiry" on each entry row
- [x] Type displayed as badge (string/number/boolean/json)
- [x] Expired entries → hidden from list (or displayed with strikethrough)
