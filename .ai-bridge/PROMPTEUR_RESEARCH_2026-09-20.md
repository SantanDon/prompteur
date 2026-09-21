# Prompteur Research Brief — 2026-09-20

## Executive decision

Prompteur should remain a **small, deterministic intent compiler first**. The evidence does not support turning it into a universal “prompt genius,” a self-referential optimizer, or a context-dumping orchestration layer. The strongest durable pattern across current provider guidance and prompt-optimization research is simpler:

1. make the task contract explicit,
2. preserve user intent and hard constraints,
3. adapt only what genuinely differs by target/model/harness,
4. add examples or context only when they reduce a known failure mode,
5. evaluate the compiled prompt against the raw request on representative tasks,
6. treat model-generated rewrites as candidates until they beat the baseline under measured criteria.

That matches the existing Prompteur philosophy and architecture unusually well. The next gains should come from **evaluation quality and target-aware restraint**, not more prompt decoration.

---

## 1. Current repository baseline

Prompteur already has most of the correct architectural primitives.

### Deterministic core

The durable product boundary is `src/core/pipeline.js`, which validates input/options, normalizes intent into Prompt IR, analyzes gaps, compiles a target-specific contract, and returns provenance. The architecture explicitly requires every deterministic surface to call this shared pipeline.

Relevant modules:

- `src/core/normalize.js` — conservative Prompt IR construction.
- `src/core/analyze.js` — inspectable lint/readiness findings with stable issue IDs.
- `src/core/compile.js` — target rendering for general models, coding/tool agents, research models, and image models.
- `src/core/pipeline.js` — versioned orchestration contract.
- `src/core/catalog.js` — target/task metadata.
- `src/core/version.js` — engine/schema provenance.

### Delivery surfaces already implemented

The same deterministic pipeline is exposed through:

- browser workbench (`src/app.js`),
- CLI (`bin/prompteur.js`),
- JavaScript package exports,
- loopback HTTP (`server.js`, `openapi.json`),
- local read-only MCP stdio (`src/mcp/server.js`, `bin/prompteur-mcp.js`),
- deterministic evaluation runner (`scripts/evaluate.js`, `evaluations/cases.json`).

This is important: Prompteur is already more than a website. It is a local compiler with multiple delivery surfaces.

### Optional model assistance

Provider-assisted rewriting already sits downstream from the deterministic baseline. The repository supports optional local Ollama and Gemini candidate generation, but correctly labels provider output as a candidate rather than truth.

### Current evaluation boundary

`evaluations/cases.json` currently verifies deterministic behavior such as:

- expected lint findings,
- required/forbidden compiled fragments,
- hard-constraint preservation,
- target-specific instructions,
- untrusted-source handling,
- prompt-bloat regressions.

The current runner intentionally does **not** claim downstream model quality. This is the biggest productive gap for v0.4.

### Current product thesis worth preserving

`docs/PRODUCT_PHILOSOPHY.md` already states the right invariant:

> A good prompt is the smallest task contract that reliably communicates intent, context, constraints, output, and verification to a specific execution environment.

The rest of this brief treats that as the design constraint rather than trying to replace it with another framework.

---

## 2. What current provider guidance actually says

### OpenAI — durable guidance

Current OpenAI prompt-engineering guidance continues to recommend:

- clear instructions and explicit authority separation (`instructions` / message roles),
- model-appropriate prompting rather than assuming one prompt works identically across model families,
- pinning production model snapshots where consistency matters,
- maintaining eval suites when prompts or model versions change,
- few-shot examples when a pattern must be demonstrated,
- retrieval/context only when it is relevant to the task.

For long-running agents, OpenAI guidance also emphasizes persistence, decomposition, tool-use transparency at important points, and progress/evaluation criteria. These are primarily **agent-harness controls**, not universal text-generation prompt ingredients.

Source (accessed 2026-09-20):
- OpenAI, “Prompt Engineering” — https://developers.openai.com/api/docs/guides/prompt-engineering
- OpenAI, Agents API / agent configuration — https://developers.openai.com/api/docs/guides/agents-api/configuration

