
# Integrations

Prompteur 0.3 introduces the first **Zero Copy-Paste** integration surfaces. The browser workbench, CLI, HTTP bridge, and deterministic evaluation runner share one compilation pipeline in `src/core/pipeline.js`.

## CLI

Run without installing dependencies:

```bash
node bin/prompteur.js --target agent "Review this repository and fix the failing tests."
```

Create a reusable `prompteur` command from the repository:

```bash
npm link
prompteur --version
```

### Compile text

```bash
prompteur compile --target agent "Improve authentication and verify the changed behavior."
```

The compiled prompt is written to standard output, so it can be redirected or piped instead of copied manually:

```bash
prompteur compile --file user_task.md --target agent > compiled-task.md
cat user_task.md | prompteur --target agent
```

An agent or script can request the complete result contract:

```bash
prompteur compile --target research --json "Compare local AI evaluation tools."
```

Diagnostics can be used independently:

```bash
prompteur analyze "Fix this"
```

Run `prompteur --help` for all options.

## MCP server

Prompteur exposes the shared pipeline to local agents through a read-only stdio MCP server.

```bash
npm link
```

Generic client configuration:

```json
{
  "mcpServers": {
    "prompteur": {
      "command": "prompteur-mcp",
      "args": []
    }
  }
}
```

The server exposes `compile_intent`, `analyze_intent`, and `get_compiler_capabilities`. It does not read files, execute commands, call providers, access the network, persist prompts, or mutate state.

See [`MCP.md`](MCP.md) for protocol support, direct-path configuration, tool behavior, and security details.

## Local HTTP bridge

Start the local service:

```bash
npm start
```

The deterministic bridge is available at `http://127.0.0.1:3030`.

### Compile

```bash
curl -s http://127.0.0.1:3030/api/compile \
  -H "Content-Type: application/json" \
  -d '{"input":"Review this repository and fix the failing tests.","options":{"target":"agent","outputFormat":"code"}}'
```

PowerShell:

```powershell
$body = @{
  input = 'Review this repository and fix the failing tests.'
  options = @{ target = 'agent'; outputFormat = 'code' }
} | ConvertTo-Json

Invoke-RestMethod \
  -Uri 'http://127.0.0.1:3030/api/compile' \
  -Method Post \
  -ContentType 'application/json' \
  -Body $body
```

### Discover capabilities

```bash
curl -s http://127.0.0.1:3030/api/capabilities
```

The OpenAPI document is served at:

```text
http://127.0.0.1:3030/openapi.json
```

## JavaScript API

The package root exports the deterministic pipeline:

```js
import { compileRequest } from 'prompteur';

const result = compileRequest('Investigate the failing tests.', {
  target: 'agent',
  tone: 'direct',
  outputFormat: 'code',
});

console.log(result.prompt);
```

## Security boundary

- The HTTP API accepts loopback clients only, even when the server host is overridden.
- The bridge intentionally sends no CORS headers. Browser extensions will use a future authenticated bridge design rather than opening the service to arbitrary web pages.
- Deterministic compilation requires no provider credentials.
- Gemini and Ollama remain optional candidate-generation providers and are separate from `/api/compile`.
- Input is limited to 80,000 normalized characters and all compiler options are validated.

## Next integration surfaces

The shared pipeline and local bridge are prerequisites for:

1. a browser extension with compile-before-send,
2. IDE actions and repository-aware handoffs,
3. direct execution adapters with explicit permissions,
4. comparative evaluation and automatic correction.
