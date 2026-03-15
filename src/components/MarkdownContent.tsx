import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { Link } from '@tanstack/react-router'
import type { ProgressData } from '../lib/types'

interface MarkdownContentProps {
  content: string
  className?: string
  basePath?: string
  linkMap?: Record<string, string>
}

/**
 * Resolve a relative path against a base file path.
 * e.g. resolvePath("agent/milestones/milestone-3.md", "../tasks/task-11.md")
 *   → "agent/tasks/task-11.md"
 */
export function resolvePath(base: string, relative: string): string {
  const dir = base.split('/').slice(0, -1)
  const relParts = relative.split('/')
  const result = [...dir]
  for (const part of relParts) {
    if (part === '..') result.pop()
    else if (part !== '.') result.push(part)
  }
  return result.join('/')
}

/**
 * Build a map from file paths to visualizer routes.
 */
export function buildLinkMap(data: ProgressData): Record<string, string> {
  const map: Record<string, string> = {}
  for (const ms of data.milestones) {
    for (const task of data.tasks[ms.id] || []) {
      if (task.file) {
        map[task.file] = `/tasks/${task.id}`
      }
    }
  }
  return map
}

function createMarkdownLink(basePath: string, linkMap: Record<string, string>) {
  return function MarkdownLink({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    if (href && !href.startsWith('http') && !href.startsWith('#')) {
      const resolved = resolvePath(basePath, href)
      const route = linkMap[resolved]
      if (route) {
        return <Link to={route}>{children}</Link>
      }
    }
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
}

export function MarkdownContent({ content, className, basePath, linkMap }: MarkdownContentProps) {
  const components =
    basePath && linkMap
      ? { a: createMarkdownLink(basePath, linkMap) }
      : undefined

  return (
    <div
      className={`prose prose-invert prose-sm max-w-none
        prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-800
        prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-gray-200
        prose-code:before:content-none prose-code:after:content-none
        prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
        prose-headings:text-gray-100
        prose-strong:text-gray-200
        prose-th:text-gray-300 prose-th:border-gray-700
        prose-td:border-gray-800
        prose-hr:border-gray-800
        prose-blockquote:border-gray-700 prose-blockquote:text-gray-400
        ${className ?? ''}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
