import { NextResponse } from "next/server"

type GitHubPR = {
  id: number
  number: number
  title: string
  state: string
  html_url: string
  created_at: string
  updated_at: string
  user: { login: string }
  head: { ref: string }
  base: { ref: string }
  draft: boolean
  labels: { name: string; color: string }[]
  repo: string
}

async function fetchPRs(owner: string, repo: string, token: string): Promise<GitHubPR[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=20&sort=updated`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 60 },
    }
  )

  if (!res.ok) return []

  const prs = await res.json()
  return prs.map((pr: GitHubPR) => ({ ...pr, repo }))
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return NextResponse.json({ error: "GITHUB_TOKEN not set" }, { status: 500 })
  }

  const repos = ["workflow", "fish-tank-app"]
  const owner = "gasoto-ai"

  const results = await Promise.all(repos.map((repo) => fetchPRs(owner, repo, token)))
  const allPRs = results.flat().sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  )

  return NextResponse.json(allPRs)
}