**Prompteur implication:** provider/model metadata can justify small target adapters, but only when an eval proves the adapter beats the portable baseline. Do not copy long agent-scaffolding prose into every prompt.

### Anthropic — strongest warning against over-prompting

Anthropic’s current prompting guidance for the newest Claude models is unusually explicit that newer models can over-trigger tools, over-explore, over-verify, and over-engineer when prompts retain aggressive scaffolding that was useful for older models. It recommends clear/direct instructions, relevant context, well-chosen examples, structured boundaries, and targeted rather than blanket tool guidance.

Anthropic also recommends context management that keeps only useful information available, and its agent engineering guidance emphasizes durable state/memory rather than stuffing entire histories into context.

Sources (accessed 2026-09-20):
- Anthropic, “Prompting best practices” — https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-templates-and-variables
- Anthropic, “Effective context engineering for AI agents” — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Anthropic, “Introducing advanced tool use on the Claude Developer Platform” (2025-11-24) — https://www.anthropic.com/engineering/advanced-tool-use

**Prompteur implication:** “more instructions” is not a monotonic quality function. Prompteur should learn when to **remove** redundant scaffolding for capable harnesses/models.

### Google / Gemini — concise prompting for reasoning models

Google’s current Gemini 3 guidance says the reasoning model responds best to concise, direct instructions and may over-analyze verbose or overly complex prompt engineering techniques carried over from older models. Google also recommends placing task instructions/questions after large data contexts and using explicit examples when format/behavior needs demonstration.

Sources (accessed 2026-09-20):
- Google AI for Developers, “Gemini 3 developer guide” — https://ai.google.dev/gemini-api/docs/generate-content/gemini-3
- Google Cloud, “Include few-shot examples” — https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/prompts/few-shot-examples

**Prompteur implication:** the default compiler should stay short. Target profiles should be capable of suppressing legacy prompting tricks, not only adding them.

---

## 3. Evidence classification

### A. Broadly durable techniques

These are supported across providers and/or by repeated empirical results. They should remain part of the deterministic core when relevant.

1. **Explicit objective and deliverable.**
   - Make the actual task and expected output unambiguous.
   - Prompteur already does this.

2. **Hard constraints separated from descriptive context.**
   - Prevents requirements from becoming buried or mistaken for source text.
   - Prompteur already has the right IR separation.

3. **Instruction/source boundaries.**
   - Distinguish user instructions from untrusted retrieved/uploaded material.
   - Durable for both quality and prompt-injection resistance.

4. **Verification criteria when the task is verifiable.**
   - Tests, schemas, acceptance criteria, citations, or evidence rules are useful when they correspond to a real success condition.
   - Do not invent unverifiable checks merely to make a prompt look rigorous.

5. **Representative examples for behavioral/format ambiguity.**
   - Few-shot examples are powerful when there is a pattern to demonstrate.
   - They are not free: poor or narrow examples can teach incidental patterns.

6. **Eval-driven iteration.**
   - This is the strongest cross-cutting conclusion. Prompt/model changes should be measured on representative cases rather than accepted by appearance.

### B. Provider-specific / model-specific tactics

These belong in small target profiles, never as global rules.

Examples:

- XML-tag structure is especially emphasized in Claude guidance.
- Gemini reasoning models currently prefer concise/direct prompts and can over-analyze older elaborate scaffolds.
- OpenAI differentiates guidance for reasoning vs non-reasoning model families and emphasizes roles/instruction hierarchy.
- Effort/thinking controls are provider/runtime configuration, not prose that should always be injected.

**Rule:** a provider tactic becomes a Prompteur adapter only after a paired eval shows measurable uplift or a documented compatibility requirement.

### C. Harness-specific tactics

A harness is not just a raw model. Codex, Claude Code, Gemini CLI/app, OpenCode, Hermes, MCP-based coding agents, and agent SDKs may already provide:

- system/developer instructions,
- filesystem/tool boundaries,
- task lists,
- planning loops,
- memory/compaction,
- subagent orchestration,
- approval policies,
- tool schemas,
- retries and verification loops.

