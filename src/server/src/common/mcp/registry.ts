/**
 * MCP Action Registry — Central registry for all built-in system actions.
 */
import type { z } from "zod";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ActionParam {
  name: string;
  type: "string" | "number" | "boolean" | "object";
  required: boolean;
  description: string;
  default?: unknown;
}

export interface ActionDefinition {
  name: string;
  category: string;
  description: string;
  params: ActionParam[];
  schema: z.ZodType;
  example: Record<string, unknown>;
  handler: (payload: any) => Promise<unknown>;
}

interface CategoryMeta {
  name: string;
  description: string;
  order: number;
}

const CATEGORIES: CategoryMeta[] = [
  { name: "Variables", description: "Flat key-value store. Supports string, number, boolean, json types, TTL. Use key prefixes for organization.", order: 1 },
  { name: "Databases & Tables", description: "Structured data with typed columns. Databases contain tables, tables contain rows.", order: 3 },
  { name: "Storage", description: "Object storage with buckets for file management.", order: 5 },
];

// ── Internal State ─────────────────────────────────────────────────────────────

const actionsMap = new Map<string, ActionDefinition>();

export function registerActions(actions: ActionDefinition[]) {
  for (const a of actions) actionsMap.set(a.name, a);
}

export function getAction(name: string) {
  return actionsMap.get(name);
}

export function getAllActions() {
  return Array.from(actionsMap.values());
}

// ── Overview Generator ─────────────────────────────────────────────────────────

export function generateOverview(): string {
  const grouped = new Map<string, ActionDefinition[]>();
  for (const a of actionsMap.values()) {
    const list = grouped.get(a.category) ?? [];
    list.push(a);
    grouped.set(a.category, list);
  }

  const lines: string[] = [
    "# Agent Hands — Available Actions",
    "",
    "Call get_action_docs({ action: \"<name>\" }) for params & examples.",
    "Call execute({ action: \"<name>\", payload: {...} }) to run.",
    "",
  ];

  for (const cat of CATEGORIES) {
    const items = grouped.get(cat.name);
    if (!items?.length) continue;
    lines.push(`## ${cat.name}`);
    lines.push(cat.description);
    for (const a of items) lines.push(`- ${a.name} — ${a.description}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ── Action Docs Generator ──────────────────────────────────────────────────────

export function generateActionDocs(name: string): Record<string, unknown> | null {
  const a = getAction(name);
  if (!a) return null;

  return {
    action: a.name,
    category: a.category,
    description: a.description,
    params: a.params.map((p) => ({
      name: p.name,
      type: p.type,
      required: p.required,
      description: p.description,
      ...(p.default !== undefined ? { default: p.default } : {}),
    })),
    example: { action: a.name, payload: a.example },
  };
}

// ── Execute ────────────────────────────────────────────────────────────────────

export async function executeAction(
  name: string,
  payload: Record<string, unknown>,
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const a = getAction(name);
  if (!a) {
    const available = Array.from(actionsMap.keys()).join(", ");
    return { success: false, error: `Unknown action "${name}". Available: ${available}` };
  }

  const parsed = a.schema.safeParse(payload);
  if (!parsed.success) {
    const errs = parsed.error.errors
      .map((e) => `${e.path.join(".") || "root"}: ${e.message}`)
      .join("; ");
    return { success: false, error: `Invalid payload: ${errs}` };
  }

  try {
    const result = await a.handler(parsed.data);
    return { success: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return { success: false, error: msg };
  }
}
