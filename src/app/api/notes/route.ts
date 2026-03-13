import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET() {
  const db = getDb()
  const notes = db.prepare("SELECT * FROM notes ORDER BY updated_at DESC").all()
  return NextResponse.json(notes)
}

export async function POST(request: NextRequest) {
  const db = getDb()
  const body = await request.json()
  const { title, content, author = "Forge" } = body

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const result = db.prepare(`
    INSERT INTO notes (title, content, author)
    VALUES (?, ?, ?)
  `).run(title, content || "", author)

  const note = db.prepare("SELECT * FROM notes WHERE id = ?").get(result.lastInsertRowid)
  return NextResponse.json(note, { status: 201 })
}
