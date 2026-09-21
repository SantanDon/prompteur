# Prompteur v0.4 — Explicit Downstream Execution Slice

Date: 2026-09-21

## Decision

The next bounded v0.4 evidence slice is implemented and locally verified. Prompteur now has an explicit downstream execution layer for paired evaluations without changing the ordinary deterministic compiler path or promoting the experimental `managed-coding-agent` profile.

Two Antigravity implementation attempts were reviewed and rejected because they only reran existing Slice 1–3 checks and did not create the requested execution adapter, CLI, tests, or report. The final implementation was completed directly against the verified working tree and then re-tested.

## Files added

- `evaluations/execution.js`
  - opt-in `executePairedEvaluationRecord` API;
  - injected executor contract so tests do not require a running model;
  - per-arm success/failure evidence;
  - wall-clock latency and provider-reported operational counts/timings;
  - localhost-only Ollama adapter using `/api/generate` with `stream: false`;
  - bounded prompt size and timeout;
  - loopback host validation and conservative model-name validation.
- `scripts/paired-execute.js`
  - explicit operator CLI for Raw/Baseline/optional Candidate execution;
  - requires case, local model, and output path;
  - optional arm selection, candidate profile, loopback host, and timeout;
  - refuses an existing output before model execution unless `--overwrite` is explicitly supplied;
  - writes a durable JSON execution record and exits non-zero when requested execution fails.
- `tests/paired-execution.test.js`
  - fake-executor coverage for Raw/Baseline/Candidate population;
  - per-arm failure coverage without fabricated output;
  - proof that execution never awards an improvement claim;
  - loopback-only Ollama validation and provider-metric retention.
- `.ai-bridge/OLLAMA_UNAVAILABLE_PROBE_2026-09-21.json`
  - real local-unavailable probe showing a failed Raw arm with `output: null`, `error: "Ollama is unreachable."`, and `taskQualityVerdict: "not_evaluated"`.

## Files updated

- `evaluations/paired.js`
  - paired record schema version moved from `1.3` to `1.4`.
- `evaluations/paired-record.schema.json`
  - execution evidence can now be `not_run`, `completed`, or `failed` per arm;
  - downstream execution summary can be `not_run`, `completed`, `partial_failure`, or `failed`;
  - completed/failed arms may retain output, executor/model identity, sanitized error text, and provider metrics.
- `evaluations/README.md`
  - documents schema `1.4`, the execution/grading boundary, local-only backend, CLI usage, and overwrite behavior.
- `tests/paired-evaluation.test.js`
  - updated the expected paired schema version to `1.4`.

## Evidence boundary

This slice deliberately does **not** add a prompt optimizer or quality grader. Successful model execution only proves that an arm produced an output and provides operational evidence. It does not establish that the output is better.

The implementation therefore preserves:

- `taskQualityVerdict: "not_evaluated"`;
- `mayLabelImproved: false`;
- the ordinary deterministic compiler as the default path;
- the `managed-coding-agent` profile as explicit-only and experimental;
- no automatic network/model execution during compile, browser, MCP, HTTP, or `npm run check`;
- no cloud/Gemini execution in this slice.

## Safety properties verified

The Ollama adapter accepts only loopback hosts (`127.0.0.1`, `localhost`, or loopback IPv6), rejects credential-bearing/non-loopback URLs, bounds prompt size and execution timeout, and records failure rather than manufacturing output. The CLI performs its existing-output check before invoking the model so an accidental rerun does not spend local compute before discovering it cannot write the result.

## Verification

Final-state checks:

- `node --test tests/paired-execution.test.js` — **3/3 passed**.
- `node --test tests/paired-evaluation.test.js` — **14/14 passed**.
- `node scripts/paired-execute.js --help` — **passed**.
- JSON parse of `evaluations/paired-record.schema.json` — **passed**.
- `npm run check` — **47 passed, 0 failed, 1 expected Windows symlink-permission skip**; deterministic evaluation **6/6 passed**.
- real localhost Ollama probe — provider currently unavailable; the record was still written safely with the requested arm marked `failed`, `output: null`, and no quality claim.
- repeated CLI call to the same probe path without `--overwrite` — **refused before execution** with an explicit existing-output error.

## Next evidence gate

Do not build Slice 4 or promote the managed-agent profile yet. When a local Ollama model is available, run the same representative tasks through Raw, deterministic Baseline, and explicit Candidate arms using schema `1.4`. Then grade outputs with an independent, task-specific rubric covering correctness, hard-constraint adherence, unsupported assumptions, safety, and verification quality. Only after multiple tasks show equal-or-better task success with a measurable efficiency benefit should the harness profile be considered for promotion or a bounded optimizer experiment.
