import { PanelRight } from 'lucide-react'
import { useSidePanel } from '../contexts/SidePanelContext'

type PreviewButtonProps = {
  className?: string
} & (
  | { type: 'milestone' | 'task'; id: string }
  | { type: 'document'; dirPath: string; slug: string }
)

export function PreviewButton(props: PreviewButtonProps) {
  const { className = '' } = props
  const { openMilestone, openTask, openDocument } = useSidePanel()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (props.type === 'milestone') {
      openMilestone(props.id)
    } else if (props.type === 'task') {
      openTask(props.id)
    } else {
      openDocument(props.dirPath, props.slug)
    }
  }

  const label = props.type === 'document' ? 'document' : props.type

  return (
    <button
      onClick={handleClick}
      className={`p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${className}`}
      title={`Preview ${label}`}
      aria-label={`Preview ${label}`}
    >
      <PanelRight className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
    </button>
  )
}
