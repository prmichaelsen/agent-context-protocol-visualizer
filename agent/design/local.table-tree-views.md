# Table & Tree Views

**Concept**: P0 milestone/task visualization via sortable table and expandable tree views
**Created**: 2026-03-14
**Status**: Design Specification

---

## Overview

Defines the two P0 view components for visualizing milestones and tasks: a sortable, filterable **table view** using `@tanstack/react-table` and an expandable/collapsible **tree view** showing the milestone → task hierarchy. Both views share the same underlying data and filter state.

---

## Problem Statement

Progress.yaml contains hierarchical data (project → milestones → tasks) that users need to navigate efficiently. Two complementary views are needed:
- **Table**: Dense, scannable, sortable — best for comparing milestones side-by-side
- **Tree**: Hierarchical, contextual — best for understanding milestone-task relationships and drilling into details

---

## Solution

Two view components that share filter/search state, switchable via a toggle in the milestones page header. Both receive `ProgressData` as input and render milestones with inline task expansion.

---

## Implementation

### View Toggle

```tsx
// app/routes/milestones.tsx

function MilestonesPage() {
  const [view, setView] = useState<'table' | 'tree'>('table');
  const { data } = Route.useLoaderData();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Milestones</h2>
        <ViewToggle value={view} onChange={setView} />
      </div>
      <FilterBar />
      {view === 'table' ? (
        <MilestoneTable data={data} />
      ) : (
        <MilestoneTree data={data} />
      )}
    </div>
  );
}
```

### MilestoneTable

Uses `@tanstack/react-table` with the following columns:

| Column | Width | Content | Sortable |
|--------|-------|---------|----------|
| Name | flex | Milestone name | Yes |
| Status | 120px | StatusBadge component | Yes |
| Progress | 140px | ProgressBar + percentage | Yes |
| Tasks | 80px | `completed/total` | Yes |
| Started | 100px | Date string | Yes |
| Est. Weeks | 80px | Estimated duration | Yes |

```tsx
// app/components/MilestoneTable.tsx

import { createColumnHelper, useReactTable, getCoreRowModel, getSortedRowModel } from '@tanstack/react-table';

const columnHelper = createColumnHelper<Milestone>();

const columns = [
  columnHelper.accessor('name', {
    header: 'Milestone',
    cell: info => (
      <Link to="/milestones/$id" params={{ id: info.row.original.id }}
        className="text-blue-400 hover:text-blue-300">
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor('progress', {
    header: 'Progress',
    cell: info => (
      <div className="flex items-center gap-2">
        <ProgressBar value={info.getValue()} size="sm" />
        <span className="text-xs text-gray-400 font-mono w-8">
          {info.getValue()}%
        </span>
      </div>
    ),
  }),
  columnHelper.display({
    id: 'tasks',
    header: 'Tasks',
    cell: info => (
      <span className="font-mono text-xs">
        {info.row.original.tasks_completed}/{info.row.original.tasks_total}
      </span>
    ),
  }),
  columnHelper.accessor('started', {
    header: 'Started',
    cell: info => (
      <span className="text-xs text-gray-400">
        {info.getValue() || '—'}
      </span>
    ),
  }),
];
```

**Row expansion**: Clicking a row or expansion chevron reveals the task list for that milestone inline, below the row.

### MilestoneTree

Expandable/collapsible tree structure:

```
▼ M1 - Core Infrastructure          [████████░░] 80%  ✓ 8/10 tasks
    ✓ task-1: Setup project scaffold
    ✓ task-2: Implement data model
    ● task-3: Build server API          (in progress)
    ○ task-4: Add auto-refresh
▶ M2 - Views & Components           [██░░░░░░░░] 20%  ✓ 2/10 tasks
▶ M3 - Search & Polish              [░░░░░░░░░░]  0%  ○ 0/6 tasks
```

```tsx
// app/components/MilestoneTree.tsx

function MilestoneTree({ data }: { data: ProgressData }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-1">
      {data.milestones.map(milestone => (
        <div key={milestone.id}>
          <MilestoneTreeRow
            milestone={milestone}
            expanded={expanded.has(milestone.id)}
            onToggle={() => toggle(milestone.id)}
          />
          {expanded.has(milestone.id) && (
            <TaskList tasks={data.tasks[milestone.id] || []} />
          )}
        </div>
      ))}
    </div>
  );
}
```

### TaskList (Shared)

Used by both table row expansion and tree expansion:

