#!/usr/bin/env node
// vibe-killer drift check. Renders a marked prototype in headless Chrome, state by state, and checks every
// component marker against a catalog of the design system's components.
//
//   node drift-check.mjs <page.html> --catalog <catalog.json> [--out <dir>] [--width 1280] [--shots] [--strict]
//
// Needs Node 18+ and Chrome or Chromium (set CHROME to its path if it isn't found).
//
// The page:
//   data-component="Name"        on every component's root; "proposed:Name" for a gap
//   data-props='{"key":value}'   constructor arguments only
//   data-slots='["left"]'        slots the instance fills
//   data-tier="code"|"proposed"  absent for a component in the design system
//   data-state="region:state"    on the region each state changes
//   <script type="application/json" id="proto-states">[{"id":"region:state","label":"…","marker":"region:state"}]</script>
//     lists the states; each opens at <page>#state=<id>. With "marker", that state must render data-state="<marker>".
//     States can take a while to open (a page that replays steps on load); --wait sets the render budget in ms. Without it, only the page as it loads is checked.
//   Anything marked data-proto-ui is prototype chrome and is ignored.
//
// The catalog: { "generated": {…}, "components": { "Name": { args, required, positional, anyArgs, slots, tier } } }
//   tier is "ds" (in the design system) or "code". args null means the arguments couldn't be read.
//
// Writes <out>/drift-report.md and drift-report.json. Exits 1 when there are errors (or warnings, with --strict).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const page = argv.find((a, i) => !a.startsWith('--') && !['--catalog', '--out', '--width', '--wait'].includes(argv[i - 1]));
const catalogPath = opt('--catalog');
if (!page || !catalogPath) { console.error('Usage: node drift-check.mjs <page.html> --catalog <catalog.json> [--out dir] [--width 1280] [--shots] [--strict]'); process.exit(2); }
const width = +opt('--width', 1280);
const out = path.resolve(opt('--out', path.join(path.dirname(page), 'drift-check')));
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const C = catalog.components;
fs.mkdirSync(out, { recursive: true });

