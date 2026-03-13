"use client"

import { useState } from "react"

type Note = {
  id: number
  title: string
  content: string
  author: string
  created_at: string
  updated_at: string
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NoteCard({
  note,
  onUpdate,
  onDelete,
}: {
  note: Note
  onUpdate: (id: number, updates: Partial<Note>) => void
  onDelete: (id: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    })
    if (res.ok) {
      const updated = await res.json()
      onUpdate(note.id, updated)
      setEditing(false)
    }
    setSaving(false)
  }

  const del = async () => {
    await fetch(`/api/notes/${note.id}`, { method: "DELETE" })
    onDelete(note.id)
  }

  if (editing) {
    return (
      <div className="bg-stone-900 border border-amber-700/50 rounded-sm p-4 space-y-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-stone-800 border border-stone-700 text-stone-200 px-3 py-1.5 text-sm font-medium rounded-sm focus:outline-none focus:border-amber-700"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full bg-stone-800 border border-stone-700 text-stone-300 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-amber-700 resize-none font-mono"
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 text-stone-950 text-xs font-medium transition-colors rounded-sm"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => { setTitle(note.title); setContent(note.content); setEditing(false) }}
            className="px-3 py-1.5 text-stone-600 hover:text-stone-400 text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-sm p-4 group">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-stone-200 font-medium text-sm">{note.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="text-stone-600 hover:text-stone-300 text-xs px-2 py-0.5 bg-stone-800 rounded-sm transition-colors"
          >
            Edit
          </button>
          <button
            onClick={del}
            className="text-stone-700 hover:text-red-500 text-xs px-2 py-0.5 bg-stone-800 rounded-sm transition-colors"
          >
            ×
          </button>
        </div>
      </div>
      {note.content && (
        <p className="text-stone-500 text-xs leading-relaxed whitespace-pre-wrap font-mono mb-3">
          {note.content}
        </p>
      )}
      <div className="flex items-center gap-3 text-xs text-stone-700">
        <span>{note.author}</span>
        <span>{timeAgo(note.updated_at)}</span>
      </div>
    </div>
  )
}

function NewNoteForm({ onAdd }: { onAdd: (note: Note) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [author, setAuthor] = useState("Forge")
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)

    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, author }),
    })

    if (res.ok) {
      const note = await res.json()
      onAdd(note)
      setTitle("")
      setContent("")
      setOpen(false)
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-center py-3 border border-dashed border-stone-800 hover:border-stone-600 text-stone-700 hover:text-stone-500 text-sm transition-colors rounded-sm"
      >
        + New note
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="bg-stone-900 border border-amber-700/50 rounded-sm p-4 space-y-3">
      <input
        autoFocus
        type="text"
        placeholder="Note title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-stone-800 border border-stone-700 text-stone-200 placeholder-stone-600 px-3 py-1.5 text-sm rounded-sm focus:outline-none focus:border-amber-700"
      />
      <textarea
        placeholder="Content (markdown, decisions, context...)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        className="w-full bg-stone-800 border border-stone-700 text-stone-300 placeholder-stone-600 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-amber-700 resize-none font-mono"
      />
      <div className="flex items-center gap-3">
        <select
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="bg-stone-800 border border-stone-700 text-stone-400 px-3 py-1.5 text-xs rounded-sm focus:outline-none"
        >
          <option>Forge</option>
          <option>Ren</option>
          <option>George</option>
        </select>
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 text-xs font-medium transition-colors rounded-sm"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-stone-600 hover:text-stone-400 text-xs transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function NotesClient({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-100">Notes</h1>
        <p className="text-stone-600 text-sm mt-0.5">Decisions, context, scratchpad</p>
      </div>

      <div className="max-w-2xl space-y-3">
        <NewNoteForm onAdd={(note) => setNotes((prev) => [note, ...prev])} />
        {notes.length === 0 ? (
          <p className="text-stone-700 text-sm text-center py-8">No notes yet.</p>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onUpdate={(id, updates) =>
                setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)))
              }
              onDelete={(id) => setNotes((prev) => prev.filter((n) => n.id !== id))}
            />
          ))
        )}
      </div>
    </div>
  )
}
