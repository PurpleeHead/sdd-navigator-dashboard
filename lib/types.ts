export type RequirementType = 'FR' | 'AR';
export type CoverageStatus = 'covered' | 'partial' | 'missing';
export type AnnotationType = 'impl' | 'test';
export type TaskStatus = 'open' | 'in_progress' | 'done';

export interface Requirement {
  id: string; type: RequirementType; title: string; description: string;
  status: CoverageStatus; createdAt: string; updatedAt: string;
}
export interface Annotation {
  id: string; requirementId: string; filePath: string; line: number;
  type: AnnotationType; snippet: string;
}
export interface Task {
  id: string; requirementId: string; title: string; status: TaskStatus;
  assignee?: string; updatedAt: string;
}
export interface Stats {
  requirementStats: { total: number; byType: Record<RequirementType, number>; byStatus: Record<CoverageStatus, number> };
  annotationStats: { total: number; byType: Record<AnnotationType, number>; orphans: number };
  taskStats: { total: number; byStatus: Record<TaskStatus, number>; orphans: number };
  coverage: number; lastScanAt: string | null;
}
export interface ScanStatus { status: 'idle' | 'queued' | 'running' | 'completed' | 'failed'; startedAt?: string; finishedAt?: string; message?: string }
export interface RequirementDetail extends Requirement { annotations: Annotation[]; tasks: Task[] }
export interface DataBundle { stats: Stats; requirements: Requirement[]; annotations: Annotation[]; tasks: Task[] }
export interface RequirementFilters { type?: RequirementType[]; status?: CoverageStatus[]; sort?: 'id' | 'updatedAt'; order?: 'asc' | 'desc' }
export interface TaskFilters { status?: TaskStatus[]; orphans?: boolean }
export type Result<T> = { ok: true; data: T } | { ok: false; error: ApiError };
export interface ApiError { kind: 'network' | 'http' | 'invalid_json' | 'invalid_data' | 'not_found'; message: string; status?: number }
