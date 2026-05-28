import { z } from "zod";

// ── Project CRUD Schemas ────────────────────────────────────────────────────────

export const createProjectBodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  icon: z.string().max(32).optional(),
});

export const updateProjectBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  icon: z.string().max(32).nullable().optional(),
});

// ── Inferred Types ──────────────────────────────────────────────────────────────

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;
