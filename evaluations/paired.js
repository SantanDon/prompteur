import { compileRequest } from '../src/core/pipeline.js';

export const PAIRED_EVALUATION_SCHEMA_VERSION = '1.4';

function includesCaseInsensitive(value, fragment) {
  return String(value).toLowerCase().includes(String(fragment).toLowerCase());
}

function roundRatio(value) {
  return Math.round(value * 10_000) / 10_000;
}

function buildMetrics(prompt) {
  return {
    promptCharacters: prompt.length,
    inputTokens: null,
    outputTokens: null,
    latencyMs: null,
    costUsd: null,
  };
}

function buildContractChecks(prompt, expect = {}, analysis = null) {
  const required = (expect.outputIncludes || []).map((fragment) => ({
    fragment,
    present: includesCaseInsensitive(prompt, fragment),
  }));
  const forbidden = (expect.outputExcludes || []).map((fragment) => ({
    fragment,
    absent: !includesCaseInsensitive(prompt, fragment),
  }));
  const checks = [
    ...required.map((item) => item.present),
    ...forbidden.map((item) => item.absent),
  ];
  const passed = checks.filter(Boolean).length;
  const expectedIssueIds = expect.issueIds || [];
  const observedIssueIds = analysis ? analysis.issues.map((issue) => issue.id) : null;
  const issueIdsSatisfied = analysis
    ? expectedIssueIds.every((issueId) => observedIssueIds.includes(issueId))
    : null;

  return {
    required,
    forbidden,
    expectedIssueIds,
    observedIssueIds,
    issueIdsSatisfied,
    passed,
    total: checks.length,
    coverage: checks.length === 0 ? 1 : roundRatio(passed / checks.length),
  };
}

function buildConstraintChecks(prompt, constraints) {
  const items = constraints.map((constraint) => ({
    constraint,
    preserved: includesCaseInsensitive(prompt, constraint),
  }));
  const preserved = items.filter((item) => item.preserved).length;
  return {
    items,
    preserved,
    total: items.length,
    coverage: items.length === 0 ? 1 : roundRatio(preserved / items.length),
  };
}

function compilerVerdict(rawCoverage, baselineCoverage) {
  if (baselineCoverage > rawCoverage) return 'baseline_contract_coverage_higher';
  if (baselineCoverage < rawCoverage) return 'baseline_contract_coverage_lower';
  return 'contract_coverage_equal';
}

function hasExplicitOption(options, key) {
  return Object.hasOwn(options, key) && options[key] !== undefined && options[key] !== null && options[key] !== '';
}

function evidence(effect, value, provenance, source) {
  return { effect, value, provenance, source };
}

