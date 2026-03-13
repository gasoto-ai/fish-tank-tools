"use client"

import { useEffect, useState } from "react"

type PR = {
  id: number
  number: number
  title: string
  state: "open" | "closed"
  html_url: string
  created_at: string
  updated_at: string
  user: { login: string }
  head: { ref: string }
  base: { ref: string }
  draft: boolean
  labels: { name: string; color: string }[]
  repo: string
  merged_at?: string | null
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function PRCard({ pr }: { pr: PR }) {
  const isMerged = pr.state === "closed" && pr.merged_at
  const isOpen = pr.state === "open"

  const statusColor = isOpen
    ? "bg-green-900/40 text-green-400 border-green-900"
    : isMerged
    ? "bg-purple-900/40 text-purple-400 border-purple-900"
    : "bg-stone-800 text-stone-500 border-stone-700"

  const statusLabel = isOpen ? "Open" : isMerged ? "Merged" : "Closed"

  return (
    <a
      href={pr.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-stone-900 border border-stone-800 rounded-sm p-4 hover:border-stone-700 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-stone-600 text-xs font-mono">{pr.repo}#{pr.number}</span>
            {pr.draft && (
              <span className="text-xs px-1.5 py-0.5 bg-stone-800 text-stone-600 border border-stone-700 rounded-sm">
                Draft
              </span>
            )}
          </div>
          <p className="text-stone-200 text-sm font-medium group-hover:text-amber-400 transition-colors truncate">
            {pr.title}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-stone-600 text-xs">
              {pr.head.ref} → {pr.base.ref}
            </span>
            <span className="text-stone-700 text-xs">{timeAgo(pr.updated_at)}</span>
            <span className="text-stone-700 text-xs">{pr.user.login}</span>
          </div>
          {pr.labels.length > 0 && (
            <div className="flex gap-1 mt-2">
              {pr.labels.map((l) => (
                <span
                  key={l.name}
                  className="text-xs px-1.5 py-0.5 rounded-sm border"
                  style={{
                    backgroundColor: `#${l.color}20`,
                    borderColor: `#${l.color}40`,
                    color: `#${l.color}`,
                  }}
                >
                  {l.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-sm border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
    </a>
  )
}

export default function PRsPage() {
  const [prs, setPRs] = useState<PR[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all")

  useEffect(() => {
    fetch("/api/github/prs")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setPRs(data)
      })
      .catch(() => setError("Failed to fetch"))
      .finally(() => setLoading(false))
  }, [])

  const filtered = prs.filter((pr) => {
    if (filter === "open") return pr.state === "open"
    if (filter === "closed") return pr.state === "closed"
    return true
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-100">Pull Requests</h1>
          <p className="text-stone-600 text-sm mt-0.5">gasoto-ai repos</p>
        </div>
        <a
          href="https://github.com/gasoto-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-stone-600 hover:text-stone-400 text-xs transition-colors"
        >
          github.com/gasoto-ai →
        </a>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(["all", "open", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-sm capitalize transition-colors ${
              filter === f
                ? "bg-stone-800 text-stone-200"
                : "text-stone-600 hover:text-stone-400"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-stone-600 text-sm py-10 text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-sm py-10 text-center">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-stone-600 text-sm py-10 text-center">No PRs found.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((pr) => (
            <PRCard key={`${pr.repo}-${pr.id}`} pr={pr} />
          ))}
        </div>
      )}
    </div>
  )
}
