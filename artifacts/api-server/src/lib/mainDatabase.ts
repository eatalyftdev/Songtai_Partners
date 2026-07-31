/**
 * Read-only client for the MAIN Songtai Life Supabase project.
 *
 * Products and FAQs are no longer stored locally in this app's own database —
 * they're fetched live from the main site's Supabase project on every
 * request, so whatever an admin edits in the main Songtai Life admin panel
 * (products, pricing, images, video, FAQs) appears here automatically, with
 * no duplicate copy to keep in sync and no risk of it going stale.
 *
 * This uses the project's public anon key over PostgREST directly (the same
 * mechanism the main site's own frontend uses, protected by Row Level
 * Security — safe to call from a server, read-only, no admin/service-role
 * access needed or used here).
 *
 * Environment variables required:
 *   MAIN_SUPABASE_URL       — e.g. https://auyjxchghtetxpiyecds.supabase.co
 *   MAIN_SUPABASE_ANON_KEY  — the main project's public anon key
 */

function getMainDbConfig(): { url: string; anonKey: string } {
  const url = process.env['MAIN_SUPABASE_URL']?.replace(/\/$/, '');
  const anonKey = process.env['MAIN_SUPABASE_ANON_KEY'];

  if (!url) throw new Error('MAIN_SUPABASE_URL is not set');
  if (!anonKey) throw new Error('MAIN_SUPABASE_ANON_KEY is not set');

  return { url, anonKey };
}

async function fetchFromMainDb(path: string): Promise<any> {
  const { url, anonKey } = getMainDbConfig();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Main database request failed (${res.status}): ${body}`);
  }

  return res.json();
}

// ── Products ─────────────────────────────────────────────────────────────

/** Row shape actually returned by the main site's `products` table + category join. */
interface MainDbProductRow {
  id: string;
  slug: string;
  name_en: string;
  name_fr: string;
  description_en: string | null;
  description_fr: string | null;
  price_xaf: number;
  pv_points: number;
  images: string[] | null;
  video_url_en: string | null;
  video_url_fr: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  product_categories: { name: string; name_fr: string } | null;
}

/**
 * This app's `Product` shape only supports one image, one video, and a plain
 * text category (not a full bilingual category object) — collapsing the main
 * site's richer shape (multiple images, per-language video) down to fit is a
 * deliberate simplification, not a bug: the first image becomes `imageUrl`,
 * the English video becomes `videoUrl` (falling back to French if English
 * isn't set). If this app's UI is ever upgraded to show a full image gallery
 * or per-language video, this mapping is the place to revisit.
 *
 * `stock` has no equivalent at all in the main site's product model (it has
 * no inventory/stock-count concept) — every synced product is reported as
 * in-stock (a high sentinel value) rather than defaulting to 0, since
 * defaulting to 0 would incorrectly show every synced product as "out of
 * stock". If real stock tracking is ever needed, that has to be added to the
 * main product model first, since this app has no independent stock data of
 * its own to draw on.
 */
function mapProductRow(row: MainDbProductRow) {
  return {
    id: row.id,
    nameEn: row.name_en,
    nameFr: row.name_fr,
    descriptionEn: row.description_en,
    descriptionFr: row.description_fr,
    priceXaf: row.price_xaf,
    pvPoints: row.pv_points,
    category: row.product_categories?.name ?? 'Uncategorized',
    imageUrl: row.images && row.images.length > 0 ? row.images[0] : null,
    videoUrl: row.video_url_en || row.video_url_fr || null,
    stock: 999,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function listMainDbProducts() {
  const rows = (await fetchFromMainDb(
    'products?is_active=eq.true&select=id,slug,name_en,name_fr,description_en,description_fr,' +
      'price_xaf,pv_points,images,video_url_en,video_url_fr,is_active,is_featured,created_at,' +
      'product_categories(name,name_fr)&order=is_featured.desc,name_en.asc',
  )) as MainDbProductRow[];
  return rows.map(mapProductRow);
}

// ── FAQs ─────────────────────────────────────────────────────────────────

interface MainDbFaqRow {
  id: string;
  question_en: string;
  question_fr: string;
  answer_en: string;
  answer_fr: string;
  display_order: number;
  created_at: string;
  faq_categories: { name_en: string } | null;
}

function mapFaqRow(row: MainDbFaqRow) {
  return {
    id: row.id,
    questionEn: row.question_en,
    questionFr: row.question_fr,
    answerEn: row.answer_en,
    answerFr: row.answer_fr,
    category: row.faq_categories?.name_en ?? null,
    sortOrder: row.display_order,
    createdAt: row.created_at,
  };
}

export async function listMainDbFaqs() {
  const rows = (await fetchFromMainDb(
    'faqs?is_published=eq.true&select=id,question_en,question_fr,answer_en,answer_fr,' +
      'display_order,created_at,faq_categories(name_en)&order=display_order.asc',
  )) as MainDbFaqRow[];
  return rows.map(mapFaqRow);
}
