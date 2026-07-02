import { DatabaseSync } from "node:sqlite";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

const dataDir = process.env.DATA_DIR || join(process.cwd(), "data");
const dbPath = join(dataDir, "datasheets.sqlite");

let db: DatabaseSync | undefined;

function initializeDb() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }

  const nextDb = new DatabaseSync(dbPath);
  nextDb.exec("PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
  nextDb.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      product_title TEXT,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS document_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      version_name TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    );
  `);
  db = nextDb;
  return nextDb;
}

export function getDb() {
  return db || initializeDb();
}
