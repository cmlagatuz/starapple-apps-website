import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('interactive showcase includes the accessible four-discipline tablist', async () => {
  const html = await readFile('index.html', 'utf8');
  assert.match(html, /id="lab"/);
  assert.match(html, /id="core-canvas"/);
  assert.match(html, /id="reading-progress"/);
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 4);
  for (const discipline of ['app', 'web', 'cloud', 'strategy']) {
    assert.ok(html.includes(`data-scenario="${discipline}"`));
  }
});

test('interactive animations respect accessibility and keep preview data clearly labeled', async () => {
  const script = await readFile('src/experience.js', 'utf8');
  const stylesheet = await readFile('src/revamp.css', 'utf8');
  const html = await readFile('index.html', 'utf8');
  assert.match(script, /prefers-reduced-motion/);
  assert.match(script, /ArrowRight/);
  assert.match(script, /IntersectionObserver/);
  assert.match(stylesheet, /prefers-reduced-motion/);
  assert.match(html, /NOT A LIVE DEPLOYMENT/);
});
