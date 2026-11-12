import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('cinematic hero is full-bleed behind content without a video card', async () => {
  const html=await readFile('index.html','utf8');
  const css=await readFile('src/studio-refresh.css','utf8');
  const hero=html.slice(html.indexOf('<section id="hero"'),html.indexOf('</section>',html.indexOf('<section id="hero"')));
  assert.ok(hero.indexOf('class="hero-cinema"') < hero.indexOf('class="wrap hero-layout"'));
  assert.equal((hero.match(/id="hero-film"/g) || []).length, 1);
  assert.equal((hero.match(/class="hero-cinema"/g) || []).length, 1);
  assert.match(css,/\.hero-cinema\{position:absolute;inset:0;width:100%;height:100%/);
  assert.ok(hero.includes('https://www.unkey.com/videos/home/hero-av1.mp4'));
});
test('major sections snap at desktop viewport and small screens retain natural flow',async()=>{
  const html=await readFile('index.html','utf8');
  const css=await readFile('src/studio-refresh.css','utf8');
  assert.equal((html.match(/class="[^"]*page-panel"/g)||[]).length,10);
  assert.match(css,/scroll-snap-type:y mandatory/);
  assert.match(css,/scroll-snap-stop:always/);
  assert.match(css,/@media\(max-height:719px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(html,/class="marquee"/);
});
test('both original contact forms remain functional in native, scrollable dialogs',async()=>{
  const html=await readFile('index.html','utf8');
  const main=await readFile('src/main.js','utf8');
  const forms=await readFile('src/forms.js','utf8');
  for(const name of ['meeting','rfq']) {
    assert.ok(html.includes('id="'+name+'-dialog"'));
    assert.ok(html.includes('id="'+name+'-form"'));
    assert.ok(html.includes('data-open-dialog="'+name+'-dialog"'));
  }
  assert.match(main,/dialog\.showModal\(\)/);
  assert.match(forms,/submit\(fd\)/);
});
