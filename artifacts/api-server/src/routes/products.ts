import { Router } from "express";
import { eq, asc } from "drizzle-orm";
import { db, productsTable, insertProductSchema } from "@workspace/db";

const router = Router();

// Partial schema for PATCH — all fields optional, derived from the table shape
const updateProductSchema = insertProductSchema.partial();

// GET /products
router.get("/products", async (req, res) => {
  try {
    const items = await db
      .select()
      .from(productsTable)
      .orderBy(asc(productsTable.createdAt));
    return res.json(items);
  } catch (err) {
    req.log.error({ err }, "listProducts failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /products
router.post("/products", async (req, res) => {
  const parse = insertProductSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.message });

  try {
    const [item] = await db.insert(productsTable).values(parse.data).returning();
    return res.status(201).json(item);
  } catch (err) {
    req.log.error({ err }, "createProduct failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /products/:id
router.patch("/products/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id" });

  const parse = updateProductSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.message });

  // Strip undefined values so Drizzle doesn't try to set them
  const updates = Object.fromEntries(
    Object.entries(parse.data).filter(([, v]) => v !== undefined)
  ) as typeof parse.data;

  try {
    const [item] = await db
      .update(productsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(productsTable.id, id))
      .returning();
    if (!item) return res.status(404).json({ error: "Product not found" });
    return res.json(item);
  } catch (err) {
    req.log.error({ err }, "updateProduct failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /products/:id
router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "Missing id" });

  try {
    await db.delete(productsTable).where(eq(productsTable.id, id));
    return res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "deleteProduct failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
