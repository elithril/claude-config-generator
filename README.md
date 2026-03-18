# Claude Code Config Generator

Visual configuration generator for [Claude Code](https://code.claude.com) — generate `CLAUDE.md`, `settings.json`, `.claudeignore`, `.mcp.json`, and `.claude/rules/` files ready to drop into your project.

## Features

- **Step-by-step wizard** with Quick/Advanced modes — answer questions, get config files
- **Direct editor** with CodeMirror — edit config files with syntax highlighting
- **Live preview** — see generated files update in real-time as you configure
- **Full settings.json coverage** — model, permissions, hooks, MCP servers, sandbox, agent teams, and more
- **Vault** — save, restore, and export configurations per project (localStorage)
- **i18n** — French and English with instant language switching
- **ZIP download** — all config files packaged and ready to go
- **Responsive** — works on desktop, tablet, and mobile

## Generated files

| File | Description |
|---|---|
| `CLAUDE.md` | Language, tone, response style, security rules |
| `.claude/settings.json` | Model, permissions (allow/ask/deny), hooks, effort level, sandbox, attribution |
| `.claudeignore` | Files and directories excluded from Claude's context |
| `.mcp.json` | MCP server connections (GitHub, Chrome DevTools, Supabase, Figma, etc.) |
| `.claude/rules/*.md` | Modular rules scoped to specific file paths |

## Tech stack

- **Next.js 16** + React 19 + TypeScript 5
- **Tailwind CSS 4**
- **CodeMirror 6** (via @uiw/react-codemirror)
- **JSZip** + file-saver for ZIP export
- **Vitest** for unit tests

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
├── app/
│   ├── page.tsx          # Home (split dark layout + animated terminal)
│   ├── wizard/           # Step-by-step configuration wizard
│   │   ├── page.tsx      # Wizard main page
│   │   └── steps/        # Sub-components (HooksStep, McpStep, etc.)
│   ├── expert/           # CodeMirror editor for direct editing
│   └── vault/            # Saved configurations (localStorage)
├── components/           # Shared UI components
├── context/              # React contexts (Config, Toast)
├── i18n/                 # Internationalization (FR/EN)
├── lib/                  # Business logic
│   ├── generator.ts      # File generation engine
│   ├── storage.ts        # localStorage vault service
│   ├── download.ts       # ZIP/file download utilities
│   └── defaults.ts       # Default config + preset hooks/MCP/rules
└── types/                # TypeScript type definitions
```

## Tests

```bash
pnpm test        # Run once
pnpm test:watch  # Watch mode
```

## License

MIT
