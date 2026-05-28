<feature>
  <meta>
    <id>dynamic_api_edit</id>
    <title>Edit API endpoint</title>
    <group>Dynamic API</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User edits information, code, and dependencies of an API endpoint. Code
    changes take effect immediately — warm instance is invalidated and rebuilt.
    If dependencies change, the system automatically runs `bun install` for
    that endpoint.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click on an API endpoint → edit code or metadata</action>
      <benefit>update API processing logic at runtime</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] Click API row → open editor page/dialog.
- [x] Save (Ctrl+S) → code updated in DB, warm instance invalidated, takes effect on next request.
- [x] If dependencies changed → system runs `bun install --cwd data/dynamic-apis/{id}/` → update per-endpoint node_modules.
- [x] API: PATCH /api/dynamic-apis/:id.

## Web
- [x] Editable fields: Name, Method, Path, Description, Code, Dependencies.
- [x] Code editor (Monaco) with JavaScript/TypeScript syntax highlight, autocomplete.
- [x] Dirty check: warning if leaving page with unsaved changes.
