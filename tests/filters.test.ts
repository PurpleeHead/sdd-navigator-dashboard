import { describe, expect, it } from 'vitest';
import requirements from '../data/requirements.json';
import tasks from '../data/tasks.json';
import { filterRequirements, filterTasks, sortRequirements } from '../lib/filters';
import type { Requirement, Task } from '../lib/types';
const reqs = requirements as Requirement[];

describe('requirement filters and sorting', () => {
  // @req SCD-UI-003
  // @req SCD-UI-005
  it('combines type and status filters', () => {
    const result = filterRequirements(reqs, { type: ['FR'], status: ['missing'] });
    expect(result.map((r) => r.id)).toEqual(['FR-API-003']);
  });
  // @req SCD-UI-004
  it('sorts IDs in both directions without mutating source data', () => {
    expect(sortRequirements(reqs, 'id', 'asc')[0]?.id).toBe('AR-PERF-001');
    expect(sortRequirements(reqs, 'id', 'desc')[0]?.id).toBe('FR-TASK-001');
    expect(reqs[0]?.id).toBe('FR-SCAN-001');
  });
  // @req SCD-UI-004
  it('sorts by updatedAt', () => {
    expect(sortRequirements(reqs, 'updatedAt', 'asc')[0]?.id).toBe('AR-SEC-001');
    expect(sortRequirements(reqs, 'updatedAt', 'desc')[0]?.id).toBe('FR-SCAN-001');
  });
  // @req SCD-UI-007
  // @req SCD-UI-013
  // @req SCD-UI-014
  it('filters tasks by status', () => {
    expect(filterTasks(tasks as Task[], { status: ['done'] }).map((task) => task.id)).toEqual(['TASK-101', 'TASK-102']);
    expect(filterTasks(tasks as Task[], { orphans: true }, new Set(reqs.map((r) => r.id))).map((task) => task.id)).toEqual(['TASK-106']);
  });
});
