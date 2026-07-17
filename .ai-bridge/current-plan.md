# Agent implementation plan

Updated: 2026-07-17
Workspace: repository root
Target agent: any repository maintenance agent

## Goal

Maintain Prompteur as a local-first prompt compiler, linter, and evaluation workbench.

## Current state

- v0.2 is implemented around Prompt IR, deterministic analysis, target compilation, optional Ollama/Gemini candidates, a secure local server, and a responsive browser UI.
- The public repository is `SantanDon/prompteur` on `main`.
- Baseline commits: `1fcae21` and `5b3cc42`.

## Evidence

- `npm run check` passes.
- Node tests: 7/7 pass.
- Deterministic evaluation cases: 6/6 pass.
- Desktop 1440×1000 and mobile 390×844 Playwright smoke flows pass with no console errors or horizontal overflow.
- Settings Cancel preserves the saved provider; provider cards are keyboard focusable; diagnostics and Prompt IR render.
- Credential-shaped value scan and binary/archive/key inventory are clean.

## Decisions

- Prompt quality means a minimal sufficient, target-aware, testable task contract—not a longer prompt.
- Deterministic local compilation is the baseline; model rewrites are untrusted candidates until evaluated.
- Runtime dependencies require an ADR and evidence.
- Static files are allowlisted; Ollama is localhost-only; Gemini keys are never persisted.

## Required context

Read before substantial changes:

- `AGENTS.md`
- `docs/PRODUCT_PHILOSOPHY.md`
- `docs/ARCHITECTURE.md`
- `docs/RESEARCH.md`
- `docs/ROADMAP.md`
- `docs/MAINTAINER_LOOP.md`
- `docs/decisions/0001-prompt-ir-and-deterministic-core.md`

Begin prompt-behavior changes with a representative case in `evaluations/cases.json`.

## External blocker

GitHub Actions is configured, but the hosted job did not start because of an account-level GitHub restriction. Run `29598964011` executed zero workflow steps. Re-run CI after the account restriction is resolved; do not classify the current red run as a code failure.

## Next highest-value action

Implement v0.3 comparison and evaluation:

1. Show original, deterministic baseline, and model candidate side by side.
2. Add semantic diff by Prompt IR field.
3. Add accept, reject, and restore-baseline behavior.
4. Define the model-backed evaluation-result schema.
5. Add an optional Promptfoo export adapter.

## Implementation contract

- Work in small, reviewable steps.
- Preserve existing product and security invariants.
- Run focused verification before handoff.
- Update `agent-status.md`, `decisions.md`, and `open-questions.md` when relevant.
- Do not commit generated session logs, execution logs, or implementation diffs.
