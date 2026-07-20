
import { readFile } from 'node:fs/promises';
import { compileRequest } from '../src/core/pipeline.js';

const cases = JSON.parse(await readFile(new URL('../evaluations/cases.json', import.meta.url), 'utf8'));
const results = [];

function includesCaseInsensitive(value, fragment) {
  return value.toLowerCase().includes(fragment.toLowerCase());
}

for (const testCase of cases) {
  const compiled = compileRequest(testCase.input, testCase.options);
  const { analysis, prompt: output } = compiled;
  const issueIds = new Set(analysis.issues.map((item) => item.id));
  const failures = [];

  for (const expectedId of testCase.expect.issueIds || []) {
    if (!issueIds.has(expectedId)) failures.push(`missing issue: ${expectedId}`);
  }

  for (const fragment of testCase.expect.outputIncludes || []) {
    if (!includesCaseInsensitive(output, fragment)) failures.push(`missing output fragment: ${fragment}`);
  }

  for (const fragment of testCase.expect.outputExcludes || []) {
    if (includesCaseInsensitive(output, fragment)) failures.push(`forbidden output fragment: ${fragment}`);
  }

  results.push({
    id: testCase.id,
    passed: failures.length === 0,
    readiness: analysis.readiness,
    issues: analysis.issues.map((item) => item.id),
    engineVersion: compiled.engine.version,
    failures,
  });
}

const passed = results.filter((result) => result.passed).length;
const failed = results.length - passed;

for (const result of results) {
  const symbol = result.passed ? 'PASS' : 'FAIL';
  console.log(`${symbol} ${result.id} · engine ${result.engineVersion} · readiness ${result.readiness} · issues ${result.issues.join(', ') || 'none'}`);
  for (const failure of result.failures) console.log(`  - ${failure}`);
}

console.log(`\nDeterministic evaluation: ${passed}/${results.length} passed.`);
if (failed > 0) process.exitCode = 1;
