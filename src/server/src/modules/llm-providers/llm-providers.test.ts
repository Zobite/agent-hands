/**
 * LLM Providers Module — Integration Tests
 *
 * Tests the LLM providers module CRUD:
 *  - Create provider (validation, auth)
 *  - List providers
 *  - Get provider by ID
 *  - Update provider
 *  - Delete provider
 *  - Refresh models
 *  - Error cases (not found, auth, bad input)
 *
 * Note: Creating a provider requires fetching models from the provider.
 * Since we don't have real API keys in CI, we test the validation and error
 * paths. Tests that create providers will get 400 due to unreachable providers,
 * which is the expected behavior per spec.
 *
 * Uses Fastify inject() — no running server needed.
 * Run: cd src/server && bun test src/modules/llm-providers/llm-providers.test.ts
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createApp } from "../../app.js";
import { runMigrations } from "../../common/db/migrate.js";
import { getDb, closeDb } from "../../common/db/client.js";
import { createSuperAdmin } from "../../common/db/seed.js";
import { signAccess } from "../../common/auth/jwt.js";
import type { FastifyInstance } from "fastify";

// ── Test Config ─────────────────────────────────────────────────────────────────

const TEST_DATA_DIR = join(import.meta.dir, ".test-data-llm-providers");

let app: FastifyInstance;
let adminToken: string;
let memberToken: string;

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

// ── Setup / Teardown ────────────────────────────────────────────────────────────

beforeAll(async () => {
  rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DATA_DIR, { recursive: true });

  process.env.JWT_SECRET = "test-secret-for-llm-providers-32chars!";
  process.env.DATA_DIR = TEST_DATA_DIR;

  runMigrations(TEST_DATA_DIR);
  getDb(TEST_DATA_DIR);

  // Seed superadmin
  const sa = await createSuperAdmin("superadmin", "satest@test.local", "password123", "Super Admin");
  adminToken = await signAccess(sa.id, sa.role);

  // Create app
  app = await createApp();
  await app.ready();

  // Seed member user
  const memberRes = await app.inject({
    method: "POST",
    url: "/api/users",
    headers: { ...authHeader(adminToken), "content-type": "application/json" },
    payload: { username: "member1", email: "member@test.local", password: "password123", name: "Test Member" },
  });
  const memberBody = memberRes.json() as Record<string, unknown>;
  const memberId = (memberBody as { id: string }).id;
  memberToken = await signAccess(memberId, "member");
});

afterAll(async () => {
  await app.close();
  closeDb();
  rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

// ── Tests ────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// Auth — members should be rejected
// ═══════════════════════════════════════════════════════════════════════════════

describe("Auth & Permissions", () => {
  test("no auth → 401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/llm-providers" });
    expect(res.statusCode).toBe(401);
  });

  test("member → 403", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/llm-providers",
      headers: authHeader(memberToken),
    });
    expect(res.statusCode).toBe(403);
  });

  test("admin can access list", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/llm-providers",
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: unknown[]; meta: { total: number } };
    expect(body.items).toEqual([]);
    expect(body.meta.total).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Create — validation & fetch failure
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/llm-providers — Create", () => {
  test("missing name → 422", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/llm-providers",
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: { providerType: "openai", apiKey: "sk-test" },
    });
    expect(res.statusCode).toBe(422);
  });

  test("invalid provider type → 422", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/llm-providers",
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: { name: "Test", providerType: "invalid_type", apiKey: "sk-test" },
    });
    expect(res.statusCode).toBe(422);
  });

  test("create with fake API key → 400 (fetch fails)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/llm-providers",
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: {
        name: "Test OpenAI",
        providerType: "openai",
        apiKey: "sk-fake-key-12345",
      },
    });
    // Should fail because the API key is invalid — provider returns 401
    expect(res.statusCode).toBe(400);
    const body = res.json() as { error: string; message: string };
    expect(body.error).toBe("bad_request");
    expect(body.message.length).toBeGreaterThan(0);
  });

  test("custom provider without baseUrl → 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/llm-providers",
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: {
        name: "Custom Provider",
        providerType: "custom",
        apiKey: "test-key",
      },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json() as { message: string };
    expect(body.message).toContain("Base URL");
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Get / Delete non-existent
// ═══════════════════════════════════════════════════════════════════════════════

describe("Error cases — non-existent IDs", () => {
  test("GET non-existent → 400", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/llm-providers/llm_nonexistent",
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: string }).error).toBe("not_found");
  });

  test("PUT non-existent → 400", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/api/llm-providers/llm_nonexistent",
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: { name: "Updated" },
    });
    expect(res.statusCode).toBe(400);
  });

  test("DELETE non-existent → 400", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/api/llm-providers/llm_nonexistent",
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(400);
  });

  test("refresh-models non-existent → 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/llm-providers/llm_nonexistent/refresh-models",
      headers: authHeader(adminToken),
    });
    expect(res.statusCode).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Ollama — test against local Ollama if available (no key required)
// ═══════════════════════════════════════════════════════════════════════════════

describe("Ollama provider (local, no key required)", () => {
  let ollamaProviderId: string | null = null;
  let ollamaAvailable = false;

  beforeAll(async () => {
    // Check if Ollama is running locally
    try {
      const res = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(2000) });
      ollamaAvailable = res.ok;
    } catch {
      ollamaAvailable = false;
    }
  });

  test("create Ollama provider (skipped if Ollama not running)", async () => {
    if (!ollamaAvailable) {
      console.log("  ⏭  Skipping Ollama tests — Ollama not running at localhost:11434");
      return;
    }

    const res = await app.inject({
      method: "POST",
      url: "/api/llm-providers",
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: {
        name: "Test Ollama",
        providerType: "ollama",
        apiKey: "",
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json() as { id: string; name: string; providerType: string; models: unknown[] };
    expect(body.id).toMatch(/^llm_/);
    expect(body.name).toBe("Test Ollama");
    expect(body.providerType).toBe("ollama");
    expect(Array.isArray(body.models)).toBe(true);
    ollamaProviderId = body.id;
  });

  test("list includes created provider", async () => {
    if (!ollamaAvailable || !ollamaProviderId) return;

    const res = await app.inject({
      method: "GET",
      url: "/api/llm-providers",
      headers: authHeader(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { items: Array<{ id: string }> };
    expect(body.items.some((p) => p.id === ollamaProviderId)).toBe(true);
  });

  test("get provider by ID", async () => {
    if (!ollamaAvailable || !ollamaProviderId) return;

    const res = await app.inject({
      method: "GET",
      url: `/api/llm-providers/${ollamaProviderId}`,
      headers: authHeader(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { id: string; name: string };
    expect(body.id).toBe(ollamaProviderId);
    expect(body.name).toBe("Test Ollama");
  });

  test("update provider name", async () => {
    if (!ollamaAvailable || !ollamaProviderId) return;

    const res = await app.inject({
      method: "PUT",
      url: `/api/llm-providers/${ollamaProviderId}`,
      headers: { ...authHeader(adminToken), "content-type": "application/json" },
      payload: { name: "Updated Ollama" },
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as { name: string }).name).toBe("Updated Ollama");
  });

  test("refresh models", async () => {
    if (!ollamaAvailable || !ollamaProviderId) return;

    const res = await app.inject({
      method: "POST",
      url: `/api/llm-providers/${ollamaProviderId}/refresh-models`,
      headers: authHeader(adminToken),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as { models: unknown[] };
    expect(Array.isArray(body.models)).toBe(true);
  });

  test("delete provider", async () => {
    if (!ollamaAvailable || !ollamaProviderId) return;

    const res = await app.inject({
      method: "DELETE",
      url: `/api/llm-providers/${ollamaProviderId}`,
      headers: authHeader(adminToken),
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as { deleted: boolean }).deleted).toBe(true);

    // Verify deletion
    const getRes = await app.inject({
      method: "GET",
      url: `/api/llm-providers/${ollamaProviderId}`,
      headers: authHeader(adminToken),
    });
    expect(getRes.statusCode).toBe(400);
  });
});
