import { describe, it, expect, beforeAll, afterAll } from "bun:test";

const BASE = process.env.TEST_BASE_URL ?? "http://127.0.0.1:18080";
let TOKEN = "";
let DB_ID = "";
let TABLE_ID = "";
let COL_MAP: Record<string, string> = {};

async function api(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<any>;
}

async function mql(q: string) {
  return api("POST", `/api/datatables/${DB_ID}/tables/${TABLE_ID}/query`, { q });
}

// ── Setup & Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  // Login
  const login = await api("POST", "/api/auth/login", {
    login: "admin",
    password: "admin123",
  });
  TOKEN = login.access_token;

  // Create database
  const db = await api("POST", "/api/datatables", {
    name: "MQL_Test_DB",
    description: "For MQL integration tests",
  });
  DB_ID = db.id;

  // Create table
  const table = await api("POST", `/api/datatables/${DB_ID}/tables`, {
    name: "People",
    columns: [
      { name: "name", type: "text" },
      { name: "email", type: "text" },
      { name: "age", type: "number" },
      { name: "city", type: "text" },
      { name: "active", type: "boolean" },
    ],
  });
  TABLE_ID = table.id;
  for (const col of table.columns) {
    COL_MAP[col.name] = col.id;
  }

  // Insert rows
  const rows = [
    { name: "Alice", email: "alice@test.com", age: 28, city: "Hanoi", active: true },
    { name: "Bob", email: "bob@test.com", age: 35, city: "HCM", active: true },
    { name: "Charlie", email: "charlie@test.com", age: 22, city: "Danang", active: false },
    { name: "Diana", email: "diana@test.com", age: 31, city: "HCM", active: true },
    { name: "Eve", email: "eve@test.com", age: 19, city: "Hanoi", active: false },
    { name: "Frank", email: "frank@test.com", age: 42, city: "HCM", active: true },
    { name: "Grace", email: "grace@test.com", age: 27, city: "Hanoi", active: true },
    { name: "Henry", email: "henry@test.com", age: 33, city: "Danang", active: false },
  ];

  for (const row of rows) {
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      data[COL_MAP[k]] = v;
    }
    await api("POST", `/api/datatables/${DB_ID}/tables/${TABLE_ID}/rows`, { data });
  }
});

afterAll(async () => {
  if (DB_ID) {
    await api("DELETE", `/api/datatables/${DB_ID}`);
  }
});

// ── Tests ───────────────────────────────────────────────────────────────────────

