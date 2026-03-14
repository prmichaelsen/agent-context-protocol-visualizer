import { StatusBadge } from './StatusBadge'
import type { Status } from '../lib/types'

interface DetailField {
  label: string
  value: React.ReactNode
}

interface DetailHeaderProps {
  status: Status
  fields: DetailField[]
}

export function DetailHeader({ status, fields }: DetailHeaderProps) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={status} />
        {fields.map((field, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-500">{field.label}:</span>
            <span className="text-gray-300">{field.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
