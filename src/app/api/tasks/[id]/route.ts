import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()
  const body = await request.json()
  const { title, description, status, author } = body

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id)
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  db.prepare(`
    UPDATE tasks
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        author = COALESCE(?, author),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(title ?? null, description ?? null, status ?? null, author ?? null, id)

  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id)
  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id)
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  db.prepare("DELETE FROM tasks WHERE id = ?").run(id)
  return NextResponse.json({ success: true })
}
