#!/usr/bin/env node
// Compares a built page with the prototype it was built from, state by state, and writes a report for the PR.
//
//   node compare.mjs <dir> [--prototype <name or link>] [--out report.md]
//
// <dir> holds prototype/<state>.json (from prototype.mjs) and build/<state>.json (from build_check.rb).
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const dir = path.resolve(argv.find((a, i) => !a.startsWith('--') && !String(argv[i - 1]).startsWith('--')) || '.');
const out = path.resolve(opt('--out', path.join(dir, 'build-check-report.md')));
const read = (sub) => { const d = path.join(dir, sub); return fs.existsSync(d) ? Object.fromEntries(fs.readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => [f, JSON.parse(fs.readFileSync(path.join(d, f), 'utf8'))])) : {}; };
const proto = read('prototype'), build = read('build');

// Pieces too small to judge a layout by, and regions that are the same on every page.
const ATOM = /^(IconComponent|SVGComponent|Admin::WithIconComponent|Admin::StyledComponent|Admin::AvatarComponent|CountPillComponent)$/;
const INSIDE = /(Admin::Table::(Builder|Table)Component|Vendor::Nav::Component|Admin::PrimaryNav::Component|Vendor::Header::UserMenuComponent|Admin::Form::Input::SelectComponent)$/;
const names = (c) => [c.name, c.inner].filter(Boolean);
const same = (a, b) => names(a).some((x) => names(b).includes(x));
const label = (c) => c.inner ? `\`${c.name}\` (renders \`${c.inner}\`)` : `\`${c.name}\``;

// The page's structure: components down to the table, nav and menus, without atoms, repeats collapsed.
function skeleton(list) {
  const outl = []; let cut = null;
  for (const c of list) {
    if (cut !== null && c.depth > cut) continue; cut = null;
    if (INSIDE.test(c.name) || INSIDE.test(c.inner || '')) cut = c.depth;
    if (ATOM.test(c.name)) continue;
    const prev = outl[outl.length - 1];
    if (prev && prev.depth === c.depth && same(prev, c)) { prev.n++; continue; }
    outl.push({ ...c, n: 1 });
  }
  return outl;
}

// Longest common subsequence, then a walk that pairs a removal and an addition at the same depth as a swap.
function diff(a, b) {
  const m = a.length, n = b.length, t = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) t[i][j] = same(a[i], b[j]) ? t[i + 1][j + 1] + 1 : Math.max(t[i + 1][j], t[i][j + 1]);
  const rows = []; let i = 0, j = 0;
  while (i < m || j < n) {
    if (i < m && j < n && same(a[i], b[j])) rows.push({ k: 'same', p: a[i++], b: b[j++] });
    else if (j < n && (i >= m || t[i][j + 1] >= t[i + 1][j])) rows.push({ k: 'build', b: b[j++] });
    else rows.push({ k: 'proto', p: a[i++] });
  }
  for (let r = 0; r < rows.length - 1; r++) {
    const x = rows[r], y = rows[r + 1];
    if (x.k === 'proto' && y.k === 'build' && x.p.depth === y.b.depth) { rows.splice(r, 2, { k: 'swap', p: x.p, b: y.b }); }
    else if (x.k === 'build' && y.k === 'proto' && x.b.depth === y.p.depth) { rows.splice(r, 2, { k: 'swap', p: y.p, b: x.b }); }
  }
  return rows;
}

