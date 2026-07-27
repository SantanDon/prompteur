import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createMcpSession,
  handleMcpMessage,
  MCP_PROTOCOL_VERSION,
  MCP_TOOLS,
  SUPPORTED_MCP_PROTOCOL_VERSIONS,
} from '../src/mcp/server.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entrypoint = path.join(root, 'bin', 'prompteur-mcp.js');

function request(id, method, params) {
  return { jsonrpc: '2.0', id, method, ...(params === undefined ? {} : { params }) };
}

async function initialize(session, version = MCP_PROTOCOL_VERSION) {
  return handleMcpMessage(request(1, 'initialize', {
    protocolVersion: version,
    capabilities: {},
    clientInfo: { name: 'prompteur-test', version: '1.0.0' },
  }), session);
}

test('MCP server negotiates stable protocol versions and exposes tools only', async () => {
  const session = createMcpSession();
  const response = await initialize(session, '2025-06-18');

  assert.equal(response.result.protocolVersion, '2025-06-18');
  assert.deepEqual(response.result.capabilities, { tools: {} });
  assert.equal(response.result.serverInfo.name, 'prompteur');
  assert.match(response.result.instructions, /deterministic, read-only, local/);
  assert.equal(session.initializeSeen, true);
  assert.equal(session.clientInfo.name, 'prompteur-test');

  const fallback = await initialize(createMcpSession(), '2099-01-01');
  assert.equal(fallback.result.protocolVersion, MCP_PROTOCOL_VERSION);
  assert.ok(SUPPORTED_MCP_PROTOCOL_VERSIONS.includes(MCP_PROTOCOL_VERSION));
});

test('tools/list returns three immutable read-only tools with strict schemas', async () => {
  const session = createMcpSession();
  await initialize(session);
  const response = await handleMcpMessage(request(2, 'tools/list', {}), session);

  assert.equal(response.result.tools.length, 3);
  assert.deepEqual(response.result.tools.map((tool) => tool.name), [
    'compile_intent',
    'analyze_intent',
    'get_compiler_capabilities',
  ]);
  assert.ok(MCP_TOOLS.every((tool) => tool.annotations.readOnlyHint === true));
  assert.ok(MCP_TOOLS.every((tool) => tool.annotations.destructiveHint === false));
  assert.ok(MCP_TOOLS.every((tool) => tool.annotations.openWorldHint === false));
  assert.equal(response.result.tools[0].inputSchema.additionalProperties, false);
  assert.ok(response.result.tools[0].inputSchema.required.includes('input'));
});

