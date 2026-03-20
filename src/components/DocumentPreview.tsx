import { Link } from '@tanstack/react-router'
import { useState, useEffect, useMemo } from 'react'
import { Maximize2 } from 'lucide-react'
import { useProgressData } from '../contexts/ProgressContext'
import { useSidePanel } from '../contexts/SidePanelContext'
import { MarkdownContent, buildLinkMap } from './MarkdownContent'
import { getMarkdownContent, listAgentDirectory } from '../services/markdown.service'
import { getGitHubParams } from '../lib/github-auth'
import type { MarkdownResult, AgentFile } from '../services/markdown.service'

interface DocumentPreviewProps {
  dirPath: string
  slug: string
}

/** Map dirPath to route base path */
function dirToRoute(dirPath: string): string {
  if (dirPath.includes('design')) return '/designs'
  if (dirPath.includes('pattern')) return '/patterns'
  if (dirPath.includes('artifact')) return '/artifacts'
  return '/designs'
}

/** Map dirPath to section label */
function dirToLabel(dirPath: string): string {
  if (dirPath.includes('design')) return 'Design'
  if (dirPath.includes('pattern')) return 'Pattern'
  if (dirPath.includes('artifact')) return 'Artifact'
  return 'Document'
}

/** Turn "local.dashboard-layout-routing" into "Dashboard Layout Routing" */
function formatName(name: string): string {
  const stripped = name.replace(/^[a-z0-9-]+\./, '')
  return stripped
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function DocumentPreview({ dirPath, slug }: DocumentPreviewProps) {
  const data = useProgressData()
  const { close } = useSidePanel()
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [markdownError, setMarkdownError] = useState<string | null>(null)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const linkMap = useMemo(() => (data ? buildLinkMap(data) : {}), [data])

  const routeBase = dirToRoute(dirPath)
  const sectionLabel = dirToLabel(dirPath)
  const displayName = formatName(slug)

  useEffect(() => {
    setLoading(true)
    setMarkdown(null)
    setMarkdownError(null)
    setFilePath(null)

    const github = getGitHubParams()
    const relativePath = `${dirPath}/${slug}.md`

    getMarkdownContent({ data: { filePath: relativePath, github } })
      .then((result: MarkdownResult) => {
        if (result.ok) {
          setMarkdown(result.content)
          setFilePath(result.filePath)
        } else {
          // Fallback: search directory for a file containing the slug
          return listAgentDirectory({ data: { dirPath, github } }).then((listResult) => {
            if (listResult.ok) {
              const match = listResult.files.find((f: AgentFile) => f.name === slug)
              if (match) {
                return getMarkdownContent({ data: { filePath: match.relativePath, github } })
                  .then((mdResult: MarkdownResult) => {
                    if (mdResult.ok) {
                      setMarkdown(mdResult.content)
                      setFilePath(mdResult.filePath)
                    } else {
                      setMarkdownError(mdResult.error)
                    }
                  })
              }
            }
            setMarkdownError(result.error)
          })
        }
      })
      .catch((err: Error) => setMarkdownError(err.message))
      .finally(() => setLoading(false))
  }, [dirPath, slug])

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-1">{sectionLabel}</p>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{displayName}</h1>
        </div>
        <Link
          to={routeBase + '/$slug'}
          params={{ slug }}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Open full view"
          onClick={close}
        >
          <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-600 dark:text-gray-500">Loading document...</p>
      ) : markdown ? (
        <div className="prose-sm">
          <MarkdownContent content={markdown} basePath={filePath ?? undefined} linkMap={linkMap} />
        </div>
      ) : markdownError ? (
        <div className="bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-4 text-sm text-gray-600 dark:text-gray-500">
          No document found — {markdownError}
        </div>
      ) : null}
    </div>
  )
}
