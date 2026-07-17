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

test('server exposes the app and health endpoint', async () => {
  await withServer(async (baseUrl) => {
    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { ok: true, service: 'prompteur', version: '0.2.0' });

    const home = await fetch(`${baseUrl}/`);
    assert.equal(home.status, 200);
    const html = await home.text();
    assert.match(html, /Make prompts more precise/);
    assert.match(html, /href="\.\/style\.css"/);
    assert.match(html, /src="\.\/src\/bootstrap\.js"/);

    const bootstrap = await fetch(`${baseUrl}/src/bootstrap.js`);
    assert.equal(bootstrap.status, 200);
    assert.match(await bootstrap.text(), /import\('\.\/app\.js'\)/);
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
