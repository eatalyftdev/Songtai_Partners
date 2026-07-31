/**
 * Safe schema migration script.
 * Creates missing tables and adds missing columns using IF NOT EXISTS —
 * never drops or truncates anything. Safe to re-run.
 */
import { pool } from "@workspace/db";
import bcrypt from "bcryptjs";

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

    // ── Seed default admin if none exists ─────────────────────────────────
    const { rows } = await client.query("SELECT id FROM admins LIMIT 1");
    if (rows.length === 0) {
      const defaultPassword = "SongtaiAdmin2024!";
      const passwordHash = bcrypt.hashSync(defaultPassword, 12);
      await client.query(
        `INSERT INTO admins (email, password_hash, name) VALUES ($1, $2, $3)
         ON CONFLICT (email) DO NOTHING`,
        ["admin@songtailife.com", passwordHash, "Super Admin"],
      );
      console.log("  ✓ Seeded default admin: admin@songtailife.com / SongtaiAdmin2024!");
      console.log("    ⚠️  Change this password after first login!");
    } else {
      console.log("  ✓ Admin account already exists — skipping seed");
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
