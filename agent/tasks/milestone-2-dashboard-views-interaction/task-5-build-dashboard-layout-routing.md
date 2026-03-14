# Task 5: Build Dashboard Layout & Routing

**Milestone**: [M2 - Dashboard Views & Interaction](../../milestones/milestone-2-dashboard-views-interaction.md)
**Design Reference**: [Dashboard Layout & Routing](../../design/local.dashboard-layout-routing.md)
**Estimated Time**: 3 hours
**Dependencies**: Task 4
**Status**: Not Started

---

## Objective

Build the application shell with sidebar navigation, header bar, and file-based routing for all pages. This establishes the persistent layout frame that all dashboard views render within.

---

## Context

With the data pipeline complete from Milestone 1, the app needs a proper navigation shell before individual views can be built. The layout follows a standard admin dashboard pattern: fixed sidebar on the left for navigation, a header bar showing project metadata, and a main content area where route components render via the TanStack Router Outlet. All subsequent M2 tasks depend on this layout being in place.

---

## Steps

### 1. Update `app/routes/__root.tsx` with full layout

Replace the minimal root layout with a flex container that includes the Sidebar component, and a main content area with Header and Outlet:

```typescript
// app/routes/__root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="dark min-h-screen bg-gray-950 text-gray-100 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### 2. Create `app/components/Sidebar.tsx`

Build the sidebar navigation component:

- Fixed width of 14rem (`w-56`)
- Right border (`border-r border-gray-800`)
- Dark background (`bg-gray-950`)
- Nav items: Overview (`/`), Milestones (`/milestones`), Tasks (`/tasks`), Activity (`/activity`)
- Each nav item uses `<Link>` from TanStack Router with active state styling
- SearchTrigger button at the bottom of the sidebar
- Use `lucide-react` icons for each nav item (LayoutDashboard, Flag, CheckSquare, Activity, Search)

### 3. Create `app/components/Header.tsx`

Build the header bar component:

- Displays project name and version from route context or loader data
- Includes a StatusBadge showing overall project status
- Includes a ProgressBar showing overall completion percentage
- Styled with bottom border (`border-b border-gray-800`) and padding

### 4. Create `app/components/StatusBadge.tsx`

Build the color-coded status pill component:

- Accepts a `status` prop: `"completed"` | `"in_progress"` | `"not_started"` | `"blocked"` | `"skipped"`
- Renders as an inline pill with rounded corners (`rounded-full px-2.5 py-0.5 text-xs font-medium`)
- Color mapping:
  - `completed` → green (`bg-green-500/20 text-green-400`)
  - `in_progress` → blue (`bg-blue-500/20 text-blue-400`)
  - `not_started` → gray (`bg-gray-500/20 text-gray-400`)
  - `blocked` → red (`bg-red-500/20 text-red-400`)
  - `skipped` → purple (`bg-purple-500/20 text-purple-400`)

### 5. Create `app/components/ProgressBar.tsx`

Build the horizontal progress bar component:

- Accepts `value` (0–100) and optional `size` (`"sm"` | `"md"`) props
- Horizontal bar with gray-800 background track
- Filled portion uses green-500 at 100%, blue-500 otherwise
- Shows percentage text to the right of the bar
- `sm` size: `h-1.5`, `md` size: `h-2.5`
- Smooth width transition (`transition-all duration-300`)

### 6. Create route placeholder files

Create placeholder route components for pages to be built in subsequent tasks:

- `app/routes/milestones.tsx` — "Milestones" heading with placeholder text
- `app/routes/tasks.tsx` — "Tasks" heading with placeholder text
- `app/routes/search.tsx` — "Search" heading with placeholder text

Each route file should use `createFileRoute` and export a basic component.

### 7. Apply design token styling

Ensure all components follow the design token palette:

- Background: `bg-gray-950`
- Surfaces: `bg-gray-900`
- Borders: `border-gray-800`
- Primary text: `text-gray-100`
- Secondary text: `text-gray-400`
- Font: Inter for sans, JetBrains Mono for mono

---

## Verification

- [ ] Sidebar renders at 14rem width with all nav items (Overview, Milestones, Tasks, Activity)
- [ ] Clicking nav links navigates between routes without full page reload
- [ ] Active nav item is visually highlighted
- [ ] Header displays project name and version
- [ ] StatusBadge renders correct colors for each status value
- [ ] ProgressBar fills proportionally to value and shows percentage
- [ ] ProgressBar is green at 100%, blue otherwise
- [ ] All route placeholders render when navigated to
- [ ] Dark theme styling applied consistently (bg-gray-950, gray-800 borders, gray-100 text)
- [ ] Layout is responsive — main content area fills remaining space

---

## Expected Output

**File Structure**:
```
app/
├── components/
│   ├── Header.tsx
│   ├── ProgressBar.tsx
│   ├── Sidebar.tsx
│   └── StatusBadge.tsx
├── routes/
│   ├── __root.tsx (updated)
│   ├── index.tsx (existing)
│   ├── milestones.tsx (new)
│   ├── tasks.tsx (new)
│   └── search.tsx (new)
```

**Key Files Created/Modified**:
- `app/routes/__root.tsx`: Updated with full layout (Sidebar + Header + Outlet)
- `app/components/Sidebar.tsx`: Navigation sidebar with route links
- `app/components/Header.tsx`: Project info header bar
- `app/components/StatusBadge.tsx`: Reusable color-coded status pill
- `app/components/ProgressBar.tsx`: Reusable horizontal progress bar
- `app/routes/milestones.tsx`: Placeholder milestones page
- `app/routes/tasks.tsx`: Placeholder tasks page
- `app/routes/search.tsx`: Placeholder search page

---

## Notes

- StatusBadge and ProgressBar are foundational components reused across all views in later tasks
- The sidebar width of 14rem is fixed; the main content area uses flex-1 to fill remaining space
- Search trigger in the sidebar will be wired to GlobalSearchContext in Task 9
- Route context for header data will be populated by loader functions added in Task 6

---

**Next Task**: [Task 6: Build Overview Page](./task-6-build-overview-page.md)
**Related Design Docs**: [Dashboard Layout & Routing](../../design/local.dashboard-layout-routing.md)
**Estimated Completion Date**: TBD
