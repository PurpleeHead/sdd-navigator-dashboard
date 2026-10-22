import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const root = process.cwd();
const specPath = path.join(root, 'requirements.yaml');
const spec = parse(fs.readFileSync(specPath, 'utf8')) as { requirements?: Array<{ id?: string; title?: string; description?: string }> };
const requirements = spec.requirements ?? [];
const errors: string[] = [];
const seen = new Set<string>();
for (const requirement of requirements) {
  if (!requirement.id || !requirement.title || !requirement.description || !/\b(MUST|SHOULD)\b/.test(requirement.description)) errors.push(`Invalid requirement record: ${JSON.stringify(requirement)}`);
  if (requirement.id && seen.has(requirement.id)) errors.push(`Duplicate requirement ID: ${requirement.id}`);
  if (requirement.id) seen.add(requirement.id);
}
const sourceDirs = ['app', 'components', 'lib', 'tests', 'scripts'];
const files: string[] = [];
function walk(dir: string): void {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) files.push(full);
  }
}
sourceDirs.forEach((dir) => walk(path.join(root, dir)));
const found = new Map<string, Set<string>>();
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(/@req\s+([A-Z]+-[A-Z]+-\d{3})/g)) {
    const id = match[1];
    if (!id) continue;
    if (!seen.has(id)) errors.push(`Unknown requirement annotation ${id} in ${path.relative(root, file)}`);
    const group = found.get(id) ?? new Set<string>();
    group.add(file.includes(`${path.sep}tests${path.sep}`) ? 'test' : 'source');
    found.set(id, group);
  }
}
console.log('\nSDD traceability report');
console.log('=======================');
console.log(`Requirements: ${requirements.length}`);
for (const requirement of requirements) {
  const evidence = found.get(requirement.id ?? '') ?? new Set<string>();
  const source = evidence.has('source') ? 'source ✓' : 'source MISSING';
  const test = evidence.has('test') ? 'test ✓' : 'test MISSING';
  console.log(`${requirement.id}: ${source} | ${test}`);
  if (!evidence.has('source')) errors.push(`${requirement.id} has no source @req annotation`);
  if (!evidence.has('test')) errors.push(`${requirement.id} has no test @req annotation`);
}
if (errors.length) {
  console.error(`\n${errors.length} traceability issue(s):\n- ${errors.join('\n- ')}`);
  process.exitCode = 1;
} else console.log('\nAll requirements have source and test annotations. Note: annotations indicate traceability, not functional correctness; tests remain necessary.');
