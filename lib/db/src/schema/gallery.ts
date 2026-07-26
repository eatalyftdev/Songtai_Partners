import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const galleryTable = pgTable("gallery", {
  id: uuid("id").primaryKey().defaultRandom(),
  imageUrl: text("image_url").notNull(),
  captionEn: text("caption_en"),
  captionFr: text("caption_fr"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGallerySchema = createInsertSchema(galleryTable).omit({
  id: true,
  createdAt: true,
});
export type InsertGallery = z.infer<typeof insertGallerySchema>;
export type GalleryImage = typeof galleryTable.$inferSelect;
