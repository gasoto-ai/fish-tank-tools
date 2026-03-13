/**
 * TDD tests for the handoff template generator (pure function).
 */

import { generateHandoff, HANDOFF_DEFAULTS, type HandoffForm } from "../../lib/handoff"

const base: HandoffForm = {
  title: "Add dark mode",
  repo: "gasoto-ai/the-crate",
  branch: "feat/dark-mode",
  context: "Users want dark mode support",
  criteria: "Toggle works\nPreference persists",
  constraints: "No new dependencies",
  outOfScope: "Don't touch the cart",
  skills: ".workflow/skills/patterns/writing-react/SKILL.md",
  doneSignal: "Post PR link in #fish-tank",
  author: "Ren",
}

describe("generateHandoff", () => {
  it("includes the task title", () => {
    const output = generateHandoff(base)
    expect(output).toContain("## Task: Add dark mode")
  })

  it("includes the repo/path", () => {
    const output = generateHandoff(base)
    expect(output).toContain("gasoto-ai/the-crate")
  })

  it("uses the explicit branch when provided", () => {
    const output = generateHandoff(base)
    expect(output).toContain("`feat/dark-mode`")
  })

  it("auto-generates branch from title when branch is empty", () => {
    const output = generateHandoff({ ...base, branch: "" })
    expect(output).toContain("`feat/add-dark-mode`")
  })

  it("converts multi-word title to kebab-case branch", () => {
    const output = generateHandoff({ ...base, branch: "", title: "Fix the broken layout" })
    expect(output).toContain("`feat/fix-the-broken-layout`")
  })

  it("formats criteria as unchecked checkboxes", () => {
    const output = generateHandoff(base)
    expect(output).toContain("- [ ] Toggle works")
    expect(output).toContain("- [ ] Preference persists")
  })

  it("strips leading dashes/bullets from criteria lines", () => {
    const output = generateHandoff({ ...base, criteria: "- Already bulleted\n* Also bulleted" })
    expect(output).toContain("- [ ] Already bulleted")
    expect(output).toContain("- [ ] Also bulleted")
    expect(output).not.toContain("- [ ] - Already bulleted")
  })

  it("formats skills as bullet list", () => {
    const output = generateHandoff(base)
    expect(output).toContain("- .workflow/skills/patterns/writing-react/SKILL.md")
  })

  it("shows placeholder when skills is empty", () => {
    const output = generateHandoff({ ...base, skills: "" })
    expect(output).toContain("- (none specified)")
  })

  it("includes constraints section", () => {
    const output = generateHandoff(base)
    expect(output).toContain("No new dependencies")
  })

  it("shows (none) when constraints is empty", () => {
    const output = generateHandoff({ ...base, constraints: "" })
    expect(output).toContain("### Constraints\n(none)")
  })

  it("includes done signal", () => {
    const output = generateHandoff(base)
    expect(output).toContain("Post PR link in #fish-tank")
  })
})

describe("HANDOFF_DEFAULTS", () => {
  it("has a default done signal pointing to #fish-tank", () => {
    expect(HANDOFF_DEFAULTS.doneSignal).toContain("#fish-tank")
  })

  it("has empty string for title, repo, branch", () => {
    expect(HANDOFF_DEFAULTS.title).toBe("")
    expect(HANDOFF_DEFAULTS.repo).toBe("")
    expect(HANDOFF_DEFAULTS.branch).toBe("")
  })
})
