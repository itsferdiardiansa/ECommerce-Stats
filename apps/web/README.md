# @rufieltics/web

This is the Rufieltics dashboard, a Next.js app. It is where people sign in, connect their Shopify, Facebook Ads, Google Ads, and Google Analytics accounts, and read the numbers that come back. The heavy work happens in the API and the sync jobs, so the web app stays focused on presenting data and handling the account flows.

## Built with

- Next.js on the app router
- Tailwind CSS with a small set of design tokens
- Recharts for the charts
- A local set of UI primitives such as Button, Card, Table, Sidebar, and Tooltip
- Typed data access through the `@rufieltics/db` package and the shared api client

## Getting started

Run these from the repo root so the workspace resolves.

```bash
pnpm install
pnpm --filter @rufieltics/web run dev
```

Other useful scripts:

```bash
pnpm --filter @rufieltics/web run build
pnpm --filter @rufieltics/web run lint
pnpm --filter @rufieltics/web run format
```

The dashboard talks to the API, so start `@rufieltics/api` as well and point `NEXT_PUBLIC_API_URL` at it. Public values live in `.env.local`.

## How the code is organized

```
apps/web/src/
  app/          Next.js routes and layouts, including the auth pages and the dashboard
  features/     Feature areas such as auth and the analytics overview
  components/   Layout pieces and the UI primitives
  lib/          The api client, env access, and small helpers
  config/       Navigation and shared constants
```

A few conventions are worth knowing. Public configuration is read once in `src/config/env.ts` instead of reaching for `process.env` around the codebase. Every call to the API goes through `src/lib/api-client.ts`, and the reads that happen while a page renders on the server live in files like `features/auth/api/auth.server.ts`.

## Contributing

Follow the patterns already in place. Use the `cn` helper for class names, keep new styling in Tailwind utilities, and add tests for components where it makes sense.
