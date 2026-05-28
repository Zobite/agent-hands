/**
 * Storage Module — Integration Tests
 *
 * Tests bucket & object CRUD lifecycle, public access, and presigned URLs.
 *
 * Run: cd src/server && bun test src/modules/storage/files.test.ts
 * Requires: server running at BASE_URL (bun dev:server)
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";

// ── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:18080";
const LOGIN = process.env.TEST_LOGIN ?? "admin";
const PASSWORD = process.env.TEST_PASSWORD ?? "admin123";

const TEST_BUCKET = "test-integration-bucket";
const TEST_KEY = "hello.txt";
const TEST_CONTENT = "Hello, Storage!";

// ── State ─────────────────────────────────────────────────────────────────────

let accessToken = "";

// ── Helpers ───────────────────────────────────────────────────────────────────

function auth(): Record<string, string> {
  return { Authorization: `Bearer ${accessToken}` };
}

async function json(res: Response) {
  return res.json() as Promise<any>;
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Login
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
  // Cleanup: force-delete test bucket
  await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}?force=true`, {
    method: "DELETE",
    headers: auth(),
  });
});

// ── Bucket CRUD ───────────────────────────────────────────────────────────────

describe("Storage — Bucket CRUD", () => {
  test("POST /api/storage/buckets — create bucket", async () => {
    const res = await fetch(`${BASE_URL}/api/storage/buckets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...auth() },
      body: JSON.stringify({ name: TEST_BUCKET }),
    });
    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.name).toBe(TEST_BUCKET);
    expect(data.isPublic).toBe(false);
  });

  test("GET /api/storage — list buckets", async () => {
    const res = await fetch(`${BASE_URL}/api/storage`, { headers: auth() });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(Array.isArray(data.items)).toBe(true);
    const found = data.items.find((b: any) => b.name === TEST_BUCKET);
    expect(found).toBeTruthy();
  });

  test("GET /api/storage/buckets/:name — get bucket", async () => {
    const res = await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}`, { headers: auth() });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.name).toBe(TEST_BUCKET);
  });

  test("PATCH /api/storage/buckets/:name — toggle public", async () => {
    const res = await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...auth() },
      body: JSON.stringify({ isPublic: true }),
    });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.isPublic).toBe(true);

    // Revert to private for later tests
    await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...auth() },
      body: JSON.stringify({ isPublic: false }),
    });
  });
});

// ── Object Upload & Download ──────────────────────────────────────────────────

describe("Storage — Object Upload & Download", () => {
  test("POST /api/storage/buckets/:name/upload — upload text file", async () => {
    const res = await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}/upload?key=${TEST_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain", ...auth() },
      body: TEST_CONTENT,
    });
    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.key).toBe(TEST_KEY);
  });

  test("POST /api/storage/buckets/:name/upload — upload binary", async () => {
    const binaryKey = "binary.bin";
    const binaryContent = new Uint8Array([0x00, 0x01, 0x02, 0xff]);
    const res = await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}/upload?key=${binaryKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream", ...auth() },
      body: binaryContent,
    });
    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.key).toBe(binaryKey);
    expect(data.size).toBe(4);
  });

  test("POST /api/storage/buckets/:name/upload — upsert (re-upload same key)", async () => {
    const newContent = "Updated content v2";
    const res = await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}/upload?key=${TEST_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain", ...auth() },
      body: newContent,
    });
    expect(res.status).toBe(201);
    const data = await json(res);
    expect(data.key).toBe(TEST_KEY);
  });

  test("upload without auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}/upload?key=noauth.txt`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "no auth",
    });
    expect(res.status).toBe(401);
  });

  test("upload to non-existent bucket → 400", async () => {
    const res = await fetch(`${BASE_URL}/api/storage/buckets/nonexistent-bucket/upload?key=test.txt`, {
      method: "POST",
      headers: { "Content-Type": "text/plain", ...auth() },
      body: "test",
    });
    // Should fail because bucket doesn't exist
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  test("GET /api/storage/buckets/:name/objects/:key — download file", async () => {
    const res = await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}/objects/${TEST_KEY}`, {
      headers: auth(),
    });
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("Updated content v2"); // we upserted above
    expect(res.headers.get("content-type")).toContain("text/plain");
  });

  test("download non-existent file → 404", async () => {
    const res = await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}/objects/nonexistent.txt`, {
      headers: auth(),
    });
    expect(res.status).toBe(404);
  });
});

// ── List Objects ──────────────────────────────────────────────────────────────

describe("Storage — List Objects", () => {
  test("GET /api/storage/buckets/:name/objects — list objects", async () => {
    const res = await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}/objects`, {
      headers: auth(),
    });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.items).toBeDefined();
    expect(data.items.length).toBeGreaterThanOrEqual(1);
    const found = data.items.find((o: any) => o.key === TEST_KEY);
    expect(found).toBeTruthy();
  });
});

// ── Public Access ─────────────────────────────────────────────────────────────

describe("Storage — Public Access", () => {
  test("private object → 403 via /public/", async () => {
    const res = await fetch(`${BASE_URL}/public/${TEST_BUCKET}/${TEST_KEY}`);
    expect(res.status).toBe(403);
  });

  test("make object public → accessible via /public/", async () => {
    // Toggle object to public
    await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}/objects/${TEST_KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...auth() },
      body: JSON.stringify({ isPublic: true }),
    });

    const res = await fetch(`${BASE_URL}/public/${TEST_BUCKET}/${TEST_KEY}`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("Updated content v2");
  });
});

// ── Delete Objects ────────────────────────────────────────────────────────────

describe("Storage — Delete Objects", () => {
  test("DELETE /api/storage/buckets/:name/objects/:key — delete object", async () => {
    // First upload something to delete
    await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}/upload?key=to-delete.txt`, {
      method: "POST",
      headers: { "Content-Type": "text/plain", ...auth() },
      body: "will be deleted",
    });

    const res = await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}/objects/to-delete.txt`, {
      method: "DELETE",
      headers: auth(),
    });
    expect(res.status).toBe(200);
    const data = await json(res);
    expect(data.deleted).toBe(true);

    // Verify gone
    const getRes = await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}/objects/to-delete.txt`, {
      headers: auth(),
    });
    expect(getRes.status).toBe(404);
  });
});

// ── Bucket Delete ─────────────────────────────────────────────────────────────

describe("Storage — Bucket Delete", () => {
  test("DELETE /api/storage/buckets/:name?force=true — force delete bucket", async () => {
    const res = await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}?force=true`, {
      method: "DELETE",
      headers: auth(),
    });
    expect(res.status).toBe(200);

    // Verify bucket gone
    const getRes = await fetch(`${BASE_URL}/api/storage/buckets/${TEST_BUCKET}`, {
      headers: auth(),
    });
    expect(getRes.status).toBe(400);
  });
});

// ── Auth ──────────────────────────────────────────────────────────────────────

describe("Storage — Auth", () => {
  test("list buckets without auth → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/storage`);
    expect(res.status).toBe(401);
  });
});
