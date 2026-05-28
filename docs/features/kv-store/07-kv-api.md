<feature>
  <meta>
    <id>kv_api</id>
    <title>KV entries API CRUD</title>
    <group>KV Store</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Full RESTful API for CRUD operations on KV namespaces and entries.
    This API is used by the frontend UI, MCP tools, and Dynamic APIs.
    Base: /api/kv-namespaces, /api/kv-namespaces/:namespaceId/entries
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Frontend / MCP Tool / Dynamic API</actor>
      <action>call API to read/write KV entries</action>
      <benefit>interact with KV store via HTTP</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] Namespace CRUD: GET (list), POST (create), GET /:id, PATCH /:id, DELETE /:id
- [x] GET /api/kv-namespaces/:namespaceId/entries — list (query: search, sort, order, page, limit), auto-filter expired
- [x] GET .../entries/by-key/:key — get by key (404 if expired)
- [x] GET .../entries/:id — get by ID
- [x] POST .../entries { key, value, type?, ttl? } — create/upsert
- [x] POST .../entries/bulk { entries: [...] } — batch create/upsert
- [x] PATCH .../entries/:id { value?, type?, ttl? } — update
- [x] DELETE .../entries/:id — delete single
- [x] DELETE .../entries — flush all in namespace
- [x] All endpoints require auth (JWT or API key)
