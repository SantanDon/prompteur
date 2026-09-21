import { readFile } from 'node:fs/promises';
import { createPairedEvaluationRun } from '../evaluations/paired.js';

const cases = JSON.parse(await readFile(new URL('../evaluations/cases.json', import.meta.url), 'utf8'));
const run = createPairedEvaluationRun(cases);

for (const record of run.records) {
  const { raw, baseline, delta } = record.comparison.contractCoverage;
  console.log(
    `${record.case.id} · contract coverage raw ${raw.toFixed(2)} → baseline ${baseline.toFixed(2)} ` +
    `(Δ ${delta >= 0 ? '+' : ''}${delta.toFixed(2)}) · task quality ${record.comparison.taskQualityVerdict}`,
  );
}

console.log(
  `\nPaired deterministic evaluation: ${run.summary.baselineContractChecksPassed}/${run.recordCount} baseline contract checks passed; ` +
  `${run.summary.baselineHardConstraintsPreserved}/${run.recordCount} cases preserved extracted hard constraints.`,
);
console.log('No downstream model execution was run; no prompt is labeled improved.');

if (
  run.summary.baselineContractChecksPassed !== run.recordCount ||
  run.summary.baselineHardConstraintsPreserved !== run.recordCount
) {
  process.exitCode = 1;
}
