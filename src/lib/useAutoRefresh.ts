import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

export function useAutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    const eventSource = new EventSource('/api/watch')

    eventSource.onmessage = () => {
      router.invalidate()
    }

    eventSource.onerror = () => {
      // EventSource handles reconnection automatically
    }

    // Reconnect on tab visibility change
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        router.invalidate()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      eventSource.close()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [router])
}
