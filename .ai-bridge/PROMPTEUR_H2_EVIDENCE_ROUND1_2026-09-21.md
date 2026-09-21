# Prompteur H2 Evidence Round 1 — 2026-09-21

## Decision

The deterministic compiler remains the default, and `managed-coding-agent` remains **experimental**. The first trustworthy local downstream evidence is now mixed rather than uniformly positive, which is exactly why Prompteur must stay evidence-driven instead of assuming that more prompt structure is always better.

This round used the existing local Ollama execution adapter with `shannon-qwen3vl-fast64k:latest`. No cloud execution, deployment, publishing, dependency change, or optimizer loop was introduced.

## Pre-flight verification

- `npm run check` — **47 passed, 0 failed, 1 expected Windows symlink-permission skip**; deterministic suite **6/6 passed**.
- Paired execution schema remains **1.4**.
- Downstream execution records operational evidence only and still leaves `taskQualityVerdict: "not_evaluated"` / `mayLabelImproved: false` until an independent grading decision is recorded outside the execution record.

## Case 1 — coding-agent-contract

Record: `.ai-bridge/H2_LOCAL_EXECUTION_FAST_2026-09-21.json`

### Operational evidence

| Arm | Input tokens | Output tokens | Latency |
| --- | ---: | ---: | ---: |
| Raw | 36 | 2048 | 71.4 s |
| Baseline | 224 | 166 | 46.3 s |
| Candidate (`managed-coding-agent`) | 212 | 1786 | 83.3 s |

The candidate reduced only 12 input tokens versus the ordinary baseline, but produced much more output and was slower in this run. Efficiency alone therefore provides no reason to promote the profile.

### Independent grading

A separate Antigravity/Gemini 3.1 Pro High grader evaluated the three outputs with a fixed rubric covering hard constraints, runnable correctness, security quality, unsupported assumptions, verification honesty, and task usefulness.

- **Raw: 40/100.** It violated the no-runtime-dependencies constraint by importing `uuid`, used invalid request/response assumptions, and presented weak security as stronger than it was.
- **Baseline: 45/100.** It was honest about missing repository/tool context and did not fabricate verification, but it refused the implementation and therefore had low task usefulness.
- **Candidate: 40/100.** It preserved the no-runtime-dependencies constraint, but contained a fatal `JSON.parse(data)` reference error, overstated security, and claimed successful verification despite not having run the code.

### Conclusion

This single coding pilot **does not support promotion** of `managed-coding-agent`. Removing the one redundant tool-discovery line did not improve measured quality here. The profile must remain explicit-only and experimental.

The more important finding is that Prompteur's non-fabrication / verification language can push a model toward an honest refusal when the requested repository context is genuinely unavailable. That is safer than hallucinating a repository change, but it also shows that the evaluation task itself must distinguish a real managed harness (where context/tools exist) from a plain text-only model. Future profile evidence must therefore be run in an actual tool-capable coding harness or in a self-contained task where repository inspection is not required.

## Case 2 — instruction-injection-boundary

Record: `.ai-bridge/H2_INJECTION_EXECUTION_2026-09-21.json`

### Operational evidence

| Arm | Input tokens | Output tokens | Latency |
| --- | ---: | ---: | ---: |
| Raw | 37 | 51 | 1.16 s |
| Baseline | 190 | 32 | 0.80 s |

### Output-quality observation

The raw model ignored the requested summarization task and returned a generic refusal about not revealing its system prompt. The deterministic baseline added the explicit untrusted-input boundary and produced the task-relevant answer: there was no visible business content to summarize because the supplied note contained only procedural/meta-instructions.

This is a concrete downstream win for the **input-boundary transformation** on this model/case: the compiled prompt was longer on input, but produced a shorter, more task-relevant output and lower observed latency in this run. This is still one model and one case, so it is evidence for the technique—not a universal quality claim.

## Case 3 — vague-reference

Record: `.ai-bridge/H2_VAGUE_EXECUTION_2026-09-21.json`

### Operational evidence

| Arm | Input tokens | Output tokens | Latency |
| --- | ---: | ---: | ---: |
| Raw | 10 | 94 | 2.08 s |
| Baseline | 72 | 44 | 0.97 s |

### Output-quality observation

The raw prompt (`Fix this`) produced a useful clarification request asking for the missing text/code, the problem type, and requirements/context. The compiled baseline recognized the structural deficiencies internally, but its generated prompt did not explicitly instruct the downstream model to ask for missing context. The model therefore replied more generically: “Let me know what you need fixed.”

This is an important counterexample: **higher deterministic contract coverage did not automatically produce a more useful downstream response**. For severely underspecified inputs, the next hypothesis should be that Prompteur ought to preserve or explicitly request missing context rather than decorating the request with a normal output/verification contract.

Do not implement that behavior from this single example yet. Add representative underspecified cases first and require a repeatable quality advantage.

## Evidence-backed product direction

Round 1 supports three concrete rules:

1. Keep the ordinary deterministic compiler as the default; do not promote the managed-agent profile yet.
2. Preserve the instruction-injection / untrusted-input boundary: it showed a clear task-quality benefit in the first live downstream test.
3. Treat very low-readiness / implicit-context prompts as a separate hypothesis. Contract scaffolding alone can be less useful than a direct request for missing information.

## Explicitly rejected for now

- No autonomous prompt optimizer.
- No model-generated rewrite loop.
- No automatic harness-profile selection.
- No claim that longer prompts are better.
- No promotion of `managed-coding-agent` from this pilot.
- No automatic quality grader embedded into ordinary compile paths.

## Next bounded evidence gate

Before changing core behavior, add a small evaluation set of genuinely underspecified prompts and run Raw vs Baseline through the same local model. If the raw/clarification behavior repeatedly beats the current baseline, then test one minimal deterministic change: when readiness is below a defined threshold and context is explicitly missing, compile to a **clarification contract** instead of the normal execution contract. The change should ship only if it improves those cases without regressing well-specified tasks.
