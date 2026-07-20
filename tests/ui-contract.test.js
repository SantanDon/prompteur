import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../style.css', import.meta.url), 'utf8');
const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');

test('workbench exposes an explicit, accessible compiler hierarchy', () => {
  assert.match(html, /Compile rough instructions into a usable task contract/);
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 3);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 3);
  assert.match(html, /id="settings-button"[^>]*>Settings</);
  assert.match(html, /aria-describedby="target-description"/);
  assert.match(html, /aria-live="polite"/);
});

test('responsive CSS contains the document and uses mobile-first fallbacks', () => {
  assert.match(css, /html,[\s\S]*?body\s*\{[\s\S]*?max-width:\s*100%[\s\S]*?overflow-x:\s*hidden/);
  assert.match(css, /grid-template-columns:\s*minmax\(0,/);
  assert.match(css, /@media \(max-width: 1040px\)/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 460px\)/);
  assert.match(css, /\.compiler-grid\s*{[^}]*min-width:\s*0/s);
});

test('visual system avoids generic generated-interface effects', () => {
  assert.doesNotMatch(css, /(?:linear|radial)-gradient/i);
  assert.doesNotMatch(css, /backdrop-filter/i);
  assert.doesNotMatch(css, /box-shadow/i);
  assert.doesNotMatch(html, />⌘<|glass|glow/i);
});

test('tab state and quality metrics are updated accessibly', () => {
  assert.match(app, /setAttribute\('aria-selected'/);
  assert.match(app, /button\.tabIndex = active \? 0 : -1/);
  assert.match(app, /setAttribute\('aria-valuenow'/);
  assert.match(app, /ArrowLeft/);
  assert.match(app, /ArrowRight/);
});
