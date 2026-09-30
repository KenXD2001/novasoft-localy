import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { prisma } from '../config/prisma.js';
import { EnvSchema } from '../config/env.js';

// ponytail: pids live in memory — a backend restart orphans previously
// started processes; persist pids (or adopt a supervisor) if that matters.
const children = new Map<string, ChildProcess>();

const LOG_CHUNK_LIMIT = 4000;

export function isRunnableService(serviceDirectory: string, runCommand: string): boolean {
  return serviceDirectory.trim() !== '' && runCommand.trim() !== '';
}

export function truncateLogChunk(text: string): string {
  return text.length > LOG_CHUNK_LIMIT ? text.slice(0, LOG_CHUNK_LIMIT) : text;
}

async function appendLog(serviceId: string, logText: string, level = 'info', source = 'system'): Promise<void> {
  try {
    await prisma.serviceLog.create({ data: { serviceId, level, source, logText: truncateLogChunk(logText) } });
  } catch {
    // ponytail: log writes never fail start/stop — the exit row below still lands when the DB recovers
  }
}

export function isServiceProcessRunning(serviceId: string): boolean {
  const child = children.get(serviceId);
  return !!child && child.exitCode === null && !child.killed;
}

export interface RunnableService {
  id: string;
  name: string;
  serviceDirectory: string;
  runCommand: string;
  host: string;
  port: number;
}

// The child must not inherit Localy's own config (PORT, DATABASE_URL, ...):
// dotenv never overrides existing vars, so inherited values would shadow the
// service's own .env. Strip every Localy-owned key, then force PORT/HOST
// from the service record so the app binds where the health probe expects.
export function childEnv(service: { host: string; port: number }): Record<string, string> {
  const owned = new Set(Object.keys(EnvSchema.shape));
  const childEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!owned.has(key) && value !== undefined) childEnv[key] = value;
  }
  childEnv.HOST = service.host;
  childEnv.PORT = String(service.port);
  return childEnv;
}

export async function startManagedService(service: RunnableService): Promise<void> {
  if (isServiceProcessRunning(service.id)) return;
  if (!isRunnableService(service.serviceDirectory, service.runCommand)) {
    throw new Error('SERVICE_NOT_RUNNABLE');
  }
  if (!existsSync(service.serviceDirectory)) {
    throw new Error('SERVICE_DIR_NOT_FOUND');
  }
  const child = spawn(service.runCommand, {
    cwd: service.serviceDirectory,
    shell: true,
    windowsHide: true,
    env: childEnv(service),
  });
  children.set(service.id, child);
  child.stdout?.on('data', (d) => void appendLog(service.id, String(d), 'info', 'stdout'));
  child.stderr?.on('data', (d) => void appendLog(service.id, String(d), 'error', 'stderr'));
  child.on('error', (err) =>
    void (async () => {
      children.delete(service.id);
      await appendLog(service.id, `Failed to start: ${err.message}`, 'error', 'system');
      await prisma.service.update({ where: { id: service.id }, data: { status: 'Stopped' } }).catch(() => undefined);
    })(),
  );
  child.on('exit', (code, signal) =>
    void (async () => {
      children.delete(service.id);
      await appendLog(
        service.id,
        `Process exited (code=${code ?? 'null'}, signal=${signal ?? 'none'})`,
        code === 0 ? 'info' : 'error',
        'system',
      );
      await prisma.service.update({ where: { id: service.id }, data: { status: 'Stopped' } }).catch(() => undefined);
    })(),
  );
  await prisma.service.update({ where: { id: service.id }, data: { status: 'Running' } });
  await appendLog(service.id, `Started "${service.runCommand}" in ${service.serviceDirectory}`, 'info', 'system');
}

export async function stopManagedService(service: { id: string; name: string }): Promise<boolean> {
  const child = children.get(service.id);
  if (!child) {
    await prisma.service.update({ where: { id: service.id }, data: { status: 'Stopped' } }).catch(() => undefined);
    return false;
  }
  children.delete(service.id);
  try {
    if (process.platform === 'win32' && child.pid !== undefined) {
      const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true });
      await new Promise<void>((resolve) => {
        killer.on('exit', () => resolve());
        killer.on('error', () => resolve());
      });
    } else {
      child.kill('SIGTERM');
    }
  } catch {
    // already gone — the status update below still applies
  }
  await prisma.service.update({ where: { id: service.id }, data: { status: 'Stopped' } });
  await appendLog(service.id, `Stopped "${service.name}"`, 'info', 'system');
  return true;
}

export async function restartManagedService(service: RunnableService): Promise<void> {
  await stopManagedService(service);
  await startManagedService(service);
}
