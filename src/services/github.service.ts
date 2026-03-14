import { createServerFn } from '@tanstack/react-start'
import type { ProgressData } from '../lib/types'

export type GitHubResult =
  | { ok: true; data: ProgressData }
  | { ok: false; error: string; message: string }

async function fetchBranch(
  parseProgressYaml: (raw: string) => ProgressData,
  owner: string,
  repo: string,
  branch: string,
  headers: Record<string, string>,
): Promise<GitHubResult> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/agent/progress.yaml`
  try {
    const response = await fetch(url, { headers })
    if (!response.ok) {
      if (response.status === 404) {
        return { ok: false, error: 'NOT_FOUND', message: `No progress.yaml found at ${owner}/${repo} (branch: ${branch})` }
      }
      return { ok: false, error: 'FETCH_ERROR', message: `GitHub returned ${response.status}: ${response.statusText}` }
    }
    const raw = await response.text()
    const data = parseProgressYaml(raw)
    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: 'NETWORK_ERROR', message: err instanceof Error ? err.message : 'Failed to fetch from GitHub' }
  }
}

export const fetchGitHubProgress = createServerFn({ method: 'GET' })
  .inputValidator((input: { owner: string; repo: string; branch?: string; token?: string }) => input)
  .handler(async ({ data: input }): Promise<GitHubResult> => {
    const { parseProgressYaml } = await import('../lib/yaml-loader')

    const fetchHeaders: Record<string, string> = { 'Accept': 'text/plain' }
    if (input.token) {
      fetchHeaders['Authorization'] = `token ${input.token}`
    }

    // If branch specified, use it directly
    if (input.branch) {
      return fetchBranch(parseProgressYaml, input.owner, input.repo, input.branch, fetchHeaders)
    }

    // Try GitHub API for default branch, fall back to trying main → mainline → master
    let detectedBranch: string | null = null
    try {
      const metaRes = await fetch(`https://api.github.com/repos/${input.owner}/${input.repo}`, {
        headers: { 'User-Agent': 'acp-visualizer', ...(input.token ? { Authorization: `token ${input.token}` } : {}) },
      })
      if (metaRes.ok) {
        const meta = await metaRes.json() as { default_branch?: string }
        detectedBranch = meta.default_branch || null
      }
    } catch {
      // Rate limited or network error — fall through to branch probing
    }

    const branches = detectedBranch
      ? [detectedBranch]
      : ['main', 'mainline', 'master']

    for (const branch of branches) {
      const result = await fetchBranch(parseProgressYaml, input.owner, input.repo, branch, fetchHeaders)
      if (result.ok || result.error !== 'NOT_FOUND') return result
    }

    return {
      ok: false,
      error: 'NOT_FOUND',
      message: `No progress.yaml found at ${input.owner}/${input.repo} (tried branches: ${branches.join(', ')})`,
    }
  })
