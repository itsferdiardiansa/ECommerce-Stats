# Local dev Docker Compose (Parity with Staging/Prod)

This `docker-compose` starts local services that mirror production behavior for Trigger.dev workers and Prisma:

Services

- postgres (Postgres 15)
- pgbouncer (PgBouncer pooling)
- redis
- worker (bind-mounted repo, runs your Trigger.dev worker in dev mode)
- pgadmin (optional DB admin)

Quickstart

1. Copy env example and edit secrets (local values):

   cp .env.example .env

   # edit .env with credentials you prefer

2. Start services:

   docker compose up --build

3. In another shell, run migrations (from repo root):

   # inside the worker container (recommended):

   docker compose exec worker pnpm --filter @rufieltics/db run migrate:dev --name init

   # or on host if you have pnpm set up:

   pnpm --filter @rufieltics/db run migrate:dev --name init

4. Generate Prisma client (if not run by the worker start):

   docker compose exec worker pnpm --filter @rufieltics/db run generate

5. Start your tasks/worker (if not running automatically):

   docker compose up worker

Notes & Parity Tips

- The worker connects to PgBouncer at `pgbouncer:6432`. The `DATABASE_URL` in the `worker` service points to PgBouncer by default. In production, point `DATABASE_URL` to your pooler (pgbouncer) endpoint.
- Keep env variable names identical across dev/staging/prod (`DATABASE_URL`, `DIRECT_URL`, `SUPABASE_SERVICE_KEY`, `DB_ENV`).
- If you need full Supabase features (auth, storage), use the Supabase CLI (`supabase start`) instead of plain Postgres — it runs in Docker and provides parity.

Cleaning up

- Stop everything with:

  docker compose down -v

Security

- `.env` contains local secrets — do not commit it.

Troubleshooting

- If the worker cannot connect: verify `POSTGRES_*` values in `.env` and that PgBouncer is running on port `6432`.
- Use `docker compose logs worker` to inspect the worker logs.

Support

- If you want, I can also add an optional `docker-compose.override.yml` or GitHub Actions to spin ephemeral stacks for PR tests.
