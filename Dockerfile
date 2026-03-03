# NexusOS API Server — Production Image
# Build: docker build -t nexusos-api:latest .
FROM node:20-slim AS builder

WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY apps/web/ ./apps/web/

RUN npm install -g pnpm@9 && pnpm install --frozen-lockfile
RUN pnpm --filter @webos/core build
RUN pnpm --filter @webos/ui build
RUN pnpm --filter @webos/web build
RUN pnpm --filter @webos/api build

# ── Runtime image ──────────────────────────────────────────────────────────
FROM node:20-slim

# node-pty needs python/make
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ git \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9 @anthropic-ai/claude-code

WORKDIR /app

# Copy only what's needed at runtime
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/ ./packages/
COPY --from=builder /app/apps/api/dist/ ./apps/api/dist/
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/web/dist/ ./apps/web/dist/

RUN pnpm install --prod --frozen-lockfile --filter @webos/api

# Create directories
RUN mkdir -p /app/apps/api/data /app/apps/api/workspaces/shared /app/logs

EXPOSE 3000
ENV NODE_ENV=production

WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
