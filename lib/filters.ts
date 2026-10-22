import type { Requirement, RequirementFilters, Task, TaskFilters } from './types';

// @req SCD-UI-003
export function filterRequirements(items: Requirement[], filters: RequirementFilters): Requirement[] {
  return items.filter((item) => (!filters.type?.length || filters.type.includes(item.type)) && (!filters.status?.length || filters.status.includes(item.status)));
}

// @req SCD-UI-004
export function sortRequirements(items: Requirement[], sort: RequirementFilters['sort'] = 'id', order: RequirementFilters['order'] = 'asc'): Requirement[] {
  const direction = order === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    const result = sort === 'updatedAt' ? a.updatedAt.localeCompare(b.updatedAt) : a.id.localeCompare(b.id, undefined, { numeric: true });
    return result * direction;
  });
}

// @req SCD-UI-007
export function filterTasks(items: Task[], filters: TaskFilters, knownRequirementIds?: ReadonlySet<string>): Task[] {
  return items.filter((item) => {
    const statusMatches = !filters.status?.length || filters.status.includes(item.status);
    const orphanMatches = filters.orphans === undefined || (knownRequirementIds !== undefined && (!knownRequirementIds.has(item.requirementId)) === filters.orphans);
    return statusMatches && orphanMatches;
  });
}
