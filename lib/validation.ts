import type { Annotation, Requirement, ScanStatus, Stats, Task } from './types';

export class DataValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'DataValidationError'; }
}
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }

export function validateRequirements(value: unknown): Requirement[] {
  if (!Array.isArray(value)) throw new DataValidationError('Requirements payload must be an array.');
  for (const row of value) {
    if (!isRecord(row) || typeof row.id !== 'string' || !['FR', 'AR'].includes(String(row.type)) || typeof row.title !== 'string' || !['covered', 'partial', 'missing'].includes(String(row.status)) || typeof row.updatedAt !== 'string' || typeof row.createdAt !== 'string' || typeof row.description !== 'string') throw new DataValidationError('A requirement has an invalid shape.');
  }
  return value as Requirement[];
}

/** Accept the official OpenAPI shape and normalize it to the view model used by the UI. */
export function validateAnnotations(value: unknown): Annotation[] {
  if (!Array.isArray(value)) throw new DataValidationError('Annotations payload must be an array.');
  return value.map((row, index) => {
    if (!isRecord(row) || typeof row.line !== 'number' || !['impl', 'test'].includes(String(row.type)) || typeof row.snippet !== 'string') throw new DataValidationError('An annotation has an invalid shape.');
    const requirementId = typeof row.reqId === 'string' ? row.reqId : row.requirementId;
    const filePath = typeof row.file === 'string' ? row.file : row.filePath;
    const id = typeof row.id === 'string' ? row.id : `${String(filePath)}:${row.line}:${String(requirementId)}:${String(row.type)}:${index}`;
    if (typeof requirementId !== 'string' || typeof filePath !== 'string') throw new DataValidationError('An annotation has an invalid shape.');
    return { id, requirementId, filePath, line: row.line, type: row.type as Annotation['type'], snippet: row.snippet };
  });
}

export function validateTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) throw new DataValidationError('Tasks payload must be an array.');
  for (const row of value) if (!isRecord(row) || typeof row.id !== 'string' || typeof row.requirementId !== 'string' || typeof row.title !== 'string' || !['open', 'in_progress', 'done'].includes(String(row.status)) || typeof row.updatedAt !== 'string' || (row.assignee !== undefined && typeof row.assignee !== 'string')) throw new DataValidationError('A task has an invalid shape.');
  return value as Task[];
}

export function validateScanStatus(value: unknown): ScanStatus {
  if (!isRecord(value) || !['idle', 'scanning', 'completed', 'failed'].includes(String(value.status)) || typeof value.startedAt !== 'string') {
    throw new DataValidationError('Scan status payload has an invalid shape.');
  }
  if (value.completedAt !== undefined && typeof value.completedAt !== 'string') {
    throw new DataValidationError('Scan status completedAt must be a date-time string.');
  }
  if (value.duration !== undefined && (typeof value.duration !== 'number' || !Number.isInteger(value.duration) || value.duration < 0)) {
    throw new DataValidationError('Scan status duration must be a non-negative integer.');
  }
  if (value.message !== undefined && typeof value.message !== 'string') {
    throw new DataValidationError('Scan status message must be a string.');
  }
  return {
    status: value.status as ScanStatus['status'],
    startedAt: value.startedAt,
    ...(typeof value.completedAt === 'string' ? { completedAt: value.completedAt } : {}),
    ...(typeof value.duration === 'number' ? { duration: value.duration } : {}),
    ...(typeof value.message === 'string' ? { message: value.message } : {}),
  };
}

export function validateStats(value: unknown): Stats {
  if (!isRecord(value) || typeof value.coverage !== 'number') throw new DataValidationError('Stats payload has an invalid shape.');
  // Official API v3 uses requirements/annotations/tasks; retain compatibility with local mock stats.
  if (isRecord(value.requirements) && isRecord(value.annotations) && isRecord(value.tasks)) {
    const requirements = value.requirements;
    const annotations = value.annotations;
    const tasks = value.tasks;
    if (typeof requirements.total !== 'number' || !isRecord(requirements.byType) || !isRecord(requirements.byStatus) || typeof annotations.total !== 'number' || typeof annotations.impl !== 'number' || typeof annotations.test !== 'number' || typeof annotations.orphans !== 'number' || typeof tasks.total !== 'number' || !isRecord(tasks.byStatus) || typeof tasks.orphans !== 'number') throw new DataValidationError('Stats payload has an invalid shape.');
    const lastScanAt = typeof value.lastScanAt === 'string' ? value.lastScanAt : null;
    return {
      requirementStats: { total: requirements.total, byType: { FR: Number(requirements.byType.FR ?? 0), AR: Number(requirements.byType.AR ?? 0) }, byStatus: { covered: Number(requirements.byStatus.covered ?? 0), partial: Number(requirements.byStatus.partial ?? 0), missing: Number(requirements.byStatus.missing ?? 0) } },
      annotationStats: { total: annotations.total, byType: { impl: annotations.impl, test: annotations.test }, orphans: annotations.orphans },
      taskStats: { total: tasks.total, byStatus: { open: Number(tasks.byStatus.open ?? 0), in_progress: Number(tasks.byStatus.in_progress ?? 0), done: Number(tasks.byStatus.done ?? 0) }, orphans: tasks.orphans },
      coverage: value.coverage, lastScanAt,
    };
  }
  if (!isRecord(value.requirementStats) || !isRecord(value.annotationStats) || !isRecord(value.taskStats)) throw new DataValidationError('Stats payload has an invalid shape.');
  return value as unknown as Stats;
}
