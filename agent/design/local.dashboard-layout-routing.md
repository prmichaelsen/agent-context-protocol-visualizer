# Dashboard Layout & Routing

**Concept**: Root layout structure, navigation, routing, and visual design system for the admin dashboard
**Created**: 2026-03-14
**Status**: Design Specification

---

## Overview

Defines the application shell — root layout, sidebar navigation, header, routing structure, and the visual design tokens (colors, typography, spacing) that create a cohesive Linear/Vercel-style admin dashboard. This design establishes the container that all view components render within.

---

## Problem Statement

The visualizer needs:
- A persistent navigation structure for switching between views (dashboard, milestones, tasks, search)
- Consistent visual language across all pages
- Information-dense layout optimized for desktop developer use
- Clear visual hierarchy for status indicators (completed/in-progress/not-started)

Without a defined layout system, views would be implemented ad-hoc with inconsistent spacing, typography, and navigation patterns.

---

## Solution

A minimal sidebar + content area layout with:
1. Fixed left sidebar for navigation
2. Content area with page-specific views
3. Shared design tokens via Tailwind CSS configuration
4. TanStack Router file-based routing

---

## Implementation

### Route Structure

```
app/routes/
├── __root.tsx              # Root layout (sidebar + content shell)
├── index.tsx               # Dashboard home (project overview + summary)
├── milestones.tsx           # Milestone views (table/tree toggle)
├── milestones.$id.tsx       # Single milestone detail (tasks list)
├── tasks.tsx                # All tasks view
├── activity.tsx             # Recent work timeline (P1)
└── search.tsx               # Global search results
```

### Root Layout

```tsx
// app/routes/__root.tsx

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header />
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
```

### Sidebar

```tsx
// app/components/Sidebar.tsx

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/milestones', icon: Flag, label: 'Milestones' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/activity', icon: Clock, label: 'Activity' },  // P1
];

function Sidebar() {
  return (
    <nav className="w-56 border-r border-gray-800 bg-gray-950 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <span className="text-sm font-semibold text-gray-300 tracking-wide">
          ACP Visualizer
        </span>
      </div>
      <div className="flex-1 py-2">
        {navItems.map(item => (
          <NavLink key={item.to} {...item} />
        ))}
      </div>
      <div className="p-4 border-t border-gray-800">
        <SearchTrigger />
      </div>
    </nav>
  );
}
```

### Header

Displays current project name, version, status badge, and overall progress:

```tsx
// app/components/Header.tsx

function Header() {
  // Project metadata from route loader
  return (
    <header className="h-14 border-b border-gray-800 flex items-center px-6 gap-4">
      <h1 className="text-sm font-medium text-gray-200">{project.name}</h1>
      <span className="text-xs text-gray-500">v{project.version}</span>
      <StatusBadge status={project.status} />
      <div className="ml-auto">
        <ProgressBar value={progress.overall} size="sm" />
      </div>
    </header>
  );
}
```

### Design Tokens (Tailwind Config)

```typescript
// tailwind.config.ts

export default {
  theme: {
    extend: {
      colors: {
        status: {
          completed: '#22c55e',      // green-500
          in_progress: '#3b82f6',    // blue-500
          not_started: '#6b7280',    // gray-500
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

### Visual Design Rules

| Element | Style |
|---------|-------|
| Background | `gray-950` (near-black) |
| Surface/cards | `gray-900` with `gray-800` borders |
| Primary text | `gray-100` |
| Secondary text | `gray-400` |
| Data values | Monospace font (`font-mono`) |
| Status: completed | Green badge/dot |
| Status: in_progress | Blue badge/dot |
| Status: not_started | Gray badge/dot |
| Interactive hover | `gray-800` background |
| Spacing | 4px grid (Tailwind default) |

### StatusBadge Component

```tsx
// app/components/StatusBadge.tsx

const statusStyles = {
  completed: 'bg-green-500/15 text-green-400 border-green-500/20',
  in_progress: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  not_started: 'bg-gray-500/15 text-gray-500 border-gray-500/20',
};

