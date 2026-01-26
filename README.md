# Rufieltics

Rufieltics is an open-source analytics platform designed to provide comprehensive insights into user behavior and application performance. It offers a suite of tools for tracking, analyzing, and visualizing data to help developers and businesses make informed decisions.

## Tech Stack

- Next.js
- Trigger.dev
- PostgreSQL
- Docker
- PNPM
- NX Monorepo

## Installation

```bash
pnpm install
```

## Development

1. Copy the `.env.example` file to `.env` and fill in the required environment variables.

2. To start the development server, run:

```bash
docker-compose up -d
pnpm --filter @rufieltics/web run dev
```

3. To start Trigger.dev locally, run:

```bash
pnpm --filter @rufieltics/triggerdev run dev
```

## Building for Production

To build the application for production, run:

```bash
pnpm --filter @rufieltics/web run build
```

This will create an optimized production build in the `.next` directory.

## Deploy Trigger.dev

To deploy Trigger.dev, run:

```bash
pnpm --filter @rufieltics/triggerdev run deploy
```

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.
