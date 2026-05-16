import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0010_variables_project",
  up: [
    `ALTER TABLE variables ADD COLUMN project_id TEXT`,
    `CREATE INDEX IF NOT EXISTS idx_variables_project_id ON variables(project_id)`,
    `DROP INDEX IF EXISTS idx_variables_ns_key`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_variables_prj_ns_key ON variables(COALESCE(project_id, ''), namespace, key)`,
  ],
};

export default migration;
