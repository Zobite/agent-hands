<feature>
  <meta>
    <id>storage_file_browser</id>
    <title>File browser UI</title>
    <group>Object Storage</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    File management UI within a bucket: file list, upload, download,
    delete, preview. Supports folder navigation.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>browse, upload, download files via web UI</action>
      <benefit>manage files visually instead of using API</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] GET /api/storage/buckets/:bucketId/objects → list objects (supports prefix filter for folders)

## Web
- [x] File browser page displays file list: name, size, type, modified date
- [x] Breadcrumb navigation for folders
- [x] Upload button, New Folder button
- [x] Per-file actions: Download, Copy URL, Delete
- [x] Image preview inline (thumbnail)
- [x] Empty state when bucket is empty
