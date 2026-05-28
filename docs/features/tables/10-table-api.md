<feature>
  <meta>
    <id>table_api</id>
    <title>Table data API CRUD</title>
    <group>Dynamic Table</group>
    <status>done</status>
    <priority>p0</priority>
  </meta>

  <overview>
    Full RESTful API for CRUD operations on databases, tables, columns, and rows.
    This API is used by the frontend UI, MCP tools, and Dynamic APIs.
    Base: /api/databases
  </overview>

  <user-stories>
    <story id="US-01">
      <actor>Frontend / MCP Tool / Dynamic API</actor>
      <action>call API to read/write table data</action>
      <benefit>interact with structured data via HTTP</benefit>
    </story>
  </user-stories>
</feature>

## Server
- [x] Database CRUD: GET /api/databases (list), POST (create), GET /:dbId, PATCH /:dbId, DELETE /:dbId
- [x] Table CRUD: GET /api/databases/:dbId/tables, POST, GET /:id, PATCH /:id, DELETE /:id
- [x] Column CRUD: POST .../columns, PATCH .../columns/:colId, DELETE .../columns/:colId
- [x] Row CRUD: GET .../rows (list + pagination + sort + filter), POST, PATCH .../rows/:rowId, DELETE .../rows/:rowId
- [x] Query params: sort, order, filter, filterLogic, page, limit
- [x] POST .../query — MQL (SQL-like DSL): SELECT, WHERE, ORDER BY, LIMIT, OFFSET, COUNT, IN, BETWEEN, LIKE, IS NULL, nested AND/OR
- [x] MQL security: banned DDL/DML keywords, semicolons, comments, column whitelist, table-scoped
- [x] All endpoints require auth (JWT or API key)
