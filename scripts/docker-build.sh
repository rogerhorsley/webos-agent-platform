#!/usr/bin/env bash
# Build Docker images for NexusOS
set -e
cd "$(dirname "$0")/.."

echo "▶ Building agent sandbox image (nexusos-agent:latest)..."
docker build -t nexusos-agent:latest -f Dockerfile.agent .
echo "  ✓ nexusos-agent:latest"

echo "▶ Building API server image (nexusos-api:latest)..."
docker build -t nexusos-api:latest -f Dockerfile .
echo "  ✓ nexusos-api:latest"

echo ""
echo "✅ Docker images ready!"
echo "   Run full stack: docker compose up -d"
echo "   Run only API:   docker run -d -p 3000:3000 --env-file .env nexusos-api:latest"
