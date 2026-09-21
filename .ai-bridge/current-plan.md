# Agent implementation plan

Updated: 2026-09-21
Workspace: repository root
Target agent: any repository maintenance agent

## Goal

Evolve Prompteur into lean developer infrastructure that compiles human intent into a minimal, inspectable, target-aware task contract and proves each adaptation with evidence.

## Current product boundary

- Prompteur 0.3.1 remains the released engine version.
- `src/core/pipeline.js` is the sole deterministic compile boundary.
- Browser, CLI, JavaScript exports, loopback HTTP, MCP, and deterministic evaluations must continue to use that boundary.
- Prompt IR remains the model-neutral source of truth.
- Compilation and execution remain separate trust boundaries.
- Model- or harness-specific behavior must be explicit, versioned, and evidence-gated.
- Provider/model rewrites and optimizer candidates never self-promote.

## Current v0.4 working-tree slice

Implemented locally and verified:

1. Raw vs Baseline paired evaluation records.
2. Evidence-aware change provenance.
3. Explicit-only harness profile registry with one experimental managed-coding-agent profile.
4. Raw/Baseline/Candidate comparison support.
5. Opt-in local downstream execution records using loopback-only Ollama.
6. Semantic-preservation constraint extraction hardening.

Evidence so far is intentionally mixed:

- The instruction-injection boundary helped on one tested local model/case.
- The managed-coding-agent profile did not earn promotion.
- A default clarification-contract branch did not meet promotion thresholds across two rounds/models.
- Adding more semantic-verification wording did not reliably fix semantic errors.
- The strongest next hypothesis is independent semantic validation, not more prompt length.

## Verification required before any further source change

- `npm run check`
- `npm run eval:paired`
- focused tests for the changed slice
- real downstream evidence when a claim concerns model behavior
- explicit regression review for well-specified tasks
- no unsupported improvement labels
- no new cloud dependency in the deterministic compiler path without an ADR and threat/cost review

## GitHub constraint

GitHub Actions is currently blocked before execution by an account-level billing lock. Local verification is authoritative for the current pause checkpoint, but the project should not be called CI-green until GitHub Actions can run again.

Do not:
- weaken or bypass the workflow,
- change billing/spending automatically,
- assume the lock is a code defect.

## Next bounded action when resumed

Prototype an evaluation-only independent semantic validator for a small executable-equivalence set.

Candidate approach:
- extract the proposed transformation from the downstream output,
- run deterministic counterexample tests or domain-specific checks,
- record pass/fail evidence separately from the model's self-claims,
- compare Raw vs Baseline vs any Candidate arm,
- keep the ordinary compile path unchanged until the validator proves value.

Do not start with:
- autonomous prompt optimization,
- recursive self-prompting,
- automatic profile selection,
- full-chat context dumping,
- a general clarification branch,
- more semantic-verification prose.

## Coordination rule

Read before write, keep one writer per scope, preserve unrelated work, and treat crew/model output as advisory until independently verified. Update this plan only when the evidence boundary materially changes.
