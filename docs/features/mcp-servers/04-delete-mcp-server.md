<feature>
  <meta>
    <id>mcp_delete_server</id>
    <title>Delete MCP server</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User deletes a custom MCP server. All tools belonging to that server are
    also deleted (cascade). Built-in server cannot be deleted.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click Delete on a custom MCP server</action>
      <benefit>remove server and all tools that are no longer needed</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] API: DELETE /api/mcp-servers/:id.

## Web
- [ ] Delete button on each custom MCP server card/row.
- [ ] Built-in server does NOT show Delete button.
- [ ] Click Delete → confirmation dialog: "Deleting server [name] will delete all [N] tools belonging to this server. This action cannot be undone."
- [ ] Confirm → delete server + cascade delete all tools belonging to server.
- [ ] After deletion → redirect to MCP Management page, success toast.
- [ ] If builtin → 403 forbidden.
- [ ] If server does not exist → 400 not_found.
