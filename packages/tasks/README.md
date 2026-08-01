# @rufieltics/tasks

This package runs the background jobs that keep Rufieltics up to date. It uses Trigger.dev to schedule syncs that reach out to each connected provider, pull the latest data, and write it into the shared database through the `@rufieltics/db` package.

When someone connects a store or an ad account in the dashboard, these jobs are what actually fetch the orders, products, spend, and traffic on a schedule, so the numbers stay current without anyone pressing refresh.

## What runs here

- Store and provider sync jobs that read from the connected accounts and update the database.
- The schedules that decide how often each sync runs.

The job definitions live in `src/triggers/`.

## Development

Run the jobs locally against your Trigger.dev setup.

```bash
pnpm dev
```

## Deployment

Ship the jobs to production.

```bash
pnpm deploy
```

## Contributing

Contributions are welcome. Open an issue or send a pull request with your changes.
