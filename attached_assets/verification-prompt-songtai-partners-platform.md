# Verification Prompt — Songtai Life Partners Platform (Replit)

This prompt is for verifying the **Songtai Life Partners Platform** in this Replit project.  
It is a standalone multi-tenant React + Express + PostgreSQL app — **not** the main Songtai Life Supabase site.  
Do not rewrite or refactor anything. The job here is to verify the platform behaves correctly end-to-end, then fix only what actually fails.

---

## Stack reference (read before verifying)

| Layer | Tech |
|---|---|
| Frontend | React + Vite + Tailwind CSS + shadcn/ui — `artifacts/songtai-partners/` |
| API server | Express 5 — `artifacts/api-server/` |
| Database | PostgreSQL + Drizzle ORM — `lib/db/` |
| API contract | OpenAPI spec at `lib/api-spec/openapi.yaml` |
| Data hooks | Orval-generated React Query hooks — `@workspace/api-client-react` |
| i18n | `artifacts/songtai-partners/src/lib/i18n.tsx` — `t(en, fr)` helper, `localStorage` key `songtai_lang`, defaults to `'en'`, falls back to English when `fr` is null, undefined, or empty string |
| Routing | wouter — `/p/:slug` for partner sites, `/admin` for admin |
| Realtime | **None.** No WebSockets, no Supabase Realtime. Updates require manual page refresh or React Query cache invalidation via `queryClient.invalidateQueries()` |

---

## Seeded data (already in DB)

- **Partners** (3 total):
  - `marie-ngono` — active, WhatsApp `237691234567`, custom EN/FR hero
  - `jean-paul-mbarga` — active, WhatsApp `237677654321`, custom EN/FR hero
  - `aminata-diallo` — **pending**, no WhatsApp number
- **Products** (5, all active): Toothpaste, Collagen, Detox Tea, Moringa Capsules, Shea Body Butter — with real XAF pricing, bilingual names and descriptions, no imageUrl
- **Testimonials** (3, all active): bilingual `contentEn`/`contentFr`
- **FAQ** (5 items): bilingual, sorted by `sortOrder`
- **About** (1 row): bilingual story/mission/vision

---

## Workflows to confirm are running before starting

```
artifacts/api-server: API Server        → Express on port 8080
artifacts/songtai-partners: web         → Vite dev server
```

Both must show `RUNNING` in the workflow panel. If either is stopped, restart it before proceeding.

---

## Verification checklist

Run each check, then report **PASS / FAIL + one-line note**. Fix only what fails, then re-run the same check.

---

### 1 — API health

```
GET /api/healthz
```

**Confirm:** responds `{ "status": "ok" }` with HTTP 200.  
**Also confirm:** the admin dashboard at `/admin` shows a green `API: ok` badge (top-right of the Dashboard page) — this badge uses the same `useHealthCheck` hook.

---

### 2 — Partner site loads for an active partner

Visit `/p/marie-ngono`.

**Confirm:**
- The hero section shows the seeded `heroTitleEn` ("Your Wellness Journey Starts Here") and `heroSubtitleEn`.
- The "AUTHORIZED INDEPENDENT PARTNER" badge is visible.
- A sticky WhatsApp button is rendered (bottom-right), and its `href` contains `237691234567`.
- The Products, About, Testimonials, FAQ sections all render with content (not blank, not loading spinners stuck).
- No console errors.

---

### 3 — Partner site blocked for a pending/unknown partner

Visit `/p/aminata-diallo` (status = pending) and `/p/does-not-exist`.

**Confirm both show:** the "Page Not Available / Page Non Disponible" message — not a blank page, not a crash, not a 500.

**Why this matters:** `GET /partners/:slug` returns 404 for any non-active partner. The frontend catches `isError` and renders the fallback message. Confirm the API actually returns 404 (check network tab) and the UI handles it gracefully.

---

### 4 — Bilingual toggle: partner hero

On `/p/marie-ngono`, click the `EN | FR` toggle in the navbar to switch to French.

**Confirm:**
- The hero title switches to `heroTitleFr` ("Votre Voyage Bien-Être Commence Ici").
- The hero subtitle switches to the French value.
- The "Shop Products" button becomes "Acheter les Produits".
- The "Contact Me Directly" button becomes "Contactez-moi Directement".
- The badge becomes "PARTENAIRE INDÉPENDANT AGRÉÉ".
- `localStorage.getItem('songtai_lang')` is now `'fr'` (confirm in browser console).
- **Reload the page** and confirm French is still active (language persists via `localStorage`).

---

### 5 — Bilingual toggle: products

