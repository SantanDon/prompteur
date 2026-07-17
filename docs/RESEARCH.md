# Research and methodology

This document records the external methods that informed Prompteur’s direction and, equally importantly, what the project deliberately does not copy.

## Synthesis

The strongest prompt systems do not rely on one universal framework. They combine some form of:

1. structured task representation,
2. candidate generation or compilation,
3. representative examples or datasets,
4. explicit evaluation criteria,
5. iterative selection and regression testing,
6. prompt versioning and provenance.

Prompteur adopts that lifecycle while keeping its deterministic local core small and inspectable.

## Method families

### Iterative prompt design

Google’s prompt-design guidance treats prompting as an iterative design process and distinguishes objective, instructions, context, constraints, examples, and response format. This supports Prompt IR and the diagnostic-first workflow.

Adopted:

- explicit task components,
- target-aware prompt construction,
- iteration based on observed failures.

Not adopted:

- presenting one static template as sufficient for every use case.

Sources:

- https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/prompt-design-strategies

### Test-driven prompt development

Promptfoo treats prompt and model changes as testable artifacts with datasets, assertions, metrics, red-team checks, and CI integration. This is the closest operational pattern for Prompteur’s future evaluation layer.

Adopted:

- local-first regression cases,
- CI-gated deterministic behavior,
- future model and prompt matrices,
- explicit security evaluation.

Deferred:

- making Promptfoo a mandatory runtime dependency,
- coupling the compiler to one evaluation vendor or file format.

Sources:

- https://www.promptfoo.dev/docs/intro/
- https://www.promptfoo.dev/docs/configuration/guide/
- https://www.promptfoo.dev/docs/integrations/ci-cd/

### Automatic prompt optimization

OPRO frames prompt improvement as an optimization problem: an optimizer model proposes candidates, an evaluator scores them, and the history informs the next iteration. Vertex AI Prompt Optimizer similarly distinguishes zero-shot optimization from data-driven iterative optimization.

Adopted:

- optimizer outputs are candidates,
- deterministic baseline precedes optimization,
- optimization should use lint findings and evaluation evidence,
- iterative candidate history belongs in future versions.

Rejected:

- trusting the optimizer’s self-description of quality,
- selecting a winner without task execution and scoring,
- hiding the baseline from the user.

Sources:

- https://arxiv.org/abs/2309.03409
- https://cloud.google.com/vertex-ai/generative-ai/docs/learn/prompts/prompt-optimizer

### Textual gradients and feedback loops

TextGrad uses textual feedback to optimize components of compound systems. Its useful lesson is broader than its implementation: failure analysis can be turned into targeted revision signals rather than a generic “rewrite this better” request.

Adopted:

- stable lint findings as revision signals,
- future evaluator feedback as structured candidate input,
- component-level rather than whole-prompt-only refinement.

Deferred:

- gradient-like multi-step orchestration inside the core browser app.

Source:

- https://arxiv.org/abs/2406.07496

### Programmatic LM systems

DSPy separates program signatures and modules from raw prompt strings, then compiles them for models. Prompteur’s Prompt IR follows the same high-level insight without attempting to reproduce DSPy’s Python framework or optimizer stack.

Adopted:

- structured intent before rendering,
- compiler targets rather than hand-maintained giant prompt strings,
- evaluation as part of program quality.

Not adopted:

- a Python runtime,
- requiring users to express every task as code,
- replacing the lightweight local UI with an orchestration framework.

Source:

- https://dspy.ai/

### Prompt registries and lifecycle management

PromptLayer demonstrates the operational importance of prompt versioning, datasets, evaluations, release labels, backtests, and CI. These become important when prompts move from personal experiments into production systems.

Adopted for the roadmap:

- immutable prompt versions,
- provenance and target metadata,
- release states,
- dataset-linked evaluation evidence,
- rollback-friendly history.

Not adopted now:

- a hosted registry dependency,
- team permissions and production deployment controls before local quality is proven.

Sources:

- https://docs.promptlayer.com/features/prompt-registry
- https://docs.promptlayer.com/features/evaluations

### Prompting principles research

The “Principled Instructions Are All You Need” paper evaluates 26 prompting principles. It is useful as a source of hypotheses, especially around clarity, audience, examples, affirmative directives, and output structure.

Prompteur does not expose a “26 principles” switch because:

- principles are not universally relevant,
- some conflict with minimality or target-specific needs,
- enabling all of them hides the causal reason for a change,
- product claims should match implemented and evaluated behavior.

Individual ideas may become named lint or compiler rules only when they address a defined failure mode and have regression cases.

Source:

- https://arxiv.org/abs/2312.16171

## Tool adoption matrix

| Tool or method | Role in ecosystem | Prompteur decision |
| --- | --- | --- |
| Promptfoo | Open-source evaluations, assertions, red teaming, CI | Planned optional adapter; methodology adopted now |
| DSPy | Programmatic LM signatures and optimization | Structural inspiration; no dependency |
| OPRO | LLM proposes prompts using score history | Candidate-loop inspiration; requires eval evidence |
| TextGrad | Textual feedback optimizes system components | Future targeted revision signals |
| Vertex Prompt Optimizer | Managed zero-shot and data-driven optimization | Reference architecture; not a required service |
| PromptLayer | Prompt registry, versions, datasets, release workflow | Lifecycle inspiration for future local registry |
| Ollama | Local model serving | Supported optional provider |
| Gemini API | Remote candidate generation | Supported optional provider through local proxy |
| LangSmith / similar observability suites | Traces, datasets, evaluations | Possible adapters later; avoid core coupling |

## Evaluation methodology

A future prompt evaluation should combine the following where relevant:

### Contract checks

Deterministic assertions for:

- required sections or fields,
- valid JSON or schemas,
- forbidden content,
- preservation of hard constraints,
- instruction-boundary handling,
- exact facts supplied in the case.

### Task execution

Run the candidate prompt on one or more target models with controlled settings and representative inputs.

### Outcome grading

Use a mix of:

- deterministic code graders,
- reference-answer comparisons,
- model graders with explicit rubrics,
- pairwise preference judgments,
- domain-expert review.

### Operational metrics

Track:

- pass rate,
- failure categories,
- token usage,
- latency,
- provider and model,
- run date and configuration,
- cost where applicable.

### Robustness

Include:

- ordinary cases,
- ambiguous cases,
- long-context cases,
- conflicting instructions,
- prompt-injection attempts,
- target-model changes.

## Research guardrail

External prompt advice enters Prompteur as a hypothesis. It becomes product behavior only after it is translated into an explicit rule or compiler decision, tested against representative cases, documented, and shown not to regress existing behavior.
