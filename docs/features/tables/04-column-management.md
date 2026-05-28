<feature>
  <meta>
    <id>table_column_management</id>
    <title>Column management (properties)</title>
    <group>Dynamic Table</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User manages columns (properties) of a table: add new column, change type,
    rename, delete, reorder. Each column has a data type determining input UI and validation.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "+" icon on table header to add a new column</action>
      <benefit>extend table structure with new properties</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] POST .../columns { name, type, config? } → add column
- [x] PATCH .../columns/:colId { name?, type?, config? } → update column
- [x] DELETE .../columns/:colId → delete column + remove from all rows
- [x] Column types: text, number, select, multi_select, date, checkbox, url, email

## Web
- [x] "+" button on table header → new column (choose type)
- [x] Click column header → dropdown menu: Rename, Change type, Delete
- [x] Rename: inline edit on header
- [x] Delete column → confirm dialog
- [x] Drag & drop to reorder columns
