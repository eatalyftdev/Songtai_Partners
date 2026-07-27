# Songtai Life Partners Platform

A multi-tenant partner website platform for Songtai Life — a Cameroonian wellness brand. Each distributor partner gets their own branded version of the site at `/p/[slug]`, showing their personal WhatsApp number and custom hero content, while sharing products, testimonials, FAQ, gallery, and about content from the main brand.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/songtai-partners run dev` — run the partner site frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Environment Variables

### Replit (dev)
Add as a Replit Secret:
- `SUPABASE_DATABASE_URL` — Supabase PostgreSQL connection string (Transaction mode recommended: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true`)

### Vercel (production — frontend)
Set in Vercel project settings → Environment Variables:
- `VITE_API_URL` — Full URL of the deployed API server (e.g. `https://your-api.railway.app/api`). Leave unset if frontend and API are served from the same origin via Vercel rewrites.
- `BASE_PATH` — `/` (root deployment)

### Vercel / Railway / Render (production — API server)
- `SUPABASE_DATABASE_URL` — Same Supabase connection string as above
- `PORT` — Set automatically by the platform; no need to configure
- `NODE_ENV` — `production`

## Stack

- pnpm workspaces, Node.js, TypeScript 5.9
- API: Express 5 (`artifacts/api-server`)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui (`artifacts/songtai-partners`)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Validation: Zod + drizzle-zod
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (partners, products, testimonials, gallery, faq, about)
- `artifacts/api-server/src/routes/` — Express route handlers (partners, products, testimonials, gallery, faq, about)
- `artifacts/songtai-partners/src/` — React frontend
- `lib/api-client-react/src/generated/` — generated React Query hooks (don't edit)
- `lib/api-zod/src/generated/` — generated Zod schemas for server validation (don't edit)

## Pages

- `/` — Landing page: intro, links to demo partner site and admin dashboard
- `/p/:slug` — Partner site: full branded scrollable page for that partner. Shows their WhatsApp number, hero content, products, testimonials, gallery, FAQ, about. Sticky WhatsApp button. EN/FR toggle.
- `/admin` — Admin dashboard: partner stats (total/active/pending/suspended)
- `/admin` → Partners tab — list all partners with status badges, approve/suspend/edit actions
- `/admin/partners/new` — Create new partner form
- `/admin/partners/:id` — Edit partner details and status

## Multi-tenancy model

- Partners are identified by their `slug` field
- URL pattern: `/p/[slug]`
- A partner with `status: "active"` gets a live site; `pending` or `suspended` shows "not available" message
- Creating a new partner in admin immediately makes their site live once approved (no redeploy needed)
- Each partner has their own WhatsApp number that replaces the company number everywhere on their site

## Architecture decisions

- **Soft-delete only**: Partners are suspended (status → suspended), never hard-deleted, to preserve history
- **Single shared database**: All partners, products, and shared content live in one Postgres DB
- **Path-based routing** (`/p/:slug`) rather than subdomain-based (subdomain routing requires DNS wildcards)
- **Bilingual EN/FR**: Language stored in localStorage, toggled in navbar, applied to all content fields

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Recent additions (July 2026)

- **`videoUrl` on products** — DB column + Drizzle schema added; set a YouTube/Vimeo/direct-video URL on any product to have it show in the Videos section on partner sites
- **Videos section** (`PartnerSite.tsx`) — appears when ≥1 active product has a `videoUrl`; products grouped by category; supports YouTube, Vimeo, and direct `.mp4` embeds
- **Partner profile photo** — `profileImageUrl` DB column on partners; shown as circular avatar in the hero section of each partner site; uploaded via admin PartnerEdit page
- **Profile photo upload** — `artifacts/songtai-partners/src/pages/admin/PartnerEdit.tsx` uses `useUpload` hook from `@workspace/object-storage-web`; files stored in Replit App Storage (`DEFAULT_OBJECT_STORAGE_BUCKET_ID` secret); objectPath is saved to `partners.profile_image_url`
- **Storage API** — `POST /api/storage/uploads/request-url` (presigned GCS upload), `GET /api/storage/objects/:path` (serve stored files); see `artifacts/api-server/src/routes/storage.ts`
- **Image URL helper** — `resolveImageUrl()` in PartnerSite and PartnerEdit: prepends `/api/storage` when path starts with `/objects/`, passes through external http URLs unchanged

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run `pnpm --filter @workspace/api-spec run codegen` before writing any routes or frontend code
- The `/p/:slug` route only returns an active partner — status != active returns 404
- `/api/partners/stats` route must come before `/api/partners/:slug` in Express router (already ordered correctly in routes/partners.ts)
- Partners are seeded with slugs: `marie-ngono`, `jean-paul-mbarga` (active), `aminata-diallo` (pending)
