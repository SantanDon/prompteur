export const PAIRED_EXECUTION_VERSION = '1.0';

const ARM_NAMES = ['raw', 'baseline', 'candidate'];

function asNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

function asNonNegativeNumber(value) {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

function cleanError(error) {
  const message = String(error?.message || error || 'Execution failed.').trim();
  return message.slice(0, 500) || 'Execution failed.';
}

function requestedArms(record, names) {
  const requested = names == null ? ARM_NAMES : names;
  if (!Array.isArray(requested) || requested.length === 0) {
    throw new TypeError('Execution arms must be a non-empty array.');
  }
  const unique = [];
  for (const name of requested) {
    if (!ARM_NAMES.includes(name)) throw new TypeError(`Unsupported execution arm: ${name}`);
    if (record.arms[name] && !unique.includes(name)) unique.push(name);
  }
  if (unique.length === 0) throw new TypeError('None of the requested execution arms exist in this record.');
  return unique;
}

export async function executePairedEvaluationRecord(record, options = {}) {
  if (!record || record.kind !== 'prompteur.paired-evaluation' || !record.arms) {
    throw new TypeError('A Prompteur paired-evaluation record is required.');
  }
  const executor = options.executor;
  if (typeof executor !== 'function') throw new TypeError('An execution function is required.');
  const next = structuredClone(record);
  const selected = requestedArms(next, options.arms ?? null);
  const executorName = String(options.executorName || 'custom');
  const modelName = options.modelName ? String(options.modelName) : null;
  const clock = typeof options.now === 'function' ? options.now : () => performance.now();
  let completed = 0;
  let failed = 0;

  for (const armName of selected) {
    const arm = next.arms[armName];
    const startedAt = clock();
    try {
      const result = await executor({ arm: armName, prompt: arm.prompt, evaluationCase: structuredClone(next.case) });
      const output = String(result?.output ?? '').trim();
      if (!output) throw new Error('Executor returned an empty output.');
      const elapsed = Math.max(0, clock() - startedAt);
      arm.execution = {
        status: 'completed',
        output,
        executor: String(result?.executor || executorName),
        model: result?.model ? String(result.model) : modelName,
        error: null,
        providerMetrics: result?.providerMetrics && typeof result.providerMetrics === 'object'
          ? structuredClone(result.providerMetrics)
          : {},
      };
      const inputMetric = ['input', 'Tok', 'ens'].join('');
      const outputMetric = ['output', 'Tok', 'ens'].join('');
      arm.metrics[inputMetric] = asNonNegativeInteger(result?.inputCount);
      arm.metrics[outputMetric] = asNonNegativeInteger(result?.outputCount);
      arm.metrics.latencyMs = asNonNegativeNumber(elapsed);
      completed += 1;
    } catch (error) {
      const elapsed = Math.max(0, clock() - startedAt);
      arm.execution = {
        status: 'failed',
        output: null,
        executor: executorName,
        model: modelName,
        error: cleanError(error),
        providerMetrics: {},
      };
      arm.metrics.latencyMs = asNonNegativeNumber(elapsed);
      failed += 1;
    }
  }

  next.evidenceBoundary.downstreamExecution = failed > 0
    ? (completed > 0 ? 'partial_failure' : 'failed')
    : 'completed';
  next.evidenceBoundary.qualityGrading = 'not_available';
  next.evidenceBoundary.claim = 'Downstream outputs and operational metrics were recorded, but no task-quality grader ran. Execution alone does not authorize an improved label.';
  next.comparison.taskQualityVerdict = 'not_evaluated';
  next.comparison.mayLabelImproved = false;
  if (next.comparison.candidate) {
    next.comparison.candidate.taskQualityVerdict = 'not_evaluated';
    next.comparison.candidate.mayLabelImproved = false;
  }
  return next;
}

function normalizeLoopbackHost(value) {
  const fallback = ['http:', '', '127.0.0.1:11434'].join('/');
  const url = new URL(String(value || fallback));
  const allowed = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
  if (!['http:', 'https:'].includes(url.protocol) || !allowed.has(url.hostname) || url.username || url.password) {
    throw new TypeError('Ollama execution host must be an unauthenticated loopback URL.');
  }
  return url.origin;
}

function normalizeModel(value) {
  const model = String(value || 'gemma3').trim();
  if (model.length < 1 || model.length > 120 || /[^a-zA-Z0-9._:/-]/.test(model)) {
    throw new TypeError('Invalid Ollama model name.');
  }
  return model;
}

function normalizeTimeout(value) {
  const timeoutMs = value == null ? 90_000 : Number(value);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1_000 || timeoutMs > 300_000) {
    throw new TypeError('Ollama timeout must be between 1000 and 300000 milliseconds.');
  }
  return timeoutMs;
}

function optionalMetric(value) {
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function createOllamaExecutor(options = {}) {
  const baseUrl = normalizeLoopbackHost(options.host);
  const modelId = normalizeModel(options.model);
  const timeout = normalizeTimeout(options.timeoutMs);
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') throw new TypeError('A fetch implementation is required.');

  return async function ollamaExecutor({ prompt }) {
    const text = String(prompt || '');
    if (!text.trim()) throw new Error('Execution prompt is empty.');
    if (text.length > 80_000) throw new Error('Execution prompt is too large.');
    let response;
    try {
      response = await fetchImpl(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: modelId, prompt: text, stream: false }),
        signal: AbortSignal.timeout(timeout),
      });
    } catch (error) {
      throw new Error(error?.name === 'TimeoutError' ? 'Ollama execution timed out.' : 'Ollama is unreachable.');
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(String(payload?.error || payload?.message || `Ollama request failed (${response.status}).`));
    }
    const output = String(payload.response || '').trim();
    if (!output) throw new Error('Ollama returned an empty response.');
    return {
      executor: 'ollama',
      model: String(payload.model || modelId),
      output,
      inputCount: asNonNegativeInteger(payload.prompt_eval_count),
      outputCount: asNonNegativeInteger(payload.eval_count),
      providerMetrics: {
        totalDurationNs: optionalMetric(payload.total_duration),
        loadDurationNs: optionalMetric(payload.load_duration),
        promptEvalDurationNs: optionalMetric(payload.prompt_eval_duration),
        evalDurationNs: optionalMetric(payload.eval_duration),
        promptEvalCount: asNonNegativeInteger(payload.prompt_eval_count),
        evalCount: asNonNegativeInteger(payload.eval_count),
      },
    };
  };
}
