
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compileRequest,
  getCompilerCapabilities,
  normalizeCompilerOptions,
  PromptInputError,
} from '../src/core/pipeline.js';

test('compileRequest returns one stable result contract for every product surface', () => {
  const result = compileRequest(
    'Review this repository. It must preserve the public API. Return complete code and verify it works.',
    { target: 'agent', persona: 'software', tone: 'direct', outputFormat: 'code' },
  );

  assert.equal(result.schemaVersion, '1.0');
  assert.equal(result.engine.name, 'prompteur');
  assert.equal(result.engine.version, '0.3.1');
  assert.equal(result.ir.behavior.target, 'agent');
  assert.match(result.prompt, /Inspect the available context and tools/);
  assert.ok(result.analysis.readiness > 0);
  assert.equal(result.provenance.target, 'agent');
});

test('pipeline rejects empty input, unknown options, and unsupported catalog choices', () => {
  assert.throws(() => compileRequest('   '), (error) => error instanceof PromptInputError && error.code === 'EMPTY_INPUT');
  assert.throws(() => compileRequest('Do the work.', { surprise: true }), /Unknown compiler option/);
  assert.throws(() => normalizeCompilerOptions({ target: 'telepathy' }), /Unsupported target/);
  assert.throws(() => normalizeCompilerOptions({ verify: 'false' }), /verify must be true or false/);
});

test('capabilities expose integration-safe catalogs without persona prompt internals', () => {
  const capabilities = getCompilerCapabilities();
  assert.equal(capabilities.localOnly, true);
  assert.ok(capabilities.targets.some((target) => target.id === 'agent'));
  assert.ok(capabilities.surfaces.some((surface) => surface.id === 'cli' && surface.status === 'available'));
  assert.ok(capabilities.personas.every((persona) => !('role' in persona) && !('guidance' in persona)));
});
