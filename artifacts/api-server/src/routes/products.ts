import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";
import {
  CreateProductBody,
  UpdateProductBody,
  UpdateProductParams,
  DeleteProductParams,
} from "@workspace/api-zod";

const router = Router();

// GET /products
router.get("/products", async (req, res) => {
  try {
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.isActive, true))
      .orderBy(productsTable.category);
    return res.json(products);
  } catch (err) {
    req.log.error({ err }, "listProducts failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /products
router.post("/products", async (req, res) => {
  const parse = CreateProductBody.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.message });

  try {
    const [product] = await db.insert(productsTable).values(parse.data as typeof productsTable.$inferInsert).returning();
    return res.status(201).json(product);
  } catch (err) {
    req.log.error({ err }, "createProduct failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /products/:id
router.patch("/products/:id", async (req, res) => {
  const paramParse = UpdateProductParams.safeParse(req.params);
  if (!paramParse.success) return res.status(400).json({ error: "Invalid id" });

  const bodyParse = UpdateProductBody.safeParse(req.body);
  if (!bodyParse.success) return res.status(400).json({ error: bodyParse.error.message });

  try {
    const updateData = Object.fromEntries(
      Object.entries(bodyParse.data).filter(([, v]) => v != null),
    ) as Partial<typeof productsTable.$inferInsert>;
    const [product] = await db
      .update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, paramParse.data.id))
      .returning();
    if (!product) return res.status(404).json({ error: "Product not found" });
    return res.json(product);
  } catch (err) {
    req.log.error({ err }, "updateProduct failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /products/:id
router.delete("/products/:id", async (req, res) => {
  const parse = DeleteProductParams.safeParse(req.params);
  if (!parse.success) return res.status(400).json({ error: "Invalid id" });

  try {
    await db.delete(productsTable).where(eq(productsTable.id, parse.data.id));
    return res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "deleteProduct failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
