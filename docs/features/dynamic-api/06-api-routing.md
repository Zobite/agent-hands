<feature>
  <meta>
    <id>dynamic_api_routing</id>
    <title>API request routing</title>
    <group>Dynamic API</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Catch-all router for prefix /apis/* → matches with registered dynamic API
    endpoints. Supports path params, method matching, and fallback 404. Route
    table cached in memory, invalidated on dynamic-apis CRUD.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>External client</actor>
      <action>call GET /apis/my-endpoint</action>
      <benefit>request is routed to the corresponding JS/TS handler</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] All requests /apis/* are caught by dynamic router.
- [x] Router matches by: method + path pattern (exact match or param match).
- [x] Only routes to endpoints with isActive = true.
- [x] No match → return 404 { error: "Endpoint not found" }.
- [x] Method mismatch (path matches but different method) → return 405 Method Not Allowed.
- [x] Route table cached in memory, invalidated on dynamic-apis CRUD.
- [x] Auth option: each API endpoint can be configured to require JWT or be public.

## Web
- [x] Path params: /users/:id → request.params = { id: "123" }.
