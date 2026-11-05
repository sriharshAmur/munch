import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
  Navigate,
} from '@tanstack/react-router';
import { DataProvider, useData } from './data/provider';
import { Shell } from './components/Shell';
import { Start } from './routes/start';
import { SearchSchema } from './lib/search';
import { Toaster } from './components/ui/sonner';
import { Skeleton } from './components/ui/skeleton';
import { TooltipProvider } from './components/ui/tooltip';
import './styles/app.css';
// Each page is its own chunk, so the start page never downloads the charts, the table or the stories.
const Home = lazy(() => import('./home/Home').then((m) => ({ default: m.Home })));
const Orders = lazy(() => import('./routes/orders').then((m) => ({ default: m.Orders })));
const Places = lazy(() => import('./routes/places').then((m) => ({ default: m.Places })));
// A tab left open across a deploy asks for page chunks that are gone; reload once to get the new build.
window.addEventListener('vite:preloadError', () => {
  if (sessionStorage.getItem('munch-reloaded')) return;
  sessionStorage.setItem('munch-reloaded', '1');
  location.reload();
});
const rootRoute = createRootRoute({
  component: Shell,
  validateSearch: (input) => SearchSchema.parse(input),
});
function Ready({ children }: { children: React.ReactNode }) {
  const { state } = useData();
  const wait = <Skeleton className="h-80 w-full" />;
  return state.kind === 'loading' ? (
    wait
  ) : state.kind === 'empty' ? (
    <Navigate to="/start" />
  ) : (
    <Suspense fallback={wait}>{children}</Suspense>
  );
}
const routes = [
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    component: () => (
      <Ready>
        <Home />
      </Ready>
    ),
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/start',
    component: Start,
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/orders',
    component: () => (
      <Ready>
        <Orders />
      </Ready>
    ),
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: '/places',
    component: () => (
      <Ready>
        <Places />
      </Ready>
    ),
  }),
];
const router = createRouter({
  routeTree: rootRoute.addChildren(routes),
  basepath: import.meta.env.BASE_URL.replace(/\/$/, '') || '/',
});
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
const root = document.getElementById('root');
if (root)
  createRoot(root).render(
    <DataProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster visibleToasts={1} />
      </TooltipProvider>
    </DataProvider>,
  );
