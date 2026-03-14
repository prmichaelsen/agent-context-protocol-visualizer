# Task 2: Implement Data Model & YAML Parser

**Milestone**: [M1 - Project Scaffold & Data Pipeline](../../milestones/milestone-1-project-scaffold-data-pipeline.md)
**Design Reference**: [Data Model & YAML Parsing](../../design/local.data-model-yaml-parsing.md)
**Estimated Time**: 3 hours
**Dependencies**: Task 1
**Status**: Not Started

---

## Objective

Create TypeScript interfaces for progress.yaml data and a lenient YAML parser that handles agent-maintained YAML with drift tolerance. The parser must gracefully handle missing fields, unknown keys, status aliases, and type coercion so the dashboard never crashes on imperfect YAML.

---

## Context

The progress.yaml file is maintained by AI agents and tends to drift from a strict schema over time. Fields get renamed, statuses use informal terms ("done" instead of "completed"), single strings appear where arrays are expected, and unknown fields accumulate. The parser must be maximally tolerant: extract what it can, preserve unknown fields in an `extra` bag, normalize statuses and field names, and return safe defaults for anything missing. This approach ensures the dashboard always renders something useful rather than crashing on schema violations.

---

## Steps

### 1. Create TypeScript interfaces

Create `app/lib/types.ts` with all data model interfaces:

```typescript
// app/lib/types.ts

export type Status = "completed" | "in_progress" | "not_started" | "blocked" | "skipped";

export interface ExtraFields {
  [key: string]: unknown;
}

export interface ProjectMetadata {
  name: string;
  description: string;
  version: string;
  repository: string;
  extra: ExtraFields;
}

export interface WorkEntry {
  date: string;
  task: string;
  hours: number;
  notes: string;
  extra: ExtraFields;
}

export interface Task {
  id: string;
  title: string;
  status: Status;
  estimated_hours: number;
  actual_hours: number;
  dependencies: string[];
  tags: string[];
  notes: string;
  extra: ExtraFields;
}

export interface Milestone {
  id: string;
  title: string;
  status: Status;
  target_date: string;
  tasks: Task[];
  extra: ExtraFields;
}

export interface DocumentationStats {
  design_docs: number;
  task_docs: number;
  patterns: number;
  clarifications: number;
  extra: ExtraFields;
}

export interface ProgressSummary {
  total_tasks: number;
  completed_tasks: number;
  completion_percentage: number;
  total_hours_estimated: number;
  total_hours_actual: number;
  extra: ExtraFields;
}

export interface ProgressData {
  project: ProjectMetadata;
  milestones: Milestone[];
  work_entries: WorkEntry[];
  documentation: DocumentationStats;
  progress: ProgressSummary;
  extra: ExtraFields;
}
```

### 2. Create the YAML loader module

Create `app/lib/yaml-loader.ts` with the main `parseProgressYaml` function:

```typescript
// app/lib/yaml-loader.ts
import yaml from "js-yaml";
import type { ProgressData } from "./types";

export function parseProgressYaml(raw: string): ProgressData {
  // Implementation in subsequent steps
}
```

### 3. Implement the `extractKnown` helper

This utility separates known fields from extras, which is the foundation of drift tolerance:

```typescript
function extractKnown<T extends Record<string, unknown>>(
  obj: Record<string, unknown>,
  knownKeys: string[]
): { known: Partial<T>; extra: Record<string, unknown> } {
  const known: Record<string, unknown> = {};
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (knownKeys.includes(key)) {
      known[key] = value;
    } else {
      extra[key] = value;
    }
  }
  return { known: known as Partial<T>, extra };
}
```

### 4. Implement `normalizeStatus`

Map informal status strings to canonical Status values using fuzzy matching:

```typescript
function normalizeStatus(raw: unknown): Status {
  if (typeof raw !== "string") return "not_started";
  const s = raw.toLowerCase().trim().replace(/[\s-]/g, "_");
  const aliases: Record<string, Status> = {
    done: "completed",
    complete: "completed",
    completed: "completed",
    finished: "completed",
    active: "in_progress",
    wip: "in_progress",
    in_progress: "in_progress",
    working: "in_progress",
    started: "in_progress",
    pending: "not_started",
    not_started: "not_started",
    todo: "not_started",
    queued: "not_started",
    blocked: "blocked",
    stuck: "blocked",
    waiting: "blocked",
    skipped: "skipped",
    dropped: "skipped",
    deferred: "skipped",
  };
  return aliases[s] ?? "not_started";
}
```

### 5. Implement key alias maps

Create alias maps so renamed fields still parse correctly:

