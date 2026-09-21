import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createPairedEvaluationRecord, createPairedEvaluationRun } from '../evaluations/paired.js';
import { compileRequest } from '../src/core/pipeline.js';

const cases = JSON.parse(await readFile(new URL('../evaluations/cases.json', import.meta.url), 'utf8'));

function caseById(id) {
  const found = cases.find((item) => item.id === id);
  assert.ok(found, `missing evaluation case ${id}`);
  return found;
}

function evidenceByValue(record, dimension, value) {
  return record.changeEvidence[dimension].find((entry) => entry.value === value);
}

test('paired evaluation preserves the raw arm exactly and uses compileRequest for the baseline prompt', () => {
  const testCase = caseById('coding-agent-contract');
  const record = createPairedEvaluationRecord(testCase);
  const compiled = compileRequest(testCase.input, testCase.options);

  assert.equal(record.schemaVersion, '1.4');
  assert.equal(record.kind, 'prompteur.paired-evaluation');
  assert.equal(record.arms.raw.prompt, testCase.input);
  assert.equal(record.arms.baseline.prompt, compiled.prompt);
  assert.equal(record.compiler.version, compiled.engine.version);
  assert.equal(record.compiler.provenance.target, compiled.provenance.target);
  assert.deepEqual(Object.keys(record.changeEvidence), [
    'objective',
    'context',
    'constraints',
    'output_contract',
    'verification_behavior',
  ]);
});

test('paired records are reproducible when no wall-clock record timestamp is requested', () => {
  const testCase = caseById('research-current-sources');
  const first = createPairedEvaluationRecord(testCase);
  const second = createPairedEvaluationRecord(testCase);
  assert.deepEqual(first, second);
});

test('compiler-only comparison never claims downstream task-quality improvement', () => {
  const record = createPairedEvaluationRecord(caseById('vague-reference'));
  assert.equal(record.comparison.taskQualityVerdict, 'not_evaluated');
  assert.equal(record.comparison.mayLabelImproved, false);
  assert.equal(record.evidenceBoundary.downstreamExecution, 'not_run');
  assert.equal(record.evidenceBoundary.qualityGrading, 'not_available');
  assert.equal(record.arms.raw.execution.output, null);
  assert.equal(record.arms.baseline.execution.output, null);
});

test('paired records account for extracted hard-constraint preservation', () => {
  const record = createPairedEvaluationRecord(caseById('coding-agent-contract'));
  assert.ok(record.arms.baseline.hardConstraintChecks.total > 0);
  assert.equal(record.arms.baseline.hardConstraintChecks.coverage, 1);
  assert.equal(record.comparison.hardConstraintPreservation.baseline, 1);
});

test('change evidence keeps explicit user constraints user-supplied', () => {
  const record = createPairedEvaluationRecord({
    id: 'provenance-user-constraint',
    input: 'Build the parser. Must not use network access.',
    options: {},
  });
  const constraint = record.changeEvidence.constraints.find((entry) => entry.value === 'Must not use network access.');
  assert.ok(constraint);
  assert.equal(constraint.effect, 'made_explicit');
  assert.equal(constraint.provenance, 'user_supplied');
  assert.equal(constraint.source, 'input:constraint_statement');
});

test('change evidence marks audience and deliverable compiler options as option-supplied', () => {
  const record = createPairedEvaluationRecord({
    id: 'provenance-options',
    input: 'Explain the release plan.',
    options: {
      audience: 'engineering leads',
      deliverable: 'a three-row decision table',
      outputFormat: 'table',
      tone: 'direct',
      verify: true,
    },
  });

  assert.equal(evidenceByValue(record, 'context', 'engineering leads')?.provenance, 'option_supplied');
  assert.equal(evidenceByValue(record, 'output_contract', 'a three-row decision table')?.provenance, 'option_supplied');
  assert.equal(evidenceByValue(record, 'output_contract', 'format:table')?.provenance, 'option_supplied');
  assert.equal(evidenceByValue(record, 'output_contract', 'tone:direct')?.provenance, 'option_supplied');
  assert.equal(evidenceByValue(record, 'verification_behavior', 'verification:enabled')?.provenance, 'option_supplied');
});

test('default verification is compiler-added rather than attributed to the user', () => {
  const record = createPairedEvaluationRecord({
    id: 'provenance-default-verification',
    input: 'Summarize the note.',
    options: {},
  });
  const verification = evidenceByValue(record, 'verification_behavior', 'verification:enabled');
  assert.ok(verification);
  assert.equal(verification.effect, 'added');
  assert.equal(verification.provenance, 'compiler_added');
  assert.equal(verification.source, 'compiler:verification_default');
});

