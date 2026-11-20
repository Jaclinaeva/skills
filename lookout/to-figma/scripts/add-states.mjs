#!/usr/bin/env node
// Makes a capture-ready copy of a prototype that isn't on the kit runtime, so the kit's capture.mjs can read it.
//
//   node add-states.mjs <prototype.html> <states.js> [--out <folder>]
//
// Writes <folder>/index.html: the prototype, then states-shim.js, then the states file. The original is not touched.
// Default folder: <states file's folder>/<states file's name without .js>. The folder's name becomes the prototype's
// name in Figma, so name it after the prototype.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const files = argv.filter((a, i) => !a.startsWith('--') && !String(argv[i - 1]).startsWith('--'));
if (files.length < 2) { console.error('Usage: node add-states.mjs <prototype.html> <states.js> [--out <folder>]'); process.exit(2); }
const [page, statesFile] = files.map((f) => path.resolve(f));
const out = path.resolve(opt('--out', path.join(path.dirname(statesFile), path.basename(statesFile, '.js'))));
const here = path.dirname(fileURLToPath(import.meta.url));

let html = fs.readFileSync(page, 'utf8');
const marked = (html.match(/data-component/g) || []).length;
if (!marked) console.warn('Warning: no data-component markers found. The builder can only draw this page, not place library components. Convert it with vibe-killer first.');
const add = '\n<script>\n' + fs.readFileSync(path.join(here, 'states-shim.js'), 'utf8') + '\n</script>\n<script>\n' + fs.readFileSync(statesFile, 'utf8') + '\n</script>\n';
// After the prototype's own scripts, so its actions exist. Before the last </body> if there is one.
const at = html.lastIndexOf('</body>');
html = at >= 0 ? html.slice(0, at) + add + html.slice(at) : html + add;
// Before the prototype's first script, so the link it was opened with is saved before anything can rewrite it.
const first = html.indexOf('<script');
const keep = '<script>window.__protoHash0 = location.hash;</script>\n';
html = first >= 0 ? html.slice(0, first) + keep + html.slice(first) : keep + html;
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('Wrote ' + path.join(out, 'index.html'));
