import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
const jsFiles = (await readdir('src')).filter(n => n.endsWith('.js')).map(n => `src/${n}`);
jsFiles.push('public/site-config.js', 'scripts/build.mjs', 'scripts/serve.mjs', 'scripts/check.mjs', 'functions/index.js');
for (const file of jsFiles) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
const html = await readFile('index.html', 'utf8');
for (const id of ['hero', 'lab', 'services', 'clients', 'story', 'contact', 'meeting-form', 'rfq-form', 'founders']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Missing required markup: ${id}`);
}
console.log(`Lint passed: ${jsFiles.length} JS files and required HTML landmarks.`);
