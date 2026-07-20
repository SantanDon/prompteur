import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { compileRequest, getCompilerCapabilities } from './src/core/pipeline.js';
import { PROMPTEUR_VERSION } from './src/core/version.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_PORT = Number(process.env.PORT || 3030);
const DEFAULT_HOST = process.env.HOST || '127.0.0.1';
const MAX_BODY_BYTES = 100_000;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;

const STATIC_ROUTES = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/src/app.js', ['src/app.js', 'text/javascript; charset=utf-8']],
  ['/src/bootstrap.js', ['src/bootstrap.js', 'text/javascript; charset=utf-8']],
  ['/src/core/catalog.js', ['src/core/catalog.js', 'text/javascript; charset=utf-8']],
  ['/src/core/normalize.js', ['src/core/normalize.js', 'text/javascript; charset=utf-8']],
  ['/src/core/analyze.js', ['src/core/analyze.js', 'text/javascript; charset=utf-8']],
  ['/src/core/compile.js', ['src/core/compile.js', 'text/javascript; charset=utf-8']],
  ['/src/core/pipeline.js', ['src/core/pipeline.js', 'text/javascript; charset=utf-8']],
  ['/src/core/version.js', ['src/core/version.js', 'text/javascript; charset=utf-8']],
  ['/openapi.json', ['openapi.json', 'application/json; charset=utf-8']],
  ['/src/providers/client.js', ['src/providers/client.js', 'text/javascript; charset=utf-8']],
]);

const rateBuckets = new Map();


function isLoopbackRequest(req) {
  const address = req.socket.remoteAddress || '';
  return address === '127.0.0.1'
    || address === '::1'
    || address === '::ffff:127.0.0.1';
}

function securityHeaders(contentType = 'application/json; charset=utf-8') {
  return {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  };
}

function sendJson(res, status, payload) {
  res.writeHead(status, securityHeaders());
  res.end(JSON.stringify(payload));
}

function isRateLimited(req) {
  const key = req.socket.remoteAddress || 'local';
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { startedAt: now, count: 0 };
  if (now - bucket.startedAt >= RATE_WINDOW_MS) {
    bucket.startedAt = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  return bucket.count > RATE_LIMIT;
}

async function readJsonBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) {
      const error = new Error('Request body is too large.');
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('Request body must be valid JSON.');
    error.status = 400;
    throw error;
  }
}

function safeModel(value, fallback) {
  const model = String(value || fallback).trim();
  if (!/^[a-zA-Z0-9._:/-]{1,120}$/.test(model)) {
    const error = new Error('Invalid model name.');
    error.status = 400;
    throw error;
  }
  return model;
}

function safeLocalHost(value) {
  const fallback = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
  const url = new URL(String(value || fallback));
  const allowedNames = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
  if (!['http:', 'https:'].includes(url.protocol) || !allowedNames.has(url.hostname)) {
    const error = new Error('Ollama host must resolve to localhost.');
    error.status = 400;
    throw error;
  }
  return url.origin;
}

