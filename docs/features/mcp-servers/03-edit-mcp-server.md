<feature>
  <meta>
    <id>mcp_edit_server</id>
    <title>Edit MCP server</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User edits information of a custom MCP server (name, description).
    Built-in server cannot be edited.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click Edit on a custom MCP server</action>
      <benefit>update server name or description</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] API: PATCH /api/mcp-servers/:id → { name?, description? }.

## Web
- [ ] Edit button on each custom MCP server card/row.
- [ ] Built-in server does NOT show Edit button (except description).
- [ ] Edit dialog: Name (editable), Description (editable).
- [ ] Validation: Name unique, same rules as creation.
- [ ] Save → list updates, success toast.
- [ ] If server does not exist → 400 not_found.
- [ ] If builtin → 403 forbidden (cannot edit name).
