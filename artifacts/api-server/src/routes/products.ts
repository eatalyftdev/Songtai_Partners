import { Router, type Request, type Response } from "express";
import { listMainDbProducts } from "../lib/mainDatabase";

const router = Router();

// GET /products
//
// Products are the main Songtai Life catalog — fetched live from the main
// site's database on every request (see ../lib/mainDatabase.ts) rather than
// stored as a separate local copy. Whatever is edited in the main Songtai
// Life admin panel (name, price, images, video, active/inactive) appears
// here automatically, with nothing to keep in sync by hand.
router.get("/products", async (req, res) => {
  try {
    const products = await listMainDbProducts();
    return res.json(products);
  } catch (err) {
    req.log.error({ err }, "listProducts (main DB fetch) failed");
    return res.status(502).json({
      error: "Could not load products from the main Songtai Life database.",
    });
  }
});

// POST/PATCH/DELETE are intentionally disabled: products are managed
// exclusively from the main Songtai Life admin panel now, not from this
// app's own admin. Returning a clear, specific error here is deliberate —
// silently accepting a write that would have no visible effect (since reads
// always come live from the main database) would be far more confusing than
// telling the admin exactly where to go instead.
function disabled(_req: Request, res: Response) {
  res.status(409).json({
    error:
      "Products are now managed from the main Songtai Life admin panel, not from this site. Please make changes there — they will appear here automatically.",
  });
}

router.post("/products", disabled);
router.patch("/products/:id", disabled);
router.delete("/products/:id", disabled);

export default router;
