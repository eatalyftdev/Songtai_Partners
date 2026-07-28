import { Redirect } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';

/**
 * Wraps any admin page: shows a spinner while the session is resolving,
 * redirects to /admin/login if there is no active session.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Redirect to="/admin/login" />;
  }

  return <>{children}</>;
}
