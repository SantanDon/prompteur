# Prompteur v0.4 Slice 2 — Evidence-Aware Comparison Report

Date: 2026-09-21

## Scope completed

Implemented the second bounded v0.4 slice from `PROMPTEUR_RESEARCH_2026-09-20.md`: deterministic evidence that explains what the Raw-to-Baseline compiler transformation preserved, made explicit, inferred, or added.

This work stays inside the paired-evaluation layer. It does **not** add provider execution, optimizer loops, context hydration, target/harness profile behavior, UI redesign, dependencies, network calls, or downstream quality claims.

## Files changed for Slice 2

- `evaluations/paired.js` — adds deterministic `changeEvidence` generation and bumps the paired record schema version from `1.0` to `1.1`.
- `evaluations/paired-record.schema.json` — defines the five evidence dimensions and strict evidence-entry provenance contract.
- `tests/paired-evaluation.test.js` — expands focused coverage from 6 to 11 tests, including provenance boundaries.
- `evaluations/README.md` — documents the evidence-aware contract and its non-quality boundary.
- `.ai-bridge/PROMPTEUR_V04_SLICE2_REPORT.md` — this report.

The existing concurrent Windows symlink portability edit in `tests/mcp.test.js` was preserved and not modified by this slice. Slice 1 files and behavior were retained.

## Evidence contract

Every paired record now contains `changeEvidence` with exactly five dimensions:

1. `objective`
2. `context`
3. `constraints`
4. `output_contract`
5. `verification_behavior`

Each evidence entry records:

- `effect`: `preserved`, `made_explicit`, or `added`;
- `value`: a compact deterministic representation of the affected contract item;
- `provenance`: `user_supplied`, `option_supplied`, `compiler_added`, `inferred`, or `unknown`;
- `source`: the concrete deterministic source used for that provenance decision.

## Provenance rules

The implementation is deliberately conservative:

- Objective, extracted context statements, hard constraints, and explicit success criteria are `user_supplied` because they are deterministically extracted from the source request.
- Audience, deliverable, explicit format, explicit tone, explicit verification, target, and persona selections are `option_supplied` when the caller actually supplied those options.
- Default format/tone, default verification, target execution guidance, and the untrusted-input boundary are `compiler_added` because they are emitted by compiler policy rather than stated by the user.
- `inferred` is used only for existing deterministic source-text inference already present in the current compiler, such as output-format detection and untrusted-input detection.
- The system does not guess missing semantic facts or silently elevate defaults into user intent.

## Evidence boundary preserved

Slice 2 remains descriptive rather than evaluative:

- `taskQualityVerdict` remains `not_evaluated`.
- `mayLabelImproved` remains `false`.
- Downstream outputs remain `null`.
- Provider token/cost/latency values remain unavailable until real execution exists.
- No change-evidence item is treated as proof that the Baseline is better than Raw.

## Verification

### Focused paired-evaluation tests

Command:

```text
node --test tests/paired-evaluation.test.js
```

Result: **PASS — 11/11 tests**.

The focused suite now proves, among other things:

- explicit user constraints remain `user_supplied`;
- audience/deliverable/format/tone/explicit verification options are `option_supplied`;
- default verification is `compiler_added`;
- deterministic format inference is labeled `inferred`;
- vague prompt defaults are not falsely labeled `user_supplied`;
- target selection and compiler-added target execution guidance remain distinct;
- records remain deterministic;
- no downstream-quality or `improved` claim is introduced.

### Schema parse

Command:

```text
node -e "JSON.parse(require('fs').readFileSync('evaluations/paired-record.schema.json','utf8')); console.log('schema-json-ok')"
```

Result: **PASS — schema-json-ok**.

### Full Prompteur check

Command:

```text
npm run check
```

Result: **PASS**.

- Node tests: 38 passed, 0 failed, 1 skipped.
- The only skip is the existing Windows symlink-privilege portability case.
- Existing deterministic evaluation: 6/6 passed.

### Paired runner

Command:

```text
node scripts/paired-evaluate.js
```

Result: **PASS**.

- 6/6 baseline contract checks passed.
- 6/6 cases preserved extracted hard constraints.
- No downstream model execution ran.
- No prompt was labeled improved.

## Architectural review

The Slice 2 implementation does not change the production compiler pipeline. `compileRequest` remains the sole deterministic compilation path, while evidence is derived downstream from its existing IR, caller options, and known deterministic defaults. This keeps provenance inspectable without introducing hidden context inference or a second compiler.

The next research-backed slice is the target/harness profile registry, but it should remain evidence-gated: profiles must be able to suppress redundant scaffolding as well as add compatibility instructions, and no profile behavior should become default without paired execution evidence.
