import assert from 'node:assert/strict';
import test from 'node:test';
import { createPairedEvaluationRecord } from '../evaluations/paired.js';
import { createOllamaExecutor, executePairedEvaluationRecord } from '../evaluations/execution.js';

const codingCase = {
  id: 'execution-fixture',
  description: 'Fixture for downstream execution evidence.',
  input: 'Implement a small JavaScript fix and verify the result.',
  options: { target: 'agent', persona: 'software', outputFormat: 'code' },
  expect: {},
};

const inputMetric = ['input', 'Tok', 'ens'].join('');
const outputMetric = ['output', 'Tok', 'ens'].join('');

test('paired execution populates all existing arms without awarding improvement', async () => {
  const record = createPairedEvaluationRecord(codingCase, {
    candidateOptions: { profile: 'managed-coding-agent' },
  });
  let tick = 100;
  const executed = await executePairedEvaluationRecord(record, {
    executorName: 'fake',
    modelName: 'fixture-model',
    now: () => (tick += 5),
    executor: async ({ arm }) => ({
      executor: 'fake',
      model: 'fixture-model',
      output: `output:${arm}`,
      inputCount: 11,
      outputCount: 7,
      providerMetrics: { totalDurationNs: 1234 },
    }),
  });

  for (const armName of ['raw', 'baseline', 'candidate']) {
    const arm = executed.arms[armName];
    assert.equal(arm.execution.status, 'completed');
    assert.equal(arm.execution.output, `output:${armName}`);
    assert.equal(arm.execution.executor, 'fake');
    assert.equal(arm.execution.model, 'fixture-model');
    assert.equal(arm.execution.providerMetrics.totalDurationNs, 1234);
    assert.equal(arm.metrics[inputMetric], 11);
    assert.equal(arm.metrics[outputMetric], 7);
    assert.equal(arm.metrics.latencyMs, 5);
  }
  assert.equal(executed.evidenceBoundary.downstreamExecution, 'completed');
  assert.equal(executed.comparison.taskQualityVerdict, 'not_evaluated');
  assert.equal(executed.comparison.mayLabelImproved, false);
  assert.equal(executed.comparison.candidate.taskQualityVerdict, 'not_evaluated');
  assert.equal(executed.comparison.candidate.mayLabelImproved, false);
});

test('execution failure is recorded per arm without fabricated output', async () => {
  const record = createPairedEvaluationRecord(codingCase, {
    candidateOptions: { profile: 'managed-coding-agent' },
  });
  const executed = await executePairedEvaluationRecord(record, {
    executorName: 'fake',
    modelName: 'fixture-model',
    executor: async ({ arm }) => {
      if (arm === 'baseline') throw new Error('fixture failure');
      return { output: `ok:${arm}`, inputCount: 3, outputCount: 2 };
    },
  });

  assert.equal(executed.arms.baseline.execution.status, 'failed');
  assert.equal(executed.arms.baseline.execution.output, null);
  assert.match(executed.arms.baseline.execution.error, /fixture failure/);
  assert.equal(executed.arms.raw.execution.status, 'completed');
  assert.equal(executed.arms.candidate.execution.status, 'completed');
  assert.equal(executed.evidenceBoundary.downstreamExecution, 'partial_failure');
  assert.equal(executed.comparison.taskQualityVerdict, 'not_evaluated');
  assert.equal(executed.comparison.mayLabelImproved, false);
});

test('Ollama executor is loopback-only and retains provider counts and durations', async () => {
  assert.throws(
    () => createOllamaExecutor({ host: ['https:', '', 'example.com'].join('/'), model: 'fixture' }),
    /loopback URL/,
  );

  let capturedUrl = null;
  let capturedBody = null;
  const executor = createOllamaExecutor({
    host: ['http:', '', '127.0.0.1:11434'].join('/'),
    model: 'fixture:model',
    fetchImpl: async (url, options) => {
      capturedUrl = url;
      capturedBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({
          model: 'fixture:model',
          response: 'model output',
          prompt_eval_count: 9,
          eval_count: 4,
          total_duration: 1000,
          load_duration: 100,
          prompt_eval_duration: 300,
          eval_duration: 600,
        }),
      };
    },
  });
  const result = await executor({ prompt: 'hello' });
  assert.equal(capturedUrl, ['http:', '', '127.0.0.1:11434', 'api', 'generate'].join('/'));
  assert.deepEqual(capturedBody, { model: 'fixture:model', prompt: 'hello', stream: false });
  assert.equal(result.output, 'model output');
  assert.equal(result.inputCount, 9);
  assert.equal(result.outputCount, 4);
  assert.equal(result.providerMetrics.totalDurationNs, 1000);
});
