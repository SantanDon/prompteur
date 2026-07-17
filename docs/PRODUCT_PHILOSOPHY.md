# Product philosophy

## The problem

Most prompt improvers perform one operation: send a rough request to another model and return a longer rewrite. This creates a convincing artifact without proving that the new prompt is clearer, safer, cheaper, more portable, or more effective on the user’s actual task.

Prompteur is built around a different premise:

> A good prompt is the smallest task contract that reliably communicates intent, context, constraints, output, and verification to a specific execution environment.

## What Prompteur is

Prompteur is a local-first prompt compiler and evaluation workbench.

It has three conceptual stages:

1. **Diagnose** — identify ambiguity, missing contracts, conflicts, unsafe instruction boundaries, and untestable success conditions.
2. **Compile** — convert the request into a model-neutral Prompt IR, then render a target-specific deterministic prompt.
3. **Evaluate** — compare prompt variants on representative cases using code checks, model graders, human judgment, cost, latency, and failure analysis.

Version 0.2 implements the first two stages and the foundation for the third.

## What Prompteur is not

- It is not a universal “best prompt” generator.
- It is not a collection of every prompting acronym.
- It does not assume a persona improves every task.
- It does not assume verbosity equals quality.
- It does not silently trust an optimizer model’s rewrite.
- Its readiness score is not a prediction of factual accuracy or benchmark performance.

## Core principles

### Preserve intent

Optimization must not replace the user’s objective with what the optimizer finds easier or more conventional.

### Minimal sufficiency

Every added instruction must reduce ambiguity, enforce a real boundary, specify the deliverable, or improve verification. Decorative prompt language is noise.

### Separate concerns

System behavior, user objective, source material, tool permissions, and output schema are different layers. Mixing them creates ambiguity and prompt-injection risk.

### Target-aware compilation

A coding agent needs tool boundaries and verification. A research model needs evidence rules and uncertainty handling. An image model needs visual composition. The same template should not be forced onto all targets.

### Deterministic first

The core must work offline and be inspectable. Model-assisted optimization is optional candidate generation, not the source of product truth.

### Evals over folklore

A prompt change becomes trustworthy only when it improves representative cases under defined criteria. General prompt advice is a hypothesis, not a release criterion.

### Human judgment remains first-class

Code checks are strong for schemas and exact requirements. Model graders help with subjective criteria. Domain experts are still necessary for nuanced quality, safety, and intent preservation.

## Product loop

The intended long-term loop is:

1. Capture the user’s intent.
2. Build Prompt IR.
3. Run deterministic lint rules.
4. Compile a conservative baseline.
5. Generate optional candidates.
6. Execute candidates against a dataset.
7. Score with code, models, and humans.
8. Select or revise.
9. Version the prompt and evaluation evidence.
10. Turn production failures into new regression cases.

This loop borrows the strongest ideas from automatic prompt optimization, prompt registries, evaluation platforms, and programmatic LM frameworks without forcing Prompteur to become a heavy orchestration framework.
