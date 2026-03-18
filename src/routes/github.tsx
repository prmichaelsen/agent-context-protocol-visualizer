import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Github, Lock, Star, GitFork, Loader2, LogIn } from 'lucide-react'
import { getStoredToken, getStoredUser } from '../lib/github-auth'
import { searchGitHubRepos } from '../services/github-oauth.service'

export const Route = createFileRoute('/github')({
  component: GitHubRepoList,
})

interface Repo {
  full_name: string
  description: string | null
  private: boolean
  stargazers_count?: number
  forks_count?: number
  language?: string | null
  updated_at?: string
}

function GitHubRepoList() {
  const navigate = useNavigate()
  const [repos, setRepos] = useState<Repo[]>([])
  const [filteredRepos, setFilteredRepos] = useState<Repo[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const token = getStoredToken()
  const user = getStoredUser()

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    searchGitHubRepos({ data: { token, query: '' } })
      .then((result) => {
        if (result.ok) {
          setRepos(result.repos as Repo[])
          setFilteredRepos(result.repos as Repo[])
        } else {
          setError(result.error)
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load repos')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [token])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRepos(repos)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = repos.filter((repo) =>
      repo.full_name.toLowerCase().includes(query) ||
      (repo.description && repo.description.toLowerCase().includes(query))
    )
    setFilteredRepos(filtered)
  }, [searchQuery, repos])

  const handleRepoClick = async (repo: Repo) => {
    const [owner, repoName] = repo.full_name.split('/')
    window.location.href = `/?repo=${owner}/${repoName}`
  }

  if (!token) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md p-6">
          <Github className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Sign in Required
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Sign in with GitHub to view and load your repositories.
          </p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading repositories...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md p-6">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
            Error Loading Repositories
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 lg:p-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Github className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              GitHub Repositories
            </h1>
          </div>
          {user && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Showing repositories for <span className="font-medium text-gray-800 dark:text-gray-200">@{user.login}</span>
            </p>
          )}
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search repositories..."
            className="w-full px-4 py-2 text-base bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-md text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Repo List */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-4 lg:p-6">
          {filteredRepos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'No repositories match your search.' : 'No repositories found.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRepos.map((repo) => (
                <button
                  key={repo.full_name}
                  onClick={() => handleRepoClick(repo)}
                  className="w-full text-left p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-blue-600 dark:text-blue-400 truncate">
                          {repo.full_name}
                        </h3>
                        {repo.private && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-500 rounded-full shrink-0">
                            <Lock className="w-3 h-3" />
                            Private
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                        {repo.language && (
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-blue-500" />
                            {repo.language}
                          </span>
                        )}
                        {repo.stargazers_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {repo.stargazers_count}
                          </span>
                        )}
                        {repo.forks_count !== undefined && (
                          <span className="flex items-center gap-1">
                            <GitFork className="w-3 h-3" />
                            {repo.forks_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
