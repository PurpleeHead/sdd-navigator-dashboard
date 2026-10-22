import type { Annotation, CoverageStatus, Requirement, Stats, Task } from './types';

// @req SCD-UI-001
export function buildStats(requirements: Requirement[], annotations: Annotation[], tasks: Task[], lastScanAt: string | null = null): Stats {
  const byType = { FR: 0, AR: 0 };
  const byStatus: Record<CoverageStatus, number> = { covered: 0, partial: 0, missing: 0 };
  const annotationByType = { impl: 0, test: 0 };
  const taskByStatus = { open: 0, in_progress: 0, done: 0 };
  requirements.forEach((item) => { byType[item.type] += 1; byStatus[item.status] += 1; });
  annotations.forEach((item) => { annotationByType[item.type] += 1; });
  tasks.forEach((item) => { taskByStatus[item.status] += 1; });
  const linkedIds = new Set(requirements.map((item) => item.id));
  const annotationOrphans = annotations.filter((item) => !linkedIds.has(item.requirementId)).length;
  const taskOrphans = tasks.filter((item) => !linkedIds.has(item.requirementId)).length;
  const covered = requirements.filter((item) => item.status === 'covered').length;
  return {
    requirementStats: { total: requirements.length, byType, byStatus },
    annotationStats: { total: annotations.length, byType: annotationByType, orphans: annotationOrphans },
    taskStats: { total: tasks.length, byStatus: taskByStatus, orphans: taskOrphans },
    coverage: requirements.length === 0 ? 0 : Math.round((covered / requirements.length) * 1000) / 10,
    lastScanAt,
  };
}

// @req SCD-UI-008
export function findOrphanAnnotations(annotations: Annotation[], requirements: Requirement[]): Annotation[] {
  const ids = new Set(requirements.map((item) => item.id));
  return annotations.filter((item) => !ids.has(item.requirementId));
}

// @req SCD-UI-008
export function findOrphanTasks(tasks: Task[], requirements: Requirement[]): Task[] {
  const ids = new Set(requirements.map((item) => item.id));
  return tasks.filter((item) => !ids.has(item.requirementId));
}

// @req SCD-UI-006
export function coverageLabel(status: CoverageStatus): string {
  switch (status) {
    case 'covered': return 'Fully covered';
    case 'partial': return 'Needs tests';
    case 'missing': return 'Not implemented';
  }
}
