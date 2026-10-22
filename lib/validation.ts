import type { Annotation, Requirement, Stats, Task } from './types';

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
export function validateAnnotations(value: unknown): Annotation[] {
  if (!Array.isArray(value)) throw new DataValidationError('Annotations payload must be an array.');
  for (const row of value) if (!isRecord(row) || typeof row.id !== 'string' || typeof row.requirementId !== 'string' || typeof row.filePath !== 'string' || typeof row.line !== 'number' || !['impl', 'test'].includes(String(row.type)) || typeof row.snippet !== 'string') throw new DataValidationError('An annotation has an invalid shape.');
  return value as Annotation[];
}
export function validateTasks(value: unknown): Task[] {
  if (!Array.isArray(value)) throw new DataValidationError('Tasks payload must be an array.');
  for (const row of value) if (!isRecord(row) || typeof row.id !== 'string' || typeof row.requirementId !== 'string' || typeof row.title !== 'string' || !['open', 'in_progress', 'done'].includes(String(row.status)) || typeof row.updatedAt !== 'string') throw new DataValidationError('A task has an invalid shape.');
  return value as Task[];
}
export function validateStats(value: unknown): Stats {
  if (!isRecord(value) || typeof value.coverage !== 'number' || !isRecord(value.requirementStats) || !isRecord(value.annotationStats) || !isRecord(value.taskStats)) throw new DataValidationError('Stats payload has an invalid shape.');
  return value as unknown as Stats;
}