function buildChangeEvidence(compiled, sourceOptions) {
  const { ir } = compiled;
  const objective = [
    evidence('preserved', ir.objective, 'user_supplied', 'input:first_statement'),
  ];

  const context = [
    ...ir.context.map((value) => evidence('made_explicit', value, 'user_supplied', 'input:context_statement')),
  ];
  if (hasExplicitOption(sourceOptions, 'audience') && ir.audience) {
    context.push(evidence('made_explicit', ir.audience, 'option_supplied', 'options.audience'));
  }

  const constraints = ir.constraints.map((value) => (
    evidence('made_explicit', value, 'user_supplied', 'input:constraint_statement')
  ));

  const outputContract = [];
  if (hasExplicitOption(sourceOptions, 'deliverable') && ir.output.description) {
    outputContract.push(evidence('made_explicit', ir.output.description, 'option_supplied', 'options.deliverable'));
  }

  if (hasExplicitOption(sourceOptions, 'outputFormat')) {
    outputContract.push(evidence('made_explicit', `format:${ir.output.format}`, 'option_supplied', 'options.outputFormat'));
  } else if (ir.output.format !== 'auto') {
    outputContract.push(evidence('made_explicit', `format:${ir.output.format}`, 'inferred', 'input:format_inference'));
  } else {
    outputContract.push(evidence('added', 'format:auto', 'compiler_added', 'compiler:output_format_default'));
  }

  if (hasExplicitOption(sourceOptions, 'tone')) {
    outputContract.push(evidence('made_explicit', `tone:${ir.behavior.tone}`, 'option_supplied', 'options.tone'));
  } else {
    outputContract.push(evidence('added', `tone:${ir.behavior.tone}`, 'compiler_added', 'compiler:tone_default'));
  }

  const verificationBehavior = [
    ...ir.quality.criteria.map((value) => evidence('made_explicit', value, 'user_supplied', 'input:success_criterion')),
  ];

  if (ir.quality.verify) {
    const explicitlyEnabled = hasExplicitOption(sourceOptions, 'verify') && sourceOptions.verify === true;
    verificationBehavior.push(evidence(
      explicitlyEnabled ? 'made_explicit' : 'added',
      'verification:enabled',
      explicitlyEnabled ? 'option_supplied' : 'compiler_added',
      explicitlyEnabled ? 'options.verify' : 'compiler:verification_default',
    ));
  } else {
    verificationBehavior.push(evidence('made_explicit', 'verification:disabled', 'option_supplied', 'options.verify'));
  }

  if (ir.behavior.target !== 'general') {
    verificationBehavior.push(evidence('made_explicit', `target:${ir.behavior.target}`, 'option_supplied', 'options.target'));
    verificationBehavior.push(evidence('added', `target_execution_guidance:${ir.behavior.target}`, 'compiler_added', `compiler:target:${ir.behavior.target}`));
  }

  if (ir.behavior.persona !== 'none') {
    verificationBehavior.push(evidence('made_explicit', `persona:${ir.behavior.persona}`, 'option_supplied', 'options.persona'));
  }

  if (ir.behavior.untrustedInput) {
    verificationBehavior.push(evidence('made_explicit', 'untrusted_input:detected', 'inferred', 'input:instruction_boundary_inference'));
    verificationBehavior.push(evidence('added', 'input_boundary:untrusted_data', 'compiler_added', 'compiler:untrusted_input_boundary'));
  }

  return {
    objective,
    context,
    constraints,
    output_contract: outputContract,
    verification_behavior: verificationBehavior,
  };
}

