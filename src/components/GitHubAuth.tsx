import { useState, useEffect } from 'react'
import { LogIn, LogOut } from 'lucide-react'
import { getStoredToken, getStoredUser, clearStoredToken, getGitHubAuthUrl } from '../lib/github-auth'
import type { GitHubUser } from '../lib/github-auth'

export function GitHubAuth() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<GitHubUser | null>(null)

  useEffect(() => {
    setToken(getStoredToken())
    setUser(getStoredUser())
  }, [])

  const handleLogin = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    if (!clientId) {
      alert('GitHub OAuth not configured')
      return
    }

    const redirectUri = `${window.location.origin}/auth/github/callback`
    const authUrl = getGitHubAuthUrl(clientId, redirectUri)
    window.location.href = authUrl
  }

  const handleLogout = () => {
    clearStoredToken()
    setToken(null)
    setUser(null)
  }

  if (token && user) {
    return (
      <div className="flex items-center gap-2 p-2 bg-gray-900 border border-gray-800 rounded-md">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {user.avatar_url && (
            <img
              src={user.avatar_url}
              alt={user.login}
              className="w-6 h-6 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-200 truncate">{user.name || user.login}</p>
            <p className="text-xs text-gray-500 truncate">@{user.login}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleLogin}
      className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm text-gray-300 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 transition-colors"
    >
      <LogIn className="w-4 h-4" />
      Sign in with GitHub
    </button>
  )
}
