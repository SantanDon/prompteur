
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(root, 'bin', 'prompteur.js');

function run(args, options = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: 'utf8',
    ...options,
  });
}

test('CLI compiles a prompt for direct shell piping', () => {
  const result = run(['compile', '--target', 'agent', 'Fix the failing tests and verify the result.']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /## Objective/);
  assert.match(result.stdout, /## Execution method/);
  assert.equal(result.stderr, '');
});

test('CLI accepts stdin and returns the complete machine-readable result', () => {
  const result = run(['compile', '--target', 'research', '--json'], {
    input: 'Research current prompt evaluation methods and cite primary sources.',
  });
  assert.equal(result.status, 0, result.stderr);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.engine.version, '0.3.1');
  assert.equal(payload.ir.behavior.target, 'research');
  assert.match(payload.prompt, /Prefer primary and current sources/);
});

test('CLI reports invalid integrations with a non-zero exit code and no stack trace', () => {
  const result = run(['--target', 'unknown', 'Compile this request.']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Unsupported target/);
  assert.doesNotMatch(result.stderr, /\n\s+at /);
});
