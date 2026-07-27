# Build Prompt — Confirm Live PostgreSQL Connection + Verify Seeded Partner Data (Replit Partners Platform)

This prompt is for the **Songtai Life Partners Platform** in this Replit project only.
It is NOT for the main Songtai Life Supabase site.

---

## Stack reference

| Layer | Tech |
|---|---|
| Database | Replit-managed PostgreSQL, accessed via `DATABASE_URL` environment secret |
| ORM | Drizzle ORM — `lib/db/` |
| API server | Express 5 — `artifacts/api-server/` |
| Frontend | React + Vite — `artifacts/songtai-partners/` |
| Generated hooks | Orval → `@workspace/api-client-react` |

---

## 1. Confirm the live database connection is real

The `DATABASE_URL` secret is managed by Replit and injected at runtime. There is no `.env` file to check and no credentials to manually configure — the connection is already wired.

**Verify the connection is actually live:**

```bash
curl -s http://localhost:8080/api/healthz
# Expected: {"status":"ok"}

curl -s http://localhost:8080/api/products
# Expected: JSON array of 5 products (not an empty array, not a 404, not a 500)

curl -s http://localhost:8080/api/partners/stats
# Expected: {"total":N,"active":N,"pending":N,"suspended":N}
```

If any of these return an error, check workflow logs for the API server — the most common cause is a Drizzle connection failure on startup.

---

## 2. Audit: does the API ever silently fall back to mock data?

### Rule

Every API route must:
- Return real data from the PostgreSQL database when the connection is healthy.
- Return an explicit HTTP 500 (with `{ "error": "..." }`) when a database query throws — never silently return empty arrays or fake data to mask a connection error.
- Never have a hardcoded fallback data array that is served instead of querying the database.

### Files to audit

Check each route file in `artifacts/api-server/src/routes/` against this rule:

| Route file | What to verify |
|---|---|
| `health.ts` | Returns `{"status":"ok"}` only — no DB query here, this is correct |
| `partners.ts` | `GET /partners`, `GET /partners/stats`, `GET /partners/:slug` — confirm every handler has a `try/catch` that returns 500 on DB error, and no hardcoded fallback array |
| `products.ts` | `GET /products` — confirm `isActive: true` filter is applied, catch returns 500, no fallback data |
| `testimonials.ts` | Same — no fallback |
| `gallery.ts` | Same — no fallback |
| `faq.ts` | Same — no fallback |
| `about.ts` | `GET /about` — returns `null` (204 or empty object) when the table is empty, not a hardcoded story |

For each: grep for any literal string arrays, hardcoded objects that look like seed data, or `catch` blocks that return `[]` or `{}` instead of a 500.

### Frontend fallback audit

The frontend (`artifacts/songtai-partners/src/`) uses React Query hooks. Check:

- `PartnerSite.tsx` — the `isError` branch for partner slug lookup shows "Page Not Available", not a fake partner. **Confirmed correct** (fixed in earlier session with `retry: false`).
- Products grid — `products?.filter(p => p.isActive).map(...)` — if the query errors, React Query holds `data` as `undefined`, so the grid renders nothing (no fallback data). Confirm there is no hardcoded `FALLBACK` products array anywhere in `PartnerSite.tsx` or any imported component.
- Admin dashboard — stats cards show `stats?.total || 0` — if the API errors, `isError` renders a red "Failed to load statistics." message. No fake numbers.

Produce a written list of every fallback/hardcoded data path found and whether its trigger is correct.

---

## 3. Verify the seeded partner data end-to-end

The following partners are seeded in the live database:

| slug | status | whatsappNumber |
|---|---|---|
| `marie-ngono` | active | 237691234567 |
| `jean-paul-mbarga` | active | 237677654321 |
| `aminata-diallo` | pending | 237655112233 |

**Step-by-step verification:**

### 3a — Confirm all three appear in the admin list

```bash
curl -s http://localhost:8080/api/partners | node -e "
const p = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
p.forEach(x => console.log(x.slug, x.status, x.whatsappNumber || x.pendingContactPhone));
"
```

Expected: all three rows printed with correct status and phone.

### 3b — Confirm active partners are publicly accessible, pending are not

```bash
curl -s -o /dev/null -w "marie-ngono: %{http_code}\n" http://localhost:8080/api/partners/marie-ngono
curl -s -o /dev/null -w "jean-paul-mbarga: %{http_code}\n" http://localhost:8080/api/partners/jean-paul-mbarga
curl -s -o /dev/null -w "aminata-diallo: %{http_code}\n" http://localhost:8080/api/partners/aminata-diallo
```

