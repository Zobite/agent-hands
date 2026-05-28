import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0020_remove_variable_namespaces",
  up: [
    // Null out projectId on all existing variables — detach from namespaces
    `UPDATE variables SET project_id = NULL WHERE project_id IS NOT NULL`,
  ],
};

export default migration;
