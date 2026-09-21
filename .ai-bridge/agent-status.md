# Agent status

Updated: 2026-09-21

## Current state

Prompteur remains version 0.3.1 on the deterministic compiler boundary, but the working tree now contains the first evidence-backed v0.4 development slice.

Completed and verified locally:

- Shared deterministic `compileRequest` pipeline still powers browser, CLI, JavaScript API, loopback HTTP, MCP, and deterministic evaluations.
- Added provider-free paired Raw vs Baseline evaluation records with explicit provenance and no unsupported "improved" claims.
- Added optional Raw vs Baseline vs Candidate comparison support for experimental variants.
- Added explicit downstream execution records with a localhost-only Ollama adapter; execution and grading remain separate.
- Added an explicit-only experimental `managed-coding-agent` harness profile. It is never auto-selected and remains unpromoted after mixed evidence.
- Hardened semantic-preservation extraction so language such as preserve / unchanged / identical / equivalent is treated as a hard constraint.
- Preserved the instruction-injection / untrusted-input boundary after downstream evidence showed a concrete benefit on one tested model/case.
- Rejected a default clarification branch after two rounds of underspecified-prompt testing failed the predeclared promotion gates.
- Rejected more prompt-only semantic-verification wording after post-fix execution still produced semantic errors; the next hypothesis is independent/deterministic validation, not more prompt text.

## Verification

Latest local verification on 2026-09-21:

- `npm run check`: PASS
- Node tests: 49 total, 48 passed, 0 failed, 1 expected Windows symlink-permission skip
- Deterministic evaluation: 6/6 passed
- `npm run eval:paired`: PASS
- Paired deterministic contract checks: 6/6
- Extracted hard-constraint preservation: 6/6
- No normal compile path labels a prompt "improved"
- No cloud provider dependency was added to the ordinary compiler path

## Evidence checkpoint

The current research/evidence sequence is captured in:

- `.ai-bridge/PROMPTEUR_RESEARCH_2026-09-20.md`
- `.ai-bridge/PROMPTEUR_V04_SLICE1_REPORT.md`
- `.ai-bridge/PROMPTEUR_V04_SLICE2_REPORT.md`
- `.ai-bridge/PROMPTEUR_V04_SLICE3_REPORT.md`
- `.ai-bridge/PROMPTEUR_V04_EXECUTION_SLICE_REPORT.md`
- `.ai-bridge/PROMPTEUR_H2_EVIDENCE_ROUND1_2026-09-21.md`
- `.ai-bridge/PROMPTEUR_UNDERSPECIFIED_EVIDENCE_ROUND2_2026-09-21.md`
- `.ai-bridge/PROMPTEUR_UNDERSPECIFIED_EVIDENCE_ROUND3_2026-09-21.md`
- `.ai-bridge/PROMPTEUR_SEMANTIC_CONSTRAINT_EVIDENCE_ROUND4_2026-09-21.md`
- `.ai-bridge/PROMPTEUR_SEMANTIC_CONSTRAINT_POSTFIX_2026-09-21.md`

Raw local execution artifacts and experiment runners under `.ai-bridge/` are evidence, not release payloads, unless explicitly selected for a later reproducibility package.

## GitHub / CI

The latest known GitHub Actions run is blocked before job execution by GitHub's account-level message:

> The job was not started because your account is locked due to a billing issue.

GitHub Billing Overview shows GitHub Free and $0 current metered usage, so this is treated as an account/platform blocker rather than a code failure. Do not weaken CI or make a payment/spending change automatically.

## Pause state

The Prompteur Founder Loop and the temporary overnight guard were paused on 2026-09-21 after final verification.

## Next priority when resumed

Run a small independent semantic-validation experiment for executable equivalence tasks. Prefer deterministic counterexamples/tests or an independent verifier over more prompt scaffolding. Promote a new layer only if it catches real failures with acceptable latency/cost and does not regress ordinary well-specified tasks.
