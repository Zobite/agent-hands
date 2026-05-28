/**
 * Dynamic APIs Module — Integration Tests
 *
 * Tests: CRUD lifecycle, route matching, handler execution, logs, edge cases.
 * Uses Fastify inject() — no running server needed.
 * Run: cd src/server && bun test src/modules/dynamic-apis/dynamic-apis.test.ts
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

const TEST_DATA_DIR = join(import.meta.dir, ".test-data-dynamic-apis");

let app: FastifyInstance;
let token: string;
let createdApiId: string;

function authHeader(t: string) {
  return { Authorization: `Bearer ${t}` };
}

function json(t: string) {
  return { ...authHeader(t), "content-type": "application/json" };
}

// ── Setup / Teardown ────────────────────────────────────────────────────────────

beforeAll(async () => {
  rmSync(TEST_DATA_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DATA_DIR, { recursive: true });

  process.env.JWT_SECRET = "test-secret-for-dynamic-apis-32chars!";
  process.env.DATA_DIR = TEST_DATA_DIR;

  runMigrations(TEST_DATA_DIR);
  getDb(TEST_DATA_DIR);

  const sa = await createSuperAdmin(
    "admin",
    "admin@test.local",
    "password123",
    "Admin"
  );
  token = await signAccess(sa.id, sa.role);

  app = await createApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  closeDb();
  rmSync(TEST_DATA_DIR, { recursive: true, force: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
// CRUD Lifecycle
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/dynamic-apis — Create", () => {
  test("create a GET endpoint", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/dynamic-apis",
      headers: json(token),
      payload: {
        name: "Hello World",
        method: "GET",
        path: "/hello",
        code: `async function handler(request, context) {
  context.log("hello called");
  return { status: 200, body: { message: "Hello World" } };
}`,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json() as any;
    expect(body.id).toMatch(/^dap_/);
    expect(body.name).toBe("Hello World");
    expect(body.method).toBe("GET");
    expect(body.path).toBe("/hello");
    expect(body.isActive).toBe(true);
    expect(body.executionMode).toBe("fast");
    createdApiId = body.id;
  });

  test("create POST endpoint with params", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/dynamic-apis",
      headers: json(token),
      payload: {
        name: "Echo",
        method: "POST",
        path: "/echo",
        code: `async function handler(request, context) {
  return { status: 200, body: { received: request.body } };
}`,
      },
    });
    expect(res.statusCode).toBe(201);
  });

  test("create endpoint with path params", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/dynamic-apis",
      headers: json(token),
      payload: {
        name: "Get User",
        method: "GET",
        path: "/users/:id",
        code: `async function handler(request, context) {
  return { status: 200, body: { userId: request.params.id } };
}`,
      },
    });
    expect(res.statusCode).toBe(201);
  });

  test("duplicate method+path → 400", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/dynamic-apis",
      headers: json(token),
      payload: {
        name: "Duplicate",
        method: "GET",
        path: "/hello",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  test("path must start with /", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/dynamic-apis",
      headers: json(token),
      payload: {
        name: "Bad Path",
        method: "GET",
        path: "no-slash",
      },
    });
    expect(res.statusCode).toBe(422);
  });

  test("no auth → 401", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/dynamic-apis",
      headers: { "content-type": "application/json" },
      payload: {
        name: "Nope",
        method: "GET",
        path: "/nope",
      },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe("GET /api/dynamic-apis — List", () => {
  test("list all", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/dynamic-apis",
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.items.length).toBeGreaterThanOrEqual(3);
    expect(body.meta.total).toBeGreaterThanOrEqual(3);
  });

  test("filter by method", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/dynamic-apis?method=POST",
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    for (const item of body.items) {
      expect(item.method).toBe("POST");
    }
  });

  test("search by name", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/dynamic-apis?search=Hello",
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.items.length).toBeGreaterThanOrEqual(1);
  });
});

describe("GET /api/dynamic-apis/:id — Get", () => {
  test("get by ID", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/dynamic-apis/${createdApiId}`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.id).toBe(createdApiId);
    expect(body.name).toBe("Hello World");
  });

  test("non-existent → 400", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/dynamic-apis/dap_nonexistent",
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(400);
  });
});

describe("PATCH /api/dynamic-apis/:id — Update", () => {
  test("update name", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/dynamic-apis/${createdApiId}`,
      headers: json(token),
      payload: { name: "Updated Hello" },
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).name).toBe("Updated Hello");
  });

  test("toggle active", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/dynamic-apis/${createdApiId}`,
      headers: json(token),
      payload: { isActive: false },
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).isActive).toBe(false);

    // Re-activate
    await app.inject({
      method: "PATCH",
      url: `/api/dynamic-apis/${createdApiId}`,
      headers: json(token),
      payload: { isActive: true },
    });
  });

  test("update code", async () => {
    const newCode = `async function handler(request, context) {
  return { status: 200, body: { message: "Updated!" } };
}`;
    const res = await app.inject({
      method: "PATCH",
      url: `/api/dynamic-apis/${createdApiId}`,
      headers: json(token),
      payload: { code: newCode },
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).code).toBe(newCode);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Runtime Execution
// ═══════════════════════════════════════════════════════════════════════════════

describe("Dynamic API Runtime — /apis/*", () => {
  test("execute GET handler returns correct response", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/apis/hello",
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.message).toBe("Updated!");
  });

  test("execute POST handler echoes body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/apis/echo",
      headers: json(token),
      payload: { foo: "bar" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.received).toEqual({ foo: "bar" });
  });

  test("path params are extracted", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/apis/users/usr_123",
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.userId).toBe("usr_123");
  });

  test("non-existent path → 404", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/apis/nonexistent",
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(404);
  });

  test("wrong method → 404 (path doesn't match any GET)", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: "/apis/hello",
      headers: authHeader(token),
    });

    // /hello only has GET, DELETE should be method not allowed
    expect(res.statusCode).toBe(405);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Logs
// ═══════════════════════════════════════════════════════════════════════════════

describe("GET /api/dynamic-apis/:id/logs — Logs", () => {
  test("logs are created after execution", async () => {
    // Wait a bit for fire-and-forget log to complete
    await new Promise((r) => setTimeout(r, 200));

    const res = await app.inject({
      method: "GET",
      url: `/api/dynamic-apis/${createdApiId}/logs`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.items.length).toBeGreaterThanOrEqual(1);

    const log = body.items[0];
    expect(log.apiId).toBe(createdApiId);
    expect(log.statusCode).toBe(200);
    expect(log.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  test("filter logs by date range", async () => {
    const now = Date.now();
    const oneHourAgo = now - 3600_000;

    // Logs from last hour should include our test logs
    const res = await app.inject({
      method: "GET",
      url: `/api/dynamic-apis/${createdApiId}/logs?startDate=${oneHourAgo}&endDate=${now + 60_000}`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.items.length).toBeGreaterThanOrEqual(1);

    // Logs from far future should return empty
    const futureRes = await app.inject({
      method: "GET",
      url: `/api/dynamic-apis/${createdApiId}/logs?startDate=${now + 3600_000}&endDate=${now + 7200_000}`,
      headers: authHeader(token),
    });

    expect(futureRes.statusCode).toBe(200);
    expect((futureRes.json() as any).items.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Delete
// ═══════════════════════════════════════════════════════════════════════════════

describe("DELETE /api/dynamic-apis/:id — Delete", () => {
  test("delete endpoint", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/dynamic-apis/${createdApiId}`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).deleted).toBe(true);
  });

  test("verify deleted endpoint is gone", async () => {
    const res = await app.inject({
      method: "GET",
      url: `/api/dynamic-apis/${createdApiId}`,
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(400);
  });

  test("deleted endpoint is no longer callable", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/apis/hello",
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Public endpoint
// ═══════════════════════════════════════════════════════════════════════════════

describe("Public endpoints (no auth required)", () => {
  let publicApiId: string;

  test("create a public endpoint", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/dynamic-apis",
      headers: json(token),
      payload: {
        name: "Public Endpoint",
        method: "GET",
        path: "/public-test",
        isPublic: true,
        code: `async function handler(request, context) {
  return { status: 200, body: { public: true } };
}`,
      },
    });

    expect(res.statusCode).toBe(201);
    publicApiId = (res.json() as any).id;
    expect((res.json() as any).isPublic).toBe(true);
  });

  test("call public endpoint without auth", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/apis/public-test",
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).public).toBe(true);
  });

  test("cleanup public endpoint", async () => {
    await app.inject({
      method: "DELETE",
      url: `/api/dynamic-apis/${publicApiId}`,
      headers: authHeader(token),
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Dry-run Test Endpoint
// ═══════════════════════════════════════════════════════════════════════════════

describe("POST /api/dynamic-apis/:id/test — Dry-run", () => {
  let testApiId: string;

  test("setup: create test endpoint", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/dynamic-apis",
      headers: json(token),
      payload: {
        name: "DryRun Target",
        method: "GET",
        path: "/dryrun-target",
        code: `async function handler(r, c) { return { status: 200, body: { saved: true } }; }`,
      },
    });
    expect(res.statusCode).toBe(201);
    testApiId = (res.json() as any).id;
  });

  test("dry-run executes provided code (not saved code)", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/dynamic-apis/${testApiId}/test`,
      headers: json(token),
      payload: {
        code: `async function handler(request, context) {
  context.log("dry-run test");
  return { status: 200, body: { dryRun: true, method: request.method } };
}`,
        method: "GET",
        path: "/test",
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.status).toBe(200);
    expect(body.body.dryRun).toBe(true);
    expect(body.consoleLogs).toContain("dry-run test");
    expect(body.executionMode).toBe("fast");
  });

  test("dry-run receives params, query, body", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/dynamic-apis/${testApiId}/test`,
      headers: json(token),
      payload: {
        code: `async function handler(request, context) {
  return { status: 200, body: {
    params: request.params,
    query: request.query,
    body: request.body
  }};
}`,
        method: "POST",
        path: "/items/42",
        params: { id: "42" },
        query: { sort: "name" },
        body: { name: "Test Item" },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.body.params).toEqual({ id: "42" });
    expect(body.body.query).toEqual({ sort: "name" });
    expect(body.body.body).toEqual({ name: "Test Item" });
  });

  test("dry-run handles runtime errors gracefully", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/dynamic-apis/${testApiId}/test`,
      headers: json(token),
      payload: {
        code: `async function handler(request, context) {
  throw new Error("intentional error");
}`,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.status).toBe(500);
    expect(body.body.error).toBe("execution_error");
    expect(body.error).toContain("intentional error");
  });

  test("cleanup", async () => {
    await app.inject({
      method: "DELETE",
      url: `/api/dynamic-apis/${testApiId}`,
      headers: authHeader(token),
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Isolated Mode (auto-detect from code imports)
// ═══════════════════════════════════════════════════════════════════════════════

describe("Isolated mode — auto-detect from code imports", () => {
  let isolatedApiId: string;

  test("code with npm imports → executionMode is isolated", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/dynamic-apis",
      headers: json(token),
      payload: {
        name: "Auto Deps Test",
        method: "GET",
        path: "/auto-deps",
        isPublic: true,
        code: `
import _ from "lodash";
export default async function handler(request, context) {
  const arr = [3, 1, 2];
  return { status: 200, body: { sorted: _.sortBy(arr) } };
}`,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json() as any;
    isolatedApiId = body.id;
    // executionMode determined by code content, no dependencies field needed
    expect(body.executionMode).toBe("isolated");
  });

  test("code without imports → executionMode is fast", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/dynamic-apis",
      headers: json(token),
      payload: {
        name: "No Deps Test",
        method: "GET",
        path: "/no-deps",
        isPublic: true,
        code: `async function handler(request, context) {
  return { status: 200, body: { hello: "world" } };
}`,
      },
    });

    expect(res.statusCode).toBe(201);
    expect((res.json() as any).executionMode).toBe("fast");

    // cleanup
    await app.inject({
      method: "DELETE",
      url: `/api/dynamic-apis/${(res.json() as any).id}`,
      headers: authHeader(token),
    });
  });

  test("update code to add imports → mode switches to isolated", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/dynamic-apis/${isolatedApiId}`,
      headers: json(token),
      payload: {
        code: `
import _ from "lodash";
import dayjs from "dayjs";
export default async function handler(request, context) {
  return { status: 200, body: { now: dayjs().toISOString(), sorted: _.sortBy([3,1,2]) } };
}`,
      },
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).executionMode).toBe("isolated");
  });

  test("update code to remove imports → mode switches to fast", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/dynamic-apis/${isolatedApiId}`,
      headers: json(token),
      payload: {
        code: `async function handler(request, context) {
  return { status: 200, body: { simple: true } };
}`,
      },
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).executionMode).toBe("fast");
  });

  test("node builtins do not trigger isolated mode", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/dynamic-apis/${isolatedApiId}`,
      headers: json(token),
      payload: {
        code: `
const crypto = require("crypto");
async function handler(request, context) {
  const hash = crypto.createHash("md5").update("test").digest("hex");
  return { status: 200, body: { hash } };
}`,
      },
    });

    expect(res.statusCode).toBe(200);
    expect((res.json() as any).executionMode).toBe("fast");
  });

  test("list endpoints shows correct executionMode from code", async () => {
    // Update to isolated code first
    await app.inject({
      method: "PATCH",
      url: `/api/dynamic-apis/${isolatedApiId}`,
      headers: json(token),
      payload: {
        code: `
import _ from "lodash";
export default async function handler(r, c) {
  return { status: 200, body: { ok: true } };
}`,
      },
    });

    const res = await app.inject({
      method: "GET",
      url: "/api/dynamic-apis",
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    const item = body.items.find((i: any) => i.id === isolatedApiId);
    expect(item).toBeDefined();
    expect(item.executionMode).toBe("isolated");
  });

  test("cleanup isolated endpoint", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/api/dynamic-apis/${isolatedApiId}`,
      headers: authHeader(token),
    });
    expect(res.statusCode).toBe(200);
  });
});
