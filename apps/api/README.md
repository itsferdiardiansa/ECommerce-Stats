# @rufieltics/api

This is the backend for Rufieltics, built with NestJS. It owns the work that has to happen on the server. That means signing people in, managing organizations and their members, holding the connection to each provider account, and serving the analytics that the dashboard reads.

## What lives here

Authentication and account security is the largest part. It covers email and password sign in, email verification, password reset, two factor sign in with authenticator apps and recovery codes, passkeys, Google sign in, and session management. A Cloudflare Turnstile captcha sits in front of the login once an address starts failing attempts. When something looks off, the API sends an email alert and offers a "secure my account" link that locks the account until the owner resets their password.

Organizations and users make up the second part. People belong to organizations, and most data is scoped to whichever organization they are working in.

The rest is the analytics surface. These endpoints read from the shared database and return clean, typed responses that the web app can render directly. User facing messages are available in English and Indonesian.

## Project setup

Install from the repo root so the workspace links resolve.

```bash
pnpm install
```

Copy the example env file and fill in the secrets and connection strings.

```bash
cp .env.example .env
```

## Running it

The API needs Postgres and Redis. The easiest path locally is `docker-compose up -d` from the repo root, then:

```bash
# watch mode for development
pnpm run start:dev

# production
pnpm run start:prod
```

## Tests

```bash
pnpm run test
pnpm run test:cov
```

## Trying the endpoints

A Postman collection for the auth endpoints lives in `postman/`. Import it together with the development environment file and you can exercise registration, login, two factor, OAuth, and the captcha paths without writing any code.
