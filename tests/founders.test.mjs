import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const zantetsukenImage='https://i.pinimg.com/originals/f3/a5/c7/f3a5c73abac39b446a579225004a85c2.jpg';
const ajingImage='https://static0.srcdn.com/wordpress/wp-content/uploads/2019/02/final-fantasy-lightning-summoning.jpg';

test('Our Core links to founders as a real section immediately after Our Core', async () => {
  const html=await readFile('index.html','utf8');
  const story=html.indexOf('<section id="story"');
  const founders=html.indexOf('<section id="founders"');
  const contact=html.indexOf('<section id="contact"');
  assert.ok(story>=0 && founders>story && contact>founders);
  assert.match(html,/href="#founders">Get to know us/);
  assert.doesNotMatch(html,/id="founders-dialog"|data-open-dialog="founders-dialog"/);
  assert.match(html,/id="founders" class="founders-section section page-panel"/);
});

test('Founder profile cards present developer names and roles without placeholder copy', async () => {
  const html=await readFile('index.html','utf8');
  const start=html.indexOf('<section id="founders"');
  const end=html.indexOf('</section>',start);
  const section=html.slice(start,end);
  assert.match(section,/FOUNDER/);
  assert.match(section,/CO-FOUNDER/);
  assert.match(section,/<h3>Zantetsuken<\/h3>/);
  assert.match(section,/<h3>Ajing<\/h3>/);
  assert.equal((section.match(/class="founder-profile founder-profile-/g)||[]).length,2);
  assert.doesNotMatch(section,/real name|alias|placeholder|to be added/i);
  assert.ok(section.includes(zantetsukenImage));
  assert.ok(section.includes(ajingImage));
});

test('Both provided images are fitted responsively with independent crop settings', async () => {
  const css=await readFile('src/studio-refresh.css','utf8');
  const js=await readFile('src/main.js','utf8');
  assert.match(css,/\.founder-profile-image img\s*\{/);
  assert.match(css,/object-fit:cover/);
  assert.match(css,/\.founder-profile-zantetsuken \.founder-profile-image img \{ object-position:/);
  assert.match(css,/\.founder-profile-ajing \.founder-profile-image img \{ object-position:/);
  assert.match(css,/@media\(max-width:850px\)/);
  assert.doesNotMatch(js,/founders-dialog/);
});
