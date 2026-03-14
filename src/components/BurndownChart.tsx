import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { ProgressData } from '../lib/types'

interface BurndownChartProps {
  data: ProgressData
}

interface ChartPoint {
  date: string
  completed: number
  total: number
  remaining: number
}

function buildBurndownData(data: ProgressData): ChartPoint[] {
  // Collect all task completion dates
  const allTasks: Array<{ completed_date: string | null; status: string }> = []
  for (const tasks of Object.values(data.tasks)) {
    for (const t of tasks) {
      allTasks.push({ completed_date: t.completed_date, status: t.status })
    }
  }

  const total = allTasks.length
  if (total === 0) return []

  // Get sorted unique completion dates
  const completionDates = allTasks
    .map((t) => t.completed_date)
    .filter((d): d is string => d != null)
    .sort()

  if (completionDates.length === 0) {
    // No completed tasks — show single point
    return [{ date: data.project.started || 'Start', completed: 0, total, remaining: total }]
  }

  // Build cumulative completion over time
  const points: ChartPoint[] = []

  // Start point
  const startDate = data.project.started || completionDates[0]
  points.push({ date: startDate, completed: 0, total, remaining: total })

  // Accumulate completions by date
  const byDate = new Map<string, number>()
  for (const d of completionDates) {
    byDate.set(d, (byDate.get(d) || 0) + 1)
  }

  let cumulative = 0
  for (const [date, count] of [...byDate.entries()].sort()) {
    cumulative += count
    // Skip if same as start date (already added)
    if (date === startDate && points.length === 1) {
      points[0] = { date, completed: cumulative, total, remaining: total - cumulative }
      continue
    }
    points.push({ date, completed: cumulative, total, remaining: total - cumulative })
  }

  return points
}

export function BurndownChart({ data }: BurndownChartProps) {
  const chartData = buildBurndownData(data)

  if (chartData.length === 0) {
    return <p className="text-gray-600 text-sm">No task data for chart</p>
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">
        Task Completion Over Time
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="remainingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#374151' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#e5e7eb',
            }}
          />
          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#22c55e"
            fill="url(#completedGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="remaining"
            name="Remaining"
            stroke="#3b82f6"
            fill="url(#remainingGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-6 mt-3 justify-center">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 rounded-sm bg-green-500/30 border border-green-500" />
          Completed
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="w-3 h-3 rounded-sm bg-blue-500/20 border border-blue-500" />
          Remaining
        </div>
      </div>
    </div>
  )
}
