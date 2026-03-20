import { Search } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
}

export function SearchInput({ value, onChange, placeholder = 'Search...', debounceMs = 250 }: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Sync local value when external value changes (e.g. URL navigation)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (next: string) => {
    setLocalValue(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(next), debounceMs)
  }

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-900 border border-gray-800 rounded-md pl-10 pr-3 py-2 text-base text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600 transition-colors"
      />
    </div>
  )
}
