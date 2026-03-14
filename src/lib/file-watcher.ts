type Controller = ReadableStreamDefaultController

let watcher: {
  addClient: (controller: Controller) => void
  removeClient: (controller: Controller) => void
} | null = null

export async function getFileWatcher() {
  if (watcher) return watcher

  const { watch } = await import('fs')
  const { getProgressYamlPath } = await import('./config')

  const filePath = getProgressYamlPath()
  const clients = new Set<Controller>()

  try {
    watch(filePath, (eventType) => {
      if (eventType === 'change') {
        for (const controller of clients) {
          try {
            controller.enqueue(new TextEncoder().encode('data: refresh\n\n'))
          } catch {
            clients.delete(controller)
          }
        }
      }
    })
  } catch (err) {
    console.warn('[FileWatcher] Could not watch file:', err)
  }

  watcher = {
    addClient(controller: Controller) {
      clients.add(controller)
    },
    removeClient(controller: Controller) {
      clients.delete(controller)
    },
  }

  return watcher
}
