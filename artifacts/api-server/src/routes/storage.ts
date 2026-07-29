import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from '@workspace/api-zod';
import { Router, type IRouter, type Request, type Response } from 'express';
import { createSignedUploadUrl } from '../lib/supabaseStorage';

const router: IRouter = Router();

/**
 * POST /storage/uploads/request-url
 *
 * Returns a Supabase Storage signed upload URL and the permanent public URL
 * for the object that will be created.
 *
 * The client:
 *   1. Calls this endpoint with file metadata (name, size, contentType).
 *   2. Receives { uploadURL, objectPath }.
 *   3. PUTs the file directly to uploadURL (goes straight to Supabase Storage).
 *   4. Stores objectPath (the full public URL) in the database.
 *
 * This endpoint is protected by the auth middleware (JWT required) so that
 * anonymous callers cannot mint write-capable URLs.
 */
router.post(
  '/storage/uploads/request-url',
  async (req: Request, res: Response) => {
    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }

    try {
      const { name, size, contentType } = parsed.data;
      const { signedUploadUrl, publicUrl } = await createSignedUploadUrl();

      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL: signedUploadUrl,
          objectPath: publicUrl,
          metadata: { name, size, contentType },
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, 'Error generating Supabase upload URL');
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  },
);

export default router;
