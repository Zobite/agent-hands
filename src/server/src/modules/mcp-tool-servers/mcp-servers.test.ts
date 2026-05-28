/**
 * MCP Tool Servers — Integration Tests
 *
 * Tests full CRUD lifecycle for MCP tool servers and tools.
 *
 * Run: cd src/server && bun test src/modules/mcp-tool-servers/mcp-servers.test.ts
 * Requires: server running at BASE_URL (bun dev:server)
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:18080";
const LOGIN    = process.env.TEST_LOGIN    ?? "admin";
const PASSWORD = process.env.TEST_PASSWORD ?? "admin123";

// ── State ─────────────────────────────────────────────────────────────────────

let accessToken = "";
let createdServerId = "";
let createdToolId = "";

// ── Helpers ───────────────────────────────────────────────────────────────────

function auth(): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` };
}

async function json(res: Response) {
  return res.json() as Promise<any>;
}

async function apiPost(path: string, body: unknown) {
  return fetch(`${BASE_URL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify(body),
  });
}

async function apiPatch(path: string, body: unknown) {
  return fetch(`${BASE_URL}/api${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...auth() },
    body: JSON.stringify(body),
  });
}

async function apiGet(path: string) {
  return fetch(`${BASE_URL}/api${path}`, { headers: auth() });
}

async function apiDelete(path: string) {
  return fetch(`${BASE_URL}/api${path}`, { method: "DELETE", headers: auth() });
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login: LOGIN, password: PASSWORD }),
  });
  expect(res.ok).toBe(true);
  const data = await json(res);
  accessToken = data.access_token;
  expect(accessToken).toBeTruthy();
});

afterAll(async () => {
  // Cleanup: delete server if still remaining
  if (createdServerId) {
    await apiDelete(`/mcp-tool-servers/${createdServerId}`);
  }
});

// ── Server CRUD ───────────────────────────────────────────────────────────────

describe("MCP Tool Servers — Server CRUD", () => {
  test("GET /mcp-tool-servers — list returns items", async () => {
    const res = await apiGet("/mcp-tool-servers");
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(Array.isArray(data.items)).toBe(true);
  });

  test("POST /mcp-tool-servers — create custom server", async () => {
    const res = await apiPost("/mcp-tool-servers", {
      name: "test-mcp-server",
      description: "Test MCP server for integration tests",
    });

    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.id).toBeTruthy();
    expect(data.name).toBe("test-mcp-server");
    expect(data.type).toBe("custom");

    createdServerId = data.id;
  });

  test("GET /mcp-tool-servers/:id — get server by id", async () => {
    const res = await apiGet(`/mcp-tool-servers/${createdServerId}`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.id).toBe(createdServerId);
    expect(data.name).toBe("test-mcp-server");
  });

  test("GET /mcp-tool-servers/:id — non-existent id → 400", async () => {
    const res = await apiGet("/mcp-tool-servers/mts_nonexistent_xyz");
    expect(res.status).toBe(400);
  });

  test("PATCH /mcp-tool-servers/:id — update description", async () => {
    const res = await apiPatch(`/mcp-tool-servers/${createdServerId}`, {
      description: "Updated description",
    });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.description).toBe("Updated description");
  });
});

// ── Tool CRUD ─────────────────────────────────────────────────────────────────

describe("MCP Tool Servers — Tool CRUD", () => {
  test("POST /:id/tools — create tool", async () => {
    const res = await apiPost(`/mcp-tool-servers/${createdServerId}/tools`, {
      name: "test_tool",
      description: "A test tool",
      inputSchema: JSON.stringify({
        type: "object",
        properties: {
          message: { type: "string", description: "A test message" },
        },
        required: ["message"],
      }),
      code: `async function execute(params, context) {
  return { echo: params.message };
}`,
    });

    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.id).toBeTruthy();
    expect(data.name).toBe("test_tool");
    expect(data.description).toBe("A test tool");
    expect(data.serverId).toBe(createdServerId);

    createdToolId = data.id;
  });

  test("GET /:id/tools — list tools", async () => {
    const res = await apiGet(`/mcp-tool-servers/${createdServerId}/tools`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.items).toBeDefined();
    expect(data.items.length).toBeGreaterThanOrEqual(1);
  });

  test("GET /:id/tools/:toolId — get tool by id", async () => {
    const res = await apiGet(`/mcp-tool-servers/${createdServerId}/tools/${createdToolId}`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.id).toBe(createdToolId);
    expect(data.name).toBe("test_tool");
  });

  test("PATCH /:id/tools/:toolId — update tool", async () => {
    const res = await apiPatch(`/mcp-tool-servers/${createdServerId}/tools/${createdToolId}`, {
      description: "Updated description",
    });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.description).toBe("Updated description");
  });

  test("DELETE /:id/tools/:toolId — delete tool", async () => {
    const res = await apiDelete(`/mcp-tool-servers/${createdServerId}/tools/${createdToolId}`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.deleted).toBe(true);

    // Verify gone
    const getRes = await apiGet(`/mcp-tool-servers/${createdServerId}/tools/${createdToolId}`);
    expect(getRes.status).toBe(400);

    createdToolId = "";
  });
});

// ── Server Delete ─────────────────────────────────────────────────────────────

describe("MCP Tool Servers — Delete", () => {
  test("DELETE /mcp-tool-servers/:id — delete custom server", async () => {
    if (!createdServerId) return;
    const res = await apiDelete(`/mcp-tool-servers/${createdServerId}`);
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.deleted).toBe(true);

    // Verify gone
    const getRes = await apiGet(`/mcp-tool-servers/${createdServerId}`);
    expect(getRes.status).toBe(400);

    createdServerId = ""; // prevent double-delete in afterAll
  });
});

// ── Auth ──────────────────────────────────────────────────────────────────────

describe("MCP Tool Servers — Auth", () => {
  test("list without auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/mcp-tool-servers`);
    expect(res.status).toBe(401);
  });

  test("create without auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/mcp-tool-servers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "no-auth-server" }),
    });
    expect(res.status).toBe(401);
  });
});
