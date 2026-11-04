import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { availableHomes } from '@core/analyze/filter';
import { loadHomeNames } from './home-names';
import { get, set, del } from 'idb-keyval';
import { toast } from 'sonner';
import { OrdersFileSchema, type OrdersFile } from '@core/schema';
type DataState =
  | { kind: 'loading' }
  | { kind: 'empty'; error?: string }
  | {
      kind: 'ready';
      file: OrdersFile;
      demo: boolean;
      homeNames: Record<string, string>;
    };
const DataContext = createContext<{
  state: DataState;
  loadDemo: () => Promise<void>;
  openFile: (file: File) => Promise<void>;
  forget: () => Promise<void>;
  renameHome: (key: string, name: string) => void;
}>({
  state: { kind: 'loading' },
  loadDemo: async () => {},
  openFile: async () => {},
  forget: async () => {},
  renameHome: () => {},
});
const errorText =
  "This file isn't a Munch orders file. Run munch build and open data/orders.json.";
export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataState>({ kind: 'loading' });
  async function loadDemo() {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}demo/orders.json`);
      const file = OrdersFileSchema.parse(await response.json());
      localStorage.setItem('munch-demo', 'true');
      const homeNames = await loadHomeNames(file, true);
      setState({ kind: 'ready', file, demo: true, homeNames });
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
      setState({
        kind: 'ready',
        file,
        demo: false,
        homeNames: await loadHomeNames(file, false),
      });
      toast(`Loaded ${file.orders.length.toLocaleString('en-GB')} orders`);
    } catch {
      toast.error(errorText);
    }
  }
  function renameHome(key: string, name: string) {
    if (state.kind !== 'ready') return;
    localStorage.setItem(
      `munch-home-${state.demo ? 'demo' : 'local'}-${key}`,
      name,
    );
    setState({ ...state, homeNames: { ...state.homeNames, [key]: name } });
  }
  async function forget() {
    await del('munch-orders');
    localStorage.removeItem('munch-demo');
    for (const key of Object.keys(localStorage))
      if (key.startsWith('munch-home-local-')) localStorage.removeItem(key);
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
          if (live)
            setState({
              kind: 'ready',
              file,
              demo: false,
              homeNames: await loadHomeNames(file, false),
            });
          return;
        }
        if (import.meta.env.DEV) {
          const response = await fetch('/local/orders.json');
          if (response.ok) {
            const file = OrdersFileSchema.parse(await response.json());
            if (live)
              setState({
                kind: 'ready',
                file,
                demo: false,
                homeNames: await loadHomeNames(file, false),
              });
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
    <DataContext.Provider
      value={{ state, loadDemo, openFile, forget, renameHome }}
    >
      {children}
    </DataContext.Provider>
  );
}
export const useData = () => useContext(DataContext);

export function useHomeName() {
  const { state } = useData();
  const homes = state.kind === 'ready' ? availableHomes(state.file.orders) : [];
  return (key: string) =>
    state.kind === 'ready'
      ? (state.homeNames[key] ??
        `Home ${
          Math.max(
            0,
            homes.findIndex((h) => h.key === key),
          ) + 1
        }`)
      : 'Home';
}
