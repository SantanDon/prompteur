import { buildPromptIR } from './core/normalize.js';
import { analyzePrompt } from './core/analyze.js';
import { buildOptimizerInput, buildOptimizerSystemPrompt, compilePrompt } from './core/compile.js';
import { checkProvider, requestCandidate } from './providers/client.js';

const STORAGE_KEY = 'prompteur.config.v2';
const DEFAULT_CONFIG = {
  provider: 'local',
  geminiKey: '',
  geminiModel: 'gemini-3.5-flash',
  ollamaHost: 'http://127.0.0.1:11434',
  ollamaModel: 'gemma3',
  persona: 'none',
  tone: 'neutral',
  outputFormat: 'auto',
  audience: '',
  deliverable: '',
  verify: true,
  target: 'general',
};

const elements = {
  rawPrompt: document.querySelector('#raw-prompt'),
  target: document.querySelector('#target-select'),
  characterCount: document.querySelector('#character-count'),
  compile: document.querySelector('#compile-button'),
  clear: document.querySelector('#clear-button'),
  copy: document.querySelector('#copy-button'),
  optimize: document.querySelector('#optimize-button'),
  compiledOutput: document.querySelector('#compiled-output'),
  irOutput: document.querySelector('#ir-output'),
  resultTitle: document.querySelector('#result-title'),
  resultOrigin: document.querySelector('#result-origin'),
  scoreBadge: document.querySelector('#score-badge'),
  scoreValue: document.querySelector('#score-value'),
  issueCount: document.querySelector('#issue-count'),
  diagnosticSummary: document.querySelector('#diagnostic-summary'),
  issueList: document.querySelector('#issue-list'),
  statusButton: document.querySelector('#status-button'),
  statusDot: document.querySelector('#status-dot'),
  statusLabel: document.querySelector('#status-label'),
  settingsButton: document.querySelector('#settings-button'),
  settingsDialog: document.querySelector('#settings-dialog'),
  settingsForm: document.querySelector('#settings-form'),
  closeSettings: document.querySelector('#close-settings-button'),
  cancelSettings: document.querySelector('#cancel-settings-button'),
  ollamaFields: document.querySelector('#ollama-fields'),
  geminiFields: document.querySelector('#gemini-fields'),
  ollamaHost: document.querySelector('#ollama-host'),
  ollamaModel: document.querySelector('#ollama-model'),
  geminiKey: document.querySelector('#gemini-key'),
  geminiModel: document.querySelector('#gemini-model'),
  persona: document.querySelector('#persona-select'),
  tone: document.querySelector('#tone-select'),
  format: document.querySelector('#format-select'),
  audience: document.querySelector('#audience-input'),
  deliverable: document.querySelector('#deliverable-input'),
  verify: document.querySelector('#verify-checkbox'),
  toastRegion: document.querySelector('#toast-region'),
  metrics: {
    clarity: document.querySelector('#metric-clarity'),
    context: document.querySelector('#metric-context'),
    constraints: document.querySelector('#metric-constraints'),
    output: document.querySelector('#metric-output'),
    verification: document.querySelector('#metric-verification'),
  },
};

let config = loadConfig();
let lastRun = null;

function loadConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...DEFAULT_CONFIG, ...stored, geminiKey: '' };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function persistConfig() {
  const { geminiKey: _secret, ...safeConfig } = config;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safeConfig));
}

function setStatus(kind, label) {
  elements.statusDot.className = `status-dot ${kind}`;
  elements.statusLabel.textContent = label;
}

