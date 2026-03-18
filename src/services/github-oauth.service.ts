import { createServerFn } from '@tanstack/react-start'
import type { GitHubUser } from '../lib/github-auth'

export type OAuthTokenResult =
  | { ok: true; token: string }
  | { ok: false; error: string }

export type GitHubUserResult =
  | { ok: true; user: GitHubUser }
  | { ok: false; error: string }

export type GitHubRepoSearchResult =
  | { ok: true; repos: Array<{ full_name: string; description: string | null; private: boolean }> }
  | { ok: false; error: string }

export const exchangeOAuthCode = createServerFn({ method: 'POST' })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data: input }): Promise<OAuthTokenResult> => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID || ''
    const clientSecret = import.meta.env.VITE_GITHUB_CLIENT_SECRET || ''

    if (!clientId || !clientSecret) {
      return { ok: false, error: 'GitHub OAuth not configured' }
    }

    try {
      const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: input.code,
        }),
      })

      if (!response.ok) {
        return { ok: false, error: `OAuth token exchange failed: ${response.statusText}` }
      }

      const data = await response.json() as { access_token?: string; error?: string }

      if (data.error || !data.access_token) {
        return { ok: false, error: data.error || 'No access token returned' }
      }

      return { ok: true, token: data.access_token }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

export const fetchGitHubUser = createServerFn({ method: 'GET' })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data: input }): Promise<GitHubUserResult> => {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${input.token}`,
          'User-Agent': 'acp-visualizer',
        },
      })

      if (!response.ok) {
        return { ok: false, error: `Failed to fetch user: ${response.statusText}` }
      }

      const data = await response.json() as { login: string; name: string | null; avatar_url: string }

      return {
        ok: true,
        user: {
          login: data.login,
          name: data.name,
          avatar_url: data.avatar_url,
        },
      }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })

export const searchGitHubRepos = createServerFn({ method: 'GET' })
  .inputValidator((input: { token: string; query: string }) => input)
  .handler(async ({ data: input }): Promise<GitHubRepoSearchResult> => {
    try {
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=100&sort=updated`,
        {
          headers: {
            'Authorization': `token ${input.token}`,
            'User-Agent': 'acp-visualizer',
          },
        }
      )

      if (!response.ok) {
        return { ok: false, error: `Failed to fetch repos: ${response.statusText}` }
      }

      const data = await response.json() as Array<{
        full_name: string
        description: string | null
        private: boolean
      }>

      // Filter by query
      const filtered = input.query
        ? data.filter((r) =>
            r.full_name.toLowerCase().includes(input.query.toLowerCase())
          )
        : data

      return {
        ok: true,
        repos: filtered.slice(0, 20),
      }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
    }
  })
