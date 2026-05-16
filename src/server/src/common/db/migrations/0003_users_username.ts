import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0003_users_username",
  up: [
    `ALTER TABLE users ADD COLUMN username TEXT`,
    `UPDATE users SET username = substr(email, 1, instr(email, '@') - 1) WHERE username IS NULL`,
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
  ],
};

export default migration;
