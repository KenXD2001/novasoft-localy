import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { ok, asyncHandler } from '../utils/response.js';

const bootTime = Date.now();

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  let database: 'up' | 'down' = 'up';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'down';
  }

  return ok(res, {
    status: 'ok',
    env: env.NODE_ENV,
    uptimeSeconds: Math.floor((Date.now() - bootTime) / 1000),
    timestamp: new Date().toISOString(),
    database,
  });
});

export const getReadiness = asyncHandler(async (_req: Request, res: Response) => {
  await prisma.$queryRaw`SELECT 1`; // throws -> 500 via error middleware
  return ok(res, { ready: true });
});
