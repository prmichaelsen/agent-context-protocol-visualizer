# Task 6: Build Overview Page

**Milestone**: [M2 - Dashboard Views & Interaction](../../milestones/milestone-2-dashboard-views-interaction.md)
**Design Reference**: [Dashboard Layout & Routing](../../design/local.dashboard-layout-routing.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 5
**Status**: Not Started

---

## Objective

Build the dashboard home page showing project metadata, milestone summary, next steps, and blockers. This is the first page users see and provides an at-a-glance overview of the entire project's progress.

---

## Context

The overview page replaces the raw JSON dump from Milestone 1 with a structured, scannable dashboard. It surfaces the most important information — overall status, milestone progress, upcoming work, and blockers — in a card-based layout. This page uses the StatusBadge and ProgressBar components from Task 5 and pulls data from the progress.yaml pipeline established in Milestone 1.

---

## Steps

### 1. Update `app/routes/index.tsx`

Replace the placeholder content with structured overview components. Wire up the route's `beforeLoad` or `loader` to fetch parsed progress data via the server function from Milestone 1.

```typescript
export const Route = createFileRoute("/")({
  loader: async () => {
    const data = await getProgressData();
    return { data };
  },
  component: OverviewPage,
});
```

### 2. Create project metadata card

Display at the top of the overview page:

- Project name (large heading)
- Version number
- StatusBadge showing overall project status
- Start date (formatted)
- Description text

Style with the card pattern: `bg-gray-900/50 border border-gray-800 rounded-xl p-4`.

### 3. Create overall progress section

Below the metadata card, show:

- A large ProgressBar (md size) showing overall completion percentage
- Computed from milestone task completion across all milestones
- Summary stats: total milestones, completed milestones, total tasks, completed tasks

### 4. Create milestone summary list

Compact rows showing each milestone at a glance:

- Each row: milestone name, StatusBadge, ProgressBar (sm size), task count (e.g., "3/7 tasks")
- Rows are clickable and navigate to `/milestones` (or anchor to the specific milestone)
- Styled as a list within a card container

### 5. Create `app/components/NextSteps.tsx`

Renders the `next_steps` array from progress.yaml as a checklist:

- Each item displayed as a list item with a circle/check icon
- Styled with left border accent (`border-l-2 border-blue-500`)
- If `next_steps` is empty or undefined, render nothing (no empty state needed)

### 6. Create `app/components/BlockersDisplay.tsx`

Renders `current_blockers` with warning styling:

- Only renders when blockers array is non-empty
- Each blocker shown with a warning icon (AlertTriangle from lucide-react)
- Styled with warning colors: `bg-red-500/10 border border-red-500/20 text-red-400`
- If no blockers, component returns null (renders nothing)

### 7. Apply card layout styling

Arrange all sections in a responsive grid/stack layout:

- Metadata card spans full width at top
- Progress section below metadata
- Milestone summary and next steps side by side (or stacked on narrow viewports)
- Blockers at the bottom (when present)
- Consistent spacing: `space-y-6` between sections
- All cards use: `bg-gray-900/50 border border-gray-800 rounded-xl p-4`

---

## Verification

- [ ] Overview page shows project name, version, status badge, start date, and description
- [ ] Overall progress bar displays correct completion percentage
- [ ] Milestone summary lists all milestones with name, status, progress, and task count
- [ ] NextSteps component renders next_steps items as a checklist
- [ ] BlockersDisplay shows blockers with warning styling when blockers exist
- [ ] BlockersDisplay renders nothing when there are no blockers
- [ ] Empty states handled gracefully (no milestones, no next steps)
- [ ] Card styling is consistent across all sections
- [ ] Data loads via SSR (page renders with data on first paint, no loading spinner)

---

## Expected Output

**File Structure**:
```
app/
├── components/
│   ├── BlockersDisplay.tsx (new)
│   └── NextSteps.tsx (new)
├── routes/
│   └── index.tsx (updated)
```

**Key Files Created/Modified**:
- `app/routes/index.tsx`: Updated with structured overview layout and data loader
- `app/components/NextSteps.tsx`: Checklist component for next_steps array
- `app/components/BlockersDisplay.tsx`: Warning display for current_blockers array

---

## Notes

- The overview page is the default route (`/`) and the first thing users see
- Progress percentage is computed client-side from the milestone/task data, not stored in progress.yaml
- The milestone summary rows on this page are a compact version; the full milestone view is in Task 7
- StatusBadge and ProgressBar components come from Task 5

---

**Next Task**: [Task 7: Implement Milestone Table View](./task-7-implement-milestone-table-view.md)
**Related Design Docs**: [Dashboard Layout & Routing](../../design/local.dashboard-layout-routing.md)
**Estimated Completion Date**: TBD
