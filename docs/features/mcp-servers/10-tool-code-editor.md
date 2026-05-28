<feature>
  <meta>
    <id>mcp_tool_code_editor</id>
    <title>Tool code editor</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Embedded code editor in the UI that allows users to write JavaScript code
    for tools. Editor supports syntax highlighting, auto-completion for the
    context SDK, and displays example snippets.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>write JavaScript code in the editor on the tool page</action>
      <benefit>develop tool logic directly in the browser, no external IDE needed</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] (No server changes — editor is purely frontend)

## Web
- [ ] Use Monaco Editor (via @monaco-editor/react) with JavaScript language mode.
- [ ] JavaScript syntax highlighting, ESNext + ESM support.
- [ ] Line numbers, bracket matching, bracket pair colorization.
- [ ] Custom CompletionItemProvider for `context.*` SDK autocomplete:
  - `context.log(...)` — debug logging
  - `context.http.get/post/patch/delete(...)` — HTTP helper
  - `context.kv.get/set(...)` — KV Store
  - `context.tables.query/insert(...)` — DataTables
- [ ] Custom HoverProvider for `execute`, `params`, `context` keywords.
- [ ] TypeScript-style type declarations via `addExtraLib` for IntelliSense.
- [ ] Word wrap toggle button.
- [ ] Example snippets dropdown: Hello World, Echo Params, Fetch API, KV Store, npm (lodash).
- [ ] Diff editor mode for AI-generated code changes (accept/reject).
- [ ] JetBrains Mono / Fira Code font with ligatures.
- [ ] Keyboard shortcuts: Ctrl+S / Cmd+S to save.
