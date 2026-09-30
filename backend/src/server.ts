import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';

async function main() {
  const app = createApp();

  try {
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('[db] connected to PostgreSQL (novasoft-locally-local)');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] connection failed — is Postgres running? Run `npx prisma migrate dev`.', err);
    process.exit(1);
  }

  // ponytail: child pids live in memory — after a backend restart any
  // previously Running service is stale (single-instance local runner).
  // Flip to Stopped so the dashboard tells the truth; start again from UI.
  try {
    const stale = await prisma.service.findMany({ where: { status: 'Running' }, select: { id: true } });
    for (const s of stale) {
      await prisma.service.update({ where: { id: s.id }, data: { status: 'Stopped' } });
      await prisma.serviceLog.create({
        data: {
          serviceId: s.id,
          level: 'info',
          source: 'system',
          logText: 'Backend restarted — previous process is no longer tracked; start the service again from the dashboard.',
        },
      });
    }
    if (stale.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`[services] marked ${stale.length} stale Running service(s) as Stopped`);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[services] stale-status reconciliation failed (non-fatal)', err);
  }

  const server = app.listen(env.PORT, env.HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`[api] listening on http://${env.HOST}:${env.PORT} (${env.NODE_ENV})`);
    // eslint-disable-next-line no-console
    console.log(`[api] health: http://${env.HOST}:${env.PORT}${env.API_PREFIX}/health`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`[api] ${signal} received, shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void main();
