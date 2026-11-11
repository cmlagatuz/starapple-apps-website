import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Our Core button opens the accessible founders modal', async () => {
  const html = await readFile('index.html', 'utf8');
  const script = await readFile('src/main.js', 'utf8');
  const style = await readFile('src/studio-refresh.css', 'utf8');
  assert.match(html, /Get to know us/);
  assert.match(html, /data-open-dialog="founders-dialog" aria-haspopup="dialog"/);
  assert.match(html, /<dialog id="founders-dialog"[^>]*aria-labelledby="founders-dialog-title"/);
  assert.match(html, /data-close-dialog aria-label="Close founders profiles"/);
  assert.match(script, /querySelectorAll\('\.inquiry-dialog, \.founders-dialog'\)/);
  assert.match(script, /dialog\.showModal\(\)/);
  assert.match(style, /\.founders-grid/);
  assert.match(style, /@media \(max-width: 620px\)/);
});

test('Founder aliases and personal identity placeholders are accurate', async () => {
  const html = await readFile('index.html', 'utf8');
  const founders = html.slice(html.indexOf('<dialog id="founders-dialog"'),html.indexOf('</dialog>',html.indexOf('<dialog id="founders-dialog"')));
  assert.equal((founders.match(/class="founder-card"/g) || []).length, 2);
  assert.match(founders, /data-founder="zantetsuken"/);
  assert.match(founders, /01 \/ FOUNDER/);
  assert.match(founders, /<h3>Zantetsuken<\/h3>/);
  assert.match(founders, /data-founder="ajing"/);
  assert.match(founders, /02 \/ CO-FOUNDER/);
  assert.match(founders, /<h3>Ajing<\/h3>/);
  assert.equal((founders.match(/<strong>To be added<\/strong>/g)||[]).length,2);
  assert.equal((founders.match(/PHOTO TO BE ADDED/g)||[]).length,2);
});

test('Each founder has a replaceable, self-hosted photo placeholder', async()=>{
  const html=await readFile('index.html','utf8');
  for(const file of ['founder-zantetsuken-placeholder.svg','cofounder-ajing-placeholder.svg']){
    assert.ok(html.includes('/media/'+file));
    const asset=await readFile('public/media/'+file,'utf8');
    assert.match(asset, /<svg/);
    assert.match(asset, /Portrait placeholder/);
  }
});
