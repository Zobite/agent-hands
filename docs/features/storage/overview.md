<feature>
  <meta>
    <id>storage_overview</id>
    <title>Object Storage — Overview</title>
    <group>Object Storage</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    Storage is a self-hosted object storage system, operating similarly to
    MinIO/S3. The app acts as a storage server — storing files on local
    disk, exposing an S3-compatible API so external clients can connect using
    AWS SDK, MinIO SDK, mc CLI, or any S3-compatible client.

    Supports: buckets, upload/download objects, public files (direct URL),
    presigned URLs (time-limited), and a file management UI on the web.
    Internally: other features (Dynamic API, agents...) also access
    storage via the internal service layer.
  </overview>
</feature>

## Features (atomic — in priority order)

| #  | Feature                           | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | Local storage engine              | [01-storage-engine.md](01-storage-engine.md)                    | ⬜ Planned | p0       |
| 02 | Bucket management                 | [02-bucket-management.md](02-bucket-management.md)              | ⬜ Planned | p0       |
| 03 | Upload object                     | [03-upload-object.md](03-upload-object.md)                      | ⬜ Planned | p0       |
| 04 | Download object                   | [04-download-object.md](04-download-object.md)                  | ⬜ Planned | p0       |
| 05 | Delete object                     | [05-delete-object.md](05-delete-object.md)                      | ⬜ Planned | p0       |
| 06 | S3-compatible API                 | [06-s3-compatible-api.md](06-s3-compatible-api.md)              | ⬜ Planned | p0       |
| 07 | Public file URL                   | [07-public-url.md](07-public-url.md)                            | ⬜ Planned | p0       |
| 08 | Presigned URL (time-limited)      | [08-presigned-url.md](08-presigned-url.md)                      | ⬜ Planned | p0       |
| 09 | File browser UI                   | [09-file-browser-ui.md](09-file-browser-ui.md)                  | ⬜ Planned | p1       |
| 10 | Access keys management            | [10-access-keys.md](10-access-keys.md)                          | ⬜ Planned | p1       |
