<feature>
  <meta>
    <id>table_row_crud</id>
    <title>Add/edit/delete rows</title>
    <group>Dynamic Table</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User performs CRUD operations on rows (records) of a table. Inline editing
    directly on cells. Supports multi-select, bulk delete, pagination.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "New" or "+" button at the bottom of the table</action>
      <benefit>quickly add a new record</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>click on a cell and enter data directly</action>
      <benefit>edit data inline without opening a dialog</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] POST /api/databases/:dbId/tables/:id/rows { data: { columnId: value } } → add row
- [x] PATCH /api/databases/:dbId/tables/:id/rows/:rowId { data } → update row
- [x] DELETE /api/databases/:dbId/tables/:id/rows/:rowId → delete row
- [x] Row data stored as flexible JSON: { columnId: value, ... }
- [x] Pagination: default 50 rows per page

## Web
- [x] "New" button or "+" row at bottom of table → add new empty row
- [x] Click cell → inline edit mode, auto-save on blur or Enter
- [x] Right-click row → context menu: Delete
- [x] Checkbox column for multi-select → "Delete selected" button
- [x] Scroll to load more rows (infinite scroll / pagination)
