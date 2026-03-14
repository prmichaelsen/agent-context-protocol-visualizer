export type ViewMode = 'table' | 'tree' | 'kanban' | 'gantt'

interface ViewToggleProps {
  value: ViewMode
  onChange: (view: ViewMode) => void
}

const views: Array<{ id: ViewMode; label: string }> = [
  { id: 'table', label: 'Table' },
  { id: 'tree', label: 'Tree' },
  { id: 'kanban', label: 'Kanban' },
  { id: 'gantt', label: 'Gantt' },
]

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-0.5">
      {views.map((v) => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          className={`px-3 py-1 text-xs rounded-md transition-colors ${
            value === v.id
              ? 'bg-gray-700 text-gray-100'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}
