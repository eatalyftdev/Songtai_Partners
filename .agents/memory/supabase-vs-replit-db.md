---
name: Supabase vs Replit DB split
description: executeSql in CodeExecution hits Replit's own PostgreSQL, not Supabase — all real app data lives in Supabase (SUPABASE_DATABASE_URL).
---

# Supabase vs Replit DB split

The app's real data (partners, products, testimonials, etc.) lives in **Supabase** via `SUPABASE_DATABASE_URL`.

The `executeSql` CodeExecution callback connects to **Replit's own built-in PostgreSQL**, which is a completely separate database — not Supabase.

**Why:** The project was imported from GitHub and uses Supabase as its primary database. Replit's `executeSql` doesn't know about Supabase.

**How to apply:**
- To query or mutate real app data, use `node` in the shell with the `pg` module from `lib/db`: `cd /home/runner/workspace/lib/db && node --input-type=module` with `import pg from 'pg'` and `process.env.SUPABASE_DATABASE_URL`.
- Never use `executeSql` for this app's data — it will appear to succeed but write to the wrong database.
- To upload files to Supabase Storage: use `fetch` in a shell script with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` env vars. Method POST to `/storage/v1/object/{bucket}/{key}` with `x-upsert: true`.
