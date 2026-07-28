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

function Router() {
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
      <Route path="/p/:slug" component={PartnerSite} />

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
