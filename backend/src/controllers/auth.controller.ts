import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { isDbUnreachable } from '../utils/db.js';
import { asyncHandler, fail, ok } from '../utils/response.js';

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join('.') || 'body',
      message: i.message,
    }));
    return fail(res, 'Validation failed', 400, details);
  }

  let user;
  try {
    user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  } catch (err) {
    if (isDbUnreachable(err)) {
      return fail(res, 'Database unavailable, please try again later', 503);
    }
    throw err;
  }

  // Same message for unknown email and wrong password (no account enumeration).
  if (!user) {
    return fail(res, 'Invalid email or password', 401);
  }

  const match = await bcrypt.compare(parsed.data.password, user.password);
  if (!match) {
    return fail(res, 'Invalid email or password', 401);
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as unknown as jwt.SignOptions['expiresIn'],
  });

  return ok(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    token,
  });
});