Prompteur should not duplicate those features in prompt text unless the harness demonstrably needs the instruction.

For example, a raw API model may benefit from “run tests before finishing,” while a coding harness whose system layer already requires verification may only need the user’s task, constraints, scope, and acceptance criteria.

**Rule:** compile for the *execution environment*, not only the model name.

### D. Useful but evidence-dependent techniques

These are powerful in the right task but should be conditional:

- few-shot/multishot examples,
- explicit decomposition,
- self-check/review passes,
- chain/pipeline prompting,
- long-context quotation/extraction stages,
- optimizer-generated candidate prompts.

Prompteur should activate them from a diagnosed failure mode or an explicit target profile, not by default.

### E. Weak / folklore / low-value defaults

Do not ship these as universal “enhancements”:

- generic personas (“You are a world-class expert”) without task relevance,
- “take a deep breath” / prestige / motivational language,
- blanket “think step by step” additions to models that already have native reasoning controls,
- universal XML/Markdown section inflation,
- repeated restatement of the same goal in several forms,
- always-on self-critique loops,
- always-on multi-agent delegation,
- dumping whole conversation histories “for context,”
- prompt-length/readiness scores presented as quality science.

---

## 4. What the automatic-prompt-optimization literature supports — and what it does not

### OPRO shows optimization can work, but only with measured objective feedback

“Large Language Models as Optimizers” (Yang et al., 2023) showed that iterative LLM-generated instructions can outperform human prompts on some benchmarks when candidate history and task scores are fed back into the optimizer.

Source: https://arxiv.org/abs/2309.03409 (2023-09-07)

Prompteur should adopt the **optimization loop shape**, not the assumption that the optimizer’s prose is intrinsically better.

### Smaller or weaker optimizers can make the economics poor

“Revisiting OPRO: The Limitations of Small-Scale LLMs as Optimizers” found limited effectiveness for smaller LLMs and emphasized computational cost versus marginal gain.

Source: https://arxiv.org/abs/2405.10276 (2024-05-16; revised 2024-07-19)

**Prompteur implication:** never make recursive optimization the default. Budget and stop conditions are mandatory.

### Self-reflection is not a trustworthy evaluator by itself

“Are Large Language Models Good Prompt Optimizers?” found that optimizers often fail to identify true error causes and can be biased by prior knowledge; even semantically plausible reflections do not reliably yield the best target-model prompt.

Source: https://arxiv.org/abs/2402.02101 (2024-02-03)

**Prompteur implication:** an optimizer cannot grade itself into “improved.” Execution evidence must decide.

### DSPy supports separating task specification from tuned prompt text

DSPy formalizes the valuable architectural idea that programs/signatures can be stable while compilation/optimization adapts the prompt to a model and metric.

Source: https://arxiv.org/abs/2310.03714 (2023-10-05)

**Prompteur implication:** Prompt IR is the right abstraction. Keep optimization downstream from the IR rather than letting a rewrite replace the user’s specification.

### APO / textual feedback suggests structured failure signals are better than “rewrite better”

“Automatic Prompt Optimization with ‘Gradient Descent’ and Beam Search” turns errors into natural-language feedback that guides candidate edits.

Source: https://arxiv.org/abs/2305.03495 (2023-05-04)

**Prompteur implication:** lint IDs, failed assertions, and grader categories should become targeted revision signals later. Avoid whole-prompt freeform rewriting when one component is wrong.

### Evolutionary/self-referential systems are interesting, not a v0.4 requirement

Promptbreeder and newer systems such as SePO show that evolutionary/self-referential prompt search can outperform manual baselines on selected benchmarks.

Sources:
- Promptbreeder — https://arxiv.org/abs/2309.16797 (2023-09-28)
- SePO — https://arxiv.org/abs/2606.04465 (2026-06-03)

These methods increase search cost, evaluation complexity, and overfitting risk. They are research references for a future optimizer, not justification for adding recursive self-prompting now.

