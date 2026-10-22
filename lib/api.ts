import mockStats from '@/data/stats.json';
import mockRequirements from '@/data/requirements.json';
import mockAnnotations from '@/data/annotations.json';
import mockTasks from '@/data/tasks.json';
import { API_BASE_URL } from './config';
import { buildStats } from './coverage';
import { validateAnnotations, validateRequirements, validateStats, validateTasks } from './validation';
import type { Annotation, ApiError, DataBundle, Requirement, RequirementDetail, RequirementFilters, Result, ScanStatus, Stats, Task, TaskFilters } from './types';

async function request<T>(path: string, validator: (value: unknown) => T, init?: RequestInit): Promise<Result<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers: { Accept: 'application/json', ...init?.headers } });
    if (response.status === 404) return { ok: false, error: { kind: 'not_found', status: 404, message: `Resource not found: ${path}` } };
    if (!response.ok) return { ok: false, error: { kind: 'http', status: response.status, message: `API request failed (${response.status}).` } };
    let body: unknown;
    try { body = await response.json(); } catch { return { ok: false, error: { kind: 'invalid_json', message: 'The API returned invalid JSON.' } }; }
    try { return { ok: true, data: validator(body) }; } catch (error) { return { ok: false, error: { kind: 'invalid_data', message: error instanceof Error ? error.message : 'The API response did not match the expected schema.' } }; }
  } catch { return { ok: false, error: { kind: 'network', message: 'Could not connect to the API. Check the server and NEXT_PUBLIC_API_URL.' } }; }
}
function queryString(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => { if (value) search.set(key, value); });
  const value = search.toString(); return value ? `?${value}` : '';
}

