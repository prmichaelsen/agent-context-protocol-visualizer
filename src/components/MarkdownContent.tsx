import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'

interface MarkdownContentProps {
  content: string
  className?: string
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
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
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
