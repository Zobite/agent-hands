import type { Migration } from "../migrate.js";

const migration: Migration = {
  name: "0001_initial_schema",
  up: [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_hash TEXT NOT NULL UNIQUE,
      prefix TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      permissions TEXT NOT NULL DEFAULT '["*"]',
      last_used_at INTEGER,
      expires_at INTEGER,
      created_at INTEGER NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT 'Untitled',
      icon TEXT,
      cover TEXT,
      parent_id TEXT,
      is_public INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      "order" REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      parent_id TEXT,
      type TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '{}',
      "order" REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS databases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      schema TEXT NOT NULL DEFAULT '[]',
      doc_id TEXT,
      created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS database_rows (
      id TEXT PRIMARY KEY,
      database_id TEXT NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
      properties TEXT NOT NULL DEFAULT '{}',
      created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS files (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
      size INTEGER NOT NULL DEFAULT 0,
      uploaded_by TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at INTEGER NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_blocks_doc_id ON blocks(doc_id)`,
    `CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents(parent_id)`,
    `CREATE INDEX IF NOT EXISTS idx_database_rows_database_id ON database_rows(database_id)`,
    `CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)`,

    // FTS5
    `CREATE VIRTUAL TABLE IF NOT EXISTS fts_documents USING fts5(
      id UNINDEXED,
      title,
      content='documents',
      content_rowid='rowid'
    )`,

    `CREATE VIRTUAL TABLE IF NOT EXISTS fts_blocks USING fts5(
      id UNINDEXED,
      doc_id UNINDEXED,
      type UNINDEXED,
      content,
      content='blocks',
      content_rowid='rowid'
    )`,

    // FTS triggers
    `CREATE TRIGGER IF NOT EXISTS trg_fts_docs_insert AFTER INSERT ON documents BEGIN
      INSERT INTO fts_documents(id, title) VALUES (new.id, new.title);
    END`,

    `CREATE TRIGGER IF NOT EXISTS trg_fts_docs_update AFTER UPDATE ON documents BEGIN
      UPDATE fts_documents SET title = new.title WHERE id = old.id;
    END`,

    `CREATE TRIGGER IF NOT EXISTS trg_fts_docs_delete AFTER DELETE ON documents BEGIN
      DELETE FROM fts_documents WHERE id = old.id;
    END`,

    `CREATE TRIGGER IF NOT EXISTS trg_fts_blocks_insert AFTER INSERT ON blocks BEGIN
      INSERT INTO fts_blocks(id, doc_id, type, content) VALUES (new.id, new.doc_id, new.type, new.content);
    END`,

    `CREATE TRIGGER IF NOT EXISTS trg_fts_blocks_update AFTER UPDATE ON blocks BEGIN
      UPDATE fts_blocks SET content = new.content WHERE id = old.id;
    END`,

    `CREATE TRIGGER IF NOT EXISTS trg_fts_blocks_delete AFTER DELETE ON blocks BEGIN
      DELETE FROM fts_blocks WHERE id = old.id;
    END`,

    // migrations tracker (kept for backward compat reference, actual tracking uses _migrations_v2)
    `CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applied_at INTEGER NOT NULL
    )`,
  ],
};

export default migration;
