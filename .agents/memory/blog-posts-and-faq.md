---
name: Blog posts and FAQ seeding
description: How blog_posts table is structured, why the API route needs to be public, and the codegen fix for api-zod ambiguous exports.
---

## Blog posts table
- Drizzle schema in `lib/db/src/schema/blog-posts.ts`
- Column `image` (NOT `image_url`) maps to Drizzle property `imageUrl`
- `status = 'published'` is the filter used by `GET /api/blog-posts`
- Route registered in `artifacts/api-server/src/routes/blog-posts.ts`

## Auth whitelist
- `GET /blog-posts` must be in `PUBLIC_GET_PREFIXES` in `artifacts/api-server/src/app.ts`
- Forgetting this causes `{"error":"Unauthorized"}` responses to the frontend

## Codegen fix (api-zod duplicate exports)
- Orval appends `export * from './generated/api'` and `export * from './generated/types'` to `lib/api-zod/src/index.ts` after every run
- `RequestUploadUrlBody` and `RequestUploadUrlResponse` exist in BOTH generated files → TS2308 ambiguous re-export
- Fix: `lib/api-spec/fix-zod-index.mjs` reads both generated files, writes a selective `export type { … }` index, runs after `orval` in the codegen script
- Codegen script: `orval --config ./orval.config.ts && node ./fix-zod-index.mjs && pnpm -w run typecheck:libs`
- `generated/types` is a DIRECTORY with `index.ts` barrel (not a flat `types.ts` file)

## FAQ seed
- `scripts/src/seed-faq.ts` — 13 items, uses `INSERT … ON CONFLICT (id) DO UPDATE`
- Category UUID → text mapping embedded in the script

## Partner page route
- Route is `/p/:slug` (NOT `/:slug`) — via `wouter` in `App.tsx`
