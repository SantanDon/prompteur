# Evaluations

Prompteur treats prompt behavior as testable product behavior. This directory stores representative cases independently from model providers.

## Current deterministic cases

`cases.json` contains:

- source prompt,
- target and compiler options,
- expected lint issue IDs,
- required compiled fragments,
- forbidden compiled fragments,
- a short rationale.

Run:

```bash
npm run eval
```

The runner builds Prompt IR, analyzes it, compiles the local baseline, and checks every case. It does not call a model or claim downstream output quality.

## Case design

A good case should represent a real failure mode or contract requirement. Include the smallest prompt that demonstrates the behavior. Prefer stable semantic fragments over exact full-output snapshots.

Add cases for:

- ambiguity and missing context,
- output-format contracts,
- hard-constraint preservation,
- target-specific execution instructions,
- conflicting requirements,
- untrusted source material,
- accidental prompt bloat,
- regressions reported by users.

Do not add a case merely to preserve incidental wording.

## Future model-backed evaluation

Planned evaluation records will also include:

- provider and model,
- generation settings,
- prompt version and compiler version,
- dataset input,
- generated output,
- deterministic assertions,
- grader rubric and score,
- human preference where collected,
- latency, tokens, and cost,
- run timestamp and provenance.

Model-backed results belong under `evaluations/results/` and are ignored by default until a stable, privacy-safe result format is defined.

## Paired Raw vs Baseline evaluation

Prompteur v0.4 starts with a provider-free paired record rather than claiming that a rewrite is better by appearance.

Run:

```bash
node scripts/paired-evaluate.js
```

`evaluations/paired.js` builds a versioned record for each case with two arms:

- **raw** — the user input exactly as supplied,
- **deterministic_baseline** — the existing `compileRequest` output.

The record can compare deterministic contract coverage and extracted hard-constraint preservation. Token counts, provider latency, cost, downstream outputs, and task-quality grading remain `null` / `not_evaluated` until a future execution adapter supplies real evidence. The compiler-only runner therefore never labels a prompt "improved".

The stable shape is documented in `evaluations/paired-record.schema.json`. Future model-backed execution should populate arm outputs and operational/quality metrics around this record rather than changing the deterministic compiler core.

### Evidence-aware change contract

Schema `1.1` added `changeEvidence` so the paired record can explain what the deterministic baseline did without pretending those changes are user intent. Schema `1.2` additionally records an explicitly selected harness profile and profile-registry version in compiler provenance. Schema `1.3` can also include an explicit deterministic candidate arm (for example, the baseline plus one experimental harness profile) so Raw, Baseline, and Candidate can be compared without changing the baseline or implying downstream quality. Schema `1.4` adds explicit downstream execution evidence for each arm: output text, wall-clock latency, executor/model identity, and provider-reported counts or timings. Execution alone still leaves task quality `not_evaluated` and can never authorize an `improved` label. Profiles and candidate arms remain unevaluated variants unless downstream execution and grading prove otherwise. The evidence contract has exactly five dimensions: `objective`, `context`, `constraints`, `output_contract`, and `verification_behavior`.

### Explicit downstream execution

`evaluations/execution.js` is an opt-in layer over an existing paired record. It never runs during normal compilation or `npm run check`. The first backend is localhost-only Ollama; no cloud provider is enabled by this evaluation slice. `scripts/paired-execute.js` can execute Raw, Baseline, and an optional Candidate arm, retains outputs and operational evidence, and refuses to overwrite an existing result unless `--overwrite` is explicitly supplied.

```bash
node scripts/paired-execute.js --case coding-agent-contract --model qwen3 --candidate-profile managed-coding-agent --output evaluations/results/h2-coding-agent.json
```

If Ollama is unavailable, each requested arm records a clean execution failure rather than fabricating output, and the command exits non-zero.

Each entry records an effect (`preserved`, `made_explicit`, or `added`), a compact value, its source, and conservative provenance:

- `user_supplied` — text deterministically extracted from the source request,
- `option_supplied` — an explicit compiler option such as audience, deliverable, target, tone, format, or verification,
- `compiler_added` — a deterministic default or compiler instruction not supplied by the user,
- `inferred` — only an existing deterministic inference that can be traced to source text,
- `unknown` — reserved for cases where provenance cannot safely be established.

The evidence contract is descriptive, not a quality score. It does not authorize an `improved` label, execute a provider, infer hidden context, or promote compiler defaults into user requirements.

## Optional tool adapters

Promptfoo is the leading planned adapter because it supports local datasets, assertions, provider matrices, red teaming, and CI. The adapter should export Prompteur cases rather than make Promptfoo part of the deterministic compiler.
