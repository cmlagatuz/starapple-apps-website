import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fruitSVG } from '../src/brand.js';

test('brand symbol has a semantic star-apple SVG', () => {
  const svg = fruitSVG('test-logo');
  assert.match(svg, /<svg/);
  assert.match(svg, /star-shaped seed chambers/);
  assert.equal((svg.match(/class="core-star"/g) || []).length, 1);
});
test('SPA has required sections and privacy UI', async () => {
  const html = await readFile('index.html','utf8');
  for (const id of ['hero','services','story','github','contact','meeting-form','rfq-form','legal-dialog']) assert.ok(html.includes(`id="${id}"`),id);
  assert.match(html, /type="file"/);
});
test('Firebase rewrite sends inquiry traffic to backend before SPA fallback', async () => {
  const config = JSON.parse(await readFile('firebase.json','utf8'));
  assert.equal(config.hosting.rewrites[0].source,'/api/inquiries');
  assert.equal(config.hosting.rewrites[0].function.functionId,'submitInquiry');
  assert.equal(config.hosting.rewrites[1].destination,'/index.html');
});
test('GitHub workflow gates live deploy on push to main', async () => {
  const workflow = await readFile('.github/workflows/deploy.yml','utf8');
  assert.match(workflow, /refs\/heads\/main/);
  assert.match(workflow, /secrets\.FIREBASE_SERVICE_ACCOUNT/);
  assert.match(workflow, /npm run check/);
});
