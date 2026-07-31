import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, adminsTable } from "@workspace/db";

const router = Router();
const JWT_SECRET = process.env["SESSION_SECRET"] ?? "fallback-dev-secret-change-in-prod";
const JWT_EXPIRY = "7d";

// ── POST /auth/login ───────────────────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  const { email, password } = (req.body ?? {}) as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const [admin] = await db
      .select()
      .from(adminsTable)
      .where(eq(adminsTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (!admin || !admin.isActive) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login timestamp (fire-and-forget — don't block the response)
    db.update(adminsTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminsTable.id, admin.id))
      .catch(() => {/* ignore */});

    const token = jwt.sign(
      { sub: admin.id, email: admin.email, name: admin.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY } as jwt.SignOptions,
    );

    return res.json({
      token,
      admin: { id: admin.id, email: admin.email, name: admin.name },
    });
  } catch (err) {
    req.log.error({ err }, "login failed");
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /auth/me ───────────────────────────────────────────────────────────
router.get("/auth/me", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as {
      sub: string;
      email: string;
      name?: string;
    };
    return res.json({ id: payload.sub, email: payload.email, name: payload.name ?? null });
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
});

export default router;
