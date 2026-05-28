<feature>
  <meta>
    <id>dynamic_api_create</id>
    <title>Create new API endpoint</title>
    <group>Dynamic API</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    User creates a new API endpoint by defining: HTTP method, path, description,
    dependencies (npm packages), and JavaScript/TypeScript handler code. Code
    is saved to DB and ready to receive requests.
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>User</actor>
      <action>click "New API" on API Management page</action>
      <benefit>create a custom HTTP endpoint without modifying source code or redeploying</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] "New API" button on API Management page.
- [x] Dialog/page for API creation with fields: Name (required), Method (GET/POST/PUT/PATCH/DELETE), Path (required, starts with /), Description (optional).
- [x] Dependencies field (optional): enter npm packages, e.g. { "axios": "^1.7.0", "cheerio": "^1.0.0" }. No dependencies → Fast mode (in-process). With dependencies → Isolated mode (subprocess).
- [x] Template code: ```javascript export default async function handler(request, context) { /** * request: { method, path, params, query, headers, body } * context: { variables, tables, docs, files, log } */ return { status: 200, body: { message: "Hello World" } }; } ```
- [x] Save → if dependencies exist → system runs `bun install` in endpoint's own folder → API endpoint active immediately, callable via /api/dynamic/[path].
- [x] DB schema: id, name, method, path, description, code, dependencies (JSON), isActive, isPublic, timeout, createdBy, createdAt, updatedAt. Execution mode (fast|isolated) is auto-detected from code imports at runtime, not stored in DB.

## Web
- [x] Path must be unique within the same method. Supports path params: /users/:id.
- [x] Code editor opens with default JavaScript template.
