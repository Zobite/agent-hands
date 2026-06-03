import { lazy } from "react";
import type { ModuleNav, ModuleRoute } from "src/common/types/router";

export const routes: ModuleRoute[] = [
  {
    path: "/system-info",
    element: lazy(() => import("./pages/SystemInfoPage")),
    guard: "auth",
    layout: "app",
  },
];

export const nav: ModuleNav = {
  label: "System Info",
  path: "/system-info",
  icon: "monitor",
  order: 99,
  group: "admin",
};
