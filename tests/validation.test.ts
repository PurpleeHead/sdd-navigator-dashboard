import { describe, expect, it } from 'vitest';
import { DataValidationError, validateRequirements, validateTasks, validateAnnotations, validateStats } from '../lib/validation';

describe('runtime schema validation', () => {
  // @req SCD-UI-009
  // @req SCD-UI-010
  // @req SCD-UI-011
  it('rejects malformed requirement data', () => {
    expect(() => validateRequirements({ items: [] })).toThrow(DataValidationError);
    expect(() => validateRequirements([{ id: 'X', type: 'WHAT' }])).toThrow('invalid shape');
  });
  // @req SCD-UI-009
  // @req SCD-UI-010
  // @req SCD-UI-011
  it('accepts an empty task list', () => {
    expect(validateTasks([])).toEqual([]);
  });
});

// @req SCD-UI-009
// @req SCD-UI-010
// @req SCD-UI-011
describe('official SDD Navigator API v3 payloads', () => {
  it('normalizes official annotation fields to the UI model', () => {
    expect(validateAnnotations([{ file: 'src/main.ts', line: 12, reqId: 'FR-API-001', type: 'impl', snippet: '// req FR-API-001' }])).toMatchObject([
      { filePath: 'src/main.ts', line: 12, requirementId: 'FR-API-001', type: 'impl' },
    ]);
  });
  it('normalizes official aggregate statistics', () => {
    expect(validateStats({
      requirements: { total: 8, byType: { FR: 6, AR: 2 }, byStatus: { covered: 5, partial: 1, missing: 2 } },
      annotations: { total: 16, impl: 10, test: 6, orphans: 2 },
      tasks: { total: 6, byStatus: { open: 3, in_progress: 1, done: 2 }, orphans: 1 },
      coverage: 62.5, lastScanAt: '2026-03-01T10:15:00Z',
    })).toMatchObject({
      requirementStats: { total: 8, byType: { FR: 6, AR: 2 }, byStatus: { covered: 5, partial: 1, missing: 2 } },
      annotationStats: { total: 16, byType: { impl: 10, test: 6 }, orphans: 2 },
      taskStats: { total: 6, byStatus: { open: 3, in_progress: 1, done: 2 }, orphans: 1 },
      coverage: 62.5,
    });
  });
});
