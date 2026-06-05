/**
 * Register all built-in system tools on the MCP server.
 *
 * Each tool is defined in its own file under ./tools/<category>/.
 * This file simply imports and calls each registration function.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerKvDelete } from "./tools/kv/kv-delete.js";
import { registerKvGet } from "./tools/kv/kv-get.js";
// ── KV Store ───────────────────────────────────────────────────────────────────
import { registerKvList } from "./tools/kv/kv-list.js";
import { registerKvSet } from "./tools/kv/kv-set.js";

import { registerDatatablesAddColumn } from "./tools/datatables/datatables-add-column.js";
import { registerDatatablesBulkDeleteRows } from "./tools/datatables/datatables-bulk-delete-rows.js";
import { registerDatatablesBulkUpdateRows } from "./tools/datatables/datatables-bulk-update-rows.js";
import { registerDatatablesCreateProject } from "./tools/datatables/datatables-create-project.js";
import { registerDatatablesCreateTable } from "./tools/datatables/datatables-create-table.js";
import { registerDatatablesDeleteColumn } from "./tools/datatables/datatables-delete-column.js";
import { registerDatatablesGetRow } from "./tools/datatables/datatables-get-row.js";
import { registerDatatablesInsertRow } from "./tools/datatables/datatables-insert-row.js";
// ── DataTables ─────────────────────────────────────────────────────────────────
import { registerDatatablesListProjects } from "./tools/datatables/datatables-list-projects.js";
import { registerDatatablesListTables } from "./tools/datatables/datatables-list-tables.js";
import { registerDatatablesQueryRows } from "./tools/datatables/datatables-query-rows.js";
import { registerDatatablesUpdateColumn } from "./tools/datatables/datatables-update-column.js";
import { registerDatatablesUpdateTable } from "./tools/datatables/datatables-update-table.js";

import { registerStorageDeleteObject } from "./tools/storage/storage-delete-object.js";
import { registerStorageGetDownloadUrl } from "./tools/storage/storage-get-download-url.js";
import { registerStorageGetObjectInfo } from "./tools/storage/storage-get-object-info.js";
// ── Object Storage ─────────────────────────────────────────────────────────────
import { registerStorageListBuckets } from "./tools/storage/storage-list-buckets.js";
import { registerStorageListObjects } from "./tools/storage/storage-list-objects.js";
import { registerStorageUploadObject } from "./tools/storage/storage-upload-object.js";

import { registerBrowserCreate } from "./tools/browser/browser-create.js";
import { registerBrowserDelete } from "./tools/browser/browser-delete.js";
import { registerBrowserListTabs } from "./tools/browser/browser-list-tabs.js";
// ── Browser Profiles ───────────────────────────────────────────────────────────
import { registerBrowserList } from "./tools/browser/browser-list.js";
import { registerBrowserQuickRun } from "./tools/browser/browser-quick-run.js";
import { registerBrowserRunSteps } from "./tools/browser/browser-run-steps.js";
import { registerBrowserStart } from "./tools/browser/browser-start.js";
import { registerBrowserStop } from "./tools/browser/browser-stop.js";

import { registerDynamicApiCreate } from "./tools/dynamic-apis/dynamic-api-create.js";
import { registerDynamicApiDelete } from "./tools/dynamic-apis/dynamic-api-delete.js";
import { registerDynamicApiGet } from "./tools/dynamic-apis/dynamic-api-get.js";
// ── Dynamic APIs ─────────────────────────────────────────────────────────────
import { registerDynamicApiList } from "./tools/dynamic-apis/dynamic-api-list.js";
import { registerDynamicApiUpdate } from "./tools/dynamic-apis/dynamic-api-update.js";

import { registerMcpServerCreate } from "./tools/mcp-servers/mcp-server-create.js";
import { registerMcpServerDelete } from "./tools/mcp-servers/mcp-server-delete.js";
import { registerMcpServerGet } from "./tools/mcp-servers/mcp-server-get.js";
// ── MCP Servers ──────────────────────────────────────────────────────────────
import { registerMcpServerList } from "./tools/mcp-servers/mcp-server-list.js";
import { registerMcpServerUpdate } from "./tools/mcp-servers/mcp-server-update.js";
import { registerMcpToolCreate } from "./tools/mcp-servers/mcp-tool-create.js";
import { registerMcpToolDelete } from "./tools/mcp-servers/mcp-tool-delete.js";
import { registerMcpToolGet } from "./tools/mcp-servers/mcp-tool-get.js";
import { registerMcpToolList } from "./tools/mcp-servers/mcp-tool-list.js";
import { registerMcpToolTest } from "./tools/mcp-servers/mcp-tool-test.js";
import { registerMcpToolUpdate } from "./tools/mcp-servers/mcp-tool-update.js";

// ── Register All ───────────────────────────────────────────────────────────────

export function registerAllSystemTools(server: McpServer) {
  // KV Store
  registerKvList(server);
  registerKvGet(server);
  registerKvSet(server);
  registerKvDelete(server);

  // DataTables
  registerDatatablesListProjects(server);
  registerDatatablesCreateProject(server);
  registerDatatablesListTables(server);
  registerDatatablesCreateTable(server);
  registerDatatablesUpdateTable(server);
  registerDatatablesAddColumn(server);
  registerDatatablesUpdateColumn(server);
  registerDatatablesDeleteColumn(server);
  registerDatatablesQueryRows(server);
  registerDatatablesGetRow(server);
  registerDatatablesInsertRow(server);
  registerDatatablesBulkUpdateRows(server);
  registerDatatablesBulkDeleteRows(server);

  // Object Storage
  registerStorageListBuckets(server);
  registerStorageListObjects(server);
  registerStorageGetObjectInfo(server);
  registerStorageGetDownloadUrl(server);
  registerStorageUploadObject(server);
  registerStorageDeleteObject(server);

  // Browser Profiles
  registerBrowserList(server);
  registerBrowserCreate(server);
  registerBrowserStart(server);
  registerBrowserStop(server);
  registerBrowserDelete(server);
  registerBrowserListTabs(server);
  registerBrowserRunSteps(server);
  registerBrowserQuickRun(server);

  // Dynamic APIs
  registerDynamicApiList(server);
  registerDynamicApiGet(server);
  registerDynamicApiCreate(server);
  registerDynamicApiUpdate(server);
  registerDynamicApiDelete(server);

  // MCP Servers
  registerMcpServerList(server);
  registerMcpServerGet(server);
  registerMcpServerCreate(server);
  registerMcpServerUpdate(server);
  registerMcpServerDelete(server);
  registerMcpToolList(server);
  registerMcpToolGet(server);
  registerMcpToolCreate(server);
  registerMcpToolUpdate(server);
  registerMcpToolDelete(server);
  registerMcpToolTest(server);
}
