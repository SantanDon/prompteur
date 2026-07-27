
# Agent status

Updated: 2026-07-27

## Completed

- Reframed Prompteur as a local-first intent compiler rather than a website-only prompt improver.
- Added the shared `compileRequest` pipeline with versioned result contract, provenance, catalog validation, input limits, and stable errors.
- Routed the browser and deterministic evaluation runner through the shared pipeline.
- Added a dependency-free CLI supporting text, files, stdin, diagnostics, and complete JSON output.
- Added loopback-only `/api/compile` and `/api/capabilities` endpoints.
- Added JavaScript package exports and an OpenAPI contract.
- Added pipeline, CLI, API, validation, and security regression tests.
- Added the integration guide and ADR 0002.
- Reordered the roadmap around Zero Copy-Paste, MCP, extension, direct execution, evaluation, and adaptive optimization.
- Rebuilt the browser as a restrained compiler workbench with explicit hierarchy, accessible tabs, integrated contract signals, and 320 px containment rules.
- Added `docs/DESIGN_SYSTEM.md`, `docs/DESIGN_TOOLING.md`, ADR 0003, a Figma/Playwright MCP example, and the `prompteur-frontend-design` Agent Skill.
- Added the dependency-free stdio MCP server with compile, analyze, and capabilities tools.
- Added protocol negotiation, strict tool schemas, structured results, read-only annotations, message limits, and model-visible tool errors.
- Added MCP lifecycle, subprocess, parse-recovery, protocol-error, and stdout-purity regression tests.
- Verified all tools through the official MCP TypeScript client.
- Added `docs/MCP.md`, ADR 0004, package command/export, client configuration, and updated security/architecture contracts.

## Verification target

- Syntax checks for server, browser, pipeline, CLI, and MCP.
- Node test suite including CLI, MCP stdio subprocess, HTTP bridge, and UI contract tests.
- Six deterministic evaluation cases through the shared pipeline.
- Desktop/tablet/390 px/320 px browser smoke tests, including overflow, keyboard tabs, dialog flow, and long content.
- Static subpath/GitHub Pages module loading.

## Security state

- API routes accept loopback clients only.
- No permissive CORS.
- Compile endpoint cannot invoke providers or commands.
- Gemini keys remain memory-only in the browser.
- Ollama remains localhost-only.
- Static server remains allowlisted.
- MCP opens no port, writes protocol-only stdout, and exposes no files, providers, network, persistence, or execution.

## Next priority

Design an authenticated browser-extension handshake and compile-before-send prototype, then add IDE/repository-aware handoffs and a supervised direct-agent adapter.
