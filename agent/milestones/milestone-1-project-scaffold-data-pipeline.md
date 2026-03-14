# Milestone 1: Project Scaffold & Data Pipeline

**Goal**: Set up TanStack Start project with Tailwind and implement the complete data loading pipeline from YAML file to SSR-rendered React components
**Duration**: 1 week
**Dependencies**: None
**Status**: Not Started

---

## Overview

This milestone establishes the project foundation and the entire data flow: reading progress.yaml from disk, parsing it into typed TypeScript structures with agent-drift tolerance, serving it via SSR, and auto-refreshing when the file changes. By the end of this milestone, the app will load and display raw progress data in the browser with live updates.

---

## Deliverables

### 1. TanStack Start Project
- Initialized project with Vite, React, TanStack Start, TanStack Router
- Tailwind CSS configured with custom design tokens (status colors, fonts)
- TypeScript strict mode enabled
- Dev server runs with `npm run dev`

### 2. Data Model & Parser
- TypeScript interfaces for ProgressData, Milestone, Task, WorkEntry
- Lenient YAML parser with agent-drift handling (aliases, fuzzy status, extra fields)
- ProgressDatabaseService wrapping all data access

### 3. Server API & Auto-Refresh
- Server-side data loading via `beforeLoad`
- SSE endpoint for file change notifications
- useAutoRefresh hook for client-side live updates
- Configurable progress.yaml path

---

## Success Criteria

- [ ] `npm run dev` starts the dev server without errors
- [ ] Browser loads and displays parsed progress.yaml data
- [ ] Modifying progress.yaml triggers auto-refresh in browser
- [ ] Parser handles missing fields, unknown properties, and status variants without crashing
- [ ] SSR renders data on first page load (no loading spinner)

---

## Tasks

1. [Task 1: Initialize TanStack Start project](../tasks/milestone-1-project-scaffold-data-pipeline/task-1-initialize-tanstack-start-project.md) - Scaffold project with Vite, Tailwind, routing
2. [Task 2: Implement data model & YAML parser](../tasks/milestone-1-project-scaffold-data-pipeline/task-2-implement-data-model-yaml-parser.md) - Types, parsing, drift handling
3. [Task 3: Build server API & data loading](../tasks/milestone-1-project-scaffold-data-pipeline/task-3-build-server-api-data-loading.md) - ProgressDatabaseService, beforeLoad SSR
4. [Task 4: Add auto-refresh via SSE](../tasks/milestone-1-project-scaffold-data-pipeline/task-4-add-auto-refresh-sse.md) - File watcher, SSE endpoint, useAutoRefresh hook

---

## Testing Requirements

- [ ] YAML parser unit tests with real-world progress.yaml files
- [ ] Drift handling tests (unknown fields, aliases, fuzzy status)
- [ ] Server function returns valid ProgressData
- [ ] Dev server starts and responds

---

**Next Milestone**: [Milestone 2: Dashboard Views & Interaction](milestone-2-dashboard-views-interaction.md)
**Blockers**: None
**Notes**: All subsequent milestones depend on this data pipeline being solid