async function fetchJson(url, options = {}) {
  const { timeoutMs = 30_000, ...requestOptions } = options;
  let response;
  try {
    response = await fetch(url, {
      ...requestOptions,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const providerError = new Error(error?.name === 'TimeoutError'
      ? 'Provider request timed out.'
      : 'Provider is unreachable.');
    providerError.status = 502;
    throw providerError;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload?.error?.message || payload?.error || payload?.message || `Upstream request failed (${response.status}).`);
    error.status = response.status >= 400 && response.status < 500 ? 400 : 502;
    throw error;
  }
  return payload;
}

async function checkProvider(body) {
  if (body.provider === 'local') {
    return { ok: true, label: 'Local compiler ready' };
  }

  if (body.provider === 'ollama') {
    const host = safeLocalHost(body.host);
    const payload = await fetchJson(`${host}/api/tags`, { timeoutMs: 3_000 });
    return { ok: true, label: `Ollama connected · ${payload.models?.length || 0} models` };
  }

  if (body.provider === 'gemini') {
    const apiKey = String(body.apiKey || process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      const error = new Error('Gemini key is not configured.');
      error.status = 400;
      throw error;
    }
    await fetchJson('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', {
      headers: { 'x-goog-api-key': apiKey },
      timeoutMs: 5_000,
    });
    return { ok: true, label: 'Gemini connected' };
  }

  const error = new Error('Unsupported provider.');
  error.status = 400;
  throw error;
}

async function rewriteWithProvider(body) {
  const system = String(body.system || '').trim();
  const prompt = String(body.prompt || '').trim();
  if (!system || !prompt) {
    const error = new Error('System and prompt text are required.');
    error.status = 400;
    throw error;
  }
  if (system.length + prompt.length > 80_000) {
    const error = new Error('Prompt payload is too large.');
    error.status = 413;
    throw error;
  }

  if (body.provider === 'ollama') {
    const host = safeLocalHost(body.host);
    const model = safeModel(body.model, process.env.OLLAMA_MODEL || 'gemma3');
    const payload = await fetchJson(`${host}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, system, prompt, stream: false }),
      timeoutMs: 90_000,
    });
    return String(payload.response || '').trim();
  }

  if (body.provider === 'gemini') {
    const apiKey = String(body.apiKey || process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      const error = new Error('Gemini key is not configured.');
      error.status = 400;
      throw error;
    }
    const model = safeModel(body.model, process.env.GEMINI_MODEL || 'gemini-3.5-flash');
    const payload = await fetchJson(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      }),
      timeoutMs: 90_000,
    });
    return String(payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('') || '').trim();
  }

  const error = new Error('Choose Ollama or Gemini for model-assisted optimization.');
  error.status = 400;
  throw error;
}

async function serveStatic(pathname, res) {
  const route = STATIC_ROUTES.get(pathname);
  if (!route) return false;
  const [relativePath, contentType] = route;
  const content = await readFile(path.join(__dirname, relativePath));
  res.writeHead(200, {
    ...securityHeaders(contentType),
    'Cache-Control': relativePath.endsWith('.html') ? 'no-store' : 'public, max-age=300',
  });
  res.end(content);
  return true;
}

export function createAppServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

      if (url.pathname.startsWith('/api/') && !isLoopbackRequest(req)) {
        sendJson(res, 403, { error: 'Prompteur API accepts loopback clients only.', code: 'LOOPBACK_ONLY' });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/health') {
        sendJson(res, 200, { ok: true, service: 'prompteur', version: PROMPTEUR_VERSION });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/capabilities') {
        sendJson(res, 200, getCompilerCapabilities());
        return;
      }

      if (req.method === 'POST' && ['/api/compile', '/api/provider/health', '/api/rewrite'].includes(url.pathname)) {
        if (isRateLimited(req)) {
          sendJson(res, 429, { error: 'Too many local requests. Try again shortly.' });
          return;
        }
        const body = await readJsonBody(req);
        if (url.pathname === '/api/compile') {
          sendJson(res, 200, compileRequest(body.input, body.options));
          return;
        }
        if (url.pathname === '/api/provider/health') {
          sendJson(res, 200, await checkProvider(body));
          return;
        }
        const text = await rewriteWithProvider(body);
        if (!text) {
          sendJson(res, 502, { error: 'The provider returned an empty response.' });
          return;
        }
        sendJson(res, 200, { text });
        return;
      }

      if (req.method === 'GET' && await serveStatic(url.pathname, res)) {
        return;
      }

      sendJson(res, 404, { error: 'Not found.' });
    } catch (error) {
      const status = Number(error.status) || 500;
      sendJson(res, status, {
        error: status === 500 ? 'Request failed safely.' : error.message,
        ...(error.code ? { code: error.code } : {}),
      });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const server = createAppServer();
  server.listen(DEFAULT_PORT, DEFAULT_HOST, () => {
    console.log(`Prompteur running at http://${DEFAULT_HOST}:${DEFAULT_PORT}`);
  });
}
