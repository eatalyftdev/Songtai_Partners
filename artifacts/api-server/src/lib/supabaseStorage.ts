/**
 * Supabase Storage backend for presigned-URL uploads.
 *
 * Uses the Supabase Storage REST API directly (no @supabase/supabase-js client)
 * so there is no WebSocket / Node-version compatibility issue.
 *
 * Environment variables required:
 *   SUPABASE_URL              — e.g. https://auyjxchghtetxpiyecds.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — service-role secret key (admin, never exposed to browser)
 *   SUPABASE_STORAGE_BUCKET   — bucket name (default: "media")
 */
import { randomUUID } from 'crypto';

interface StorageConfig {
  url: string;
  serviceRoleKey: string;
  bucket: string;
}

function getConfig(): StorageConfig {
  const url = process.env['SUPABASE_URL']?.replace(/\/$/, '');
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  const bucket = process.env['SUPABASE_STORAGE_BUCKET'] ?? 'media';

  if (!url) throw new Error('SUPABASE_URL is not set');
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');

  return { url, serviceRoleKey, bucket };
}

export interface SupabaseUploadResult {
  /** Browser should PUT the file directly to this URL (expires in 120 s) */
  signedUploadUrl: string;
  /** Permanent public URL — store this in the database as imageUrl / objectPath */
  publicUrl: string;
}

/**
 * Ask Supabase Storage to mint a signed upload URL for a new unique object.
 * The caller returns `signedUploadUrl` to the browser, which PUTs the file
 * directly to Supabase Storage (never via our server).
 * The `publicUrl` is what gets stored in the database.
 */
export async function createSignedUploadUrl(): Promise<SupabaseUploadResult> {
  const { url, serviceRoleKey, bucket } = getConfig();
  const objectKey = `uploads/${randomUUID()}`;

  const res = await fetch(
    `${url}/storage/v1/object/upload/sign/${bucket}/${objectKey}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        apikey: serviceRoleKey,
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(15_000),
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Supabase Storage: failed to create signed upload URL` +
        ` (${res.status}): ${body}`,
    );
  }

  // Supabase Storage returns { url: "/object/upload/sign/...?token=...", token: "..." }
  const data = (await res.json()) as { url?: string };

  if (!data?.url) {
    throw new Error('Supabase Storage: response missing url field');
  }

  // The returned path is relative (e.g. /object/upload/sign/media/...?token=...)
  // Prepend the project base URL + /storage/v1 to get the full upload URL.
  const signedUploadUrl = data.url.startsWith('http')
    ? data.url
    : `${url}/storage/v1${data.url}`;

  const publicUrl = `${url}/storage/v1/object/public/${bucket}/${objectKey}`;

  return { signedUploadUrl, publicUrl };
}
