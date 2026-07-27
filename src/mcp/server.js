import { createInterface } from 'node:readline';
import {
  compileRequest,
  getCompilerCapabilities,
  PromptInputError,
} from '../core/pipeline.js';
import { PROMPTEUR_VERSION } from '../core/version.js';

export const MCP_PROTOCOL_VERSION = '2025-11-25';
export const SUPPORTED_MCP_PROTOCOL_VERSIONS = Object.freeze([
  '2025-11-25',
  '2025-06-18',
  '2025-03-26',
  '2024-11-05',
]);
export const MAX_MCP_MESSAGE_BYTES = 256_000;

const JSON_SCHEMA_DIALECT = 'https://json-schema.org/draft/2020-12/schema';
const TOOL_ANNOTATIONS = Object.freeze({
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
});

function catalogIds(entries) {
  return entries.map((entry) => entry.id);
}

const capabilities = getCompilerCapabilities();

const COMPILER_ARGUMENT_SCHEMA = Object.freeze({
  $schema: JSON_SCHEMA_DIALECT,
  type: 'object',
  additionalProperties: false,
  properties: {
    input: {
      type: 'string',
      minLength: 1,
      maxLength: capabilities.maxPromptCharacters,
      description: 'The human instruction or intent to compile.',
    },
    target: {
      type: 'string',
      enum: catalogIds(capabilities.targets),
      default: 'general',
      description: 'The target environment receiving the compiled task contract.',
    },
    persona: {
      type: 'string',
      enum: catalogIds(capabilities.personas),
      default: 'none',
      description: 'Optional task-relevant role guidance. Prefer none unless a role materially helps.',
    },
    tone: {
      type: 'string',
      enum: catalogIds(capabilities.tones),
      default: 'neutral',
      description: 'The requested communication tone.',
    },
    outputFormat: {
      type: 'string',
      enum: catalogIds(capabilities.outputFormats),
      default: 'auto',
      description: 'The expected output format or automatic inference.',
    },
    audience: {
      type: 'string',
      maxLength: 4_000,
      description: 'Optional intended audience for the result.',
    },
    deliverable: {
      type: 'string',
      maxLength: 4_000,
      description: 'Optional explicit deliverable or output-contract override.',
    },
    verify: {
      type: 'boolean',
      default: true,
      description: 'Whether to include a lightweight verification contract.',
    },
  },
  required: ['input'],
});

const PIPELINE_OUTPUT_SCHEMA = Object.freeze({
  $schema: JSON_SCHEMA_DIALECT,
  type: 'object',
  additionalProperties: false,
  properties: {
    schemaVersion: { type: 'string' },
    engine: { type: 'object' },
    prompt: { type: 'string' },
    ir: { type: 'object' },
    analysis: { type: 'object' },
    provenance: { type: 'object' },
  },
  required: ['schemaVersion', 'engine', 'prompt', 'ir', 'analysis', 'provenance'],
});

const ANALYSIS_OUTPUT_SCHEMA = Object.freeze({
  $schema: JSON_SCHEMA_DIALECT,
  type: 'object',
  additionalProperties: false,
  properties: {
    schemaVersion: { type: 'string' },
    engine: { type: 'object' },
    ir: { type: 'object' },
    analysis: { type: 'object' },
    provenance: { type: 'object' },
  },
  required: ['schemaVersion', 'engine', 'ir', 'analysis', 'provenance'],
});

const CAPABILITIES_OUTPUT_SCHEMA = Object.freeze({
  $schema: JSON_SCHEMA_DIALECT,
  type: 'object',
  properties: {
    service: { type: 'string' },
    version: { type: 'string' },
    schemaVersion: { type: 'string' },
    localOnly: { type: 'boolean' },
    deterministic: { type: 'boolean' },
    maxPromptCharacters: { type: 'integer' },
    targets: { type: 'array' },
    personas: { type: 'array' },
    tones: { type: 'array' },
    outputFormats: { type: 'array' },
    surfaces: { type: 'array' },
  },
  required: [
    'service',
    'version',
    'schemaVersion',
    'localOnly',
    'deterministic',
    'maxPromptCharacters',
    'targets',
    'personas',
    'tones',
    'outputFormats',
    'surfaces',
  ],
});

