# Prompteur Semantic-Constraint Evidence Round 4 — 2026-09-21

## Decision

Keep the deterministic compiler as the default, but harden semantic-preservation extraction now. This round found a concrete compiler defect rather than a speculative prompting preference: ordinary preservation language such as `Preserve behavior`, `identical`, and `equivalent` was not consistently classified as a hard constraint.

The bounded fix is limited to deterministic constraint extraction. No optimizer, automatic profile selection, model-assisted intent inference, clarification branch, deployment, or provider dependency was added.

## Evidence method

An evaluation-only runner compared Raw and current deterministic Baseline prompts on semantic-equivalence traps using the already-installed local `qwen3-vl:8b-instruct` Ollama model. The cases intentionally paired a requested simplification with an explicit behavior-preservation requirement.

The execution call later returned a transport/upstream timeout. It was not replayed blindly. Durable results already written to `.ai-bridge/semantic-round4/` were inspected instead. Four completed/partial records were available at review time.

## Observed failures before the fix

### `parseInt(value, 10)` → `Number(value)`

The Raw arm correctly refused the replacement because the two operations differ for values such as `10px`, empty/whitespace strings, decimals, and exponent notation. The Baseline returned only `Number(value)`.

The paired record showed no extracted hard constraints for the Baseline even though the user explicitly said `Preserve behavior for every string input...`. The preservation requirement therefore appeared in the objective but was not elevated into the compiler's `Hard constraints` section.

### `input || 'default'` → `input ?? 'default'`

The Raw arm correctly explained that `||` and `??` differ for falsy non-nullish values. The Baseline returned `const label = input ?? 'default';`, violating the explicit requirement to preserve behavior for `''`, `0`, and `false`.

The first sentence happened to be classified as a constraint because it contained `without`, but the second concrete preservation sentence was not independently extracted.

### Python `x is None` → truthiness

The Raw arm correctly kept `x is None`. The Baseline returned `return fallback if not x else x`, changing behavior for `0`, `False`, empty strings, and empty lists.

Again, the paired record contained no extracted hard constraints despite the explicit preservation requirement.

### JavaScript `!!user.enabled`

The Raw arm timed out in this run, so it is not usable for a Raw-vs-Baseline quality comparison. The Baseline returned `const active = user.enabled;`, which does not preserve behavior for arbitrary JavaScript values because `!!` performs boolean coercion.

The record did contain a constraint only because the first sentence used `avoid`; the explicit `Keep behavior identical...` wording was not independently recognized.

## Root cause

`src/core/normalize.js` previously recognized a narrow set of lexical constraint markers such as `must`, `do not`, `without`, and `avoid`. It did not recognize common semantic-equivalence language.

That created an especially bad failure mode for Prompteur: a user's most important correctness requirement could remain buried in the objective while the compiler added output and verification scaffolding around it. The downstream model could then satisfy the requested transformation while silently violating behavioral equivalence.

## Bounded implementation

`CONSTRAINT_PATTERN` now also recognizes:

- `preserve`, `preserves`, `preserved`, `preserving`;
- `unchanged`;
- `identical`;
- `equivalent`.

A focused core test proves that preservation and equivalence statements are elevated into hard constraints.

## Verification

`npm run check` passes after the change:

- 49 tests total;
- 48 passed;
- 0 failed;
- 1 expected Windows symlink-permission skip;
- deterministic evaluation: 6/6 passed.

No downstream quality-improvement claim is made yet. The pre-fix execution evidence justifies the extraction fix, and deterministic tests prove the compiler now retains the semantic language as hard constraints. A later bounded downstream rerun should test whether this materially improves model behavior before any broader semantic verifier is introduced.

## Next gate

Do not add a general semantic optimizer yet. The next evidence step should use a small post-fix set of equivalence-sensitive cases and require the compiled arm to preserve the stated semantics at least as reliably as Raw without materially increasing failure/latency rates. If failures persist even with the constraint made explicit, investigate verification/evaluation behavior rather than adding more prompt length by default.
