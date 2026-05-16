import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0006_documents_content",
  up: [
    `ALTER TABLE documents ADD COLUMN content TEXT NOT NULL DEFAULT '[]'`,
  ],
};

export default migration;
