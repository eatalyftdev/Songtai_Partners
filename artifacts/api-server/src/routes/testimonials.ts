import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, testimonialsTable } from "@workspace/db";
import { CreateTestimonialBody } from "@workspace/api-zod";

const router = Router();

// GET /testimonials
router.get("/testimonials", async (req, res) => {
  try {
    const testimonials = await db
      .select()
      .from(testimonialsTable)
      .where(eq(testimonialsTable.isActive, true))
      .orderBy(testimonialsTable.createdAt);
    return res.json(testimonials);
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
    const [testimonial] = await db.insert(testimonialsTable).values(parse.data).returning();
    return res.status(201).json(testimonial);
  } catch (err) {
    req.log.error({ err }, "createTestimonial failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
