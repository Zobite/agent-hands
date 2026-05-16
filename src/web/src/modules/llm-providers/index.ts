import { lazy } from "react";
import type { ModuleRoute, ModuleNav } from "src/common/types/router";

const LlmProvidersPage = lazy(() => import("./pages/LlmProvidersPage"));

export const routes: ModuleRoute[] = [
  {
    path: "/llm-providers",
    element: LlmProvidersPage,
  },
];

export const nav: ModuleNav = {
  label: "LLM Providers",
  icon: "cpu",
  order: 3,
  group: "admin",
  requiredRole: ["admin", "superadmin"],
};
