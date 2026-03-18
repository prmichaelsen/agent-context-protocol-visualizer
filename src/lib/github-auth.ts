const TOKEN_KEY = 'github_access_token'
const USER_KEY = 'github_user'

export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser(): GitHubUser | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(USER_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function setStoredUser(user: GitHubUser) {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getGitHubAuthUrl(clientId: string, redirectUri: string): string {
  const state = crypto.randomUUID()
  sessionStorage.setItem('github_oauth_state', state)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo',
    state,
  })

  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

export function validateOAuthState(receivedState: string): boolean {
  const storedState = sessionStorage.getItem('github_oauth_state')
  sessionStorage.removeItem('github_oauth_state')
  return storedState === receivedState
}