function showToast(message, kind = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${kind}`;
  toast.textContent = message;
  elements.toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 3500);
}

function updateCharacterCount() {
  const length = elements.rawPrompt.value.length;
  elements.characterCount.textContent = `${length.toLocaleString()} ${length === 1 ? 'character' : 'characters'}`;
}

function openSettings() {
  populateSettingsForm();
  elements.settingsDialog.showModal();
}

function closeSettings() {
  elements.settingsDialog.close();
}

function populateSettingsForm() {
  const providerRadio = elements.settingsForm.querySelector(`input[name="provider"][value="${config.provider}"]`);
  if (providerRadio) providerRadio.checked = true;
  elements.ollamaHost.value = config.ollamaHost;
  elements.ollamaModel.value = config.ollamaModel;
  elements.geminiKey.value = config.geminiKey;
  elements.geminiModel.value = config.geminiModel;
  elements.persona.value = config.persona;
  elements.tone.value = config.tone;
  elements.format.value = config.outputFormat;
  elements.audience.value = config.audience;
  elements.deliverable.value = config.deliverable;
  elements.verify.checked = config.verify;
  updateProviderFields(config.provider);
}

function selectedProvider() {
  return elements.settingsForm.querySelector('input[name="provider"]:checked')?.value || 'local';
}

function updateProviderFields(provider = selectedProvider()) {
  elements.ollamaFields.hidden = provider !== 'ollama';
  elements.geminiFields.hidden = provider !== 'gemini';
}

function readSettingsForm() {
  return {
    ...config,
    provider: selectedProvider(),
    ollamaHost: elements.ollamaHost.value.trim() || DEFAULT_CONFIG.ollamaHost,
    ollamaModel: elements.ollamaModel.value.trim() || DEFAULT_CONFIG.ollamaModel,
    geminiKey: elements.geminiKey.value.trim(),
    geminiModel: elements.geminiModel.value.trim() || DEFAULT_CONFIG.geminiModel,
    persona: elements.persona.value,
    tone: elements.tone.value,
    outputFormat: elements.format.value,
    audience: elements.audience.value.trim(),
    deliverable: elements.deliverable.value.trim(),
    verify: elements.verify.checked,
  };
}

async function refreshProviderStatus() {
  setStatus('checking', 'Checking provider…');
  try {
    const result = await checkProvider(config);
    setStatus('ready', result.label || 'Provider ready');
  } catch (error) {
    setStatus('error', error.message);
  }
  elements.optimize.disabled = config.provider === 'local' || !lastRun;
}

function renderScore(analysis) {
  elements.scoreValue.textContent = analysis.readiness;
  elements.scoreBadge.classList.remove('good', 'medium', 'low');
  elements.scoreBadge.classList.add(analysis.readiness >= 80 ? 'good' : analysis.readiness >= 55 ? 'medium' : 'low');
  for (const [name, value] of Object.entries(analysis.dimensions)) {
    elements.metrics[name].textContent = value;
  }
}

function renderDiagnostics(analysis) {
  elements.issueCount.textContent = analysis.issues.length;
  elements.diagnosticSummary.textContent = analysis.summary;
  elements.issueList.replaceChildren();

  if (analysis.issues.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-diagnostics';
    empty.textContent = 'No material prompt-contract issues detected by the deterministic linter.';
    elements.issueList.append(empty);
    return;
  }

  for (const item of analysis.issues) {
    const card = document.createElement('article');
    card.className = 'issue-card';

    const header = document.createElement('header');
    const title = document.createElement('h3');
    title.textContent = item.title;
    const severity = document.createElement('span');
    severity.className = `severity ${item.severity}`;
    severity.textContent = item.severity;
    header.append(title, severity);

    const message = document.createElement('p');
    message.textContent = item.message;
    const suggestion = document.createElement('small');
    suggestion.textContent = `Improve: ${item.suggestion}`;
    card.append(header, message, suggestion);
    elements.issueList.append(card);
  }
}

function selectTab(name) {
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === name);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    const active = panel.dataset.panel === name;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });
}

function compileCurrentPrompt() {
  const input = elements.rawPrompt.value.trim();
  if (!input) {
    showToast('Add a prompt before compiling.', 'error');
    elements.rawPrompt.focus();
    return null;
  }

  const ir = buildPromptIR(input, {
    target: config.target,
    persona: config.persona,
    tone: config.tone,
    outputFormat: config.outputFormat,
    audience: config.audience,
    deliverable: config.deliverable,
    verify: config.verify,
  });
  const analysis = analyzePrompt(ir);
  const baseline = compilePrompt(ir);

  lastRun = { ir, analysis, baseline, current: baseline };
  elements.compiledOutput.textContent = baseline;
  elements.irOutput.textContent = JSON.stringify({ prompt: ir, analysis }, null, 2);
  elements.resultTitle.textContent = 'Compiled prompt';
  elements.resultOrigin.textContent = 'Deterministic local compiler';
  elements.copy.disabled = false;
  elements.optimize.disabled = config.provider === 'local';
  renderScore(analysis);
  renderDiagnostics(analysis);
  selectTab('prompt');
  return lastRun;
}

async function optimizeCurrentPrompt() {
  const run = lastRun || compileCurrentPrompt();
  if (!run) return;
  if (config.provider === 'local') {
    showToast('Choose Ollama or Gemini to generate a model candidate.', 'error');
    openSettings();
    return;
  }

  const originalLabel = elements.optimize.textContent;
  elements.optimize.disabled = true;
  elements.optimize.textContent = 'Generating candidate…';
  elements.resultOrigin.textContent = `${config.provider} is evaluating the local baseline`;

  try {
    const text = await requestCandidate({
      config,
      system: buildOptimizerSystemPrompt(),
      prompt: buildOptimizerInput({
        original: run.ir.raw,
        baseline: run.baseline,
        analysis: run.analysis,
        target: run.ir.behavior.target,
      }),
    });
    run.current = text;
    elements.compiledOutput.textContent = text;
    elements.resultTitle.textContent = 'Model candidate';
    elements.resultOrigin.textContent = `${config.provider} candidate · deterministic baseline preserved`;
    showToast('Model candidate generated. Compare it against the diagnostics before use.');
    selectTab('prompt');
  } catch (error) {
    elements.resultOrigin.textContent = 'Deterministic local compiler';
    showToast(error.message, 'error');
  } finally {
    elements.optimize.textContent = originalLabel;
    elements.optimize.disabled = config.provider === 'local';
  }
}

async function copyCurrentPrompt() {
  if (!lastRun?.current) return;
  try {
    await navigator.clipboard.writeText(lastRun.current);
    showToast('Prompt copied to clipboard.');
  } catch {
    showToast('Clipboard access failed. Select and copy the prompt manually.', 'error');
  }
}

function clearWorkbench() {
  elements.rawPrompt.value = '';
  updateCharacterCount();
  lastRun = null;
  elements.compiledOutput.textContent = 'Your compiled prompt will appear here.';
  elements.irOutput.textContent = 'No prompt IR generated yet.';
  elements.issueList.replaceChildren();
  elements.diagnosticSummary.textContent = 'Run an analysis to inspect ambiguity, output contracts, conflicts, and safety boundaries.';
  elements.issueCount.textContent = '0';
  elements.scoreValue.textContent = '—';
  elements.scoreBadge.className = 'score-badge';
  Object.values(elements.metrics).forEach((metric) => { metric.textContent = '—'; });
  elements.copy.disabled = true;
  elements.optimize.disabled = true;
  elements.resultTitle.textContent = 'Compiled prompt';
  elements.resultOrigin.textContent = 'Deterministic local compiler';
  elements.rawPrompt.focus();
}

function bindEvents() {
  elements.rawPrompt.addEventListener('input', updateCharacterCount);
  elements.rawPrompt.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      compileCurrentPrompt();
    }
  });
  elements.target.addEventListener('change', () => {
    config.target = elements.target.value;
    persistConfig();
  });
  elements.compile.addEventListener('click', compileCurrentPrompt);
  elements.optimize.addEventListener('click', optimizeCurrentPrompt);
  elements.copy.addEventListener('click', copyCurrentPrompt);
  elements.clear.addEventListener('click', clearWorkbench);
  elements.settingsButton.addEventListener('click', openSettings);
  elements.statusButton.addEventListener('click', openSettings);
  elements.closeSettings.addEventListener('click', closeSettings);
  elements.cancelSettings.addEventListener('click', closeSettings);
  elements.settingsForm.addEventListener('change', (event) => {
    if (event.target.name === 'provider') updateProviderFields(event.target.value);
  });
  elements.settingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    config = readSettingsForm();
    persistConfig();
    closeSettings();
    await refreshProviderStatus();
    showToast('Settings saved.');
  });
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.addEventListener('click', () => selectTab(button.dataset.tab));
  });
}

function init() {
  elements.target.value = config.target;
  updateCharacterCount();
  bindEvents();
  refreshProviderStatus();
}

init();
