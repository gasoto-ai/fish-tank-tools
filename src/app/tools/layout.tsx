import Link from "next/link"

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-950">
      <nav className="border-b border-stone-800 bg-stone-950/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-stone-300 font-semibold tracking-tight">
            🐟 Fish Tank Tools
          </span>
          <div className="flex gap-1">
            <Link href="/tools" className="px-4 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors">
              Task Board
            </Link>
            <Link href="/tools/prs" className="px-4 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors">
              PRs
            </Link>
            <Link href="/tools/notes" className="px-4 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors">
              Notes
            </Link>
            <Link href="/tools/handoff" className="px-4 py-2 text-sm text-stone-400 hover:text-stone-200 transition-colors">
              Handoff
            </Link>
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-6 py-6">
        {children}
      </div>
    </div>
  )
}
