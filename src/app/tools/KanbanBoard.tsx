"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core"

type Task = {
  id: number
  title: string
  description: string | null
  status: "todo" | "in-progress" | "done"
  author: string
  created_at: string
}

type Column = {
  id: "todo" | "in-progress" | "done"
  label: string
  color: string
}

const COLUMNS: Column[] = [
  { id: "todo", label: "To Do", color: "text-stone-400" },
  { id: "in-progress", label: "In Progress", color: "text-amber-500" },
  { id: "done", label: "Done", color: "text-green-500" },
]

// ─── TaskCard (pure display, no drag state) ────────────────────────────────────

function TaskCardContent({
  task,
  onMove,
  onDelete,
  dimmed = false,
}: {
  task: Task
  onMove: (id: number, status: Task["status"]) => void
  onDelete: (id: number) => void
  dimmed?: boolean
}) {
  const statuses: Task["status"][] = ["todo", "in-progress", "done"]
  const currentIdx = statuses.indexOf(task.status)

  return (
    <div
      className={`bg-stone-900 border border-stone-800 rounded-sm p-3 space-y-2 group transition-opacity ${
        dimmed ? "opacity-40" : "opacity-100"
      }`}
    >
      <p className="text-stone-200 text-sm font-medium leading-snug">{task.title}</p>
      {task.description && (
        <p className="text-stone-600 text-xs leading-relaxed">{task.description}</p>
      )}
      <div className="flex items-center justify-between pt-1">
        <span className="text-stone-700 text-xs">{task.author || "—"}</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {currentIdx > 0 && (
            <button
              onPointerDown={(e) => e.stopPropagation()} // don't let buttons start a drag
              onClick={() => onMove(task.id, statuses[currentIdx - 1])}
              className="text-stone-600 hover:text-stone-300 text-xs px-1.5 py-0.5 bg-stone-800 rounded-sm transition-colors"
            >
              ←
            </button>
          )}
          {currentIdx < 2 && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onMove(task.id, statuses[currentIdx + 1])}
              className="text-stone-600 hover:text-stone-300 text-xs px-1.5 py-0.5 bg-stone-800 rounded-sm transition-colors"
            >
              →
            </button>
          )}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onDelete(task.id)}
            className="text-stone-700 hover:text-red-500 text-xs px-1.5 py-0.5 bg-stone-800 rounded-sm transition-colors"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Draggable wrapper ─────────────────────────────────────────────────────────

function DraggableCard({
  task,
  onMove,
  onDelete,
  isDragging,
}: {
  task: Task
  onMove: (id: number, status: Task["status"]) => void
  onDelete: (id: number) => void
  isDragging: boolean
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { task },
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab active:cursor-grabbing touch-none"
    >
      <TaskCardContent task={task} onMove={onMove} onDelete={onDelete} dimmed={isDragging} />
    </div>
  )
}

// ─── Droppable column ──────────────────────────────────────────────────────────

function DroppableColumn({
  col,
  tasks,
  onMove,
  onDelete,
  onAdd,
  isOver,
  activeId,
}: {
  col: Column
  tasks: Task[]
  onMove: (id: number, status: Task["status"]) => void
  onDelete: (id: number) => void
  onAdd: (task: Task) => void
  isOver: boolean
  activeId: number | null
}) {
  const { setNodeRef } = useDroppable({ id: col.id })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-sm p-4 transition-all duration-150 ${
        isOver
          ? "bg-stone-800/60 ring-1 ring-amber-600/50"
          : "bg-stone-900/30"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xs font-semibold uppercase tracking-widest ${col.color}`}>
          {col.label}
        </h2>
        <span className="text-stone-700 text-xs">{tasks.length}</span>
      </div>
      <div className="space-y-2 min-h-[100px]">
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            onMove={onMove}
            onDelete={onDelete}
            isDragging={activeId === task.id}
          />
        ))}
      </div>
      <div className="mt-3">
        <AddTaskForm columnId={col.id} onAdd={onAdd} />
      </div>
    </div>
  )
}

// ─── Add task form (unchanged) ─────────────────────────────────────────────────

function AddTaskForm({ columnId, onAdd }: { columnId: Task["status"]; onAdd: (task: Task) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [author, setAuthor] = useState("Forge")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, status: columnId, author }),
    })

    if (res.ok) {
      const task = await res.json()
      onAdd(task)
      setTitle("")
      setDescription("")
      setOpen(false)
    }
    setSubmitting(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left text-stone-700 hover:text-stone-500 text-xs py-2 transition-colors"
      >
        + Add task
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-800 rounded-sm p-3 space-y-2">
      <input
        autoFocus
        type="text"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-stone-800 border border-stone-700 text-stone-200 placeholder-stone-600 px-3 py-1.5 text-xs rounded-sm focus:outline-none focus:border-amber-700"
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-stone-800 border border-stone-700 text-stone-200 placeholder-stone-600 px-3 py-1.5 text-xs rounded-sm focus:outline-none focus:border-amber-700"
      />
      <select
        value={author}
        onChange={(e) => setAuthor(e.target.value)}
        className="w-full bg-stone-800 border border-stone-700 text-stone-400 px-3 py-1.5 text-xs rounded-sm focus:outline-none"
      >
        <option value="Forge">Forge</option>
        <option value="Ren">Ren</option>
        <option value="George">George</option>
      </select>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-800 disabled:text-stone-600 text-stone-950 text-xs font-medium transition-colors rounded-sm"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-stone-600 hover:text-stone-400 text-xs transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

// ─── Board ─────────────────────────────────────────────────────────────────────

export default function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [overColumnId, setOverColumnId] = useState<Task["status"] | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // require 5px move before drag starts — preserves button clicks
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 }, // long-press 200ms on touch
    })
  )

  const move = async (id: number, status: Task["status"]) => {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  const del = async (id: number) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const add = (task: Task) => {
    setTasks((prev) => [...prev, task])
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task ?? null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id
    if (overId && COLUMNS.some((c) => c.id === overId)) {
      setOverColumnId(overId as Task["status"])
    } else {
      setOverColumnId(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setOverColumnId(null)

    if (!over) return

    const newStatus = over.id as Task["status"]
    const task = tasks.find((t) => t.id === active.id)
    if (!task || task.status === newStatus) return

    move(task.id, newStatus)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id)
          return (
            <DroppableColumn
              key={col.id}
              col={col}
              tasks={colTasks}
              onMove={move}
              onDelete={del}
              onAdd={add}
              isOver={overColumnId === col.id}
              activeId={activeTask?.id ?? null}
            />
          )
        })}
      </div>

      {/* Ghost card rendered at pointer position while dragging */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? (
          <div className="rotate-1 scale-105 shadow-2xl shadow-black/60 opacity-90">
            <TaskCardContent
              task={activeTask}
              onMove={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
