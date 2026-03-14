# Milestone 2: Dashboard Views & Interaction

**Goal**: Build the complete dashboard UI with sidebar navigation, overview page, table/tree milestone views, search, and filtering
**Duration**: 1.5 weeks
**Dependencies**: M1 - Project Scaffold & Data Pipeline
**Status**: Not Started

---

## Overview

This milestone transforms the raw data pipeline from M1 into a polished admin dashboard. It builds the application shell (sidebar, header, routing), the overview page, two milestone visualization views (table and tree), and the search/filtering system. By the end, users have a fully functional P0 visualizer.

---

## Deliverables

### 1. Application Shell
- Root layout with sidebar navigation and header
- File-based routing for all pages
- Design tokens applied (dark theme, status colors, monospace data)

### 2. Overview Page
- Project metadata card (name, version, status, dates)
- Overall progress bar
- Milestone summary list with progress indicators
- Next steps and current blockers display

### 3. Milestone Views
- Sortable table view with @tanstack/react-table
- Expandable tree view with milestone → task hierarchy
- View toggle (table/tree) with shared filter state
- TaskList component with StatusDot and ExtraFieldsBadge

### 4. Search & Filtering
- Fuse.js search index across milestones, tasks, and extra fields
- Status filter bar (all/in_progress/not_started/completed)
- SearchBar in sidebar
- GlobalSearchContext for cross-component state

---

## Success Criteria

- [ ] Sidebar navigation works across all routes
- [ ] Overview page shows project metadata, progress, and next steps
- [ ] Table view renders milestones with sortable columns
- [ ] Tree view expands to show tasks per milestone
- [ ] Search returns fuzzy-matched results
- [ ] Status filter narrows visible milestones/tasks
- [ ] View toggle preserves filter state
- [ ] All views render via SSR (no loading spinners)

---

## Tasks

1. [Task 5: Build dashboard layout & routing](../tasks/milestone-2-dashboard-views-interaction/task-5-build-dashboard-layout-routing.md) - Root layout, sidebar, header, design tokens
2. [Task 6: Build overview page](../tasks/milestone-2-dashboard-views-interaction/task-6-build-overview-page.md) - Project summary dashboard
3. [Task 7: Implement milestone table view](../tasks/milestone-2-dashboard-views-interaction/task-7-implement-milestone-table-view.md) - @tanstack/react-table with sorting
4. [Task 8: Implement milestone tree view](../tasks/milestone-2-dashboard-views-interaction/task-8-implement-milestone-tree-view.md) - Expandable hierarchy with TaskList
5. [Task 9: Implement search & filtering](../tasks/milestone-2-dashboard-views-interaction/task-9-implement-search-filtering.md) - Fuse.js, GlobalSearchContext, FilterBar
6. [Task 10: Polish & integration testing](../tasks/milestone-2-dashboard-views-interaction/task-10-polish-integration-testing.md) - View toggle, error states, empty states

---

## Testing Requirements

- [ ] Component tests for StatusBadge, ProgressBar, FilterBar
- [ ] Table sorting works correctly
- [ ] Tree expand/collapse toggles
- [ ] Search returns expected results for known queries
- [ ] Filter narrows visible items correctly

---

**Next Milestone**: None (P0 complete)
**Blockers**: None
**Notes**: P1 features (kanban, activity timeline, GitHub remote, multi-project) would follow as M3
