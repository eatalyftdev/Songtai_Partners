import { Router } from "express";
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

export default router;
