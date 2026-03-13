import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()
  const body = await request.json()
  const { title, content, author } = body

  const note = db.prepare("SELECT * FROM notes WHERE id = ?").get(id)
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 })

  db.prepare(`
    UPDATE notes
    SET title = COALESCE(?, title),
        content = COALESCE(?, content),
        author = COALESCE(?, author),
        updated_at = datetime('now')
    WHERE id = ?
  `).run(title ?? null, content ?? null, author ?? null, id)

  return NextResponse.json(db.prepare("SELECT * FROM notes WHERE id = ?").get(id))
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = getDb()

  const note = db.prepare("SELECT id FROM notes WHERE id = ?").get(id)
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 })

  db.prepare("DELETE FROM notes WHERE id = ?").run(id)
  return NextResponse.json({ success: true })
}
