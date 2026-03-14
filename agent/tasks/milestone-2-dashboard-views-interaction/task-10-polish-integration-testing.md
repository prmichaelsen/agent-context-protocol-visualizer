# Task 10: Polish & Integration Testing

**Milestone**: [M2 - Dashboard Views & Interaction](../../milestones/milestone-2-dashboard-views-interaction.md)
**Design Reference**: [Visualizer Requirements](../../design/local.visualizer-requirements.md)
**Estimated Time**: 2 hours
**Dependencies**: Task 9
**Status**: Not Started

---

## Objective

Final polish pass — ensure all views work together, error states are handled, empty states are graceful, and the full data flow works end-to-end. This task validates that all M2 features are functional and ready for use.

---

## Context

Tasks 5–9 build individual features (layout, overview, table, tree, search/filter) in isolation. This task validates they work together as a cohesive application. It focuses on integration testing, edge cases, error handling, and visual polish. Real-world progress.yaml files can be large (1800+ lines) and may contain unexpected data shapes, so testing with real data is critical. This is the final task in Milestone 2 and should result in a fully functional dashboard.

---

## Steps

### 1. Test full data flow end-to-end

Verify the complete data pipeline works across all views:

- `progress.yaml` file is read from configured path
- YAML is parsed into typed ProgressData
- Data is served via SSR (server function → route loader)
- Overview page renders project metadata, milestones, next steps, blockers
- Milestones page renders table view with all milestones and tasks
- Milestones page renders tree view when toggled
- Search page finds and displays matching results
- Auto-refresh updates all views when progress.yaml changes

### 2. Verify error states

Test error handling for common failure scenarios:

- **File not found**: When `PROGRESS_YAML_PATH` points to a non-existent file, display a configuration prompt explaining how to set the path
- **Parse error**: When progress.yaml contains invalid YAML, display a helpful error message showing the parse error details
- **Missing fields**: When progress.yaml is valid but missing expected fields, degrade gracefully (show available data, skip missing sections)

### 3. Verify empty states

Test empty data scenarios:

- **No milestones**: Overview and milestones pages show "No milestones found" message
- **No tasks in milestone**: Expanded milestone row shows "No tasks" message
- **No search results**: Search page shows "No results found for '{query}'" message
- **No blockers**: BlockersDisplay renders nothing (no empty card)
- **No next steps**: NextSteps renders nothing (no empty card)

### 4. Verify auto-refresh across all views

- File watcher detects changes to progress.yaml
- All currently visible views update with new data
- Expanded state in table/tree views is preserved after refresh
- Search/filter state is preserved after refresh
- No flicker or layout shift during refresh

### 5. Test with real progress.yaml data

Load a real-world progress.yaml file (e.g., from ACP core project, 1800+ lines):

- Verify all milestones and tasks render without errors
- Verify performance is acceptable (no lag when scrolling, sorting, searching)
- Verify ExtraFieldsBadge shows correct counts for tasks with custom fields
- Verify long text (names, notes) truncates gracefully
- Verify large numbers of tasks don't break layout

### 6. Fix styling inconsistencies

Review all views for visual polish:

- Consistent spacing between sections (space-y-6)
- Consistent card styling (bg-gray-900/50, border-gray-800, rounded-xl)
- Consistent text hierarchy (headings, subheadings, body, captions)
- Hover states on interactive elements (nav links, table rows, buttons)
- Focus states for keyboard navigation (search input, filter buttons)
- No orphaned borders, extra padding, or alignment issues

### 7. Verify route navigation

Test all navigation paths:

- Sidebar links navigate to correct pages
- Browser back/forward navigation works
- Direct URL access works (e.g., navigating directly to `/milestones`)
- Active nav item in sidebar matches current route
- No 404 or blank pages for any defined route

### 8. Test edge cases

Verify the app handles unusual data shapes:

- Single milestone with no tasks
- Single task with no notes
- Milestone with many tasks (20+)
- Task with many extra fields (10+)
- Very long milestone/task names (100+ characters)
- Special characters in names and notes (quotes, angle brackets, unicode)
- Status values beyond the standard set (should render as gray/unknown)

---

## Verification

- [ ] All P0 features from requirements are functional (overview, table, tree, search, filter)
- [ ] No console errors or warnings in browser developer tools
- [ ] All views render correctly with real progress.yaml data (1800+ lines)
- [ ] Error state: file-not-found shows configuration prompt
- [ ] Error state: parse error shows helpful message with details
- [ ] Empty state: no milestones shows appropriate message
- [ ] Empty state: no search results shows appropriate message
- [ ] Auto-refresh works across overview, table, tree, and search views
- [ ] Search finds milestones and tasks by name with fuzzy matching
- [ ] Status filter narrows results correctly
- [ ] All sidebar navigation links work correctly
- [ ] Browser back/forward navigation works
- [ ] No styling inconsistencies or visual bugs
- [ ] Edge cases handled: long text, special characters, missing fields, many items

---

## Expected Output

**Key Files Modified**:
- Bug fixes and polish across existing files created in Tasks 5–9
- No major new files expected — this is a testing and polish task

**Potential files touched**:
- `app/routes/__root.tsx` — error boundary, layout adjustments
- `app/routes/index.tsx` — empty state handling
- `app/routes/milestones.tsx` — error/empty states
- `app/routes/search.tsx` — empty state messaging
- `app/components/*.tsx` — styling fixes, edge case handling
- `app/lib/*.ts` — search/filter edge case fixes

---

## Notes

- This is a testing and polish task, not a feature-building task — the goal is quality, not new functionality
- Keep a list of issues found and fixed for the commit message
- If any P0 feature is broken or missing, fix it before marking this task complete
- Performance testing with large files is important — if search or rendering is slow, optimize before closing
- This task marks the end of Milestone 2; after completion, the dashboard should be fully usable for viewing progress.yaml data

---

**Next Task**: Milestone 3 tasks (TBD)
**Related Design Docs**: [Visualizer Requirements](../../design/local.visualizer-requirements.md)
**Estimated Completion Date**: TBD
