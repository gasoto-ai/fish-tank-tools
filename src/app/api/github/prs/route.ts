import { NextResponse } from "next/server"
import { Octokit } from "@octokit/rest"

export type PullRequest = {
  number: number
  title: string
  state: string
  html_url: string
  created_at: string
  updated_at: string
  user: { login: string; avatar_url: string }
  head: { ref: string }
  base: { ref: string }
  repo: string
}

const ORG = "gasoto-ai"

export async function GET() {
  try {
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })

    // List all repos in the org
    const { data: repos } = await octokit.repos.listForOrg({
      org: ORG,
      type: "all",
      per_page: 50,
    })

    // Fetch open + recently closed PRs for each repo in parallel
    const results = await Promise.allSettled(
      repos.map((repo) =>
        octokit.pulls.list({
          owner: ORG,
          repo: repo.name,
          state: "all",
          per_page: 20,
          sort: "updated",
        })
      )
    )

    const allPRs: PullRequest[] = []
    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === "fulfilled") {
        for (const pr of result.value.data) {
          allPRs.push({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            html_url: pr.html_url,
            created_at: pr.created_at,
            updated_at: pr.updated_at,
            user: { login: pr.user?.login ?? "", avatar_url: pr.user?.avatar_url ?? "" },
            head: { ref: pr.head.ref },
            base: { ref: pr.base.ref },
            repo: repos[i].name,
          })
        }
      }
    }

    // Most recently updated first
    allPRs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

    return NextResponse.json(allPRs)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
