<feature>
  <meta>
    <id>storage_download</id>
    <title>Download object</title>
    <group>Object Storage</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Download files from a bucket. Returns binary content with correct content-type.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>download a file from Storage</action>
      <benefit>retrieve files to local machine</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] GET /api/storage/buckets/:bucketId/objects/:key/download → stream file binary
- [x] Set Content-Type, Content-Disposition headers correctly
- [x] Return 404 if object does not exist

## Web
- [x] Download button on each file row
- [x] Click → browser downloads file
- [x] Inline preview for images (display thumbnail)
