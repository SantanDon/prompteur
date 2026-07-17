# Agent status

Updated: 2026-07-17

## Completed

- Reframed Prompteur as a local-first prompt compiler, linter, and evaluation workbench.
- Replaced the monolithic prototype with Prompt IR, deterministic diagnostics, target compilers, optional provider candidates, and a secure allowlisted server.
- Redesigned and browser-tested the desktop and mobile interface.
- Added 7 Node tests and 6 deterministic evaluation cases.
- Added product, architecture, research, roadmap, security, contribution, ADR, and agent-maintainer documentation.
- Published the public repository at `SantanDon/prompteur`.
- Enabled issue templates, CODEOWNERS, labels, topics, and private vulnerability reporting.

## Verification

- `npm run check`: pass.
- Node tests: 7/7 pass.
- Deterministic evaluation cases: 6/6 pass.
- Playwright desktop 1440×1000: pass, no console errors or horizontal overflow.
- Playwright mobile 390×844: pass, no console errors or horizontal overflow.
- Credential-shaped value scan: clean.
- Binary/archive/key inventory: clean.

## External blocker

GitHub Actions is configured, but the hosted job did not start because of an account-level GitHub restriction. Run `29598964011` executed zero workflow steps. Re-run CI after the account restriction is resolved; do not treat the current red run as a code failure.

## Next priority

Implement v0.3 comparison and evaluation:

1. Preserve original, deterministic baseline, and model candidate side by side.
2. Add semantic diff by Prompt IR field.
3. Add accept/reject/restore behavior.
4. Define the model-backed evaluation result schema.
5. Add an optional Promptfoo export adapter.