```tsx
// app/components/TaskList.tsx

function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div className="pl-6 py-1 space-y-0.5">
      {tasks.map(task => (
        <div key={task.id} className="flex items-center gap-2 py-1 text-sm">
          <StatusDot status={task.status} />
          <span className={task.status === 'completed' ? 'text-gray-500' : 'text-gray-200'}>
            {task.name}
          </span>
          {task.notes && (
            <span className="text-xs text-gray-500 ml-auto truncate max-w-[200px]">
              {task.notes}
            </span>
          )}
          {Object.keys(task.extra).length > 0 && (
            <ExtraFieldsBadge fields={task.extra} />
          )}
        </div>
      ))}
    </div>
  );
}
```

### Extra Fields Display

When tasks or milestones have `extra` fields from agent drift, show a subtle indicator:

```tsx
// app/components/ExtraFieldsBadge.tsx

function ExtraFieldsBadge({ fields }: { fields: ExtraFields }) {
  const count = Object.keys(fields).length;
  if (count === 0) return null;

  return (
    <Tooltip content={JSON.stringify(fields, null, 2)}>
      <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
        +{count}
      </span>
    </Tooltip>
  );
}
```

### Shared Filter State

Both views consume the same filter context:

```typescript
interface FilterState {
  status: Status | 'all';
  search: string;
}
```

Filtering is applied before data reaches view components — filtered `ProgressData` is passed as props. See `local.search-filtering.md` for filter implementation.

---

## Benefits

- **Two complementary views**: Table for scanning, tree for hierarchy
- **Shared data/filters**: Switching views preserves filter state
- **Information dense**: Monospace values, compact rows, inline expansion
- **Extra fields visible**: Agent-added properties are discoverable via badges

---

## Trade-offs

- **No virtualization in P0**: Large milestone lists (50+) may have rendering cost (mitigated: most projects have <20 milestones)
- **Inline expansion only**: No separate task detail page in P0 (tree + expansion provides sufficient detail)

---

## Applicable Patterns

| Pattern | How It Applies |
|---------|----------------|
| [`tanstack-cloudflare.expander`](../patterns/tanstack-cloudflare.expander.md) | Use the `useCollapse` hook for smooth height animation on tree node expand/collapse and table row expansion. 300ms cubic-bezier transition with `overflow: hidden`. Handles the scrollHeight → 0 measurement pattern for accurate animation. Use the `thread` or `segmented` variant style for tree indentation lines. |
| [`tanstack-cloudflare.card-and-list`](../patterns/tanstack-cloudflare.card-and-list.md) | TaskList rendering follows the FeedList pattern: loading skeletons, empty states, consistent card styling (`bg-gray-900/50 border border-gray-800 rounded-xl`). Text hierarchy for task items follows the pattern's conventions. |
| [`tanstack-cloudflare.pagination`](../patterns/tanstack-cloudflare.pagination.md) | If milestone/task lists grow large, adopt Virtuoso integration for virtualized rendering. For P0, simple rendering is sufficient (<50 milestones), but the pattern's InfiniteScrollSentinel and `useRef` offset tracking provide the upgrade path. |
| [`tanstack-cloudflare.ssr-preload`](../patterns/tanstack-cloudflare.ssr-preload.md) | Both table and tree views receive data via `Route.useRouteContext()` from SSR `beforeLoad`. Components initialize with SSR data, skip client fetch when present. No loading spinners on initial render. |

---

## Dependencies

- `@tanstack/react-table` — table primitives
- `StatusBadge`, `ProgressBar` from layout design
- `ProgressData` types from data model design

---

## Testing Strategy

- **Component tests**: Table renders correct columns, sorting works, tree expand/collapse toggles
- **Filter integration**: Filtered data shows correct subset in both views
- **Empty state**: Both views handle 0 milestones gracefully
- **Extra fields**: Badge renders when extra fields present, tooltip shows JSON

---

## Migration Path

N/A — greenfield project.

---

## Future Considerations

- **P1: Kanban view** — Third view option showing milestones as cards in status columns
- **P2: Gantt view** — Timeline visualization with date positioning
- **Virtualization**: If projects grow beyond 50 milestones, add `@tanstack/react-virtual`
- **Task detail page**: `milestones.$id.tasks.$taskId.tsx` for full task view with notes, history

---

**Status**: Design Specification
**Recommendation**: Implement after layout + server API are in place
**Related Documents**: local.visualizer-requirements.md, local.dashboard-layout-routing.md, local.data-model-yaml-parsing.md, tanstack-cloudflare.expander, tanstack-cloudflare.card-and-list, tanstack-cloudflare.pagination, tanstack-cloudflare.ssr-preload
