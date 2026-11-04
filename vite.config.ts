import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { createReadStream, existsSync } from 'node:fs';
const root = import.meta.dirname;
export default defineConfig({
  root: 'web',
  // The public site lives at sriharsh.com/munch/; MUNCH_BASE=/munch/ builds it there.
  base: process.env.MUNCH_BASE ?? '/',
  publicDir: 'public',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'local-orders',
      configureServer(server) {
        // MUNCH_DEMO_ONLY serves the made-up person only: screenshots and
        // automated checks must never see a real orders file.
        if (process.env.MUNCH_DEMO_ONLY) {
          server.middlewares.use('/local/', (_req, res) => {
            res.statusCode = 404;
            res.end();
          });
          return;
        }
        const localFile = resolve(root, 'data/orders.json');
        server.watcher.add(localFile);
        const notify = (path: string) => {
          if (path === localFile)
            server.ws.send({ type: 'custom', event: 'munch:local-updated' });
        };
        server.watcher.on('change', notify).on('add', notify);
        server.middlewares.use('/local/homes.json', (_req, res) => {
          const file = resolve(root, 'data/home-labels.json');
          if (!existsSync(file)) {
            res.statusCode = 404;
            res.end();
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          createReadStream(file).pipe(res);
        });
        server.middlewares.use('/local/orders.json', (_req, res) => {
          const file = resolve(root, 'data/orders.json');
          if (!existsSync(file)) {
            res.statusCode = 404;
            res.end();
            return;
          }
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store');
          createReadStream(file).pipe(res);
        });
      },
    },
  ],
  resolve: {
    alias: { '@': resolve(root, 'web/src'), '@core': resolve(root, 'core') },
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: [root],
      deny: [
        '**/.env',
        '**/.env.*',
        '**/*.{crt,pem}',
        '**/.git/**',
        resolve(root, 'curl.txt'),
        resolve(root, 'Curl.txt'),
        resolve(root, 'data/**'),
        resolve(root, 'shapes/**'),
        resolve(root, 'exports/**'),
      ],
    },
  },
  build: { outDir: '../dist', emptyOutDir: true },
});