// @req SCD-UI-013
export async function getStats(): Promise<Result<Stats>> {
  if (API_BASE_URL) return request('/stats', validateStats);
  return { ok: true, data: buildStats(mockRequirements as Requirement[], mockAnnotations as Annotation[], mockTasks as Task[], mockStats.lastScanAt) };
}
// @req SCD-UI-002
export async function listRequirements(filters: RequirementFilters = {}): Promise<Result<Requirement[]>> {
  if (API_BASE_URL) {
    const result = await request(`/requirements${queryString({ type: filters.type?.length === 1 ? filters.type[0] : undefined, status: filters.status?.length === 1 ? filters.status[0] : undefined, sort: filters.sort, order: filters.order })}`, validateRequirements);
    if (!result.ok) return result;
    let items = result.data;
    if (filters.type?.length) items = items.filter((item) => filters.type?.includes(item.type));
    if (filters.status?.length) items = items.filter((item) => filters.status?.includes(item.status));
    return { ok: true, data: items };
  }
  let items = validateRequirements(mockRequirements);
  if (filters.type?.length) items = items.filter((item) => filters.type?.includes(item.type));
  if (filters.status?.length) items = items.filter((item) => filters.status?.includes(item.status));
  const dir = filters.order === 'desc' ? -1 : 1;
  items = [...items].sort((a, b) => (filters.sort === 'updatedAt' ? a.updatedAt.localeCompare(b.updatedAt) : a.id.localeCompare(b.id, undefined, { numeric: true })) * dir);
  return { ok: true, data: items };
}
// @req SCD-UI-006
export async function getRequirement(id: string): Promise<Result<RequirementDetail>> {
  if (API_BASE_URL) {
    return request<RequirementDetail>(`/requirements/${encodeURIComponent(id)}`, (value) => {
      if (!value || typeof value !== 'object') throw new Error('Invalid requirement detail.');
      const row = value as Record<string, unknown>;
      const requirement = validateRequirements([row])[0];
      if (!Array.isArray(row.annotations) || !Array.isArray(row.tasks)) throw new Error('Requirement detail must include annotations and tasks.');
      const annotations = validateAnnotations(row.annotations);
      const tasks = validateTasks(row.tasks);
      return { ...requirement, annotations: annotations.filter((item) => item.requirementId === id), tasks: tasks.filter((item) => item.requirementId === id) };
    });
  }
  const requirement = validateRequirements(mockRequirements).find((item) => item.id === id);
  if (!requirement) return { ok: false, error: { kind: 'not_found', message: `Requirement ${id} was not found.` } };
  return { ok: true, data: { ...requirement, annotations: validateAnnotations(mockAnnotations).filter((item) => item.requirementId === id), tasks: validateTasks(mockTasks).filter((item) => item.requirementId === id) } };
}
// @req SCD-UI-008
export async function listAnnotations(filters: { type?: 'impl' | 'test'; orphans?: boolean } = {}): Promise<Result<Annotation[]>> {
  if (API_BASE_URL) return request(`/annotations${queryString({ type: filters.type, orphans: filters.orphans === undefined ? undefined : String(filters.orphans) })}`, validateAnnotations);
  let items = validateAnnotations(mockAnnotations);
  if (filters.type) items = items.filter((item) => item.type === filters.type);
  if (filters.orphans) { const ids = new Set(validateRequirements(mockRequirements).map((item) => item.id)); items = items.filter((item) => !ids.has(item.requirementId)); }
  return { ok: true, data: items };
}
// @req SCD-UI-007
export async function listTasks(filters: TaskFilters & { sort?: 'id' | 'updatedAt'; order?: 'asc' | 'desc' } = {}): Promise<Result<Task[]>> {
  if (API_BASE_URL) {
    const result = await request(`/tasks${queryString({ status: filters.status?.length === 1 ? filters.status[0] : undefined, orphans: filters.orphans === undefined ? undefined : String(filters.orphans), sort: filters.sort, order: filters.order })}`, validateTasks);
    if (!result.ok) return result;
    let items = result.data;
    if (filters.status?.length) items = items.filter((item) => filters.status?.includes(item.status));
    return { ok: true, data: items };
  }
  let items = validateTasks(mockTasks);
  if (filters.status?.length) items = items.filter((item) => filters.status?.includes(item.status));
  if (filters.orphans !== undefined) { const ids = new Set(validateRequirements(mockRequirements).map((item) => item.id)); items = items.filter((item) => !ids.has(item.requirementId) === filters.orphans); }
  if (filters.sort) { const dir = filters.order === 'desc' ? -1 : 1; items = [...items].sort((a, b) => (filters.sort === 'updatedAt' ? a.updatedAt.localeCompare(b.updatedAt) : a.id.localeCompare(b.id, undefined, { numeric: true })) * dir); }
  return { ok: true, data: items };
}
// @req SCD-UI-013
export async function triggerScan(): Promise<Result<ScanStatus>> {
  if (API_BASE_URL) return request('/scan', (value) => value as ScanStatus, { method: 'POST' });
  return { ok: true, data: { status: 'completed', startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), message: 'Mock scan completed. No backend was contacted.' } };
}
// @req SCD-UI-013
export async function getScanStatus(): Promise<Result<ScanStatus>> {
  if (API_BASE_URL) return request('/scan', (value) => value as ScanStatus);
  return { ok: true, data: { status: 'completed', startedAt: mockStats.lastScanAt ?? undefined, completedAt: mockStats.lastScanAt ?? undefined, message: 'Showing the last sample scan.' } };
}
export async function getDataBundle(): Promise<Result<DataBundle>> {
  const [stats, requirements, annotations, tasks] = await Promise.all([getStats(), listRequirements(), listAnnotations(), listTasks()]);
  const failed = [stats, requirements, annotations, tasks].find((item) => !item.ok);
  if (failed && !failed.ok) return { ok: false, error: failed.error as ApiError };
  if (!stats.ok || !requirements.ok || !annotations.ok || !tasks.ok) return { ok: false, error: { kind: 'network', message: 'Could not load dashboard data.' } };
  return { ok: true, data: { stats: stats.data, requirements: requirements.data, annotations: annotations.data, tasks: tasks.data } };
}
