<feature>
  <meta>
    <id>storage_s3_api</id>
    <title>S3-compatible API</title>
    <group>Object Storage</group>
    <status>done</status>
    <priority>p1</priority>
  </meta>

  <overview>
    S3-compatible API that allows using AWS SDK or S3 clients to interact
    with Storage. Supports basic operations: ListBuckets, ListObjects,
    GetObject, PutObject, DeleteObject.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Developer / External Service</actor>
      <action>use AWS S3 SDK/CLI to interact with Storage</action>
      <benefit>integrate with existing systems using S3 protocol</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] S3-compatible endpoints mounted at /s3/
- [x] Supported operations: ListBuckets, ListObjects, GetObject, PutObject, DeleteObject
- [x] Auth via Access Key ID + Secret Access Key (S3 Signature v4)
- [x] Response format XML matching S3
