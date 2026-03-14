# Task 9: Implement Search & Filtering

**Milestone**: [M2 - Dashboard Views & Interaction](../../milestones/milestone-2-dashboard-views-interaction.md)
**Design Reference**: [Search & Filtering](../../design/local.search-filtering.md)
**Estimated Time**: 3 hours
**Dependencies**: Task 7, Task 8
**Status**: Not Started

---

## Objective

Add fuse.js fuzzy search and status-based filtering across milestones and tasks, with shared state via GlobalSearchContext. This enables users to quickly find specific milestones or tasks by name and narrow results by status.

---

## Context

As the progress.yaml data grows (real-world files can be 1800+ lines), users need efficient ways to find specific items. This task adds two complementary features: fuzzy search (powered by fuse.js) that matches against milestone and task names/notes, and status filters that narrow the view to items matching a selected status. Both features share state through a global context so the search query persists across navigation. The search and filter logic is encapsulated in reusable hooks that the table, tree, and search page views can all consume.

---

## Steps

### 1. Create `app/lib/search.ts`

Build the search index and query functions using fuse.js:

```typescript
import Fuse from "fuse.js";

const fuseOptions: Fuse.IFuseOptions<SearchableItem> = {
  threshold: 0.4,
  ignoreLocation: true,
  keys: [
    { name: "name", weight: 2 },
    { name: "notes", weight: 1 },
    { name: "extra", weight: 0.5 },
  ],
};

export function buildSearchIndex(data: ProgressData): Fuse<SearchableItem> {
  // Flatten milestones and tasks into searchable items
  // Each item includes: name, notes, extra fields, type (milestone/task), parentMilestone
  // ...
}
```

- Flatten milestones and tasks into a unified searchable array
- Each searchable item carries metadata about its type and parent milestone
- Threshold of 0.4 allows fuzzy matching (typos still return results)
- `ignoreLocation: true` matches anywhere in the string, not just near the start

### 2. Create `app/contexts/GlobalSearchContext.tsx`

Build a global search state context using useRef-based pub/sub:

```typescript
interface GlobalSearchState {
  query: string;
  statusFilter: string | null; // null = all, or "completed" | "in_progress" | "not_started"
}

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  // useRef-based store for performance (avoids re-rendering entire tree)
  // Subscribers register with useGlobalSearch(key) hook
}

export function useGlobalSearch(key: keyof GlobalSearchState) {
  // Returns [value, setValue] for the specified key
  // Only re-renders when the subscribed key changes
}
```

- Uses useRef internally to store state, with a subscriber pattern to notify consumers
- Avoids re-rendering the entire component tree when search state changes
- Provides both the query string and status filter as separate subscribable keys

### 3. Create `app/lib/useFilteredData.ts`

Build a hook that applies both search and status filter to progress data:

```typescript
export function useFilteredData(data: ProgressData): ProgressData {
  const [query] = useGlobalSearch("query");
  const [statusFilter] = useGlobalSearch("statusFilter");

  return useMemo(() => {
    let filtered = data;

    // Apply status filter
    if (statusFilter) {
      filtered = filterByStatus(filtered, statusFilter);
    }

    // Apply search query
    if (query) {
      filtered = filterBySearch(filtered, query);
    }

    return filtered;
  }, [data, query, statusFilter]);
}
```

- Returns a filtered copy of ProgressData (does not mutate original)
- Status filter narrows milestones and tasks to matching status
- Search filter uses the fuse.js index to match by name/notes
- Filters compose: status filter + search query both apply simultaneously

### 4. Create `app/components/FilterBar.tsx`

Build the pill-style status filter toggle:

- Renders toggle buttons: All, In Progress, Not Started, Completed
- Active filter pill is highlighted (`bg-blue-500/20 text-blue-400 border-blue-500/50`)
- Inactive pills are subtle (`bg-gray-800 text-gray-400 border-gray-700`)
- Clicking a pill updates the statusFilter in GlobalSearchContext
- Clicking the active pill deselects it (returns to "All")
- Styled as inline-flex with gap between pills

### 5. Create `app/components/SearchBar.tsx`

