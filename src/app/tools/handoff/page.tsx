"use client"

import { useState } from "react"

type FormState = {
  title: string
  repo: string
  branch: string
  context: string
  criteria: string
  constraints: string
  outOfScope: string
  skills: string
  doneSignal: string
  author: string
}

const EMPTY: FormState = {
  title: "",
  repo: "",
  branch: "",
  context: "",
  criteria: "",
  constraints: "",
  outOfScope: "",
  skills: "",
  doneSignal: "Post link in #fish-tank mentioning @Ren AI",
  author: "Ren",
}

function generateMarkdown(f: FormState): string {
  const criteria = f.criteria
    .split("\n")
    .filter(Boolean)
    .map((l) => `- [ ] ${l.trim().replace(/^[-*]\s*/, "")}`)
    .join("\n")

  const skills = f.skills
    .split("\n")
    .filter(Boolean)
    .map((l) => `- ${l.trim()}`)
    .join("\n")

  return `## Task: ${f.title}
**Repo/path:** ${f.repo}
**Branch:** \`${f.branch || "feat/" + f.title.toLowerCase().replace(/\s+/g, "-")}\`
**Skills to read:**
${skills || "- (none specified)"}

### Context
${f.context}

### Acceptance Criteria
${criteria || "- [ ] (not specified)"}

### Constraints
${f.constraints || "(none)"}

### Out of Scope
${f.outOfScope || "(none)"}

### Done Signal
${f.doneSignal}

---
**Status:** in-progress
**Author:** ${f.author}
**Decisions:**
**Blockers:**`
}

export default function HandoffPage() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [copied, setCopied] = useState(false)

  const output = generateMarkdown(form)

  const update = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const copy = async () => {
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => setForm(EMPTY)

  const fields: {
    label: string
    field: keyof FormState
    type: "input" | "textarea"
    placeholder?: string
    hint?: string
    rows?: number
  }[] = [
    { label: "Task Title", field: "title", type: "input", placeholder: "Add dark mode to shop" },
    { label: "Repo / Path", field: "repo", type: "input", placeholder: "gasoto-ai/fish-tank-app or /path/to/repo" },
    { label: "Branch", field: "branch", type: "input", placeholder: "feat/dark-mode (auto-generated if blank)" },
    {
      label: "Context",
      field: "context",
      type: "textarea",
      rows: 3,
      placeholder: "Background, why this matters, any gotchas...",
    },
    {
      label: "Acceptance Criteria",
      field: "criteria",
      type: "textarea",
      rows: 4,
      hint: "One criterion per line",
      placeholder: "next dev starts without errors\nDark mode toggle persists on refresh",
    },
    {
      label: "Constraints",
      field: "constraints",
      type: "textarea",
      rows: 2,
      placeholder: "Don't break existing tests, no new dependencies...",
    },
    {
      label: "Out of Scope",
      field: "outOfScope",
      type: "textarea",
      rows: 2,
      placeholder: "Don't refactor the whole cart while you're in there...",
    },
    {
      label: "Skills to Read",
      field: "skills",
      type: "textarea",
      rows: 2,
      hint: "One path per line",
      placeholder: ".workflow/skills/patterns/writing-react/SKILL.md",
    },
    {
      label: "Done Signal",
      field: "doneSignal",
      type: "input",
      placeholder: "Post link in #fish-tank mentioning @Ren AI",
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-100">Handoff Generator</h1>
        <p className="text-stone-600 text-sm mt-0.5">Fill in the form, copy the markdown, paste in #fish-tank</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-stone-500 text-xs uppercase tracking-widest mb-1.5">Author</label>
            <select
              value={form.author}
              onChange={update("author")}
              className="w-full bg-stone-900 border border-stone-800 text-stone-300 px-3 py-2 text-sm rounded-sm focus:outline-none"
            >
              <option>Ren</option>
              <option>George</option>
              <option>Forge</option>
            </select>
          </div>

          {fields.map(({ label, field, type, placeholder, hint, rows }) => (
            <div key={field}>
              <label className="block text-stone-500 text-xs uppercase tracking-widest mb-1.5">
                {label}
                {hint && <span className="normal-case tracking-normal text-stone-700 ml-2">— {hint}</span>}
              </label>
              {type === "input" ? (
                <input
                  type="text"
                  placeholder={placeholder}
                  value={form[field]}
                  onChange={update(field)}
                  className="w-full bg-stone-900 border border-stone-800 text-stone-200 placeholder-stone-700 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-amber-700"
                />
              ) : (
                <textarea
                  placeholder={placeholder}
                  value={form[field]}
                  onChange={update(field)}
                  rows={rows || 3}
                  className="w-full bg-stone-900 border border-stone-800 text-stone-200 placeholder-stone-700 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-amber-700 resize-none"
                />
              )}
            </div>
          ))}

          <button
            onClick={reset}
            className="text-stone-600 hover:text-stone-400 text-sm transition-colors"
          >
            Reset form
          </button>
        </div>

        {/* Output */}
        <div className="sticky top-20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-stone-500 text-xs uppercase tracking-widest">Output</span>
            <button
              onClick={copy}
              className={`text-xs px-3 py-1.5 rounded-sm transition-colors ${
                copied
                  ? "bg-green-900 text-green-400"
                  : "bg-stone-800 hover:bg-stone-700 text-stone-400"
              }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="bg-stone-900 border border-stone-800 rounded-sm p-4 text-xs text-stone-400 whitespace-pre-wrap font-mono overflow-auto max-h-[600px]">
            {output}
          </pre>
        </div>
      </div>
    </div>
  )
}
