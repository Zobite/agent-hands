<feature>
  <meta>
    <id>table_create</id>
    <title>Create new table</title>
    <group>Dynamic Table</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User creates a new table in a database. Each table has a name, description,
    and custom column set. Newly created tables come with a default "Title" column.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "New Table" on the Tables page</action>
      <benefit>create a custom database to store and manage structured data</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] POST /api/databases/:dbId/tables { name, description?, icon? } → create new table
- [x] New table automatically has a "Title" column (type: text, primary)
- [x] Table name unique within database

## Web
- [x] "New Table" button on the table list page
- [x] Click → dialog: Name (required), Description (optional), Icon (emoji picker)
- [x] Save → new table appears in the list
- [x] Cancel → close dialog, no creation
