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
import { Home } from './home/Home';
import { Orders } from './routes/orders';
import { Places } from './routes/places';
import { SearchSchema } from './lib/search';
import { Toaster } from './components/ui/sonner';
import { Skeleton } from './components/ui/skeleton';
import { TooltipProvider } from './components/ui/tooltip';
import './styles/app.css';
const rootRoute = createRootRoute({
  component: Shell,
  validateSearch: (input) => SearchSchema.parse(input),
});
function Ready({ children }: { children: React.ReactNode }) {
  const { state } = useData();
  return state.kind === 'loading' ? (
    <Skeleton className="h-80 w-full" />
  ) : state.kind === 'empty' ? (
    <Navigate to="/start" />
  ) : (
    children
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
