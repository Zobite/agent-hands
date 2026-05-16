# Moro Agent Toolkit — Feature Tree

> Cây tính năng các nhóm cần phát triển. Tài liệu chi tiết cho từng nhóm nằm trong `docs/features/<group>/overview.md`.
>
> **Icons:** ✅ Done · 🚧 In Progress · ⬜ Planned

| Icon | Nhóm tính năng | Overview File | Mô tả |
| :---: | --- | --- | --- |
| 👤 | **User Management** | [features/users/overview.md](features/users/overview.md) | Hệ thống quản lý người dùng: xác thực, phân quyền, quản trị tài khoản. |
| 🔑 | **Dynamic Variables** | [features/variables/overview.md](features/variables/overview.md) | Key-value store giống Redis. Variables tổ chức theo Namespaces. |
| 📊 | **Dynamic Table** | [features/tables/overview.md](features/tables/overview.md) | Database dạng bảng giống Notion. Tables tổ chức theo Databases. |
| 📝 | **Documents** | [features/documents/overview.md](features/documents/overview.md) | Soạn thảo tài liệu block-based giống Notion. Tổ chức theo Project. |
| 📦 | **Storage** | [features/storage/overview.md](features/storage/overview.md) | Object storage tự xây dựng giống MinIO/S3: buckets, upload/download, presigned URLs. |
| 🔌 | **MCP Servers** | [features/mcp-servers/overview.md](features/mcp-servers/overview.md) | Quản lý MCP servers & Tools. Custom servers chứa Python tools chạy trong sandbox. |
| ⚡ | **Dynamic API** | [features/dynamic-api/overview.md](features/dynamic-api/overview.md) | Hệ thống Cloudflare Worker-like API runtime tạo bằng JS/TS trên Bun. |
| ✅🤖 | **LLM Providers** | [features/llm-providers/overview.md](features/llm-providers/overview.md) | Quản lý các nhà cung cấp LLM: API key, base URL, auto-fetch models. |

