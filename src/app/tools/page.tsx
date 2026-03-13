import { getDb } from "@/lib/db"
import KanbanBoard from "./KanbanBoard"

export const dynamic = "force-dynamic"

type Task = {
  id: number
  title: string
  description: string | null
  status: "todo" | "in-progress" | "done"
  author: string
  created_at: string
}

export default function ToolsPage() {
  const db = getDb()
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at ASC").all() as Task[]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-100">Task Board</h1>
          <p className="text-stone-600 text-sm mt-0.5">Fish Tank · Ren + Forge</p>
        </div>
      </div>
      <KanbanBoard initialTasks={tasks} />
    </div>
  )
}