export const MCP_TOOLS = Object.freeze([
  Object.freeze({
    name: 'compile_intent',
    title: 'Compile intent',
    description: 'Compile rough human intent into a deterministic, target-aware task contract with Prompt IR, diagnostics, readiness dimensions, and provenance. This tool does not execute the task or call a model.',
    inputSchema: COMPILER_ARGUMENT_SCHEMA,
    outputSchema: PIPELINE_OUTPUT_SCHEMA,
    annotations: TOOL_ANNOTATIONS,
  }),
  Object.freeze({
    name: 'analyze_intent',
    title: 'Analyze intent',
    description: 'Inspect an instruction for ambiguity, missing context, output-contract gaps, conflicts, and instruction-boundary risk without returning the rendered task contract.',
    inputSchema: COMPILER_ARGUMENT_SCHEMA,
    outputSchema: ANALYSIS_OUTPUT_SCHEMA,
    annotations: TOOL_ANNOTATIONS,
  }),
  Object.freeze({
    name: 'get_compiler_capabilities',
    title: 'Get compiler capabilities',
    description: 'Return Prompteur version, limits, supported targets, personas, tones, output formats, and integration surfaces.',
    inputSchema: {
      $schema: JSON_SCHEMA_DIALECT,
      type: 'object',
      additionalProperties: false,
    },
    outputSchema: CAPABILITIES_OUTPUT_SCHEMA,
    annotations: TOOL_ANNOTATIONS,
  }),
]);

const TOOL_BY_NAME = new Map(MCP_TOOLS.map((tool) => [tool.name, tool]));
const COMPILER_ARGUMENT_KEYS = new Set([
  'input',
  'target',
  'persona',
  'tone',
  'outputFormat',
  'audience',
  'deliverable',
  'verify',
]);

export class McpProtocolError extends Error {
  constructor(code, message, data) {
    super(message);
    this.name = 'McpProtocolError';
    this.code = code;
    this.data = data;
  }
}

export function createMcpSession() {
  return {
    initializeSeen: false,
    initialized: false,
    protocolVersion: null,
    clientInfo: null,
  };
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateRequestId(id) {
  return typeof id === 'string' || (typeof id === 'number' && Number.isFinite(id));
}

function validateRequest(message) {
  if (!isObject(message) || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    throw new McpProtocolError(-32600, 'Invalid JSON-RPC request.');
  }
  if (Object.hasOwn(message, 'id') && !validateRequestId(message.id)) {
    throw new McpProtocolError(-32600, 'Request id must be a string or finite number.');
  }
  if (message.params !== undefined && !isObject(message.params)) {
    throw new McpProtocolError(-32602, 'Request params must be an object.');
  }
}

function chooseProtocolVersion(requested) {
  return SUPPORTED_MCP_PROTOCOL_VERSIONS.includes(requested)
    ? requested
    : MCP_PROTOCOL_VERSION;
}

function initializeResult(params, session) {
  if (!isObject(params) || typeof params.protocolVersion !== 'string') {
    throw new McpProtocolError(-32602, 'initialize requires a protocolVersion string.');
  }
  if (session.initializeSeen) {
    throw new McpProtocolError(-32600, 'The MCP session is already initialized.');
  }

  session.initializeSeen = true;
  session.protocolVersion = chooseProtocolVersion(params.protocolVersion);
  session.clientInfo = isObject(params.clientInfo) ? params.clientInfo : null;

  return {
    protocolVersion: session.protocolVersion,
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: 'prompteur',
      title: 'Prompteur intent compiler',
      version: PROMPTEUR_VERSION,
      description: 'Local deterministic intent compilation and diagnostics for AI models and agents.',
    },
    instructions: 'Use compile_intent when the user wants an executable task contract, analyze_intent when only diagnostics are needed, and get_compiler_capabilities for supported options. Every tool is deterministic, read-only, local, and separate from task execution.',
  };
}

function requireInitialized(session) {
  if (!session.initializeSeen) {
    throw new McpProtocolError(-32002, 'Prompteur MCP has not been initialized.');
  }
}

function validateArguments(value, allowedKeys, { allowEmpty = false } = {}) {
  const args = value === undefined ? {} : value;
  if (!isObject(args)) {
    throw new PromptInputError('Tool arguments must be an object.', 'INVALID_TOOL_ARGUMENTS');
  }
  const unknown = Object.keys(args).filter((key) => !allowedKeys.has(key));
  if (unknown.length > 0) {
    throw new PromptInputError(`Unknown tool argument${unknown.length === 1 ? '' : 's'}: ${unknown.join(', ')}.`, 'UNKNOWN_TOOL_ARGUMENTS');
  }
  if (!allowEmpty && !Object.hasOwn(args, 'input')) {
    throw new PromptInputError('input is required.', 'EMPTY_INPUT');
  }
  return args;
}

function compilerOptionsFromArguments(args) {
  const { input: _input, ...options } = args;
  return options;
}

function textContent(text) {
  return [{ type: 'text', text }];
}

function successToolResult(text, structuredContent) {
  return {
    content: textContent(text),
    structuredContent,
    isError: false,
  };
}

