import { X } from 'lucide-react'
import { useRef, useState, useEffect, useCallback } from 'react'
import { useSidePanel } from '../contexts/SidePanelContext'
import { MilestonePreview } from './MilestonePreview'
import { TaskPreview } from './TaskPreview'
import { DocumentPreview } from './DocumentPreview'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  )

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isDesktop
}

export function SidePanel() {
  const { content, isOpen, width, close, setWidth } = useSidePanel()
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const isDesktop = useIsDesktop()

  // Handle resize drag
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return
      const panelRect = panelRef.current.getBoundingClientRect()
      const newWidth = panelRect.right - e.clientX
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, setWidth])

  // Prevent text selection while resizing
  useEffect(() => {
    if (isResizing) {
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'ew-resize'
    } else {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isResizing])

  // Lock body scroll when bottom sheet is open on mobile
  useEffect(() => {
    if (!isOpen || isDesktop) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen, isDesktop])

  // Don't render at all until first open
  if (!content && !isOpen) {
    return null
  }

  // Desktop: inline width for resizable side panel
  // Mobile: no inline width, full-width via fixed positioning
  const panelStyle = isDesktop
    ? { width: isOpen ? `${width}px` : '0px' }
    : undefined

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={close}
        />
      )}

      {/* Desktop: side panel | Mobile: bottom sheet */}
      <div
        ref={panelRef}
        className={[
          // Base
          'bg-white dark:bg-gray-900 shadow-lg overflow-hidden transition-all duration-300 flex-shrink-0',
          // Mobile: bottom sheet
          'fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[85vh] border-t border-gray-200 dark:border-gray-800',
          // Desktop: side panel
          'lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:z-auto lg:rounded-none lg:max-h-none lg:h-full lg:border-t-0 lg:border-l',
          // Open/close states
          isOpen
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-full lg:translate-y-0 lg:w-0 lg:border-l-0',
        ].join(' ')}
        style={panelStyle}
      >
        {/* Resize Handle — desktop only */}
        <div
          className={`hidden lg:block absolute top-0 left-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 hover:w-1 transition-all z-20 ${
            isResizing ? 'bg-blue-500 w-1' : 'bg-transparent'
          }`}
          onMouseDown={() => setIsResizing(true)}
          aria-label="Resize panel"
        />

        {/* Drag indicator — mobile only */}
        <div className="lg:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Preview</h2>
          <button
            onClick={close}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close panel"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto h-[60vh] lg:h-[calc(100%-57px)]">
          {content?.type === 'milestone' && <MilestonePreview milestoneId={content.id} />}
          {content?.type === 'task' && <TaskPreview taskId={content.id} />}
          {content?.type === 'document' && <DocumentPreview dirPath={content.dirPath} slug={content.slug} />}
        </div>
      </div>
    </>
  )
}
