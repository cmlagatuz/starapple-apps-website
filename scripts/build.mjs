import { rm, mkdir, cp, readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(path.join(out, 'assets'), { recursive: true });
await cp(path.join(root, 'public'), out, { recursive: true });
const files = await readdir(path.join(root, 'src'));
for (const file of files) {
  if (!/\.(js|css)$/.test(file)) throw new Error(`Unexpected source file: ${file}`);
  await cp(path.join(root, 'src', file), path.join(out, 'assets', file));
}
let html = await readFile(path.join(root, 'index.html'), 'utf8');
html = html.replaceAll('/src/', '/assets/');
await writeFile(path.join(out, 'index.html'), html);
console.log('Built static site to dist/');
