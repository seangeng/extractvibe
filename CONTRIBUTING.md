# Contributing to ExtractVibe

Thanks for your interest in contributing! This guide will get you up and running.

## Development Setup

1. Clone the repo
2. `npm install`
3. Copy `wrangler.example.jsonc` to `wrangler.jsonc` and fill in your Cloudflare resource IDs
4. Copy `.dev.vars.example` to `.dev.vars` and fill in secrets
5. Create D1 database: `npx wrangler d1 create extractvibe-db`
6. Create KV namespace: `npx wrangler kv namespace create CACHE`
7. Create R2 bucket: `npx wrangler r2 bucket create extractvibe-assets`
8. Run migration: `npx wrangler d1 execute extractvibe-db --local --file=server/db/migrations/0001_initial.sql`
9. `npm run dev` — starts at http://localhost:5173

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

## How to Add a New Export Format

1. Add a new function to `server/lib/export-formats.ts`
2. Add the format case to the export endpoint in `server/api/index.ts`
3. Add the format option to the export dropdown in `app/routes/dashboard.brand.$jobId.tsx`

## Pull Request Process

- Fork the repo and create a feature branch
- Keep PRs focused — one feature or fix per PR
- Include a brief description of what and why
- Make sure `npm run build` passes

## Code Style

- TypeScript strict mode
- No `any` types (use `unknown` + type guards)
- Prefer raw D1 queries over ORM
- Handle null/undefined gracefully (brand data is wildly inconsistent)
