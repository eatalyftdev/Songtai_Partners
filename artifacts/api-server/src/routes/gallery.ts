import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, galleryTable } from "@workspace/db";
import { CreateGalleryImageBody } from "@workspace/api-zod";
import { asc } from "drizzle-orm";

const router = Router();

// GET /gallery
router.get("/gallery", async (req, res) => {
  try {
    const images = await db
      .select()
      .from(galleryTable)
      .orderBy(asc(galleryTable.sortOrder));
    return res.json(images);
  } catch (err) {
    req.log.error({ err }, "listGallery failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /gallery
router.post("/gallery", async (req, res) => {
  const parse = CreateGalleryImageBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.message });

  try {
    const [image] = await db.insert(galleryTable).values(parse.data).returning();
    return res.status(201).json(image);
  } catch (err) {
    req.log.error({ err }, "createGalleryImage failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /gallery/:id
router.patch("/gallery/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const allowed = ["imageUrl","captionEn","captionFr","sortOrder"] as const;
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => (allowed as readonly string[]).includes(k))
  ) as Partial<typeof galleryTable.$inferInsert>;

  try {
    const [image] = await db
      .update(galleryTable)
      .set(updates)
      .where(eq(galleryTable.id, id))
      .returning();
    if (!image) return res.status(404).json({ error: "Gallery image not found" });
    return res.json(image);
  } catch (err) {
    req.log.error({ err }, "updateGalleryImage failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /gallery/:id
router.delete("/gallery/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    await db.delete(galleryTable).where(eq(galleryTable.id, id));
    return res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "deleteGalleryImage failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
