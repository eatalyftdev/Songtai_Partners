import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { db, faqTable } from "@workspace/db";
import { CreateFaqItemBody } from "@workspace/api-zod";

const router = Router();

// Partial schema for updates (all fields optional)
const UpdateFaqBody = CreateFaqItemBody.partial();

// GET /faq
router.get("/faq", async (req, res) => {
  try {
    const items = await db
      .select()
      .from(faqTable)
      .orderBy(asc(faqTable.sortOrder));
    return res.json(items);
  } catch (err) {
    req.log.error({ err }, "listFaq failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /faq
router.post("/faq", async (req, res) => {
  const parse = CreateFaqItemBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.message });

  try {
    const [item] = await db.insert(faqTable).values(parse.data).returning();
    return res.status(201).json(item);
  } catch (err) {
    req.log.error({ err }, "createFaq failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /faq/:id
router.patch("/faq/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const parse = UpdateFaqBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.message });

  try {
    const [item] = await db
      .update(faqTable)
      .set(parse.data)
      .where(eq(faqTable.id, id))
      .returning();
    if (!item) return res.status(404).json({ error: "FAQ not found" });
    return res.json(item);
  } catch (err) {
    req.log.error({ err }, "updateFaq failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /faq/:id
router.delete("/faq/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    await db.delete(faqTable).where(eq(faqTable.id, id));
    return res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "deleteFaq failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
