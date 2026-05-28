import { z } from "zod";
import type { ActionDefinition } from "../registry.js";

export const datatableProjectActions: ActionDefinition[] = [
  {
    name: "datatables.list_projects",
    category: "DataTables",
    description: "List all datatable projects",
    params: [],
    schema: z.object({}),
    example: {},
    handler: async () => {
      const { listProjects } = await import("../../../modules/datatables/project.service.js");
      return listProjects();
    },
  },
];

export const tableActions: ActionDefinition[] = [
  {
    name: "datatables.list_tables",
    category: "DataTables",
    description: "List all tables in a project with column definitions",
    params: [
      { name: "projectId", type: "string", required: true, description: "Project ID" },
    ],
    schema: z.object({ projectId: z.string() }),
    example: { projectId: "prj_xxx" },
    handler: async (p) => {
      const { listTables } = await import("../../../modules/datatables/table.service.js");
      return listTables(p.projectId);
    },
  },
  {
    name: "datatables.query_rows",
    category: "DataTables",
    description:
      "Query table rows using MQL (SQL-like syntax). " +
      "Syntax: [SELECT col1, col2] [WHERE conditions] [ORDER BY col ASC|DESC] [LIMIT n] [OFFSET n]. " +
      "Operators: =, !=, >, >=, <, <=, LIKE '%text%', IN ('a','b'), BETWEEN x AND y, IS NULL, IS NOT NULL. " +
      "Logic: AND, OR, parentheses for grouping. " +
      "Use COUNT WHERE ... for count-only queries.",
    params: [
      { name: "tableId", type: "string", required: true, description: "Table ID" },
      {
        name: "q",
        type: "string",
        required: true,
        description:
          "MQL query string. Examples: " +
          "\"WHERE status = 'active' ORDER BY name LIMIT 10\", " +
          "\"SELECT name, email WHERE age > 25 AND city IN ('HCM', 'Hanoi')\", " +
          "\"COUNT WHERE active = true\", " +
          "\"WHERE name LIKE '%john%' ORDER BY created_at DESC\"",
      },
    ],
    schema: z.object({
      tableId: z.string(),
      q: z.string(),
    }),
    example: {
      tableId: "dtb_xxx",
      q: "SELECT name, email WHERE active = true AND age > 25 ORDER BY name LIMIT 20",
    },
    handler: async (p) => {
      const { executeMqlQuery } = await import("../../../modules/datatables/mql-query.service.js");
      return executeMqlQuery(p.tableId, p.q);
    },
  },
  {
    name: "datatables.insert_row",
    category: "DataTables",
    description: "Insert a new row into a table (use datatables.list_tables to find table IDs first)",
    params: [
      { name: "tableId", type: "string", required: true, description: "Table ID" },
      { name: "data", type: "object", required: true, description: "Row data: { columnId: value, ... }" },
    ],
    schema: z.object({ tableId: z.string(), data: z.record(z.unknown()) }),
    example: { tableId: "tbl_xxx", data: { col_name: "John", col_age: 30 } },
    handler: async (p) => {
      const { createRow } = await import("../../../modules/datatables/table.service.js");
      return createRow(p.tableId, { data: p.data }, "usr_mcp_system");
    },
  },
  {
    name: "datatables.update_row",
    category: "DataTables",
    description: "Update an existing row in a table (NOT rename table)",
    params: [
      { name: "tableId", type: "string", required: true, description: "Table ID" },
      { name: "rowId", type: "string", required: true, description: "Row ID" },
      { name: "data", type: "object", required: true, description: "Partial data: { columnId: newValue }" },
    ],
    schema: z.object({ tableId: z.string(), rowId: z.string(), data: z.record(z.unknown()) }),
    example: { tableId: "tbl_xxx", rowId: "row_xxx", data: { col_name: "Jane" } },
    handler: async (p) => {
      const { updateRow } = await import("../../../modules/datatables/table.service.js");
      return updateRow(p.tableId, p.rowId, { data: p.data });
    },
  },
  {
    name: "datatables.delete_row",
    category: "DataTables",
    description: "Delete a single row from a table (NOT delete table)",
    params: [
      { name: "tableId", type: "string", required: true, description: "Table ID" },
      { name: "rowId", type: "string", required: true, description: "Row ID to delete" },
    ],
    schema: z.object({ tableId: z.string(), rowId: z.string() }),
    example: { tableId: "tbl_xxx", rowId: "row_xxx" },
    handler: async (p) => {
      const { deleteRow } = await import("../../../modules/datatables/table.service.js");
      await deleteRow(p.tableId, p.rowId);
      return { deleted: true, rowId: p.rowId };
    },
  },
];
