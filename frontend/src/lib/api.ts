import { env } from "./env";
import type { Project } from "./data";

export type { Project };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

interface Envelope<T> {
  success: boolean;
  data?: T;
  error?: { message: string; details?: unknown };
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${env.API_URL}/api/v1/user-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }

  const body = (await res.json().catch(() => null)) as Envelope<LoginResponse> | null;

  if (!res.ok || !body?.success || !body.data) {
    throw new ApiError(res.status, body?.error?.message ?? `Login failed (HTTP ${res.status})`, body?.error?.details);
  }

  return body.data;
}

const AUTH_KEY = "locally-auth";

export function saveAuth(auth: LoginResponse): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function loadAuth(): LoginResponse | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as LoginResponse) : null;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY);
}

export interface ProjectDTO {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "Running" | "Stopped";
  createdAt: string;
  updatedAt: string;
}

export interface GetProjectsParams {
  search: string;
  status: string;
  category: string;
  sort: "asc" | "desc";
}

export interface GetProjectsResponse {
  projects: Project[];
  filtered: number;
  total: number;
  categories: string[];
}

export interface CreateProjectInput {
  name: string;
  category: string;
  description: string;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${env.API_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Is the backend running?");
  }

  const body = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!res.ok || !body?.success || body.data === undefined) {
    throw new ApiError(res.status, body?.error?.message ?? `Request failed (HTTP ${res.status})`, body?.error?.details);
  }

  return body.data;
}

// The projects table has no service/tunnel counters yet — cards render 0
// until the services/tunnels APIs land.
function toProject(dto: ProjectDTO): Project {
  return { ...dto, services: 0, tunnels: 0 };
}

export async function getProjectsApi(params: GetProjectsParams): Promise<GetProjectsResponse> {
  const query = new URLSearchParams({
    search: params.search,
    status: params.status,
    category: params.category,
    sort: params.sort,
  });
  const data = await apiRequest<{ projects: ProjectDTO[]; filtered: number; total: number; categories: string[] }>(
    `/api/v1/get-projects?${query.toString()}`
  );
  return { ...data, projects: data.projects.map(toProject) };
}

export async function getProjectApi(project_id: string): Promise<Project> {
  const query = new URLSearchParams({ project_id });
  const dto = await apiRequest<ProjectDTO>(`/api/v1/get-project?${query.toString()}`);
  return toProject(dto);
}

export async function createProjectApi(input: CreateProjectInput): Promise<Project> {
  const dto = await apiRequest<ProjectDTO>("/api/v1/create-project", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return toProject(dto);
}

export interface ServiceDTO {
  id: string;
  project_id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  address: string;
  status: "Running" | "Stopped";
  service_directory: string;
  run_command: string;
  runnable: boolean;
  health: "available" | "unavailable" | "healthy" | "unhealthy";
  http_status: number | null;
  latency_ms: number;
  public_url: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetProjectServicesParams {
  project_id: string;
  search: string;
  status: string;
  type: string;
}

export interface GetProjectServicesResponse {
  services: ServiceDTO[];
  filtered: number;
  total: number;
}

export interface AddServiceInput {
  project_id: string;
  name: string;
  type: "API" | "UI";
  host: string;
  port: number;
  service_directory?: string;
  run_command?: string;
}

export async function getProjectServicesApi(params: GetProjectServicesParams): Promise<GetProjectServicesResponse> {
  const query = new URLSearchParams({
    project_id: params.project_id,
    search: params.search,
    status: params.status,
    type: params.type,
  });
  return apiRequest<GetProjectServicesResponse>(`/api/v1/get-project-services?${query.toString()}`);
}

export async function addServiceApi(input: AddServiceInput): Promise<ServiceDTO> {
  return apiRequest<ServiceDTO>("/api/v1/add-service", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function deleteServiceApi(service_id: string): Promise<{ id: string; name: string; message: string }> {
  const query = new URLSearchParams({ service_id });
  return apiRequest<{ id: string; name: string; message: string }>(`/api/v1/delete-service?${query.toString()}`, {
    method: "DELETE",
  });
}

export interface UpdateServiceInput {
  service_id: string;
  name: string;
  type: "API" | "UI";
  host: string;
  port: number;
  status?: "Running" | "Stopped";
  service_directory?: string;
  run_command?: string;
}

export async function updateServiceApi(input: UpdateServiceInput): Promise<ServiceDTO & { message: string }> {
  return apiRequest<ServiceDTO & { message: string }>("/api/v1/update-service", {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function controlServiceApi(service_id: string, action: "start" | "stop" | "restart"): Promise<ServiceDTO & { message: string }> {
  return apiRequest<ServiceDTO & { message: string }>(`/api/v1/${action}-service`, {
    method: "POST",
    body: JSON.stringify({ service_id }),
  });
}

export interface ServiceLogDTO {
  id: string;
  serviceId: string;
  level: string;
  source: string;
  logText: string;
  createdAt: string;
  updatedAt: string;
}

export async function getServiceLogsApi(service_id: string, limit = 50): Promise<{ logs: ServiceLogDTO[]; total: number }> {
  const query = new URLSearchParams({ service_id, limit: String(limit) });
  return apiRequest<{ logs: ServiceLogDTO[]; total: number }>(`/api/v1/get-service-logs?${query.toString()}`);
}

export async function clearServiceLogsApi(service_id: string): Promise<{ deleted: number; message: string }> {
  const query = new URLSearchParams({ service_id });
  return apiRequest<{ deleted: number; message: string }>(`/api/v1/clear-service-logs?${query.toString()}`, {
    method: "DELETE",
  });
}
