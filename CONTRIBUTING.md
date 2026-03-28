# Contributing to ExtractVibe

Thanks for your interest in contributing! This guide will get you up and running.

## Development Setup

1. Fork and clone the repo
2. `npm install --legacy-peer-deps`
3. Copy `wrangler.example.jsonc` to `wrangler.jsonc` and fill in your Cloudflare resource IDs
4. Copy `.dev.vars.example` to `.dev.vars` and fill in secrets
5. Create Cloudflare resources:
   ```bash
   npx wrangler d1 create extractvibe-db
   npx wrangler kv namespace create CACHE
   npx wrangler r2 bucket create extractvibe-assets
   ```
6. Run migration: `npx wrangler d1 execute extractvibe-db --local --file=server/db/migrations/0001_initial.sql`
7. `npm run dev` — starts at http://localhost:5173

### Verify your setup

```bash
npm run build    # should complete without errors
npm run test     # should pass all tests
```

## Project Structure

- `workers/` — Cloudflare Worker entry point (Hono + React Router SSR)
- `server/` — All server-side code (API routes, auth, AI, extraction pipeline)
- `server/lib/extractor/` — The extraction modules (this is where most contributions happen)
- `server/schema/` — Brand kit TypeScript types
- `app/` — React Router v7 frontend (routes, components, styles)

## How to Add a New Extractor

1. Create a new file in `server/lib/extractor/`
2. Export a function that takes the fetch-render output and returns structured data
3. Wire it into the workflow at `server/workflows/extract-brand.ts`
4. Add types to `server/schema/v1.ts` if adding new fields
5. Add tests in `server/__tests__/`

## How to Add a New Export Format

1. Add a new function to `server/lib/export-formats.ts`
2. Add the format case to the export endpoint in `server/api/index.ts`
3. Add the format option to the export dropdown in `app/routes/dashboard.brand.$jobId.tsx`

## Pull Requests

- Fork the repo and create a feature branch from `main`
- Keep PRs focused — one feature or fix per PR
- Include a brief description of what and why
- Make sure these pass before opening:
  ```bash
  npm run build
  npm run test
  ```
- PRs are reviewed within a few days. If yours is stale, ping in the PR.

## Bug Reports

Found a bug? [Open an issue](https://github.com/seangeng/extractvibe/issues/new?template=bug.md) with steps to reproduce.

## Code Style

- TypeScript strict mode — no `any` types (use `unknown` + type guards)
- Prefer raw D1 queries over ORM abstractions
- Handle null/undefined gracefully (brand data is wildly inconsistent across websites)
- No unnecessary comments — code should be self-explanatory
- Run `npm run build` to catch type errors before pushing