```typescript
const TASK_KEY_ALIASES: Record<string, string> = {
  est_hours: "estimated_hours",
  estimated: "estimated_hours",
  actual: "actual_hours",
  act_hours: "actual_hours",
  deps: "dependencies",
  depends_on: "dependencies",
  name: "title",
};

const MILESTONE_KEY_ALIASES: Record<string, string> = {
  name: "title",
  target: "target_date",
  due_date: "target_date",
  deadline: "target_date",
};
```

### 6. Implement `normalizeStringArray`

Handle cases where a single string appears instead of an array:

```typescript
function normalizeStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") return [raw];
  return [];
}
```

### 7. Implement entity normalizers

Create normalizer functions for each entity type:

- `normalizeProject(raw: unknown): ProjectMetadata` — extracts name, description, version, repository with string defaults
- `normalizeMilestones(raw: unknown): Milestone[]` — iterates array, applies key aliases, normalizes status and tasks
- `normalizeTasks(raw: unknown): Task[]` — iterates array, applies key aliases, normalizes status, coerces string arrays for deps/tags
- `normalizeWorkEntries(raw: unknown): WorkEntry[]` — iterates array, coerces hours to number, defaults date/task/notes
- `normalizeDocStats(raw: unknown): DocumentationStats` — extracts numeric counts with 0 defaults
- `normalizeProgress(raw: unknown): ProgressSummary` — extracts numeric summary fields with 0 defaults

Each normalizer should use `extractKnown` to separate known fields from extras.

### 8. Implement top-level parser with fallback

Wire up `parseProgressYaml`:

```typescript
export function parseProgressYaml(raw: string): ProgressData {
  try {
    const doc = yaml.load(raw) as Record<string, unknown> | null;
    if (!doc || typeof doc !== "object") {
      return emptyProgressData();
    }
    return {
      project: normalizeProject(doc.project),
      milestones: normalizeMilestones(doc.milestones),
      work_entries: normalizeWorkEntries(doc.work_entries ?? doc.work_log),
      documentation: normalizeDocStats(doc.documentation ?? doc.docs),
      progress: normalizeProgress(doc.progress ?? doc.summary),
      extra: extractTopLevelExtra(doc),
    };
  } catch {
    return emptyProgressData();
  }
}
```

### 9. Write unit tests

Create `app/lib/__tests__/yaml-loader.test.ts` with tests covering:

- Complete valid YAML parses correctly
- Missing sections default gracefully (empty arrays, zero counts)
- Unknown fields preserved in `extra`
- Status aliases resolve correctly (`"done"` becomes `"completed"`, `"wip"` becomes `"in_progress"`)
- Single string coerced to array for dependencies and tags
- Key aliases work (`est_hours` becomes `estimated_hours`)
- Completely invalid YAML returns empty ProgressData (no crash)
- Empty string input returns empty ProgressData

---

## Verification

- [ ] `app/lib/types.ts` exports all interfaces: Status, ExtraFields, ProgressData, ProjectMetadata, Milestone, Task, WorkEntry, DocumentationStats, ProgressSummary
- [ ] `app/lib/yaml-loader.ts` exports `parseProgressYaml` function
- [ ] Parser handles complete YAML and returns fully populated ProgressData
- [ ] Parser handles incomplete YAML with missing sections (defaults to empty arrays/zero counts)
- [ ] Unknown fields are preserved in `extra` objects at every level
- [ ] Status aliases resolve correctly (done, wip, active, pending, stuck, etc.)
- [ ] Single string values coerced to arrays for dependencies and tags
- [ ] Key aliases resolve correctly (est_hours, deps, name, etc.)
- [ ] Completely invalid YAML returns empty ProgressData without throwing
- [ ] All unit tests pass

---

## Expected Output

**Key Files Created**:
- `app/lib/types.ts`: TypeScript interfaces for the entire progress.yaml data model
- `app/lib/yaml-loader.ts`: Lenient YAML parser with drift tolerance
- `app/lib/__tests__/yaml-loader.test.ts`: Unit tests for the parser

---

## Notes

- The parser is intentionally lenient; it should never throw. Any error results in a fallback empty ProgressData
- The `extra` field pattern is critical: it allows the dashboard to display fields the schema does not yet know about, which is essential for agent-maintained YAML that evolves over time
- Status normalization covers common agent shorthand; new aliases can be added as they are discovered
- Key alias maps should be extended if agents consistently use non-standard field names

---

**Next Task**: [Task 3: Build Server API & Data Loading](./task-3-build-server-api-data-loading.md)
**Related Design Docs**: [Data Model & YAML Parsing](../../design/local.data-model-yaml-parsing.md)
**Estimated Completion Date**: TBD