### Long context is not the same as useful context

“Lost in the Middle” showed that long-context models can still use information unevenly depending on position, with relevant material in the middle often used less effectively.

Source: https://arxiv.org/abs/2307.03172 (2023-07-06; later TACL publication)

**Prompteur implication:** selective context hydration is more defensible than transcript dumping.

---

## 5. Raw model vs agent harness: the distinction Prompteur should encode

Prompteur should represent a target as at least two conceptual layers:

- **model profile** — family/snapshot/reasoning/tool-call behavior when known;
- **harness profile** — what the surrounding runtime already guarantees.

A portable baseline remains the default. A profile should only alter compilation when there is a documented compatibility need or measured uplift.

### Raw model profile may need

- explicit task framing,
- exact output schema,
- tool descriptions/policies supplied by the API caller,
- examples,
- verification request,
- context boundaries.

### Coding/agent harness profile may already supply

- persistence / task-loop instructions,
- file-reading expectations,
- tool-call protocols,
- approval gates,
- test-running conventions,
- context compaction/memory,
- subagent mechanisms.

In those cases Prompteur’s highest-value output is often **smaller**: objective, scope, constraints, relevant context, deliverable, acceptance tests, and explicit non-goals.

### Proposed invariant

> Never add an instruction merely because it is good generic agent advice. Add it only if the target does not already provide it and an observed failure mode justifies it.

---

## 6. Selective context hydration design

Prompteur should not hydrate context by copying full chat histories. Instead, use a bounded evidence model.

### Context classes

1. **Explicit user context** — facts/constraints the user supplied for this task.
2. **Referenced artifact context** — files, snippets, docs, code, or records explicitly relevant to the request.
3. **Durable project context** — project rules or prior decisions with stable provenance.
4. **Inferred context** — model/tool-derived guesses about what the user probably means.

### Hydration rules

- Prefer explicit/referenced context over inferred context.
- Retrieve the smallest subset that materially changes execution.
- Attach provenance to every hydrated item.
- Mark inferred items as `inferred` and never silently promote them to hard constraints.
- Do not import unrelated prior-chat details for personalization.
- If context is long, extract task-relevant fragments rather than insert the entire source.
- Preserve an omission path: if no extra context is required, compile without it.

### Proposed IR addition later (not necessarily v0.4)

A future context item could carry:

```json
{
  "text": "...",
  "sourceType": "user|artifact|project|inferred",
  "source": "...",
  "confidence": 1.0,
  "mutable": false,
  "selectedBecause": "..."
}
```

Do not add this schema until an eval demonstrates that context hydration improves real tasks without unacceptable token growth or intent drift.

---

## 7. When deterministic compilation is enough vs when model assistance is justified

### Deterministic pass is enough when

- the user objective is explicit,
- hard constraints are present,
- output format is known,
- task type/target are known,
- source material is already supplied,
- the compiler can make a conservative transformation without inventing facts.

This should remain the normal path.

### Optional model-assisted intent inference is justified when

- ambiguity materially blocks compilation,
- multiple interpretations would produce meaningfully different task contracts,
- information can be inferred from bounded supplied context rather than guessed from nowhere,
- the system can label the inference and preserve the original input,
- the user can inspect/reject the inferred field,
- an eval shows the inference improves completion quality more than it increases drift.

### Model assistance should not

- invent business/domain assumptions,
- silently fill acceptance criteria,
- rewrite the objective into a conventional task the user did not ask for,
- replace explicit user constraints,
- auto-accept its own inferred context.

---

## 8. Bounded self-prompting / optimizer loops

A self-prompting loop can help only when Prompteur has an external scoring signal.

### Minimum conditions before running a loop

- deterministic baseline exists,
- representative eval cases exist,
- objective metric/rubric is defined,
- candidate executions can be scored independently,
- budget and iteration limits are set,
- candidate provenance is retained.

### Stop conditions

Stop when any one of these is true:

