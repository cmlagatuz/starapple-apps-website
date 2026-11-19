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

test('Three uploaded founder portraits are local WebP images with matching profile links',async()=>{
 const html=await readFile('index.html','utf8');
 const css=await readFile('src/studio-refresh.css','utf8');
 for(const [name,filename,links] of [
   ['Zantetsuken','Zantetsuken.webp',['https://github.com/cmlagatuz','https://cmlagatuz.dev/']],
   ['Mel','mel.webp',['https://github.com/mel0620','https://rommelcuneta.com/']],
   ['Marbert','marbert.webp',['https://github.com/marbertplazo']]
 ]){
   const card=html.match(new RegExp('<article class="founder-profile founder-profile-'+name.toLowerCase()+' reveal">([\\s\\S]*?)<\\/article>'))?.[1];
   assert.ok(card,'Founder card not found: '+name);
   assert.ok(card.includes('/media/'+filename),'image path for '+name);
   assert.match(card,/class="founder-profile-links"/);
   for(const url of links)assert.ok(card.includes('href="'+url+'"'),url);
   assert.equal((card.match(/target="_blank" rel="noopener noreferrer"/g)||[]).length,links.length);
   const bytes=await readFile('public/media/'+filename);
   assert.equal(bytes.toString('ascii',0,4),'RIFF');
   assert.equal(bytes.toString('ascii',8,12),'WEBP');
   assert.ok(bytes.byteLength>1500);
 }
 for(const key of ['sam','josh']){
   assert.ok(html.includes('/media/cofounder-'+key+'.svg'),key);
   const img=await readFile('public/media/cofounder-'+key+'.svg','utf8');
   assert.match(img,/<svg/);
 }
 assert.match(html,/final-fantasy-lightning-summoning.jpg/);
 assert.equal(html.includes('i.pinimg.com/originals/f3/a5/c7/f3a5c73abac39b446a579225004a85c2.jpg'),false);
 assert.match(css,/\.founder-profile-image img\s*\{/);
 assert.match(css,/object-fit:cover/);
 assert.match(css,/\.founder-profile-links a:focus-visible/);
 assert.match(css,/\/\* Full-frame supplied portraits:/);
 assert.match(css,/\.founders-section \.founder-profile-zantetsuken \.founder-profile-image img,/);
 assert.match(css,/\.founders-section \.founder-profile-marbert \.founder-profile-image img/);
 assert.match(css,/object-fit:contain/);
 assert.match(css,/Full-frame Mel headshot/);
 assert.match(css,/aspect-ratio:1 \/ 1/);
 assert.match(css,/aspect-ratio:1122 \/ 1402/);
 assert.match(css,/@media\(max-width:900px\)/);
});

test('FX section rail includes all three founder chapters and syntax is clean',async()=>{
 const nav=await readFile('src/fx-nav.js','utf8');
 const env=await readFile('src/fx-env.js','utf8');
 for(const id of ['founders','founders-two','founders-three'])assert.ok(nav.includes("'"+id+"'"));
 assert.doesNotMatch(nav,/\\n\s+(?:sw\.|const)/);
 assert.doesNotMatch(env,/\\n\s*(?:lowEnd|\()/);
});


test('desktop founders alternate image and bio while mobile preserves stacked cards',async()=>{
 const html=await readFile('index.html','utf8');
 const css=await readFile('src/studio-refresh.css','utf8');
 const start=html.indexOf('<section id="founders"');
 const end=html.indexOf('</section>',html.indexOf('<section id="founders-three"'))+10;
 const names=[...html.slice(start,end).matchAll(/class="founder-profile founder-profile-([a-z]+) reveal"/g)].map(x=>x[1]);
 assert.deepEqual(names,['zantetsuken','mel','sam','josh','marbert','ajing']);
 assert.match(css,/@media\(min-width:901px\)/);
 assert.match(css,/grid-template-areas:"portrait details" "portrait bio"/);
 assert.match(css,/grid-template-areas:"details portrait" "bio portrait"/);
 assert.match(css,/grid-area:portrait/);
 assert.match(css,/grid-area:details/);
 assert.match(css,/grid-area:bio/);
 assert.match(css,/@media\(max-width:900px\)/);
 assert.match(css,/\.founders-section \.founder-profile \{ top:auto; \}/);
});
