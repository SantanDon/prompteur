
# Roadmap

The roadmap is ordered by user friction, evidence, and architectural dependency. A feature is complete only when implementation, tests, documentation, and user-visible claims agree.

## v0.2 — trustworthy local compiler

Status: complete.

- Prompt IR foundation.
- Deterministic linting with stable issue IDs.
- Target-specific compilation for general, agent, research, and image prompts.
- Inspectable diagnostics and IR.
- Optional Ollama and Gemini candidates.
- Secure allowlisted local server.
- Regression tests and agent-maintainer governance.

## v0.3 — Zero Copy-Paste foundation

Status: core foundation implemented.

Goal: make Prompteur callable where work already happens rather than requiring a browser detour.

Implemented:

- Shared `compileRequest` pipeline across browser, CLI, HTTP, JavaScript, and evaluations.
- Versioned machine-readable result contract and provenance.
- Dependency-free CLI with text, stdin, file, diagnostics, and JSON modes.
- Loopback-only `POST /api/compile` bridge.
- Capabilities discovery endpoint.
- OpenAPI contract.
- Package exports for programmatic use.
- Input and option validation with stable error codes.

Remaining in the Zero Copy-Paste program:

- MCP server for agents.
- Authenticated browser extension with compile-before-send.
- IDE actions and repository-aware handoffs.
- Direct execution adapter for at least one coding agent.
- Permission and audit model for execution.

Exit criteria:

- a user can express intent once and deliver the compiled contract to an agent without visiting the workbench or using the clipboard,
- every integration uses the same versioned pipeline,
- local integrations do not expose secrets or an unauthenticated web-accessible service.

## v0.4 — compare and evaluate

Goal: stop asking users to trust a rewrite by appearance.

- Side-by-side original, baseline, and candidate comparison.
- Semantic diff grouped by objective, constraints, output, and behavior.
- Candidate rejection and restoration of deterministic baseline.
- Model-backed evaluation result schema.
- Optional Promptfoo adapter.
- Pairwise human preference capture.
- Token, latency, and cost deltas.

Exit criteria:

- candidate origin and evaluation status are always visible,
- no candidate is labeled improved without comparative evidence,
- production failures become regression cases.

## v0.5 — workspace and project memory

Goal: make successful intent contracts durable and project-aware.

- Local prompt and workflow library with immutable versions.
- Project context, source provenance, and decision memory.
- Draft, evaluated, accepted, and archived states.
- Evaluation evidence linked to compiler and prompt versions.
- Portable JSON and Markdown import/export.
- Search, comparison, rollback, and migration-safe persistence.

## v0.6 — supervised execution

Goal: move from compilation to safe task completion.

- Target adapters for coding, research, and multimodal agents.
- Explicit tool and permission contracts.
- Execution handoffs and result capture.
- Lightweight outcome graders.
- Automatic retry for bounded, reversible failures.
- Human gates for high-risk or irreversible actions.

## v0.7 — adaptive optimizer

Goal: improve from outcomes rather than prompt folklore.

- Multiple candidate strategies.
- Feedback-driven revision using failed assertions and evaluator comments.
- Candidate deduplication and diversity controls.
- Budget, score, and iteration stop conditions.
- Model and target performance profiles.
- Prompt compression after requirements are satisfied.

## v1.0 — universal intent compiler and agent control plane

Prompteur reaches 1.0 when it can:

- capture intent once,
- represent it independently from provider syntax,
- diagnose missing contracts transparently,
- compile for multiple targets,
- deliver directly to supported agents and tools,
- supervise permissions and execution,
- compare and evaluate outcomes,
- learn from accepted and failed runs,
- version prompts, projects, and evidence,
- operate locally without a model,
- use optional providers without weakening secret handling.

## Explicit non-goals before 1.0

- a public prompt marketplace,
- autonomous paid infrastructure decisions,
- arbitrary remote Ollama endpoints,
- wildcard CORS for the local bridge,
- hidden optimizer decisions,
- gamified scores presented as scientific quality measurements,
- adding every prompting paper as a UI toggle.

## Research backlog

- Threat model for authenticated browser-extension communication.
- MCP transport and tool contract for local agents.
- Tool-permission and source-provenance fields in Prompt IR.
- Representative datasets for coding, research, and multimodal tasks.
- Minimum evidence required to label a candidate improved.
- When provider-specific adapters outperform a portable baseline enough to justify maintenance cost.
