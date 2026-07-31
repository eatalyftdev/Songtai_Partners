import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../lib/logger";

const JWT_SECRET = process.env["SESSION_SECRET"] ?? "fallback-dev-secret-change-in-prod";

type AdminPayload = { sub: string; email: string; name?: string };

/**
 * Express middleware that requires a valid JWT in the
 * `Authorization: Bearer <token>` header.
 *
 * JWTs are issued by POST /api/auth/login using SESSION_SECRET as the signing key.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as AdminPayload;
    (req as Request & { user: AdminPayload }).user = {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch (err) {
    logger.warn({ err }, "requireAuth: invalid or expired token");
    res.status(401).json({ error: "Unauthorized" });
  }
}
