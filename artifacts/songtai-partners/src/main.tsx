import { createRoot } from 'react-dom/client';
import { setBaseUrl, setAuthTokenGetter } from '@workspace/api-client-react';
import { setUploadAuthTokenGetter } from '@workspace/object-storage-web';
import { getAdminToken } from './lib/auth';

import App from './App';

import './index.css';

// When VITE_API_URL is set (e.g. on Vercel pointing to a deployed API),
// all generated API hooks will use that absolute URL instead of relative /api paths.
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

// Use the JWT stored in localStorage (set on admin login) for every
// authenticated request — both API client hooks and presigned-URL uploads.
const getToken = async (): Promise<string | null> => getAdminToken();

setAuthTokenGetter(getToken);
setUploadAuthTokenGetter(getToken);

createRoot(document.getElementById('root')!).render(<App />);
