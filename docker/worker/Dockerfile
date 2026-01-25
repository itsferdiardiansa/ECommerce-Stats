FROM node:24

WORKDIR /usr/src/app

RUN corepack enable && pnpm install -g pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --prefer-offline --no-optional || true

COPY . .

CMD ["sh", "-c", "pnpm --filter @rufieltics/tasks dev"]
