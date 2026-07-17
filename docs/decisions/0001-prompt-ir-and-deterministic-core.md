# ADR 0001: Prompt IR and deterministic-first architecture

- Status: accepted
- Date: 2026-07-17

## Context

The original prototype combined UI state, prompt templates, provider requests, persona text, and product claims in one browser file. It treated frameworks such as CO-STAR and “26 prompting principles” as feature switches, even though the implementation did not represent or evaluate those methods faithfully. Provider output replaced the local result without comparative evidence.

A maintainable prompt system needs to distinguish the user’s intent from the syntax sent to a particular model. It also needs a useful offline path so quality, security, and tests do not depend on provider availability.

## Decision

Prompteur will use a Prompt Intermediate Representation as the boundary between free-text intent and target-specific rendering.

The pipeline will be:

1. normalize user input into conservative Prompt IR,
2. analyze the IR and source text with deterministic lint rules,
3. compile a target-specific deterministic baseline,
4. optionally ask a provider to generate a candidate using the original, baseline, and findings,
5. evaluate variants before calling one an improvement.

Core normalization, analysis, and compilation will have no DOM, provider, or network dependencies.

## Consequences

### Positive

- Compiler behavior can be tested without a model.
- Targets can evolve without duplicating the entire application.
- Product claims can map to inspectable rules.
- Provider candidates can be compared with a stable baseline.
- Prompt versioning can store IR and compiler provenance rather than only rendered strings.
- Security boundaries between instructions and source material become explicit.

### Negative

- Conservative inference cannot understand every nuanced task without user input or a model.
- Prompt IR needs migrations as the schema evolves.
- A deterministic readiness score is necessarily limited and must be explained carefully.
- Provider-specific optimization may outperform the portable baseline in some cases, requiring future adapters and evaluations.

## Alternatives considered

### Keep one large prompt template

Rejected because it encourages instruction accumulation, weak causal understanding, and target mismatch.

### Make a model rewrite the only engine

Rejected because the system would be non-deterministic, difficult to test, unavailable offline, and unable to prove that a rewrite is an improvement.

### Adopt DSPy or another orchestration framework as the application core

Rejected for the current stage because it would add a Python/runtime dependency and reshape the product around a framework before the local workflow and evaluation contracts are proven. DSPy remains an important methodological reference and possible future adapter.

### Store only rendered prompts

Rejected because rendered strings lose structured intent, compiler decisions, and migration opportunities.

## Follow-up

- Version Prompt IR explicitly.
- Add schema validation when the IR becomes externally persisted.
- Build evaluation cases around IR, compiled output, and target behavior.
- Add an ADR before introducing a framework or changing the core boundary.
