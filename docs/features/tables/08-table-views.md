<feature>
  <meta>
    <id>table_views</id>
    <title>Table views (Table/Board/List)</title>
    <group>Dynamic Table</group>
    <status>planned</status>
    <priority>p2</priority>
  </meta>

  <overview>
    Each table can be displayed in multiple view types: Table (spreadsheet),
    Board (kanban), List. Each view stores its own sort/filter/column visibility settings.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>switch between views (Table / Board / List)</action>
      <benefit>view the same data from different perspectives</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] API to store view config (sort, filter, column visibility, column order) per view
- [ ] CRUD endpoints for views: POST, GET, PATCH, DELETE

## Web
- [ ] Tab bar view on table header: click to switch view
- [ ] Table view: spreadsheet format (default)
- [ ] Board view: kanban by Select column, drag-drop cards between columns
- [ ] List view: compact list, title + key columns
- [ ] Add new view: "+" button → choose view type
