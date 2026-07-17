# Roadmap

The roadmap is ordered by evidence and architectural dependency, not by visual novelty. A feature moves to complete only when implementation, tests, documentation, and user-visible claims agree.

## v0.2 — trustworthy local compiler

Status: implemented in the current repository.

- Prompt IR foundation.
- Deterministic linting with stable issue IDs.
- Target-specific compilation for general, agent, research, and image prompts.
- Readiness dimensions with clear non-benchmark language.
- Inspectable diagnostics and IR views.
- Optional Ollama and Gemini candidates.
- Memory-only browser handling for Gemini keys.
- Secure allowlisted local server.
- Unit, regression, and server security tests.
- Agent-maintainer instructions and architecture documentation.

## v0.3 — compare and evaluate

Goal: stop asking users to trust a rewrite by appearance.

- Side-by-side original, baseline, and candidate comparison.
- Semantic diff grouped by objective, constraints, output, and behavior.
- Candidate rejection and restoration of deterministic baseline.
- Local evaluation-case format with inputs, assertions, tags, and provenance.
- Deterministic evaluation runner in CI.
- Optional Promptfoo export and import adapter.
- Pairwise human preference capture without pretending it is objective truth.
- Token and character deltas for every variant.

Exit criteria:

- every compiler change runs against a versioned case set,
- candidate origin and evaluation status are always visible,
- no candidate is labeled “improved” without evidence.

## v0.4 — prompt workspace and versioning

Goal: make useful prompts durable without becoming a generic notes app.

- Local prompt library with immutable versions.
- Tags for target, domain, project, and evaluation status.
- Draft, evaluated, accepted, and archived states.
- Evaluation evidence linked to a prompt version.
- Import and export as portable JSON and Markdown.
- Search and comparison across versions.
- Migration-safe local persistence.

Exit criteria:

- versions can be reproduced from stored IR and compiler version,
- users can trace why a prompt changed,
- rollback does not depend on browser history.

## v0.5 — optimizer loop

Goal: support evidence-led automatic iteration.

- Multiple candidate generation strategies.
- Feedback-driven revision using failed assertions and evaluator comments.
- Candidate deduplication and diversity controls.
- Configurable stop conditions for score, budget, and iteration count.
- Evaluation history supplied to the optimizer in a bounded form.
- Human approval before accepting or publishing a winner.

Exit criteria:

- optimizer runs are reproducible and budget-bounded,
- every selected candidate has comparative evidence,
- failure cases become regression cases.

## v0.6 — target adapters

Goal: compile one intent safely for different execution environments.

Candidate adapters:

- ChatGPT and general chat models,
- Codex and repository agents,
- Claude-style tool agents,
- Gemini research and multimodal workflows,
- image-generation models,
- reusable system/developer/user message bundles,
- MCP or agent instruction files.

Each adapter requires:

- a documented target contract,
- regression cases,
- provider-independent deterministic output,
- explicit unsupported behavior.

## v1.0 — evaluated prompt engineering workbench

Prompteur reaches 1.0 when it can:

- represent intent independently from provider syntax,
- diagnose contract weaknesses transparently,
- compile for multiple targets,
- compare and evaluate variants on representative datasets,
- version prompts with provenance,
- operate locally without a model,
- use optional providers without weakening secret handling,
- be maintained by agents under tests and reviewable decisions.

## Explicit non-goals before 1.0

- a public prompt marketplace,
- autonomous publishing of generated prompts,
- arbitrary remote Ollama endpoints,
- hidden optimizer decisions,
- a large framework migration without a demonstrated need,
- gamified scores presented as scientific quality measurements,
- adding every new prompting paper as a UI toggle.

## Research backlog

- Evaluate whether Prompt IR needs examples, tool permissions, and source provenance as first-class fields.
- Define task-specific grader interfaces.
- Compare deterministic baseline performance against zero-shot optimizer candidates.
- Study prompt compression after quality requirements are satisfied.
- Design prompt-injection test sets for compiler and source-material boundaries.
- Determine when model-specific adapters outperform a portable baseline enough to justify maintenance cost.
