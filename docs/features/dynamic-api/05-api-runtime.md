<feature>
  <meta>
    <id>dynamic_api_runtime</id>
    <title>JS/TS runtime for API (Bun)</title>
    <group>Dynamic API</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    When a request hits a dynamic endpoint (`/apis/*`), the system fetches
    JS/TS code from DB and executes it on Bun runtime. Architecture inspired
    by Cloudflare Workers: warm instances, bindings pattern, console capture,
    execution limits. Two execution modes: - **Fast mode**: No external
    dependencies → run in-process (AsyncFunction constructor). Cold start
    ~1-5ms. - **Isolated mode**: Has npm dependencies → run in separate
    subprocess (Bun.spawn) with per-endpoint node_modules. Cold start ~20-50ms.
  </overview>

</feature>

## Server
- [x] (TBD)

## Web
- [x] (TBD)
