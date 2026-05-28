<feature>
  <meta>
    <id>api_keys</id>
    <title>API Keys Management</title>
    <group>User Management</group>
    <status>in_progress</status>
    <priority>p0</priority>
  </meta>

  <overview>
    API keys management allows users to create/revoke keys for API access
    without logging in (JWT). Used for AI agents, MCP tools, and third parties.
    Key format: ltk_xxxx, hashed with SHA-256 before storing in DB.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Admin/Superadmin</actor>
      <action>create an API key with a descriptive name and optional permissions</action>
      <benefit>provision key for agent/service</benefit>
    </story>
    <story id="US-02">
      <actor>Admin/Superadmin</actor>
      <action>view API key list, revoke unused keys</action>
      <benefit>manage security, revoke compromised keys</benefit>
    </story>
    <story id="US-03">
      <actor>AI Agent / External Service</actor>
      <action>call API with header Authorization: Bearer ltk_xxx or X-API-Key: ltk_xxx</action>
      <benefit>access API without username/password</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] GET /api/api-keys — list all API keys (masked, raw key not returned). Admin+ only
- [x] POST /api/api-keys { name, permissions?, expiresAt? } — create new key. Returns raw key once only
- [x] DELETE /api/api-keys/:id — revoke (delete) API key
- [x] Middleware resolveAuth supports authentication via API key (Bearer ltk_xxx or X-API-Key)
- [x] API key hashed with SHA-256, only hash + 8-char prefix stored in DB
- [x] Supports expiration — expired keys are automatically rejected
- [x] Updates last_used_at when key is used

## Web
- [x] API keys management page in settings
- [x] Create key → display raw key once, copy button
- [x] Key list: name, prefix, created, last used, expiry
- [x] Revoke key → confirm dialog → delete
