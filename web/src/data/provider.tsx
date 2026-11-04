import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { get, set, del } from 'idb-keyval';
import { toast } from 'sonner';
import { OrdersFileSchema, type OrdersFile } from '@core/schema';
type DataState =
  | { kind: 'loading' }
  | { kind: 'empty'; error?: string }
  | { kind: 'ready'; file: OrdersFile; demo: boolean };
const DataContext = createContext<{
  state: DataState;
  loadDemo: () => Promise<void>;
  openFile: (file: File) => Promise<void>;
  forget: () => Promise<void>;
}>({
  state: { kind: 'loading' },
  loadDemo: async () => {},
  openFile: async () => {},
  forget: async () => {},
});
const errorText =
  "This file isn't a Munch orders file. Run munch build and open data/orders.json.";
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({ kind: 'loading' });
  async function loadDemo() {
    try {
      const response = await fetch('/demo/orders.json');
      const file = OrdersFileSchema.parse(await response.json());
      localStorage.setItem('munch-demo', 'true');
      setState({ kind: 'ready', file, demo: true });
    } catch {
      setState({
        kind: 'empty',
        error: 'The demo could not be opened. Reload the page and try again.',
      });
    }
  }
  async function openFile(input: File) {
    try {
      const file = OrdersFileSchema.parse(JSON.parse(await input.text()));
      await set('munch-orders', file);
      localStorage.removeItem('munch-demo');
      setState({ kind: 'ready', file, demo: false });
      toast(`Loaded ${file.orders.length.toLocaleString('en-GB')} orders`);
    } catch {
      toast.error(errorText);
    }
  }
  async function forget() {
    await del('munch-orders');
    localStorage.removeItem('munch-demo');
    setState({ kind: 'empty' });
  }
  useEffect(() => {
    let live = true;
    async function load() {
      try {
        if (
          new URLSearchParams(location.search)
            .get('demo')
            ?.replaceAll('"', '') === '1'
        ) {
          await loadDemo();
          return;
        }
        const saved: unknown = await get('munch-orders');
        if (saved) {
          const file = OrdersFileSchema.parse(saved);
          if (live) setState({ kind: 'ready', file, demo: false });
          return;
        }
        if (import.meta.env.DEV) {
          const response = await fetch('/local/orders.json');
          if (response.ok) {
            const file = OrdersFileSchema.parse(await response.json());
            if (live) setState({ kind: 'ready', file, demo: false });
            return;
          }
        }
        if (localStorage.getItem('munch-demo') === 'true') {
          await loadDemo();
          return;
        }
        if (live) setState({ kind: 'empty' });
      } catch {
        if (live) setState({ kind: 'empty', error: errorText });
      }
    }
    void load();
    const refresh = () => {
      if (new URLSearchParams(location.search).has('demo')) return;
      void load();
    };
    import.meta.hot?.on('munch:local-updated', refresh);
    return () => {
      live = false;
      import.meta.hot?.off('munch:local-updated', refresh);
    };
  }, []);
  return (
    <DataContext.Provider value={{ state, loadDemo, openFile, forget }}>
      {children}
    </DataContext.Provider>
  );
}
export const useData = () => useContext(DataContext);
