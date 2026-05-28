<feature>
  <meta>
    <id>storage_public_url</id>
    <title>Public file URL</title>
    <group>Object Storage</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    Files in public buckets can be accessed via direct URL without
    authentication. URL format: /storage/{bucket}/{key}
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>share a direct link to a file in a public bucket</action>
      <benefit>embed images, share files without requiring auth</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] GET /storage/:bucketName/:key → serve file directly (no auth required for public bucket)
- [x] Private bucket → return 403 or require auth
- [x] Set Content-Type header correctly

## Web
- [x] Copy URL button on each file in public bucket
- [x] Inline preview for images
