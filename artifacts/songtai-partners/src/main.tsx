import { createRoot } from 'react-dom/client';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';
import { setUploadAuthTokenGetter } from '@workspace/object-storage-web';
import { supabase } from './lib/supabase';

import App from './App';

import './index.css';

// When VITE_API_URL is set (e.g. on Vercel pointing to a deployed API),
// all generated API hooks will use that absolute URL instead of relative /api paths.
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

// Shared token getter — used by both API client hooks AND the upload hook so
// that every request to the server (including presigned URL generation) carries
// the Supabase JWT.
const getSupabaseToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
};

// Attach the Supabase access token to every generated API client request.
setAuthTokenGetter(getSupabaseToken);

// Attach the same token to presigned-URL requests made by useUpload().
// Without this, POST /api/storage/uploads/request-url would return 401.
setUploadAuthTokenGetter(getSupabaseToken);

createRoot(document.getElementById('root')!).render(<App />);
