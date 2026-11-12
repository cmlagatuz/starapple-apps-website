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
  const fx = await readFile('src/fx.js', 'utf8');
  assert.match(fx, /root\.classList\.remove\('fx-pending'\)/);
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

test('FX toggle supports full 3D effects where WebGL is available',async()=>{
  const environment = await readFile('src/fx-env.js','utf8');
  const nav = await readFile('src/fx-nav.js','utf8');
  assert.match(environment,/preference: /);
  assert.match(environment,/FX_KEY = 'starapple-fx-v2'/);
  assert.match(environment,/pref : 'on'/);
  assert.match(environment,/motionOK = \(\) => !env\.reduced && !env\.userOff/);
  assert.match(environment,/glOK = \(\) => motionOK\(\) && canWebGL\(\)/);
  assert.match(nav,/sw\.disabled = env\.reduced/);
  assert.match(nav,/setUserFx\(!on\)/);
  assert.doesNotMatch(nav,/sw\.disabled = automaticOff/);
});

test('hero word rotation and four header nav links use character reveal without breaking navigation',async()=>{
  const html=await readFile('index.html','utf8');
  const main=await readFile('src/main.js','utf8');
  const kinetic=await readFile('src/kinetic-type.js','utf8');
  assert.match(html,/id="hero-keyword">idea\./);
  for (const word of ["idea.","launch.","product.","platform.","vision."])
    assert.ok(kinetic.includes("'"+word+"'"));
  for (const text of ['Solutions','Explore solutions','Our core',"Let's talk"])
    assert.ok(html.includes('>'+text+'</a>'));
  assert.match(main,/initNavScramble\(\)/);
  assert.match(main,/initHeroKeyword\(\)/);
  assert.match(kinetic,/requestAnimationFrame/);
  assert.match(kinetic,/i < revealed/);
  assert.match(kinetic,/prefers-reduced-motion: reduce/);
  assert.doesNotMatch(kinetic,/preventDefault\(\)/);
});

test('headline cycle is faster while preserving nav animations', async()=>{
  const js=await readFile('src/kinetic-type.js','utf8');
  assert.match(js,/setTimeout\(cycle, 2250\)/);
  assert.match(js,/scrambleText\(el, target, 490/);
  assert.match(js,/initNavScramble/);
});

test('main header CTA is not magnetically shifted or GSAP-translated', async()=>{
  const css=await readFile('src/studio-refresh.css','utf8');
  const scroll=await readFile('src/fx-scroll.js','utf8');
  const cursor=await readFile('src/fx-cursor.js','utf8');
  assert.match(css,/\.site-header \.nav-cta \{/);
  assert.match(css,/translate:0 0/);
  assert.match(css,/\.hero-actions > \.hero-secondary \{/);
  assert.match(css,/min-height:54px/);
  assert.doesNotMatch(scroll,/\.from\('\.site-header \.nav-container > \*'/);
  assert.doesNotMatch(cursor,/\.button, \.hero-secondary, \.lab-link/);
});

test('full 3D effects do not skip scenes based on device resources',async()=>{
 const env=await readFile('src/fx-env.js','utf8');
 const entry=await readFile('src/fx.js','utf8');
 const kit=await readFile('src/fx-gl-kit.js','utf8');
 const hero=await readFile('src/fx-gl-hero.js','utf8');
 const story=await readFile('src/fx-gl-story.js','utf8');
 assert.match(env,/glOK = \(\) => motionOK\(\) && canWebGL\(\)/);
 assert.doesNotMatch(env,/lowEnd|saveData|deviceMemory|hardwareConcurrency/);
 assert.doesNotMatch(entry,/if \(!env\.coarse\)/);
 assert.match(entry,/initAuroraGL\(THREE, host, \{ tone: 0 \}\)/);
 assert.match(entry,/initAuroraGL\(THREE, host, \{ tone: 1 \}\)/);
 assert.match(kit,/const dprCap = maxDpr/);
 assert.match(hero,/const COUNT = 6200/);
 assert.match(story,/const SPARKS = 150/);
});
test('link navigation uses no overlay, while keyboard navigation uses scrolling',async()=>{
 const entry=await readFile('src/fx.js','utf8');
 const transition=await readFile('src/fx-transition.js','utf8');
 const css=await readFile('src/fx.css','utf8');
 assert.doesNotMatch(entry,/initTransitions/);
 assert.doesNotMatch(transition,/starClip|fx-iris|preventDefault|gsap\.timeline|overlay/);
 assert.match(transition,/scrollIntoView/);
 assert.match(transition,/history\.pushState/);
 assert.match(transition,/ensureSectionIds/);
 assert.doesNotMatch(css,/\.fx-iris/);
});
