# Contributing to Prompteur

Prompteur welcomes focused contributions that improve prompt-contract quality, evaluation evidence, security, accessibility, or maintainability.

## Before starting

Read:

- `AGENTS.md`
- `docs/PRODUCT_PHILOSOPHY.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`

For substantial architecture work, open an issue before implementation. A framework migration, runtime dependency, provider expansion, secret-handling change, or evaluation-semantics change requires an ADR.

## Development

Requirements:

- Node.js 22 or newer.

Run the app:

```bash
npm start
```

Run all checks:

```bash
npm run check
```

No dependency installation is currently required.

## Prompt behavior changes

Changes to normalization, linting, compilation, pipeline validation, CLI behavior, or the local bridge must include a representative case in `evaluations/cases.json` or a focused test under `tests/`.

A strong case records:

- the smallest realistic input,
- target and options,
- expected issue IDs,
- required semantic fragments,
- forbidden harmful or misleading fragments,
- why the behavior matters.

Avoid full-output snapshots unless exact wording is itself the contract.

## Pull requests

Keep pull requests narrow. Include:

1. the problem and reproduction or evaluation case,
2. the implementation approach,
3. checks run and their result,
4. UI evidence for rendered changes,
5. security or privacy implications,
6. known limitations,
7. documentation and ADR updates.

## Code guidelines

- Preserve the deterministic offline path.
- Keep DOM concerns out of `src/core`.
- Route every deterministic surface through `src/core/pipeline.js`.
- Keep compilation separate from execution and provider calls behind `server.js`.
- Keep the HTTP bridge loopback-only and do not add permissive CORS.
- Do not persist secrets.
- Prefer stable issue IDs and semantic checks.
- Do not add generic prompt wording without a defined failure mode.
- Do not claim model-backed output is improved without comparative evaluation.
- Keep user-visible claims synchronized with implemented behavior.

## Dependencies

Prompteur currently has no runtime dependencies. A proposed dependency must solve a concrete capability gap and include:

- maintenance and security assessment,
- size and runtime impact,
- alternatives considered,
- tests,
- an ADR.

Development-only adapters should remain optional whenever possible.

## Security reports

Do not open public issues for exploitable vulnerabilities or exposed credentials. Follow `SECURITY.md`.

## Conduct

Be specific, evidence-led, and respectful. Critique behaviors and tradeoffs rather than contributors. Generated contributions are welcome only when the author has reviewed, tested, and can explain them.