// Interface words, with counts and data-like values (dates, names in tables) set aside.
const DATEY = /\b(\d{1,2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|Today|Tomorrow|Yesterday)\b/;
const norm = (t) => t.replace(/\d+/g, '#').replace(/[“”"]/g, '"');
function words(d) { return (d.copy || []).filter((c) => !(c.kind === 'column' && DATEY.test(c.text))).map((c) => ({ ...c, key: c.kind + '|' + norm(c.text) })); }

const lines = [];
const P = (s = '') => lines.push(s);
const states = [...new Set([...Object.keys(proto), ...Object.keys(build)])].sort();
P('# Build check'); P();
P(`Built page compared with the prototype${opt('--prototype') ? ` (${opt('--prototype')})` : ''}, state by state.`);
P('Components come from `data-component` markers: the kit sets them in the prototype; the build check sets them on every ViewComponent while the spec runs.'); P();

const summary = [];
for (const f of states) {
  const p = proto[f], b = build[f], id = (p || b).state;
  P(`## ${id}`); P();
  if (!p || !b) { P(`Only captured from the ${p ? 'prototype' : 'build'}.`); P(); summary.push([id, '–', '–', '–', '–', '–', '–']); continue; }

  const rows = diff(skeleton(p.components), skeleton(b.components));
  const changed = rows.filter((r) => r.k !== 'same');
  P('### Structure'); P();
  if (!changed.length) P('Same components in the same order.');
  else {
    P('| | Prototype | Build |'); P('|---|---|---|');
    for (const r of rows) {
      const ind = (c) => '&nbsp;&nbsp;'.repeat(c.depth) + label(c) + (c.n > 1 ? ` ×${c.n}` : '');
      if (r.k === 'same') P(`| = | ${ind(r.p)} | same |`);
      if (r.k === 'swap') P(`| **swapped** | ${ind(r.p)} | ${label(r.b)} |`);
      if (r.k === 'proto') P(`| **missing** | ${ind(r.p)} | |`);
      if (r.k === 'build') P(`| **added** | | ${ind(r.b)} |`);
    }
  }
  P();
  const proposed = p.components.filter((c) => c.name.startsWith('proposed:'));
  if (proposed.length) {
    P('**Proposed in the prototype:** ' + proposed.map((c) => '`' + c.name.slice(9) + '`').join(', ') + '. Check how each was built: as a new component, from existing ones, or as markup in a view.'); P();
  }

  P('### Markup written in views'); P();
  const be = b.bespoke || [];
  if (!be.length) P('None: everything on the page is a component.');
  else {
    P('Styled markup in a view rather than a component. Where the prototype used a component here, this is drift.'); P();
    P('| View | Element | Styles | Text |'); P('|---|---|---|---|');
    for (const x of be.slice(0, 25)) P(`| \`${x.file.replace(/^.*?app\//, 'app/')}\` | \`${x.tag}\` | \`${x.classes || '–'}\` | ${x.text || ''} |`);
    if (be.length > 25) P(`| … ${be.length - 25} more | | | |`);
  }
  P();

  P('### Words'); P();
  const pw = words(p), bw = words(b), bk = new Set(bw.map((w) => w.key)), pk = new Set(pw.map((w) => w.key));
  const lost = pw.filter((w) => !bk.has(w.key)), gained = bw.filter((w) => !pk.has(w.key));
  if (!lost.length && !gained.length) P('The same headings, buttons, labels and columns.');
  else {
    P('| Kind | Prototype | Build |'); P('|---|---|---|');
    for (const w of lost) { const g = gained.find((x) => x.kind === w.kind && !x.used); if (g) g.used = true; P(`| ${w.kind} | ${w.text} | ${g ? g.text : '**missing**'} |`); }
    for (const g of gained.filter((x) => !x.used)) P(`| ${g.kind} | **not in prototype** | ${g.text} |`);
  }
  P();

  P('### Writing guide and accessibility'); P();
  const pr = new Set((p.rules || []).map((r) => r.rule + '|' + r.text)), pa = new Set((p.a11y || []).map((a) => a.id));
  const br = b.rules || [], ba = b.a11y || [];
  if (!br.length && !ba.length) P('Nothing found.');
  else {
    P('"Also in prototype" usually means the problem comes from a shared component, not this build.'); P();
    P('| Check | Finding | Where | Also in prototype |'); P('|---|---|---|---|');
    for (const r of br) P(`| writing: ${r.rule} | ${r.text} | | ${pr.has(r.rule + '|' + r.text) ? 'yes' : 'no'} |`);
    for (const a of ba) P(`| a11y: ${a.id} (${a.impact}) | ${a.help} | \`${(a.nodes || []).join('`, `')}\` | ${pa.has(a.id) ? 'yes' : 'no'} |`);
  }
  P();
  summary.push([id, changed.filter((r) => r.k === 'swap').length, changed.filter((r) => r.k === 'proto').length, changed.filter((r) => r.k === 'build').length, be.length, lost.length + gained.filter((x) => !x.used).length, br.filter((r) => !pr.has(r.rule + '|' + r.text)).length + ba.filter((a) => !pa.has(a.id)).length]);
}

const head = ['# Build check', '', lines[2], lines[3], '', '| State | Swapped | Missing | Added | Markup in views | Words changed | New writing/a11y issues |', '|---|---|---|---|---|---|---|', ...summary.map((s) => `| ${s.join(' | ')} |`), ''];
fs.writeFileSync(out, [...head, ...lines.slice(5)].join('\n'));
console.log(`Wrote ${out}`);
