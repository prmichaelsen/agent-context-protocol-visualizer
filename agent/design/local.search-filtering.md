# Search & Filtering

**Concept**: Fuse.js-powered fuzzy search and status-based filtering across milestones and tasks
**Created**: 2026-03-14
**Status**: Design Specification

---

## Overview

Defines the search and filtering system that lets users quickly find milestones and tasks by name/content (via fuse.js fuzzy search) and narrow results by status. Search and filter state is global — it persists across view switches (table ↔ tree) and is accessible from the sidebar.

---

## Problem Statement

With 10+ milestones and 50+ tasks, users need to:
- Find a specific milestone or task by name or keyword
- Focus on only in-progress items without scrolling past completed work
- Combine search and filter (e.g., "auth" tasks that are in-progress)

Without search/filter, users are back to mentally parsing a long list — defeating the purpose of a visual dashboard.

---

## Solution

1. **Fuse.js search index** built from milestones and tasks on data load
2. **Status filter** (all / not_started / in_progress / completed) applied as a pre-filter
3. **FilterContext** React context providing shared state across all views
4. **SearchBar** component in sidebar for global access
5. **FilterBar** component on milestone/task pages for quick status toggles

---

## Implementation

### Search Index

```typescript
// app/lib/search.ts

import Fuse from 'fuse.js';
import type { ProgressData, Milestone, Task } from './types';

export type SearchResult = {
  type: 'milestone' | 'task';
  milestone: Milestone;
  task?: Task;
  score: number;
};

export function buildSearchIndex(data: ProgressData) {
  const items: Array<{
    type: 'milestone' | 'task';
    milestone: Milestone;
    task?: Task;
    name: string;
    notes: string;
    extra: string;   // stringified extra fields for search coverage
  }> = [];

  for (const milestone of data.milestones) {
    items.push({
      type: 'milestone',
      milestone,
      name: milestone.name,
      notes: milestone.notes,
      extra: JSON.stringify(milestone.extra),
    });

    const tasks = data.tasks[milestone.id] || [];
    for (const task of tasks) {
      items.push({
        type: 'task',
        milestone,
        task,
        name: task.name,
        notes: task.notes,
        extra: JSON.stringify(task.extra),
      });
    }
  }

  return new Fuse(items, {
    keys: [
      { name: 'name', weight: 2 },
      { name: 'notes', weight: 1 },
      { name: 'extra', weight: 0.5 },
    ],
    threshold: 0.4,           // moderate fuzziness
    includeScore: true,
    ignoreLocation: true,     // match anywhere in string
  });
}
```

### Filter Context

```tsx
// app/lib/filter-context.tsx

import { createContext, useContext, useState, useMemo } from 'react';
import type { ProgressData, Status } from './types';

interface FilterState {
  status: Status | 'all';
  search: string;
}

interface FilterContextValue {
  filters: FilterState;
  setStatus: (status: Status | 'all') => void;
  setSearch: (query: string) => void;
  filteredData: ProgressData;
}

const FilterContext = createContext<FilterContextValue>(null!);

export function FilterProvider({ data, children }: { data: ProgressData; children: React.ReactNode }) {
  const [filters, setFilters] = useState<FilterState>({ status: 'all', search: '' });

  const filteredData = useMemo(() => {
    let milestones = data.milestones;
    let tasks = { ...data.tasks };

    // Status filter
    if (filters.status !== 'all') {
      milestones = milestones.filter(m => m.status === filters.status);
      tasks = Object.fromEntries(
        Object.entries(tasks).map(([id, ts]) => [
          id,
          ts.filter(t => t.status === filters.status),
        ])
      );
    }

    // Search filter (if query present, intersect with search results)
    if (filters.search.trim()) {
      const index = buildSearchIndex(data);
      const results = index.search(filters.search);
      const matchedMilestoneIds = new Set(
        results.map(r => r.item.milestone.id)
      );
      const matchedTaskIds = new Set(
        results.filter(r => r.item.task).map(r => r.item.task!.id)
      );
      milestones = milestones.filter(m => matchedMilestoneIds.has(m.id));
      tasks = Object.fromEntries(
        Object.entries(tasks).map(([id, ts]) => [
          id,
          ts.filter(t => matchedTaskIds.has(t.id) || matchedMilestoneIds.has(id)),
        ])
      );
    }

    return { ...data, milestones, tasks };
  }, [data, filters]);

  return (
    <FilterContext.Provider value={{
      filters,
      setStatus: (status) => setFilters(f => ({ ...f, status })),
      setSearch: (search) => setFilters(f => ({ ...f, search })),
      filteredData,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilters = () => useContext(FilterContext);
```

### FilterBar Component

Status toggle buttons displayed above milestone/task views:

```tsx
// app/components/FilterBar.tsx

const statusOptions: Array<{ value: Status | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'completed', label: 'Completed' },
];

function FilterBar() {
  const { filters, setStatus } = useFilters();

  return (
    <div className="flex gap-1 mb-4">
      {statusOptions.map(opt => (
        <button
          key={opt.value}
          onClick={() => setStatus(opt.value)}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
            filters.status === opt.value
              ? 'bg-gray-700 border-gray-600 text-gray-100'
              : 'bg-transparent border-gray-800 text-gray-500 hover:text-gray-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

### SearchBar Component

Located in the sidebar footer, accessible from any page:

```tsx
// app/components/SearchBar.tsx

