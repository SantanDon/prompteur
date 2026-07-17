# Architecture

## Overview

Prompteur uses a small dependency-free architecture built around a Prompt Intermediate Representation (Prompt IR). The browser captures intent and displays results; deterministic core modules interpret and compile the request; the local Node server serves only approved files and optionally proxies provider calls.

```text
Raw request
   │
   ▼
Normalizer ──► Prompt IR ──► Deterministic analyzer ──► Readiness + findings
                        │
                        └────► Target compiler ───────► Local baseline
                                                       │
                                                       └──► Optional provider candidate
                                                                    │
                                                                    └──► Future evaluation loop
```

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

`src/core/analyze.js` contains inspectable lint rules. Each issue has:

- a stable ID,
- severity,
- explanation,
- actionable suggestion.

Readiness dimensions are diagnostic heuristics:

- clarity,
- context,
- constraints,
- output,
- verification.

They help users see contract gaps. They do not predict model accuracy and must never be marketed as benchmark scores.

### 3. Deterministic compilation

`src/core/compile.js` renders the IR for a target environment.

Current targets:

- general language model,
- coding or tool agent,
- research model,
- image model.

The compiler always produces a usable offline baseline. It should prefer minimal sufficient instructions and preserve hard constraints.

### 4. Candidate generation

`src/core/compile.js` also builds a bounded optimizer request. `src/providers/client.js` sends it to the local server, which currently supports:

- Ollama on localhost,
- Gemini through a server-side proxy.

The optimizer receives the original prompt, deterministic baseline, lint findings, and target. Its output is labeled a candidate, not an accepted improvement.

### 5. Browser application

`src/app.js` owns UI state and interactions:

- source entry,
- target selection,
- analysis and compilation,
- diagnostics and IR views,
- provider configuration,
- candidate generation,
- clipboard behavior.

Non-secret preferences may be stored locally. Gemini keys are memory-only and never written to browser storage.

### 6. Local server

`server.js` uses Node built-ins only. It provides:

- an explicit static-file allowlist,
- security headers and CSP,
- request-size limits,
- lightweight local rate limiting,
- provider health checks,
- provider rewrite proxying,
- localhost-only validation for Ollama.

The server must not become a generic file server or unrestricted outbound proxy.

## Data flow

### Deterministic path

1. User enters a request and selects a target.
2. Browser builds Prompt IR.
3. Analyzer returns findings and readiness dimensions.
4. Compiler produces a local baseline.
5. Browser renders the prompt, diagnostics, and inspectable IR.

No model, API key, database, or internet connection is required.

### Model-assisted path

1. Deterministic path completes first.
2. User explicitly requests a model candidate.
3. Browser sends the bounded optimizer request to the local server.
4. Server validates provider settings and request size.
5. Provider returns a candidate.
6. Browser keeps the deterministic baseline available in state and labels the new result by origin.

Future versions should show side-by-side comparison and evaluation evidence before recommending a winner.

## Extension points

### New lint rule

Add a stable issue definition in `src/core/analyze.js`, then add positive and negative regression cases. Avoid vague style policing unless the rule identifies a reproducible failure mode.

### New target compiler

Add target metadata to `src/core/catalog.js`, target-specific rendering in `src/core/compile.js`, UI selection, and regression cases. Do not fork the entire pipeline.

### New model provider

Implement provider validation and rewrite handling on the server, then add the thin browser client configuration. Document credential handling and outbound-network risk in an ADR.

### Evaluation adapter

Evaluation tools should consume Prompt IR, compiled variants, test inputs, outputs, scores, cost, latency, and provenance through files or a stable local API. The deterministic compiler must remain usable when every adapter is absent.

## Architecture boundaries

- Core modules must not depend on DOM APIs.
- Provider calls must not exist inside deterministic core modules.
- Secrets must not enter persisted UI state.
- Static serving must remain allowlisted.
- Model-generated text must not mutate code, configuration, or accepted prompt versions without explicit review.
- UI labels must distinguish deterministic analysis, provider health, model candidates, and evaluated results.

## Why no framework yet

The current application is small enough for browser-native modules and Node built-ins. This minimizes supply-chain risk and keeps the compiler portable. A frontend framework becomes justified only when state complexity, component reuse, routing, or testing needs exceed the present design. That decision requires an ADR rather than an incremental dependency pile-up.
