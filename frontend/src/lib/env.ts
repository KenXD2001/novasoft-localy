// Single source of truth for runtime config.
// No fallbacks: missing or invalid values throw at startup so a bad
// configuration fails loudly instead of silently running with defaults.

export type AppEnv = "development" | "production";

function required(name: "VITE_HOST" | "VITE_PORT" | "VITE_APP_ENV"): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `[config] Missing required env var ${name}. Copy frontend/.env.example to frontend/.env and fill it in.`
    );
  }
  return value;
}

function parsePort(raw: string): number {
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`[config] VITE_PORT must be an integer 1-65535, got ${JSON.stringify(raw)}.`);
  }
  return port;
}

function parseAppEnv(raw: string): AppEnv {
  if (raw !== "development" && raw !== "production") {
    throw new Error(`[config] VITE_APP_ENV must be "development" or "production", got ${JSON.stringify(raw)}.`);
  }
  return raw;
}

export const env = {
  HOST: required("VITE_HOST"),
  PORT: parsePort(required("VITE_PORT")),
  APP_ENV: parseAppEnv(required("VITE_APP_ENV")),
} as const;
