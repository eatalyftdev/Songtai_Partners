import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, partnersTable } from "@workspace/db";
import {
  CreatePartnerBody,
  UpdatePartnerBody,
  UpdatePartnerStatusBody,
  GetPartnerBySlugParams,
  GetPartnerByDomainQueryParams,
  UpdatePartnerParams,
  UpdatePartnerStatusParams,
  DeletePartnerParams,
} from "@workspace/api-zod";

const router = Router();

// GET /partners/by-domain?hostname=coachnelson.site — resolve a partner by
// their verified custom domain (public). Must be registered BEFORE
// /partners/:slug so "by-domain" is never mistaken for a literal slug value.
router.get("/partners/by-domain", async (req, res) => {
  const parse = GetPartnerByDomainQueryParams.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: "hostname query parameter is required" });
  }

  try {
    const [partner] = await db
      .select()
      .from(partnersTable)
      .where(eq(partnersTable.customDomain, parse.data.hostname.toLowerCase().trim()))
      .limit(1);

    if (!partner || partner.status !== "active" || partner.domainStatus !== "verified") {
      return res.status(404).json({ error: "No active partner has a verified custom domain matching this hostname" });
    }
    return res.json(partner);
  } catch (err) {
    req.log.error({ err }, "getPartnerByDomain failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});


// GET /partners — list all
router.get("/partners", async (req, res) => {
  try {
    const partners = await db
      .select()
      .from(partnersTable)
      .orderBy(partnersTable.createdAt);
    return res.json(partners);
  } catch (err) {
    req.log.error({ err }, "listPartners failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /partners/stats — aggregate counts
router.get("/partners/stats", async (req, res) => {
  try {
    const all = await db.select({ status: partnersTable.status }).from(partnersTable);
    const stats = { total: all.length, active: 0, pending: 0, suspended: 0 };
    for (const p of all) {
      if (p.status === "active") stats.active++;
      else if (p.status === "pending") stats.pending++;
      else if (p.status === "suspended") stats.suspended++;
    }
    return res.json(stats);
  } catch (err) {
    req.log.error({ err }, "getPartnerStats failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /partners/:slug — resolve by slug (public)
router.get("/partners/:slug", async (req, res) => {
  const parse = GetPartnerBySlugParams.safeParse(req.params);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid slug" });
  }

  try {
    const [partner] = await db
      .select()
      .from(partnersTable)
      .where(eq(partnersTable.slug, parse.data.slug))
      .limit(1);

    if (!partner || partner.status !== "active") {
      return res.status(404).json({ error: "Partner not found or not active" });
    }
    return res.json(partner);
  } catch (err) {
    req.log.error({ err }, "getPartnerBySlug failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /partners — create
router.post("/partners", async (req, res) => {
  const parse = CreatePartnerBody.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.message });
  }

  // Validate slug format
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(parse.data.slug) || parse.data.slug.length < 2) {
    return res.status(400).json({ error: "Slug must be lowercase letters, numbers, and hyphens only" });
  }

  try {
    const [existing] = await db
      .select({ id: partnersTable.id })
      .from(partnersTable)
      .where(eq(partnersTable.slug, parse.data.slug))
      .limit(1);

    if (existing) {
      return res.status(409).json({ error: "Slug already taken" });
    }

    const [partner] = await db
      .insert(partnersTable)
      .values(parse.data)
      .returning();
    return res.status(201).json(partner);
  } catch (err) {
    req.log.error({ err }, "createPartner failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /partners/:id/status — approve or suspend
router.patch("/partners/:id/status", async (req, res) => {
  const paramParse = UpdatePartnerStatusParams.safeParse(req.params);
  if (!paramParse.success) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const bodyParse = UpdatePartnerStatusBody.safeParse(req.body);
  if (!bodyParse.success) {
    return res.status(400).json({ error: bodyParse.error.message });
  }

  try {
    const [partner] = await db
      .update(partnersTable)
      .set({ status: bodyParse.data.status })
      .where(eq(partnersTable.id, paramParse.data.id))
      .returning();

    if (!partner) {
      return res.status(404).json({ error: "Partner not found" });
    }
    return res.json(partner);
  } catch (err) {
    req.log.error({ err }, "updatePartnerStatus failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /partners/:id — edit details
router.patch("/partners/:id", async (req, res) => {
  const paramParse = UpdatePartnerParams.safeParse(req.params);
  if (!paramParse.success) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const bodyParse = UpdatePartnerBody.safeParse(req.body);
  if (!bodyParse.success) {
    return res.status(400).json({ error: bodyParse.error.message });
  }

  try {
    // Filter out null/undefined values to only update provided fields
    const updateData = Object.fromEntries(
      Object.entries(bodyParse.data).filter(([, v]) => v != null),
    );

    const [partner] = await db
      .update(partnersTable)
      .set(updateData)
      .where(eq(partnersTable.id, paramParse.data.id))
      .returning();

    if (!partner) {
      return res.status(404).json({ error: "Partner not found" });
    }
    return res.json(partner);
  } catch (err) {
    req.log.error({ err }, "updatePartner failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /partners/:id — soft-delete (suspend)
router.delete("/partners/:id", async (req, res) => {
  const parse = DeletePartnerParams.safeParse(req.params);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid id" });
  }

  try {
    const [partner] = await db
      .update(partnersTable)
      .set({ status: "suspended" })
      .where(eq(partnersTable.id, parse.data.id))
      .returning();

    if (!partner) {
      return res.status(404).json({ error: "Partner not found" });
    }
    return res.json(partner);
  } catch (err) {
    req.log.error({ err }, "deletePartner failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
