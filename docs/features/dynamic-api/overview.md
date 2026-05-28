<feature>
  <meta>
    <id>dynamic_api_overview</id>
    <title>Dynamic API — Overview</title>
    <group>Dynamic API</group>
    <status>done</status>
    <priority>p0</priority>
    <updated>2026-05-06</updated>
  </meta>

  <overview>
    Dynamic API allows users to create, edit, and delete HTTP API endpoints
    at runtime. Each API endpoint is a JavaScript/TypeScript code file
    stored in the DB. When a request hits the endpoint, the system fetches
    the code from DB and executes it on Bun runtime. Users can create custom
    REST APIs without redeploying the app.

    Architecture inspired by Cloudflare Workers:
    - **Warm Instances**: Handler cached in memory, only reloads when code changes.
    - **Bindings pattern**: Code accesses internal services (Variables, Tables, Docs, Files)
      through an injected `context` object — similar to Cloudflare env bindings.
    - **Console capture**: All console.log/error in handler are captured → saved to logs.
    - **Execution limits**: Timeout + memory limit per endpoint.

    Two execution modes:
    - **Fast mode**: Endpoints without external dependencies → run in-process (vm module),
      cold start ~1-5ms.
    - **Isolated mode**: Endpoints with npm dependencies → run in separate subprocess
      (Bun.spawn) with per-endpoint node_modules, cold start ~20-50ms.
  </overview>
</feature>

## Features (atomic — in priority order)

| #  | Feature                           | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | Create new API endpoint           | [01-create-api.md](01-create-api.md)                            | ✅ Done    | p0       |
| 02 | Edit API endpoint                 | [02-edit-api.md](02-edit-api.md)                                | ✅ Done    | p0       |
| 03 | Delete API endpoint               | [03-delete-api.md](03-delete-api.md)                            | ✅ Done    | p0       |
| 04 | API code editor                   | [04-api-code-editor.md](04-api-code-editor.md)                  | ✅ Done    | p0       |
| 05 | JS/TS runtime for API (Bun)       | [05-api-runtime.md](05-api-runtime.md)                          | ✅ Done    | p0       |
| 06 | API request routing                | [06-api-routing.md](06-api-routing.md)                          | ✅ Done    | p0       |
| 07 | API test panel                     | [07-api-test-panel.md](07-api-test-panel.md)                    | ✅ Done    | p1       |
| 08 | Toggle active/inactive             | [08-toggle-api.md](08-toggle-api.md)                            | ✅ Done    | p1       |
| 09 | API logs & monitoring              | [09-api-logs.md](09-api-logs.md)                                | ✅ Done    | p2       |
| 10 | API management page                | [10-api-management.md](10-api-management.md)                    | ✅ Done    | p0       |

## Architecture Overview

```
Request: POST /apis/users
  │
  ▼
┌─────────────┐    cache hit?     ┌────────────────┐
│   Router     │ ───── yes ─────→ │  Warm Handler  │
│  (match DB)  │                  │  (in memory)   │
└──────┬──────┘                  └───────┬────────┘
       │ no                              │
       ▼                                 ▼
┌──────────────┐              ┌──────────────────┐
│ Load code    │              │  Execute handler │
│ from DB      │              │  with timeout    │
│ + resolve    │              │                  │
│ deps mode    │              │  inject: request │
│ + cache warm │              │  inject: context │
└──────────────┘              │  capture: logs   │
                              └────────┬─────────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │  Return Response│
                              │  + Save logs    │
                              └────────────────┘
```
