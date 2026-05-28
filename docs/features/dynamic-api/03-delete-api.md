<feature>
  <meta>
    <id>dynamic_api_delete</id>
    <title>Delete API endpoint</title>
    <group>Dynamic API</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User deletes an API endpoint. Endpoint stops working immediately, all
    requests to that path return 404. Warm instance is evicted, per-endpoint
    node_modules folder (if any) is cleaned up.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>delete an API endpoint that is no longer needed</action>
      <benefit>remove endpoint from system, free resources</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] "Delete" button on API row or editor page.
- [x] Click → confirmation dialog "Delete API [name]?".
- [x] Confirm → delete from DB, evict warm instance, delete folder data/dynamic-apis/{id}/ (if exists), path returns 404 immediately.
- [x] After successful deletion, navigate to API management page.
- [x] API: DELETE /api/dynamic-apis/:id.

## Web
- [x] Cancel → no changes.