// ---------- Chrome ----------
function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const c = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'];
  const hit = c.find((p) => fs.existsSync(p));
  if (!hit) { console.error('Chrome not found. Set CHROME to its path.'); process.exit(2); }
  return hit;
}
const chrome = findChrome();
const base = pathToFileURL(path.resolve(page)).href;
const flags = ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${width},900`, `--virtual-time-budget=${opt('--wait', 5000)}`];
const dump = (url) => execFileSync(chrome, [...flags, '--dump-dom', url], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const shot = (url, file) => execFileSync(chrome, [...flags, `--screenshot=${file}`, url], { stdio: 'ignore' });

// ---------- parsing ----------
const ent = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attr = (tag, name) => { const m = tag.match(new RegExp('\\s' + name + '=(?:"([^"]*)"|\'([^\']*)\')')); return m ? ent(m[1] != null ? m[1] : m[2]) : null; };
const noScripts = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
function markers(html) {
  const list = [];
  for (const m of noScripts(html).matchAll(/<[a-zA-Z][\w-]*\s[^>]*?data-component=[^>]*>/g)) {
    const tag = m[0];
    list.push({ name: attr(tag, 'data-component'), props: attr(tag, 'data-props'), slots: attr(tag, 'data-slots'), tier: attr(tag, 'data-tier'), note: attr(tag, 'data-note') });
  }
  return list;
}
function statesFrom(html) {
  const m = html.match(/<script[^>]*id="proto-states"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(ent(m[1])); } catch (e) { return null; }
}
function styling(html) {
  const body = noScripts(html);
  const markup = body.replace(/<style\b[\s\S]*?<\/style>/gi, '');
  const inline = [...markup.matchAll(/\sstyle="([^"]*)"/g)].map((m) => m[1]).filter((s) => s.trim());
  const hex = [...markup.replace(/<svg\b[\s\S]*?<\/svg>/gi, '').matchAll(/<[^>]*?(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))[^>]*>/g)].map((m) => m[1]);
  const arbitrary = new Set();
  for (const m of markup.matchAll(/\sclass="([^"]*)"/g)) for (const t of m[1].split(/\s+/)) if (/\[[^\]]+\]/.test(t)) arbitrary.add(t);
  return { inline, hex, arbitrary: [...arbitrary] };
}
const hash = (html) => crypto.createHash('sha1').update(noScripts(html).replace(/<div[^>]*data-proto-ui[\s\S]*$/, '')).digest('hex');

// ---------- checks ----------
const issues = [];
const add = (level, kind, msg, where) => issues.push({ level, kind, msg, where });
function checkMarker(m, where) {
  if (!m.name) { add('error', 'marker', 'A data-component with no name', where); return; }
  if (m.name.startsWith('proposed:')) {
    if (m.tier !== 'proposed') add('error', 'tier', `${m.name} should have data-tier="proposed"`, where);
    if (!m.note) add('warning', 'note', `${m.name} has no data-note saying what it's for`, where);
    return;
  }
  const c = C[m.name];
  if (!c) { add('error', 'name', `${m.name} isn't in the catalog`, where); return; }
  const want = c.tier === 'ds' ? null : 'code';
  if ((m.tier || null) !== want) add('error', 'tier', `${m.name} is ${c.tier === 'ds' ? 'in the design system (no data-tier)' : 'code only (data-tier="code")'}, but is marked ${m.tier ? `"${m.tier}"` : 'as in the design system'}`, where);
  let props = {};
  if (m.props) { try { props = JSON.parse(m.props); } catch (e) { add('error', 'props', `${m.name} has data-props that aren't valid JSON`, where); } }
  let slots = [];
  if (m.slots) { try { slots = JSON.parse(m.slots); } catch (e) { add('error', 'slots', `${m.name} has data-slots that aren't a JSON list`, where); } }
  for (const k of Object.keys(props)) {
    if (c.slots.includes(k)) add('error', 'slot-as-prop', `${m.name}: "${k}" is a slot, not an argument. Move it to data-slots`, where);
    else if (c.positional.includes(k)) continue;
    else if (c.args && !c.args.includes(k) && !c.anyArgs) add('error', 'props', `${m.name} has no argument "${k}"`, where);
  }
  for (const s of slots) if (!c.slots.includes(s)) add('error', 'slots', `${m.name} has no slot "${s}"`, where);
  for (const r of c.required || []) if (!(r in props)) add('warning', 'required', `${m.name} needs "${r}"; fine if it's a record the prototype fakes`, where);
  if (c.args === null) add('info', 'unchecked', `${m.name}: its arguments couldn't be read from source, so its props weren't checked`, where);
}

// ---------- run ----------
console.log('Rendering the page as it loads…');
const first = dump(base);
let states = statesFrom(first);
const runs = [{ id: null, label: 'As it loads', html: first }];
if (states) for (const s of states) { process.stdout.write(`  ${s.id}\n`); runs.push({ id: s.id, label: s.label || s.id, marker: s.marker, html: dump(`${base}#state=${encodeURIComponent(s.id)}`) }); }
else add('warning', 'states', 'No states list (script#proto-states), so only the page as it loads was checked', null);

const seen = new Map(), names = {};
for (const r of runs) {
  const where = r.id || '(as it loads)';
  const ms = markers(r.html);
  r.count = ms.length;
  for (const m of ms) { checkMarker(m, where); names[m.name] = (names[m.name] || 0) + 1; }
  if (r.id) {
    if (r.marker && !noScripts(r.html).includes(`data-state="${r.marker}"`)) add('error', 'state', `State ${r.id} renders no element with data-state="${r.marker}"`, r.id);
    const h = hash(r.html);
    if (seen.has(h)) add('error', 'state', `States ${seen.get(h)} and ${r.id} render the same page`, r.id); else seen.set(h, r.id);
  }
  if (flag('--shots')) { fs.mkdirSync(path.join(out, 'shots'), { recursive: true }); shot(`${base}?proto-bar=off${r.id ? '#state=' + encodeURIComponent(r.id) : ''}`, path.join(out, 'shots', `${(r.id || 'default').replace(/[^\w-]+/g, '-')}-${width}.png`)); }
}

