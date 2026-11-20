#!/usr/bin/env node
// Reads prototype states the same way build_check.rb reads the built page, for compare.mjs.
//
//   node prototype.mjs <prototype>/index.html --states id,id --out <dir> [--width 1440] [--no-a11y]
//
// Writes <out>/prototype/<state>.json. Needs Chrome (set CHROME if it isn't found).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const page = argv.find((a, i) => !a.startsWith('--') && !String(argv[i - 1]).startsWith('--'));
const states = (opt('--states') || '').split(',').filter(Boolean);
const out = path.resolve(opt('--out', 'build-check'), 'prototype');
if (!page || !states.length) { console.error('Usage: node prototype.mjs <prototype>/index.html --states id,id --out <dir>'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });

const chrome = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
if (!chrome) { console.error('Chrome not found. Set CHROME.'); process.exit(2); }
const here = path.dirname(fileURLToPath(import.meta.url));
const AXE = argv.includes('--no-a11y') ? '' : '<script src="https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js"></script>';
const RUN = `<script>${fs.readFileSync(path.join(here, 'outline.js'), 'utf8')}
window.addEventListener('load', function () { setTimeout(function () { window.__buildCheck().then(function (r) {
  var s = document.createElement('script'); s.type = 'application/json'; s.id = 'build-check'; s.textContent = JSON.stringify(r).replace(/</g, '\\\\u003c'); document.body.appendChild(s);
}); }, 2500); });</script>`;
const tmp = path.join(path.dirname(path.resolve(page)), `.build-check-${process.pid}.html`);
fs.writeFileSync(tmp, fs.readFileSync(page, 'utf8') + '\n' + AXE + '\n' + RUN + '\n');
process.on('exit', () => { try { fs.unlinkSync(tmp); } catch (e) {} });

for (const id of states) {
  const html = execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${opt('--width', 1440)},900`, '--virtual-time-budget=12000', '--dump-dom',
    `${pathToFileURL(tmp).href}?proto-bar=off#state=${encodeURIComponent(id)}`], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  const m = html.match(/<script[^>]*id="build-check"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) { console.warn(`  ${id}: nothing captured`); continue; }
  const data = JSON.parse(m[1]); data.state = id;
  fs.writeFileSync(path.join(out, id.replace(/[^\w-]+/g, '-') + '.json'), JSON.stringify(data, null, 1));
  console.log(`  ${id}: ${data.components.length} components, ${data.copy.length} copy items`);
}
