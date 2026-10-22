import { describe, expect, it } from 'vitest';
import requirements from '../data/requirements.json';
import annotations from '../data/annotations.json';
import tasks from '../data/tasks.json';
import { buildStats, coverageLabel, findOrphanAnnotations, findOrphanTasks } from '../lib/coverage';
import type { Requirement, Annotation, Task } from '../lib/types';

describe('coverage calculations', () => {
  // @req SCD-UI-001
  it('calculates consistent summary values from sample data', () => {
    const stats = buildStats(requirements as Requirement[], annotations as Annotation[], tasks as Task[], '2026-10-22T09:42:00Z');
    expect(stats.requirementStats.total).toBe(8);
    expect(stats.coverage).toBe(62.5);
    expect(stats.annotationStats.total).toBe(16);
    expect(stats.annotationStats.byType).toEqual({ impl: 10, test: 6 });
    expect(stats.annotationStats.orphans).toBe(2);
    expect(stats.taskStats.byStatus).toEqual({ open: 3, in_progress: 1, done: 2 });
    expect(stats.taskStats.orphans).toBe(1);
  });
  // @req SCD-UI-008
  // @req SCD-UI-006
  it('detects orphan annotations and tasks by unknown requirement ID', () => {
    expect(findOrphanAnnotations(annotations as Annotation[], requirements as Requirement[]).map((x) => x.id)).toEqual(['ANN-015', 'ANN-016']);
    expect(findOrphanTasks(tasks as Task[], requirements as Requirement[]).map((x) => x.id)).toEqual(['TASK-106']);
  });
  // @req SCD-UI-001
  it('handles empty and 100-percent coverage edge cases', () => {
    expect(buildStats([], [], []).coverage).toBe(0);
    const allCovered = (requirements as Requirement[]).map((r) => ({ ...r, status: 'covered' as const }));
    expect(buildStats(allCovered, [], []).coverage).toBe(100);
  });
  // @req SCD-UI-006
  it('maps status to clear coverage assessments', () => {
    expect(coverageLabel('covered')).toBe('Fully covered');
    expect(coverageLabel('partial')).toBe('Needs tests');
    expect(coverageLabel('missing')).toBe('Not implemented');
  });
});
