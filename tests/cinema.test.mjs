import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat, readdir} from 'node:fs/promises';

test('hero streams the specified cinematic video directly with accessible playback', async () => {
  const html = await readFile('index.html', 'utf8');
  assert.match(html, /id="hero-film"[^>]*autoplay[^>]*muted[^>]*loop[^>]*playsinline/);
  assert.ok(html.includes('<source src="https://www.unkey.com/videos/home/hero-av1.mp4" type="video/mp4" />'));
  assert.match(html, /poster="\/media\/starapple-core-poster\.webp"/);
  assert.match(html, /id="hero-film-toggle"/);
  assert.match(html, /\/src\/cinema\.css/);
  assert.match(html, /\/src\/cinema\.js/);
  assert.doesNotMatch(html, /src="\/media\/starapple-core\.mp4"/);
});

test('the fallback poster is available and the superseded local film is not deployed', async () => {
  const poster = await stat('public/media/starapple-core-poster.webp');
  assert.ok(poster.size > 10_000 && poster.size < 300_000, `poster size: ${poster.size}`);
  const assets = await readdir('public/media');
  assert.ok(!assets.includes('starapple-core.mp4'), 'obsolete film must not be shipped');
});

test('incoming query strings are removed before fragment links are presented', async () => {
  const html = await readFile('index.html', 'utf8');
  assert.match(html, /if \(location\.search\)/);
  assert.match(html, /history\.replaceState\(history\.state, '', location\.pathname \+ location\.hash\)/);
  assert.doesNotMatch(html, /[?&](?:source|utm_source|ref)=/i);
});

test('motion script honors reduced motion and preserves user controls', async () => {
  const js = await readFile('src/cinema.js', 'utf8');
  assert.match(js, /prefers-reduced-motion/);
  assert.match(js, /IntersectionObserver/);
  assert.match(js, /aria-pressed/);
  assert.match(js, /visibilitychange/);
});

test('hero attempts muted autoplay immediately, regardless of FX or low device resources', async () => {
  const html = await readFile('index.html', 'utf8');
  const js = await readFile('src/cinema.js', 'utf8');
  assert.match(html, /id="hero-film"[^>]*preload="auto"/);
  assert.match(js, /film\.play\(\)/);
  assert.match(js, /film\.muted = true/);
  assert.doesNotMatch(js, /env\.lowEnd|saveData|motionEnabled/);
  assert.match(js, /userPaused/);
  assert.match(js, /visibilitychange/);
  assert.match(js, /pageshow/);
});
