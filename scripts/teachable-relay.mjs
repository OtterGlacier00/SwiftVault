// Teachable relay: piccolo collettore HTTP locale usato dagli script in pagina
// (browser.evaluate) per salvare dati e URL firmati su disco senza transito in chat.
// Endpoint:
//   POST /<name>     -> salva il body come %TEMP%\opencode\collect\<name>.json
//   GET  /stat       -> JSON con liste dei file raccolti
// Uso: node scripts/teachable-relay.mjs  [porta]  (default 8799)
// Riutilizzabile per ogni corso (SwiftUI Fundamentals incluso).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const PORT = Number(process.argv[2] || 8799);
const SAFE = /[^a-z0-9._-]+/gi;

const collectDir = path.join(process.env.TEMP || os.tmpdir(), 'opencode', 'collect');
fs.mkdirSync(collectDir, { recursive: true });

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const name = decodeURIComponent(req.url.replace(/^\/+|\/+$/g, '')) || 'root';
  if (req.method === 'GET') {
    if (name === 'stat') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ dir: collectDir, files: fs.readdirSync(collectDir) }));
      return;
    }
    const f = path.join(collectDir, (name + '.json').replace(SAFE, '_'));
    if (fs.existsSync(f)) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(fs.readFileSync(f));
      return;
    }
    res.writeHead(404); res.end('missing'); return;
  }
  if (req.method !== 'POST') { res.writeHead(405); res.end(); return; }
  const file = path.join(collectDir, (name + '.json').replace(SAFE, '_'));
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    try { fs.writeFileSync(file, Buffer.concat(chunks)); res.writeHead(200); res.end('saved'); }
    catch (e) { res.writeHead(500); res.end(String(e)); }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[relay] listening http://127.0.0.1:${PORT}/ -> ${collectDir}`);
});
