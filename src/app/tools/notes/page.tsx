import { getDb } from "@/lib/db"
import NotesClient from "./NotesClient"

export const dynamic = "force-dynamic"

type Note = {
  id: number
  title: string
  content: string
  author: string
  created_at: string
  updated_at: string
}

export default function NotesPage() {
  const db = getDb()
  const notes = db.prepare("SELECT * FROM notes ORDER BY updated_at DESC").all() as Note[]

  return <NotesClient initialNotes={notes} />
}
