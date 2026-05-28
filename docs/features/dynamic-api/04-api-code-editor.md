<feature>
  <meta>
    <id>dynamic_api_code_editor</id>
    <title>API code editor</title>
    <group>Dynamic API</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Monaco editor for writing JavaScript code to handle API requests. Supports
    syntax highlighting, custom auto-complete for request/context (only shows
    SDK properties, not junk suggestions), hover type info, error markers,
    and example snippets.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>write JS/TS code in editor with code completion</action>
      <benefit>good coding experience, fewer errors</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] Custom auto-complete: `request.` → method, path, params, query, headers, body. `context.` → log(). Only shows SDK properties, disables word-based + TS built-in suggestions. Hover shows type info (HandlerRequest, HandlerContext, HandlerResponse).

## Web
- [x] Monaco editor with JavaScript/TypeScript language mode.
- [x] Syntax highlighting for JS/TS.
- [x] Ctrl+S / Cmd+S → save code.
- [x] Line numbers, word wrap toggle.
- [x] Error markers displayed for JS/TS syntax errors (lint before save).
- [x] Sidebar reference panel: list of available context SDK methods (bindings).
- [x] Dependencies editor: textarea or JSON editor for entering npm packages + versions.