- score has not improved beyond a configured epsilon for N iterations,
- max candidate count reached,
- token/cost/time budget reached,
- candidate becomes longer without measurable quality gain,
- hard-constraint or safety regression occurs,
- output becomes equivalent/duplicate to an existing candidate.

### Default v0.4 stance

No autonomous recursive optimization in the normal product path. Build the measurement substrate first. A bounded optimizer experiment can exist only behind an explicit experimental flag after paired evaluations exist.

---

## 9. Required evaluation methodology for every new prompting technique

Every proposed compiler change should be tested against a **raw/vague input control** and the existing deterministic Prompteur baseline.

### Minimum comparison arms

- **A — Raw**: user input as-is.
- **B — Baseline**: current deterministic Prompteur output.
- **C — Candidate rule/profile**: baseline plus exactly one new technique.

Optional optimizer-generated variants come later.

### Metrics

1. **Task quality**
   - deterministic task-specific grader where possible,
   - rubric/model grader where necessary,
   - human preference for subjective tasks.

2. **Instruction adherence**
   - required constraints satisfied,
   - forbidden actions/content avoided,
   - requested output shape satisfied.

3. **Unsupported assumptions / hallucination proxy**
   - claims not supported by supplied context,
   - invented requirements,
   - fabricated citations/facts where ground truth exists.

4. **Efficiency**
   - input tokens,
   - output tokens,
   - latency,
   - cost,
   - tool calls/steps for agents where observable.

5. **Regression rate**
   - cases where the candidate loses against baseline,
   - failures by target/model/harness.

### Release rule

A new technique should not become default because mean quality improves slightly. It should show a meaningful win on the intended failure class, acceptable regressions elsewhere, and a defensible token/latency cost.

---

## 10. Recommended v0.4 architecture — four slices maximum

### Slice 1 — Paired evaluation record + runner (highest priority)

Create a stable local result schema that can record the raw prompt, deterministic baseline, optional candidate, target/model/harness metadata, outputs, grader/assertion results, tokens, latency, cost, and provenance.

Then add a runner that can compare **Raw vs Baseline** without requiring any optimizer.

Why first: Prompteur cannot responsibly claim an improvement, provider adapter, context strategy, or optimizer win until this exists.

### Slice 2 — Evidence-aware comparison contract

Add semantic comparison grouped by:

- objective,
- context,
- constraints,
- output contract,
- verification/behavior,
- additions that are inferred vs explicitly supplied.

The UI/CLI should clearly label `raw`, `deterministic baseline`, `provider candidate`, and `evaluated winner` as different states.

Why second: users need to see *what changed* and whether the change has evidence, not just a longer prompt.

### Slice 3 — Target/harness profile registry, additive only when proven

Extend the existing catalog with a small, versioned metadata layer for target environment capabilities (for example: native reasoning control, tool loop already present, memory/compaction present, output schema support).

Profiles should be able to suppress redundant instructions as well as add required ones.

No profile becomes default without paired eval evidence.

Why third: current provider guidance increasingly diverges by model/harness, and capable agents are harmed by legacy over-scaffolding.

### Slice 4 — Experimental bounded candidate optimizer

Only after slices 1–3 exist, allow an explicit experiment that proposes a small number of variants from lint failures / failed eval assertions and selects by external score.

Hard requirements:

- max iterations/candidates,
- cost/token/time budget,
- deduplication,
- baseline always retained,
- stop on plateau/regression,
- no self-awarded “improved” label.

Why fourth: the literature supports optimizer loops only when paired with objective feedback; self-reflection alone is not enough.

---

## 11. What not to build now

Explicitly reject the following for v0.4:

- a universal “super prompt” template,
- a library of prompting acronyms/toggles,
- automatic full-chat transcript injection,
- recursive self-improvement by default,
- multi-agent prompt optimization as a normal path,
- hidden context inference,
- provider-specific forks of the whole compiler,
- a hosted prompt registry/team platform,
- another orchestration framework competing with Codex/Claude Code/Gemini/OpenCode/Hermes,
- prompt-length or readiness scores marketed as expected task accuracy,
- any claim that a candidate is improved without execution evidence.

---

