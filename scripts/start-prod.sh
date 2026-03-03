#!/usr/bin/env bash
# Start NexusOS in production via PM2
set -e
cd "$(dirname "$0")/.."

if [ ! -f ".env" ]; then
  echo "⚠  .env not found. Copying .env.example..."
  cp .env.example .env
  echo "   Edit .env and set your ANTHROPIC_API_KEY before continuing."
  exit 1
fi

if [ ! -f "apps/api/dist/index.js" ]; then
  echo "⚠  Production build not found. Running build first..."
  ./scripts/build.sh
fi

# Ensure Redis is running
if ! redis-cli ping &>/dev/null; then
  echo "⚠  Redis not responding. Starting Redis..."
  brew services start redis 2>/dev/null || redis-server --daemonize yes
  sleep 2
fi

echo "▶ Starting NexusOS with PM2..."
pm2 start ecosystem.config.cjs

echo ""
echo "✅ NexusOS is running!"
echo "   API + Frontend: http://localhost:3000"
echo "   PM2 status:     pm2 status"
echo "   PM2 logs:       pm2 logs nexusos-api"
