import type { FastifyInstance } from "fastify";
import { registerBrowserRoutes } from "./browser.controller.js";

export default async function browsersModule(app: FastifyInstance) {
  registerBrowserRoutes(app);
}

// Metadata for auto-loader
export const MODULE_PREFIX = "/api/browsers";
