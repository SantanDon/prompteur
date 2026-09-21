# Prompteur Underspecified-Prompt Evidence Round 2 — 2026-09-21

## Decision

Do **not** change Prompteur's compiler yet.

The six-case controlled Raw-vs-Baseline run produced **3 Raw wins, 0 Baseline wins, and 3 ties** under the predeclared clarification-quality rubric. That is meaningful evidence that the current deterministic baseline can suppress useful clarification behavior on some severely underspecified prompts, but it does **not** meet the predeclared gate for a clarification-contract prototype: Baseline needed to lose clarification quality in at least **4 of 6** cases with no compensating safety advantage.

The ordinary deterministic compiler therefore remains unchanged. No clarification contract, optimizer, profile promotion, or auto-selection was implemented.

## Execution method

- Model: `shannon-qwen3vl-fast64k:latest`
- Executor: existing local loopback Ollama path in `evaluations/execution.js`
- Arms: Raw and current deterministic Baseline only
- Cases: six intentionally underspecified prompts
- Product/core source changes for this round: none
- Execution artifacts: `.ai-bridge/underspecified-round2/*.json`
- Evaluation-only runner: `.ai-bridge/underspecified-round2-runner.mjs`

Each model output was graded independently from the execution model using the same 5-point rubric:

1. recognizes that required information is missing;
2. asks for the minimum necessary missing information;
3. does not pretend the absent content/context exists;
4. avoids irrelevant execution/output scaffolding;
5. remains concise and actionable.

## Results

| Case | Raw score | Baseline score | Winner | Raw metrics | Baseline metrics |
| --- | ---: | ---: | --- | --- | --- |
| `Fix this` | 4/5 | 2/5 | Raw | 10 in / 94 out / 2021 ms | 72 in / 42 out / 885 ms |
| `Summarize this` | 5/5 | 1/5 | Raw | 12 in / 29 out / 616 ms | 74 in / 36 out / 760 ms |
| `Make it better` | 4/5 | 4/5 | Tie | 11 in / 138 out / 2849 ms | 73 in / 54 out / 1117 ms |
| `Refactor this function` | 4/5 | 4/5 | Tie | 12 in / 83 out / 1717 ms | 80 in / 60 out / 1242 ms |
| `Analyze the attached file` | 4/5 | 4/5 | Tie | 13 in / 96 out / 1977 ms | 75 in / 66 out / 1367 ms |
| `Draft a reply to this` | 5/5 | 1/5 | Raw | 13 in / 48 out / 1008 ms | 75 in / 20 out / 426 ms |

### Case notes

**`Fix this` — Raw win.** Raw explicitly identified the missing referent and requested the text/code plus useful context. Baseline returned generic meta-assurance about format and verification and never clearly asked for the missing object.

**`Summarize this` — Raw win.** Raw directly requested the missing source content. Baseline said it would keep the eventual answer concise but did not ask for the material to summarize.

**`Make it better` — Tie.** Raw asked for the missing artifact and possible improvement goal but was verbose. Baseline at least asked what should be improved and stayed concise, although it included unnecessary meta-output promises.

**`Refactor this function` — Tie.** Both arms correctly requested the missing function. Raw asked for optional language/goal context; Baseline also requested the function but added some output-format scaffolding. Neither had a decisive clarification-quality advantage.

**`Analyze the attached file` — Tie.** Both arms correctly refused to pretend the missing file was available and requested pasted/described content. Baseline was shorter but added unnecessary format guidance; Raw asked for somewhat more context than strictly necessary.

**`Draft a reply to this` — Raw win.** Raw explicitly requested the original message/context. Baseline only acknowledged the task and promised concise output, without requesting the missing thread.

## Threshold result

Predeclared prototype gate: **Baseline loses in at least 4 of 6 cases, with no safety advantage.**

Observed: **Baseline loses in 3 of 6 cases.**

Result: **gate not met**. Do not prototype or ship a clarification-contract branch from this evidence round.

## What the evidence does support

1. Prompteur's current issue detection is stronger than its downstream behavior on some implicit-context prompts. The analyzer identifies missing/implicit context, but the compiled contract does not always tell the downstream model to request it.
2. The effect is not universal. On refactoring and missing-attachment cases, the current baseline still elicited an adequate clarification despite extra scaffolding.
3. The baseline consistently used substantially more input tokens. It was often faster and shorter in output, but those efficiency gains are not enough to compensate when it fails to ask for required context.
4. Contract coverage remains an internal structural metric, not a task-quality metric.

## Next bounded gate

Do not touch core behavior yet. The next evidence step should broaden the underspecified set across more task classes and at least one additional local/model execution environment, while keeping the same rubric and threshold discipline. In particular, include cases where the missing information is partially inferable versus completely absent; that will help distinguish when Prompteur should clarify, when it should proceed conservatively, and when the execution harness already supplies the missing context.

If a later round crosses the predeclared threshold consistently, prototype the smallest possible deterministic clarification contract as an experimental candidate and compare Raw vs Baseline vs Clarification Candidate before considering any default change.
