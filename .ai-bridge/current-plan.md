
# Agent implementation plan

Updated: 2026-07-20
Workspace: repository root
Target agent: any repository maintenance agent

## Goal

Evolve Prompteur from a browser prompt workbench into a universal local-first intent compiler and agent integration layer.

## Current state

- v0.2 established Prompt IR, deterministic diagnostics, target compilation, optional provider candidates, secure serving, and evaluation cases.
- v0.3 Zero Copy-Paste foundation is implemented around one `compileRequest` pipeline.
- The browser has an authored compiler-workbench design system, responsive containment tests, and a project frontend-design Agent Skill.
- Browser, CLI, JavaScript exports, loopback HTTP bridge, and deterministic evaluations share the same versioned result contract.
- The public repository is `SantanDon/prompteur` on `main`.

## Evidence

Verification required for every substantial change:

- `npm run check`.
- CLI text, stdin, invalid-option, and JSON flows.
- `/api/health`, `/api/capabilities`, `/api/compile`, and static allowlist tests.
- Desktop and mobile browser smoke flows when browser code or served module paths change.
- GitHub Pages smoke test when static browser modules change.

## Decisions

- Prompt quality means a minimal sufficient, target-aware, testable task contract—not a longer prompt.
- `src/core/pipeline.js` is the deterministic product boundary.
- Every surface calls the shared pipeline; none reconstructs normalization, analysis, and compilation independently.
- The HTTP bridge is loopback-only and emits no permissive CORS.
- Compilation cannot execute commands or invoke providers.
- Model rewrites remain candidates until evaluated.

## Required context

Read before substantial changes:

- `AGENTS.md`
- `docs/PRODUCT_PHILOSOPHY.md`
- `docs/INTEGRATIONS.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/DESIGN_TOOLING.md`
- `.agents/skills/prompteur-frontend-design/SKILL.md`
- `docs/ARCHITECTURE.md`
- `docs/RESEARCH.md`
- `docs/ROADMAP.md`
- `docs/MAINTAINER_LOOP.md`
- `docs/decisions/0001-prompt-ir-and-deterministic-core.md`
- `docs/decisions/0002-shared-pipeline-cli-and-local-bridge.md`

## Next highest-value action

Create a canonical Figma file/component map for the shipped workbench when a design URL is available, then implement a local MCP adapter around `compileRequest` and `getCompilerCapabilities` without adding provider or execution behavior to the deterministic core.

Follow with:

1. authenticated browser-extension bridge design,
2. compile-before-send extension prototype,
3. direct adapter for one coding agent with explicit permissions,
4. original/baseline/candidate comparison and evaluation evidence.

## Implementation contract

- Begin prompt-behavior changes with a representative evaluation case.
- Keep changes reviewable and reversible.
- Preserve loopback, secret, static-file, and execution boundaries.
- Run focused and end-to-end verification.
- Update `agent-status.md`, `decisions.md`, and `open-questions.md`.
- Do not commit generated execution logs or implementation diffs.
