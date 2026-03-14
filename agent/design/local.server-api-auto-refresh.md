# Server API & Auto-Refresh

**Concept**: TanStack Start server routes for loading progress.yaml and SSE-based auto-refresh
**Created**: 2026-03-14
**Status**: Design Specification

---

## Overview

Defines the server-side architecture for loading `progress.yaml` from the local filesystem and pushing updates to the browser in real time when the file changes. Uses TanStack Start server functions and Server-Sent Events (SSE) for a simple, reliable auto-refresh mechanism.

---

## Problem Statement

The visualizer needs to:
- Read `progress.yaml` from a configurable filesystem path
- Serve parsed data to the React frontend
- Automatically refresh the dashboard when agents modify `progress.yaml` during work
- Handle file-not-found and parse errors gracefully

A simple "refresh the page" approach is insufficient — agents may update progress.yaml dozens of times during a session, and the dashboard should reflect changes without manual intervention.

---

## Solution

1. **Server function**: TanStack Start `createServerFn` that reads and parses `progress.yaml`
2. **SSE endpoint**: Watches the file for changes and pushes notifications to connected clients
3. **Client hook**: `useAutoRefresh()` React hook that listens for SSE events and triggers re-fetch

---

## Implementation

### Configuration

The path to `progress.yaml` is resolved from (in order):
1. `PROGRESS_YAML_PATH` environment variable (absolute path)
2. CLI argument: `npm run dev -- --progress /path/to/progress.yaml`
3. Default: `./agent/progress.yaml` (relative to cwd)

```typescript
// app/lib/config.ts

export function getProgressYamlPath(): string {
  return (
    process.env.PROGRESS_YAML_PATH ||
    process.argv.find((_, i, a) => a[i - 1] === '--progress') ||
    './agent/progress.yaml'
  );
}
```

### Server Function

```typescript
// app/lib/data-source.ts

import { createServerFn } from '@tanstack/react-start';
import { readFileSync } from 'fs';
import { parseProgressYaml } from './yaml-loader';
import { getProgressYamlPath } from './config';

export const getProgressData = createServerFn({ method: 'GET' })
  .handler(async () => {
    const filePath = getProgressYamlPath();
    const raw = readFileSync(filePath, 'utf-8');
    return parseProgressYaml(raw);
  });
```

### File Watcher & SSE

```typescript
// server/routes/api/watch.ts

import { watch } from 'fs';
import { getProgressYamlPath } from '../../app/lib/config';

export function createFileWatcher() {
  const filePath = getProgressYamlPath();
  const clients = new Set<ReadableStreamDefaultController>();

  watch(filePath, (eventType) => {
    if (eventType === 'change') {
      for (const controller of clients) {
        controller.enqueue(`data: refresh\n\n`);
      }
    }
  });

  return {
    addClient(controller: ReadableStreamDefaultController) {
      clients.add(controller);
    },
    removeClient(controller: ReadableStreamDefaultController) {
      clients.delete(controller);
    },
  };
}
```

### SSE API Route

```typescript
// app/routes/api/watch.ts

import { createAPIFileRoute } from '@tanstack/react-start/api';

let watcher: ReturnType<typeof createFileWatcher> | null = null;

export const APIRoute = createAPIFileRoute('/api/watch')({
  GET: async () => {
    if (!watcher) {
      watcher = createFileWatcher();
    }

    const stream = new ReadableStream({
      start(controller) {
        watcher!.addClient(controller);
      },
      cancel(controller) {
        watcher!.removeClient(controller);
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  },
});
```

### Client Hook

```typescript
// app/lib/useAutoRefresh.ts

import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';

export function useAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const eventSource = new EventSource('/api/watch');

    eventSource.onmessage = () => {
      router.invalidate();
    };

    eventSource.onerror = () => {
      // Reconnect handled automatically by EventSource
    };

    return () => eventSource.close();
  }, [router]);
}
```

### Error Handling

- **File not found**: Server function returns a structured error object with `{ error: 'FILE_NOT_FOUND', path }`. Frontend shows a configuration prompt.
- **Parse error**: Returns `{ error: 'PARSE_ERROR', message }`. Frontend shows the error with the raw YAML path.
- **File watcher failure**: Falls back to manual refresh. Log warning to console.

---

## Benefits

- **Real-time updates**: Dashboard reflects changes within ~100ms of file save
- **Low overhead**: SSE is lightweight compared to WebSocket for one-way push
- **Simple client**: `EventSource` API handles reconnection automatically
- **No polling**: File watcher is event-driven, not interval-based

---

## Trade-offs

- **Local only**: `fs.watch` only works for local development (P1 GitHub source uses polling instead)
- **Single file**: Watches one progress.yaml path — no multi-project support in P0
- **SSE limitations**: One-way communication only (sufficient for refresh notifications)

---

## Applicable Patterns

| Pattern | How It Applies |
|---------|----------------|
| [`tanstack-cloudflare.ssr-preload`](../patterns/tanstack-cloudflare.ssr-preload.md) | Progress data should be loaded server-side via `beforeLoad` (not `loader`), passed through route context, and accessed via `Route.useRouteContext()`. Components initialize state with SSR data and skip client fetch if present. Error handling must be graceful — `try/catch` with empty-data fallback, never fail the page load. |
| [`tanstack-cloudflare.api-route-handlers`](../patterns/tanstack-cloudflare.api-route-handlers.md) | The SSE `/api/watch` endpoint and any future REST endpoints should use `createFileRoute` with `server.handlers` returning Web Standard `Response` objects. Consistent error response format: `{ error, message }`. No auth needed for P0 (local dev tool). |
| [`tanstack-cloudflare.library-services`](../patterns/tanstack-cloudflare.library-services.md) | File reading and YAML parsing must go through a `ProgressDatabaseService` (server-side) — never call `readFileSync` directly in routes or `beforeLoad`. The service handles path resolution, file reading, parsing, and error wrapping. |
| [`tanstack-cloudflare.websocket-manager`](../patterns/tanstack-cloudflare.websocket-manager.md) | While we use SSE (not WebSocket) for P0, the reconnection and lifecycle patterns apply: exponential backoff on connection loss, page visibility recovery (reconnect on tab focus), and clean teardown in `useEffect` cleanup. `EventSource` handles reconnection natively but visibility recovery should still be explicit. |

---

## Dependencies

- Node.js `fs` module (built-in)
- TanStack Start server functions
- No additional npm packages needed

---

## Testing Strategy

- **Unit tests**: `getProgressYamlPath()` resolution order
- **Integration tests**: Server function reads real YAML file, returns typed data
- **Manual testing**: Modify progress.yaml while dashboard is open, verify auto-refresh

---

## Migration Path

N/A — greenfield project.

---

## Future Considerations

- **P1: GitHub remote source** — Replace `readFileSync` with GitHub API fetch, replace SSE with configurable polling interval
- **P1: Multi-project** — Watch multiple progress.yaml paths, route by project
- **WebSocket upgrade** — If bidirectional communication needed in future (unlikely for read-only dashboard)

---

**Status**: Design Specification
**Recommendation**: Implement after data model — provides the data pipeline for all views
**Related Documents**: local.visualizer-requirements.md, local.data-model-yaml-parsing.md, tanstack-cloudflare.ssr-preload, tanstack-cloudflare.api-route-handlers, tanstack-cloudflare.library-services, tanstack-cloudflare.websocket-manager
