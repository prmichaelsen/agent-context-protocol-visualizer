import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { exchangeOAuthCode, fetchGitHubUser } from '../../../services/github-oauth.service'
import { setStoredToken, setStoredUser, validateOAuthState } from '../../../lib/github-auth'

export const Route = createFileRoute('/auth/github/callback')({
  component: GitHubCallback,
})

function GitHubCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const errorParam = params.get('error')

    if (errorParam) {
      setError(`GitHub OAuth error: ${errorParam}`)
      return
    }

    if (!code || !state) {
      setError('Missing OAuth parameters')
      return
    }

    if (!validateOAuthState(state)) {
      setError('Invalid OAuth state - possible CSRF attack')
      return
    }

    exchangeOAuthCode({ data: { code } })
      .then(async (result) => {
        if (!result.ok) {
          setError(result.error)
          return
        }

        // Store token
        setStoredToken(result.token)

        // Fetch user info
        const userResult = await fetchGitHubUser({ data: { token: result.token } })
        if (userResult.ok) {
          setStoredUser(userResult.user)
        }

        // Redirect back to home
        navigate({ to: '/' })
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unknown error')
      })
  }, [navigate])

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md p-6">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
            Authentication Failed
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Connecting to GitHub...</p>
      </div>
    </div>
  )
}