Expected: 200, 200, 404.

### 3c — Confirm shared content exists and is bilingual

```bash
curl -s http://localhost:8080/api/products | node -e "
const p = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
console.log('Products:', p.length);
p.forEach(x => console.log(' -', x.nameEn, '/', x.nameFr, '|', x.priceXaf, 'FCFA | active:', x.isActive));
"

curl -s http://localhost:8080/api/faq | node -e "
const p = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
console.log('FAQ items:', p.length);
"

curl -s http://localhost:8080/api/about | node -e "
const p = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
console.log('About storyEn:', p.storyEn?.slice(0,60));
console.log('About storyFr:', p.storyFr?.slice(0,60));
"
```

Expected: 5 products (all active, bilingual), 5 FAQ items, about row with EN+FR content.

### 3d — Integration path: simulate the main Songtai Life site creating a new partner

The main Songtai Life site creates partners by calling `POST /api/partners`. Simulate this:

```bash
curl -s -X POST http://localhost:8080/api/partners \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "standalone-test",
    "status": "pending",
    "pendingContactName": "Standalone Test Partner",
    "pendingContactPhone": "+237611111111"
  }'
```

Expected: HTTP 201 with the new partner object.

Then:
1. Confirm it appears in `GET /api/partners` with `status: "pending"`.
2. Confirm `GET /api/partners/standalone-test` returns 404 (pending = not public).
3. Approve it: `PATCH /api/partners/:id/status` with `{"status":"active"}`.
4. Confirm `GET /api/partners/standalone-test` now returns 200 with the partner object.
5. Visit `/p/standalone-test` in the browser — confirm the partner site loads with the default fallback hero (no custom hero was passed).
6. Clean up: suspend the test partner.

### 3e — Integration path: simulate the main site managing a product

```bash
# Create
curl -s -X POST http://localhost:8080/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nameEn": "Integration Test Product",
    "nameFr": "Produit Test Intégration",
    "descriptionEn": "Test only.",
    "descriptionFr": "Test uniquement.",
    "priceXaf": 5000,
    "pvPoints": 10,
    "category": "Test",
    "stock": 1,
    "isActive": true
  }'

# Deactivate (use the id from create response)
curl -s -X PATCH http://localhost:8080/api/products/<id> \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'

# Delete
curl -s -X DELETE http://localhost:8080/api/products/<id>
```

Expected: 201 create, 200 patch, 204 delete. After delete, product gone from `GET /api/products`.

---

## 4. Fail-closed verification

Confirm the API fails explicitly (not silently) when the DB is unavailable. This can be verified by checking the error handling in the route files directly — every `catch` block must call `res.status(500).json({ error: "..." })`, not return an empty response or a fallback dataset.

Check that no route file has a pattern like:
```javascript
catch (err) {
  res.json([]);         // BAD — silent failure
  res.json({});         // BAD — silent failure
  return;               // BAD — sends empty 200
}
```

Each catch must be:
```javascript
catch (err) {
  req.log.error({ err }, "...");
  res.status(500).json({ error: "Internal server error" });
}
```

---

## 5. QA checklist

- [ ] `GET /api/healthz` returns `{"status":"ok"}`
- [ ] `GET /api/products` returns 5 real seeded products from the database
- [ ] All route files audited — no silent fallbacks, no hardcoded data arrays, all catches return 500
- [ ] Frontend audited — no hardcoded FALLBACK arrays in any component
- [ ] Seeded partners confirmed via API: 2 active (200), 1 pending (404)
- [ ] Integration flow verified: create → pending → approve → active → site loads → suspend → 404
- [ ] Integration product flow verified: create → deactivate → delete
- [ ] Any wrong fallback trigger fixed (minimal, scoped fix only)

---

## Report format

```
DB connection:          PASS/FAIL — [note]
Route audit:            PASS/FAIL — [list any wrong fallbacks found]
Frontend audit:         PASS/FAIL — [list any wrong fallbacks found]
Seeded data (3a):       PASS/FAIL — [note]
Public/pending guard (3b): PASS/FAIL — [note]
Shared content (3c):    PASS/FAIL — [note]
Integration: partner (3d): PASS/FAIL — [note]
Integration: product (3e): PASS/FAIL — [note]
Fail-closed (4):        PASS/FAIL — [note]
```