const statusLabels = {
  completed: 'Completed',
  in_progress: 'In Progress',
  not_started: 'Not Started',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${statusStyles[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
```

### ProgressBar Component

```tsx
// app/components/ProgressBar.tsx

export function ProgressBar({ value, size = 'md' }: { value: number; size?: 'sm' | 'md' }) {
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div className={`w-full bg-gray-800 rounded-full ${height} overflow-hidden`}>
      <div
        className={`${height} rounded-full transition-all duration-300 ${
          value === 100 ? 'bg-green-500' : 'bg-blue-500'
        }`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
```

### Dashboard Home (Overview Page)

The index route shows a single-page summary:
- Project metadata card (name, version, status, dates)
- Overall progress bar
- Milestone summary (compact list with progress bars)
- Next steps list
- Current blockers (if any)

---

## Benefits

- **Consistent**: All pages share the same visual language
- **Information-dense**: Compact layout maximizes data visibility
- **Navigable**: Sidebar provides constant orientation
- **Extensible**: Adding new routes/views follows established patterns

---

## Trade-offs

- **Desktop-only**: Fixed sidebar layout doesn't collapse for mobile (acceptable per requirements)
- **Dark theme only**: No light mode toggle in P0 (future consideration)
- **Minimal branding**: Intentionally plain — data is the focus

---

## Applicable Patterns

| Pattern | How It Applies |
|---------|----------------|
| [`tanstack-cloudflare.unified-header`](../patterns/tanstack-cloudflare.unified-header.md) | Adopt the fixed header + content offset pattern. Use `pt-14` on main content. For view switching (table/tree), use `SubHeaderTabs` rendered as children of the header. Adapt for sidebar layout: the pattern's `max-w-3xl` centering shifts to sidebar + full-width content area, but the fixed positioning, safe-area handling, and tab structure apply directly. |
| [`tanstack-cloudflare.nextjs-to-tanstack-routing`](../patterns/tanstack-cloudflare.nextjs-to-tanstack-routing.md) | Reference for TanStack Router file-based routing conventions: `$id` for dynamic params, `__root.tsx` for layout, `beforeLoad` for data, `meta()` for page metadata. Ensures routes follow established patterns. |
| [`tanstack-cloudflare.card-and-list`](../patterns/tanstack-cloudflare.card-and-list.md) | Adopt consistent card styling for dashboard summary cards: `bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4`. Text hierarchy: title `text-white font-semibold`, secondary `text-gray-400 text-sm`, meta `text-gray-500 text-xs`. |
| [`tanstack-cloudflare.toast-system`](../patterns/tanstack-cloudflare.toast-system.md) | Use for error feedback (YAML parse errors, file-not-found) and auto-refresh status notifications. `useToast()` for direct calls, `StandaloneToastContainer` at z-60 in root layout. |

---

## Dependencies

- Tailwind CSS
- TanStack Router (file-based routing)
- lucide-react for icons (lightweight, tree-shakeable)

---

## Testing Strategy

- **Component tests**: Sidebar renders correct nav items, StatusBadge renders correct colors
- **Visual regression**: Screenshot tests for layout at standard viewport sizes
- **Route tests**: Each route resolves and renders without errors

---

## Migration Path

N/A — greenfield project.

---

## Future Considerations

- **Dark/light mode toggle**: Add theme context and Tailwind dark mode classes
- **Collapsible sidebar**: Icon-only mode for more content space
- **Breadcrumbs**: For nested routes (milestone → task detail)
- **Keyboard navigation**: `Cmd+K` for search, arrow keys for nav

---

**Status**: Design Specification
**Recommendation**: Implement alongside or immediately after server API — provides the shell for all views
**Related Documents**: local.visualizer-requirements.md, tanstack-cloudflare.unified-header, tanstack-cloudflare.nextjs-to-tanstack-routing, tanstack-cloudflare.card-and-list, tanstack-cloudflare.toast-system
