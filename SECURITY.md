# Security policy

## Supported version

The latest commit on `main` is the supported development version while Prompteur is pre-1.0.

## Reporting a security concern

Use GitHub private vulnerability reporting when it is enabled for the repository. Keep sensitive values, personal prompts, private model output, and detailed misuse instructions out of public issues.

A useful private report includes:

- affected commit or version,
- reproduction steps using non-sensitive data,
- expected and observed behavior,
- likely impact,
- a suggested mitigation when available.

## Security model

Prompteur is local-first, but local software still crosses important trust boundaries.

### Browser storage

Non-sensitive preferences may be stored locally. Provider access values entered in the interface remain in page memory for the current session and are not written to browser storage.

### Local compile bridge

`POST /api/compile` is deterministic and does not invoke a provider or execute commands. Every `/api/` route rejects non-loopback clients, even when `HOST` is configured to bind broadly. The server intentionally omits permissive cross-origin access headers, so unrelated web pages cannot call the bridge directly.

The bridge validates input length, supported catalog values, option types, and unknown option names. Browser extensions, MCP transports, remote access, and direct execution require separate threat models rather than weakening this boundary.

### Provider proxy

The Node server validates provider requests and limits request size. Ollama connections are restricted to localhost to avoid turning Prompteur into an unrestricted outbound proxy or exposing remote model servers accidentally.

### Static files

The server uses an explicit route allowlist. Repository files, configuration, executables, Git metadata, tests, and documentation are not served unless intentionally added to that allowlist.

### Untrusted prompt material

Pasted, attached, retrieved, and model-generated text is untrusted data. The compiler detects common instruction-override language and adds a boundary to compiled prompts. This is defense in depth, not a guarantee against every prompt-injection technique.

### Model output

Model-assisted rewrites are untrusted candidates. They must not automatically execute tools, modify repository files, publish prompts, or become accepted production versions.

## Maintainer requirements

- Keep sensitive values and real private prompts out of commits.
- Keep security headers and static allowlisting covered by tests.
- Add an ADR before allowing remote provider hosts or persistent sensitive values.
- Avoid logging request bodies, provider access values, or provider responses.
- Keep error messages useful without exposing sensitive upstream details.
- Run a sensitive-value scan before releases.

## Known limitations

- A user-entered Gemini access value is transmitted through the local Prompteur server to Google for the requested operation.
- Browser extensions or a compromised local machine can observe page memory and local network activity.
- Deterministic prompt-injection detection is heuristic and incomplete.
- Local rate limiting is not a substitute for production authentication or abuse prevention.
- Loopback-only access is not an authenticated multi-user deployment model.
- Prompteur is not yet designed for multi-user internet deployment.
