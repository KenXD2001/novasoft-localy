import { z } from 'zod';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { isDbUnreachable } from '../utils/db.js';
import { asyncHandler, fail, ok } from '../utils/response.js';
import { checkServicesHealth, toAddress, type ServiceHealth } from '../utils/serviceHealth.js';
import {
  isRunnableService,
  restartManagedService,
  startManagedService,
  stopManagedService,
  type RunnableService,
} from '../utils/serviceRunner.js';

const ServiceType = z.enum(['API', 'UI']);
const ServiceStatus = z.enum(['Running', 'Stopped']);

const ServiceFields = {
  service_directory: z.string().trim().max(500, 'Service directory must be 500 characters or less').optional().default(''),
  run_command: z.string().trim().max(1000, 'Run command must be 1000 characters or less').optional().default(''),
};

const AddServiceSchema = z.object({
  project_id: z.string().trim().min(1, 'project_id is required'),
  name: z.string().trim().min(1, 'Service name is required').max(100, 'Service name must be 100 characters or less'),
  type: ServiceType,
  host: z.string().trim().min(1, 'Host is required').max(255, 'Host must be 255 characters or less'),
  port: z.coerce.number().int('Port must be an integer').min(1, 'Port must be between 1 and 65535').max(65535, 'Port must be between 1 and 65535'),
  status: ServiceStatus.optional(),
  ...ServiceFields,
});

const GetProjectServicesSchema = z.object({
  project_id: z.string().trim().min(1, 'project_id is required'),
  search: z.string().trim().max(100).optional().default(''),
  status: z.enum(['All', 'Running', 'Stopped']).catch('All'),
  type: z.enum(['All', 'API', 'UI']).catch('All'),
});

const ServiceIdParams = z.object({
  service_id: z.string().trim().min(1, 'service_id is required'),
});

const GetServiceLogsSchema = ServiceIdParams.extend({
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

const UpdateServiceSchema = z.object({
  service_id: z.string().trim().min(1, 'service_id is required'),
  name: z.string().trim().min(1, 'Service name is required').max(100, 'Service name must be 100 characters or less'),
  type: ServiceType,
  host: z.string().trim().min(1, 'Host is required').max(255, 'Host must be 255 characters or less'),
  port: z.coerce.number().int('Port must be an integer').min(1, 'Port must be between 1 and 65535').max(65535, 'Port must be between 1 and 65535'),
  status: ServiceStatus.optional(),
  ...ServiceFields,
});

function toServiceDTO(
  s: {
    id: string;
    projectId: string;
    name: string;
    type: string;
    host: string;
    port: number;
    status: string;
    serviceDirectory: string;
    runCommand: string;
    createdAt: Date;
    updatedAt: Date;
  },
  health: ServiceHealth,
) {
  return {
    id: s.id,
    project_id: s.projectId,
    name: s.name,
    type: s.type,
    host: s.host,
    port: s.port,
    address: toAddress(s.host, s.port),
    status: s.status,
    service_directory: s.serviceDirectory,
    run_command: s.runCommand,
    runnable: isRunnableService(s.serviceDirectory, s.runCommand),
    health: health.status,
    http_status: health.httpStatus,
    latency_ms: health.latencyMs,
    public_url: '',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export const addService = asyncHandler(async (req: Request, res: Response) => {
  const parsed = AddServiceSchema.safeParse(req.body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join('.') || 'body',
      message: i.message,
    }));
    return fail(res, 'Validation failed', 400, details);
  }

  try {
    // project_id accepts a database id or an exact project name, so callers
    // holding a name (or a legacy slug-era reference) still resolve.
    const project = await prisma.project.findFirst({
      where: { OR: [{ id: parsed.data.project_id }, { name: parsed.data.project_id }] },
    });
    if (!project) {
      return fail(res, 'Project not found', 404);
    }

    const service = await prisma.service.create({
      data: {
        projectId: project.id,
        name: parsed.data.name,
        type: parsed.data.type,
        host: parsed.data.host,
        port: parsed.data.port,
        status: parsed.data.status ?? project.status,
        serviceDirectory: parsed.data.service_directory,
        runCommand: parsed.data.run_command,
      },
    });
    const [health] = await checkServicesHealth(
      [{ host: service.host, port: service.port }],
      env.HEALTH_CHECK_TIMEOUT_MS,
    );
    return ok(res, toServiceDTO(service, health), 201);
  } catch (err) {
    if (isDbUnreachable(err)) {
      return fail(res, 'Database unavailable, please try again later', 503);
    }
    if ((err as { code?: string })?.code === 'P2002') {
      return fail(res, 'A service with this name already exists in this project', 409);
    }
    throw err;
  }
});

export const deleteService = asyncHandler(async (req: Request, res: Response) => {
  const parsed = ServiceIdParams.safeParse(req.query);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join('.') || 'query',
      message: i.message,
    }));
    return fail(res, 'Validation failed', 400, details);
  }

  try {
    const service = await prisma.service.delete({ where: { id: parsed.data.service_id } });
    return ok(res, { id: service.id, name: service.name, message: `Service "${service.name}" deleted` });
  } catch (err) {
    if (isDbUnreachable(err)) {
      return fail(res, 'Database unavailable, please try again later', 503);
    }
    if ((err as { code?: string })?.code === 'P2025') {
      return fail(res, 'Service not found', 404);
    }
    throw err;
  }
});

