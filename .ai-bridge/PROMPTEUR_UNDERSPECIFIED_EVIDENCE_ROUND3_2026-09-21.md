# Prompteur Underspecified-Prompt Evidence Round 3 — 2026-09-21

## Decision

Do **not** add a clarification-contract branch yet.

This round repeated the underspecified-prompt comparison on a second already-installed local model, `qwen3-vl:8b-instruct`, and deliberately separated **completely absent context** from **partially inferable context**. The predeclared prototype gate was not met.

- Completely absent context: **Raw 1 win, Baseline 0 wins, 3 ties**.
- Partially inferable context: **4 ties**.
- Required gate: Baseline must lose at least **3 of 4** completely-absent cases, have no compensating safety advantage, and materially underperform Raw on no more than **1 of 4** partially-inferable cases.
- Observed: Baseline lost only **1 of 4** completely-absent cases.

Therefore the ordinary deterministic compiler remains unchanged. No clarification candidate, optimizer, profile promotion, or automatic behavior selection was implemented.

## Execution method

- Previous Round 2 model: `shannon-qwen3vl-fast64k:latest`.
- Round 3 model: `qwen3-vl:8b-instruct`.
- Executor: existing localhost-only Ollama path in `evaluations/execution.js`.
- Arms: Raw and current deterministic Baseline only.
- Cases: 8 total — 4 completely absent, 4 partially inferable.
- Product/core source changes for this round: **none**.
- Execution artifacts: `.ai-bridge/underspecified-round3/*.json`.
- Evaluation-only runner: `.ai-bridge/underspecified-round3-runner.mjs`.

The first two delegated attempts were rejected because they only reran the existing check suite and did not produce the requested evidence artifact. The experiment was then executed directly against the verified working tree. The runner call outlived the bridge request and returned a transport timeout, so it was **not replayed blindly**; all eight durable JSON outputs were subsequently verified on disk.

## Rubrics

### Completely absent context — clarification quality

One point each for:

1. recognizing that required information is missing;
2. asking for the minimum necessary missing information;
3. not pretending absent content/context exists;
4. avoiding irrelevant execution/output scaffolding;
5. remaining concise and actionable.

### Partially inferable context — conservative action quality

One point each for:

1. recognizing material uncertainty when it exists;
2. preserving supplied facts and hard constraints;
3. avoiding invented missing specifics;
4. asking only when the missing fact actually blocks progress;
5. giving a useful bounded result or next step.

The execution model did not grade itself. Scores below are a separate review of the recorded outputs using the predeclared rubrics.

## Results

| Case | Bucket | Raw | Baseline | Winner | Raw metrics | Baseline metrics |
| --- | --- | ---: | ---: | --- | --- | --- |
| Translate this into French. | absent | 1/5 | 0/5 | Raw | 13 in / 7 out / 9209 ms | 74 in / 34 out / 873 ms |
| Compare these two options and recommend one. | absent | 4/5 | 4/5 | Tie | 16 in / 111 out / 2286 ms | 77 in / 66 out / 1380 ms |
| Turn this into a professional email. | absent | 2/5 | 2/5 | Tie | 15 in / 237 out / 4843 ms | 75 in / 220 out / 4529 ms |
| Explain why this failed. | absent | 4/5 | 4/5 | Tie | 14 in / 216 out / 4424 ms | 75 in / 108 out / 2221 ms |
| Shorten solar-battery headline; preserve 20%. | partial | 5/5 | 5/5 | Tie | 36 in / 14 out / 312 ms | 97 in / 15 out / 331 ms |
| Two-sentence Tuesday demo follow-up to Alex. | partial | 5/5 | 5/5 | Tie | 27 in / 24 out / 514 ms | 88 in / 24 out / 517 ms |
| One-sentence revenue/margin summary. | partial | 5/5 | 5/5 | Tie | 44 in / 31 out / 654 ms | 105 in / 31 out / 660 ms |
| Remove JavaScript double-negation while preserving behavior. | partial | 0/5 | 0/5 | Tie | 31 in / 444 out / 9140 ms | 120 in / 7 out / 194 ms |

## Case-level findings

### Completely absent context

The translation case is the clearest failure. Raw translated the literal word “this” instead of requesting the missing source, while Baseline translated pieces of its own output-contract scaffolding. Baseline was worse, but neither response was good.

For the comparison case, both arms eventually requested the missing options. Baseline carried unnecessary meta-scaffolding; Raw asked for more context than strictly required. Neither had a decisive quality advantage.

For the email case, both arms generated generic placeholder templates instead of asking for the source text. This is a shared downstream failure rather than evidence that the deterministic compiler alone caused the problem.

For the failure-explanation case, both arms correctly recognized that “this” was unresolved and requested useful diagnostic context. Baseline added a small amount of verification meta-text; Raw was substantially more verbose.

### Partially inferable context

The headline, follow-up, and revenue-summary tasks were handled well by both arms. Prompteur's extra prompt tokens did not produce a meaningful quality difference on these straightforward cases.

The JavaScript case exposed a separate correctness problem. Both arms changed `const active = !!user.enabled` to `const active = user.enabled`, which is **not behavior-preserving unless `user.enabled` is already boolean**. Raw additionally claimed the transformation was behaviorally identical. This is not evidence for a clarification-contract feature; it is evidence that future evaluation should more explicitly test semantic hard-constraint preservation and unsupported assumptions.

## What this round supports

1. Round 2's clarification concern is real but not stable enough across execution environments to justify a new compiler branch.
2. The Baseline consistently uses more input tokens, but that cost is sometimes offset by much shorter outputs and lower latency; efficiency alone cannot decide prompt quality.
3. Missing-context behavior is partly model-dependent. A universal clarification rule would currently be premature.
4. The stronger next evidence target is **semantic constraint preservation**, not more prompt scaffolding. The JavaScript coercion case is a useful counterexample because both Raw and Baseline confidently violated an explicit behavioral requirement.

## Next bounded gate
