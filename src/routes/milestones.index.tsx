import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { lazy, Suspense, useCallback } from 'react'
import { MilestoneTable } from '../components/MilestoneTable'
import { MilestoneTree } from '../components/MilestoneTree'
import { MilestoneKanban } from '../components/MilestoneKanban'
import { MilestoneGantt } from '../components/MilestoneGantt'
import { ViewToggle, type ViewMode } from '../components/ViewToggle'
import { FilterBar } from '../components/FilterBar'
import { SearchInput } from '../components/SearchInput'
import { useFilteredData } from '../lib/useFilteredData'
import { useProgressData } from '../contexts/ProgressContext'
import type { Status } from '../lib/types'
import { z } from 'zod'

// Lazy-load DependencyGraph to keep dagre out of the SSR bundle
// (dagre uses CommonJS require() which fails on Cloudflare Workers)
const DependencyGraph = lazy(() => import('../components/DependencyGraph').then(m => ({ default: m.DependencyGraph })))

const viewModes = ['table', 'tree', 'kanban', 'gantt', 'graph'] as const
const statuses = ['all', 'completed', 'in_progress', 'not_started', 'wont_do'] as const

export const Route = createFileRoute('/milestones/')({
  component: MilestonesPage,
  validateSearch: z.object({
    view: z.enum(viewModes).default('tree'),
    status: z.enum(statuses).default('all'),
    q: z.string().default(''),
  }),
})

function MilestonesPage() {
  const progressData = useProgressData()
  const { view, status, q: search } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  const setView = useCallback((v: ViewMode) => {
    navigate({ search: (prev) => ({ ...prev, view: v }), replace: true })
  }, [navigate])

  const setStatus = useCallback((s: Status | 'all') => {
    navigate({ search: (prev) => ({ ...prev, status: s }), replace: true })
  }, [navigate])

  const setSearch = useCallback((q: string) => {
    navigate({ search: (prev) => ({ ...prev, q: q || undefined }), replace: true })
  }, [navigate])

  const filtered = useFilteredData(progressData, { status, search })

  if (!filtered) {
    return (
      <div className="p-6">
        <p className="text-gray-600 text-sm">No data loaded</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Milestones</h2>
        <ViewToggle value={view} onChange={setView} />
      </div>
      {view !== 'kanban' && (
        <div className="flex items-center gap-3 mb-4">
          <FilterBar status={status} onStatusChange={setStatus} />
          <div className="w-64">
            <SearchInput value={search} onChange={setSearch} placeholder="Filter milestones..." />
          </div>
        </div>
      )}
      {view === 'table' ? (
        <MilestoneTable milestones={filtered.milestones} tasks={filtered.tasks} />
      ) : view === 'tree' ? (
        <MilestoneTree milestones={filtered.milestones} tasks={filtered.tasks} />
      ) : view === 'kanban' ? (
        <MilestoneKanban milestones={filtered.milestones} tasks={filtered.tasks} />
      ) : view === 'gantt' ? (
        <MilestoneGantt milestones={filtered.milestones} tasks={filtered.tasks} />
      ) : (
        <Suspense fallback={<p className="text-gray-500 text-sm">Loading graph...</p>}>
          <DependencyGraph data={filtered} />
        </Suspense>
      )}
    </div>
  )
}
