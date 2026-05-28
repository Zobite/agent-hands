<feature>
  <meta>
    <id>storage_bucket</id>
    <title>Bucket management</title>
    <group>Object Storage</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    CRUD operations for storage buckets. Each bucket is a logical container
    for files, with a name and visibility setting (public/private).
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>create a new bucket to organize files</action>
      <benefit>categorize files by project/purpose</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] POST /api/storage/buckets { name, isPublic? } → create bucket
- [x] GET /api/storage/buckets → list all buckets
- [x] PATCH /api/storage/buckets/:id { name?, isPublic? } → update
- [x] DELETE /api/storage/buckets/:id → delete bucket + all objects inside
- [x] Bucket name unique, alphanumeric + dash

## Web
- [x] Storage page displays bucket list
- [x] "New Bucket" button → dialog: name, visibility
- [x] Click bucket → navigate to file browser
- [x] Context menu: Edit, Delete bucket
