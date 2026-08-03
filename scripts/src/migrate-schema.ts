/**
 * Safe schema migration script.
 * Creates missing tables and adds missing columns using IF NOT EXISTS —
 * never drops or truncates anything. Safe to re-run.
 */
import { pool } from "@workspace/db";

const migrations = [
  // ── products: add missing columns ──────────────────────────────────────
  `ALTER TABLE products
     ADD COLUMN IF NOT EXISTS name_en       text,
     ADD COLUMN IF NOT EXISTS name_fr       text,
     ADD COLUMN IF NOT EXISTS description_en text,
     ADD COLUMN IF NOT EXISTS description_fr text,
     ADD COLUMN IF NOT EXISTS price_xaf     integer,
     ADD COLUMN IF NOT EXISTS pv_points     integer NOT NULL DEFAULT 0,
     ADD COLUMN IF NOT EXISTS category      text,
     ADD COLUMN IF NOT EXISTS image_url     text,
     ADD COLUMN IF NOT EXISTS video_url     text,
     ADD COLUMN IF NOT EXISTS stock         integer NOT NULL DEFAULT 0,
     ADD COLUMN IF NOT EXISTS is_active     boolean NOT NULL DEFAULT true,
     ADD COLUMN IF NOT EXISTS created_at    timestamptz NOT NULL DEFAULT now(),
     ADD COLUMN IF NOT EXISTS updated_at    timestamptz NOT NULL DEFAULT now()`,

  // ── partners: add profile_image_url + custom domain columns ───────────
  `ALTER TABLE partners
     ADD COLUMN IF NOT EXISTS profile_image_url text,
     ADD COLUMN IF NOT EXISTS custom_domain     text UNIQUE,
     ADD COLUMN IF NOT EXISTS domain_status     text NOT NULL DEFAULT 'none'`,

  // ── testimonials: add missing columns ──────────────────────────────────
  `ALTER TABLE testimonials
     ADD COLUMN IF NOT EXISTS author_name text,
     ADD COLUMN IF NOT EXISTS author_role text,
     ADD COLUMN IF NOT EXISTS content_en  text,
     ADD COLUMN IF NOT EXISTS content_fr  text,
     ADD COLUMN IF NOT EXISTS rating      integer NOT NULL DEFAULT 5,
     ADD COLUMN IF NOT EXISTS image_url   text,
     ADD COLUMN IF NOT EXISTS is_active   boolean NOT NULL DEFAULT true,
     ADD COLUMN IF NOT EXISTS created_at  timestamptz NOT NULL DEFAULT now()`,

  // ── faq: create if missing ──────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS faq (
     id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     question_en text NOT NULL,
     question_fr text NOT NULL,
     answer_en   text NOT NULL,
     answer_fr   text NOT NULL,
     category    text,
     sort_order  integer NOT NULL DEFAULT 0,
     created_at  timestamptz NOT NULL DEFAULT now()
   )`,

  // ── gallery: create if missing ──────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS gallery (
     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     image_url  text NOT NULL,
     caption_en text,
     caption_fr text,
     sort_order integer NOT NULL DEFAULT 0,
     created_at timestamptz NOT NULL DEFAULT now()
   )`,

  // ── about: create if missing ────────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS about (
     id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     story_en   text NOT NULL,
     story_fr   text NOT NULL,
     mission_en text NOT NULL,
     mission_fr text NOT NULL,
     vision_en  text NOT NULL,
     vision_fr  text NOT NULL,
     image_url  text,
     updated_at timestamptz NOT NULL DEFAULT now()
   )`,

  // ── blog_posts: create if missing ──────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS blog_posts (
     id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     slug         text NOT NULL UNIQUE,
     title        text NOT NULL,
     title_fr     text,
     body         text NOT NULL,
     excerpt      text,
     author       text,
     image        text,
     category     text,
     status       text NOT NULL DEFAULT 'draft',
     published_at timestamptz,
     created_at   timestamptz NOT NULL DEFAULT now()
   )`,

  // ── admins: create if missing ───────────────────────────────────────────
  `CREATE TABLE IF NOT EXISTS admins (
     id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     email           text NOT NULL UNIQUE,
     password_hash   text NOT NULL,
     name            text,
     is_active       boolean NOT NULL DEFAULT true,
     created_at      timestamptz NOT NULL DEFAULT now(),
     last_login_at   timestamptz
   )`,
];

async function migrate() {
  const client = await pool.connect();
  console.log("Running schema migration…");
  try {
    for (const sql of migrations) {
      const label = sql.trim().split("\n")[0].slice(0, 70);
      await client.query(sql);
      console.log(`  ✓ ${label}`);
    }

    console.log("Migration complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
