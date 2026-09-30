import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { fail } from '../utils/response.js';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  const message = err instanceof Error ? err.message : 'Internal server error';
  if (!env.isProd) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }
  fail(res, env.isProd ? 'Internal server error' : message, 500);
}
