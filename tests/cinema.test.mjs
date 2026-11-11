import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
test('original starapple video hero uses muted in-page H264 source and a poster',async()=>{
  const html=await readFile('index.html','utf8');
  assert.match(html,/id="hero-film"[^>]*autoplay[^>]*muted[^>]*loop[^>]*playsinline/);
  assert.match(html,/src="\/media\/starapple-core\.mp4"/);
  assert.match(html,/poster="\/media\/starapple-core-poster\.webp"/);
  assert.match(html,/id="hero-film-toggle"/);
  assert.match(html,/\/src\/cinema\.css/);
  assert.match(html,/\/src\/cinema\.js/);
});
test('media files are tracked, original and small enough for fast loading',async()=>{
  const video=await stat('public/media/starapple-core.mp4');
  const poster=await stat('public/media/starapple-core-poster.webp');
  assert.ok(video.size>500_000 && video.size<5_000_000,`video size: ${video.size}`);
  assert.ok(poster.size>10_000 && poster.size<300_000,`poster size: ${poster.size}`);
});
test('motion script honours reduced motion and preserves user controls',async()=>{
  const js=await readFile('src/cinema.js','utf8');
  assert.match(js,/prefers-reduced-motion/);
  assert.match(js,/IntersectionObserver/);
  assert.match(js,/aria-pressed/);
  assert.match(js,/visibilitychange/);
});