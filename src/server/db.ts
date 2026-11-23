import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

/**
 * SQLite database (single file, no server to run).
 *
 * Uses the SQLite built into Node.js 22.13+ (node:sqlite), so there is nothing to compile or install.
 * The file lives in ./data/archopt.db by default; set ARCHOPT_DB_PATH to move it.
 * All SQL is isolated in src/server so another database (for example Postgres on
 * a hosted platform) can replace this module without touching the API routes' logic.
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  organization TEXT,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS projects (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  plot_w REAL NOT NULL,
  plot_h REAL NOT NULL,
  spaces INTEGER NOT NULL,
  description TEXT,
  layout_ids TEXT NOT NULL DEFAULT '[]',
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, id)
);
CREATE TABLE IF NOT EXISTS layouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  recommended INTEGER NOT NULL DEFAULT 0,
  tags TEXT NOT NULL,
  rooms TEXT NOT NULL,
  metrics TEXT NOT NULL,
  cost REAL NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_layouts_project ON layouts(user_id, project_id);
`;

/** Thin wrapper adding transactions on top of node:sqlite. */
export class Db {
  constructor(private readonly conn: DatabaseSync) {}

  prepare(sql: string) {
    return this.conn.prepare(sql);
  }

  /** Returns a function that runs `fn` inside a transaction, rolling back if it throws. */
  transaction<T>(fn: () => T): () => T {
    return () => {
      this.conn.exec("BEGIN");
      try {
        const result = fn();
        this.conn.exec("COMMIT");
        return result;
      } catch (e) {
        this.conn.exec("ROLLBACK");
        throw e;
      }
    };
  }
}

const globalForDb = globalThis as unknown as { __archoptDb?: Db };

export function db(): Db {
  if (!globalForDb.__archoptDb) {
    const file = process.env.ARCHOPT_DB_PATH ?? path.join(process.cwd(), "data", "archopt.db");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const conn = new DatabaseSync(file);
    conn.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
    conn.exec(SCHEMA);
    globalForDb.__archoptDb = new Db(conn);
  }
  return globalForDb.__archoptDb;
}
