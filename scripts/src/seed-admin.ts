/**
 * Seed (upsert) an admin account into the admins table.
 * Safe to re-run — uses INSERT … ON CONFLICT DO UPDATE.
 */
import { db, adminsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

const EMAIL = process.env.ADMIN_EMAIL!;
const NAME = process.env.ADMIN_NAME!;
const PASSWORD = process.env.ADMIN_PASSWORD!;

if (!EMAIL || !PASSWORD) {
  console.error("ADMIN_EMAIL and ADMIN_PASSWORD env vars are required.");
  process.exit(1);
}

async function seedAdmin() {
  console.log(`Seeding admin: ${EMAIL} …`);

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const result = await db
    .insert(adminsTable)
    .values({ email: EMAIL.toLowerCase().trim(), name: NAME, passwordHash, isActive: true })
    .onConflictDoUpdate({
      target: adminsTable.email,
      set: {
        name: sql`excluded.name`,
        passwordHash: sql`excluded.password_hash`,
        isActive: true,
      },
    })
    .returning({ id: adminsTable.id, email: adminsTable.email });

  console.log(`  ✓ Admin upserted: ${result[0].email} (${result[0].id})`);
  console.log("Done.");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
