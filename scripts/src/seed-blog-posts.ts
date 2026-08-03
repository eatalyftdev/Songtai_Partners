/**
 * Upsert 3 blog posts into the blog_posts table.
 * Safe to re-run — uses INSERT … ON CONFLICT (id) DO UPDATE.
 */
import { pool } from "@workspace/db";

interface BlogPostSeed {
  id: string;
  slug: string;
  title: string;
  titleFr: string;
  body: string;
  excerpt: string;
  author: string;
  image: string;
  category: string;
  publishedAt: string;
}

const posts: BlogPostSeed[] = [
  {
    id: "1f2bc065-b8ab-4b95-a3e2-e8ac0b35ff61",
    slug: "why-45-years-of-songtai-research-matter",
    title: "Why 45 Years of Songtai Research Matter for Your Health",
    titleFr: "Pourquoi 45 Ans de Recherche Songtai Comptent pour Votre Santé",
    body: `Since 1979, the Songtai Group has invested in one mission: turning validated botanical science into products people can trust. Today that means 58 production subsidiaries worldwide, GMP-certified manufacturing, and organic-certified Ganoderma Lucidum plantations cultivated under global GAP standards.

That research pipeline is what stands behind everyday Songtai Life products in Cameroon — from Rev-Cell's seven-fruit immune blend to the Ganoderma Lucidum Spore Coffee that supports energy and cardiovascular health. Every product carries certifications such as ISO 9001, HACCP and Halal, so distributors can sell with confidence and customers can use with peace of mind.

For a growing wellness market in Douala and beyond, that combination of heritage and lab-backed quality is what separates Songtai Life from informal wellness products on the market.`,
    excerpt: "From GMP-certified workshops to self-built organic Ganoderma plantations, discover the science behind Songtai Life products.",
    author: "Songtai Life Cameroon",
    image: "https://auyjxchghtetxpiyecds.supabase.co/storage/v1/object/public/media/blog/1783977776832_40i3m12pdys.png",
    category: "Nutraceuticals",
    publishedAt: "2026-07-13T00:00:00+00:00",
  },
  {
    id: "c157ca18-e1d6-422b-b10e-2d7d347aac19",
    slug: "how-the-compensation-plan-rewards-early-leaders",
    title: "How the Songtai Life Compensation Plan Rewards Early Leaders",
    titleFr: "Comment le Plan de Rémunération Songtai Life Récompense les Premiers Leaders",
    body: `Songtai Life's compensation plan is built around 12 bonus streams, each rewarding a different part of building a distributor business: Levelling and Sponsoring bonuses pay out daily, the Performance Bonus pays weekly on your weaker leg, and the Leadership Bonus pays monthly up to 12 generations deep.

Beyond recurring income, top performers can unlock Ranking, Trip, Car and Housing incentives — including a $12,000 or $16,000 car award once your team volume passes 80,000 or 110,000 PV. The earlier you join and build during this expansion phase in Cameroon, the more room there is to secure a strong position in your upline structure.

This post is an overview — always refer to the official Compensation Plan document for exact terms, and speak with your sponsor or the Songtai Life Cameroon office before making business decisions.`,
    excerpt: "A plain-language walkthrough of the 12 bonus streams — from daily Sponsoring Bonus to the Car and Housing incentives.",
    author: "Songtai Life Cameroon",
    image: "https://auyjxchghtetxpiyecds.supabase.co/storage/v1/object/public/media/blog/1783977824602_zynrylucs4h.png",
    category: "Direct Selling",
    publishedAt: "2026-07-13T00:00:00+00:00",
  },
  {
    id: "1c577561-7dc8-478f-bcb6-d8edb9f087b0",
    slug: "from-organic-plantation-to-your-doorstep",
    title: "From Organic Plantation to Your Doorstep: How Songtai Sources Its Ingredients",
    titleFr: "De la Plantation Biologique à Votre Porte : Comment Songtai S'Approvisionne",
    body: `Many Songtai Life ingredients begin on self-built organic plantations, cultivated under strict Global GAP and organic certification standards. Reishi mushroom (Ganoderma Lucidum), for example, is grown, harvested and tested according to standardized international protocols before it ever reaches processing.

That traceability — from soil to standardized harvesting to GMP-certified processing — is part of why Songtai has been recognized with organic and Halal certifications across multiple markets. For Cameroonian consumers increasingly asking where their wellness products come from, that is a story worth knowing.`,
    excerpt: "A look inside Songtai's self-built organic Ganoderma plantations and standardized harvesting process.",
    author: "Songtai Life Cameroon",
    image: "https://auyjxchghtetxpiyecds.supabase.co/storage/v1/object/public/media/blog/1783977804814_tocdzkj6c1f.jpeg",
    category: "Eco Agriculture",
    publishedAt: "2026-07-13T00:00:00+00:00",
  },
];

async function seedBlogPosts() {
  const client = await pool.connect();
  console.log(`Seeding ${posts.length} blog posts…`);

  try {
    for (const p of posts) {
      await client.query(
        `INSERT INTO blog_posts
           (id, slug, title, title_fr, body, excerpt, author, image,
            category, status, published_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published',$10,NOW())
         ON CONFLICT (id) DO UPDATE SET
           slug         = EXCLUDED.slug,
           title        = EXCLUDED.title,
           title_fr     = EXCLUDED.title_fr,
           body         = EXCLUDED.body,
           excerpt      = EXCLUDED.excerpt,
           author       = EXCLUDED.author,
           image        = EXCLUDED.image,
           category     = EXCLUDED.category,
           status       = 'published',
           published_at = EXCLUDED.published_at`,
        [
          p.id, p.slug, p.title, p.titleFr, p.body,
          p.excerpt, p.author, p.image, p.category, p.publishedAt,
        ],
      );
      console.log(`  ✓ ${p.title.slice(0, 60)}…`);
    }
    console.log("Done.");
  } finally {
    client.release();
    await pool.end();
  }
}

seedBlogPosts().catch((err) => {
  console.error("Blog post seed failed:", err);
  process.exit(1);
});
