import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('client solution explorer includes four accessible service tabs', async () => {
  const html = await readFile('index.html', 'utf8');
  assert.match(html, /id="lab"/);
  assert.match(html, /id="hero-film"/);
  assert.match(html, /id="reading-progress"/);
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tab"/g) || []).length, 4);
  for (const discipline of ['app', 'web', 'cloud', 'strategy']) {
    assert.ok(html.includes(`data-scenario="${discipline}"`));
  }
});

test('interactive solutions use real deliverables, remove fake terminal data, and honor motion settings', async () => {
  const script = await readFile('src/experience.js', 'utf8');
  const stylesheet = await readFile('src/revamp.css', 'utf8');
  const html = await readFile('index.html', 'utf8');
  assert.match(script, /prefers-reduced-motion/);
  assert.match(script, /ArrowRight/);
  assert.match(script, /IntersectionObserver/);
  assert.match(stylesheet, /prefers-reduced-motion/);
  assert.match(html, /WHAT WE CAN WORK ON/);
  assert.doesNotMatch(html, /preview\\.config|Developer pulse|id=\"intro\"/);
  assert.doesNotMatch(script, /lab-code-output/);
});
