# @rufieltics/tasks

Local trigger.dev task examples and dev runner

Quick start

1. Ensure DB is running (see repo root `docker-compose.yml`).

2. Create local .env from root `.env.example`.

3. Start local services:

   docker compose up --build

4. Initialize DB (either via `init-db` service or run manually):

   docker compose run --rm init-db

   or from host:

   pnpm --filter @rufieltics/db run migrate:dev --name init
   pnpm --filter @rufieltics/db run generate

5. Run the local task runner (it will create a test user):

   pnpm --filter @rufieltics/tasks run dev

Trigger.dev integration

- The file `src/trigger.ts` contains a `createUserTask` function that uses the Prisma client. When you wire up Trigger.dev Cloud, register this function as a task or action and call it with payload `{ email }`.

Task example (Trigger.dev)

- The repo also exports a Trigger.dev `task` named `createUser` in `src/trigger.ts` which uses the same DB logic. Example usage:

```ts
// using Trigger.dev SDK
import { createUser } from './src/trigger'

// Trigger.dev will call this task and show the returned object in the dashboard
await createUser.run({ email: 'hello@example.com' })
```

Trigger.dev configuration

- A local config file `packages/tasks/trigger.config.ts` is included using the `defineConfig` helper. It uses `process.env.TRIGGER_PROJECT_REF` with a placeholder `"<your-project-ref>"` by default.
  - Start local Trigger.dev dev mode (uses the CLI via npx):
    - `TRIGGER_PROJECT_REF=proj_xxx pnpm --filter @rufieltics/tasks run trigger:dev` (or `pnpm --filter @rufieltics/tasks run trigger:dev` with a config that contains a project value)

  - Validate your configuration:
    - `pnpm --filter @rufieltics/tasks run trigger:validate`

Notes

- This is intentionally minimal so it can be used both as a local test and as a starting point for actual Trigger.dev workflows. If you want, I can add steps to install the Trigger.dev CLI globally or add it as a devDependency (optional).
