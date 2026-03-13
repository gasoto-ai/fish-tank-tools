/**
 * TDD tests for GitHub PR status API route.
 * Uses the manual Octokit mock.
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      data,
      status: init?.status ?? 200,
    })),
  },
}))

import { GET as getPrs } from "../../app/api/github/prs/route"
import { Octokit } from "@octokit/rest"

jest.mock("@octokit/rest")
const MockOctokit = Octokit as jest.MockedClass<typeof Octokit>

const fakePR = {
  number: 42,
  title: "feat: add dark mode",
  state: "open",
  html_url: "https://github.com/gasoto-ai/the-crate/pull/42",
  created_at: "2026-03-13T00:00:00Z",
  updated_at: "2026-03-13T12:00:00Z",
  user: { login: "forge-ai", avatar_url: "" },
  head: { ref: "feat/dark-mode" },
  base: { ref: "playground" },
}

beforeEach(() => jest.clearAllMocks())

describe("GET /api/github/prs", () => {
  it("returns formatted PRs from all gasoto-ai repos", async () => {
    MockOctokit.mockImplementation(() => ({
      repos: {
        listForOrg: jest.fn().mockResolvedValue({
          data: [{ name: "the-crate" }, { name: "fish-tank-tools" }],
        }),
      },
      pulls: {
        list: jest.fn().mockResolvedValue({ data: [fakePR] }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any))

    const res = await getPrs()
    const data = (res as { data: unknown }).data
    expect(Array.isArray(data)).toBe(true)
  })

  it("returns 500 when GitHub API fails", async () => {
    MockOctokit.mockImplementation(() => ({
      repos: {
        listForOrg: jest.fn().mockRejectedValue(new Error("API rate limit exceeded")),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any))

    const res = await getPrs()
    expect((res as { status: number }).status).toBe(500)
  })

  it("returns empty array when org has no repos", async () => {
    MockOctokit.mockImplementation(() => ({
      repos: {
        listForOrg: jest.fn().mockResolvedValue({ data: [] }),
      },
      pulls: {
        list: jest.fn().mockResolvedValue({ data: [] }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any))

    const res = await getPrs()
    const data = (res as { data: unknown[] }).data
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBe(0)
  })
})
