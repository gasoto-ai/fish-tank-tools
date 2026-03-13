import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  const db = getDb()
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all()
  return NextResponse.json(tasks)
}

export async function POST(request: NextRequest) {
  const db = getDb()
  const body = await request.json()
  const { title, description, status = "todo", author = "Forge" } = body

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const result = db.prepare(`
    INSERT INTO tasks (title, description, status, author)
    VALUES (?, ?, ?, ?)
  `).run(title, description || null, status, author)

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid)
  return NextResponse.json(task, { status: 201 })
}
