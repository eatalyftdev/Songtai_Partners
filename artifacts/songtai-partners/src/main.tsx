import { createRoot } from 'react-dom/client';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';
import { supabase } from './lib/supabase';

import App from './App';

import './index.css';

// When VITE_API_URL is set (e.g. on Vercel pointing to a deployed API),
// all generated API hooks will use that absolute URL instead of relative /api paths.
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

// Attach the Supabase access token to every API request so the server can
// verify identity on protected (write) endpoints.
setAuthTokenGetter(async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});

createRoot(document.getElementById('root')!).render(<App />);