export const updateService = asyncHandler(async (req: Request, res: Response) => {
  const parsed = UpdateServiceSchema.safeParse(req.body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join('.') || 'body',
      message: i.message,
    }));
    return fail(res, 'Validation failed', 400, details);
  }

  try {
    const service = await prisma.service.update({
      where: { id: parsed.data.service_id },
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        host: parsed.data.host,
        port: parsed.data.port,
        serviceDirectory: parsed.data.service_directory,
        runCommand: parsed.data.run_command,
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
      },
    });
    const [health] = await checkServicesHealth(
      [{ host: service.host, port: service.port }],
      env.HEALTH_CHECK_TIMEOUT_MS,
    );
    return ok(res, { ...toServiceDTO(service, health), message: `Service "${service.name}" updated` });
  } catch (err) {
    if (isDbUnreachable(err)) {
      return fail(res, 'Database unavailable, please try again later', 503);
    }
    if ((err as { code?: string })?.code === 'P2025') {
      return fail(res, 'Service not found', 404);
    }
    if ((err as { code?: string })?.code === 'P2002') {
      return fail(res, 'A service with this name already exists in this project', 409);
    }
    throw err;
  }
});

async function controlService(
  res: Response,
  body: unknown,
  run: (service: RunnableService) => Promise<unknown>,
  pastTense: string,
) {
  const parsed = ServiceIdParams.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join('.') || 'body',
      message: i.message,
    }));
    return fail(res, 'Validation failed', 400, details);
  }

  try {
    const service = await prisma.service.findUnique({ where: { id: parsed.data.service_id } });
    if (!service) {
      return fail(res, 'Service not found', 404);
    }
    if (!isRunnableService(service.serviceDirectory, service.runCommand)) {
      return fail(res, 'Service has no working directory or run command configured', 400);
    }
    try {
      await run(service);
    } catch (err) {
      if ((err as Error)?.message === 'SERVICE_DIR_NOT_FOUND') {
        return fail(res, 'Service directory does not exist', 400);
      }
      throw err;
    }
    const updated = await prisma.service.findUniqueOrThrow({ where: { id: service.id } });
    const [health] = await checkServicesHealth(
      [{ host: updated.host, port: updated.port }],
      env.HEALTH_CHECK_TIMEOUT_MS,
    );
    return ok(res, { ...toServiceDTO(updated, health), message: `Service "${updated.name}" ${pastTense}` });
  } catch (err) {
    if (isDbUnreachable(err)) {
      return fail(res, 'Database unavailable, please try again later', 503);
    }
    throw err;
  }
}

