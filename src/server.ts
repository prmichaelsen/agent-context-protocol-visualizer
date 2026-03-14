/**
 * Cloudflare Workers Entry Point
 *
 * Minimal server — passes all requests to TanStack Start.
 */

import startServer from '@tanstack/react-start/server-entry'

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    return (startServer as any).fetch(request, env, ctx)
  },
}
