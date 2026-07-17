# Security policy

## Supported version

The latest commit on `main` is the supported development version while Prompteur is pre-1.0.

## Reporting a vulnerability

Please use GitHub private vulnerability reporting when it is enabled for the repository. Do not include API keys, personal prompts, private model output, or exploit details in a public issue.

A useful report includes:

- affected commit or version,
- reproduction steps using non-sensitive data,
- expected and observed behavior,
- security impact,
- suggested mitigation when available.

## Security model

Prompteur is local-first, but local software still crosses important trust boundaries.

### Browser storage

Non-secret preferences may be stored in local storage. API keys must never be persisted there. Gemini keys entered in the UI remain in page memory for the current session only.

### Provider proxy

The Node server validates provider requests and limits request size. Ollama connections are restricted to localhost to avoid turning Prompteur into an arbitrary outbound proxy or exposing remote model servers accidentally.

### Static files

The server uses an explicit route allowlist. Repository files, configuration, executables, Git metadata, tests, and documentation are not served unless intentionally added to that allowlist.

### Untrusted prompt material

Pasted, attached, retrieved, and model-generated text is untrusted data. The compiler detects common instruction-override language and adds a boundary to compiled prompts. This is defense in depth, not a guarantee against every prompt-injection technique.

### Model output

Model-assisted rewrites are untrusted candidates. They must not automatically execute tools, modify repository files, publish prompts, or become accepted production versions.

## Maintainer requirements

- Never commit credentials or real private prompts.
- Keep security headers and static allowlisting covered by tests.
- Add an ADR before allowing remote provider hosts or persistent secrets.
- Avoid logging request bodies, keys, or provider responses.
- Keep error messages useful without exposing sensitive upstream details.
- Run a secret scan before releases.

## Known limitations

- A user-entered Gemini key is transmitted through the local Prompteur server to Google’s API for the requested operation.
- Browser extensions or a compromised local machine can observe page memory and network activity.
- Deterministic prompt-injection detection is heuristic and incomplete.
- Local rate limiting is not a substitute for production authentication or abuse prevention.
- Prompteur is not yet designed for multi-user internet deployment.
