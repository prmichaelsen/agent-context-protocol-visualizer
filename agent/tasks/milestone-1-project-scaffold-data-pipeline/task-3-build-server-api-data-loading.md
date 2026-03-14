# Task 3: Build Server API & Data Loading

**Milestone**: [M1 - Project Scaffold & Data Pipeline](../../milestones/milestone-1-project-scaffold-data-pipeline.md)
**Design Reference**: [Server API & Auto-Refresh](../../design/local.server-api-auto-refresh.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 2
**Status**: Not Started

---

## Objective

Create the server-side data loading pipeline using TanStack Start server functions and the library-services pattern. The pipeline reads progress.yaml from disk, parses it through the lenient YAML parser, and delivers typed ProgressData to the client via SSR preloading.

---

## Context

TanStack Start supports server-side data loading via `beforeLoad` in route definitions, which enables SSR preloading so the dashboard renders with data on first paint (no loading spinner). The data loading follows the library-services pattern: a static service class (`ProgressDatabaseService`) encapsulates all data access logic, and routes call service methods in their `beforeLoad` hooks. The file path is configurable via environment variable, CLI argument, or default convention.

---

## Steps

### 1. Create configuration module

Create `app/lib/config.ts` to resolve the progress.yaml file path:

```typescript
// app/lib/config.ts

export function getProgressYamlPath(): string {
  // Priority: env var > CLI arg > default
  if (process.env.PROGRESS_YAML_PATH) {
    return process.env.PROGRESS_YAML_PATH;
  }

  const cliArg = process.argv.find((arg) => arg.startsWith("--progress-yaml="));
  if (cliArg) {
    return cliArg.split("=")[1];
  }

  return "./agent/progress.yaml";
}
```

### 2. Create the ProgressDatabaseService

Create `app/services/progress-database.service.ts` following the library-services pattern (static methods, no instantiation):

```typescript
// app/services/progress-database.service.ts
import fs from "node:fs";
import { getProgressYamlPath } from "../lib/config";
import { parseProgressYaml } from "../lib/yaml-loader";
import type { ProgressData } from "../lib/types";

export interface ProgressResult {
  success: true;
  data: ProgressData;
} | {
  success: false;
  error: "FILE_NOT_FOUND" | "PARSE_ERROR";
  message: string;
}

export class ProgressDatabaseService {
  static getProgressData(): ProgressResult {
    const filePath = getProgressYamlPath();

    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = parseProgressYaml(raw);
      return { success: true, data };
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return {
          success: false,
          error: "FILE_NOT_FOUND",
          message: `progress.yaml not found at: ${filePath}`,
        };
      }
      return {
        success: false,
        error: "PARSE_ERROR",
        message: `Failed to parse progress.yaml: ${(err as Error).message}`,
      };
    }
  }
}
```

### 3. Implement error handling with structured errors

The service returns a discriminated union (`ProgressResult`) so the UI can render appropriate error states:

- `FILE_NOT_FOUND`: Show a helpful message with the expected file path and how to configure it
- `PARSE_ERROR`: Show the error message so the user can fix the YAML

### 4. Update the index route with SSR data preloading

Update `app/routes/index.tsx` to load data server-side using `beforeLoad`:

```typescript
// app/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { ProgressDatabaseService } from "../services/progress-database.service";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const result = ProgressDatabaseService.getProgressData();
    return { progressResult: result };
  },
  component: HomePage,
});

function HomePage() {
  const { progressResult } = Route.useRouteContext();

  if (!progressResult.success) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-400">
          Error: {progressResult.error}
        </h1>
        <p className="mt-2 text-gray-400 font-mono text-sm">
          {progressResult.message}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">ACP Progress Visualizer</h1>
      <pre className="mt-4 p-4 bg-gray-900 rounded text-xs font-mono overflow-auto max-h-[80vh]">
        {JSON.stringify(progressResult.data, null, 2)}
      </pre>
    </div>
  );
}
```

### 5. Access data via Route.useRouteContext()

The `beforeLoad` return value is available in the component via `Route.useRouteContext()`. This pattern ensures:

- Data is loaded server-side during SSR (no loading spinner)
- The component receives typed data
- Error states are handled before rendering

### 6. Display raw JSON for pipeline verification

The initial implementation renders raw JSON of the parsed data. This serves as a visual verification that the entire pipeline works: file reading, YAML parsing, SSR delivery, and client rendering. This will be replaced with proper dashboard components in Milestone 2.

---

## Verification

- [ ] `app/lib/config.ts` exists and exports `getProgressYamlPath()`
- [ ] `app/services/progress-database.service.ts` exists and exports `ProgressDatabaseService`
- [ ] Page loads with SSR data (no loading spinner, data visible on first paint)
- [ ] Setting `PROGRESS_YAML_PATH` env var changes the file path
- [ ] Missing file shows structured FILE_NOT_FOUND error with the attempted path
- [ ] Malformed YAML shows PARSE_ERROR with error message
- [ ] Valid progress.yaml renders as formatted JSON on the page
- [ ] No client-side fetch waterfall (data arrives with SSR)

---

## Expected Output

**Key Files Created**:
- `app/lib/config.ts`: Configuration module for resolving progress.yaml path
- `app/services/progress-database.service.ts`: Service class for reading and parsing progress data

**Key Files Modified**:
- `app/routes/index.tsx`: Updated with `beforeLoad` SSR data preloading and JSON display

---

## Notes

- The library-services pattern uses static methods on a class rather than module-level functions. This provides a clear namespace and makes it easy to add methods later (e.g., `getProgressDataForMilestone`)
- The `beforeLoad` hook runs on the server during SSR, which means `fs.readFileSync` is safe to use here
- The raw JSON display is temporary and will be replaced by dashboard components in Milestone 2 tasks
- Consider adding caching to `ProgressDatabaseService` if performance becomes a concern (not needed for local dev tool)

---

**Next Task**: [Task 4: Add Auto-Refresh via SSE](./task-4-add-auto-refresh-sse.md)
**Related Design Docs**: [Server API & Auto-Refresh](../../design/local.server-api-auto-refresh.md)
**Estimated Completion Date**: TBD
