import type { Request, Response } from 'express';
import { fail } from '../utils/response.js';

export function notFound(_req: Request, res: Response): void {
  fail(res, 'Route not found', 404);
}
