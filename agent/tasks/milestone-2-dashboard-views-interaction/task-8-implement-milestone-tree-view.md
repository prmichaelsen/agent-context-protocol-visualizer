# Task 8: Implement Milestone Tree View

**Milestone**: [M2 - Dashboard Views & Interaction](../../milestones/milestone-2-dashboard-views-interaction.md)
**Design Reference**: [Table & Tree Views](../../design/local.table-tree-views.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 7 (shares TaskList component)
**Status**: Not Started

---

## Objective

Build an expandable tree view showing milestone-to-task hierarchy with collapse animation. This provides an alternative to the table view, emphasizing the hierarchical structure of milestones and their tasks.

---

## Context

While the table view (Task 7) is data-dense and sortable, the tree view offers a more visual, hierarchy-focused way to browse milestones and tasks. Users can toggle between views using the ViewToggle component. The tree view reuses the TaskList component from Task 7, and adds smooth expand/collapse animations via a custom useCollapse hook. This view is especially useful for quickly scanning which milestones have incomplete tasks.

---

## Steps

### 1. Create `app/components/MilestoneTree.tsx`

Build the tree view component:

- Renders each milestone as an expandable row
- Each row shows: expand/collapse chevron, milestone name, ProgressBar (sm), task count
- Rows styled as cards: `bg-gray-900/50 border border-gray-800 rounded-lg` with hover effect
- Clicking a row toggles expansion to show its tasks

```typescript
interface MilestoneTreeProps {
  milestones: Milestone[];
}
```

### 2. Implement expand/collapse state

Manage expansion state with a Set of milestone IDs:

```typescript
const [expanded, setExpanded] = useState<Set<string>>(new Set());

const toggleExpanded = (id: string) => {
  setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
};
```

### 3. Implement smooth collapse animation with useCollapse hook

Use the useCollapse hook for smooth height animation when expanding/collapsing milestone task lists:

- Wrap the expandable content (TaskList) in a div that uses the useCollapse ref
- Animation should feel smooth and natural (300ms cubic-bezier transition)
- Content should not flash or jump during animation

### 4. Create `app/lib/useCollapse.ts`

Build the custom collapse hook:

```typescript
export function useCollapse(isOpen: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  // ...
}
```

- Uses a ref to measure the natural height of the content
- When `isOpen` is true: animate height from 0 to measured height, then set to `auto`
- When `isOpen` is false: animate height from current to 0
- CSS transition: `height 300ms cubic-bezier(0.4, 0, 0.2, 1)`
- Set `overflow: hidden` during animation
- Return `{ ref, style }` for the consumer to apply

### 5. Reuse TaskList component from Task 7

The expanded content for each milestone tree node renders the TaskList component:

- Same TaskList from Task 7 — no duplication
- Shows StatusDot, task name, truncated notes, ExtraFieldsBadge
- Indented within the tree node

### 6. Create `app/components/StatusDot.tsx`

Build the small status indicator dot:

- Renders different icons/shapes based on status:
  - `completed` → filled green circle with checkmark (`text-green-500`)
  - `in_progress` → filled blue circle (`text-blue-500`)
  - `not_started` → outlined gray circle (`text-gray-500`)
- Small size: `w-3 h-3` or equivalent
- Used in TaskList rows alongside task names

### 7. Update `app/routes/milestones.tsx`

Wire the ViewToggle to switch between MilestoneTable and MilestoneTree:

```typescript
const [view, setView] = useState<"table" | "tree">("table");

return (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Milestones</h1>
      <ViewToggle view={view} onViewChange={setView} />
    </div>
    {view === "table" ? (
      <MilestoneTable milestones={milestones} />
    ) : (
      <MilestoneTree milestones={milestones} />
    )}
  </div>
);
```

---

## Verification

- [ ] Tree view renders all milestones as expandable rows
- [ ] Each milestone row shows chevron, name, progress bar, and task count
- [ ] Clicking a milestone row expands it to show the task list
- [ ] Clicking again collapses the task list
- [ ] Expand/collapse animation is smooth (300ms, no jumping or flashing)
- [ ] TaskList in tree view matches TaskList in table view (same component)
- [ ] StatusDot shows correct icon and color for each status (completed=green check, in_progress=blue dot, not_started=gray circle)
- [ ] ViewToggle switches between table and tree views
- [ ] View state persists when data updates (expanded milestones stay expanded)
- [ ] Multiple milestones can be expanded simultaneously

---

## Expected Output

**File Structure**:
```
app/
├── components/
│   ├── MilestoneTree.tsx (new)
│   └── StatusDot.tsx (new)
├── lib/
│   └── useCollapse.ts (new)
├── routes/
│   └── milestones.tsx (updated)
```

**Key Files Created/Modified**:
- `app/components/MilestoneTree.tsx`: Expandable tree view of milestones and tasks
- `app/components/StatusDot.tsx`: Small colored status indicator dot
- `app/lib/useCollapse.ts`: Custom hook for smooth expand/collapse height animation
- `app/routes/milestones.tsx`: Updated to wire ViewToggle between table and tree views

---

## Notes

- The tree view is intentionally simpler than the table view — it does not support sorting
- useCollapse measures content height dynamically, so it works with variable-height task lists
- StatusDot is a smaller, simpler alternative to StatusBadge — used inline in task rows where space is tight
- Multiple milestones can be expanded at the same time (not accordion behavior)

---

**Next Task**: [Task 9: Implement Search & Filtering](./task-9-implement-search-filtering.md)
**Related Design Docs**: [Table & Tree Views](../../design/local.table-tree-views.md)
**Estimated Completion Date**: TBD
