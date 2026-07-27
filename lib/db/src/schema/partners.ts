import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const partnersTable = pgTable("partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  status: text("status", { enum: ["pending", "active", "suspended"] })
    .notNull()
    .default("pending"),
  whatsappNumber: text("whatsapp_number"),
  contactEmail: text("contact_email"),
  heroTitleEn: text("hero_title_en"),
  heroTitleFr: text("hero_title_fr"),
  heroSubtitleEn: text("hero_subtitle_en"),
  heroSubtitleFr: text("hero_subtitle_fr"),
  heroImageUrl: text("hero_image_url"),
  profileImageUrl: text("profile_image_url"),
  pendingContactName: text("pending_contact_name"),
  pendingContactPhone: text("pending_contact_phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPartnerSchema = createInsertSchema(partnersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partnersTable.$inferSelect;