export function createPairedEvaluationRecord(testCase, { recordedAt = null, candidateOptions = null } = {}) {
  if (!testCase || typeof testCase !== 'object' || Array.isArray(testCase)) {
    throw new TypeError('Paired evaluation case must be an object.');
  }
  if (typeof testCase.id !== 'string' || typeof testCase.input !== 'string') {
    throw new TypeError('Paired evaluation case requires string id and input fields.');
  }

  const options = testCase.options || {};
  const expect = testCase.expect || {};
  const compiled = compileRequest(testCase.input, options);
  const constraints = compiled.ir.constraints;
  const candidateConfig = candidateOptions && typeof candidateOptions === 'object' && !Array.isArray(candidateOptions)
    ? structuredClone(candidateOptions)
    : null;
  const candidateCompiled = candidateConfig
    ? compileRequest(testCase.input, { ...options, ...candidateConfig })
    : null;

  const rawContract = buildContractChecks(testCase.input, expect);
  const baselineContract = buildContractChecks(compiled.prompt, expect, compiled.analysis);
  const rawConstraints = buildConstraintChecks(testCase.input, constraints);
  const baselineConstraints = buildConstraintChecks(compiled.prompt, constraints);
  const rawCoverage = rawContract.coverage;
  const baselineCoverage = baselineContract.coverage;
  const candidateContract = candidateCompiled
    ? buildContractChecks(candidateCompiled.prompt, expect, candidateCompiled.analysis)
    : null;
  const candidateConstraints = candidateCompiled
    ? buildConstraintChecks(candidateCompiled.prompt, constraints)
    : null;
  const candidateArm = candidateCompiled
    ? {
      kind: 'deterministic_candidate',
      prompt: candidateCompiled.prompt,
      options: candidateConfig,
      compiler: {
        name: candidateCompiled.engine.name,
        version: candidateCompiled.engine.version,
        mode: candidateCompiled.engine.mode,
        pipelineSchemaVersion: candidateCompiled.schemaVersion,
        provenance: {
          sourceCharacters: candidateCompiled.provenance.sourceCharacters,
          target: candidateCompiled.provenance.target,
          profile: candidateCompiled.provenance.profile,
          profileRegistryVersion: candidateCompiled.provenance.profileRegistryVersion,
        },
      },
      contractChecks: candidateContract,
      hardConstraintChecks: candidateConstraints,
      metrics: buildMetrics(candidateCompiled.prompt),
      execution: { status: 'not_run', output: null },
    }
    : null;

  return {
    schemaVersion: PAIRED_EVALUATION_SCHEMA_VERSION,
    kind: 'prompteur.paired-evaluation',
    recordedAt,
    case: {
      id: testCase.id,
      description: typeof testCase.description === 'string' ? testCase.description : '',
      input: testCase.input,
      options: structuredClone(options),
    },
    compiler: {
      name: compiled.engine.name,
      version: compiled.engine.version,
      mode: compiled.engine.mode,
      pipelineSchemaVersion: compiled.schemaVersion,
      provenance: {
        sourceCharacters: compiled.provenance.sourceCharacters,
        target: compiled.provenance.target,
        profile: compiled.provenance.profile,
        profileRegistryVersion: compiled.provenance.profileRegistryVersion,
      },
    },
    arms: {
      raw: {
        kind: 'raw',
        prompt: testCase.input,
        contractChecks: rawContract,
        hardConstraintChecks: rawConstraints,
        metrics: buildMetrics(testCase.input),
        execution: { status: 'not_run', output: null },
      },
      baseline: {
        kind: 'deterministic_baseline',
        prompt: compiled.prompt,
        contractChecks: baselineContract,
        hardConstraintChecks: baselineConstraints,
        metrics: buildMetrics(compiled.prompt),
        execution: { status: 'not_run', output: null },
      },
      ...(candidateArm ? { candidate: candidateArm } : {}),
    },
    changeEvidence: buildChangeEvidence(compiled, options),
    comparison: {
      contractCoverage: {
        raw: rawCoverage,
        baseline: baselineCoverage,
        delta: roundRatio(baselineCoverage - rawCoverage),
      },
      hardConstraintPreservation: {
        raw: rawConstraints.coverage,
        baseline: baselineConstraints.coverage,
      },
      candidate: candidateArm ? {
        contractCoverage: candidateContract.coverage,
        contractCoverageDeltaFromBaseline: roundRatio(candidateContract.coverage - baselineCoverage),
        hardConstraintPreservation: candidateConstraints.coverage,
        promptCharacterDeltaFromBaseline: candidateCompiled.prompt.length - compiled.prompt.length,
        taskQualityVerdict: 'not_evaluated',
        mayLabelImproved: false,
      } : null,
      compilerVerdict: compilerVerdict(rawCoverage, baselineCoverage),
      taskQualityVerdict: 'not_evaluated',
      mayLabelImproved: false,
    },
    evidenceBoundary: {
      downstreamExecution: 'not_run',
      qualityGrading: 'not_available',
      claim: 'This record compares deterministic contract/compiler checks and change provenance only. It does not establish downstream task quality or authorize an improved label.',
    },
  };
}

export function createPairedEvaluationRun(testCases, options = {}) {
  if (!Array.isArray(testCases)) throw new TypeError('Paired evaluation run requires an array of cases.');
  const records = testCases.map((testCase) => createPairedEvaluationRecord(testCase, options));
  return {
    schemaVersion: PAIRED_EVALUATION_SCHEMA_VERSION,
    kind: 'prompteur.paired-evaluation-run',
    recordCount: records.length,
    records,
    summary: {
      baselineContractChecksPassed: records.filter((record) => {
        const checks = record.arms.baseline.contractChecks;
        return checks.passed === checks.total && checks.issueIdsSatisfied !== false;
      }).length,
      baselineHardConstraintsPreserved: records.filter((record) => record.arms.baseline.hardConstraintChecks.coverage === 1).length,
      taskQualityEvaluated: 0,
      improvedLabelsIssued: 0,
    },
  };
}
