# Task 7: Implement Milestone Table View

**Milestone**: [M2 - Dashboard Views & Interaction](../../milestones/milestone-2-dashboard-views-interaction.md)
**Design Reference**: [Table & Tree Views](../../design/local.table-tree-views.md)
**Estimated Time**: 3 hours
**Dependencies**: Task 5
**Status**: Not Started

---

## Objective

Build a sortable milestone table using @tanstack/react-table with expandable row detail. This provides the primary data-dense view for examining milestone status, progress, and associated tasks.

---

## Context

The milestone table is the core data view of the dashboard, allowing users to see all milestones in a structured, sortable format. It uses @tanstack/react-table for column management, sorting, and row expansion. Each row can be expanded to reveal the tasks within that milestone, displayed via a reusable TaskList component. The table also introduces the ViewToggle component that switches between table and tree views (tree view is built in Task 8).

---

## Steps

### 1. Create `app/components/MilestoneTable.tsx`

Build the table component using TanStack Table:

```typescript
import { createColumnHelper, useReactTable, getCoreRowModel, getSortedRowModel, getExpandedRowModel } from "@tanstack/react-table";
```

- Use `createColumnHelper` to define typed columns
- Use `useReactTable` with `getCoreRowModel`, `getSortedRowModel`, and `getExpandedRowModel`
- Render table with `<table>` elements styled with Tailwind (border-collapse, full width)

### 2. Define table columns

Configure the following columns:

| Column | Width | Content |
|--------|-------|---------|
| Expand | 40px | Chevron icon (ChevronRight/ChevronDown from lucide-react) |
| Name | flex | Milestone name, linked to detail |
| Status | 120px | StatusBadge component |
| Progress | 140px | ProgressBar (sm) + percentage text |
| Tasks | 80px | Completed/total count (e.g., "3/7") |
| Started | 100px | Start date, formatted |
| Est. Weeks | 80px | Estimated duration in weeks |

### 3. Implement sort headers

- Clicking a column header toggles sort direction (asc → desc → none)
- Show visual sort indicators: ChevronUp for ascending, ChevronDown for descending
- Sortable columns: Name, Status, Progress, Tasks, Started, Est. Weeks
- Default sort: by natural order (no initial sort)

### 4. Implement row expansion

- Clicking the chevron icon in the first column toggles row expansion
- Expanded row reveals a TaskList component showing all tasks for that milestone
- Use `getExpandedRowModel` from TanStack Table
- Expanded content spans all columns with appropriate padding and indentation

### 5. Create `app/components/TaskList.tsx`

Build the task list component for expanded milestone rows:

- Indented list (`pl-8`) showing tasks within a milestone
- Each task row shows: StatusDot, task name, truncated notes (max 80 chars), ExtraFieldsBadge
- Styled with subtle row separators (`border-b border-gray-800/50`)
- Used by both the table view (Task 7) and tree view (Task 8)

### 6. Create `app/components/ExtraFieldsBadge.tsx`

Build the badge component for tasks with extra/custom fields:

- Shows a "+N" count indicating how many extra fields exist beyond standard fields (name, status, notes)
- Only renders when extra fields are present
- On hover, shows a tooltip with the extra fields as formatted JSON
- Styled as a small pill: `bg-gray-700 text-gray-300 text-xs rounded px-1.5`

### 7. Update `app/routes/milestones.tsx`

Wire up the milestones route:

- Add `beforeLoad` or `loader` to fetch progress data via SSR
- Render a page header with "Milestones" title and ViewToggle
- Render MilestoneTable as the default view
- Handle empty state: show "No milestones found" message when data has no milestones

### 8. Create `app/components/ViewToggle.tsx`

Build the table/tree toggle component:

- Two buttons: "Table" and "Tree" (or icons: List and GitBranch from lucide-react)
- Active view button is visually highlighted (`bg-gray-700` vs `bg-transparent`)
- Accepts `view` and `onViewChange` props
- Compact styling: `inline-flex rounded-lg border border-gray-700`

---

## Verification

- [ ] Table renders all milestones from progress data
- [ ] All columns display correct data (name, status badge, progress bar, task count, dates)
- [ ] Clicking column headers sorts the table (ascending, descending, none)
- [ ] Sort direction indicators (chevrons) appear on sorted columns
- [ ] Clicking expand chevron reveals TaskList for that milestone
- [ ] TaskList shows all tasks with StatusDot, name, truncated notes
- [ ] ExtraFieldsBadge appears for tasks with extra fields and shows "+N" count
- [ ] ExtraFieldsBadge tooltip shows extra field details on hover
- [ ] ViewToggle renders with Table/Tree options
- [ ] Empty state handled when no milestones exist
- [ ] Table scrolls horizontally on narrow viewports if needed

---

## Expected Output

**File Structure**:
```
app/
├── components/
│   ├── ExtraFieldsBadge.tsx (new)
│   ├── MilestoneTable.tsx (new)
│   ├── TaskList.tsx (new)
│   └── ViewToggle.tsx (new)
├── routes/
│   └── milestones.tsx (updated)
```

**Key Files Created/Modified**:
- `app/components/MilestoneTable.tsx`: Sortable milestone table with row expansion
- `app/components/TaskList.tsx`: Reusable task list for expanded rows (shared with tree view)
- `app/components/ExtraFieldsBadge.tsx`: Badge showing extra field count with tooltip
- `app/components/ViewToggle.tsx`: Table/Tree view toggle buttons
- `app/routes/milestones.tsx`: Updated with data loader and table rendering

---

## Notes

- TaskList is intentionally extracted as a shared component because Task 8 (tree view) reuses it
- ExtraFieldsBadge handles the schema-agnostic nature of progress.yaml — tasks can have arbitrary extra fields
- The table uses native `<table>` elements rather than CSS grid for better accessibility and column alignment
- @tanstack/react-table should already be installed from Task 1

---

**Next Task**: [Task 8: Implement Milestone Tree View](./task-8-implement-milestone-tree-view.md)
**Related Design Docs**: [Table & Tree Views](../../design/local.table-tree-views.md)
**Estimated Completion Date**: TBD
