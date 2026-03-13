import Database from "better-sqlite3"
import path from "path"
import fs from "fs"

// ─── Exported types ────────────────────────────────────────────────────────────

export type TaskStatus = "todo" | "in-progress" | "done"

export type Task = {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  author: string
  created_at: string
  updated_at: string
}

export type Note = {
  id: number
  title: string
  content: string
  author: string
  created_at: string
  updated_at: string
}

// ─── DB singleton ──────────────────────────────────────────────────────────────

const DB_PATH = path.join(process.cwd(), "data", "fish-tank-tools.db")

const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH)
    _db.pragma("journal_mode = WAL")
    _db.pragma("foreign_keys = ON")
    initSchema(_db)
    seedIfEmpty(_db)
  }
  return _db
}

// ─── Schema ────────────────────────────────────────────────────────────────────

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done')),
      author TEXT DEFAULT 'Forge',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      author TEXT DEFAULT 'Forge',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

// ─── Seed ──────────────────────────────────────────────────────────────────────

function seedIfEmpty(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) as c FROM tasks").get() as { c: number }).c
  if (count > 0) return

  const insert = db.prepare(`
    INSERT INTO tasks (title, description, status, author)
    VALUES (?, ?, ?, ?)
  `)

  db.transaction(() => {
    insert.run("Set up fish-tank-tools repo", "Standalone tools app split from fish-tank-app", "done", "Forge")
    insert.run("Build Kanban board", "Persistent task board with SQLite", "done", "Forge")
    insert.run("Build handoff generator", "Form → formatted markdown for #fish-tank", "done", "Forge")
    insert.run("Build PR status panel", "Live GitHub API pull for gasoto-ai repos", "done", "Forge")
    insert.run("Build notes scratchpad", "Persistent notes with inline editing", "done", "Forge")
  })()
}
