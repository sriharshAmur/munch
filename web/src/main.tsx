import {createRoot} from 'react-dom/client';
import {createRouter,createRootRoute,createRoute,RouterProvider,Navigate} from '@tanstack/react-router';
import {DataProvider,useData} from './data/provider';
import {Shell} from './components/Shell';
import {Start} from './routes/start';
import {Story} from './routes/story';
import {Orders,Places} from './routes/explorer';
import {SearchSchema} from './lib/search';
import {Toaster} from './components/ui/sonner';
import {Skeleton} from './components/ui/skeleton';
import {TooltipProvider} from './components/ui/tooltip';
import './styles/app.css';
const rootRoute=createRootRoute({component:Shell,validateSearch:input=>SearchSchema.parse(input)});
function Ready({children}:{children:React.ReactNode}){const {state}=useData();return state.kind==='loading'?<Skeleton className="h-80 w-full"/>:state.kind==='empty'?<Navigate to="/start"/>:children;}
const routes=[createRoute({getParentRoute:()=>rootRoute,path:'/',component:()=> <Ready><Story/></Ready>}),createRoute({getParentRoute:()=>rootRoute,path:'/start',component:Start}),createRoute({getParentRoute:()=>rootRoute,path:'/orders',component:()=> <Ready><Orders/></Ready>}),createRoute({getParentRoute:()=>rootRoute,path:'/places',component:()=> <Ready><Places/></Ready>})];
const router=createRouter({routeTree:rootRoute.addChildren(routes)});
declare module '@tanstack/react-router' {interface Register {router:typeof router}}
const root=document.getElementById('root');if(root)createRoot(root).render(<DataProvider><TooltipProvider><RouterProvider router={router}/><Toaster visibleToasts={1}/></TooltipProvider></DataProvider>);
