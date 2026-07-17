# Decisions

- Prompt quality is defined as a minimal sufficient, target-aware, testable task contract.
- Prompt IR is the model-neutral source of truth; rendered prompts are compiler outputs.
- The deterministic local baseline must work without providers or network access.
- Model rewrites are labeled candidates and require comparative evaluation before acceptance.
- The readiness score is a transparent contract heuristic, not a model-quality benchmark.
- Runtime dependencies require a capability gap, security assessment, tests, and an ADR.
- Gemini keys are memory-only in the browser; Ollama is localhost-only.
- Static files remain an explicit server allowlist.
- Prompt behavior changes begin with representative evaluation cases.
