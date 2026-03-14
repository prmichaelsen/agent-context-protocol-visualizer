import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/watch')({
  server: {
    handlers: {
      GET: async () => {
        // In hosted mode (Cloudflare Workers), there's no filesystem to watch.
        // Return 204 immediately instead of opening a stream that hangs forever.
        try {
          const { getFileWatcher } = await import('../../lib/file-watcher')
          const watcher = await getFileWatcher()

          const stream = new ReadableStream({
            start(controller) {
              watcher.addClient(controller)
            },
            cancel(controller) {
              watcher.removeClient(controller)
            },
          })

          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive',
            },
          })
        } catch {
          return new Response(null, { status: 204 })
        }
      },
    },
  },
})
