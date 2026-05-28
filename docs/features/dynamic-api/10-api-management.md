<feature>
  <meta>
    <id>dynamic_api_management</id>
    <title>API management page</title>
    <group>Dynamic API</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Overview management page for all dynamic API endpoints. Displays list of
    APIs with method, path, status, execution mode, dependency count, call
    statistics.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>open API Management page to manage all endpoints</action>
      <benefit>get an overview and manage all dynamic endpoints</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] Toolbar: New API, Delete selected.

## Web
- [x] Page displays table: Name, Method (colored badge), Path, Status (Active/Inactive), Mode (Fast/Isolated), Deps count, Last Called, Created At.
- [x] Search bar: search by name or path.
- [x] Filter: by method, status, execution mode.
- [x] Click row → navigate to editor page.
- [x] Method badge color: GET=green, POST=blue, PUT=orange, PATCH=purple, DELETE=red.
- [x] Quick actions on row: Edit, Toggle, Delete, Copy URL.
- [x] Mode indicator: ⚡ Fast (no deps) | 📦 Isolated (has deps).