describe("MQL Query", () => {
  // ── Basic queries ──

  it("should return all rows with wildcard *", async () => {
    const r = await mql("*");
    expect(r.items.length).toBe(8);
    expect(r.meta.total).toBe(8);
  });

  it("should return all rows with empty-ish query", async () => {
    const r = await mql("SELECT *");
    expect(r.items.length).toBe(8);
  });

  // ── SELECT columns ──

  it("should select specific columns", async () => {
    const r = await mql("SELECT name, city");
    expect(r.items.length).toBe(8);
    const firstData = r.items[0].data;
    expect(Object.keys(firstData).length).toBe(2);
  });

  // ── WHERE filters ──

  it("should filter with eq", async () => {
    const r = await mql("WHERE city = 'HCM'");
    expect(r.meta.total).toBe(3);
    for (const item of r.items) {
      expect(item.data[COL_MAP.city]).toBe("HCM");
    }
  });

  it("should filter with neq (!=)", async () => {
    const r = await mql("WHERE city != 'HCM'");
    expect(r.meta.total).toBe(5);
  });

  it("should filter with gt (>)", async () => {
    const r = await mql("WHERE age > 30");
    expect(r.meta.total).toBe(4); // Bob(35), Diana(31), Frank(42), Henry(33)
  });

  it("should filter with gte (>=)", async () => {
    const r = await mql("WHERE age >= 35");
    expect(r.meta.total).toBe(2); // Bob(35), Frank(42)
  });

  it("should filter with lt (<)", async () => {
    const r = await mql("WHERE age < 25");
    expect(r.meta.total).toBe(2); // Charlie(22), Eve(19)
  });

  it("should filter boolean", async () => {
    const r = await mql("WHERE active = true");
    expect(r.meta.total).toBe(5);
  });

  // ── AND / OR logic ──

  it("should handle AND", async () => {
    const r = await mql("WHERE city = 'HCM' AND age > 30");
    expect(r.meta.total).toBe(3); // Bob, Diana, Frank
  });

  it("should handle OR", async () => {
    const r = await mql("WHERE city = 'Hanoi' OR city = 'Danang'");
    expect(r.meta.total).toBe(5);
  });

  it("should handle nested AND/OR with parentheses", async () => {
    const r = await mql("WHERE (city = 'HCM' AND age > 35) OR active = false");
    // HCM AND age>35: Frank(42) = 1
    // active=false: Charlie, Eve, Henry = 3
    // Total unique: 4
    expect(r.meta.total).toBe(4);
  });

  // ── IN operator ──

  it("should handle IN", async () => {
    const r = await mql("WHERE city IN ('HCM', 'Hanoi')");
    expect(r.meta.total).toBe(6);
  });

  it("should handle NOT IN", async () => {
    const r = await mql("WHERE city NOT IN ('HCM')");
    expect(r.meta.total).toBe(5);
  });

  // ── BETWEEN operator ──

  it("should handle BETWEEN", async () => {
    const r = await mql("WHERE age BETWEEN 25 AND 35");
    expect(r.meta.total).toBe(5); // Grace(27), Alice(28), Diana(31), Henry(33), Bob(35)
  });

  // ── LIKE operator ──

  it("should handle LIKE %text% (contains)", async () => {
    const r = await mql("WHERE name LIKE '%a%'");
    // Grace, Frank, Diana, Charlie, Alice = 5
    expect(r.meta.total).toBe(5);
  });

  it("should handle LIKE text% (starts_with)", async () => {
    const r = await mql("WHERE name LIKE 'A%'");
    expect(r.meta.total).toBe(1);
    expect(r.items[0].data[COL_MAP.name]).toBe("Alice");
  });

  it("should handle LIKE %text (ends_with)", async () => {
    const r = await mql("WHERE name LIKE '%e'");
    // Alice, Grace, Eve, Charlie = 4
    expect(r.meta.total).toBe(4);
  });

  // ── IS NULL / IS NOT NULL ──

  it("should handle IS NOT NULL", async () => {
    const r = await mql("WHERE email IS NOT NULL");
    expect(r.meta.total).toBe(8);
  });

  // ── ORDER BY ──

  it("should sort by single column ASC", async () => {
    const r = await mql("SELECT name ORDER BY name ASC");
    const names = r.items.map((i: any) => i.data[COL_MAP.name]);
    expect(names[0]).toBe("Alice");
    expect(names[7]).toBe("Henry");
  });

  it("should sort by single column DESC", async () => {
    const r = await mql("SELECT name, age ORDER BY age DESC");
    const ages = r.items.map((i: any) => i.data[COL_MAP.age]);
    expect(ages[0]).toBe(42); // Frank
    expect(ages[7]).toBe(19); // Eve
  });

  it("should multi-sort", async () => {
    const r = await mql("SELECT name, city, age ORDER BY city ASC, age DESC");
    // Danang: Henry(33), Charlie(22)
    // Hanoi: Alice(28), Grace(27), Eve(19)
    // HCM: Frank(42), Bob(35), Diana(31)
    const items = r.items.map((i: any) => ({
      city: i.data[COL_MAP.city],
      age: i.data[COL_MAP.age],
    }));
    expect(items[0].city).toBe("Danang");
    expect(items[0].age).toBe(33);
    expect(items[1].city).toBe("Danang");
    expect(items[1].age).toBe(22);
    expect(items[5].city).toBe("HCM");
    expect(items[5].age).toBe(42);
  });

  // ── LIMIT / OFFSET ──

  it("should apply LIMIT", async () => {
    const r = await mql("ORDER BY name ASC LIMIT 3");
    expect(r.items.length).toBe(3);
    expect(r.meta.total).toBe(8);
    expect(r.meta.hasMore).toBe(true);
  });

  it("should apply LIMIT + OFFSET", async () => {
    const r = await mql("ORDER BY name ASC LIMIT 3 OFFSET 3");
    expect(r.items.length).toBe(3);
    const names = r.items.map((i: any) => i.data[COL_MAP.name]);
    expect(names[0]).toBe("Diana"); // 4th alphabetically
  });

  // ── COUNT ──

  it("should count only", async () => {
    const r = await mql("COUNT WHERE active = true");
    expect(r.meta.total).toBe(5);
    expect(r.items.length).toBe(0);
  });

  it("should count all", async () => {
    const r = await mql("COUNT");
    expect(r.meta.total).toBe(8);
    expect(r.items.length).toBe(0);
  });

  // ── Full complex query ──

  it("should handle full complex query", async () => {
    const r = await mql(
      "SELECT name, email WHERE active = true AND age > 25 ORDER BY name ASC LIMIT 5"
    );
    expect(r.meta.total).toBe(5);
    const names = r.items.map((i: any) => Object.values(i.data)[0]);
    // Alice(28), Bob(35), Diana(31), Frank(42), Grace(27) — sorted ASC
    expect(names).toEqual(["Alice", "Bob", "Diana", "Frank", "Grace"]);
  });

  // ── Sort by built-in columns ──

  it("should sort by created_at", async () => {
    const r = await mql("ORDER BY created_at ASC LIMIT 3");
    expect(r.items.length).toBe(3);
  });
});