Build the search input for the sidebar:

- Search icon (Search from lucide-react) on the left
- Text input with placeholder "Search milestones & tasks..."
- Connected to GlobalSearchContext query state
- Debounced input (300ms) to avoid excessive re-filtering
- Styled to match sidebar: `bg-gray-900 border border-gray-800 rounded-lg`
- Pressing Escape clears the search
- Pressing Enter navigates to `/search` for full results page

### 6. Add GlobalSearchProvider to root layout

Update `app/routes/__root.tsx` to wrap the app with the GlobalSearchProvider:

```typescript
function RootLayout() {
  return (
    <GlobalSearchProvider>
      <div className="dark min-h-screen bg-gray-950 text-gray-100 flex">
        <Sidebar />
        {/* ... */}
      </div>
    </GlobalSearchProvider>
  );
}
```

### 7. Update milestones.tsx to use useFilteredData

Wire the filter and search hooks into the milestones page:

- Add FilterBar above the table/tree views
- Use `useFilteredData` to get filtered milestones
- Pass filtered data to MilestoneTable and MilestoneTree
- When filters result in empty data, show "No milestones match your filters" message

### 8. Update `app/routes/search.tsx`

Build the dedicated search results page:

- Shows search results grouped by milestone
- Each group shows the milestone name as a header, with matching tasks listed below
- Highlights which part of the result matched (milestone name vs task name/notes)
- Shows total result count
- Empty state: "No results found for '{query}'" with suggestion to try different terms
- Links to navigate to the milestone/task in the main views

---

## Verification

- [ ] Search finds milestones by name (exact and partial match)
- [ ] Search finds tasks by name (exact and partial match)
- [ ] Fuzzy matching works (typos like "milstone" still match "milestone")
- [ ] Status filter narrows results to only matching status items
- [ ] Combined search + filter works (e.g., search "auth" + filter "in_progress")
- [ ] Filter state persists when switching between table and tree views
- [ ] Search query persists when navigating between routes
- [ ] SearchBar in sidebar is debounced (no lag while typing)
- [ ] Pressing Escape in SearchBar clears the query
- [ ] Search results page shows grouped results by milestone
- [ ] Empty state shows appropriate message when no results found
- [ ] GlobalSearchProvider wraps the entire app in root layout

---

## Expected Output

**File Structure**:
```
app/
├── components/
│   ├── FilterBar.tsx (new)
│   └── SearchBar.tsx (new)
├── contexts/
│   └── GlobalSearchContext.tsx (new)
├── lib/
│   ├── search.ts (new)
│   └── useFilteredData.ts (new)
├── routes/
│   ├── __root.tsx (updated)
│   ├── milestones.tsx (updated)
│   └── search.tsx (updated)
```

**Key Files Created/Modified**:
- `app/lib/search.ts`: Fuse.js search index builder and query functions
- `app/contexts/GlobalSearchContext.tsx`: Global search state with pub/sub pattern
- `app/lib/useFilteredData.ts`: Hook composing status filter and search query
- `app/components/FilterBar.tsx`: Pill-style status toggle buttons
- `app/components/SearchBar.tsx`: Search input for sidebar with debounce
- `app/routes/__root.tsx`: Updated to include GlobalSearchProvider
- `app/routes/milestones.tsx`: Updated to use useFilteredData and FilterBar
- `app/routes/search.tsx`: Updated with grouped search results page

---

## Notes

- fuse.js should already be installed from Task 1; verify with `npm ls fuse.js`
- The 300ms debounce on SearchBar prevents excessive re-filtering on every keystroke
- GlobalSearchContext uses useRef-based pub/sub (not useState in context) to avoid re-rendering the entire tree when search state changes — only subscribed components re-render
- The search index is rebuilt when progress data changes (e.g., on auto-refresh)
- Status filter values must match the status strings in progress.yaml exactly

---

**Next Task**: [Task 10: Polish & Integration Testing](./task-10-polish-integration-testing.md)
**Related Design Docs**: [Search & Filtering](../../design/local.search-filtering.md)
**Estimated Completion Date**: TBD
