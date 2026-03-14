# Data Model & YAML Parsing

**Concept**: TypeScript data model for progress.yaml and YAML-to-structured-data parsing pipeline
**Created**: 2026-03-14
**Status**: Design Specification

---

## Overview

Defines the TypeScript interfaces that represent ACP `progress.yaml` data and the parsing pipeline that converts raw YAML into typed, normalized structures suitable for rendering in the visualizer's views. This is the foundational data layer that all views, search, and filtering depend on.

---

## Problem Statement

ACP `progress.yaml` files are large (1800+ lines), loosely structured YAML **maintained by AI agents, not programmatic YAML operations**. This means:
- Fields may be missing, renamed, or added ad-hoc by different agents
- Unexpected/custom properties may appear at any level (e.g., an agent adds `priority: high` to a task)
- Key names may drift slightly (e.g., `estimated_hours` vs `est_hours` vs `hours`)
- Structural variations exist across projects (arrays vs objects, nested vs flat)

The visualizer needs:
- Strong TypeScript types for compile-time safety across all views
- **Lenient parsing** that extracts known fields without crashing on unknown ones
- **Passthrough of unrecognized properties** so they can be displayed in a "raw data" fallback
- Normalization of optional/missing fields to prevent runtime errors
- Consistent ID generation for entities that don't have explicit IDs in YAML
- Computed fields (e.g., task counts, completion percentages) derived from raw data

Without a well-defined but flexible data model, the visualizer would either crash on real-world YAML or silently lose agent-added context.

---

## Solution

Create a `yaml-loader.ts` module in `app/lib/` that:

1. Accepts raw YAML string input
2. Parses via `js-yaml` into untyped JavaScript objects
3. Validates and normalizes into strongly-typed TypeScript interfaces
4. Computes derived fields (progress percentages, task counts)
5. Returns a single `ProgressData` object consumed by all views

---

## Implementation

### TypeScript Interfaces

```typescript
// app/lib/types.ts

export type Status = 'completed' | 'in_progress' | 'not_started';

export interface ProgressData {
  project: ProjectMetadata;
  milestones: Milestone[];
  tasks: Record<string, Task[]>;  // keyed by milestone_id
  recent_work: WorkEntry[];
  next_steps: string[];
  notes: string[];
  current_blockers: string[];
  documentation: DocumentationStats;
  progress: ProgressSummary;
}

// Unknown properties from agent-maintained YAML are preserved here
// so views can display them in raw/debug panels without data loss.
export type ExtraFields = Record<string, unknown>;

export interface ProjectMetadata {
  name: string;
  version: string;
  started: string;
  status: Status;
  current_milestone?: string;
  description: string;
  extra: ExtraFields;          // any unrecognized project-level fields
}

export interface Milestone {
  id: string;
  name: string;
  status: Status;
  progress: number;            // 0-100
  started: string | null;
  completed: string | null;
  estimated_weeks: string;
  tasks_completed: number;
  tasks_total: number;
  notes: string;
  extra: ExtraFields;
}

export interface Task {
  id: string;
  name: string;
  status: Status;
  milestone_id: string;
  file: string;
  estimated_hours: string;
  completed_date: string | null;
  notes: string;
  extra: ExtraFields;
}

export interface WorkEntry {
  date: string;
  description: string;
  items: string[];
  extra: ExtraFields;
}

export interface DocumentationStats {
  design_documents: number;
  milestone_documents: number;
  pattern_documents: number;
  task_documents: number;
}

export interface ProgressSummary {
  planning: number;
  implementation: number;
  overall: number;
}
```

### YAML Parsing & Normalization

The parser follows a "extract known, preserve unknown" strategy:

```typescript
// app/lib/yaml-loader.ts

import yaml from 'js-yaml';
import type { ProgressData, Milestone, Task, Status, ExtraFields } from './types';

export function parseProgressYaml(raw: string): ProgressData {
  const doc = yaml.load(raw) as Record<string, unknown>;

  const project = normalizeProject(doc.project);
  const milestones = normalizeMilestones(doc.milestones);
  const tasks = normalizeTasks(doc.tasks, milestones);

  return {
    project,
    milestones,
    tasks,
    recent_work: normalizeWorkEntries(doc.recent_work),
    next_steps: normalizeStringArray(doc.next_steps),
    notes: normalizeStringArray(doc.notes),
    current_blockers: normalizeStringArray(doc.current_blockers),
    documentation: normalizeDocStats(doc.documentation),
    progress: normalizeProgress(doc.progress),
  };
}

// --- Core extraction helpers ---

/** Extract known keys from an object, return the rest as ExtraFields */
function extractKnown<T extends Record<string, unknown>>(
  obj: Record<string, unknown>,
  knownKeys: string[],
): { known: Partial<T>; extra: ExtraFields } {
  const known: Record<string, unknown> = {};
  const extra: ExtraFields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (knownKeys.includes(key)) {
      known[key] = value;
    } else {
      extra[key] = value;
    }
  }
  return { known: known as Partial<T>, extra };
}

function normalizeStatus(value: unknown): Status {
  const s = String(value || 'not_started')
    .toLowerCase()
    .replace(/[\s-]/g, '_');       // handle "in progress", "in-progress"
  if (s === 'completed' || s === 'done' || s === 'complete') return 'completed';
  if (s === 'in_progress' || s === 'active' || s === 'wip') return 'in_progress';
  return 'not_started';
}

function normalizeStringArray(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === 'string') return [value];  // agent wrote a single string instead of array
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

function safeString(value: unknown, fallback = ''): string {
  if (value == null) return fallback;
  return String(value);
}

function safeNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
```

