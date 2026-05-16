<feature>
  <meta>
    <id>llm_provider_crud</id>
    <title>CRUD LLM Provider</title>
    <group>LLM Providers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Quản lý đầy đủ vòng đời của LLM Provider: tạo mới, xem danh sách,
    chỉnh sửa, và xoá. Khi tạo mới, hệ thống fetch danh sách models
    từ provider và lưu vào DB. Nếu fetch thất bại → reject, không cho tạo.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>thêm một LLM Provider mới (chọn provider type, nhập API key, tuỳ chọn base URL)</action>
      <benefit>hệ thống kết nối được tới provider đó và có sẵn danh sách models để dùng</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>xem danh sách tất cả LLM Providers đã cấu hình</action>
      <benefit>biết được hệ thống đang kết nối tới những provider nào</benefit>
    </story>
    <story id="US-03">
      <actor>User</actor>
      <action>chỉnh sửa thông tin provider (API key, base URL)</action>
      <benefit>cập nhật credentials hoặc endpoint khi cần</benefit>
    </story>
    <story id="US-04">
      <actor>User</actor>
      <action>xoá một LLM Provider</action>
      <benefit>dọn dẹp provider không còn sử dụng</benefit>
    </story>
    <story id="US-05">
      <actor>Hệ thống</actor>
      <action>fetch danh sách models từ provider khi tạo/cập nhật</action>
      <benefit>lưu sẵn models vào DB, không cần gọi lại provider mỗi lần sử dụng</benefit>
    </story>
  </user-stories>
</feature>

## Server

### Schema / DB
- ✅ Collection `llm_providers` với các field:
  - `id` (string, auto-generated, prefix `llm_`)
  - `name` (string, tên hiển thị do user đặt, ví dụ "My OpenAI")
  - `providerType` (enum: `openrouter` | `openai` | `gemini` | `anthropic` | `ollama` | `custom`)
  - `apiKey` (string, stored plain — masked in API responses)
  - `baseUrl` (string | null, rỗng → dùng default URL của provider type)
  - `models` (JSON string of `{ id: string, name: string }[]`, danh sách models đã fetch)
  - `createdAt`, `updatedAt` (timestamps)

### Provider Registry (default base URLs)
- ✅ Map provider type → default base URL:
  - `openai` → `https://api.openai.com/v1`
  - `openrouter` → `https://openrouter.ai/api/v1`
  - `anthropic` → `https://api.anthropic.com/v1`
  - `gemini` → `https://generativelanguage.googleapis.com/v1beta`
  - `ollama` → `http://localhost:11434`
  - `custom` → bắt buộc nhập base URL

### Fetch Models Logic
- ✅ Hàm `fetchModelsFromProvider(providerType, apiKey, baseUrl)`:
  - Gọi endpoint list-models của từng provider type (GET /models hoặc tương đương)
  - Trả về `{ id, name }[]`
  - Xử lý response format khác nhau cho từng provider (OpenAI-compatible, Gemini REST, Anthropic)
  - Timeout 15s, retry 1 lần
  - Nếu lỗi (401, 403, timeout, network error) → throw với message rõ ràng

### API Endpoints
- ✅ `POST /api/llm-providers` — Tạo provider mới
  - Body: `{ name, providerType, apiKey, baseUrl? }`
  - Flow: validate input → fetch models từ provider → nếu OK thì lưu provider + models vào DB → trả về provider object
  - Nếu fetch models thất bại → trả 400 kèm error message
- ✅ `GET /api/llm-providers` — List tất cả providers
  - Trả về array providers (mask API key, chỉ hiện 4 ký tự cuối)
- ✅ `GET /api/llm-providers/:id` — Get chi tiết 1 provider
  - Trả kèm danh sách models, mask API key
- ✅ `PUT /api/llm-providers/:id` — Update provider
  - Cho phép update: `name`, `apiKey`, `baseUrl`
  - Nếu `apiKey` hoặc `baseUrl` thay đổi → re-fetch models
  - Nếu re-fetch thất bại → trả 400, không update
- ✅ `DELETE /api/llm-providers/:id` — Xoá provider
- ✅ `POST /api/llm-providers/:id/refresh-models` — Fetch lại models
  - Dùng API key + base URL đã lưu, gọi lại fetch models
  - Nếu thất bại → trả 400, giữ nguyên models cũ

## Web

### Trang danh sách providers (`/llm-providers`)
- ✅ Hiển thị danh sách LLM Providers dạng cards
  - Mỗi card hiện: name, provider type (label + tag), số models, base URL (Custom/Default), ngày tạo
  - API key hiển thị dạng masked (ví dụ `••••••••abcd`)
- ✅ Nút "Add Provider" ở header → mở dialog tạo mới
- ✅ Mỗi provider có action buttons: Edit, Refresh Models, Delete

### Dialog tạo/sửa provider
- ✅ Form gồm:
  - `Name` (text input, bắt buộc)
  - `Provider Type` (select: OpenRouter, OpenAI, Gemini, Anthropic, Ollama, Custom)
  - `API Key` (password input, bắt buộc trừ Ollama)
  - `Base URL` (text input, optional — placeholder hiện default URL tương ứng provider type)
- ✅ Khi chọn provider type → placeholder của Base URL tự động cập nhật
- ✅ Nút Save:
  - Gọi API tạo/update
  - Hiện loading state khi đang fetch models
  - Nếu thất bại → hiện error message via toast
  - Nếu thành công → đóng dialog, refresh danh sách

### Xoá provider
- ✅ Click Delete → confirmation dialog → gọi API xoá → refresh danh sách

### Refresh Models
- ✅ Click "Refresh Models" → gọi API refresh → cập nhật lại số models trên card
- ✅ Hiện toast thành công/thất bại
