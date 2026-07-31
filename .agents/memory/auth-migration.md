---
name: Auth migration — Supabase → custom JWT
description: Replaced Supabase Auth with local DB JWT auth using SESSION_SECRET; how it works and what changed.
---

# Auth Migration: Supabase → Custom JWT

## The rule
This app no longer uses Supabase Auth or `@supabase/supabase-js` anywhere. Admin authentication is handled entirely by the API server using JWTs signed with `SESSION_SECRET`.

**Why:** Supabase Auth required SUPABASE_URL + SUPABASE_ANON_KEY env vars that weren't available. The user wanted to use an admin account stored in the local DB.

## How it works
1. `POST /api/auth/login` — verifies email + bcrypt password against `admins` table, returns a signed JWT (7-day expiry)
2. `GET /api/auth/me` — verifies token, returns admin info
3. `requireAuth.ts` — verifies Bearer JWT using `jwt.verify(token, SESSION_SECRET)`
4. Frontend `src/lib/auth.tsx` — stores token in `localStorage` under `songtai_admin_token`; `getAdminToken()` exported for API/upload hooks
5. `src/main.tsx` — calls `setAuthTokenGetter(getToken)` and `setUploadAuthTokenGetter(getToken)` using `getAdminToken()`

## Default admin (seeded by migration)
- Email: `admin@songtailife.com`
- Password: `SongtaiAdmin2024!`
- Change after first login!

## How to apply
- Never re-add `@supabase/supabase-js` to either `artifacts/api-server` or `artifacts/songtai-partners`
- `src/lib/supabase.ts` is now an empty stub (`export {}`) — keep it that way
- New admins: INSERT directly into `admins` table with `bcrypt.hashSync(password, 12)` hash
- JWT secret = `SESSION_SECRET` env var (required in all environments)

## Files changed
- `lib/db/src/schema/admins.ts` — new table
- `lib/db/src/schema/index.ts` — exports admins
- `scripts/src/migrate-schema.ts` — creates table + seeds default admin
- `artifacts/api-server/src/routes/auth.ts` — login + me endpoints
- `artifacts/api-server/src/routes/index.ts` — mounts auth router
- `artifacts/api-server/src/middleware/requireAuth.ts` — JWT verification
- `artifacts/api-server/src/app.ts` — POST /auth/login is public; /auth routes bypass requireAuth
- `artifacts/songtai-partners/src/lib/auth.tsx` — fetch-based auth
- `artifacts/songtai-partners/src/lib/supabase.ts` — empty stub
- `artifacts/songtai-partners/src/main.tsx` — uses getAdminToken instead of supabase session
