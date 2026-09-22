import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'

// No fallbacks: dev server and builds refuse to start without valid config.
function loadStrictConfig(mode: string) {
  const raw = loadEnv(mode, process.cwd());
  const host = raw.VITE_HOST;
  if (!host) {
    throw new Error('[config] Missing VITE_HOST. Copy frontend/.env.example to frontend/.env and fill it in.');
  }
  const port = Number(raw.VITE_PORT);
  if (!raw.VITE_PORT || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`[config] VITE_PORT must be an integer 1-65535, got ${JSON.stringify(raw.VITE_PORT)}.`);
  }
  if (raw.VITE_APP_ENV !== 'development' && raw.VITE_APP_ENV !== 'production') {
    throw new Error(`[config] VITE_APP_ENV must be "development" or "production", got ${JSON.stringify(raw.VITE_APP_ENV)}.`);
  }
  return { host, port };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { host, port } = loadStrictConfig(mode);
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
    server: { host, port, strictPort: true },
  };
})
