import { db, partnersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const partners = [
  {
    slug: "coach-nelson",
    status: "active" as const,
    whatsappNumber: "+23767055116",
    heroTitleEn: "Health, Wealth & Opportunity — With Coach Nelson Asanji",
    heroTitleFr: "Santé, Richesse et Opportunité — Avec Coach Nelson Asanji",
    heroSubtitleEn: "Your trusted Songtai Life partner in Cameroon",
    heroSubtitleFr: "Votre partenaire de confiance Songtai Life au Cameroun",
  },
];

async function seed() {
  console.log("Seeding partners…");

  for (const partner of partners) {
    const result = await db
      .insert(partnersTable)
      .values(partner)
      .onConflictDoUpdate({
        target: partnersTable.slug,
        set: {
          status: sql`excluded.status`,
          whatsappNumber: sql`excluded.whatsapp_number`,
          heroTitleEn: sql`excluded.hero_title_en`,
          heroTitleFr: sql`excluded.hero_title_fr`,
          heroSubtitleEn: sql`excluded.hero_subtitle_en`,
          heroSubtitleFr: sql`excluded.hero_subtitle_fr`,
          updatedAt: new Date(),
        },
      })
      .returning({ id: partnersTable.id, slug: partnersTable.slug });

    console.log(`  ✓ ${result[0].slug} (${result[0].id})`);
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
