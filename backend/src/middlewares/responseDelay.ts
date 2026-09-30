import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

// Delays every response by the configured API_RESPONSE_DELAY (milliseconds).
// The value comes only from the environment — there is no default here,
// a missing or invalid value fails the boot in config/env.ts.
export function responseDelay(_req: Request, _res: Response, next: NextFunction): void {
  if (env.API_RESPONSE_DELAY <= 0) {
    next();
    return;
  }
  setTimeout(next, env.API_RESPONSE_DELAY);
}