### Handling Agent-Maintained YAML Drift

Since progress.yaml files are written and updated by AI agents (not schema-validated tooling), the parser must handle common drift patterns:

| Drift Pattern | Example | Handling |
|---|---|---|
| Unknown properties | `priority: high` on a task | Preserved in `extra` field, available for display |
| Variant key names | `est_hours` instead of `estimated_hours` | Alias map checked during normalization |
| Status value variants | `"done"`, `"active"`, `"wip"` | Fuzzy-matched to canonical Status enum |
| String-for-array | `notes: "some note"` instead of `notes: ["some note"]` | Wrapped in array automatically |
| Missing sections | No `milestones` key at all | Defaults to empty array |
| Unexpected nesting | Tasks as nested objects vs flat arrays | Both structures accepted |
| Extra top-level keys | `custom_metrics:` section | Ignored gracefully (not in ProgressData but no crash) |

**Key alias map** (checked in normalizers):
```typescript
const TASK_ALIASES: Record<string, string> = {
  est_hours: 'estimated_hours',
  hours: 'estimated_hours',
  estimate: 'estimated_hours',
  completed: 'completed_date',
  done_date: 'completed_date',
  filename: 'file',
  path: 'file',
};
```

### Computed Fields

The parser computes:
- `milestone.progress` from task completion ratios when not explicitly set
- `milestone.tasks_completed` / `tasks_total` from the tasks map
- `progress.overall` from milestone-level progress if not set

### Error Handling

- Missing top-level keys default to empty arrays/objects
- Invalid status values fuzzy-match to nearest canonical value, fallback to `'not_started'`
- Missing dates normalize to `null`
- Numeric fields default to `0`
- Unknown properties are preserved in `extra` fields, never discarded silently
- Entire parse is wrapped in try/catch — on total failure, returns a minimal ProgressData with error metadata

---

## Benefits

- **Type safety**: All view components get compile-time guarantees
- **Single source of truth**: One parsing function, consistent across all views
- **Defensive**: Gracefully handles incomplete or malformed YAML
- **Testable**: Pure function with no side effects

---

## Trade-offs

- **Extra fields add payload**: Preserving unknown properties increases data size, but keeps agent context available for display
- **Alias map maintenance**: New agent drift patterns may require adding aliases over time
- **Upfront parsing cost**: Entire file is parsed on each load (mitigated by small file sizes, typically <100KB)

---

## Applicable Patterns

| Pattern | How It Applies |
|---------|----------------|
| [`tanstack-cloudflare.zod-schema-validation`](../patterns/tanstack-cloudflare.zod-schema-validation.md) | Defines how to structure schemas as single source of truth. Use `z.infer<>` for derived types. For this project: Zod schemas could optionally validate known fields via `safeParse` while the `extractKnown` helper preserves extras — a hybrid approach that gets runtime validation on known fields without rejecting agent drift. Place schemas in `app/lib/schemas/`. |
| [`tanstack-cloudflare.library-services`](../patterns/tanstack-cloudflare.library-services.md) | YAML parsing should be encapsulated in a service class (`ProgressDataService`) rather than called directly from components or routes. The service provides `getProgressData()` which handles file reading, parsing, normalization, and error handling. Components never import `yaml-loader.ts` directly. |

---

## Dependencies

- `js-yaml` — YAML parsing library
- `zod` — optional runtime validation for known fields (see Applicable Patterns)
- No other external dependencies

---

## Testing Strategy

- **Unit tests**: Parse sample progress.yaml files with various completeness levels
- **Drift tests**: YAML with unknown fields, variant key names, status aliases — verify `extra` preservation and alias resolution
- **Edge cases**: Empty milestones array, missing tasks key, null dates, unknown status values, string-for-array, completely empty file
- **Snapshot tests**: Known YAML input → expected ProgressData output
- **Real-world tests**: Parse actual progress.yaml files from ACP core and other projects to catch unexpected structures

---

## Migration Path

N/A — greenfield project.

---

## Future Considerations

- Zod schema validation for runtime type checking (could replace manual normalization)
- Support for progress.yaml schema versioning if ACP introduces breaking changes
- Streaming parser for extremely large files (unlikely to be needed)

---

**Status**: Design Specification
**Recommendation**: Implement as first task — all other features depend on this
**Related Documents**: local.visualizer-requirements.md, tanstack-cloudflare.zod-schema-validation, tanstack-cloudflare.library-services
