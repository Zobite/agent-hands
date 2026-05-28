<feature>
  <meta>
    <id>storage_access_keys</id>
    <title>Access keys management</title>
    <group>Object Storage</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    Manage Access Key ID + Secret Access Key for S3-compatible API.
    Each key pair has access to Storage via S3 protocol.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Admin</actor>
      <action>create an access key pair for a service/developer</action>
      <benefit>grant S3 API access without using JWT</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] POST /api/storage/access-keys → create key pair, return secret once only
- [x] GET /api/storage/access-keys → list all (masked secret)
- [x] DELETE /api/storage/access-keys/:id → revoke key
- [x] S3 auth middleware validates access key + computes signature v4

## Web
- [x] Access Keys page in Storage settings
- [x] Create key → display Access Key ID + Secret (once), copy button
- [x] Key list: ID, created, last used
- [x] Revoke key → confirm dialog
