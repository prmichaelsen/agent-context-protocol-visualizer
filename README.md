# ACP Progress Visualizer

Browser-based read-only dashboard for visualizing ACP progress.yaml data.

> Built with [Agent Context Protocol](https://github.com/prmichaelsen/agent-context-protocol)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Features

- Table and tree views of milestones and tasks
- Status filtering (completed, in-progress, not-started)
- Fuzzy search across milestones, tasks, and activity
- Auto-refresh when progress.yaml changes
- Overall project completion percentage
- Expandable/collapsible task details

## Tech Stack

- [TanStack Start](https://tanstack.com/start) (React)
- [Tailwind CSS](https://tailwindcss.com)
- [@tanstack/react-table](https://tanstack.com/table)
- [fuse.js](https://www.fusejs.io) for search
- [js-yaml](https://github.com/nodeca/js-yaml) for YAML parsing

## Development

This project uses the Agent Context Protocol for development:

- `@acp.init` - Initialize agent context
- `@acp.plan` - Plan milestones and tasks
- `@acp.proceed` - Continue with next task
- `@acp.status` - Check project status

See [AGENT.md](./AGENT.md) for complete ACP documentation.

## Project Structure

```
agent-context-protocol-visualizer/
├── AGENT.md              # ACP methodology
├── agent/                # ACP directory
│   ├── design/          # Design documents
│   ├── milestones/      # Project milestones
│   ├── tasks/           # Task breakdown
│   ├── patterns/        # Architectural patterns
│   └── progress.yaml    # Progress tracking
├── app/                  # TanStack Start application
│   ├── routes/          # Page routes
│   ├── components/      # React components
│   └── lib/             # Utilities
└── server/              # Server-side routes
```

## License

MIT

## Author

Patrick Michaelsen
