import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import PartnersList from './pages/admin/PartnersList';
import PartnerNew from './pages/admin/PartnerNew';
import PartnerEdit from './pages/admin/PartnerEdit';
import ProductsList from './pages/admin/ProductsList';
import GalleryManage from './pages/admin/GalleryManage';
import TestimonialsManage from './pages/admin/TestimonialsManage';
import FaqManage from './pages/admin/FaqManage';
import AboutEdit from './pages/admin/AboutEdit';
import PartnerSite from './pages/partner/PartnerSite';
import { useGetPartnerByDomain } from '@workspace/api-client-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: true,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
    },
  },
});

// Helper: wrap a component in ProtectedRoute
function P({ component: C }: { component: React.ComponentType }) {
  return <ProtectedRoute><C /></ProtectedRoute>;
}

// This app's own known hostname(s) — comma-separated, e.g. the Railway
// default domain and/or a future custom production domain for the app
// itself (not to be confused with an individual PARTNER's custom domain,
// which is looked up dynamically below). Any hostname NOT in this list is
// treated as a possible partner custom domain (e.g. coachnelson.site)
// pointed at this same deployment.
const KNOWN_APP_HOSTNAMES = (import.meta.env.VITE_APP_HOSTNAMES ?? '')
  .split(',')
  .map((h: string) => h.trim().toLowerCase())
  .filter(Boolean);

function isKnownAppHostname(hostname: string): boolean {
  return (
    KNOWN_APP_HOSTNAMES.length === 0 ||
    KNOWN_APP_HOSTNAMES.includes(hostname) ||
    hostname === 'localhost' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.replit.dev')
  );
}

/**
 * Resolves a partner by the current browser hostname (a partner's own custom
 * domain, e.g. coachnelson.site, pointed at this same deployment) and renders
 * their site directly at "/" — no /p/:slug in the URL needed. A hostname that
 * doesn't match this app's own known domain(s) AND doesn't resolve to any
 * verified, active partner shows the same NotFound page as any other unknown
 * URL, never the main Songtai Partners homepage.
 */
function CustomDomainSite({ hostname }: { hostname: string }) {
  const { data: partner, isLoading, isError } = useGetPartnerByDomain({ hostname });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }
  if (isError || !partner) {
    return <NotFound />;
  }
  return <PartnerSite slugOverride={partner.slug} />;
}

function Router() {
  const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';

  if (hostname && !isKnownAppHostname(hostname)) {
    return <CustomDomainSite hostname={hostname} />;
  }

  return (
    <Switch>
      <Route path="/" component={Home} />

      {/* Auth */}
      <Route path="/admin/login" component={AdminLogin} />

      {/* Protected admin routes */}
      <Route path="/admin" component={() => <P component={AdminDashboard} />} />
      <Route path="/admin/partners/new" component={() => <P component={PartnerNew} />} />
      <Route path="/admin/partners/:id" component={() => <P component={PartnerEdit} />} />
      <Route path="/admin/partners" component={() => <P component={PartnersList} />} />
      <Route path="/admin/products" component={() => <P component={ProductsList} />} />
      <Route path="/admin/gallery" component={() => <P component={GalleryManage} />} />
      <Route path="/admin/testimonials" component={() => <P component={TestimonialsManage} />} />
      <Route path="/admin/faq" component={() => <P component={FaqManage} />} />
      <Route path="/admin/about" component={() => <P component={AboutEdit} />} />

      {/* Public partner site */}
      <Route path="/p/:slug" component={() => <PartnerSite />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
