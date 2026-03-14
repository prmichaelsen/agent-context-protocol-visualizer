# Task 4: Add Auto-Refresh via SSE

**Milestone**: [M1 - Project Scaffold & Data Pipeline](../../milestones/milestone-1-project-scaffold-data-pipeline.md)
**Design Reference**: [Server API & Auto-Refresh](../../design/local.server-api-auto-refresh.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 3
**Status**: Not Started

---

## Objective

Implement file watching and Server-Sent Events (SSE) so the dashboard auto-refreshes when progress.yaml changes on disk. This enables a live development experience where agents updating progress.yaml see their changes reflected in the browser without manual reload.

---

## Context

The progress.yaml file is updated frequently by agents during work sessions. Rather than requiring manual browser refresh, the dashboard should detect file changes and re-render automatically. The implementation uses Node.js `fs.watch` on the server to detect changes, SSE to push notifications to the browser, and TanStack Router's `router.invalidate()` to trigger data re-fetching. This is a local development tool, so the SSE approach is appropriate (no need for WebSocket complexity or production-scale polling).

---

## Steps

### 1. Create the file watcher module

Create `app/lib/file-watcher.ts` that manages file watching and connected SSE clients:

```typescript
// app/lib/file-watcher.ts
import fs from "node:fs";
import { getProgressYamlPath } from "./config";

type ClientCallback = () => void;

let clients: Set<ClientCallback> = new Set();
let watcher: fs.FSWatcher | null = null;

export function createFileWatcher() {
  if (watcher) return; // Already watching

  const filePath = getProgressYamlPath();

  try {
    watcher = fs.watch(filePath, { persistent: false }, (eventType) => {
      if (eventType === "change") {
        // Notify all connected clients
        for (const client of clients) {
          client();
        }
      }
    });

    watcher.on("error", (err) => {
      console.error("[file-watcher] Watch error:", err.message);
      watcher?.close();
      watcher = null;
    });
  } catch (err) {
    console.error("[file-watcher] Failed to start watching:", (err as Error).message);
  }
}

export function registerClient(callback: ClientCallback): () => void {
  clients.add(callback);
  // Return unregister function
  return () => {
    clients.delete(callback);
  };
}

export function getClientCount(): number {
  return clients.size;
}
```

Key design decisions:
- Uses `fs.watch` (not `fs.watchFile`) for efficiency since this is a single known file path
- `persistent: false` so the watcher does not keep the Node process alive
- Singleton pattern: only one watcher instance regardless of how many clients connect
- Returns an unregister function for clean client removal

### 2. Create the SSE API route

Create `app/routes/api/watch.ts` that serves the SSE endpoint:

```typescript
// app/routes/api/watch.ts
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createFileWatcher, registerClient } from "../../lib/file-watcher";

export const APIRoute = createAPIFileRoute("/api/watch")({
  GET: async () => {
    // Ensure watcher is running
    createFileWatcher();

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        // Send initial connection confirmation
        controller.enqueue(encoder.encode("data: connected\n\n"));

        // Register for file change notifications
        const unregister = registerClient(() => {
          try {
            controller.enqueue(encoder.encode("data: refresh\n\n"));
          } catch {
            // Client disconnected
            unregister();
          }
        });

        // Handle client disconnect (stream cancellation)
        // Note: cleanup is handled when enqueue throws
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  },
});
```

### 3. Create the useAutoRefresh hook

Create `app/lib/useAutoRefresh.ts` that connects to the SSE endpoint and triggers router invalidation:

```typescript
// app/lib/useAutoRefresh.ts
import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";

export function useAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const eventSource = new EventSource("/api/watch");

    eventSource.onmessage = (event) => {
      if (event.data === "refresh") {
        // Invalidate all route loaders, triggering re-fetch
        router.invalidate();
      }
    };

    eventSource.onerror = () => {
      // EventSource will automatically reconnect on error
      // (built-in browser behavior)
      console.warn("[auto-refresh] SSE connection lost, reconnecting...");
    };

    return () => {
      eventSource.close();
    };
  }, [router]);
}
```

Key behaviors:
- `EventSource` has built-in reconnection on connection loss (browser standard behavior)
- `router.invalidate()` re-runs all `beforeLoad` hooks, which re-reads and re-parses progress.yaml
- Cleanup on unmount prevents memory leaks

### 4. Add useAutoRefresh to root layout

Update `app/routes/__root.tsx` to activate auto-refresh on all pages:

```typescript
// app/routes/__root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useAutoRefresh } from "../lib/useAutoRefresh";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  useAutoRefresh();

  return (
    <div className="dark min-h-screen bg-gray-950 text-gray-100">
      <Outlet />
    </div>
  );
}
```

### 5. Test the auto-refresh flow

End-to-end verification:

1. Start the dev server with `npm run dev`
2. Open the dashboard in a browser
3. Verify the SSE connection is established (check Network tab for `/api/watch` request with `text/event-stream` type)
4. Modify the project's `progress.yaml` file (e.g., change a task status)
5. Verify the browser updates automatically without manual refresh
6. Check that there are no errors in the browser console or server logs

---

## Verification

- [ ] `app/lib/file-watcher.ts` exists and exports `createFileWatcher`, `registerClient`, `getClientCount`
- [ ] `app/routes/api/watch.ts` exists and serves SSE responses
- [ ] `app/lib/useAutoRefresh.ts` exists and exports `useAutoRefresh` hook
- [ ] SSE endpoint responds with `Content-Type: text/event-stream`
- [ ] SSE endpoint sends `data: connected` on initial connection
- [ ] Modifying progress.yaml triggers `data: refresh` SSE event
- [ ] Browser re-renders with updated data after file change
- [ ] EventSource reconnects automatically on connection loss (verify by restarting server)
- [ ] No errors in browser console during normal operation
- [ ] Root layout includes `useAutoRefresh()` call

---

## Expected Output

**Key Files Created**:
- `app/lib/file-watcher.ts`: Node.js file watcher with client management
- `app/routes/api/watch.ts`: SSE API endpoint for pushing file change notifications
- `app/lib/useAutoRefresh.ts`: React hook that connects to SSE and triggers router invalidation

**Key Files Modified**:
- `app/routes/__root.tsx`: Updated to include `useAutoRefresh()` hook

---

## Common Issues and Solutions

### Issue 1: fs.watch fires multiple events for a single save
**Symptom**: Dashboard refreshes multiple times when progress.yaml is saved once
**Solution**: Add a debounce (e.g., 100ms) to the file watcher notification. Ignore events that fire within the debounce window of the last event.

### Issue 2: fs.watch not available or not working on certain filesystems
**Symptom**: File changes are not detected
**Solution**: Fall back to `fs.watchFile` (polling-based) if `fs.watch` fails. Log a warning about reduced performance.

### Issue 3: SSE connection shows as pending indefinitely in DevTools
**Symptom**: Network tab shows `/api/watch` request stuck in "pending" state
**Solution**: This is expected behavior for SSE connections. The connection stays open to receive events. It is not an error.

---

## Notes

- This is a local development tool, so SSE is appropriate. For production, consider WebSocket or polling with ETags
- The file watcher is a singleton: multiple browser tabs share the same watcher but each has its own SSE connection
- `fs.watch` behavior varies by OS; test on the target platform (Linux with inotify is reliable)
- Consider adding a debounce to the file watcher if double-fires become an issue during testing
- The `useAutoRefresh` hook is placed in the root layout so it works across all routes, including future milestone and task detail pages

---

**Next Task**: [Milestone 2 Tasks](../milestone-2-dashboard-views-interaction/)
**Related Design Docs**: [Server API & Auto-Refresh](../../design/local.server-api-auto-refresh.md)
**Estimated Completion Date**: TBD
