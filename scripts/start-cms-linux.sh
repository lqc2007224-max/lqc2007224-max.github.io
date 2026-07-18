#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")/.."
export ASTRO_TELEMETRY_DISABLED="${ASTRO_TELEMETRY_DISABLED:-1}"

if [ -f ".env.production" ]; then
  exec node --env-file=.env.production scripts/serve-static.mjs
fi

exec node scripts/serve-static.mjs
