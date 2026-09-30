import { z } from 'zod';
import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { isDbUnreachable } from '../utils/db.js';
import { asyncHandler, fail, ok } from '../utils/response.js';

const CreateProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(100, 'Project name must be 100 characters or less'),
  category: z.string().trim().min(1, 'Category is required').max(50, 'Category must be 50 characters or less'),
  description: z.string().trim().max(500, 'Description must be 500 characters or less').optional().default(''),
});

const GetProjectsSchema = z.object({
  search: z.string().trim().max(100).optional().default(''),
  status: z.enum(['All', 'Running', 'Stopped']).catch('All'),
  category: z.string().trim().max(50).optional().default('All'),
  sort: z.enum(['asc', 'desc']).catch('asc'),
});

const GetProjectSchema = z.object({
  project_id: z.string().trim().min(1, 'project_id is required').max(100),
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const parsed = GetProjectSchema.safeParse(req.query);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join('.') || 'query',
      message: i.message,
    }));
    return fail(res, 'Validation failed', 400, details);
  }

  try {
    // project_id accepts a database id or an exact project name, so overview
    // pages holding a stale reference still resolve to the real project.
    const project = await prisma.project.findFirst({
      where: { OR: [{ id: parsed.data.project_id }, { name: parsed.data.project_id }] },
    });
    if (!project) {
      return fail(res, 'Project not found', 404);
    }
    return ok(res, project);
  } catch (err) {
    if (isDbUnreachable(err)) {
      return fail(res, 'Database unavailable, please try again later', 503);
    }
    throw err;
  }
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const parsed = CreateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join('.') || 'body',
      message: i.message,
    }));
    return fail(res, 'Validation failed', 400, details);
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        category: parsed.data.category,
        description: parsed.data.description,
        status: 'Stopped',
      },
    });
    return ok(res, project, 201);
  } catch (err) {
    if (isDbUnreachable(err)) {
      return fail(res, 'Database unavailable, please try again later', 503);
    }
    if ((err as { code?: string })?.code === 'P2002') {
      return fail(res, 'A project with this name already exists', 409);
    }
    throw err;
  }
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const parsed = GetProjectsSchema.safeParse(req.query);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join('.') || 'query',
      message: i.message,
    }));
    return fail(res, 'Validation failed', 400, details);
  }

  const { search, status, category, sort } = parsed.data;

  const where =
    search === '' && status === 'All' && category === 'All'
      ? {}
      : {
          AND: [
            search === ''
              ? {}
              : {
                  OR: [
                    { name: { contains: search, mode: 'insensitive' as const } },
                    { description: { contains: search, mode: 'insensitive' as const } },
                    { category: { contains: search, mode: 'insensitive' as const } },
                  ],
                },
            status === 'All' ? {} : { status },
            category === 'All' ? {} : { category },
          ],
        };

  try {
    const [projects, filtered, total, categoryRows] = await Promise.all([
      prisma.project.findMany({ where, orderBy: { name: sort } }),
      prisma.project.count({ where }),
      prisma.project.count(),
      prisma.project.findMany({ distinct: ['category'], select: { category: true }, orderBy: { category: 'asc' } }),
    ]);

    return ok(res, {
      projects,
      filtered,
      total,
      categories: categoryRows.map((r) => r.category),
    });
  } catch (err) {
    if (isDbUnreachable(err)) {
      return fail(res, 'Database unavailable, please try again later', 503);
    }
    throw err;
  }
});
