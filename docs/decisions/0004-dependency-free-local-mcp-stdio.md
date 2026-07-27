# ADR 0004: Dependency-free local MCP stdio adapter

Date: 2026-07-27
Status: accepted

## Context

Prompteur's browser, CLI, JavaScript API, loopback HTTP bridge, and evaluation runner already share one deterministic pipeline. The remaining high-friction gap was direct access from MCP-capable agents: users still needed a shell wrapper, custom integration, or clipboard handoff.

MCP offers local stdio and network-accessible HTTP transports. Prompteur requires no remote access for compilation, and its dependency policy rejects runtime packages without a demonstrated capability gap.

## Decision

Prompteur implements a local stdio MCP server using Node built-ins and the current stable MCP protocol revision.

The server:

- uses newline-delimited JSON-RPC over stdin/stdout,
- negotiates stable protocol revisions through initialization,
- declares only the `tools` server capability,
- exposes `compile_intent`, `analyze_intent`, and `get_compiler_capabilities`,
- returns text plus structured content,
- annotates every tool as read-only, non-destructive, idempotent, and closed-world,
- maps invalid compiler input to tool execution errors,
- maps unknown tools and methods to protocol errors,
- limits individual message lines,
- writes no non-protocol output to stdout,
- calls only `compileRequest` and `getCompilerCapabilities`.

The adapter supports protocol revisions `2025-11-25`, `2025-06-18`, `2025-03-26`, and `2024-11-05`, preferring the current stable revision when the client's requested version is unsupported.

## Why stdio

- The MCP client spawns the server locally.
- No listening socket, Origin policy, OAuth flow, or remote attack surface is required.
- Prompt data stays inside the local process boundary.
- The transport matches coding-agent and desktop-client integration patterns.

Prompteur will not add Streamable HTTP MCP merely to make the server remotely reachable. That would require authentication, Origin validation, deployment design, and a separate threat model.

## Why no runtime MCP SDK

The implemented surface is deliberately small: lifecycle initialization, ping, static tool discovery, tool calls, and notifications that require no response. A runtime SDK would add supply-chain and upgrade cost without currently closing a capability gap.

This decision must be revisited if Prompteur adds dynamic tools, resources, prompts, sampling, elicitation, tasks, Streamable HTTP, or more complex protocol features.

Interoperability is verified against the official MCP TypeScript client outside the runtime dependency graph.

## Consequences

### Positive

- Agents can invoke Prompteur directly without clipboard handoff.
- Every integration still uses the same compiler and versioned result contract.
- The local core remains dependency-free.
- Execution, file access, providers, and networking remain outside the MCP boundary.
- Tool errors are visible to models and can be self-corrected.

### Tradeoffs

- Prompteur owns a small protocol implementation and must track stable MCP revisions.
- Advanced MCP capabilities are intentionally unavailable.
- Client installation still requires a local command/path configuration.
- A future protocol expansion may justify adopting the official SDK.
