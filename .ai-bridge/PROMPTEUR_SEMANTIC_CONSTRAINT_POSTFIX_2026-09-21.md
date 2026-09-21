# Prompteur Semantic-Constraint Post-Fix Evidence — 2026-09-21

## Decision

Do **not** add more default prompt scaffolding or promote a semantic-verification prompt gate yet.

The lexical extraction fix from Round 4 is correct and remains worthwhile: semantic-preservation requirements are now made explicit as hard constraints. However, a four-case post-fix downstream rerun on the already-installed local `qwen3-vl:8b-instruct` model shows that **making the constraint explicit is not sufficient to make the downstream model obey it reliably**.

No product source was changed in this evidence pass. The only new files are evaluation-only material under `.ai-bridge/`.

## Pre-flight verification

Before downstream execution:

- `npm run check` — **49 tests total; 48 passed; 0 failed; 1 expected Windows symlink-permission skip**.
- Deterministic evaluation — **6/6 passed**.
- Prompteur version — `0.3.1`.
- The semantic-preservation extraction regression is included in the passing core suite.

## Execution method

- Model: `qwen3-vl:8b-instruct` (already installed locally).
- Executor: Prompteur's existing loopback-only Ollama evaluation adapter.
- Arms: Raw request vs current deterministic Baseline.
- Product changes: none.
- Runner: `.ai-bridge/semantic-postfix-runner.mjs`.
- Durable results: `.ai-bridge/semantic-postfix/*.json`.

The runner call outlived the workspace bridge request and returned a transport timeout. It was **not replayed blindly**. All four durable result files had already been written and were reviewed directly.

## Post-fix results

### 1. JavaScript double negation

Task: replace `!!user.enabled` while preserving behavior for every JavaScript value.

- Raw: final recommendation was `Boolean(user.enabled)`, which is behaviorally equivalent. However, the same answer also incorrectly claimed `user.enabled !== false` was equivalent, so the output is not fully reliable.
- Baseline: returned `user.enabled !== false` and explicitly claimed exact equivalence. This is false for `0`, `''`, `null`, `undefined`, `NaN`, and other falsy values.
- Raw: 39 input tokens / 322 output tokens / ~35.46 s.
- Baseline: 171 input tokens / 257 output tokens / ~23.97 s.

**Verdict:** Baseline semantic failure. Raw final action safe, but explanation contains a material false claim.

### 2. `parseInt(value, 10)` → `Number(value)`

Task: replace `parseInt` with `Number` while preserving behavior for every string input.

- Raw: ultimately refused the replacement and recommended keeping `parseInt`, which is the safe final action. Its explanation nevertheless contained several factual mistakes while self-correcting.
- Baseline: created a `Number`-based wrapper, changed `NaN` behavior to `null`, misstated empty/whitespace coercion, and claimed the result preserved behavior.
- Raw: 50 input tokens / 2079 output tokens / ~45.67 s.
- Baseline: 175 input tokens / 282 output tokens / ~31.24 s.

**Verdict:** Baseline semantic failure. Raw final action safe, but reasoning is noisy and not fully trustworthy.

### 3. `||` → `??`

Task: replace logical OR with nullish coalescing while preserving behavior for `''`, `0`, `false`, `null`, and `undefined`.

- Raw: correctly refused the replacement and kept `||`.
- Baseline: returned `input ?? 'default'` and incorrectly claimed behavior was identical for `false`, `0`, and `''`.
- Raw: 45 input tokens / 428 output tokens / ~18.51 s.
- Baseline: 184 input tokens / 103 output tokens / ~4.81 s.

**Verdict:** Raw pass; Baseline semantic failure.

### 4. Python `x is None` → truthiness

Task: simplify while preserving behavior for `0`, `False`, empty strings, empty lists, and `None`.

- Raw: correctly kept an explicit `is None` check and rejected `not x`.
- Baseline: also correctly kept `is None` and rejected the truthiness rewrite.
- Raw: 56 input tokens / 421 output tokens / ~52.16 s.
- Baseline: 206 input tokens / 368 output tokens / ~30.20 s.

**Verdict:** Raw pass; Baseline pass.

## Aggregate finding

On the narrow metric of **final-action semantic preservation**:

- Raw: 4/4 safe final decisions.
- Baseline: 1/4 safe final decisions.

On the stricter metric of **fully reliable output with no material semantic misinformation**:

- Raw: 2/4 clearly reliable.
- Baseline: 1/4 clearly reliable.

This is negative evidence for the assumption that explicit hard-constraint extraction plus generic verification scaffolding is enough. In three cases the Baseline saw the preservation requirement in a dedicated `Hard constraints` section and still confidently violated it.

## Targeted semantic-gate candidate

Because Round 4 explicitly said to investigate verification behavior if failures persisted, an evaluation-only candidate appended one narrow instruction:

> Before performing the requested rewrite, test the claimed equivalence against every stated edge case. If the rewrite is not behaviorally equivalent, do not perform it; keep the original or nearest safe form and briefly state why.

Runner: `.ai-bridge/semantic-gate-candidate-runner.mjs`.

The candidate execution again exceeded the bridge request window. It was not replayed. Two durable results existed at review time:

1. **Double negation — fail.** The candidate still returned `user.enabled !== false`, fabricated an edge-case verification table, and claimed exact equivalence. The added gate therefore did not prevent the same semantic error.
2. **`parseInt` → `Number` — mixed/unsafe.** The candidate correctly identified that `Number` is not equivalent and said to keep `parseInt`, but then offered a wrapper that converts `NaN` to `null` while claiming exact preservation. That wrapper itself changes behavior.

Only two of four candidate cases completed, so no promotion claim is possible. More importantly, the first two results are already enough to show that **another prompt sentence is not a reliable semantic verifier** for this model.

## Architectural implication

Prompteur should distinguish two things:

1. **Specification preservation** — deterministic compilation can and should make the user's semantic requirement explicit. The Round 4 extraction fix does this correctly.
2. **Semantic validation** — deciding whether a generated transformation actually preserves behavior cannot be trusted to the same model merely because the prompt says “verify”. For code and other executable domains, this is better treated as an optional evidence step: concrete tests, counterexamples, schemas, static checks, or an independently executed verifier where available.

This aligns with the research brief's central rule: do not add prompt length merely because it sounds safer. Add machinery only when evidence shows it closes a real failure mode.

## Next bounded gate

Do not change the default compiler from this result.

The next high-value experiment should test an **external/independent semantic-validation layer**, not more wording. For a small set of executable equivalence cases, generate the model answer and then verify the proposed transformation with deterministic counterexample tests or a separate verifier that cannot simply accept the answer's own claims. Only if that layer measurably catches failures without excessive cost should Prompteur expose it as an optional verification mode.

The `managed-coding-agent` profile remains experimental and explicit-only. No optimizer, clarification branch, automatic profile selection, cloud provider dependency, deployment, publishing, or external action was added.
