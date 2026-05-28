<feature>
  <meta>
    <id>mcp_js_sandbox</id>
    <title>JavaScript sandbox executor</title>
    <group>MCP Servers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    When an AI agent calls a tool, the system executes JavaScript code in a
    Bun subprocess sandbox. The sandbox automatically detects npm imports
    from code and installs them, caching node_modules per tool so subsequent
    runs are fast.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>AI Agent</actor>
      <action>call tool via MCP protocol</action>
      <benefit>tool JavaScript code is executed safely in sandbox and returns result</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>write tool code with npm imports (lodash, axios, etc.)</action>
      <benefit>packages are automatically installed without manual configuration</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [ ] Sandbox runs JavaScript code in a separate Bun subprocess, isolated from main process.
- [ ] Each tool has its own **sandbox directory**, cached on disk: ``` data/mcp-tool-sandboxes/<toolId>/ ├── tool.mjs           # User code (ES module) ├── runner.js          # Runner script ├── package.json       # Auto-generated ├── node_modules/      # Installed npm packages ├── deps.json          # Deps hash for change detection └── last_used.txt      # Timestamp — used for GC ```
- [ ] **Auto-detect dependencies**: Before execution, sandbox parses code to find import/require statements: 1. Parse JS code → extract all `import X from "pkg"`, `const X = require("pkg")`, `await import("pkg")`. 2. Remove Node/Bun built-in modules (fs, path, http, crypto, ...). 3. Extract npm package names (handles scoped packages like `@aws-sdk/client-s3`). 4. Compare with current deps.json → only `bun install` when dependencies change.
- [ ] **Two execution modes**: 1. **Fast mode** (no npm imports): executes in-process using `AsyncFunction` constructor — very fast (~ms). 2. **Isolated mode** (has npm imports): spawns `bun run runner.js` in sandbox with node_modules — first run may take a few seconds for install.
- [ ] **First run with npm deps**: create sandbox dir + bun install → may take 5-15s depending on packages. Second run onwards: reuse cached node_modules → only execution time (~ms if code is lightweight).
- [ ] Execution flow: 1. Receive tool call: { toolId, params }. 2. Load tool code from DB. 3. Check for npm imports → select fast vs isolated mode. 4. [Isolated] Find or create sandbox, install deps if changed. 5. Write tool.mjs (user code as ES module) + runner.js. 6. Spawn `bun run runner.js` in sandbox, pass params via stdin. 7. Parse result JSON from stdout (between __RESULT_START__ / __RESULT_END__ markers). 8. Return result or error.
- [ ] **Timeout**: default 30s, configurable per tool. Exceeding timeout → kill process, return error.
- [ ] **Context SDK injection**: JavaScript code receives `context` object with methods: ```javascript // Context SDK — access internal services context.log(...args)                    // Debug logging context.http.get(url, headers?)         // HTTP GET context.http.post(url, data?, headers?) // HTTP POST context.http.patch(url, data?, headers?)// HTTP PATCH context.http.delete(url, headers?)      // HTTP DELETE context.kv.get(key)                     // KV Store: get value context.kv.set(key, value, ttl?)        // KV Store: set value context.tables.query(projectId, tableId, filters?, page?, limit?) // DataTables: query context.tables.insert(projectId, tableId, data)                   // DataTables: insert ```
- [ ] **User code format**: ```javascript export default async function execute(params, context) { // Tool logic here return { result: "..." }; } ```
- [ ] **Error handling**: - Syntax error → return error message. - Runtime exception → return error message + stacktrace (dev mode) or generic message (production). - Timeout → return timeout error. - Missing dependency install fail → return error + bun install output.
- [ ] **Sandbox garbage collection**: A scheduled job deletes sandboxes unused > 7 days (configurable) to save disk.

## Web
- [ ] (No web changes — sandbox is server-side only)
