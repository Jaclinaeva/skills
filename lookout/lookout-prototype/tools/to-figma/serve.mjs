#!/usr/bin/env node
// Serves a capture (from capture.mjs) plus build.js and map.json to Figma, on localhost only.
//
//   node serve.mjs <export dir> [--port 9231]
//
// The figma-console bridge plugin may fetch from localhost ports 9224–9232. Leave this running while
// building, then stop it.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const dir = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--port');
const port = argv.includes('--port') ? +argv[argv.indexOf('--port') + 1] : 9231;
if (!dir) { console.error('Usage: node serve.mjs <export dir> [--port 9231]'); process.exit(2); }
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir);
const own = { '/build.js': path.join(here, 'build.js'), '/map.json': path.join(here, 'map.json'), '/codematched.js': path.join(here, 'codematched.js'), '/diff.js': path.join(here, 'diff.js') };

// POST /save/<name>.json lets the Figma side write what it read from the library (for example the
// component and icon keys) into tools/to-figma/library/, so map.json can be refreshed without retyping keys.
const libDir = path.join(here, 'library');
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.end();
  const save = req.method === 'POST' && req.url.match(/^\/save\/([\w-]+\.json)$/);
  if (save) { let body = ''; req.on('data', (d) => { body += d; }); req.on('end', () => { try { JSON.parse(body); fs.mkdirSync(libDir, { recursive: true }); fs.writeFileSync(path.join(libDir, save[1]), body); res.end('saved'); } catch (e) { res.statusCode = 400; res.end('bad json'); } }); return; }
  if (req.url.startsWith('/library/')) { const lf = path.join(libDir, path.basename(req.url.split('?')[0])); return fs.readFile(lf, (err, data) => { if (err) { res.statusCode = 404; return res.end('not found'); } res.setHeader('Content-Type', 'application/json'); res.end(data); }); }
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = own[url] || path.join(root, path.normalize(url).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(root) && !Object.values(own).includes(file)) { res.statusCode = 403; return res.end('no'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.statusCode = 404; return res.end('not found'); }
    res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : 'text/javascript');
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`Serving ${root} on http://localhost:${port}`));
