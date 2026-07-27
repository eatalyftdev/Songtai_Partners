import { Router } from "express";
import { db, aboutTable } from "@workspace/db";
import { UpdateAboutBody } from "@workspace/api-zod";

const router = Router();

// GET /about — returns the single about row (or default)
router.get("/about", async (req, res) => {
  try {
    const [about] = await db.select().from(aboutTable).limit(1);
    if (!about) {
      return res.status(404).json({ error: "About content not found" });
    }
    return res.json(about);
  } catch (err) {
    req.log.error({ err }, "getAbout failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /about — upsert the single about row
router.put("/about", async (req, res) => {
  const parse = UpdateAboutBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.message });

  try {
    const [existing] = await db.select({ id: aboutTable.id }).from(aboutTable).limit(1);

    let about;
    if (existing) {
      [about] = await db
        .update(aboutTable)
        .set(parse.data)
        .returning();
    } else {
      [about] = await db
        .insert(aboutTable)
        .values({
          storyEn: parse.data.storyEn ?? "",
          storyFr: parse.data.storyFr ?? "",
          missionEn: parse.data.missionEn ?? "",
          missionFr: parse.data.missionFr ?? "",
          visionEn: parse.data.visionEn ?? "",
          visionFr: parse.data.visionFr ?? "",
          imageUrl: parse.data.imageUrl,
        })
        .returning();
    }
    return res.json(about);
  } catch (err) {
    req.log.error({ err }, "updateAbout failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
