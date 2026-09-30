import type { NextFunction, Request, Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: { message: string; details?: unknown };
  meta?: { timestamp: string };
}

export function ok<T>(res: Response, data: T, statusCode = 200): Response {
  const body: ApiResponse<T> = { success: true, data, meta: { timestamp: new Date().toISOString() } };
  return res.status(statusCode).json(body);
}

export function fail(res: Response, message: string, statusCode = 500, details?: unknown): Response {
  const body: ApiResponse = {
    success: false,
    error: { message, details },
    meta: { timestamp: new Date().toISOString() },
  };
  return res.status(statusCode).json(body);
}

// Wrap async route handlers so rejected promises reach the error middleware.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
