
# ADR 0002: Shared pipeline, CLI, and loopback bridge

- Status: accepted
- Date: 2026-07-20

## Context

Prompteur 0.2 required users to visit the browser workbench, paste a request, compile it, copy the result, return to another model or agent, and paste again. That interaction proved the compiler but imposed enough friction to prevent Prompteur from becoming an everyday intent layer.

The browser application, evaluation runner, future agent integrations, and external tools also need one stable compilation contract. Reimplementing normalization, analysis, and compilation in each surface would create behavioral drift and make evaluation evidence unreliable.

## Decision

Prompteur will expose one deterministic orchestration function, `compileRequest`, from `src/core/pipeline.js`.

The browser, CLI, HTTP bridge, and deterministic evaluation runner will use that same pipeline. The result includes:

- schema and engine versions,
- the compiled prompt,
- Prompt IR,
- deterministic analysis,
- provenance.

Prompteur 0.3 will add:

- a dependency-free CLI with stdin, file, text, and JSON modes,
- a loopback-only `POST /api/compile` endpoint,
- a capabilities endpoint,
- an OpenAPI contract,
- package exports for programmatic use.

## Security decisions

- API routes accept loopback clients only, even if `HOST` is configured broadly.
- The server does not add permissive CORS headers.
- The compile API cannot invoke providers or execute commands.
- Input length and every supported option are validated.
- Unknown options are rejected instead of silently ignored.
- Direct execution, browser extensions, and MCP will require separate threat models and ADRs.

## Consequences

### Positive

- Users can pipe compiled prompts directly into files, scripts, and agents.
- Every product surface shares one behavior contract.
- Integration failures receive stable validation errors.
- Future MCP, extension, and IDE clients have a documented local API.
- Evaluation results can identify the compiler version and result schema.

### Negative

- The server now has a public local API surface that must remain carefully bounded.
- CLI compatibility becomes part of the product contract.
- Version changes must remain synchronized across package metadata, API health, and documentation.
- Static GitHub Pages cannot provide the local HTTP bridge; it remains a deterministic browser demonstration.

## Alternatives considered

### Browser extension first

Rejected as the first step because it would duplicate compiler behavior or depend on an undocumented service. The shared pipeline and bridge are prerequisites.

### MCP server first

Rejected for the same sequencing reason. MCP should wrap the stable pipeline rather than define it.

### Clipboard automation

Rejected as the main solution because it preserves the manual workflow, adds OS-specific behavior, and does not create a reusable integration contract.

### Permissive CORS on localhost

Rejected because arbitrary web pages could invoke the local bridge. A future browser extension will use an authenticated design.

## Follow-up

- Add an MCP adapter around `compileRequest`.
- Design authenticated browser-extension communication.
- Add direct execution adapters with explicit permissions and audit records.
- Add result comparison and evaluation before any candidate is labeled improved.
