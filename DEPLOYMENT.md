# Deployment Guide — Songtai Partners Platform

This monorepo contains two deployable artifacts:

| Artifact | Directory | Purpose |
|---|---|---|
| **API Server** | `artifacts/api-server` | Express REST API (Node.js) |
| **Partner Site** | `artifacts/songtai-partners` | React/Vite SPA |

Deploy them as **two separate Vercel projects** (or use Railway/Render for the API). The frontend calls the API server by its deployed URL.

---

## 1. Deploy the API Server

### Option A — Vercel (recommended)

1. In the [Vercel dashboard](https://vercel.com), click **Add New Project**.
2. Import this repository and set the **Root Directory** to `artifacts/api-server`.
3. Vercel will detect the `vercel.json` automatically. No framework preset needed.
4. Under **Environment Variables**, add:

   | Variable | Value | Notes |
   |---|---|---|
   | `SUPABASE_DATABASE_URL` | `postgres://...` | Your Supabase connection string (pooler port 6543) |
   | `SESSION_SECRET` | `<random 64-char string>` | JWT signing key — keep secret, never share |
   | `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | `...` | Object storage bucket ID |
   | `PRIVATE_OBJECT_DIR` | `...` | Object storage private directory |
   | `PUBLIC_OBJECT_SEARCH_PATHS` | `...` | Object storage search paths |

5. Click **Deploy**. Your API will be live at `https://your-api-name.vercel.app`.

### Option B — Railway / Render (better for persistent connections)

Because the API uses a PostgreSQL connection pool (not serverless-friendly), Railway or Render are better choices for production.

**Railway:**
```bash
railway init
railway link  # link to your Railway project
railway up    # deploy from artifacts/api-server
```

Set the same environment variables in the Railway dashboard.

**Render (render.yaml):**
```yaml
services:
  - type: web
    name: songtai-api
    rootDir: artifacts/api-server
    buildCommand: pnpm install && pnpm run build
    startCommand: pnpm run start
    envVars:
      - key: SUPABASE_DATABASE_URL
        sync: false
      - key: SESSION_SECRET
        generateValue: true
```

---

## 2. Deploy the Partner Site (Frontend)

1. In the Vercel dashboard, click **Add New Project** again.
2. Import the same repository, set **Root Directory** to `artifacts/songtai-partners`.
3. Vercel will use the `vercel.json` config automatically.
4. Under **Environment Variables**, add:

   | Variable | Value | Notes |
   |---|---|---|
   | `VITE_API_URL` | `https://your-api-name.vercel.app` | The deployed API server URL (no trailing slash) |
   | `VITE_APP_HOSTNAMES` | `your-frontend.vercel.app,yourdomain.com` | Comma-separated list of known app hostnames (not partner custom domains) |

5. Click **Deploy**.

> **Why `VITE_API_URL`?**  
> During dev, Vite proxies `/api` to `localhost:8080`. In production, the API is on a different domain. Setting `VITE_API_URL` makes all API client requests use the absolute URL instead.

---

## 3. Database Migration

After deploying, run the schema migration **once** to create all tables and the default admin account:

```bash
# From the monorepo root — requires SUPABASE_DATABASE_URL to be set locally
pnpm --filter @workspace/scripts run migrate-schema
```

This is **idempotent** (safe to re-run). It creates tables if missing and seeds the default admin only if no admins exist yet.

---

## 4. Admin Access

After migration, log in at `/admin/login` with:

| Field | Value |
|---|---|
| Email | `admin@songtailife.com` |
| Password | `SongtaiAdmin2024!` |

> ⚠️ **Change this password immediately after first login** (see Admin → Profile or directly in the database).

To add more admins or change passwords directly in the database:

```sql
-- Add a new admin (replace the hash with output of bcrypt.hashSync('yourpassword', 12))
INSERT INTO admins (email, password_hash, name)
VALUES ('newadmin@example.com', '$2b$12$...', 'Admin Name');

-- Deactivate an admin
UPDATE admins SET is_active = false WHERE email = 'old@example.com';
```

---

## 5. Environment Variables Summary

### API Server

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_DATABASE_URL` | ✅ | PostgreSQL connection string (pooler port 6543 for Supabase) |
| `SESSION_SECRET` | ✅ | JWT signing secret (min 32 chars, random) |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | For uploads | GCS bucket ID for object storage |
| `PRIVATE_OBJECT_DIR` | For uploads | Private directory in the bucket |
| `PUBLIC_OBJECT_SEARCH_PATHS` | For uploads | Public search paths |
| `PORT` | Auto-set | Server port (Vercel/Railway set this automatically) |

### Partner Site (Frontend)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ (prod) | Absolute URL of the deployed API server |
| `VITE_APP_HOSTNAMES` | Optional | Comma-separated list of hostnames that serve the main app (not partner custom domains) |

---

## 6. Custom Domains for Partners

Each partner can have their own domain (e.g. `coachnelson.site`) pointing to the same frontend deployment. The app detects unknown hostnames, looks up the partner via `GET /api/partners/by-domain?hostname=…`, and renders their site at the root URL — no `/p/:slug` needed.

**Setup:**
1. Partner points their domain's A record to Vercel's IPs (or CNAME to Vercel).
2. Add the custom domain in Vercel for the frontend project.
3. In the admin panel, edit the partner and set their Custom Domain + mark as Verified.

---

## 7. CORS

The API currently allows all origins (`cors()` with no restrictions). For production, restrict it to your frontend domain by setting an `ALLOWED_ORIGIN` env var and updating `artifacts/api-server/src/app.ts`:

```typescript
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN ?? '*',
  credentials: true,
}));
```
