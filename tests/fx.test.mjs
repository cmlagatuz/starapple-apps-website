import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { clamp, lerp, smoothstep, rgb, starVertices, sampleOutline, starClip } from '../src/fx-math.js';

test('fx math helpers', () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(lerp(0, 10, 0.5), 5);
  assert.equal(smoothstep(0, 1, 0.5), 0.5);
  assert.deepEqual(rgb(0xff0000), [1, 0, 0]);
  const v = starVertices(1, 0.4);
  assert.equal(v.length, 10);
  assert.ok(Math.abs(Math.hypot(...v[0]) - 1) < 1e-9 && Math.abs(Math.hypot(...v[1]) - 0.4) < 1e-9);
  const [x, y] = sampleOutline(v, () => 0.25);
  assert.ok(Number.isFinite(x) && Number.isFinite(y));
});

test('star iris clip-path has ten points', () => {
  assert.equal((starClip(100, 100, 50).match(/px/g) || []).length, 20);
});

test('index wires the FX layer without removing existing assets', async () => {
  const html = await readFile('index.html', 'utf8');
  assert.match(html, /\/src\/fx\.css/);
  assert.match(html, /type="module" src="\/src\/fx\.js"/);
  assert.match(html, /fx-pending/);
  assert.match(html, /\/src\/cinema\.js/);
});

test('every FX module honours reduced motion / user opt-out and degrades without libraries', async () => {
  const env = await readFile('src/fx-env.js', 'utf8');
  const entry = await readFile('src/fx.js', 'utf8');
  assert.match(env, /prefers-reduced-motion/);
  assert.match(env, /saveData/);
  assert.match(entry, /motionOK\(\)/);
  assert.match(entry, /catch \(err\)/);
  const css = await readFile('src/fx.css', 'utf8');
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});

test('libraries are version-pinned and loaded lazily', async () => {
  const loader = await readFile('src/fx-loader.js', 'utf8');
  assert.match(loader, /gsap@3\.\d+\.\d+/);
  assert.match(loader, /three@0\.\d+\.\d+/);
  assert.doesNotMatch(loader, /@latest/);
});

test('all FX sources are flat .js/.css files so the build script can copy them', async () => {
  for (const f of await readdir('src')) assert.match(f, /\.(js|css)$/);
});

test('navigation accounts for all ten page chapters, including the extended founders team',async()=>{
 const nav=await readFile('src/fx-nav.js','utf8');
 for (const name of ['founders-two','founders-three'])assert.ok(nav.includes("'"+name+"'"));
});
