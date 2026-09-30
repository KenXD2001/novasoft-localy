import 'dotenv/config';
import { z } from 'zod';

// Single source of truth for runtime config. No fallbacks:
// missing or invalid values throw at startup so a bad
// configuration fails loudly instead of silently running wrong.

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().min(1, 'HOST is required'),
  PORT: z.coerce.number().int().min(1).max(65535),
  API_PREFIX: z.string().startsWith('/').default('/api/v1'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL, e.g. postgresql://user:pass@localhost:5432/novasoft-locally-local'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().min(1).default('7d'),
  API_RESPONSE_DELAY: z.coerce
    .number()
    .int('API_RESPONSE_DELAY must be an integer number of milliseconds')
    .min(0, 'API_RESPONSE_DELAY must be 0 or greater')
    .max(60000, 'API_RESPONSE_DELAY must be 60000 or less'),
  HEALTH_CHECK_TIMEOUT_MS: z.coerce
    .number()
    .int('HEALTH_CHECK_TIMEOUT_MS must be an integer number of milliseconds')
    .min(500, 'HEALTH_CHECK_TIMEOUT_MS must be 500 or greater')
    .max(30000, 'HEALTH_CHECK_TIMEOUT_MS must be 30000 or less'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`[config] Invalid environment variables:\n${details}\nCopy backend/.env.example to backend/.env and fill it in.`);
}

export const env = {
  ...parsed.data,
  isDev: parsed.data.NODE_ENV === 'development',
  isProd: parsed.data.NODE_ENV === 'production',
} as const;
