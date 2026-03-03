#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# NexusOS Production Build Script
# Usage: ./scripts/build.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e
cd "$(dirname "$0")/.."

echo "▶ Installing dependencies..."
pnpm install --frozen-lockfile

echo "▶ Building shared packages..."
pnpm --filter @webos/core build
pnpm --filter @webos/ui build

echo "▶ Building frontend..."
pnpm --filter @webos/web build
echo "  ✓ Frontend built → apps/web/dist/"

echo "▶ Building backend..."
pnpm --filter @webos/api build
echo "  ✓ Backend compiled → apps/api/dist/"

echo "▶ Setting up directories..."
mkdir -p apps/api/data apps/api/workspaces/shared logs

echo ""
echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.example to .env and fill in your values"
echo "  2. pm2 start ecosystem.config.cjs"
echo "  3. pm2 save && pm2 startup"
echo ""
echo "Or to test the production build locally:"
echo "  NODE_ENV=production node apps/api/dist/index.js"
