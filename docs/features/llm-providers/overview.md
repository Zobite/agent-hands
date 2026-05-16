<feature>
  <meta>
    <id>llm_providers_overview</id>
    <title>LLM Providers — Overview</title>
    <group>LLM Providers</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-05-08</updated>
  </meta>

  <overview>
    LLM Providers cho phép người dùng quản lý các nhà cung cấp LLM
    (Large Language Model) trong hệ thống. Mỗi provider entry chứa:
    - Provider type (openrouter, openai, gemini, anthropic, ollama, v.v.)
    - API Key
    - Base URL tuỳ chỉnh (rỗng → dùng default của provider)
    - Danh sách models được fetch và lưu sẵn tại thời điểm tạo

    Khi tạo mới một provider, hệ thống sẽ dùng API key + base URL
    để fetch danh sách models từ provider đó. Nếu fetch thất bại
    (sai key, sai URL, provider không phản hồi) → không cho tạo, trả lỗi.
    Danh sách models được lưu trực tiếp vào DB entry, các lần sử dụng
    sau lấy từ DB mà không cần gọi lại provider.

    Hỗ trợ CRUD đầy đủ: tạo, xem, sửa, xoá provider.
  </overview>
</feature>

## Tính năng (atomic — theo thứ tự ưu tiên)

| #  | Tính năng                         | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | CRUD LLM Provider                 | [01-llm-provider-crud.md](01-llm-provider-crud.md)              | ⬜ Planned | p0       |