Still in French on `/p/marie-ngono`, scroll to the Products section.

**Confirm:**
- Every product name shows its `nameFr` value (e.g. "Dentifrice Songtai", "Collagène Songtai", "Thé Détox Songtai", "Capsules de Moringa Songtai", "Beurre de Karité Songtai").
- Every product description shows its `descriptionFr` value.
- Prices still show in `FCFA` with thousands separators (e.g. "8 500 FCFA") — pricing is language-agnostic.
- The "Order via WhatsApp" button becomes "Commander via WhatsApp".
- The WhatsApp order link's pre-filled message includes the **French product name** (since the `t()` helper is active when the link is built).

Switch back to English and confirm everything reverts correctly.

---

### 6 — Bilingual toggle: About, Testimonials, FAQ sections

In French, scroll through the full partner site.

**Confirm each section:**
- **About**: story, mission, and vision text all show French content.
- **Testimonials**: each card body (`contentFr`) is in French. Author names and roles are language-agnostic — confirm they don't change.
- **FAQ**: every question and answer shows French text. Confirm accordion expand/collapse still works after the language switch.

---

### 7 — French fallback for missing translations

The `t(en, fr)` function returns `en` when `fr` is null, undefined, or an empty string. Verify the fallback behavior:

1. Via the API or admin, update one product's `descriptionFr` to `null` or `""`.
2. On the partner site in French, confirm that product's description shows the **English fallback text** — not a blank, not "null", not an error.
3. Restore the French description.

---

### 8 — Product active/inactive filtering

Products are filtered client-side in `PartnerSite.tsx`: `products?.filter(p => p.isActive)`.

**Confirm:**
- All 5 seeded products (all `isActive: true`) render in the grid.
- Via `PATCH /api/products/:id` (or from the main Songtai Life site), set one product to `isActive: false`. **Reload the partner site** (no realtime — a manual reload is required) and confirm the product has disappeared. The grid should now show 4 products.
- Re-activate the product and reload — confirm it reappears. The grid returns to 5 products.

> **Note on realtime:** This platform has no WebSocket or Supabase Realtime subscription. Changes to products, about, testimonials, FAQ, or gallery require a page reload (or navigating away and back) to be reflected on the partner site. This is expected behavior, not a bug.

---

### 9 — Empty products state

If all products were inactive, `products?.filter(p => p.isActive)` returns an empty array. The JSX renders `{[].map(...)}` which produces nothing — no empty-state UI is defined.

**Confirm the expected behavior:**
- Deactivate all products via the API.
- Reload the partner site. The "Wellness Collection" section heading and description still render, but the grid below it is empty (no cards, no error, no crash).
- Confirm no console errors.
- Restore all products to active.

> **Known limitation:** There is no "no products available" empty-state message in the grid. If this should be added, file it as a separate task — do not add it now unless it was an explicit requirement.

---

### 10 — Admin dashboard statistics accuracy

Visit `/admin`.

**Confirm:**
- Total: **3**, Active: **2**, Pending: **1**, Suspended: **0** — matching the seeded data.
- Suspend `jean-paul-mbarga` from `/admin` → Partners tab (click the amber shield icon). Navigate back to Dashboard. **Reload** (React Query cache). Confirm stats update to: Total 3, Active 1, Pending 1, Suspended 1.
- Re-activate `jean-paul-mbarga`. Confirm stats return to: Active 2, Suspended 0.

> **Note on cache invalidation:** The Partners list uses `queryClient.invalidateQueries({ queryKey: getListPartnersQueryKey() })` after a status change, which refreshes the Partners list immediately. The Dashboard stats (`useGetPartnerStats`) are a separate query — navigating to Dashboard and reloading the page is required to see updated stats unless you also invalidate that query key.

---

### 11 — Admin partner CRUD

Go to `/admin` → Partners.

**Create:**
1. Click "New Partner". Fill in slug `test-verif`, WhatsApp `237600000000`, hero title EN: "Test Partner".
2. Submit. Confirm the new partner appears in the Partners list with status **pending**.
3. Confirm `GET /api/partners/test-verif` returns 404 (pending partners are not public).

**Approve:**
4. Click the green checkmark to activate `test-verif`.
5. Confirm status badge changes to Active.
6. Visit `/p/test-verif` — confirm the partner site loads with the hero title "Test Partner".

**Edit:**
7. Click the edit icon for `test-verif`. Change hero title FR to "Partenaire Test". Save.
8. On `/p/test-verif`, switch to French — confirm hero title is "Partenaire Test".

**Suspend:**
9. Back in admin, suspend `test-verif` (amber shield icon).
10. Confirm `/p/test-verif` now shows "Page Not Available".

