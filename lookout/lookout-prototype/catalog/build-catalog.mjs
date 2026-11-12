#!/usr/bin/env node
// Builds catalog.json, the list of Lookout ViewComponents that vibe-killer's drift check reads.
//
//   node build-catalog.mjs <path to the Lookout repo> [--out catalog.json]
//
// For each *_component.rb under app/components and app/mounts/*/components it records:
//   args      keyword arguments of the component's own initialize (null when it has none of its own and no known parent)
//   required  keyword arguments with no default
//   positional  positional arguments (they can't appear in data-props by name)
//   anyArgs   true when initialize takes **kwargs, so extra keys pass through as HTML attributes
//   slots     renders_one / renders_many names
//   tier      "ds" when ds-components.txt lists it, else "code"
// Run it whenever Lookout's components change, by someone with the repo. Designers never need to.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const repo = args.find((a) => !a.startsWith('--'));
if (!repo) { console.error('Usage: node build-catalog.mjs <lookout repo> [--out catalog.json]'); process.exit(1); }
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? args[outIdx + 1] : path.join(here, 'catalog.json');
const ds = new Set(fs.readFileSync(path.join(here, 'ds-components.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean));

// Component files, leaving out the lighthouse mount.
function walk(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc); else if (/(^|_)component\.rb$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const roots = [path.join(repo, 'app/components')];
const mounts = path.join(repo, 'app/mounts');
if (fs.existsSync(mounts)) for (const m of fs.readdirSync(mounts)) if (m !== 'lighthouse') roots.push(path.join(mounts, m, 'components'));
const files = roots.flatMap((r) => walk(r, []).map((f) => ({ f, root: r })));

const camel = (s) => s.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');

// Split a parameter list on top-level commas.
function splitParams(s) {
  const parts = []; let depth = 0, cur = '', q = null;
  for (const ch of s) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if ('([{'.includes(ch)) depth++;
    if (')]}'.includes(ch)) depth--;
    if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function parseFile({ f, root }) {
  const rel = path.relative(root, f).replace(/\.rb$/, '');
  const name = rel.split(path.sep).map(camel).join('::');
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const base = name.split('::').pop();
  // The component's own class line, and its indent.
  let ci = -1, indent = 0, parent = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(\s*)class\s+([A-Z]\w*)\s*(?:<\s*([\w:]+))?/);
    if (m && m[2] === base) { ci = i; indent = m[1].length; parent = m[3] || null; break; }
  }
  if (ci < 0) return null;
  const inner = ' '.repeat(indent + 2);
  // Styled components take their styling props (variant, color, styles, …) through **props, so extra keys are allowed.
  const styled = /Styled::(Base|Container)/.test(parent || '') || lines.some((l) => /include\s+ViewComponentExtras::Styled/.test(l));
  const entry = { file: path.relative(repo, f), parent, styled, args: null, required: [], positional: [], anyArgs: false, slots: [], tier: ds.has(name) ? 'ds' : 'code' };
  for (let i = ci + 1; i < lines.length; i++) {
    const line = lines[i];
    if (new RegExp('^\\s{0,' + indent + '}end\\b').test(line)) break; // the class closed
    if (!line.startsWith(inner) || line.startsWith(inner + ' ')) continue; // only the class's own level
    const slot = line.match(/^\s*renders_(?:one|many)\s+:(\w+)/);
    if (slot) { entry.slots.push(slot[1]); continue; }
    if (/^\s*def initialize\b/.test(line)) {
      let text = line.replace(/^\s*def initialize/, '');
      let j = i;
      if (text.trim().startsWith('(')) { while (!balanced(text) && j + 1 < lines.length) text += '\n' + lines[++j]; text = text.trim().slice(1, closeAt(text.trim())); }
      else text = text.trim();
      entry.args = [];
      for (const p of splitParams(text.replace(/#[^\n]*/g, ''))) {
        if (!p) continue;
        if (p.startsWith('**')) { entry.anyArgs = true; continue; }
        if (p.startsWith('*') || p.startsWith('&')) continue;
        const kw = p.match(/^(\w+):\s*(.*)$/s);
        if (kw) { entry.args.push(kw[1]); if (!kw[2].trim()) entry.required.push(kw[1]); continue; }
        const pos = p.match(/^(\w+)/); if (pos) entry.positional.push(pos[1]);
      }
    }
  }
  return [name, entry];
}
function balanced(t) { let d = 0, seen = false; for (const c of t) { if (c === '(') { d++; seen = true; } if (c === ')') d--; } return seen && d === 0; }
function closeAt(t) { let d = 0; for (let i = 0; i < t.length; i++) { if (t[i] === '(') d++; if (t[i] === ')') { d--; if (d === 0) return i; } } return t.length; }

const components = {};
for (const x of files) { const r = parseFile(x); if (r) components[r[0]] = r[1]; }
// A component with no initialize of its own takes its parent's arguments, when the parent is in the catalog.
for (const [name, c] of Object.entries(components)) {
  let p = c.parent, guard = 0;
  while (c.args === null && p && guard++ < 5) {
    const parentName = components[p] ? p : components[name.split('::').slice(0, -1).concat(p).join('::')] ? name.split('::').slice(0, -1).concat(p).join('::') : null;
    if (!parentName) break;
    const pc = components[parentName];
    if (pc.styled) c.styled = true;
    if (pc.args !== null) { c.args = pc.args; c.required = pc.required; c.positional = pc.positional; c.anyArgs = pc.anyArgs; c.inheritedFrom = parentName; }
    c.slots = [...new Set(c.slots.concat(pc.slots))];
    p = pc.parent;
  }
}
for (const c of Object.values(components)) if (c.styled) { c.anyArgs = true; if (c.args === null) c.args = []; }
for (const n of ds) if (!components[n]) console.warn('In ds-components.txt but not found in code:', n);

let commit = null;
try { commit = execFileSync('git', ['-C', repo, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (e) {}
const catalog = { generated: { at: new Date().toISOString(), source: commit ? `lookout@${commit}` : path.basename(path.resolve(repo)), components: Object.keys(components).length }, components };
fs.writeFileSync(out, JSON.stringify(catalog, null, 1));
console.log(`Wrote ${out}: ${Object.keys(components).length} components, ${[...ds].filter((n) => components[n]).length} in the design system`);
