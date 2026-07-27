# Decisions

- Prompt quality is a minimal sufficient, target-aware, testable task contract.
- Prompt IR is the model-neutral source of truth; rendered prompts are compiler outputs.
- `compileRequest` is the shared deterministic product boundary.
- Browser, CLI, HTTP, JavaScript, and evaluation surfaces must use the same pipeline.
- Result contracts include engine version, schema version, Prompt IR, analysis, prompt, and provenance.
- Deterministic compilation works without providers or network access.
- Compilation and execution remain separate trust boundaries.
- The local bridge accepts loopback clients only and does not allow unrelated web origins.
- Unknown compiler options are rejected rather than silently ignored.
- Model rewrites are candidates and require comparative evidence before being called improved.
- Runtime dependencies require a capability gap, maintenance assessment, tests, and an ADR.
- Prompt behavior changes begin with representative evaluation cases.

- The browser is a restrained compiler workbench, not a generic AI dashboard or marketing hero.
- Gradients, glassmorphism, glow, card soup, and icon-only primary actions are prohibited defaults.
- Figma remote MCP is preferred for structured design context; Playwright is required for browser evidence.
- Storybook and frontend-framework adoption remain deferred until an ADR proves a real component-system need.
- The project-specific UI workflow lives in `.agents/skills/prompteur-frontend-design/`.
- MCP uses local newline-delimited stdio and the current stable `2025-11-25` revision; Streamable HTTP is out of scope without authentication and a threat model.
- MCP exposes only `compile_intent`, `analyze_intent`, and `get_compiler_capabilities`.
- MCP tools are deterministic, read-only, non-destructive, idempotent, and closed-world.
- MCP imports only the shared pipeline; files, providers, networking, persistence, and execution remain separate boundaries.
- The small MCP surface remains dependency-free and is release-tested with the official TypeScript client.
