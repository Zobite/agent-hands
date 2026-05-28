import { z } from "zod";
import type { ActionDefinition } from "../registry.js";

export const kvStoreActions: ActionDefinition[] = [
  {
    name: "kv.list",
    category: "KV Store",
    description: "List all variables (paginated, searchable)",
    params: [
      { name: "search", type: "string", required: false, description: "Filter by key name" },
      { name: "page", type: "number", required: false, description: "Page number", default: 1 },
      { name: "limit", type: "number", required: false, description: "Items per page", default: 50 },
    ],
    schema: z.object({
      search: z.string().optional(),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(50),
    }),
    example: {},
    handler: async (p) => {
      const { listVariables } = await import("../../../modules/kv-store/kv-store.service.js");
      return listVariables({ search: p.search, page: p.page, limit: p.limit });
    },
  },
  {
    name: "kv.get",
    category: "KV Store",
    description:
      "Get one or more variables by key. " +
      "Pass `key` (string) for one, or `keys` (string[]) for multiple. " +
      "Returns { items, missing }.",
    params: [
      { name: "key", type: "string", required: false, description: "Single variable key" },
      { name: "keys", type: "object", required: false, description: "Array of variable keys" },
    ],
    schema: z.object({
      key: z.string().optional(),
      keys: z.array(z.string().min(1)).optional(),
    }).refine((d) => d.key || (d.keys && d.keys.length > 0), {
      message: "Either 'key' or 'keys' must be provided",
    }),
    example: { key: "API_KEY" },
    handler: async (p) => {
      const { getVariableByKey } = await import("../../../modules/kv-store/kv-store.service.js");
      const allKeys = p.keys ?? (p.key ? [p.key] : []);
      const items: unknown[] = [];
      const missing: string[] = [];
      for (const k of allKeys) {
        const v = await getVariableByKey(k);
        if (v) items.push(v);
        else missing.push(k);
      }
      return { items, missing };
    },
  },
  {
    name: "kv.set",
    category: "KV Store",
    description:
      "Create or update (upsert) one or more variables. " +
      "Pass `key`+`value` for one, or `items` array for multiple. " +
      "Each item: { key, value, type?, ttl? }. Type auto-detected if omitted.",
    params: [
      { name: "key", type: "string", required: false, description: "Single variable key" },
      { name: "value", type: "string", required: false, description: "Single variable value" },
      { name: "type", type: "string", required: false, description: "Type: string, number, boolean, json" },
      { name: "ttl", type: "number", required: false, description: "TTL in seconds (0 = no expiry)" },
      { name: "items", type: "object", required: false, description: "Array of { key, value, type?, ttl? } for bulk" },
    ],
    schema: z.object({
      key: z.string().optional(),
      value: z.string().optional(),
      type: z.enum(["string", "number", "boolean", "json"]).optional(),
      ttl: z.number().optional(),
      items: z.array(z.object({
        key: z.string().min(1),
        value: z.string(),
        type: z.enum(["string", "number", "boolean", "json"]).optional(),
        ttl: z.number().optional(),
      })).optional(),
    }).refine((d) => (d.key && d.value !== undefined) || (d.items && d.items.length > 0), {
      message: "Either 'key'+'value' or 'items' array must be provided",
    }),
    example: { key: "API_KEY", value: "sk-abc123" },
    handler: async (p) => {
      const { createVariable } = await import("../../../modules/kv-store/kv-store.service.js");
      const itemsList = p.items ?? [{ key: p.key!, value: p.value!, type: p.type, ttl: p.ttl }];
      const results: unknown[] = [];
      for (const item of itemsList) {
        const v = await createVariable(item);
        if (v) results.push(v);
      }
      return { count: results.length, items: results };
    },
  },
  {
    name: "kv.delete",
    category: "KV Store",
    description:
      "Delete one or more variables by key. " +
      "Pass `key` (string) for one, or `keys` (string[]) for multiple. " +
      "Returns { deleted, notFound }.",
    params: [
      { name: "key", type: "string", required: false, description: "Single variable key to delete" },
      { name: "keys", type: "object", required: false, description: "Array of keys to delete" },
    ],
    schema: z.object({
      key: z.string().optional(),
      keys: z.array(z.string().min(1)).optional(),
    }).refine((d) => d.key || (d.keys && d.keys.length > 0), {
      message: "Either 'key' or 'keys' must be provided",
    }),
    example: { key: "OLD_KEY" },
    handler: async (p) => {
      const { getVariableByKey, deleteVariable } = await import("../../../modules/kv-store/kv-store.service.js");
      const allKeys = p.keys ?? (p.key ? [p.key] : []);
      const deleted: string[] = [];
      const notFound: string[] = [];
      for (const k of allKeys) {
        const v = await getVariableByKey(k);
        if (v) {
          await deleteVariable(v.id);
          deleted.push(k);
        } else {
          notFound.push(k);
        }
      }
      return { deleted, notFound };
    },
  },
];
