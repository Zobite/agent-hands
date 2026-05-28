<feature>
  <meta>
    <id>table_delete</id>
    <title>Delete table</title>
    <group>Dynamic Table</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User deletes a table and all its data (rows).
    This action cannot be undone.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>delete an unused table</action>
      <benefit>clean up workspace, free unnecessary data</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] DELETE /api/databases/:dbId/tables/:id → cascade delete all rows

## Web
- [x] Delete button on table row or context menu
- [x] Click Delete → confirmation dialog "Delete table [name]? All [N] rows will be deleted."
- [x] Confirm → table disappears from list
- [x] Success toast notification