// ── Security Tests ──────────────────────────────────────────────────────────────

describe("MQL Security", () => {
  it("should reject DROP", async () => {
    const r = await mql("DROP TABLE users");
    expect(r.error).toBe("mql_parse_error");
    expect(r.message).toContain("DROP");
  });

  it("should reject DELETE", async () => {
    const r = await mql("DELETE FROM users WHERE 1=1");
    expect(r.error).toBe("mql_parse_error");
    expect(r.message).toContain("DELETE");
  });

  it("should reject semicolons", async () => {
    const r = await mql("WHERE name = 'a'; DROP TABLE users");
    expect(r.error).toBe("mql_parse_error");
    expect(r.message).toContain("Semicolons");
  });

  it("should reject SQL comments", async () => {
    const r = await mql("WHERE name = 'test' -- comment");
    expect(r.error).toBe("mql_parse_error");
    expect(r.message).toContain("comments");
  });

  it("should reject UNION", async () => {
    const r = await mql("UNION SELECT * FROM users");
    expect(r.error).toBe("mql_parse_error");
    expect(r.message).toContain("UNION");
  });

  it("should reject INSERT", async () => {
    const r = await mql("INSERT INTO users VALUES ('hack')");
    expect(r.error).toBe("mql_parse_error");
    expect(r.message).toContain("INSERT");
  });

  it("should reject UPDATE", async () => {
    const r = await mql("UPDATE users SET name = 'hack'");
    expect(r.error).toBe("mql_parse_error");
    expect(r.message).toContain("UPDATE");
  });

  it("should reject unknown columns", async () => {
    const r = await mql("WHERE nonexistent = 'test'");
    expect(r.error).toBe("mql_parse_error");
    expect(r.message).toContain("Unknown column");
  });

  it("should reject empty query", async () => {
    const res = await fetch(
      `${BASE}/api/datatables/${DB_ID}/tables/${TABLE_ID}/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ q: "" }),
      },
    );
    expect(res.status).toBe(422); // Zod validation rejects empty string (min 1)
  });
});
