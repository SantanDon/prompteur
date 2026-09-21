import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createPairedEvaluationRecord } from '../evaluations/paired.js';
import { createOllamaExecutor, executePairedEvaluationRecord } from '../evaluations/execution.js';

const HELP = `Usage: node scripts/paired-execute.js --case <id> --model <ollama-model> --output <path> [options]

Options:
  --host <url>                 Ollama loopback URL
  --candidate-profile <id>     Include an explicit candidate profile arm
  --arms <csv>                 raw,baseline,candidate (default all existing arms)
  --timeout-ms <number>        Provider timeout, 1000-300000
  --overwrite                  Allow replacing an existing result file
  --help                       Show this message

This command records downstream outputs and operational metrics only. It does not grade task quality or label a prompt improved.`;

function parseArgs(argv) {
  const result = { host: ['http:', '', '127.0.0.1:11434'].join('/'), timeoutMs: 90_000, overwrite: false, arms: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help') return { help: true };
    if (arg === '--overwrite') { result.overwrite = true; continue; }
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}.`);
    i += 1;
    if (arg === '--case') result.caseId = value;
    else if (arg === '--model') result.model = value;
    else if (arg === '--output') result.output = value;
    else if (arg === '--host') result.host = value;
    else if (arg === '--candidate-profile') result.candidateProfile = value;
    else if (arg === '--timeout-ms') result.timeoutMs = Number(value);
    else if (arg === '--arms') result.arms = value.split(',').map((item) => item.trim()).filter(Boolean);
    else throw new Error(`Unknown option: ${arg}`);
  }
  return result;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(HELP);
    return;
  }
  if (!options.caseId || !options.model || !options.output) {
    throw new Error('Required options: --case, --model, and --output. Use --help for details.');
  }

  const target = path.resolve(options.output);
  if (!options.overwrite) {
    try {
      await access(target);
      const error = new Error('Output file already exists. Use --overwrite to replace it explicitly.');
      error.code = 'OUTPUT_EXISTS';
      throw error;
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }

  const cases = JSON.parse(await readFile(new URL('../evaluations/cases.json', import.meta.url), 'utf8'));
  const testCase = cases.find((item) => item.id === options.caseId);
  if (!testCase) throw new Error(`Unknown evaluation case: ${options.caseId}`);

  const candidateOptions = options.candidateProfile ? { profile: options.candidateProfile } : null;
  const record = createPairedEvaluationRecord(testCase, {
    recordedAt: new Date().toISOString(),
    candidateOptions,
  });
  const executor = createOllamaExecutor({ host: options.host, model: options.model, timeoutMs: options.timeoutMs });
  const executed = await executePairedEvaluationRecord(record, {
    executor,
    arms: options.arms,
    executorName: 'ollama',
    modelName: options.model,
  });

  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(executed, null, 2)}\n`, { flag: options.overwrite ? 'w' : 'wx' });
  console.log(`Wrote paired execution record: ${target}`);
  if (executed.evidenceBoundary.downstreamExecution !== 'completed') process.exitCode = 2;
}

main().catch((error) => {
  if (error?.code === 'EEXIST') {
    console.error('Paired execution refused to overwrite the existing output file. Use --overwrite to replace it explicitly.');
  } else {
    console.error(`Paired execution failed: ${error?.message || error}`);
  }
  process.exitCode = 1;
});
