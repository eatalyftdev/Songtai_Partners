import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const aboutTable = pgTable("about", {
  id: uuid("id").primaryKey().defaultRandom(),
  storyEn: text("story_en").notNull(),
  storyFr: text("story_fr").notNull(),
  missionEn: text("mission_en").notNull(),
  missionFr: text("mission_fr").notNull(),
  visionEn: text("vision_en").notNull(),
  visionFr: text("vision_fr").notNull(),
  imageUrl: text("image_url"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAboutSchema = createInsertSchema(aboutTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertAbout = z.infer<typeof insertAboutSchema>;
export type About = typeof aboutTable.$inferSelect;
