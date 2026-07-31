import { Router, type Request, type Response } from "express";
import { listMainDbFaqs } from "../lib/mainDatabase";

const router = Router();

// GET /faq
//
// FAQs are fetched live from the main Songtai Life database on every request
// (see ../lib/mainDatabase.ts) rather than stored as a separate local copy.
// Whatever is edited in the main Songtai Life admin panel appears here
// automatically.
router.get("/faq", async (req, res) => {
  try {
    const items = await listMainDbFaqs();
    return res.json(items);
  } catch (err) {
    req.log.error({ err }, "listFaq (main DB fetch) failed");
    return res.status(502).json({
      error: "Could not load FAQs from the main Songtai Life database.",
    });
  }
});

// POST/PATCH/DELETE are intentionally disabled — see products.ts for the
// same reasoning: FAQs are managed from the main Songtai Life admin panel
// now, and a local write here would have no visible effect.
function disabled(_req: Request, res: Response) {
  res.status(409).json({
    error:
      "FAQs are now managed from the main Songtai Life admin panel, not from this site. Please make changes there — they will appear here automatically.",
  });
}

router.post("/faq", disabled);
router.patch("/faq/:id", disabled);
router.delete("/faq/:id", disabled);

export default router;
