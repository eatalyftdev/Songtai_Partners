import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';

import './index.css';

// When VITE_API_URL is set (e.g. on Vercel pointing to a deployed API),
// all generated API hooks will use that absolute URL instead of relative /api paths.
// Leave unset in Replit dev — the path-based proxy handles /api/* automatically.
if (import.meta.env.VITE_API_URL) {
  setBaseUrl(import.meta.env.VITE_API_URL);
}

createRoot(document.getElementById('root')!).render(<App />);
