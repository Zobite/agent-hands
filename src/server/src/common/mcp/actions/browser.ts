import { z } from "zod";
import type { ActionDefinition } from "../registry.js";
import {
  listBrowserProfiles,
  createBrowserProfile,
  deleteBrowserProfile,
  startBrowser,
  stopBrowser,
  executeBrowserAction,
  getActiveTabs,
  runBatchSteps,
} from "../../../modules/browsers/browser.service.js";
import {
  createProfileBodySchema,
  listProfilesQuerySchema,
  runStepsBodySchema,
} from "../../../modules/browsers/browser.schema.js";

export const browserProfileActions: ActionDefinition[] = [
  {
    name: "browser.list",
    category: "Browser Profiles",
    description: "List all browser profiles",
    params: [
      { name: "search", type: "string", required: false, description: "Search by profile name" },
      { name: "page", type: "number", required: false, description: "Page number", default: 1 },
      { name: "limit", type: "number", required: false, description: "Limit number", default: 10 },
    ],
    schema: listProfilesQuerySchema,
    example: {},
    handler: async (payload) => {
      return listBrowserProfiles(payload);
    },
  },
  {
    name: "browser.create",
    category: "Browser Profiles",
    description: "Create a new browser profile with dynamic fingerprint generation",
    params: [
      { name: "name", type: "string", required: true, description: "Profile name" },
      { name: "description", type: "string", required: false, description: "Profile description" },
      { name: "proxyConfig", type: "object", required: false, description: "Proxy config { server, username?, password? }" },
      { name: "fingerprintConfig", type: "object", required: false, description: "Fingerprint overrides { userAgent?, viewport?, locale?, timezoneId?, geolocation? }" },
    ],
    schema: createProfileBodySchema,
    example: { name: "Stealth Scraping Profile", description: "Bypasses standard fingerprint trackers" },
    handler: async (payload) => {
      return createBrowserProfile(payload);
    },
  },
  {
    name: "browser.start",
    category: "Browser Profiles",
    description: "Launch a browser profile in persistent background mode, starting Playwright and opening CDP port",
    params: [
      { name: "id", type: "string", required: true, description: "Profile ID (bpr_xxxx)" },
    ],
    schema: z.object({ id: z.string() }),
    example: { id: "bpr_xxxx" },
    handler: async (payload) => {
      const activeInfo = await startBrowser(payload.id);
      return {
        id: payload.id,
        status: "running",
        cdpPort: activeInfo.cdpPort,
        wsEndpoint: activeInfo.wsEndpoint,
      };
    },
  },
  {
    name: "browser.stop",
    category: "Browser Profiles",
    description: "Gracefully shut down a running browser profile persistent context process",
    params: [
      { name: "id", type: "string", required: true, description: "Profile ID (bpr_xxxx)" },
    ],
    schema: z.object({ id: z.string() }),
    example: { id: "bpr_xxxx" },
    handler: async (payload) => {
      return stopBrowser(payload.id);
    },
  },
  {
    name: "browser.delete",
    category: "Browser Profiles",
    description: "Delete a browser profile database record and recursively delete all cookie/state folders from disk",
    params: [
      { name: "id", type: "string", required: true, description: "Profile ID (bpr_xxxx)" },
    ],
    schema: z.object({ id: z.string() }),
    example: { id: "bpr_xxxx" },
    handler: async (payload) => {
      return deleteBrowserProfile(payload.id);
    },
  },
  {
    name: "browser.execute",
    category: "Browser Profiles",
    description: "Execute a remote control action on a running browser profile context page (navigate, click, type, screenshot, get_content, eval, open_tab, close_tab)",
    params: [
      { name: "id", type: "string", required: true, description: "Profile ID (bpr_xxxx)" },
      { name: "action", type: "string", required: true, description: "Action to execute: 'navigate', 'click', 'type', 'screenshot', 'get_content', 'eval', 'open_tab', 'close_tab'" },
      { name: "tabIndex", type: "number", required: false, description: "Optional target tab index (defaults to 0)" },
      { name: "url", type: "string", required: false, description: "URL for navigate or open_tab action" },
      { name: "selector", type: "string", required: false, description: "CSS Selector for click or type action" },
      { name: "text", type: "string", required: false, description: "Text value for input type action" },
      { name: "code", type: "string", required: false, description: "Javascript string for evaluate action" },
    ],
    schema: z.object({
      id: z.string(),
      action: z.enum(["navigate", "click", "type", "screenshot", "get_content", "eval", "open_tab", "close_tab"]),
      tabIndex: z.number().int().min(0).optional(),
      url: z.string().url().optional(),
      selector: z.string().optional(),
      text: z.string().optional(),
      code: z.string().optional(),
    }),
    example: { id: "bpr_xxxx", action: "navigate", url: "https://bot.sannysoft.com" },
    handler: async (payload) => {
      const { id, ...body } = payload;
      return executeBrowserAction(id, body);
    },
  },
  {
    name: "browser.list_tabs",
    category: "Browser Profiles",
    description: "List all active tabs/pages in a running browser profile context",
    params: [
      { name: "id", type: "string", required: true, description: "Profile ID (bpr_xxxx)" },
    ],
    schema: z.object({ id: z.string() }),
    example: { id: "bpr_xxxx" },
    handler: async (payload) => {
      return getActiveTabs(payload.id);
    },
  },
  {
    name: "browser.run_steps",
    category: "Browser Profiles",
    description: "Execute a sequence of browser actions on a profile. Omit tabIndex to auto-create a new tab (closed after). Pass tabIndex to reuse an existing tab (kept open).",
    params: [
      { name: "profileId", type: "string", required: false, description: "Optional Profile ID. If omitted, runs in temporary ephemeral incognito mode." },
      { name: "tabIndex", type: "number", required: false, description: "Optional tab index to reuse. Omit to create a new tab (auto-closed after execution)." },
      { name: "steps", type: "array", required: true, description: "Array of steps: { action, url?, selector?, text?, code?, timeout? }" },
    ],
    schema: runStepsBodySchema,
    example: {
      profileId: "bpr_xxxx",
      tabIndex: 0,
      steps: [
        { action: "navigate", url: "https://httpbin.org" },
        { action: "screenshot" }
      ]
    },
    handler: async (payload) => {
      return runBatchSteps(payload);
    },
  },
];
