import { describe, expect, it } from 'vitest';
import { DataValidationError, validateRequirements, validateTasks } from '../lib/validation';

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
