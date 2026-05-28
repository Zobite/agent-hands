<feature>
  <meta>
    <id>llm_provider_crud</id>
    <title>CRUD LLM Provider</title>
    <group>LLM Providers</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Full lifecycle management of LLM Provider: create, list, edit, and delete.
    When creating, the system fetches the models list from the provider and
    stores it in DB. If fetch fails → reject, do not create.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>add a new LLM Provider (choose provider type, enter API key, optional base URL)</action>
      <benefit>system can connect to that provider with a ready models list</benefit>
    </story>
    <story id="US-02">
      <actor>User</actor>
      <action>view list of all configured LLM Providers</action>
      <benefit>know which providers the system is connected to</benefit>
    </story>
    <story id="US-03">
      <actor>User</actor>
      <action>edit provider information (API key, base URL)</action>
      <benefit>update credentials or endpoint when needed</benefit>
    </story>
    <story id="US-04">
      <actor>User</actor>
      <action>delete an LLM Provider</action>
      <benefit>clean up unused providers</benefit>
    </story>
    <story id="US-05">
      <actor>System</actor>
      <action>fetch models list from provider on create/update</action>
      <benefit>store models in DB, no need to call provider each time</benefit>
    </story>
  </user-stories>
</feature>

## Server

### Schema / DB
- ✅ Collection `llm_providers` with fields:
  - `id` (string, auto-generated, prefix `llm_`)
  - `name` (string, display name set by user, e.g. "My OpenAI")
  - `providerType` (enum: `openrouter` | `openai` | `gemini` | `anthropic` | `ollama` | `custom`)
  - `apiKey` (string, stored plain — masked in API responses)
  - `baseUrl` (string | null, empty → use provider type's default URL)
  - `models` (JSON string of `{ id: string, name: string }[]`, fetched models list)
  - `createdAt`, `updatedAt` (timestamps)

### Provider Registry (default base URLs)
- ✅ Map provider type → default base URL:
  - `openai` → `https://api.openai.com/v1`
  - `openrouter` → `https://openrouter.ai/api/v1`
  - `anthropic` → `https://api.anthropic.com/v1`
  - `gemini` → `https://generativelanguage.googleapis.com/v1beta`
  - `ollama` → `http://localhost:11434`
  - `custom` → base URL required

### Fetch Models Logic
- ✅ Function `fetchModelsFromProvider(providerType, apiKey, baseUrl)`:
  - Calls list-models endpoint for each provider type (GET /models or equivalent)
  - Returns `{ id, name }[]`
  - Handles different response formats per provider (OpenAI-compatible, Gemini REST, Anthropic)
  - Timeout 15s, retry once
  - On error (401, 403, timeout, network error) → throw with clear message

### API Endpoints
- ✅ `POST /api/llm-providers` — Create new provider
  - Body: `{ name, providerType, apiKey, baseUrl? }`
  - Flow: validate input → fetch models from provider → if OK save provider + models to DB → return provider object
  - If models fetch fails → return 400 with error message
- ✅ `GET /api/llm-providers` — List all providers
  - Returns array of providers (mask API key, show only last 4 characters)
- ✅ `GET /api/llm-providers/:id` — Get single provider detail
  - Returns with models list, masked API key
- ✅ `PUT /api/llm-providers/:id` — Update provider
  - Allows updating: `name`, `apiKey`, `baseUrl`
  - If `apiKey` or `baseUrl` changed → re-fetch models
  - If re-fetch fails → return 400, do not update
- ✅ `DELETE /api/llm-providers/:id` — Delete provider
- ✅ `POST /api/llm-providers/:id/refresh-models` — Re-fetch models
  - Uses stored API key + base URL, calls fetch models again
  - If fails → return 400, keep existing models

## Web

### Provider list page (`/llm-providers`)
- ✅ Display LLM Providers list as cards
  - Each card shows: name, provider type (label + tag), model count, base URL (Custom/Default), creation date
  - API key displayed as masked (e.g. `••••••••abcd`)
- ✅ "Add Provider" button in header → opens creation dialog
- ✅ Each provider has action buttons: Edit, Refresh Models, Delete

### Create/edit provider dialog
- ✅ Form includes:
  - `Name` (text input, required)
  - `Provider Type` (select: OpenRouter, OpenAI, Gemini, Anthropic, Ollama, Custom)
  - `API Key` (password input, required except Ollama)
  - `Base URL` (text input, optional — placeholder shows default URL for selected provider type)
- ✅ When selecting provider type → Base URL placeholder auto-updates
- ✅ Save button:
  - Calls create/update API
  - Shows loading state while fetching models
  - On failure → show error message via toast
  - On success → close dialog, refresh list

### Delete provider
- ✅ Click Delete → confirmation dialog → call delete API → refresh list

### Refresh Models
- ✅ Click "Refresh Models" → call refresh API → update model count on card
- ✅ Show success/failure toast
