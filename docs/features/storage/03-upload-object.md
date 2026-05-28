<feature>
  <meta>
    <id>storage_upload</id>
    <title>Upload object</title>
    <group>Object Storage</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Upload files to a bucket. Supports single file upload, multi-file,
    folder upload, and drag-drop.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>upload files to a bucket</action>
      <benefit>store files on the server</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] POST /api/storage/buckets/:bucketId/objects (multipart/form-data) → upload file
- [x] Save file to disk + metadata to DB
- [x] Support path/folder structure: key = "folder/subfolder/file.txt"
- [x] Return object metadata after upload

## Web
- [x] "Upload" button on file browser → file picker
- [x] Drag & drop files into browser area
- [x] Progress bar during upload
- [x] Success toast after upload
