import { z } from "zod";
import type { ActionDefinition } from "../mcp/registry.js";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

const MAX_BODY_CHARS = 50_000;

export const fetchActions: ActionDefinition[] = [
  {
    name: "web.fetch",
    category: "Web",
    description:
      "Fetch a URL with browser-like headers to reduce bot detection. Returns status, response headers, and body (text or parsed JSON). Body is truncated at 50 000 chars.",
    params: [
      { name: "url", type: "string", required: true, description: "Target URL" },
      {
        name: "method",
        type: "string",
        required: false,
        description: "HTTP method",
        default: "GET",
      },
      {
        name: "body",
        type: "string",
        required: false,
        description: "Request body (string or JSON-stringified object)",
      },
      {
        name: "headers",
        type: "object",
        required: false,
        description: "Extra headers to merge on top of browser defaults",
      },
      {
        name: "cookies",
        type: "string",
        required: false,
        description: "Cookie string, e.g. 'session=abc; token=xyz'",
      },
      {
        name: "referer",
        type: "string",
        required: false,
        description: "Referer URL to include in the request",
      },
    ],
    schema: z.object({
      url: z.string().url(),
      method: z.string().optional().default("GET"),
      body: z.string().optional(),
      headers: z.record(z.string()).optional(),
      cookies: z.string().optional(),
      referer: z.string().optional(),
    }),
    example: { url: "https://example.com" },
    handler: async (p) => {
      const merged: Record<string, string> = { ...BROWSER_HEADERS };

      if (p.referer) merged["Referer"] = p.referer;
      if (p.cookies) merged["Cookie"] = p.cookies;
      if (p.headers) Object.assign(merged, p.headers);

      const method = (p.method ?? "GET").toUpperCase();
      const init: RequestInit = { method, headers: merged };
      if (p.body && method !== "GET" && method !== "HEAD") {
        init.body = p.body;
        merged["Content-Type"] ??= "application/json";
      }

      const res = await fetch(p.url, init);

      const contentType = res.headers.get("content-type") ?? "";
      const raw = await res.text();
      const truncated = raw.length > MAX_BODY_CHARS;
      const text = truncated ? raw.slice(0, MAX_BODY_CHARS) : raw;

      let body: unknown = text;
      if (contentType.includes("application/json")) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        responseHeaders[k] = v;
      });

      return {
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        body,
        truncated,
        url: res.url,
      };
    },
  },
];
