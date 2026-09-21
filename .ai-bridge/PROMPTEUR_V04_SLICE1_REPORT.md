# Prompteur v0.4 Slice 1 — Paired Evaluation Report

Date: 2026-09-21

## Scope completed

Implemented the first bounded v0.4 slice from `PROMPTEUR_RESEARCH_2026-09-20.md`: a local, provider-free Raw-vs-Baseline evaluation record and runner.

This slice deliberately does **not** implement model/provider execution, UI comparison, target/harness profiles, context hydration, or optimizer loops.

## Files added

- `evaluations/paired-record.schema.json` — versioned JSON Schema for one paired evaluation record.
- `evaluations/paired.js` — deterministic record/run builder using the existing `compileRequest` pipeline.
- `scripts/paired-evaluate.js` — local runner across `evaluations/cases.json`.
- `tests/paired-evaluation.test.js` — six focused tests for record shape, reproducibility, evidence boundaries, constraint accounting, unavailable provider metrics, and provider/network isolation.
- `.ai-bridge/PROMPTEUR_V04_SLICE1_REPORT.md` — this report.

## Files updated

- `evaluations/README.md` — documents the paired-evaluation boundary and future model-backed population path.
- `package.json` — adds `npm run eval:paired` as a convenience command.

A pre-existing/concurrent edit in `tests/mcp.test.js` was preserved and not modified by this slice.

## Record contract

Each record contains:

- exact source input and compiler options,
- Raw arm (input exactly as supplied),
- deterministic Baseline arm (current `compileRequest` output),
- compiler version, pipeline schema version, and stable source/target provenance,
- deterministic contract checks,
- extracted hard-constraint preservation checks,
- prompt character counts,
- placeholders for input/output tokens, latency, and cost,
- explicit downstream execution state,
- comparative contract-coverage result,
- an evidence boundary that forbids interpreting compiler-only checks as downstream task quality.

The record intentionally omits wall-clock compiler timestamps from the stable comparison payload unless the caller explicitly supplies `recordedAt`, so repeated deterministic runs can be deep-equal.

## Evidence boundary

The runner may report that the deterministic baseline has higher **contract coverage** than the raw input when the local checks prove it. It cannot report that the baseline has better downstream task quality.

Until actual model execution and grading exist:

- `taskQualityVerdict = "not_evaluated"`
- `mayLabelImproved = false`
- downstream outputs are `null`
- token/cost/latency values that require real execution are `null`
- `improvedLabelsIssued = 0`

## Verification

### Focused paired-evaluation tests

Command:

```text
node --test tests/paired-evaluation.test.js
```

Result: **PASS — 6/6 tests**.

### Paired runner

Command:

```text
node scripts/paired-evaluate.js
```

Result: **PASS**.

Observed deterministic contract coverage:

- `vague-reference`: raw 0.50 -> baseline 1.00
- `coding-agent-contract`: raw 0.60 -> baseline 1.00
- `research-current-sources`: raw 0.40 -> baseline 1.00
- `instruction-injection-boundary`: raw 0.33 -> baseline 1.00
- `conflicting-depth`: raw 0.33 -> baseline 1.00
- `image-brief`: raw 0.40 -> baseline 1.00

Summary: **6/6 baseline contract checks passed; 6/6 cases preserved extracted hard constraints. No downstream model execution ran and no prompt was labeled improved.**

### Full Prompteur check

Command:

```text
npm run check
```

Result: **PASS**.

- Node tests: 33 passed, 0 failed, 1 skipped (Windows symlink privilege case).
- Existing deterministic evaluation: 6/6 passed.
- New paired-evaluation tests are included in the full Node test run.

## Architectural review

The slice stays inside the intended boundary:

- `compileRequest` remains the sole deterministic compiler path.
- No runtime dependencies were added.
- No provider/network call exists in the paired evaluation module.
- No execution adapter was introduced.
- No UI or product-source behavior was changed.
- No candidate can self-award an “improved” label.

## Next bounded slice

Do not jump to optimizer loops. The next research-backed slice is the evidence-aware comparison contract (objective/context/constraints/output/verification changes with explicit supplied-vs-inferred provenance). It should be implemented only after reviewing this paired record in real use and preserving the same no-unsupported-quality-claims boundary.
