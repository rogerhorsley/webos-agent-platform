# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

NexusOS is a full-stack AI Web Operating System monorepo (pnpm workspaces + Turborepo) with:
- `apps/web` — React 18 SPA frontend (Vite, port 5173)
- `apps/api` — Fastify backend API (port 3000)
- `packages/core` — Shared Zod types/schemas
- `packages/ui` — Shared UI components

See `README.md` for full architecture, tech stack, and project structure.

### Running the dev environment

Standard commands are in `package.json` at the workspace root:
- `pnpm dev` — starts all four packages in dev/watch mode via Turborepo
- `pnpm build` — builds all packages
- `pnpm typecheck` — TypeScript checks across all packages

### Key caveats

- **Redis must be running** before starting `pnpm dev`. The API uses BullMQ (task queue) which requires Redis on `localhost:6379`. Install with `sudo apt-get install -y redis-server` and start with `redis-server --daemonize yes`.
- **`.env` file required**: Copy `apps/api/.env.example` to `apps/api/.env` and set `ANTHROPIC_API_KEY`. Set `NODE_ENV=development` for dev mode.
- **ESLint has no config**: `pnpm lint` fails because no `.eslintrc` or `eslint.config.*` files exist in the repo. This is a pre-existing issue.
- **`node-pty` native dependency**: Requires `python3`, `make`, `g++` for compilation during `pnpm install`. These are typically pre-installed.
- **SQLite auto-initializes**: The database at `apps/api/data/nexusos.db` is auto-created with schema and seed data on first API startup — no manual migration needed.
- **Vite proxies API calls**: The frontend dev server (port 5173) proxies `/api` and `/socket.io` to the backend (port 3000), so always access the app via `http://localhost:5173`.
- **ANTHROPIC_API_KEY**: If available as an environment variable, it should be written into `apps/api/.env`. The key supports both OpenRouter and Anthropic formats.
