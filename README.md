# Rufieltics

Rufieltics is an analytics platform for online businesses. It connects the accounts a store already runs on, such as Shopify, Facebook Ads, Google Ads, and Google Analytics, and pulls that data into one place. The idea is to let owners and their teams see how the business is doing without hopping between five different dashboards.

Sales, catalog, ad spend, and traffic all land in the same database, stay fresh in the background, and show up as clear numbers and charts.

## Monorepo layout

This is an NX and pnpm monorepo. Each part keeps its own README with more detail.

- `apps/web` is the Next.js dashboard where people sign in, connect their accounts, and explore their metrics.
- `apps/api` is the NestJS backend that handles accounts, authentication, organizations, and the analytics the dashboard reads.
- `packages/db` is the Prisma data layer shared across the apps.
- `packages/emails` holds the transactional and security emails.
- `packages/tasks` runs the scheduled jobs that sync data from connected providers.

## Tech stack

- Next.js for the dashboard
- NestJS for the API
- PostgreSQL with Prisma
- Redis for sessions, rate limiting, and background queues
- Trigger.dev for scheduled sync jobs
- Docker for local services
- pnpm workspaces on an NX monorepo

## Getting started

Install everything from the repo root.

```bash
pnpm install
```

Copy the example environment file for the API and fill in what you need.

```bash
cp apps/api/.env.example apps/api/.env
```

Bring up the local services (Postgres, Redis, and the mail catcher) with Docker, then start the app you want to work on.

```bash
docker-compose up -d
pnpm --filter @rufieltics/api run start:dev
pnpm --filter @rufieltics/web run dev
```

To run the sync jobs locally:

```bash
pnpm --filter @rufieltics/tasks run dev
```

## Building for production

```bash
pnpm --filter @rufieltics/web run build
```

## Contributing

Contributions are welcome. Fork the repository, make your changes on a branch, and open a pull request.
