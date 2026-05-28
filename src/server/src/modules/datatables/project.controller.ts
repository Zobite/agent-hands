import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { requireAuth } from "../../common/auth/middleware.js";
import {
  createProjectBodySchema,
  updateProjectBodySchema,
} from "./project.schema.js";
import type { CreateProjectBody, UpdateProjectBody } from "./project.schema.js";
import {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "./project.service.js";

export function registerProjectRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();

  // GET / — list all projects
  r.get("/", { preHandler: [requireAuth] }, async (_req, reply) => {
    const items = await listProjects();
    return reply.send({
      items,
      meta: { total: items.length },
    });
  });

  // POST / — create project
  r.post(
    "/",
    {
      preHandler: [requireAuth],
      schema: { body: createProjectBodySchema },
    },
    async (req, reply) => {
      const result = await createProject(req.body as CreateProjectBody, req.auth!.userId);
      return reply.code(201).send(result);
    },
  );

  // GET /:id — get project by id
  r.get("/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = await getProjectById(id);
    if (!result) return reply.code(400).send({ error: "not_found", message: "Project not found" });
    return reply.send(result);
  });

  // PATCH /:id — update project metadata
  r.patch(
    "/:id",
    {
      preHandler: [requireAuth],
      schema: { body: updateProjectBodySchema },
    },
    async (req, reply) => {
      const { id } = req.params as { id: string };
      const existing = await getProjectById(id);
      if (!existing) return reply.code(400).send({ error: "not_found", message: "Project not found" });

      const result = await updateProject(id, req.body as UpdateProjectBody);
      return reply.send(result);
    },
  );

  // DELETE /:id — delete project (cascades tables + rows)
  r.delete("/:id", { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = await getProjectById(id);
    if (!existing) return reply.code(400).send({ error: "not_found", message: "Project not found" });

    await deleteProject(id);
    return reply.send({ id, deleted: true });
  });
}
