<feature>
  <meta>
    <id>tables_overview</id>
    <title>DataTables — Overview</title>
    <group>DataTables</group>
    <status>planned</status>
    <priority>p0</priority>
    <updated>2026-04-28</updated>
  </meta>

  <overview>
    DataTables is a Notion-like project table feature. Users can create
    multiple tables, each with custom columns (text, number, select, date,
    checkbox, url, relation...). Data is stored as flexible JSON, with support
    for sort, filter, and multiple view types.

    Tables are organized by **Project** — the top-level entity (with id, name,
    description, icon). Tables are nested resources within a project:
    `/api/projects/:projectId/tables/...`

    Agents can read/write table data through MCP tools.
  </overview>
</feature>

## Features (atomic — in priority order)

| #  | Feature                           | File                                                            | Status     | Priority |
|----|-----------------------------------|-----------------------------------------------------------------|------------|----------|
| 01 | Create new table                  | [01-create-table.md](01-create-table.md)                        | ⬜ Planned | p0       |
| 02 | Edit table (name, description)    | [02-edit-table.md](02-edit-table.md)                            | ⬜ Planned | p0       |
| 03 | Delete table                      | [03-delete-table.md](03-delete-table.md)                        | ⬜ Planned | p0       |
| 04 | Column management (properties)    | [04-column-management.md](04-column-management.md)              | ⬜ Planned | p0       |
| 05 | Add/edit/delete rows              | [05-row-crud.md](05-row-crud.md)                                | ⬜ Planned | p0       |
| 06 | Column data types                 | [06-column-types.md](06-column-types.md)                        | ⬜ Planned | p0       |
| 07 | Sort & Filter                     | [07-sort-filter.md](07-sort-filter.md)                          | ⬜ Planned | p1       |
| 08 | Table views (Table/Board/List)    | [08-table-views.md](08-table-views.md)                          | ⬜ Planned | p2       |
| 09 | Row detail dialog                 | [09-row-detail.md](09-row-detail.md)                            | ⬜ Planned | p1       |
| 10 | Table data API CRUD               | [10-table-api.md](10-table-api.md)                              | ⬜ Planned | p0       |
