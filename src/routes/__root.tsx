import { HeadContent, Scripts, createRootRoute, Outlet } from '@tanstack/react-router'
import { useAutoRefresh } from '@/lib/useAutoRefresh'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'ACP Progress Visualizer' },
      {
        name: 'description',
        content: 'Browser-based dashboard for visualizing ACP progress.yaml data',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
    ],
  }),

  shellComponent: RootDocument,
})

function AutoRefresh() {
  useAutoRefresh()
  return null
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AutoRefresh />
        {children}
        <Scripts />
      </body>
    </html>
  )
}
