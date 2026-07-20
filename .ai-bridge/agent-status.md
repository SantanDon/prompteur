
# Agent status

Updated: 2026-07-20

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

## Verification target

- Syntax checks for server, browser, pipeline, and CLI.
- Node test suite including CLI subprocess and HTTP bridge tests.
- Six deterministic evaluation cases through the shared pipeline.
- Desktop/mobile browser smoke tests.
- Static subpath/GitHub Pages module loading.

## Security state

- API routes accept loopback clients only.
- No permissive CORS.
- Compile endpoint cannot invoke providers or commands.
- Gemini keys remain memory-only in the browser.
- Ollama remains localhost-only.
- Static server remains allowlisted.

## Next priority

Build the MCP adapter as the first direct agent integration, then design authenticated browser-extension communication.
