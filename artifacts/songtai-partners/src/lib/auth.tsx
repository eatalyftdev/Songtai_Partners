import { createContext, useContext, useEffect, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────

export type AdminUser = { id: string; email: string; name: string | null };

type AuthContextValue = {
  /** The currently signed-in admin, or null if not authenticated. */
  user: AdminUser | null;
  /** Alias kept for compatibility with ProtectedRoute which checks `session`. */
  session: { user: AdminUser } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
};

// ── Constants ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'songtai_admin_token';

function apiBase(): string {
  // VITE_API_URL: the API server origin (e.g. https://api.example.com).
  // Set this in deployment when the frontend and API are on different domains.
  // In dev, leave it unset — Vite proxies /api → localhost:8080 via vite.config.ts.
  const origin = import.meta.env.VITE_API_URL as string | undefined;
  if (origin) return origin.replace(/\/+$/, '') + '/api';
  return '/api';
}

// ── Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: verify the stored token against /api/auth/me
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${apiBase()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AdminUser | null) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const res = await fetch(`${apiBase()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error ?? 'Login failed' };
      localStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.admin);
      return { error: null };
    } catch {
      return { error: 'Network error — please try again' };
    }
  };

  const signOut = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session: user ? { user } : null,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ── Helper: get stored token for authenticated API calls ──────────────────

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
