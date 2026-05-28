<feature>
  <meta>
    <id>storage_delete</id>
    <title>Delete object</title>
    <group>Object Storage</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Delete files from a bucket. Removes both the file on disk and metadata in DB.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>delete unnecessary files</action>
      <benefit>free up storage space</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] DELETE /api/storage/buckets/:bucketId/objects/:key → delete file + metadata
- [x] Return 404 if object does not exist

## Web
- [x] Delete button on each file row
- [x] Click → confirmation dialog
- [x] Confirm → file disappears from list