## 12. Concrete Prompteur hypotheses to test next

### H1 — Minimal explicit contracts beat raw vague requests on adherence without excessive token growth

Test on coding, research, extraction, and document tasks.

Pass condition: material adherence/quality uplift vs raw with bounded token increase and no hallucination regression.

### H2 — Harness-aware suppression beats generic agent scaffolding on modern coding agents

Compare current agent compiler output against a reduced profile that removes instructions already guaranteed by the harness.

Pass condition: same or better task success with lower input tokens/latency and no safety regression.

### H3 — Selective context beats full-history context

Construct cases where one or two historical facts matter among large irrelevant history.

Pass condition: selective hydration matches or exceeds full-history quality with lower tokens and fewer unsupported assumptions.

### H4 — External-score optimizer beats one-shot candidate generation only when enough eval signal exists

Compare one-shot model rewrite with a bounded 3–5 candidate optimizer using explicit task scores.

Pass condition: optimizer improvement exceeds extra cost/latency by a predeclared threshold and generalizes to held-out cases.

---

## 13. Source register

### Primary provider guidance

- OpenAI, “Prompt Engineering,” accessed 2026-09-20: https://developers.openai.com/api/docs/guides/prompt-engineering
- OpenAI, Agents API configuration, accessed 2026-09-20: https://developers.openai.com/api/docs/guides/agents-api/configuration
- Anthropic, “Prompting best practices,” accessed 2026-09-20: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/prompt-templates-and-variables
- Anthropic, “Effective context engineering for AI agents,” accessed 2026-09-20: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Anthropic, “Introducing advanced tool use on the Claude Developer Platform,” published 2025-11-24: https://www.anthropic.com/engineering/advanced-tool-use
- Google AI for Developers, “Gemini 3 developer guide,” accessed 2026-09-20: https://ai.google.dev/gemini-api/docs/generate-content/gemini-3
- Google Cloud, “Include few-shot examples,” accessed 2026-09-20: https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/prompts/few-shot-examples

### Research

- Yang et al., “Large Language Models as Optimizers” (OPRO), 2023-09-07: https://arxiv.org/abs/2309.03409
- Pryzant et al., “Automatic Prompt Optimization with ‘Gradient Descent’ and Beam Search,” 2023-05-04: https://arxiv.org/abs/2305.03495
- Khattab et al., “DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines,” 2023-10-05: https://arxiv.org/abs/2310.03714
- Fernando et al., “Promptbreeder: Self-Referential Self-Improvement Via Prompt Evolution,” 2023-09-28: https://arxiv.org/abs/2309.16797
- Liu et al., “Lost in the Middle: How Language Models Use Long Contexts,” 2023-07-06: https://arxiv.org/abs/2307.03172
- Ma et al., “Are Large Language Models Good Prompt Optimizers?”, 2024-02-03: https://arxiv.org/abs/2402.02101
- Zhang et al., “Revisiting OPRO: The Limitations of Small-Scale LLMs as Optimizers,” 2024-05-16 / rev. 2024-07-19: https://arxiv.org/abs/2405.10276
- Mihindukulasooriya et al., “Automatic Prompt Optimization for Knowledge Graph Construction: Insights from an Empirical Study,” 2025-06-24: https://arxiv.org/abs/2506.19773
- Li et al., “A Survey of Automatic Prompt Engineering: An Optimization Perspective,” 2025-02-17: https://arxiv.org/abs/2502.11560
- Tao et al., “SePO: Self-Evolving Prompt Agent for System Prompt Optimization,” 2026-06-03: https://arxiv.org/abs/2606.04465

---

## Final recommendation

Prompteur should **not become more impressive-looking; it should become more falsifiable**. The repo already has the right core abstraction. The next architectural move is to make Raw vs Baseline vs Candidate measurable, then use that evidence to decide where target profiles, selective context, or bounded optimization actually earn their complexity.

Until those evals exist, the safest and most competitive default remains: deterministic, minimal, inspectable, target-aware, and explicit about what was inferred versus what the user actually said.
