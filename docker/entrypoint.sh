#!/bin/sh
set -e

: "${DATABASE_URL:=/data/musebar.db}"
export DATABASE_URL

echo "[musebar] applying schema to $DATABASE_URL"
pnpm exec drizzle-kit push

echo "[musebar] starting server on port ${PORT:-3000}"
exec node .output/server/index.mjs
