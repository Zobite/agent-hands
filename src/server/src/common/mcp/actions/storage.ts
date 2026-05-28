import { z } from "zod";
import type { ActionDefinition } from "../registry.js";

export const storageActions: ActionDefinition[] = [
  {
    name: "storage.list_buckets",
    category: "Object Storage",
    description: "List all storage buckets",
    params: [],
    schema: z.object({}),
    example: {},
    handler: async () => {
      const { listBuckets } = await import("../../../modules/storage/storage.service.js");
      return listBuckets();
    },
  },
  {
    name: "storage.list_objects",
    category: "Object Storage",
    description: "List objects (files) in a bucket",
    params: [
      { name: "bucketName", type: "string", required: true, description: "Bucket name" },
      { name: "prefix", type: "string", required: false, description: "Key prefix filter" },
      { name: "page", type: "number", required: false, description: "Page number", default: 1 },
      { name: "limit", type: "number", required: false, description: "Items per page", default: 100 },
    ],
    schema: z.object({
      bucketName: z.string(),
      prefix: z.string().optional(),
      page: z.number().optional().default(1),
      limit: z.number().optional().default(100),
    }),
    example: { bucketName: "uploads" },
    handler: async (p) => {
      const { listObjects } = await import("../../../modules/storage/storage.service.js");
      return listObjects(p.bucketName, { prefix: p.prefix, page: p.page, limit: p.limit });
    },
  },
  {
    name: "storage.get_object_info",
    category: "Object Storage",
    description: "Get metadata for a specific object (size, type, URLs)",
    params: [
      { name: "bucketName", type: "string", required: true, description: "Bucket name" },
      { name: "key", type: "string", required: true, description: "Object key (file path)" },
    ],
    schema: z.object({ bucketName: z.string(), key: z.string() }),
    example: { bucketName: "uploads", key: "images/logo.png" },
    handler: async (p) => {
      const { getObjectMeta } = await import("../../../modules/storage/storage.service.js");
      const meta = await getObjectMeta(p.bucketName, p.key);
      if (!meta) throw new Error(`Object "${p.key}" not found in bucket "${p.bucketName}"`);
      return meta;
    },
  },
  {
    name: "storage.get_download_url",
    category: "Object Storage",
    description: "Generate a pre-signed download URL",
    params: [
      { name: "bucketName", type: "string", required: true, description: "Bucket name" },
      { name: "key", type: "string", required: true, description: "Object key (file path)" },
      { name: "expiresInSeconds", type: "number", required: false, description: "URL expiry in seconds", default: 3600 },
    ],
    schema: z.object({
      bucketName: z.string(),
      key: z.string(),
      expiresInSeconds: z.number().optional().default(3600),
    }),
    example: { bucketName: "uploads", key: "report.pdf" },
    handler: async (p) => {
      const { createPresignedUrl } = await import("../../../modules/storage/storage.service.js");
      const baseUrl = process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 18080}`;
      const result = await createPresignedUrl(p.bucketName, p.key, p.expiresInSeconds, baseUrl);
      return result;
    },
  },
  {
    name: "storage.delete_object",
    category: "Object Storage",
    description: "Delete an object from a bucket",
    params: [
      { name: "bucketName", type: "string", required: true, description: "Bucket name" },
      { name: "key", type: "string", required: true, description: "Object key to delete" },
    ],
    schema: z.object({ bucketName: z.string(), key: z.string() }),
    example: { bucketName: "uploads", key: "old-file.txt" },
    handler: async (p) => {
      const { deleteObject } = await import("../../../modules/storage/storage.service.js");
      await deleteObject(p.bucketName, p.key);
      return { deleted: true, key: p.key };
    },
  },
];
