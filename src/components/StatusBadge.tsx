import type { Status } from '../lib/types'

const statusStyles: Record<Status, string> = {
  completed: 'bg-green-500/15 text-green-400 border-green-500/20',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  not_started: 'bg-gray-500/15 text-gray-500 border-gray-500/20',
  wont_do: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/20',
}

const statusLabels: Record<Status, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  not_started: 'Not Started',
  wont_do: "Won't Do",
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  )
}