// One-off styling: reported, never an error.
const st = { inline: new Set(), hex: new Set(), arbitrary: new Set(), cssRules: new Set() };
for (const r of runs) { const s = styling(r.html); for (const k of Object.keys(s)) s[k].forEach((v) => st[k].add(v)); }
// CSS the page itself writes, from the source file (the rendered DOM also holds the framework's generated CSS).
// Rules for prototype chrome (selectors naming ds- or proto-) are left out.
const src = fs.readFileSync(page, 'utf8').replace(/<script\b[\s\S]*?<\/script>/gi, '');
const css = [...src.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
for (const rule of css.match(/[^{}]+\{[^{}]*\}/g) || []) { const sel = rule.split('{')[0].trim(); if (!/ds-|proto-|@media|@keyframes/.test(sel)) st.cssRules.add(sel); }

// Merge identical issues across states.
const merged = new Map();
for (const i of issues) { const k = i.level + '|' + i.msg; if (!merged.has(k)) merged.set(k, { ...i, where: [] }); if (i.where && !merged.get(k).where.includes(i.where)) merged.get(k).where.push(i.where); }
const list = [...merged.values()];
const errors = list.filter((i) => i.level === 'error'), warnings = list.filter((i) => i.level === 'warning');

const report = {
  page: path.resolve(page), checkedAt: new Date().toISOString(), width, catalog: catalog.generated,
  states: runs.map((r) => ({ id: r.id, label: r.label, markers: r.count })),
  components: names, errors, warnings, info: list.filter((i) => i.level === 'info'),
  styling: { inlineStyles: [...st.inline], colours: [...st.hex], arbitraryValues: [...st.arbitrary], cssRules: [...st.cssRules] },
  passed: errors.length === 0 && (!flag('--strict') || warnings.length === 0)
};
fs.writeFileSync(path.join(out, 'drift-report.json'), JSON.stringify(report, null, 1));

const where = (i) => i.where.length ? ` (${i.where.length > 3 ? i.where.slice(0, 3).join(', ') + ` and ${i.where.length - 3} more` : i.where.join(', ')})` : '';
const md = [
  `# Drift check: ${path.basename(page)}`, '',
  `**${report.passed ? 'Passed' : 'Failed'}** · ${errors.length} errors · ${warnings.length} warnings · checked ${report.checkedAt.slice(0, 10)} at ${width}px against ${catalog.generated?.source || 'the catalog'}`, '',
  '| Check | Result |', '|---|---|',
  `| States rendered | ${runs.length - 1} listed, plus the page as it loads |`,
  `| Component markers | ${runs.reduce((a, r) => a + r.count, 0)}, ${Object.keys(names).length} names |`,
  `| Names in the catalog | ${Object.keys(names).filter((n) => n.startsWith('proposed:') || C[n]).length} of ${Object.keys(names).length} |`,
  `| Proposed | ${Object.keys(names).filter((n) => n.startsWith('proposed:')).length} |`, '',
  '## Errors', '', ...(errors.length ? errors.map((i) => `- **${i.kind}:** ${i.msg}${where(i)}`) : ['None.']), '',
  '## Warnings', '', ...(warnings.length ? warnings.map((i) => `- **${i.kind}:** ${i.msg}${where(i)}`) : ['None.']), '',
  '## One-off styling', '',
  'Reported, not failed. Some arbitrary values are copied from the components themselves; the rest are the prototype\'s own.', '',
  '| Kind | Count | Examples |', '|---|---|---|',
  `| Inline \`style\` attributes | ${st.inline.size} | ${[...st.inline].slice(0, 3).map((s) => '`' + s.slice(0, 40) + '`').join(', ')} |`,
  `| Colours in markup | ${st.hex.size} | ${[...st.hex].slice(0, 5).map((s) => '`' + s + '`').join(', ')} |`,
  `| Arbitrary Tailwind values | ${st.arbitrary.size} | ${[...st.arbitrary].slice(0, 5).map((s) => '`' + s + '`').join(', ')} |`,
  `| CSS rules in \`<style>\` | ${st.cssRules.size} | ${[...st.cssRules].slice(0, 5).map((s) => '`' + s.slice(0, 40) + '`').join(', ')} |`, '',
  '## Not checked', '',
  '- Components with no marker at all: the check reads markers, it can\'t see unmarked components.',
  '- Prop values (only prop names), and styling props a component passes through.',
  `- Widths other than ${width}px.`, ''
].join('\n');
fs.writeFileSync(path.join(out, 'drift-report.md'), md);
console.log(`${report.passed ? 'Passed' : 'Failed'}: ${errors.length} errors, ${warnings.length} warnings. Report: ${path.join(out, 'drift-report.md')}`);
process.exit(report.passed ? 0 : 1);
