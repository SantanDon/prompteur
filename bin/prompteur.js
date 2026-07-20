#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { compileRequest, getCompilerCapabilities, PromptInputError } from '../src/core/pipeline.js';
import { PROMPTEUR_VERSION } from '../src/core/version.js';

const COMMANDS = new Set(['compile', 'analyze', 'capabilities']);

const HELP = `Prompteur ${PROMPTEUR_VERSION} — local intent compiler

Usage:
  prompteur [compile] [options] <prompt>
  prompteur analyze [options] <prompt>
  prompteur capabilities

Input:
  Text arguments             Joined with spaces as the source prompt
  --file <path>              Read the source prompt from a UTF-8 file
  stdin                      Used when no text arguments or --file are supplied

Compiler options:
  --target <id>              general | agent | research | image
  --persona <id>             none | general | software | research | creative | security
  --tone <id>                neutral | direct | analytical | creative | formal
  --output-format <id>       auto | markdown | json | code | table | prose | image
  --audience <text>          Intended audience
  --deliverable <text>       Explicit output contract
  --no-verify                Omit the verification contract
  --verify                   Include the verification contract (default)

Result options:
  --json                     Return the complete pipeline result as JSON
  --help, -h                 Show this help
  --version, -v              Show the version

Examples:
  prompteur --target agent "Review this repository and fix the failing tests."
  prompteur compile --file user_task.md --target agent > compiled-task.md
  echo "Research local AI evaluation tools" | prompteur --target research
  prompteur analyze --json "Fix this"
`;

function nextValue(argv, index, flag) {
  const value = argv[index + 1];
  if (value == null || value.startsWith('--')) {
    throw new PromptInputError(`${flag} requires a value.`, 'MISSING_OPTION_VALUE');
  }
  return value;
}

function parseArguments(argv) {
  let command = 'compile';
  let index = 0;
  if (argv[0] && COMMANDS.has(argv[0])) {
    command = argv[0];
    index = 1;
  }

  const options = {};
  const inputParts = [];
  let file = '';
  let json = false;
  let help = false;
  let version = false;

  while (index < argv.length) {
    const arg = argv[index];
    if (arg === '--') {
      inputParts.push(...argv.slice(index + 1));
      break;
    }
    if (!arg.startsWith('-')) {
      inputParts.push(arg);
      index += 1;
      continue;
    }

    switch (arg) {
      case '--target':
        options.target = nextValue(argv, index, arg);
        index += 2;
        break;
      case '--persona':
        options.persona = nextValue(argv, index, arg);
        index += 2;
        break;
      case '--tone':
        options.tone = nextValue(argv, index, arg);
        index += 2;
        break;
      case '--output-format':
        options.outputFormat = nextValue(argv, index, arg);
        index += 2;
        break;
      case '--audience':
        options.audience = nextValue(argv, index, arg);
        index += 2;
        break;
      case '--deliverable':
        options.deliverable = nextValue(argv, index, arg);
        index += 2;
        break;
      case '--file':
        file = nextValue(argv, index, arg);
        index += 2;
        break;
      case '--verify':
        options.verify = true;
        index += 1;
        break;
      case '--no-verify':
        options.verify = false;
        index += 1;
        break;
      case '--json':
        json = true;
        index += 1;
        break;
      case '--help':
      case '-h':
        help = true;
        index += 1;
        break;
      case '--version':
      case '-v':
        version = true;
        index += 1;
        break;
      default:
        throw new PromptInputError(`Unknown option: ${arg}.`, 'UNKNOWN_CLI_OPTION');
    }
  }

  if (file && inputParts.length > 0) {
    throw new PromptInputError('Use either --file or text arguments, not both.', 'AMBIGUOUS_INPUT');
  }

  return { command, options, inputParts, file, json, help, version };
}

async function readStandardInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function resolveInput(parsed) {
  if (parsed.file) {
    if (parsed.file === '-') return readStandardInput();
    return readFile(parsed.file, 'utf8');
  }
  if (parsed.inputParts.length > 0) return parsed.inputParts.join(' ');
  if (!process.stdin.isTTY) return readStandardInput();
  throw new PromptInputError('Provide prompt text, --file <path>, or stdin.', 'MISSING_INPUT');
}

function formatAnalysis(result) {
  const lines = [
    `Readiness: ${result.analysis.readiness}/100`,
    result.analysis.summary,
  ];
  for (const issue of result.analysis.issues) {
    lines.push(`- [${issue.severity}] ${issue.title}: ${issue.suggestion}`);
  }
  return `${lines.join('\n')}\n`;
}

async function main() {
  const parsed = parseArguments(process.argv.slice(2));

  if (parsed.help) {
    process.stdout.write(HELP);
    return;
  }
  if (parsed.version) {
    process.stdout.write(`${PROMPTEUR_VERSION}\n`);
    return;
  }
  if (parsed.command === 'capabilities') {
    process.stdout.write(`${JSON.stringify(getCompilerCapabilities(), null, 2)}\n`);
    return;
  }

  const input = await resolveInput(parsed);
  const result = compileRequest(input, parsed.options);

  if (parsed.json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else if (parsed.command === 'analyze') {
    process.stdout.write(formatAnalysis(result));
  } else {
    process.stdout.write(`${result.prompt}\n`);
  }
}

main().catch((error) => {
  const message = error instanceof PromptInputError ? error.message : 'Prompteur failed safely.';
  process.stderr.write(`prompteur: ${message}\n`);
  process.exitCode = error instanceof PromptInputError ? 2 : 1;
});
