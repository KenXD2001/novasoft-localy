// Reusable service health probing.
//
// Two-phase check per service:
//   1. Accessibility — can we reach http://host:port at all?
//      Connection refused, DNS failure, or timeout            -> 'unavailable'
//   2. Health — the host answered, what did it say?
//      GET /health (falling back to GET /) returns 2xx-3xx    -> 'healthy'
//      reachable but 5xx                                      -> 'unhealthy'
//      reachable but anything else (e.g. 404 on a bare API)   -> 'available'
//
// Probes for one project run concurrently; each request is bounded by the
// caller-supplied timeout so one dead host can't stall the whole list.

export type ServiceHealthStatus = 'available' | 'unavailable' | 'healthy' | 'unhealthy';

export interface ServiceHealth {
  status: ServiceHealthStatus;
  httpStatus: number | null;
  latencyMs: number;
  checkedAt: string;
}

// Mirrors the frontend toAddress(): normalizes "host[:port][/path]" to http://host:port.
export function toAddress(host: string, port: number): string {
  const bare = host.replace(/^https?:\/\//i, '').split(':')[0].split('/')[0];
  return `http://${bare}:${port}`;
}

interface ProbeResult {
  reachable: boolean;
  httpStatus: number | null;
  latencyMs: number;
}

async function tryGet(url: string, timeoutMs: number): Promise<ProbeResult> {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), redirect: 'follow' });
    try {
      // Status is all we need — drop the body without downloading it.
      await res.body?.cancel();
    } catch {
      /* body already consumed or connection closed */
    }
    return { reachable: true, httpStatus: res.status, latencyMs: Date.now() - start };
  } catch {
    return { reachable: false, httpStatus: null, latencyMs: Date.now() - start };
  }
}

function classify(httpStatus: number): ServiceHealthStatus {
  if (httpStatus < 400) return 'healthy';
  if (httpStatus < 500) return 'available';
  return 'unhealthy';
}

export async function checkServiceHealth(host: string, port: number, timeoutMs: number): Promise<ServiceHealth> {
  const checkedAt = new Date().toISOString();
  const base = toAddress(host, port);

  const healthEndpoint = await tryGet(`${base}/health`, timeoutMs);
  if (!healthEndpoint.reachable) {
    return { status: 'unavailable', httpStatus: null, latencyMs: healthEndpoint.latencyMs, checkedAt };
  }
  if (healthEndpoint.httpStatus !== 404) {
    const status = classify(healthEndpoint.httpStatus as number);
    return { status, httpStatus: healthEndpoint.httpStatus, latencyMs: healthEndpoint.latencyMs, checkedAt };
  }

  // No /health endpoint — fall back to the root path.
  const root = await tryGet(`${base}/`, timeoutMs);
  if (!root.reachable) {
    return { status: 'unavailable', httpStatus: null, latencyMs: root.latencyMs, checkedAt };
  }
  const status = classify(root.httpStatus as number);
  return { status, httpStatus: root.httpStatus, latencyMs: root.latencyMs, checkedAt };
}

export async function checkServicesHealth(
  services: Array<{ host: string; port: number }>,
  timeoutMs: number,
): Promise<ServiceHealth[]> {
  return Promise.all(services.map((s) => checkServiceHealth(s.host, s.port, timeoutMs)));
}
