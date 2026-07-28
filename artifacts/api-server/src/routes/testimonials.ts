import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, testimonialsTable } from "@workspace/db";
import { CreateTestimonialBody } from "@workspace/api-zod";
import { desc } from "drizzle-orm";

const router = Router();

// GET /testimonials
router.get("/testimonials", async (req, res) => {
  try {
    const items = await db
      .select()
      .from(testimonialsTable)
      .orderBy(desc(testimonialsTable.createdAt));
    return res.json(items);
  } catch (err) {
    req.log.error({ err }, "listTestimonials failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /testimonials
router.post("/testimonials", async (req, res) => {
  const parse = CreateTestimonialBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.message });

  try {
    const [item] = await db.insert(testimonialsTable).values(parse.data).returning();
    return res.status(201).json(item);
  } catch (err) {
    req.log.error({ err }, "createTestimonial failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /testimonials/:id
router.patch("/testimonials/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const allowed = ["authorName","authorRole","contentEn","contentFr","rating","imageUrl","isActive"] as const;
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => (allowed as readonly string[]).includes(k))
  ) as Partial<typeof testimonialsTable.$inferInsert>;

  try {
    const [item] = await db
      .update(testimonialsTable)
      .set(updates)
      .where(eq(testimonialsTable.id, id))
      .returning();
    if (!item) return res.status(404).json({ error: "Testimonial not found" });
    return res.json(item);
  } catch (err) {
    req.log.error({ err }, "updateTestimonial failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /testimonials/:id
router.delete("/testimonials/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
    return res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "deleteTestimonial failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