test('deterministic format inference is labeled inferred and vague defaults are not user-supplied', () => {
  const inferred = createPairedEvaluationRecord({
    id: 'provenance-inferred-format',
    input: 'Return JSON with the title and status.',
    options: {},
  });
  assert.equal(evidenceByValue(inferred, 'output_contract', 'format:json')?.provenance, 'inferred');

  const vague = createPairedEvaluationRecord({
    id: 'provenance-vague-defaults',
    input: 'Help with this.',
    options: {},
  });
  const additions = vague.changeEvidence.output_contract;
  assert.ok(additions.length > 0);
  assert.equal(additions.some((entry) => entry.provenance === 'user_supplied'), false);
  assert.equal(evidenceByValue(vague, 'output_contract', 'format:auto')?.provenance, 'compiler_added');
  assert.equal(evidenceByValue(vague, 'output_contract', 'tone:neutral')?.provenance, 'compiler_added');
});

test('target behavior separates the option-supplied target from compiler-added execution guidance', () => {
  const record = createPairedEvaluationRecord({
    id: 'provenance-target-guidance',
    input: 'Fix the failing test.',
    options: { target: 'agent' },
  });
  assert.equal(evidenceByValue(record, 'verification_behavior', 'target:agent')?.provenance, 'option_supplied');
  assert.equal(evidenceByValue(record, 'verification_behavior', 'target_execution_guidance:agent')?.provenance, 'compiler_added');
});

test('paired run keeps provider metrics explicitly unavailable until downstream execution exists', () => {
  const run = createPairedEvaluationRun(cases);
  assert.equal(run.recordCount, cases.length);
  assert.equal(run.summary.taskQualityEvaluated, 0);
  assert.equal(run.summary.improvedLabelsIssued, 0);
  assert.equal(run.summary.baselineContractChecksPassed, cases.length);
  assert.equal(run.summary.baselineHardConstraintsPreserved, cases.length);

  for (const record of run.records) {
    for (const arm of [record.arms.raw, record.arms.baseline]) {
      assert.equal(arm.metrics.inputTokens, null);
      assert.equal(arm.metrics.outputTokens, null);
      assert.equal(arm.metrics.latencyMs, null);
      assert.equal(arm.metrics.costUsd, null);
    }
  }
});

test('paired evaluation module has no provider or network dependency', async () => {
  const source = await readFile(new URL('../evaluations/paired.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /providers\/client|fetch\s*\(|https?:\/\//i);
});

test('paired records distinguish explicit profile variants without claiming downstream improvement', () => {
  const record = createPairedEvaluationRecord({
    id: 'managed-agent-profile',
    input: 'Review the repository and implement a safe fix.',
    options: { target: 'agent', profile: 'managed-coding-agent' },
  });

  assert.equal(record.compiler.provenance.profile, 'managed-coding-agent');
  assert.equal(record.compiler.provenance.profileRegistryVersion, '1.0');
  assert.equal(record.comparison.taskQualityVerdict, 'not_evaluated');
  assert.equal(record.comparison.mayLabelImproved, false);
  assert.equal(record.evidenceBoundary.downstreamExecution, 'not_run');
});

test('candidate arm records an explicit profile variant without changing the baseline arm', () => {
  const testCase = {
    id: 'managed-agent-candidate',
    input: 'Review the repository and implement a safe fix.',
    options: { target: 'agent' },
  };
  const record = createPairedEvaluationRecord(testCase, {
    candidateOptions: { profile: 'managed-coding-agent' },
  });

  assert.equal(record.compiler.provenance.profile, null);
  assert.equal(record.arms.baseline.kind, 'deterministic_baseline');
  assert.equal(record.arms.candidate.kind, 'deterministic_candidate');
  assert.equal(record.arms.candidate.compiler.provenance.profile, 'managed-coding-agent');
  assert.equal(record.arms.candidate.execution.status, 'not_run');
  assert.equal(record.comparison.candidate.taskQualityVerdict, 'not_evaluated');
  assert.equal(record.comparison.candidate.mayLabelImproved, false);
  assert.ok(record.comparison.candidate.promptCharacterDeltaFromBaseline < 0);
  assert.doesNotMatch(record.arms.candidate.prompt, /Inspect the available context and tools before changing anything\./);
  assert.match(record.arms.baseline.prompt, /Inspect the available context and tools before changing anything\./);
});

test('candidate arm is absent unless candidate options are explicitly supplied', () => {
  const record = createPairedEvaluationRecord({
    id: 'no-candidate-by-default',
    input: 'Implement the requested change.',
    options: { target: 'agent' },
  });

  assert.equal('candidate' in record.arms, false);
  assert.equal(record.comparison.candidate, null);
  assert.equal(record.comparison.mayLabelImproved, false);
});
