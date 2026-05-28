<feature>
  <meta>
    <id>table_edit</id>
    <title>Edit table (name, description)</title>
    <group>Dynamic Table</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User edits table metadata: name, description, icon.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click on table name or "Edit" icon on header</action>
      <benefit>update table information without affecting data</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] PATCH /api/databases/:dbId/tables/:id { name?, description?, icon? }
- [x] Table name validated for uniqueness

## Web
- [x] Click table name on header → inline edit or dialog
- [x] Edit: name, description, icon
- [x] Save → UI updates immediately
