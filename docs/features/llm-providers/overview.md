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
    LLM Providers allows users to manage LLM (Large Language Model) providers
    in the system. Each provider entry contains:
    - Provider type (openrouter, openai, gemini, anthropic, ollama, etc.)
    - API Key
    - Custom Base URL (empty → use provider's default)
    - Models list fetched and stored at creation time

    When creating a new provider, the system uses the API key + base URL
    to fetch the models list from that provider. If fetch fails (wrong key,
    wrong URL, provider unresponsive) → creation is rejected with an error.
    The models list is stored directly in the DB entry, subsequent uses
    read from DB without calling the provider again.

    Supports full CRUD: create, view, edit, delete provider.
  </overview>
</feature>

## Features (atomic — in priority order)

| #  | Feature                           | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | CRUD LLM Provider                 | [01-llm-provider-crud.md](01-llm-provider-crud.md)              | ⬜ Planned | p0       |
