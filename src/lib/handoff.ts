/**
 * Handoff template generator — pure function, no React.
 * Extracted from the handoff page so it can be unit tested.
 */

export type HandoffForm = {
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

export const HANDOFF_DEFAULTS: HandoffForm = {
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

export function generateHandoff(f: HandoffForm): string {
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

  const branch = f.branch || `feat/${f.title.toLowerCase().replace(/\s+/g, "-")}`

  return `## Task: ${f.title}
**Repo/path:** ${f.repo}
**Branch:** \`${branch}\`
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
${f.doneSignal}`
}
