import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

const supabaseUrl = process.env["SUPABASE_URL"];
const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"];

// Create a module-level singleton so we don't re-initialise on every request
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

/**
 * Express middleware that requires a valid Supabase JWT in the
 * `Authorization: Bearer <token>` header.
 *
 * If SUPABASE_URL / SUPABASE_ANON_KEY are not configured (e.g. during initial
 * setup) a warning is logged and the request is allowed through so the API
 * remains usable while credentials are being provisioned.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const client = getClient();

  if (!client) {
    logger.warn("requireAuth: SUPABASE_URL/SUPABASE_ANON_KEY not set — skipping auth check");
    next();
    return;
  }

  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized — missing bearer token" });
    return;
  }

  const token = authHeader.slice(7);

  const { data, error } = await client.auth.getUser(token);

  if (error || !data?.user) {
    res.status(401).json({ error: "Unauthorized — invalid or expired token" });
    return;
  }

  // Attach the verified user to the request for downstream handlers
  (req as Request & { user: typeof data.user }).user = data.user;
  next();
}
