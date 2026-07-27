import { Router } from "express";
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

export default router;