function SearchBar() {
  const { filters, setSearch } = useFilters();

  return (
    <div className="relative">
      <SearchIcon className="absolute left-2 top-2 w-4 h-4 text-gray-500" />
      <input
        type="text"
        value={filters.search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search..."
        className="w-full bg-gray-900 border border-gray-800 rounded-md pl-8 pr-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-600"
      />
    </div>
  );
}
```

### Search Results Page

Dedicated `/search` route for viewing detailed search results when triggered from sidebar:

```tsx
// app/routes/search.tsx

function SearchPage() {
  const { filteredData, filters } = useFilters();

  if (!filters.search.trim()) {
    return <p className="text-gray-500 text-sm">Type to search milestones and tasks</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm text-gray-400">
        Results for "{filters.search}"
      </h2>
      {/* Grouped by milestones, then tasks */}
      {filteredData.milestones.map(m => (
        <SearchResultCard key={m.id} milestone={m} tasks={filteredData.tasks[m.id]} />
      ))}
    </div>
  );
}
```

---

## Benefits

- **Fast**: Fuse.js search is client-side, instant feedback
- **Fuzzy**: Typo-tolerant matching (threshold 0.4)
- **Combined**: Search + status filter work together naturally
- **Global**: Shared state persists across view switches
- **Extra fields searchable**: Agent-added properties are included in the search index

---

## Trade-offs

- **Client-side only**: Search index is rebuilt on each data load (acceptable for <100KB data)
- **No server-side search**: All data is loaded upfront (fine for single-project P0)
- **Fuse.js bundle size**: ~15KB gzipped (acceptable for admin dashboard)

---

## Applicable Patterns

| Pattern | How It Applies |
|---------|----------------|
| [`tanstack-cloudflare.global-search-context`](../patterns/tanstack-cloudflare.global-search-context.md) | Adopt the lightweight pub/sub `useRef` store for cross-component search/filter state instead of heavy React Context re-renders. `useGlobalSearch(key)` returns `[value, setValue]` and only re-renders subscribers of that key. Key convention: `milestones:search`, `milestones:status`. Wrap app in `<GlobalSearchProvider>` in root layout. This replaces the FilterContext approach in the implementation section — the GlobalSearchContext pattern is more performant for string-based filter state. |
| [`tanstack-cloudflare.pill-input`](../patterns/tanstack-cloudflare.pill-input.md) | Provides the proven fuse.js configuration: `threshold: 0.4`, `ignoreLocation: true`, keyboard navigation (arrows, Enter, Escape). The PillInput pattern's fuzzy matching config should be adopted for the search index. Also demonstrates combining predefined options with custom entries — applicable to filter presets. |
| [`tanstack-cloudflare.searchable-settings`](../patterns/tanstack-cloudflare.searchable-settings.md) | The registry-based AND-logic search pattern applies to multi-field filtering. Each searchable item has `name`, `description`, `keywords` — map to milestone/task names, notes, and extra field values. Hash-based scroll navigation could enable direct linking to search results. |
| [`tanstack-cloudflare.form-controls`](../patterns/tanstack-cloudflare.form-controls.md) | ToggleSwitch component (iOS-style, ARIA-accessible) for boolean filter controls. Could be used for "show completed" toggle. Fully keyboard-accessible with proper ARIA labels. |
| [`tanstack-cloudflare.unified-header`](../patterns/tanstack-cloudflare.unified-header.md) | FilterTabs component (inline pill-style filter controls): `flex gap-1 mb-4 p-1 bg-gray-800/50 rounded-lg`. Active button gets gradient background, inactive gets gray text with hover. Adopt this exact styling for the status filter bar rather than custom implementation. |

---

## Dependencies

- `fuse.js` — fuzzy search library
- React context API (or GlobalSearchContext pub/sub — see Applicable Patterns)

---

## Testing Strategy

- **Unit tests**: `buildSearchIndex` returns correct results for known queries
- **Fuzzy matching**: Typos still find results (e.g., "infrastrcture" → "infrastructure")
- **Filter tests**: Status filter correctly narrows milestone/task lists
- **Combined tests**: Search + filter intersection works correctly
- **Empty states**: No results shows appropriate message

---

## Migration Path

N/A — greenfield project.

---

## Future Considerations

- **Keyboard shortcut**: `Cmd+K` to focus search bar
- **Search history**: Recent searches stored in localStorage
- **Advanced filters**: Filter by date range, estimated hours, completion percentage
- **P1: Recent work search**: Include WorkEntry items in search index

---

**Status**: Design Specification
**Recommendation**: Implement alongside views — search/filter enhances all view components
**Related Documents**: local.visualizer-requirements.md, local.table-tree-views.md, tanstack-cloudflare.global-search-context, tanstack-cloudflare.pill-input, tanstack-cloudflare.searchable-settings, tanstack-cloudflare.form-controls, tanstack-cloudflare.unified-header
