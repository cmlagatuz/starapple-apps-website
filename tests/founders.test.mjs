import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const names=['Zantetsuken','Mel','Sam','Josh','Marbert','Ajing'];

test('Our Core leads into three consecutively presented founder chapters',async()=>{
 const html=await readFile('index.html','utf8');
 const locs=['<section id="story"','<section id="founders"','<section id="founders-two"','<section id="founders-three"','<section id="contact"'].map(s=>html.indexOf(s));
 assert.ok(locs.every(n=>n>=0));
 assert.ok(locs.every((n,i)=>i===0||n>locs[i-1]));
 assert.match(html,/href="#founders">Get to know us/);
 assert.doesNotMatch(html,/id="founders-dialog"/);
 for(const id of ['founders','founders-two','founders-three'])assert.match(html,new RegExp('<section id="'+id+'" class="founders-section section page-panel"'));
});

test('Exactly six team profiles appear in required order with five co-founders',async()=>{
 const html=await readFile('index.html','utf8');
 const start=html.indexOf('<section id="founders"'),end=html.indexOf('</section>',html.indexOf('<section id="founders-three"'))+10;
 const content=html.slice(start,end);
 const found=[...content.matchAll(/<h3>(Zantetsuken|Mel|Sam|Josh|Marbert|Ajing)<\/h3>/g)].map(m=>m[1]);
 assert.deepEqual(found,names);
 assert.equal((content.match(/class="founder-profile founder-profile-/g)||[]).length,6);
 assert.equal((content.match(/<span class="founder-position">FOUNDER<\/span>/g)||[]).length,1);
 assert.equal((content.match(/<span class="founder-position">CO-FOUNDER<\/span>/g)||[]).length,5);
 assert.equal((content.match(/class="founder-profile-bio"/g)||[]).length,6);
 assert.doesNotMatch(content,/real name|developer alias|years of experience|university degree/i);
});

test('Existing portraits are preserved and four new abstract local portraits exist',async()=>{
 const html=await readFile('index.html','utf8');
 const css=await readFile('src/studio-refresh.css','utf8');
 assert.match(html,/i.pinimg.com\/originals\/f3\/a5\/c7\/f3a5c73abac39b446a579225004a85c2.jpg/);
 assert.match(html,/final-fantasy-lightning-summoning.jpg/);
 for(const key of ['mel','sam','josh','marbert']){
   assert.ok(html.includes('/media/cofounder-'+key+'.svg'),key);
   const img=await readFile('public/media/cofounder-'+key+'.svg','utf8');
   assert.match(img,/<svg/);
   assert.match(img,/Abstract portrait illustration/);
 }
 assert.match(css,/\.founder-profile-image img\s*\{/);
 assert.match(css,/object-fit:cover/);
});

test('FX section rail includes all three founder chapters and syntax is clean',async()=>{
 const nav=await readFile('src/fx-nav.js','utf8');
 const env=await readFile('src/fx-env.js','utf8');
 for(const id of ['founders','founders-two','founders-three'])assert.ok(nav.includes("'"+id+"'"));
 assert.doesNotMatch(nav,/\\n\s+(?:sw\.|const)/);
 assert.doesNotMatch(env,/\\n\s*(?:lowEnd|\()/);
});
