
# Prompteur

**A local-first intent compiler and integration bridge for AI models and agents.**

Prompteur turns rough human intent into a structured, target-aware, testable task contract. It diagnoses ambiguity and unsafe instruction boundaries, compiles a deterministic prompt, and exposes that same result through a browser workbench, CLI, JavaScript API, and loopback HTTP bridge.

> Better prompts are not necessarily longer. They are clearer, appropriately constrained, target-aware, and testable.

## Zero Copy-Paste

Prompteur is no longer limited to a website workflow. Version `0.3` introduces one shared compilation pipeline that can be called directly from shells, scripts, agents, and local tools.

```text
human intent
   ↓
shared Prompteur pipeline
   ├── browser workbench
   ├── CLI / stdin / files
   ├── JavaScript API
   ├── local HTTP bridge
   └── deterministic evaluation runner
```

The next integration surfaces—MCP, browser extension, IDE actions, and direct agent execution—will wrap this same pipeline rather than reimplementing prompt behavior.

## Try the browser workbench

Public deterministic demo:

- https://santandon.github.io/prompteur/

The GitHub Pages demo performs local deterministic compilation in the browser. Optional provider calls and the HTTP bridge require the local Node server.

## Quick start

Requirements:

- Node.js 22 or newer.

Run the local workbench and bridge:

```bash
npm start
```

Open:

```text
http://127.0.0.1:3030
```

No dependency installation, model, database, or API key is required for deterministic compilation.

> Do not double-click `index.html` to run the interactive application. Browsers restrict JavaScript modules loaded from `file://` URLs. Use `npm start` or the hosted demo.

## CLI

Use the CLI directly from the repository:

```bash
node bin/prompteur.js --target agent "Review this repository and fix the failing tests."
```

Create a reusable local command:

```bash
npm link
prompteur --version
```

Compile from text, a file, or stdin:

```bash
prompteur --target agent "Improve authentication and verify the result."
prompteur --file user_task.md --target agent > compiled-task.md
echo "Research local AI evaluation tools" | prompteur --target research
```

Return the full machine-readable result for another tool or agent:

```bash
prompteur --target research --json "Compare prompt evaluation methods."
```

Inspect weaknesses without printing the compiled prompt:

```bash
prompteur analyze "Fix this"
```

Run `prompteur --help` for the complete command contract.

## Local HTTP bridge

Start `npm start`, then call:

```bash
curl -s http://127.0.0.1:3030/api/compile \
  -H "Content-Type: application/json" \
  -d '{"input":"Review this repository and fix the failing tests.","options":{"target":"agent","outputFormat":"code"}}'
```

Capabilities:

```text
GET http://127.0.0.1:3030/api/capabilities
```

OpenAPI contract:

```text
http://127.0.0.1:3030/openapi.json
```

The API accepts loopback clients only and intentionally sends no permissive CORS headers. See [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md).

## JavaScript API

```js
import { compileRequest } from 'prompteur';

const result = compileRequest('Investigate the failing tests.', {
  target: 'agent',
  tone: 'direct',
  outputFormat: 'code',
});

console.log(result.prompt);
```

## Current capabilities

- **Shared compilation pipeline** — one versioned result contract across every product surface.
- **Prompt IR** — separates objective, context, constraints, audience, output, verification, and target behavior.
- **Deterministic linting** — flags vague objectives, implicit context, missing output contracts, conflicts, prompt injection, persona bloat, and other defined failure modes.
- **Target compilers** — general model, coding/tool agent, research model, and image model.
- **CLI and HTTP bridge** — text, stdin, files, JSON output, capabilities discovery, and OpenAPI.
- **Inspectable browser results** — compiled prompt, diagnostics, readiness dimensions, and serialized IR.
- **Optional candidates** — local Ollama or Gemini model-assisted rewrites, clearly distinguished from the deterministic baseline.
- **Local-first security** — no model required, Gemini keys are not persisted, Ollama is restricted to localhost, API clients must be loopback, and the server exposes only approved files.
- **Regression cases** — deterministic prompt behavior is checked in tests and an evaluation-case runner.
- **Agent-maintained repository** — explicit architecture, product invariants, ADRs, and maintainer workflow.

## Optional model providers

### Ollama

1. Run Ollama locally.
2. Ensure the desired model is installed.
3. Open Prompteur settings.
4. Select **Ollama candidate**.
5. Set the localhost URL and model name.

Remote Ollama hosts are intentionally rejected.

### Gemini

Set `GEMINI_API_KEY` in the server environment, or enter a key in the settings dialog for the current page session. Keys entered in the browser remain in memory only and are not written to local storage.

Optional defaults are listed in `config.example.env`.

## Commands

```bash
npm start      # local workbench and loopback bridge
npm run compile -- "Your request"  # invoke the CLI through npm
npm test       # unit, CLI, pipeline, and server tests
npm run eval   # deterministic prompt regression cases
npm run check  # syntax, tests, and evaluations
```

## Repository map

```text
bin/prompteur.js     Composable CLI
src/core/pipeline.js Shared deterministic product pipeline
src/core/            Prompt IR, lint rules, catalogs, compiler, versions
src/providers/       Browser client for optional providers
src/app.js           Browser interaction and state
openapi.json         Local bridge contract
evaluations/         Representative prompt regression cases
scripts/             Evaluation runner
tests/               Core, pipeline, CLI, server, and security tests
docs/                Philosophy, integrations, architecture, roadmap, ADRs
server.js             Secure static server, local bridge, provider proxy
AGENTS.md             Rules for agent maintainers
```

## Design philosophy

Prompteur deliberately avoids:

- universal “super prompt” templates,
- applying every prompting framework at once,
- prestige personas as a substitute for task detail,
- hidden optimizer decisions,
- storing secrets in browser storage,
- exposing an unauthenticated bridge to arbitrary web pages,
- claiming a rewrite is improved without evaluation evidence.

Read:

- [`docs/PRODUCT_PHILOSOPHY.md`](docs/PRODUCT_PHILOSOPHY.md)
- [`docs/INTEGRATIONS.md`](docs/INTEGRATIONS.md)
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/RESEARCH.md`](docs/RESEARCH.md)
- [`docs/ROADMAP.md`](docs/ROADMAP.md)
- [`docs/MAINTAINER_LOOP.md`](docs/MAINTAINER_LOOP.md)

## Project status

Prompteur `0.3` is the first Zero Copy-Paste foundation. Deterministic compilation is reusable from the browser, CLI, JavaScript, local HTTP, and evaluation runner. MCP, browser extension, direct agent execution, comparative evaluation, and project memory remain roadmap work.

The readiness score is a transparent contract heuristic. It is not a scientific measure of factual accuracy, model intelligence, or downstream benchmark performance.

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) and [`AGENTS.md`](AGENTS.md). Compiler and linter changes should begin with a representative case and preserve all security and product invariants.

## License

MIT © 2026 Don Santos
