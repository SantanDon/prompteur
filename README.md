# Prompteur

**A local-first prompt compiler, linter, and evaluation workbench.**

Prompteur turns rough intent into an inspectable task contract. It diagnoses ambiguity and unsafe instruction boundaries, compiles a deterministic prompt for the selected target, and can optionally ask Ollama or Gemini to generate a separate candidate.

It is built around one principle:

> Better prompts are not necessarily longer. They are clearer, appropriately constrained, target-aware, and testable.

## Current capabilities

- **Prompt IR** — separates objective, context, constraints, audience, output, verification, and target behavior.
- **Deterministic linting** — flags vague objectives, implicit context, missing output contracts, conflicts, prompt injection, persona bloat, and other defined failure modes.
- **Target compilers** — general model, coding/tool agent, research model, and image model.
- **Inspectable results** — compiled prompt, diagnostics, readiness dimensions, and serialized IR.
- **Optional candidates** — local Ollama or Gemini model-assisted rewrites, clearly distinguished from the deterministic baseline.
- **Local-first security** — no model required, Gemini keys are not persisted, Ollama is restricted to localhost, and the server exposes only approved application files.
- **Regression cases** — deterministic prompt behavior is checked in tests and an evaluation-case runner.
- **Agent-maintained repository** — explicit architecture, product invariants, ADRs, and maintainer workflow.

## Quick start

Requirements:

- Node.js 22 or newer.

Run:

```bash
npm start
```

Open:

```text
http://127.0.0.1:3030
```

The local compiler works immediately without installing dependencies, running a model, or configuring an API key.

## Optional model providers

### Ollama

1. Run Ollama locally.
2. Ensure the desired model is installed.
3. Open Prompteur settings.
4. Select **Ollama candidate**.
5. Set the localhost URL and model name.

Remote Ollama hosts are intentionally rejected by the server in the current architecture.

### Gemini

Set `GEMINI_API_KEY` in the server environment, or enter a key in the settings dialog for the current page session. Keys entered in the browser remain in memory only and are not written to local storage.

Optional defaults are listed in `config.example.env`.

## How it works

```text
rough request
   ↓
Prompt IR
   ├── deterministic linter → diagnostics + readiness dimensions
   ├── target compiler → local baseline
   └── optional provider → model candidate
                              ↓
                        future eval loop
```

The model candidate is not automatically described as better. The roadmap adds comparative execution, grading, versioning, and prompt selection based on evidence.

## Commands

```bash
npm start      # run the local application
npm test       # unit and server tests
npm run eval   # deterministic prompt regression cases
npm run check  # syntax, tests, and evaluations
```

## Repository map

```text
src/core/          Prompt IR, lint rules, and target compiler
src/providers/     Browser client for optional providers
src/app.js         Browser interaction and state
evaluations/       Representative prompt regression cases
scripts/           Evaluation runner
tests/             Core and server tests
docs/              Philosophy, architecture, research, roadmap, ADRs
server.js           Secure local server and provider proxy
AGENTS.md           Rules for agent maintainers
```

## Design philosophy

Prompteur deliberately avoids:

- universal “super prompt” templates,
- applying every prompting framework at once,
- prestige personas as a substitute for task detail,
- hidden optimizer decisions,
- storing secrets in browser storage,
- claiming a rewrite is improved without evaluation evidence.

Read:

- [`docs/PRODUCT_PHILOSOPHY.md`](docs/PRODUCT_PHILOSOPHY.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/RESEARCH.md`](docs/RESEARCH.md)
- [`docs/ROADMAP.md`](docs/ROADMAP.md)
- [`docs/MAINTAINER_LOOP.md`](docs/MAINTAINER_LOOP.md)

## Project status

Prompteur is an early but functional `0.2` foundation. Deterministic diagnosis and compilation are implemented and tested. Comparative model execution, prompt versioning, human preference capture, and automatic optimization loops remain roadmap work.

The readiness score is a transparent contract heuristic. It is not a scientific measure of factual accuracy, model intelligence, or downstream benchmark performance.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`AGENTS.md`](AGENTS.md). Compiler and linter changes should begin with a representative case and preserve all security and product invariants.

## License

MIT © 2026 Don Santos
