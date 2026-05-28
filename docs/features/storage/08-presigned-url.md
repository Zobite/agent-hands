<feature>
  <meta>
    <id>storage_presigned_url</id>
    <title>Presigned URL</title>
    <group>Object Storage</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    Create temporary (presigned) URLs that allow accessing private files without
    an auth header. URLs have an expiration period (TTL).
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User / API</actor>
      <action>create a presigned URL to share a private file</action>
      <benefit>share files temporarily without granting permanent access</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] POST /api/storage/buckets/:bucketId/objects/:key/presign { expiresIn? } → return signed URL
- [x] URL contains token + expiry, validated on access
- [x] Default TTL: 1 hour, max: 7 days

## Web
- [x] "Get Presigned URL" button on files in private bucket
- [x] Click → copy URL, display expiration time