export const startService = asyncHandler(async (req: Request, res: Response) =>
  controlService(res, req.body, startManagedService, 'started'),
);

export const stopService = asyncHandler(async (req: Request, res: Response) =>
  controlService(res, req.body, stopManagedService, 'stopped'),
);

export const restartService = asyncHandler(async (req: Request, res: Response) =>
  controlService(res, req.body, restartManagedService, 'restarted'),
);

export const getServiceLogs = asyncHandler(async (req: Request, res: Response) => {
  const parsed = GetServiceLogsSchema.safeParse(req.query);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join('.') || 'query',
      message: i.message,
    }));
    return fail(res, 'Validation failed', 400, details);
  }

  try {
    const service = await prisma.service.findUnique({ where: { id: parsed.data.service_id } });
    if (!service) {
      return fail(res, 'Service not found', 404);
    }
    const [logs, total] = await Promise.all([
      prisma.serviceLog.findMany({
        where: { serviceId: service.id },
        orderBy: { createdAt: 'desc' },
        take: parsed.data.limit,
      }),
      prisma.serviceLog.count({ where: { serviceId: service.id } }),
    ]);
    return ok(res, { logs, total });
  } catch (err) {
    if (isDbUnreachable(err)) {
      return fail(res, 'Database unavailable, please try again later', 503);
    }
    throw err;
  }
});

export const clearServiceLogs = asyncHandler(async (req: Request, res: Response) => {
  const parsed = ServiceIdParams.safeParse(req.query);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join('.') || 'query',
      message: i.message,
    }));
    return fail(res, 'Validation failed', 400, details);
  }

  try {
    const service = await prisma.service.findUnique({ where: { id: parsed.data.service_id } });
    if (!service) {
      return fail(res, 'Service not found', 404);
    }
    const { count } = await prisma.serviceLog.deleteMany({ where: { serviceId: service.id } });
    return ok(res, {
      deleted: count,
      message: count === 1 ? 'Cleared 1 log line' : `Cleared ${count} log lines`,
    });
  } catch (err) {
    if (isDbUnreachable(err)) {
      return fail(res, 'Database unavailable, please try again later', 503);
    }
    throw err;
  }
});

export const getProjectServices = asyncHandler(async (req: Request, res: Response) => {
  const parsed = GetProjectServicesSchema.safeParse(req.query);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => ({
      field: i.path.join('.') || 'query',
      message: i.message,
    }));
    return fail(res, 'Validation failed', 400, details);
  }

  const { project_id, search, status, type } = parsed.data;

  try {
    // project_id accepts a database id or an exact project name (see addService).
    const project = await prisma.project.findFirst({
      where: { OR: [{ id: project_id }, { name: project_id }] },
    });
    if (!project) {
      return fail(res, 'Project not found', 404);
    }

    const where = {
      projectId: project_id,
      AND: [
        search === ''
          ? {}
          : {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { host: { contains: search, mode: 'insensitive' as const } },
                { type: { contains: search, mode: 'insensitive' as const } },
              ],
            },
        status === 'All' ? {} : { status },
        type === 'All' ? {} : { type },
      ],
    };

    const [services, filtered, total] = await Promise.all([
      prisma.service.findMany({ where, orderBy: { name: 'asc' } }),
      prisma.service.count({ where }),
      prisma.service.count({ where: { projectId: project_id } }),
    ]);

    const healths = await checkServicesHealth(services, env.HEALTH_CHECK_TIMEOUT_MS);

    return ok(res, { services: services.map((s, i) => toServiceDTO(s, healths[i])), filtered, total });
  } catch (err) {
    if (isDbUnreachable(err)) {
      return fail(res, 'Database unavailable, please try again later', 503);
    }
    throw err;
  }
});
