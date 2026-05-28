import type { FastifyInstance } from "fastify";
import { registerProjectRoutes } from "./project.controller.js";
import { registerTableRoutes } from "./table.controller.js";

export default async function datatablesModule(app: FastifyInstance) {
  registerProjectRoutes(app);
  registerTableRoutes(app);
}

// Metadata for auto-loader
export const MODULE_PREFIX = "/api/datatables";
