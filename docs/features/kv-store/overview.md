<feature>
  <meta>
    <id>kv_store_overview</id>
    <title>KV Store — Overview</title>
    <group>KV Store</group>
    <status>done</status>
    <priority>p0</priority>
    <updated>2026-05-26</updated>
  </meta>

  <overview>
    KV Store is a simple key-value store that allows storing and retrieving
    data as key-value pairs. Supports multiple value types (string, number,
    JSON, boolean) and TTL (time-to-live).

    API endpoint: `/api/kv-store`
    No namespace — keys are globally unique.
    Users can use prefixes in keys for organization
    (e.g. `config.api_url`, `cache.token`, `env.production.db_host`).

    Agents can read/write KV entries through MCP tools
    to store state, cache, or runtime config.
  </overview>
</feature>

## Features (atomic — in priority order)

| #  | Feature                           | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | Create KV entry                  | [01-create-entry.md](01-create-entry.md)                        | ✅ Done    | p0       |
| 02 | Edit KV entry                    | [02-edit-entry.md](02-edit-entry.md)                            | ✅ Done    | p0       |
| 03 | Delete KV entry                  | [03-delete-entry.md](03-delete-entry.md)                        | ✅ Done    | p0       |
| 04 | KV browser UI                    | [04-kv-browser.md](04-kv-browser.md)                            | ✅ Done    | p0       |
| 05 | Data types & TTL                 | [05-data-types-ttl.md](05-data-types-ttl.md)                    | ✅ Done    | p1       |
| 06 | ~~Namespaces~~                    | [06-namespaces.md](06-namespaces.md)                            | ❌ Removed | p1       |
| 07 | KV entries API CRUD              | [07-kv-api.md](07-kv-api.md)                                   | ✅ Done    | p0       |
