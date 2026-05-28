<feature>
  <meta>
    <id>storage_engine</id>
    <title>Local storage engine</title>
    <group>Object Storage</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Engine for storing files on local filesystem. Files are organized by bucket,
    each file has metadata (name, size, content-type). This is the foundation for
    all Storage features.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>System</actor>
      <action>store and manage files on local disk</action>
      <benefit>no cloud service dependency, data resides on server</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] Storage directory configurable via env `STORAGE_PATH` (default: ./data/storage)
- [x] Files stored in structure: {STORAGE_PATH}/{bucketName}/{objectKey}
- [x] Metadata stored in DB: id, bucketId, key, size, contentType, createdAt
- [x] Support binary files (image, pdf, zip, etc.)
