<feature>
  <meta>
    <id>kv_delete</id>
    <title>Delete KV entry</title>
    <group>KV Store</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User deletes one or more KV entries. Supports single deletion and
    flushing all entries in a namespace.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>delete a KV entry that is no longer needed</action>
      <benefit>clean up key-value data</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] DELETE /api/kv-namespaces/:namespaceId/entries/:id → delete single entry
- [x] DELETE /api/kv-namespaces/:namespaceId/entries → flush all entries in namespace
- [x] Return 404 if entry does not exist

## Web
- [x] Delete button on each entry row or context menu
- [x] Click → confirmation dialog → delete
- [x] "Flush namespace" button → delete all entries (confirm dialog)
- [x] Toast notification after successful deletion
