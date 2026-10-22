import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { buildStats } from '../lib/coverage';
import requirements from '../data/requirements.json';
import annotations from '../data/annotations.json';
import tasks from '../data/tasks.json';
import type { Annotation, Requirement, Task } from '../lib/types';

function SummaryFixture() {
  const stats = buildStats(requirements as Requirement[], annotations as Annotation[], tasks as Task[]);
  return <section><h1>Project summary</h1><span>{stats.requirementStats.total} requirements</span><span>{stats.coverage}% coverage</span><span>{stats.annotationStats.orphans} orphan annotations</span><span>{stats.taskStats.orphans} orphan tasks</span></section>;
}

describe('summary data presentation', () => {
  // @req SCD-UI-001
  // @req SCD-UI-002
  // @req SCD-UI-012
  it('renders calculated summary counts', () => {
    render(<SummaryFixture />);
    expect(screen.getByText('8 requirements')).toBeInTheDocument();
    expect(screen.getByText('62.5% coverage')).toBeInTheDocument();
    expect(screen.getByText('2 orphan annotations')).toBeInTheDocument();
    expect(screen.getByText('1 orphan tasks')).toBeInTheDocument();
  });
});
