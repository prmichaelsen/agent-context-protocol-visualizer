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
    // existsSync will throw on Workers where fs is stubbed
    const { existsSync } = await import('fs')
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`)
    }
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
    throw new Error(`[FileWatcher] Cannot watch: ${err}`)
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
