// Prisma connection/auth errors -> the API answers 503 instead of
// leaking driver details. Prisma error codes:
// P1000 auth failed, P1001 unreachable, P1002 timeout, P1003 db not found, P1010 access denied.
export function isDbUnreachable(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return code === 'P1000' || code === 'P1001' || code === 'P1002' || code === 'P1003' || code === 'P1010';
}
