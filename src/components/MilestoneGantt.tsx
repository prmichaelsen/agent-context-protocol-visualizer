import { useMemo } from 'react'
import { StatusBadge } from './StatusBadge'
import { formatMilestoneName } from '../lib/display'
import type { Milestone, Task } from '../lib/types'

interface MilestoneGanttProps {
  milestones: Milestone[]
  tasks: Record<string, Task[]>
}

function parseDate(d: string | null): Date | null {
  if (!d) return null
  const parsed = new Date(d)
  return isNaN(parsed.getTime()) ? null : parsed
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)))
}

export function MilestoneGantt({ milestones, tasks }: MilestoneGanttProps) {
  const { bars, minDate, maxDate, totalDays } = useMemo(() => {
    const now = new Date()

    // Build bars with start/end dates
    const bars = milestones.map((m) => {
      const start = parseDate(m.started)
      const end = parseDate(m.completed) || (m.status === 'in_progress' ? now : null)

      // Estimate end from start + estimated_weeks if no end date
      const weeks = parseFloat(m.estimated_weeks) || 0
      const estimatedEnd = start && weeks > 0
        ? new Date(start.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
        : null

      return {
        milestone: m,
        tasks: tasks[m.id] || [],
        start,
        end: end || estimatedEnd,
      }
    }).filter((b) => b.start != null) // Only show milestones with dates

    if (bars.length === 0) {
      return { bars: [], minDate: now, maxDate: now, totalDays: 1 }
    }

    const allDates = bars.flatMap((b) => [b.start!, b.end!].filter(Boolean))
    const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())))

    // Add some padding
    minDate.setDate(minDate.getDate() - 2)
    maxDate.setDate(maxDate.getDate() + 2)

    const totalDays = daysBetween(minDate, maxDate)

    return { bars, minDate, maxDate, totalDays }
  }, [milestones, tasks])

  if (bars.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 text-sm">No milestones with dates for timeline view</p>
        <p className="text-gray-700 text-xs mt-1">
          Add `started` dates to milestones in progress.yaml
        </p>
      </div>
    )
  }

  // Generate month labels
  const monthLabels: Array<{ label: string; left: number }> = []
  const cursor = new Date(minDate)
  cursor.setDate(1)
  while (cursor <= maxDate) {
    const daysFromStart = daysBetween(minDate, cursor)
    const left = (daysFromStart / totalDays) * 100
    if (left >= 0 && left <= 100) {
      monthLabels.push({
        label: cursor.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        left,
      })
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      {/* Mobile hint */}
      <div className="lg:hidden bg-gray-900/30 border-b border-gray-800 px-3 py-2 text-xs text-gray-500">
        ← Scroll horizontally to view timeline →
      </div>

      {/* Scrollable container */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline header */}
          <div className="relative h-8 bg-gray-900/50 border-b border-gray-800">
            {monthLabels.map((m, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-gray-800 flex items-center"
                style={{ left: `${Math.max(0, m.left)}%` }}
              >
                <span className="text-xs lg:text-[10px] text-gray-500 pl-1.5">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Bars */}
          <div className="divide-y divide-gray-800/50">
        {bars.map(({ milestone, start, end }) => {
          const barStart = start ? (daysBetween(minDate, start) / totalDays) * 100 : 0
          const barEnd = end ? (daysBetween(minDate, end) / totalDays) * 100 : barStart + 5
          const barWidth = Math.max(2, barEnd - barStart)

          const barColor =
            milestone.status === 'completed'
              ? 'bg-green-500/40 border-green-500/60'
              : milestone.status === 'in_progress'
                ? 'bg-blue-500/40 border-blue-500/60'
                : 'bg-gray-500/30 border-gray-500/40'

          return (
            <div key={milestone.id} className="flex items-center h-12 px-3 hover:bg-gray-200/20 dark:hover:bg-gray-800/20">
              {/* Label */}
              <div className="w-32 lg:w-48 shrink-0 flex items-center gap-2">
                <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{formatMilestoneName(milestone)}</span>
              </div>
              {/* Bar area */}
              <div className="flex-1 relative h-6">
                <div
                  className={`absolute top-1 h-4 rounded-sm border ${barColor} transition-all`}
                  style={{ left: `${barStart}%`, width: `${barWidth}%` }}
                  title={`${formatMilestoneName(milestone)}: ${start ? formatDate(start) : '?'} → ${end ? formatDate(end) : '?'} (${milestone.progress}%)`}
                >
                  {/* Progress fill within bar */}
                  <div
                    className={`h-full rounded-sm ${
                      milestone.status === 'completed'
                        ? 'bg-green-500/60'
                        : 'bg-blue-500/60'
                    }`}
                    style={{ width: `${milestone.progress}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
        </div>
      </div>
      </div>
    </div>
  )
}
