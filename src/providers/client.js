function apiUrl(path) {
  return new URL(`./api/${path}`, document.baseURI);
}

export async function checkProvider(config) {
  if (config.provider === 'local') {
    return { ok: true, label: 'Local compiler ready' };
  }

  const response = await fetch(apiUrl('provider/health'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: config.provider,
      host: config.ollamaHost,
      apiKey: config.geminiKey,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Provider check failed.');
  }
  return payload;
}

export async function requestCandidate({ config, system, prompt }) {
  const response = await fetch(apiUrl('rewrite'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: config.provider,
      model: config.provider === 'gemini' ? config.geminiModel : config.ollamaModel,
      host: config.ollamaHost,
      apiKey: config.geminiKey,
      system,
      prompt,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || 'Model optimization failed.');
  }
  return payload.text;
}
