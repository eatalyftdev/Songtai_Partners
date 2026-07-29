import { useCallback, useState } from 'react';
import type { UppyFile } from '@uppy/core';

interface UploadMetadata {
  name: string;
  size: number;
  contentType: string;
}

interface UploadResponse {
  uploadURL: string;
  objectPath: string;
  metadata: UploadMetadata;
}

interface UseUploadOptions {
  /** Base path where object storage routes are mounted (default: "/api/storage") */
  basePath?: string;
  /**
   * Maximum file size in bytes. Uploads larger than this are rejected with a
   * clear error message before any network request is made.
   * Default: 10MB (10 * 1024 * 1024).
   */
  maxSizeBytes?: number;
  /**
   * Allowed MIME types. Uploads with a type not in this list are rejected with
   * a clear error message before any network request is made.
   * Default: ["image/jpeg", "image/png", "image/webp", "image/gif"].
   */
  allowedContentTypes?: string[];
  onSuccess?: (response: UploadResponse) => void;
  onError?: (error: Error) => void;
}

export type UploadAuthTokenGetter = () => Promise<string | null> | string | null;

// ---------------------------------------------------------------------------
// Module-level auth token getter — set once at app startup via
// setUploadAuthTokenGetter(), automatically injected into every upload request.
// ---------------------------------------------------------------------------
let _authTokenGetter: UploadAuthTokenGetter | null = null;

/**
 * Register a getter that supplies a bearer auth token.
 * Before every presigned-URL request the getter is invoked; when it returns a
 * non-null string, an `Authorization: Bearer <token>` header is attached.
 *
 * Call this once at app startup (e.g. in main.tsx) alongside setAuthTokenGetter:
 *
 *   setUploadAuthTokenGetter(async () => {
 *     const { data } = await supabase.auth.getSession();
 *     return data.session?.access_token ?? null;
 *   });
 */
export function setUploadAuthTokenGetter(getter: UploadAuthTokenGetter | null): void {
  _authTokenGetter = getter;
}

/**
 * React hook for handling file uploads with presigned URLs.
 *
 * This hook implements the two-step presigned URL upload flow:
 * 1. Request a presigned URL from your backend (sends JSON metadata, NOT the file)
 * 2. Upload the file directly to the presigned URL
 *
 * @example
 * ```tsx
 * function FileUploader() {
 *   const { uploadFile, isUploading, error } = useUpload({
 *     onSuccess: (response) => {
 *       console.log("Uploaded to:", response.objectPath);
 *     },
 *   });
 *
 *   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 *     const file = e.target.files?.[0];
 *     if (file) {
 *       await uploadFile(file);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <input type="file" onChange={handleFileChange} disabled={isUploading} />
 *       {isUploading && <p>Uploading...</p>}
 *       {error && <p>Error: {error.message}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const DEFAULT_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function useUpload(options: UseUploadOptions = {}) {
  const basePath = options.basePath ?? '/api/storage';
  const maxSizeBytes = options.maxSizeBytes ?? DEFAULT_MAX_SIZE;
  const allowedContentTypes = options.allowedContentTypes ?? DEFAULT_ALLOWED_TYPES;
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const requestUploadUrl = useCallback(
    async (file: File): Promise<UploadResponse> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Attach bearer token when module-level getter is configured
      if (_authTokenGetter) {
        const token = await _authTokenGetter();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${basePath}/uploads/request-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || 'application/octet-stream',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Upload failed: your session has expired. Please sign in again.');
        }
        throw new Error(errorData.error || 'Failed to get upload URL');
      }

      return response.json();
    },
    [basePath],
  );

  const uploadToPresignedUrl = useCallback(
    async (file: File, uploadURL: string): Promise<void> => {
      const response = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload file to storage');
      }
    },
    [],
  );

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse | null> => {
      // ── Pre-flight validation ──────────────────────────────────────────────
      const fileType = file.type || 'application/octet-stream';
      if (!allowedContentTypes.includes(fileType)) {
        const allowed = allowedContentTypes
          .map((t) => t.replace('image/', '').toUpperCase())
          .join(', ');
        const err = new Error(
          `Unsupported file type "${fileType}". Allowed types: ${allowed}.`,
        );
        setError(err);
        options.onError?.(err);
        return null;
      }
      if (file.size > maxSizeBytes) {
        const limitMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
        const fileMb = (file.size / (1024 * 1024)).toFixed(1);
        const err = new Error(
          `File is too large (${fileMb} MB). Maximum allowed size is ${limitMb} MB.`,
        );
        setError(err);
        options.onError?.(err);
        return null;
      }
      // ── Upload ────────────────────────────────────────────────────────────
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        setProgress(10);
        const uploadResponse = await requestUploadUrl(file);

        setProgress(30);
        await uploadToPresignedUrl(file, uploadResponse.uploadURL);

        setProgress(100);
        options.onSuccess?.(uploadResponse);
        return uploadResponse;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        setError(error);
        options.onError?.(error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [requestUploadUrl, uploadToPresignedUrl, options],
  );

  const getUploadParameters = useCallback(
    async (
      file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
    ): Promise<{
      method: 'PUT';
      url: string;
      headers?: Record<string, string>;
    }> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (_authTokenGetter) {
        const token = await _authTokenGetter();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(`${basePath}/uploads/request-url`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: file.name,
          size: file.size,
          contentType: file.type || 'application/octet-stream',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const data = await response.json();
      return {
        method: 'PUT',
        url: data.uploadURL,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      };
    },
    [basePath],
  );

  return {
    uploadFile,
    getUploadParameters,
    isUploading,
    error,
    progress,
  };
}
