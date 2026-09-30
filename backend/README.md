# Novasoft Locally — Backend

Express + Prisma + PostgreSQL API scaffold.

## Prereqs

- Node >= 20
- PostgreSQL running locally with database `novasoft-locally-local`

```sql
CREATE DATABASE "novasoft-locally-local";
```

## Setup

```bash
cd backend
cp .env.example .env   # adjust DATABASE_URL credentials if needed
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## Endpoints

| Method | Path              | Description                              |
| ------ | ----------------- | ---------------------------------------- |
| GET    | `/health`         | Unprefixed liveness probe (LB / Docker)  |
| GET    | `/api/v1/health`  | Detailed health incl. DB + uptime        |
| GET    | `/api/v1/ready`   | Readiness probe (500 when DB is down)    |
| POST   | `/api/v1/user-login` | Login with `{email, password}` → `{user, token}` (JWT) |
| POST   | `/api/v1/create-project` | Create with `{name, category, description?}` → project (201, 409 on duplicate name) |
| GET    | `/api/v1/get-projects` | List with `?search=&status=All&category=All&sort=asc` → `{projects, filtered, total, categories}` |
| POST   | `/api/v1/add-service` | Create with `{project_id, name, type, host, port, status?}` → service (201, 409 on duplicate name per project) |
| GET    | `/api/v1/get-project-services` | List with `?project_id=&search=&status=All&type=All` → `{services, filtered, total}` (live `health`, `http_status`, `latency_ms`) |
| DELETE | `/api/v1/delete-service` | Delete with `?service_id=` → `{id, name, message}` (404 when missing) |
| PUT    | `/api/v1/update-service` | Update with `{service_id, name, type, host, port, status?, service_directory?, run_command?}` → service + `message` (404, 409 on duplicate name per project) |
| POST   | `/api/v1/start-service` | Start with `{service_id}` (needs directory + command) → service + `message` (400 when not runnable / dir missing) |
| POST   | `/api/v1/stop-service` | Stop with `{service_id}` → service + `message` |
| POST   | `/api/v1/restart-service` | Stop + start with `{service_id}` → service + `message` |
| GET    | `/api/v1/get-service-logs` | Logs with `?service_id=&limit=` (max 200) → `{logs, total}` (newest first) |
| DELETE | `/api/v1/clear-service-logs` | Clear with `?service_id=` → `{deleted, message}` |

`API_RESPONSE_DELAY` (ms, required, `0` = disabled) artificially delays every
`/api/v1/*` response — useful for testing loading/toast states in the frontend.
The unprefixed `/health` probe is never delayed.

`HEALTH_CHECK_TIMEOUT_MS` (ms, required) bounds each live service probe.
`get-project-services` / `add-service` probe `GET /health` then `GET /` on the
service's own host:port and report `health` as one of:

| health        | meaning                                              |
| ------------- | ---------------------------------------------------- |
| `healthy`     | reachable and `/health` (or `/`) returned 2xx–3xx    |
| `available`   | reachable but returned 4xx (alive, health unknown)   |
| `unhealthy`   | reachable but returned 5xx                           |
| `unavailable` | connection refused, DNS failure, or probe timed out  |

Probes across a project's services run concurrently (`utils/serviceHealth.ts`
is reusable anywhere — `checkServiceHealth` / `checkServicesHealth`).

## Structure

```
src/
  server.ts            # bootstrap: DB connect, listen, graceful shutdown
  app.ts               # express factory: helmet, cors, json, morgan, routes
  config/
    env.ts             # strict zod env validation (fail fast)
    prisma.ts          # prisma singleton
  routes/
    index.ts           # /api/v1 aggregator — mount domain routers here
    health.routes.ts
  controllers/
    health.controller.ts
  middlewares/
    notFound.ts
    errorHandler.ts
  utils/
    response.ts        # ok/fail envelope + asyncHandler
prisma/
  schema.prisma        # datasource: postgresql, db novasoft-locally-local
```
