<feature>
  <meta>
    <id>kv_namespaces</id>
    <title>Namespaces (REMOVED)</title>
    <group>KV Store</group>
    <status>removed</status>
    <priority>p1</priority>
  </meta>

  <overview>
    ~~KV entries were organized into namespaces.~~

    **REMOVED** (2026-05-26): Namespace layer has been removed for simplicity.
    KV store is now flat — keys are globally unique.
    Users can use prefixes in keys for organization
    (e.g. `config.api_url`, `cache.token`).
  </overview>
</feature>
