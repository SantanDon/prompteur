
import { analyzePrompt } from './analyze.js';
import { OUTPUT_FORMATS, PERSONAS, TARGETS, TONES } from './catalog.js';
import { compilePrompt } from './compile.js';
import { buildPromptIR, normalizeText } from './normalize.js';
import { PIPELINE_SCHEMA_VERSION, PROMPTEUR_VERSION } from './version.js';

export const MAX_PROMPT_CHARACTERS = 80_000;

const OPTION_KEYS = new Set([
  'target',
  'persona',
  'tone',
  'outputFormat',
  'audience',
  'deliverable',
  'verify',
]);

export class PromptInputError extends Error {
  constructor(message, code = 'INVALID_INPUT') {
    super(message);
    this.name = 'PromptInputError';
    this.code = code;
    this.status = 400;
  }
}

function choice(value, fallback, catalog, name) {
  const normalized = value == null || value === '' ? fallback : String(value).trim();
  if (!Object.hasOwn(catalog, normalized)) {
    throw new PromptInputError(
      `Unsupported ${name} "${normalized}". Choose one of: ${Object.keys(catalog).join(', ')}.`,
      `INVALID_${name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`,
    );
  }
  return normalized;
}

function optionalText(value, name, maxLength = 4_000) {
  if (value == null) return '';
  if (typeof value !== 'string') {
    throw new PromptInputError(`${name} must be a string.`, `INVALID_${name.toUpperCase()}`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new PromptInputError(`${name} must be ${maxLength.toLocaleString()} characters or fewer.`, `${name.toUpperCase()}_TOO_LONG`);
  }
  return normalized;
}

export function normalizeCompilerOptions(options = {}) {
  if (options == null) options = {};
  if (typeof options !== 'object' || Array.isArray(options)) {
    throw new PromptInputError('Compiler options must be an object.', 'INVALID_OPTIONS');
  }

  const unknownKeys = Object.keys(options).filter((key) => !OPTION_KEYS.has(key));
  if (unknownKeys.length > 0) {
    throw new PromptInputError(`Unknown compiler option${unknownKeys.length === 1 ? '' : 's'}: ${unknownKeys.join(', ')}.`, 'UNKNOWN_OPTIONS');
  }

  if (options.verify !== undefined && typeof options.verify !== 'boolean') {
    throw new PromptInputError('verify must be true or false.', 'INVALID_VERIFY');
  }

  return {
    target: choice(options.target, 'general', TARGETS, 'target'),
    persona: choice(options.persona, 'none', PERSONAS, 'persona'),
    tone: choice(options.tone, 'neutral', TONES, 'tone'),
    outputFormat: choice(options.outputFormat, 'auto', OUTPUT_FORMATS, 'output format'),
    audience: optionalText(options.audience, 'audience'),
    deliverable: optionalText(options.deliverable, 'deliverable'),
    verify: options.verify !== false,
  };
}

export function compileRequest(input, options = {}) {
  if (typeof input !== 'string') {
    throw new PromptInputError('Prompt input must be a string.', 'INVALID_INPUT_TYPE');
  }

  const normalizedInput = normalizeText(input);
  if (!normalizedInput) {
    throw new PromptInputError('Prompt input is required.', 'EMPTY_INPUT');
  }
  if (normalizedInput.length > MAX_PROMPT_CHARACTERS) {
    throw new PromptInputError(
      `Prompt input must be ${MAX_PROMPT_CHARACTERS.toLocaleString()} characters or fewer.`,
      'INPUT_TOO_LONG',
    );
  }

  const normalizedOptions = normalizeCompilerOptions(options);
  const ir = buildPromptIR(normalizedInput, normalizedOptions);
  const analysis = analyzePrompt(ir);
  const prompt = compilePrompt(ir);

  return {
    schemaVersion: PIPELINE_SCHEMA_VERSION,
    engine: {
      name: 'prompteur',
      version: PROMPTEUR_VERSION,
      mode: 'deterministic',
    },
    prompt,
    ir,
    analysis,
    provenance: {
      generatedAt: ir.metadata.createdAt,
      sourceCharacters: ir.metadata.sourceLength,
      target: ir.behavior.target,
    },
  };
}

function catalogEntries(catalog) {
  return Object.entries(catalog).map(([id, value]) => ({ id, ...value }));
}

export function getCompilerCapabilities() {
  return {
    service: 'prompteur',
    version: PROMPTEUR_VERSION,
    schemaVersion: PIPELINE_SCHEMA_VERSION,
    localOnly: true,
    deterministic: true,
    maxPromptCharacters: MAX_PROMPT_CHARACTERS,
    targets: catalogEntries(TARGETS),
    personas: catalogEntries(PERSONAS).map(({ role: _role, guidance: _guidance, ...entry }) => entry),
    tones: Object.entries(TONES).map(([id, description]) => ({ id, description })),
    outputFormats: Object.entries(OUTPUT_FORMATS).map(([id, description]) => ({ id, description })),
    surfaces: [
      { id: 'browser', status: 'available' },
      { id: 'cli', status: 'available' },
      { id: 'http', status: 'available', baseUrl: 'http://127.0.0.1:3030' },
      { id: 'mcp', status: 'planned' },
      { id: 'browser-extension', status: 'planned' },
    ],
  };
}
