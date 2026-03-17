import { useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

// Initialize theme immediately on load to prevent flash
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('theme')
  const initialTheme = (stored === 'light' || stored === 'dark') ? stored : 'dark'
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark'
    const stored = localStorage.getItem('theme')
    return (stored === 'light' || stored === 'dark') ? stored : 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  return { theme, toggleTheme }
}