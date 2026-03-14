# Task 1: Initialize TanStack Start Project

**Milestone**: [M1 - Project Scaffold & Data Pipeline](../../milestones/milestone-1-project-scaffold-data-pipeline.md)
**Design Reference**: [Dashboard Layout & Routing](../../design/local.dashboard-layout-routing.md)
**Estimated Time**: 2 hours
**Dependencies**: None
**Status**: Not Started

---

## Objective

Scaffold a TanStack Start project with Vite, React, TanStack Router, and Tailwind CSS. Configure design tokens for the admin dashboard theme. This establishes the foundational build toolchain and styling system that all subsequent tasks build upon.

---

## Context

The ACP Progress Visualizer is a TanStack Start application that renders progress.yaml data as an interactive admin dashboard. This first task creates the project skeleton with all P0 dependencies installed and Tailwind configured with the project's design token palette (status colors, typography, dark theme). Without this foundation, no UI or data pipeline work can proceed.

---

## Steps

### 1. Scaffold the TanStack Start project

Run the TanStack Start scaffolding tool or manually initialize the project structure:

```bash
npm create @tanstack/start@latest
```

If scaffolding manually, create a `package.json` with the project name and set `"type": "module"`.

### 2. Install dependencies

Install all P0 dependencies required for the visualizer:

```bash
npm install @tanstack/react-router @tanstack/react-start @tanstack/react-table react react-dom
npm install tailwindcss postcss autoprefixer lucide-react js-yaml fuse.js
npm install -D @types/react @types/react-dom @types/js-yaml typescript vite
```

### 3. Configure Tailwind with custom design tokens

Initialize Tailwind and configure the theme in `tailwind.config.ts`:

```bash
npx tailwindcss init -p --ts
```

Add custom design tokens to the Tailwind config:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        status: {
          completed: "#22c55e",   // green-500
          in_progress: "#3b82f6", // blue-500
          not_started: "#6b7280", // gray-500
          blocked: "#ef4444",     // red-500
          skipped: "#a855f7",     // purple-500
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### 4. Create the root layout

Create `app/routes/__root.tsx` with a minimal root layout that includes the dark theme class and global styles:

```typescript
// app/routes/__root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="dark min-h-screen bg-gray-950 text-gray-100">
      <Outlet />
    </div>
  );
}
```

### 5. Create the index route

Create `app/routes/index.tsx` with placeholder content to verify the app renders:

```typescript
// app/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold font-sans">
        ACP Progress Visualizer
      </h1>
      <p className="mt-2 text-gray-400 font-mono text-sm">
        Dashboard loading...
      </p>
    </div>
  );
}
```

### 6. Create TanStack Start configuration

Create `app.config.ts` for TanStack Start:

```typescript
// app.config.ts
import { defineConfig } from "@tanstack/react-start/config";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  vite: {
    plugins: [viteTsConfigPaths()],
  },
});
```

### 7. Verify dev server starts

Run the development server and confirm the app loads without errors:

```bash
npm run dev
```

Open the browser to the local dev URL and verify the placeholder content renders with correct fonts and dark theme styling.

---

## Verification

- [ ] `package.json` exists with all P0 dependencies listed
- [ ] `tailwind.config.ts` exists and contains status color tokens (completed, in_progress, not_started, blocked, skipped)
- [ ] `tailwind.config.ts` specifies Inter for sans and JetBrains Mono for mono font families
- [ ] `app/routes/__root.tsx` exists with dark theme wrapper and `<Outlet />`
- [ ] `app/routes/index.tsx` exists with placeholder content
- [ ] `app.config.ts` exists with TanStack Start configuration
- [ ] `npm run dev` starts without errors
- [ ] Root route renders in the browser with dark background and light text

---

## Expected Output

**File Structure**:
```
project-root/
├── app/
│   ├── routes/
│   │   ├── __root.tsx
│   │   └── index.tsx
│   └── styles/
│       └── globals.css
├── app.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── package.json
└── package-lock.json
```

**Key Files Created**:
- `package.json`: Project manifest with all P0 dependencies
- `tailwind.config.ts`: Tailwind configuration with status colors and typography tokens
- `app/routes/__root.tsx`: Root layout with dark theme wrapper
- `app/routes/index.tsx`: Index route with placeholder content
- `app.config.ts`: TanStack Start build configuration

---

## Notes

- Dark theme is the default and only theme for this project; no light mode toggle is planned
- The `lucide-react` icon library is installed now but used in later tasks for sidebar and status icons
- `fuse.js` and `@tanstack/react-table` are installed now to avoid dependency churn in later milestones
- If `npm create @tanstack/start@latest` output differs from expected, adjust file locations to match the scaffolding output

---

**Next Task**: [Task 2: Implement Data Model & YAML Parser](./task-2-implement-data-model-yaml-parser.md)
**Related Design Docs**: [Dashboard Layout & Routing](../../design/local.dashboard-layout-routing.md)
**Estimated Completion Date**: TBD
