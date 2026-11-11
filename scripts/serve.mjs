import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const useDist = process.argv.includes('--dist');
const root = process.cwd();
const port = Number(process.env.PORT || 4173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json' };
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) { res.writeHead(503, {'Content-Type':'application/json'}); res.end(JSON.stringify({error:'The API is only available after deploying Firebase Functions. Use the Firebase emulator for local end-to-end testing.'})); return; }
    const name = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    if (name.includes('..')) throw new Error('Invalid path');
    let file = path.join(root, useDist ? 'dist' : '', name);
    if (!useDist && name.startsWith('/src/')) file = path.join(root, name);
    if (!useDist && name.startsWith('/public/')) throw new Error('Not public');
    if (!useDist && (name === '/favicon.svg' || name === '/site-config.js' || name === '/robots.txt' || name === '/social-card.svg')) file = path.join(root, 'public', name);
    try { if (!(await stat(file)).isFile()) throw new Error('Not file'); }
    catch { file = path.join(root, useDist ? 'dist' : '', 'index.html'); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, () => console.log(`StarApple ${useDist ? 'preview' : 'dev'} server: http://localhost:${port}`));
