FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

FROM base AS deps
WORKDIR /app
# python3/make/g++ are needed if better-sqlite3 falls back to building
# from source (no prebuild for this platform).
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

FROM base AS builder
WORKDIR /app
# Temporary: force tldraw's license check to think we're in dev so it doesn't
# hide the editor in production. Remove once we have a real tldraw license key.
ARG TLDRAW_FORCE_DEV=true
ENV TLDRAW_FORCE_DEV=$TLDRAW_FORCE_DEV
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run generate-routes
RUN pnpm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/package.json ./package.json

RUN mkdir -p /data
VOLUME ["/data"]
EXPOSE 3000

COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
