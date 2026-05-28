<feature>
  <meta>
    <id>mcp_delete_tool</id>
    <title>Delete tool</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User deletes a tool from a custom MCP server. Deleted tool will no longer
    be available to AI agents. System tools (built-in) cannot be deleted.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click Delete on a tool</action>
      <benefit>remove a tool that is no longer needed</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] Confirm → delete tool from DB, update list.
- [ ] Deleting a tool also removes related sandbox cache (node_modules in mcp-tool-sandboxes/) if any.
- [ ] API: DELETE /api/mcp-servers/:serverId/tools/:toolId.

## Web
- [ ] Delete button on each custom tool (icon or dropdown menu).
- [ ] System tools do NOT have a Delete button.
- [ ] Click Delete → confirmation dialog.
- [ ] If system tool → 403 forbidden.
- [ ] If tool does not exist → 400 not_found.