**Cleanup:**
11. Hard-delete from the database directly (slug `test-verif`) if you don't want it in the list: `DELETE FROM partners WHERE slug = 'test-verif';` via the DB query tool. Or leave it as suspended — it won't affect any public page.

---

### 12 — WhatsApp order links are partner-specific

On `/p/marie-ngono`, click "Order via WhatsApp" on any product.

**Confirm:**
- The link opens `https://wa.me/237691234567?text=...` — Marie's number.
- The pre-filled message includes the product name in the **currently active language**.

Now visit `/p/jean-paul-mbarga` and do the same.

**Confirm:**
- The link opens `https://wa.me/237677654321?text=...` — Jean-Paul's number.
- **Marie's number never appears on Jean-Paul's page and vice versa.** This is the core multi-tenancy guarantee.

---

### 13 — Integration: main Songtai Life site creates a partner via API

This is the primary integration point. The main Songtai Life site (external) creates new partners by calling `POST /api/partners` on this platform.

**Simulate what the main site does:**

```bash
curl -X POST https://<this-repl-dev-domain>/api/partners \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "integration-test",
    "status": "pending",
    "pendingContactName": "Alice Kom",
    "pendingContactPhone": "237699887766"
  }'
```

**Confirm:**
- Response is HTTP 201 with the new partner object (including `id`, `slug`, `status: "pending"`, `createdAt`).
- The new partner appears in `/admin` → Partners with a Pending badge.
- `GET /api/partners/integration-test` returns 404 (pending).
- Approve it from admin. `GET /api/partners/integration-test` now returns the partner object.
- Visit `/p/integration-test` — confirm the partner site loads with the **default fallback hero** ("Welcome to my Songtai Life boutique" / "Bienvenue dans ma boutique Songtai Life") since no custom hero was passed.
- Clean up: suspend or delete the test partner.

---

### 14 — Integration: main site manages products via API

The main Songtai Life site creates and manages the product catalog by calling this platform's product endpoints. Simulate:

```bash
# Create a product
curl -X POST https://<this-repl-dev-domain>/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "nameEn": "Songtai Ginger Tea",
    "nameFr": "Thé au Gingembre Songtai",
    "descriptionEn": "Warming organic ginger root tea.",
    "descriptionFr": "Thé au gingembre bio réchauffant.",
    "priceXaf": 7500,
    "pvPoints": 15,
    "category": "Beverages",
    "stock": 100,
    "isActive": true
  }'
```

**Confirm:**
- Response is HTTP 201 with the product object (including `id`).
- **Reload** any partner site → the new product appears in the Products grid (6 products now).
- In French mode, the product shows the `nameFr` and `descriptionFr`.
- Deactivate it: `PATCH /api/products/:id` with `{ "isActive": false }`. Reload partner site — product disappears.
- Delete it: `DELETE /api/products/:id`. Reload partner site — confirms it's gone.

---

## Report format

After completing all 14 checks:

```
1 — API health:                    PASS/FAIL — [note]
2 — Active partner loads:          PASS/FAIL — [note]
3 — Pending/unknown blocked:       PASS/FAIL — [note]
4 — Bilingual toggle: hero:        PASS/FAIL — [note]
5 — Bilingual toggle: products:    PASS/FAIL — [note]
6 — Bilingual: about/testim/FAQ:   PASS/FAIL — [note]
7 — French fallback behavior:      PASS/FAIL — [note]
8 — Product active/inactive:       PASS/FAIL — [note]
9 — Empty products state:          PASS/FAIL — [note]
10 — Admin stats accuracy:         PASS/FAIL — [note]
11 — Admin partner CRUD:           PASS/FAIL — [note]
12 — WhatsApp links partner-scoped: PASS/FAIL — [note]
13 — Integration: create partner:  PASS/FAIL — [note]
14 — Integration: manage products: PASS/FAIL — [note]
```

If anything fails: fix the specific issue only (do not restructure the component or route), then re-run that check before marking it PASS.

---

## Commands reference

```bash
# Run from /home/runner/workspace

# Typecheck everything
pnpm run typecheck

# Regenerate API hooks after spec changes
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes (dev only)
pnpm --filter @workspace/db run push

# Direct DB queries (via psql or the Replit DB tool)
# Seeded partners:  marie-ngono (active), jean-paul-mbarga (active), aminata-diallo (pending)
# Seeded products:  5 products, all isActive=true, all in 'products' table

# Restart workflows after code changes
# artifacts/api-server: API Server
# artifacts/songtai-partners: web
```
