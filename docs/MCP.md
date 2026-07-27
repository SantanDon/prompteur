# Prompteur MCP server

Prompteur includes a local, dependency-free Model Context Protocol server so MCP-capable agents can compile and inspect intent without opening the browser or using the clipboard.

## What it exposes

The stdio server exposes three read-only tools:

| Tool | Purpose |
| --- | --- |
| `compile_intent` | Return the rendered task contract plus the complete versioned pipeline result. |
| `analyze_intent` | Return Prompt IR, diagnostics, readiness dimensions, and provenance without the rendered contract. |
| `get_compiler_capabilities` | Return limits, supported targets, personas, tones, output formats, and surfaces. |

Every tool calls the same deterministic `compileRequest` pipeline used by the browser, CLI, HTTP bridge, and evaluation runner.

The server does **not**:

- read files or repositories,
- execute commands,
- call Ollama, Gemini, or another model,
- access the network,
- persist prompts,
- request credentials,
- mutate local or remote state.

## Run directly

From the repository:

```bash
node bin/prompteur-mcp.js
```

The process communicates over stdin/stdout and is normally launched by an MCP client rather than run interactively.

Create a reusable command:

```bash
npm link
prompteur-mcp
```

## Generic client configuration

After `npm link`:

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

Without `npm link`, point the client at Node and the absolute entrypoint path:

```json
{
  "mcpServers": {
    "prompteur": {
      "command": "node",
      "args": [
        "C:\path\to\prompteur\bin\prompteur-mcp.js"
      ]
    }
  }
}
```

Client configuration locations and field names vary. Use the client's local stdio MCP settings and keep the command local.

## Example tool input

```json
{
  "input": "Review this repository. Preserve the public API and verify the result.",
  "target": "agent",
  "persona": "software",
  "tone": "direct",
  "outputFormat": "code",
  "verify": true
}
```

Compiler arguments are flat for MCP ergonomics and map directly to pipeline options. Unknown arguments, unsupported catalog choices, oversized inputs, and invalid types are rejected with stable, model-visible tool errors.

## Result behavior

Successful tool calls return:

- a text content block for broad client compatibility,
- `structuredContent` for typed clients,
- `isError: false`.

`compile_intent` places the compiled contract in the text block and the complete pipeline result in `structuredContent`.

Invalid compiler input is returned as a tool execution error with `isError: true`, allowing the calling model to correct its arguments. Unknown tools and unsupported protocol methods remain JSON-RPC protocol errors.

## Protocol support

- Transport: newline-delimited UTF-8 stdio.
- Current protocol revision: `2025-11-25`.
- Compatible earlier revisions: `2025-06-18`, `2025-03-26`, and `2024-11-05`.
- Server capability: tools only.
- Tool list: static; no list-change notifications.
- Maximum MCP message line: 256,000 bytes.
- Maximum normalized intent: 80,000 characters.

The server writes only valid MCP messages to stdout. Optional diagnostic logging is sent to stderr when `PROMPTEUR_MCP_DEBUG=1`.

## Security boundary

The client launches Prompteur as a child process. There is no listening port and no browser-accessible endpoint. All tools are annotated as read-only, non-destructive, idempotent, and closed-world.

MCP tool annotations are advisory metadata. The actual safety boundary is enforced in code: the server imports only the deterministic pipeline and exposes no file, process, provider, or network operation.

## Verification

The repository tests:

- protocol negotiation,
- tool listing and schemas,
- compile and analyze results,
- tool-execution errors,
- unknown tools and methods,
- initialization requirements,
- parse-error recovery,
- a complete stdio subprocess session,
- stdout purity.

Release verification also connects through the official MCP TypeScript client and calls all three tools.