test('compile_intent returns the compiled contract as text and full structured content', async () => {
  const session = createMcpSession();
  await initialize(session);
  const response = await handleMcpMessage(request(3, 'tools/call', {
    name: 'compile_intent',
    arguments: {
      input: 'Review this repository. Preserve the public API and verify the result.',
      target: 'agent',
      persona: 'software',
      outputFormat: 'code',
    },
  }), session);

  assert.equal(response.result.isError, false);
  assert.match(response.result.content[0].text, /## Objective/);
  assert.match(response.result.content[0].text, /Inspect the available context and tools/);
  assert.equal(response.result.structuredContent.ir.behavior.target, 'agent');
  assert.equal(response.result.structuredContent.engine.mode, 'deterministic');
  assert.ok(response.result.structuredContent.analysis.readiness > 0);
});

test('analyze_intent omits the rendered prompt while preserving diagnostics and provenance', async () => {
  const session = createMcpSession();
  await initialize(session);
  const response = await handleMcpMessage(request(4, 'tools/call', {
    name: 'analyze_intent',
    arguments: { input: 'Fix this' },
  }), session);

  assert.equal(response.result.isError, false);
  assert.equal('prompt' in response.result.structuredContent, false);
  assert.ok(response.result.structuredContent.analysis.issues.length > 0);
  assert.equal(response.result.structuredContent.provenance.target, 'general');
  const text = JSON.parse(response.result.content[0].text);
  assert.ok(text.issues.some((issue) => issue.id === 'underspecified-objective'));
});

test('invalid tool input is a visible tool execution error that agents can correct', async () => {
  const session = createMcpSession();
  await initialize(session);
  const missing = await handleMcpMessage(request(5, 'tools/call', {
    name: 'compile_intent',
    arguments: { target: 'agent' },
  }), session);
  assert.equal(missing.result.isError, true);
  assert.match(missing.result.content[0].text, /^EMPTY_INPUT:/);
  assert.equal('error' in missing, false);

  const unknownArgument = await handleMcpMessage(request(6, 'tools/call', {
    name: 'compile_intent',
    arguments: { input: 'Compile this.', execute: true },
  }), session);
  assert.equal(unknownArgument.result.isError, true);
  assert.match(unknownArgument.result.content[0].text, /^UNKNOWN_TOOL_ARGUMENTS:/);
});

test('protocol misuse returns JSON-RPC errors without exposing tools before initialization', async () => {
  const uninitialized = await handleMcpMessage(request(7, 'tools/list', {}), createMcpSession());
  assert.equal(uninitialized.error.code, -32002);

  const session = createMcpSession();
  await initialize(session);
  const unknownTool = await handleMcpMessage(request(8, 'tools/call', {
    name: 'delete_everything',
    arguments: {},
  }), session);
  assert.equal(unknownTool.error.code, -32602);
  assert.match(unknownTool.error.message, /Unknown tool/);

  const unknownMethod = await handleMcpMessage(request(9, 'files/read', {}), session);
  assert.equal(unknownMethod.error.code, -32601);
});

test('stdio entrypoint completes a full client session using JSON lines only', () => {
  const messages = [
    request(1, 'initialize', {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'stdio-test', version: '1.0.0' },
    }),
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    request(2, 'tools/list', {}),
    request(3, 'tools/call', {
      name: 'get_compiler_capabilities',
      arguments: {},
    }),
    request(4, 'tools/call', {
      name: 'compile_intent',
      arguments: { input: 'Research current prompt evaluation methods.', target: 'research' },
    }),
    request(5, 'ping', {}),
  ];

  const result = spawnSync(process.execPath, [entrypoint], {
    cwd: root,
    encoding: 'utf8',
    input: `${messages.map((message) => JSON.stringify(message)).join('\n')}\n`,
    timeout: 10_000,
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  const lines = result.stdout.trim().split('\n');
  assert.equal(lines.length, 5, result.stdout);
  const responses = lines.map((line) => JSON.parse(line));
  assert.deepEqual(responses.map((response) => response.id), [1, 2, 3, 4, 5]);
  assert.equal(responses[0].result.protocolVersion, MCP_PROTOCOL_VERSION);
  assert.equal(responses[1].result.tools.length, 3);
  assert.equal(responses[2].result.structuredContent.surfaces.find((surface) => surface.id === 'mcp').status, 'available');
  assert.equal(responses[3].result.structuredContent.ir.behavior.target, 'research');
  assert.deepEqual(responses[4].result, {});
});

test('stdio entrypoint returns parse errors and continues processing later messages', () => {
  const valid = request(1, 'initialize', {
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: 'recovery-test', version: '1.0.0' },
  });
  const result = spawnSync(process.execPath, [entrypoint], {
    cwd: root,
    encoding: 'utf8',
    input: `{not json}\n${JSON.stringify(valid)}\n`,
    timeout: 10_000,
  });

  assert.equal(result.status, 0, result.stderr);
  const responses = result.stdout.trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(responses[0].error.code, -32700);
  assert.equal(responses[1].result.serverInfo.name, 'prompteur');
});


test('MCP entrypoint works when launched through a package-style symlink', () => {
  const temporary = path.join(root, '.tmp-mcp-symlink-test');
  const symlink = path.join(temporary, 'prompteur-mcp.js');
  rmSync(temporary, { recursive: true, force: true });
  mkdirSync(temporary, { recursive: true });
  symlinkSync(entrypoint, symlink);

  try {
    const initializeMessage = request(1, 'initialize', {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'symlink-test', version: '1.0.0' },
    });
    const result = spawnSync(process.execPath, [symlink], {
      cwd: root,
      encoding: 'utf8',
      input: `${JSON.stringify(initializeMessage)}\n`,
      timeout: 10_000,
    });
    assert.equal(result.status, 0, result.stderr);
    const response = JSON.parse(result.stdout.trim());
    assert.equal(response.result.serverInfo.name, 'prompteur');
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
