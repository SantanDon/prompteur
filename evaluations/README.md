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

## Optional tool adapters

Promptfoo is the leading planned adapter because it supports local datasets, assertions, provider matrices, red teaming, and CI. The adapter should export Prompteur cases rather than make Promptfoo part of the deterministic compiler.
