# @rufieltics/web

E-commerce Analytics Dashboard frontend for Rufieltics — Next.js app built with Tailwind, Recharts, Prisma (server package), and a small design-system of UI primitives.

---

## Quick summary

- Framework: **Next.js** (app router)
- Styling: **Tailwind CSS** + design tokens
- Charts: **Recharts** (client components)
- Tables: lightweight shadcn-style `Table` component located at `src/components/ui/table`
- Date utils: `formatDate` / `formatDateTime` in `src/lib/utils.ts` (used across the UI)

---

## Features

- Dashboard overview with charts, tables and stat cards
- Client-side charts (Pie, Bar) and responsive layout
- Accessible UI primitives (Button, Card, Table, Tooltip, Sidebar, etc.)
- Type-safe access to data via `@rufieltics/db` package
- Dev convenience scripts (lint, format, build, dev)

---

## Getting started

Prerequisites:

- Node 18+ / 20+ recommended
- pnpm (workspaces usage)
- A Postgres database (for backend & migrations; see `packages/db`)

Common commands (run from workspace root):

```bash
# Install dependencies
pnpm install

# Run web dev server
pnpm --filter @rufieltics/web run dev

# Build
pnpm --filter @rufieltics/web run build

# Lint / format
pnpm --filter @rufieltics/web run lint
pnpm --filter @rufieltics/web run format
```

Notes:

- Some features depend on the `@rufieltics/db` package and a configured `DATABASE_URL` environment variable. To run full local stack, also start your DB and run migrations from `packages/db`.

---

## Directory structure 📁

Top-level (shortened):

```
apps/web/
├─ app/                          # Next.js app routes & layout
│  ├─ (dashboard)/
│  │  └─ page.tsx                 # Dashboard page (overview)
│  └─ layout.tsx
├─ components/                    # Design-system + layout components
│  ├─ layout/
│  │  ├─ AppSidebar.tsx
│  │  ├─ Header.tsx
│  │  └─ OrgSwitcher.tsx
│  └─ ui/
│     ├─ table/                   # <- Table: Table.tsx, index.ts
│     ├─ card/
│     ├─ button/
│     ├─ tooltip/
│     ├─ sidebar/
│     └─ ... (many other primitives)
├─ features/                      # Feature pages / components
│  └─ overview/
│     ├─ components/
│     │  ├─ data-lists/
│     │  │  ├─ RecentOrdersList.tsx
│     │  │  └─ TopProductsList.tsx
│     │  ├─ order-status-pie-chart/
│     │  └─ revenue-by-category-chart/
│     └─ ...
├─ services/                      # Client / server services (analytics, api calls)
├─ lib/                           # Utilities: formatters, cn, date helpers
│  └─ utils.ts                    # formatDate, formatDateTime, cn, formatBytes
├─ hooks/                         # Custom hooks (useMediaQuery, useIsMobile)
├─ config/                        # navConfig, constants
└─ package.json
```

> Tip: Use `pnpm --filter @rufieltics/web run dev` from the repo root to run just the web package in dev mode.

---

## Contributing

- Follow the existing style and utility functions (use `cn` for class merging)
- Add unit / integration tests for new components where applicable
- If adding new global styles, prefer Tailwind utilities and keep tokens in the design system