function toolExecutionError(error) {
  const code = typeof error?.code === 'string' ? error.code : 'TOOL_EXECUTION_ERROR';
  const message = error instanceof Error ? error.message : 'Tool execution failed.';
  return {
    content: textContent(`${code}: ${message}`),
    isError: true,
  };
}

function compileIntent(argumentsValue) {
  const args = validateArguments(argumentsValue, COMPILER_ARGUMENT_KEYS);
  const result = compileRequest(args.input, compilerOptionsFromArguments(args));
  return successToolResult(result.prompt, result);
}

function analyzeIntent(argumentsValue) {
  const args = validateArguments(argumentsValue, COMPILER_ARGUMENT_KEYS);
  const result = compileRequest(args.input, compilerOptionsFromArguments(args));
  const structuredContent = {
    schemaVersion: result.schemaVersion,
    engine: result.engine,
    ir: result.ir,
    analysis: result.analysis,
    provenance: result.provenance,
  };
  const text = JSON.stringify({
    readiness: result.analysis.readiness,
    dimensions: result.analysis.dimensions,
    summary: result.analysis.summary,
    issues: result.analysis.issues,
  }, null, 2);
  return successToolResult(text, structuredContent);
}

function compilerCapabilities(argumentsValue) {
  validateArguments(argumentsValue, new Set(), { allowEmpty: true });
  const structuredContent = getCompilerCapabilities();
  return successToolResult(JSON.stringify(structuredContent, null, 2), structuredContent);
}

function callTool(params) {
  if (!isObject(params) || typeof params.name !== 'string') {
    throw new McpProtocolError(-32602, 'tools/call requires a tool name.');
  }
  if (!TOOL_BY_NAME.has(params.name)) {
    throw new McpProtocolError(-32602, `Unknown tool: ${params.name}`);
  }

  try {
    if (params.name === 'compile_intent') return compileIntent(params.arguments);
    if (params.name === 'analyze_intent') return analyzeIntent(params.arguments);
    return compilerCapabilities(params.arguments);
  } catch (error) {
    if (error instanceof PromptInputError) return toolExecutionError(error);
    throw error;
  }
}

function requestResult(message, session) {
  if (message.method === 'initialize') return initializeResult(message.params, session);
  if (message.method === 'ping') return {};

  requireInitialized(session);

  if (message.method === 'tools/list') {
    if (message.params?.cursor !== undefined && typeof message.params.cursor !== 'string') {
      throw new McpProtocolError(-32602, 'tools/list cursor must be a string.');
    }
    return { tools: MCP_TOOLS };
  }
  if (message.method === 'tools/call') return callTool(message.params);

  throw new McpProtocolError(-32601, `Method not found: ${message.method}`);
}

function handleNotification(message, session) {
  if (message.method === 'notifications/initialized') {
    if (session.initializeSeen) session.initialized = true;
    return;
  }
  if (message.method === 'notifications/cancelled') return;
}

function errorResponse(id, error) {
  const protocolError = error instanceof McpProtocolError;
  const payload = {
    jsonrpc: '2.0',
    id: validateRequestId(id) ? id : null,
    error: {
      code: protocolError ? error.code : -32603,
      message: protocolError ? error.message : 'Internal error.',
    },
  };
  if (error?.data !== undefined) payload.error.data = error.data;
  return payload;
}

export async function handleMcpMessage(message, session = createMcpSession()) {
  try {
    validateRequest(message);
    if (!Object.hasOwn(message, 'id')) {
      handleNotification(message, session);
      return null;
    }
    return {
      jsonrpc: '2.0',
      id: message.id,
      result: await requestResult(message, session),
    };
  } catch (error) {
    return errorResponse(message?.id, error);
  }
}

function writeMessage(output, message) {
  output.write(`${JSON.stringify(message)}\n`);
}

export async function runStdioServer({
  input = process.stdin,
  output = process.stdout,
  errorOutput = process.stderr,
  debug = process.env.PROMPTEUR_MCP_DEBUG === '1',
} = {}) {
  const session = createMcpSession();
  const lines = createInterface({ input, crlfDelay: Infinity, terminal: false });

  for await (const line of lines) {
    if (!line.trim()) continue;
    if (Buffer.byteLength(line, 'utf8') > MAX_MCP_MESSAGE_BYTES) {
      writeMessage(output, errorResponse(null, new McpProtocolError(-32600, `MCP message exceeds ${MAX_MCP_MESSAGE_BYTES.toLocaleString()} bytes.`)));
      continue;
    }

    let message;
    try {
      message = JSON.parse(line);
    } catch {
      writeMessage(output, errorResponse(null, new McpProtocolError(-32700, 'Invalid JSON.')));
      continue;
    }

    const response = await handleMcpMessage(message, session);
    if (response) writeMessage(output, response);
    if (debug) errorOutput.write(`[prompteur-mcp] ${message.method}\n`);
  }
}
