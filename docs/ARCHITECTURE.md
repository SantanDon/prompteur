
# Architecture

## Overview

Prompteur is a local-first intent compiler built around a Prompt Intermediate Representation (Prompt IR) and one shared deterministic pipeline.

```text
Raw intent
   │
   ▼
compileRequest(input, options)
   ├── normalize → Prompt IR
   ├── analyze → readiness + findings
   ├── compile → target-specific task contract
   └── provenance → schema + engine version
             │
             ├── browser workbench
             ├── CLI
             ├── JavaScript package export
             ├── loopback HTTP bridge
             └── evaluation runner
```

Optional model-assisted candidate generation remains downstream from the deterministic baseline.

## Product boundary

Prompteur is not fundamentally a website. The browser is one client of the compiler. The durable product core is the versioned pipeline contract in `src/core/pipeline.js`.

This distinction enables future MCP, browser-extension, IDE, agent-runtime, and evaluation integrations without duplicating prompt logic.

## Layers

### 1. Prompt IR

`src/core/normalize.js` converts free text and explicit settings into a conservative model-neutral object.

The IR separates:

- raw intent and objective,
- context and supplied inputs,
- hard constraints,
- audience,
- output contract,
- quality and verification requirements,
- target environment and task type,
- instruction-boundary risk.

Inference is intentionally conservative. The normalizer must not fabricate missing business context or acceptance criteria.

### 2. Deterministic analysis

`src/core/analyze.js` contains inspectable lint rules. Each issue has a stable ID, severity, explanation, and actionable suggestion.

Readiness dimensions cover clarity, context, constraints, output, and verification. They diagnose contract gaps; they do not predict model accuracy.

### 3. Target compilation

`src/core/compile.js` renders Prompt IR for:

- general language models,
- coding or tool agents,
- research models,
- image models.

The compiler always produces a usable offline baseline and should prefer minimal sufficient instructions.

### 4. Shared pipeline

`src/core/pipeline.js` is the orchestration boundary for every deterministic product surface. It:

- validates input type and length,
- rejects unknown or invalid options,
- normalizes supported compiler settings,
- builds Prompt IR,
- analyzes the request,
- compiles the prompt,
- returns versioned provenance.

Result contract:

```json
{
  "schemaVersion": "1.0",
  "engine": { "name": "prompteur", "version": "0.3.0", "mode": "deterministic" },
  "prompt": "...",
  "ir": {},
  "analysis": {},
  "provenance": {}
}
```

Any new surface must call this pipeline rather than reconstructing its stages.

### 5. CLI

`bin/prompteur.js` provides dependency-free shell composition:

- text arguments,
- UTF-8 files,
- stdin,
- prompt-only output,
- diagnostics,
- complete JSON results,
- capability discovery.

Compiled output is written to stdout so scripts and agents can pipe it directly.

### 6. Browser application

`src/app.js` owns UI state and interactions but delegates compilation to `compileRequest`.

It manages source entry, target selection, diagnostics, IR inspection, provider configuration, candidate generation, and clipboard behavior.

### 7. Local HTTP bridge

`server.js` uses Node built-ins only. It provides:

- `GET /api/health`,
- `GET /api/capabilities`,
- `POST /api/compile`,
- provider health and candidate-generation endpoints,
- an explicit static-file allowlist,
- `openapi.json`,
- security headers and CSP,
- request-size limits,
- lightweight rate limiting,
- localhost-only Ollama validation.

Every `/api/` route accepts loopback clients only, even when `HOST` is configured broadly. The server intentionally emits no permissive CORS headers.

### 8. Candidate generation

`src/core/compile.js` builds a bounded optimizer request. `src/providers/client.js` sends it to the local server, which supports Ollama on localhost and Gemini through a server-side proxy.

Provider output is labeled a candidate, not an accepted improvement.

## Data flows

### Deterministic browser path

1. User enters intent and target settings.
2. Browser calls `compileRequest` locally.
3. Pipeline returns prompt, IR, analysis, and provenance.
4. Browser renders the result.

No server, model, key, or network connection is required.

### CLI path

1. CLI reads text, a file, or stdin.
2. CLI calls `compileRequest` in-process.
3. Prompt or JSON is written to stdout.
4. Another command can consume it without clipboard interaction.

### HTTP bridge path

1. A loopback client sends `{ input, options }` to `/api/compile`.
2. Server validates request size and local origin.
3. Server calls `compileRequest`.
4. Versioned JSON is returned.

The endpoint cannot execute tools or invoke model providers.

### Model-assisted path

1. Deterministic compilation completes first.
2. User explicitly requests a model candidate.
3. Browser sends a bounded optimizer request to the provider endpoint.
4. Browser preserves the deterministic baseline and labels the candidate origin.

## Extension points

### MCP

Wrap `compileRequest` and `getCompilerCapabilities`; do not place MCP-specific concepts in Prompt IR without an ADR.

### Browser extension

Use an authenticated extension-to-bridge design. Do not enable wildcard CORS on the local service.

### Direct execution adapters

Keep compilation separate from command execution. Require explicit permissions, target contracts, audit records, and an ADR.

### New lint rule

Add a stable issue definition in `src/core/analyze.js`, then positive and negative regression cases.

### New target compiler

Add target metadata to `src/core/catalog.js`, rendering in `src/core/compile.js`, UI selection, capabilities output, OpenAPI changes, and regression cases.

### Evaluation adapter

Consume the versioned pipeline result plus execution outputs, graders, cost, latency, and provenance. Deterministic compilation must remain usable without adapters.

## Architecture boundaries

- Core modules must not depend on DOM APIs.
- Every deterministic surface must call `compileRequest`.
- Provider calls must not exist inside deterministic core modules.
- Compilation must remain separate from execution.
- Secrets must not enter persisted UI state or pipeline results.
- API routes remain loopback-only until an authenticated design is accepted.
- Static serving remains allowlisted.
- Model-generated text must not mutate code, configuration, or accepted prompt versions without an explicit execution layer.
- UI labels must distinguish deterministic analysis, provider candidates, and evaluated results.

## Dependency policy

The current application, CLI, bridge, and tests use Node and browser built-ins only. A framework or runtime dependency is justified only by a demonstrated capability gap, security assessment, tests, and ADR.
