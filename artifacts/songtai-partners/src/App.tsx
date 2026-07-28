import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { I18nProvider } from '@/lib/i18n';

// Pages
import Home from './pages/Home';
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
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/partners" component={PartnersList} />
      <Route path="/admin/partners/new" component={PartnerNew} />
      <Route path="/admin/partners/:id" component={PartnerEdit} />
      <Route path="/admin/products" component={ProductsList} />
      <Route path="/admin/gallery" component={GalleryManage} />
      <Route path="/admin/testimonials" component={TestimonialsManage} />
      <Route path="/admin/faq" component={FaqManage} />
      <Route path="/admin/about" component={AboutEdit} />
      
      {/* Public Partner Route */}
      <Route path="/p/:slug" component={PartnerSite} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
