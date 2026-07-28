import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"];

type SupabaseUser = { id: string; email?: string };

/**
 * Verify a Supabase JWT by calling the Supabase Auth REST API directly.
 * This avoids importing the full supabase-js client (which requires WebSocket
 * and is not compatible with Node 20 without extra polyfills).
 */
async function verifySupabaseToken(token: string): Promise<SupabaseUser | null> {
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
    },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { id?: string; email?: string };
  if (!data?.id) return null;
  return { id: data.id, email: data.email };
}

/**
 * Express middleware that requires a valid Supabase JWT in the
 * `Authorization: Bearer <token>` header.
 *
 * If SUPABASE_URL / SUPABASE_ANON_KEY are not configured, auth is skipped with
 * a warning so the API remains usable while credentials are being provisioned.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) {
    logger.warn("requireAuth: SUPABASE_URL/SUPABASE_ANON_KEY not set — skipping auth check");
    next();
    return;
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const user = await verifySupabaseToken(token);

  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  (req as Request & { user: SupabaseUser }).user = user;
  next();
}
