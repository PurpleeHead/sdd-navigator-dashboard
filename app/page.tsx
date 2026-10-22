'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDataBundle, triggerScan } from '@/lib/api';
import { findOrphanAnnotations, findOrphanTasks } from '@/lib/coverage';
import { filterRequirements, sortRequirements } from '@/lib/filters';
import type { DataBundle, Requirement, RequirementType, CoverageStatus, TaskStatus } from '@/lib/types';

const statusLabels: Record<CoverageStatus, string> = { covered: 'Covered', partial: 'Partial', missing: 'Missing' };
const taskLabels: Record<TaskStatus, string> = { open: 'Open', in_progress: 'In progress', done: 'Done' };
const shortDate = (value: string | null) => value ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not scanned yet';

// @req SCD-UI-011
function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const stored = localStorage.getItem('sdd-theme');
    const initial = stored === 'light' || stored === 'dark' ? stored : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial); document.documentElement.dataset.theme = initial;
  }, []);
  const toggle = () => { const next = theme === 'dark' ? 'light' : 'dark'; setTheme(next); document.documentElement.dataset.theme = next; localStorage.setItem('sdd-theme', next); };
  return <button className="icon-button theme-toggle" onClick={toggle} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">{theme === 'dark' ? '☼' : '◐'}</button>;
}
function Pill({ children, kind = '' }: { children: React.ReactNode; kind?: string }) { return <span className={`pill ${kind}`}>{children}</span>; }
function ProgressBar({ value, kind = '' }: { value: number; kind?: string }) { return <div className={`progress ${kind}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={`${value}%`}><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>; }

// @req SCD-UI-002
// @req SCD-UI-005
// @req SCD-UI-009
// @req SCD-UI-010
// @req SCD-UI-012
// @req SCD-UI-014
export default function DashboardPage() {
  const [bundle, setBundle] = useState<DataBundle | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<RequirementType[]>([]);
  const [statuses, setStatuses] = useState<CoverageStatus[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'id' | 'updatedAt'>('id');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [taskStatus, setTaskStatus] = useState<TaskStatus | 'all'>('all');
  const [orphansOpen, setOrphansOpen] = useState(true);
  const [filtersReady, setFiltersReady] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    const result = await getDataBundle();
    if (result.ok) setBundle(result.data); else setError(result.error.message);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTypes((params.get('type')?.split(',') ?? []).filter((v): v is RequirementType => v === 'FR' || v === 'AR'));
    setStatuses((params.get('status')?.split(',') ?? []).filter((v): v is CoverageStatus => v === 'covered' || v === 'partial' || v === 'missing'));
    setSearch(params.get('q') ?? '');
    setFiltersReady(true);
  }, []);
  useEffect(() => {
    if (!filtersReady) return;
    const params = new URLSearchParams(window.location.search);
    if (types.length) params.set('type', types.join(',')); else params.delete('type');
    if (statuses.length) params.set('status', statuses.join(',')); else params.delete('status');
    if (search.trim()) params.set('q', search.trim()); else params.delete('q');
    const query = params.toString(); window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  }, [types, statuses, search, filtersReady]);

  // @req SCD-UI-005
  const requirements = useMemo(() => {
    if (!bundle) return [];
    const query = search.trim().toLocaleLowerCase();
    const filtered = filterRequirements(bundle.requirements, { type: types, status: statuses }).filter((item) => !query || item.id.toLocaleLowerCase().includes(query) || item.title.toLocaleLowerCase().includes(query));
    return sortRequirements(filtered, sort, order);
  }, [bundle, types, statuses, search, sort, order]);
  // @req SCD-UI-008
  const orphanAnnotations = useMemo(() => bundle ? findOrphanAnnotations(bundle.annotations, bundle.requirements) : [], [bundle]);
  const orphanTasks = useMemo(() => bundle ? findOrphanTasks(bundle.tasks, bundle.requirements) : [], [bundle]);
  const toggleValue = <T extends string>(list: T[], value: T, set: (items: T[]) => void) => set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  // @req SCD-UI-013
  const onScan = async () => { setScanning(true); setScanMessage(''); const result = await triggerScan(); if (result.ok) { setScanMessage(result.data.message ?? `Scan status: ${result.data.status}`); if (result.data.status === 'completed') { const refreshed = await getDataBundle(); if (refreshed.ok) setBundle(refreshed.data); else setScanMessage(`Scan completed, but dashboard refresh failed: ${refreshed.error.message}`); } } else { setScanMessage(result.error.message); } setScanning(false); };

  if (loading) return <main className="loading-shell"><div className="loader" /><p>Loading traceability workspace…</p></main>;
  if (error || !bundle) return <main className="error-shell"><div className="error-icon">!</div><h1>Dashboard unavailable</h1><p>{error || 'No data was returned.'}</p><button className="button primary" onClick={() => void load()}>Try again</button></main>;

  const { stats } = bundle;
  const statusOrder: CoverageStatus[] = ['covered', 'partial', 'missing'];
  return <main className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">S<span>↗</span></div><div><strong>SDD Navigator</strong><small>ENGINEERING INTELLIGENCE</small></div></div>
      <div className="workspace-switch"><div className="workspace-avatar">AC</div><div><strong>Atlas Core</strong><small>Repository workspace</small></div><span className="chevron">⌄</span></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation"><a className="active" href="#overview"><span>▦</span> Overview</a><a href="#requirements"><span>◇</span> Requirements <span className="nav-count">{stats.requirementStats.total}</span></a><a href="#tasks"><span>☷</span> Tasks <span className="nav-count">{stats.taskStats.total}</span></a><a href="#orphans"><span>⚑</span> Orphan records {orphanAnnotations.length + orphanTasks.length > 0 && <span className="nav-alert">{orphanAnnotations.length + orphanTasks.length}</span>}</a></nav>
      <div className="sidebar-bottom"><div className="scan-status"><span className="status-dot"/><div><strong>Workspace synced</strong><small>{process.env.NEXT_PUBLIC_API_URL ? 'Connected API' : 'Local sample data'}</small></div></div><div className="user-profile"><div className="user-avatar">JD</div><div><strong>Jordan Davis</strong><small>Developer</small></div><span className="more">···</span></div></div>
    </aside>

    <section className="main-column">
      <header className="topbar"><div className="breadcrumb">Projects <span>/</span> <strong>Atlas Core</strong></div><div className="top-actions"><span className="live-status"><i /> {process.env.NEXT_PUBLIC_API_URL ? 'API mode' : 'Mock mode'}</span><button className="icon-button" aria-label="Notifications" title="Notifications">♧</button><ThemeToggle/><div className="top-avatar">JD</div></div></header>
      <div className="content" id="overview">
        <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> SPECIFICATION HEALTH</div><h1>Project overview</h1><p className="subtitle">Track requirement coverage, implementation progress, and traceability gaps.</p></div><div className="heading-actions"><button className="button secondary" onClick={() => void load()}>↻ Refresh</button><button className="button primary" onClick={() => void onScan()} disabled={scanning}>{scanning ? <><span className="mini-spinner"/> Scanning…</> : '▶ Run scan'}</button></div></div>
        {scanMessage && <div className="inline-notice" role="status">{scanMessage}<button onClick={() => setScanMessage('')} aria-label="Dismiss message">×</button></div>}

        <div className="stat-grid">
          <article className="stat-card"><div className="stat-top"><span>Total requirements</span><span className="stat-icon indigo">◇</span></div><div className="stat-value">{stats.requirementStats.total}<span className="stat-unit">items</span></div><div className="stat-foot"><span className="positive">↗ {stats.requirementStats.byType.FR} FR</span><span className="muted-dot">·</span><span>{stats.requirementStats.byType.AR} AR</span></div></article>
          <article className="stat-card"><div className="stat-top"><span>Overall coverage</span><span className="stat-icon green">◔</span></div><div className="stat-value">{stats.coverage.toFixed(1)}<span className="percent">%</span></div><ProgressBar value={stats.coverage}/><div className="stat-foot"><span className="positive">{stats.requirementStats.byStatus.covered} covered</span><span className="muted-dot">·</span><span>{stats.requirementStats.byStatus.partial} partial</span></div></article>
          <article className="stat-card"><div className="stat-top"><span>Code annotations</span><span className="stat-icon violet">⌘</span></div><div className="stat-value">{stats.annotationStats.total}<span className="stat-unit">links</span></div><div className="stacked-bar"><span style={{width:`${stats.annotationStats.total ? stats.annotationStats.byType.impl / stats.annotationStats.total * 100 : 0}%`}}/><span style={{width:`${stats.annotationStats.total ? stats.annotationStats.byType.test / stats.annotationStats.total * 100 : 0}%`}}/></div><div className="stat-foot"><span><i className="legend-dot impl"/> {stats.annotationStats.byType.impl} impl</span><span><i className="legend-dot test"/> {stats.annotationStats.byType.test} test</span></div></article>
          <article className="stat-card"><div className="stat-top"><span>Open tasks</span><span className="stat-icon amber">☷</span></div><div className="stat-value">{stats.taskStats.byStatus.open}<span className="stat-unit">of {stats.taskStats.total} tasks</span></div><div className="task-mini-bars"><span style={{height:'40%'}}/><span style={{height:'68%'}}/><span style={{height:'48%'}}/><span style={{height:'84%'}}/><span style={{height:'58%'}}/><span style={{height:'100%'}}/><span style={{height:'74%'}}/></div><div className="stat-foot"><span>{stats.taskStats.byStatus.done} completed</span><span className="muted-dot">·</span><span>{stats.taskStats.byStatus.in_progress} in progress</span></div></article>
        </div>

        <div className="overview-grid">
          <section className="panel coverage-panel"><div className="panel-heading"><div><h2>Coverage breakdown</h2><p>Requirement implementation status</p></div><span className="subtle-badge">{stats.requirementStats.total} total</span></div><div className="coverage-content"><div className="donut-wrap"><div className="donut" style={{background:`conic-gradient(var(--green) 0 ${stats.requirementStats.byStatus.covered / Math.max(1,stats.requirementStats.total)*100}%, var(--amber) ${stats.requirementStats.byStatus.covered / Math.max(1,stats.requirementStats.total)*100}% ${(stats.requirementStats.byStatus.covered+stats.requirementStats.byStatus.partial) / Math.max(1,stats.requirementStats.total)*100}%, var(--red) ${(stats.requirementStats.byStatus.covered+stats.requirementStats.byStatus.partial) / Math.max(1,stats.requirementStats.total)*100}% 100%)`}}><div><strong>{stats.coverage}%</strong><span>covered</span></div></div></div><div className="coverage-legend">{statusOrder.map((status) => <div className="coverage-row" key={status}><span className={`legend-dot ${status}`}/><span>{statusLabels[status]}</span><strong>{stats.requirementStats.byStatus[status]}</strong><div className="coverage-track"><span className={status} style={{width:`${stats.requirementStats.byStatus[status] / Math.max(1,stats.requirementStats.total)*100}%`}}/></div></div>)}</div></div></section>
          <section className="panel scan-panel"><div className="panel-heading"><div><h2>Latest scan</h2><p>Most recent repository analysis</p></div><span className="scan-complete"><i/> Completed</span></div><div className="scan-date"><div className="calendar-icon">▦</div><div><strong>{shortDate(stats.lastScanAt)}</strong><span>Last successful scan</span></div></div><div className="scan-divider"/><div className="scan-detail"><span>Scan source</span><strong>{process.env.NEXT_PUBLIC_API_URL ? 'Connected API' : 'Local mock dataset'}</strong></div><div className="scan-detail"><span>Orphan records</span><strong className={orphanAnnotations.length + orphanTasks.length ? 'warning-text' : ''}>{orphanAnnotations.length + orphanTasks.length} detected</strong></div><button className="text-button" onClick={() => void onScan()}>Run new scan <span>→</span></button></section>
        </div>

        <section className="panel requirements-panel" id="requirements"><div className="panel-heading table-heading"><div><h2>Requirements</h2><p>Explore and audit specification coverage</p></div><div className="table-heading-right"><span className="result-count">{requirements.length} of {bundle.requirements.length} shown</span><button className="button secondary small" onClick={() => {setTypes([]);setStatuses([]);setSearch('');}}>Clear filters</button></div></div>
          <div className="filter-bar"><label className="search-control"><span className="filter-label">SEARCH REQUIREMENTS</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID or title…" aria-label="Search requirements by ID or title" /></label><div className="filter-group"><span className="filter-label">TYPE</span>{(['FR','AR'] as RequirementType[]).map((type) => <button key={type} className={`filter-chip ${types.includes(type) ? 'selected' : ''}`} aria-pressed={types.includes(type)} onClick={() => toggleValue(types, type, setTypes)}>{type}</button>)}</div><div className="filter-divider"/><div className="filter-group"><span className="filter-label">STATUS</span>{(['covered','partial','missing'] as CoverageStatus[]).map((status) => <button key={status} className={`filter-chip ${statuses.includes(status) ? 'selected' : ''}`} aria-pressed={statuses.includes(status)} onClick={() => toggleValue(statuses, status, setStatuses)}><i className={`legend-dot ${status}`}/>{statusLabels[status]}</button>)}</div></div>
          <div className="table-wrap"><table><thead><tr><th aria-sort={sort === 'id' ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}><button className="sort-button" onClick={() => {setOrder(sort === 'id' ? order === 'asc' ? 'desc' : 'asc' : 'asc');setSort('id');}}>REQUIREMENT ID <span>{sort === 'id' ? order === 'asc' ? '↑' : '↓' : '↕'}</span></button></th><th>TYPE</th><th>TITLE</th><th>STATUS</th><th aria-sort={sort === 'updatedAt' ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}><button className="sort-button" onClick={() => {setOrder(sort === 'updatedAt' ? order === 'asc' ? 'desc' : 'asc' : 'desc');setSort('updatedAt');}}>LAST UPDATED <span>{sort === 'updatedAt' ? order === 'asc' ? '↑' : '↓' : '↕'}</span></button></th><th/></tr></thead><tbody>{requirements.map((item: Requirement) => <tr key={item.id}><td><Link className="requirement-id" href={`/requirements/${encodeURIComponent(item.id)}?${new URLSearchParams({ ...(types.length ? {type:types.join(',')} : {}), ...(statuses.length ? {status:statuses.join(',')} : {}) }).toString()}`}>{item.id}</Link></td><td><Pill kind={item.type === 'FR' ? 'type-fr' : 'type-ar'}>{item.type}</Pill></td><td><Link className="requirement-title" href={`/requirements/${encodeURIComponent(item.id)}?${new URLSearchParams({ ...(types.length ? {type:types.join(',')} : {}), ...(statuses.length ? {status:statuses.join(',')} : {}) }).toString()}`}>{item.title}</Link><span className="row-description">{item.description}</span></td><td><Pill kind={`status-${item.status}`}><i className="status-mini-dot"/>{statusLabels[item.status]}</Pill></td><td className="date-cell">{new Intl.DateTimeFormat('en',{month:'short',day:'2-digit',year:'numeric'}).format(new Date(item.updatedAt))}</td><td><Link className="row-arrow" href={`/requirements/${encodeURIComponent(item.id)}?${new URLSearchParams({ ...(types.length ? {type:types.join(',')} : {}), ...(statuses.length ? {status:statuses.join(',')} : {}) }).toString()}`} aria-label={`Open ${item.id}`}>↗</Link></td></tr>)}</tbody></table>{requirements.length === 0 && <div className="empty-state"><div>⌕</div><strong>No requirements found</strong><span>Try adjusting or clearing the selected filters.</span><button className="button secondary" onClick={() => {setTypes([]);setStatuses([]);setSearch('');}}>Reset filters</button></div>}</div>
          <div className="table-footer"><span>Showing {requirements.length} requirements</span><span>Filters are synced to the URL <b>↗</b></span></div>
        </section>

        <div className="lower-grid"><section className="panel tasks-panel" id="tasks"><div className="panel-heading"><div><h2>Implementation tasks</h2><p>Work items linked to requirements</p></div><select className="select-control" aria-label="Filter tasks by status" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value as TaskStatus | 'all')}><option value="all">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="done">Done</option></select></div><div className="task-list">{bundle.tasks.filter((task) => taskStatus === 'all' || task.status === taskStatus).map((task) => <div className={`task-row ${bundle.requirements.some((r) => r.id === task.requirementId) ? '' : 'orphan-task-row'}`} key={task.id}><div className={`task-check ${task.status}`}>{task.status === 'done' ? '✓' : task.status === 'in_progress' ? '◷' : ''}</div><div className="task-main"><strong>{task.title}</strong><span>{task.id} <b>·</b> {task.requirementId}</span></div><Pill kind={`task-${task.status}`}>{taskLabels[task.status]}</Pill>{!bundle.requirements.some((r) => r.id === task.requirementId) && <Pill kind="status-missing">Orphan</Pill>}</div>)}{bundle.tasks.filter((task) => taskStatus === 'all' || task.status === taskStatus).length === 0 && <div className="mini-empty">No tasks match this status.</div>}</div><div className="panel-bottom-link"><a href="#orphans">Review traceability gaps <span>→</span></a></div></section>
          <section className="panel orphan-panel" id="orphans"><button className="panel-heading orphan-heading" onClick={() => setOrphansOpen(!orphansOpen)} aria-expanded={orphansOpen}><div><h2>Traceability gaps <Pill kind="status-missing">{orphanAnnotations.length + orphanTasks.length}</Pill></h2><p>Records with unknown requirement references</p></div><span className="collapse-icon">{orphansOpen ? '−' : '+'}</span></button>{orphansOpen && <div className="orphan-content"><div className="orphan-section-title"><span>ANNOTATIONS</span><Pill kind="task-open">{orphanAnnotations.length}</Pill></div>{orphanAnnotations.map((item) => <div className="orphan-item" key={item.id}><span className="orphan-file-icon">⌘</span><div><strong>{item.filePath}</strong><span>Line {item.line} · {item.type} · <em>{item.requirementId}</em></span></div></div>)}<div className="orphan-section-title task-orphan-title"><span>TASKS</span><Pill kind="task-open">{orphanTasks.length}</Pill></div>{orphanTasks.map((item) => <div className="orphan-item" key={item.id}><span className="orphan-file-icon">☷</span><div><strong>{item.title}</strong><span>{item.id} · <em>{item.requirementId}</em></span></div></div>)}{orphanAnnotations.length + orphanTasks.length === 0 && <p className="mini-empty">No orphan records detected.</p>}</div>}</section></div>
        <footer className="page-footer"><span><span className="footer-mark">S</span> SDD Navigator <b>·</b> Specification-driven engineering</span><span>Last updated {shortDate(stats.lastScanAt)}</span></footer>
      </div>
    </section>
  </main>;
}
