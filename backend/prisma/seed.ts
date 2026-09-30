import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ashwin11', 10);

  const user = await prisma.user.upsert({
    where: { email: 'ashwinb708@gmail.com' },
    update: {
      name: 'Ashwin Bhardwaj',
      phone: '7972125618',
      password: passwordHash,
    },
    create: {
      name: 'Ashwin Bhardwaj',
      email: 'ashwinb708@gmail.com',
      phone: '7972125618',
      password: passwordHash,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`[seed] upserted user ${user.email} (id=${user.id})`);

  const projects = [
    { name: 'Atlas API', category: 'Backend', status: 'Running', description: 'Core public API serving docs, billing and realtime events to every client.' },
    { name: 'Nimbus Web', category: 'Frontend', status: 'Running', description: 'Customer-facing dashboard and marketing site with edge rendering.' },
    { name: 'Ledger Sync', category: 'Backend', status: 'Stopped', description: 'Nightly reconciliation pipeline between billing providers and the warehouse.' },
    { name: 'Beacon Portal', category: 'Fullstack', status: 'Running', description: 'Client portal with realtime dashboards, billing and team workspaces.' },
    { name: 'Forge CI', category: 'Fullstack', status: 'Stopped', description: 'Preview environments and load-test harness for every pull request.' },
    { name: 'Pulse Analytics', category: 'Fullstack', status: 'Running', description: 'Product telemetry ingestion, rollups and anomaly alerts.' },
  ];

  for (const p of projects) {
    await prisma.project.upsert({
      where: { name: p.name },
      update: { category: p.category, status: p.status, description: p.description },
      create: p,
    });
  }

  // eslint-disable-next-line no-console
  console.log(`[seed] upserted ${projects.length} projects`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed] failed', err);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
