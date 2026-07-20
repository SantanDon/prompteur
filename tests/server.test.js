
import test from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from '../server.js';

async function withServer(run) {
  const server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('server exposes the app, versioned health, capabilities, and OpenAPI contract', async () => {
  await withServer(async (baseUrl) => {
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true, service: 'prompteur', version: '0.3.0' });

    const capabilities = await fetch(`${baseUrl}/api/capabilities`);
    assert.equal(capabilities.status, 200);
    const capabilityPayload = await capabilities.json();
    assert.equal(capabilityPayload.localOnly, true);
    assert.ok(capabilityPayload.targets.some((target) => target.id === 'agent'));

    const home = await fetch(`${baseUrl}/`);
    assert.equal(home.status, 200);
    const html = await home.text();
    assert.match(html, /Make prompts more precise/);
    assert.match(html, /href="\.\/style\.css"/);
    assert.match(html, /src="\.\/src\/bootstrap\.js"/);

    const bootstrap = await fetch(`${baseUrl}/src/bootstrap.js`);
    assert.equal(bootstrap.status, 200);
    assert.match(await bootstrap.text(), /import\('\.\/app\.js'\)/);

    const pipeline = await fetch(`${baseUrl}/src/core/pipeline.js`);
    assert.equal(pipeline.status, 200);
    assert.match(await pipeline.text(), /export function compileRequest/);

    const openapi = await fetch(`${baseUrl}/openapi.json`);
    assert.equal(openapi.status, 200);
    assert.equal((await openapi.json()).info.version, '0.3.0');
  });
});

test('compile endpoint returns the same machine-readable pipeline contract used by the CLI and browser', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: 'Review this repository. It must preserve the public API. Return complete code and verify it works.',
        options: { target: 'agent', persona: 'software', outputFormat: 'code' },
      }),
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.engine.version, '0.3.0');
    assert.equal(payload.ir.behavior.target, 'agent');
    assert.match(payload.prompt, /Inspect the available context and tools/);
    assert.ok(payload.analysis.readiness > 0);
  });
});

test('compile endpoint rejects invalid input and unknown integration options', async () => {
  await withServer(async (baseUrl) => {
    const empty = await fetch(`${baseUrl}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: '   ' }),
    });
    assert.equal(empty.status, 400);
    assert.equal((await empty.json()).code, 'EMPTY_INPUT');

    const unknown = await fetch(`${baseUrl}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: 'Compile this.', options: { magic: true } }),
    });
    assert.equal(unknown.status, 400);
    assert.equal((await unknown.json()).code, 'UNKNOWN_OPTIONS');
  });
});

test('server does not expose repository files or unrelated executables', async () => {
  await withServer(async (baseUrl) => {
    for (const pathname of ['/README.md', '/package.json', '/Battle.net-Setup.exe', '/.git/config']) {
      const response = await fetch(`${baseUrl}${pathname}`);
      assert.equal(response.status, 404, `${pathname} should not be publicly served`);
    }
  });
});

test('provider endpoint validates local-only Ollama hosts', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/provider/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'ollama', host: 'https://example.com' }),
    });
    assert.equal(response.status, 400);
    assert.match((await response.json()).error, /localhost/i);
  });
});
