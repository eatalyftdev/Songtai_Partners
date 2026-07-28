import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, faqTable } from "@workspace/db";
import { CreateFaqItemBody } from "@workspace/api-zod";
import { asc } from "drizzle-orm";

const router = Router();

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
    req.log.error({ err }, "createFaqItem failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /faq/:id
router.patch("/faq/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const allowed = ["questionEn","questionFr","answerEn","answerFr","category","sortOrder"] as const;
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => (allowed as readonly string[]).includes(k))
  ) as Partial<typeof faqTable.$inferInsert>;

  try {
    const [item] = await db
      .update(faqTable)
      .set(updates)
      .where(eq(faqTable.id, id))
      .returning();
    if (!item) return res.status(404).json({ error: "FAQ item not found" });
    return res.json(item);
  } catch (err) {
    req.log.error({ err }, "updateFaqItem failed");
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
    req.log.error({ err }, "deleteFaqItem failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
