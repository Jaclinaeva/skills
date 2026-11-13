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
//   <script type="application/json" id="proto-stories">{"stories":[{"id":"U8","steps":[{"state":"…"}],"other":[{"state":"…"}]}]}</script>
//     the guide's user stories. Every state should belong to one, and every state a story names must exist.
//   Anything marked data-proto-ui is prototype chrome and is ignored.
//
// The catalog: { "generated": {…}, "components": { "Name": { args, required, positional, anyArgs, slots, tier } } }
//   tier is "ds" (in the design system) or "code". args null means the arguments couldn't be read.
//
// Accessibility and copy, checked in every state unless --no-qa (reported, never failed):
//   accessibility  axe-core's WCAG 2.2 AA rules, loaded from a pinned CDN address. Page-level rules about the
//                  prototype file itself (its <html lang>, <title>, skip links, viewport) are left out, and so is
//                  the app's own navigation (Admin::PrimaryNav, Vendor::Nav), which is the same on every page.
//   copy           visible text against the writing guide's confirmed rules and terminology table.
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

// ---------- accessibility and copy ----------
// Each state renders from a copy of the page with axe-core and a copy scan added at the end. Both run once the
// state has settled, and leave their findings in script#qa-results, which the marker checks ignore.
const QA = !flag('--no-qa');
const AXE = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js';
const wait = +opt('--wait', 5000);
const QA_SCRIPT = String.raw`
(function () {
  // The app's own navigation is the same on every page and isn't the prototype's design.
  var NAV = '[data-component="Admin::PrimaryNav::Component"], [data-component="Vendor::Nav::Component"]';
  var ACRONYMS = /^(NDIS|GST|ABN|ABNS|AUD|PDF|CSV|XLSX|SAH|HCP|CHSP|DVA|DEX|NSW|VIC|QLD|ACT|API|URL|ID|IDS|SMS|FAQ|AT-HM|PO|POS|TAX)$/;
  var CHECKS = [
    ['staffer', /[a-z,;] Staffers?\b/],
    ['member', /\bmembers?\b/],
    ['helper', /\bhelpers?\b/],
    ['term', /\b(patients?|residents?|customers?|carers?|staff members?|back office|web app)\b/i],
    ['term', /\bworkers?\b/],
    ['please', /\b(please|simply)\b/i],
    ['spelling', /\b(organiz\w*|colors?|centers?|prioritiz\w*|canceled|canceling|enroll|enrolls|catalogs?)\b/i],
    ['date', /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/],
    ['confirm', /\bare you sure\b/i]
  ];
  function hidden(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) { var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return true; }
    var r = el.getBoundingClientRect(); return r.width <= 1 && r.height <= 1;
  }
  function copy() {
    var app = document.querySelector('[data-component="Vendor::Layout::Component"]') ? 'portal' : 'admin', out = [], seen = {};
    function add(rule, text) { var k = rule + '|' + text; if (!seen[k]) { seen[k] = 1; out.push({ rule: rule, text: text.slice(0, 140) }); } }
    var walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (var n = walk.nextNode(); n; n = walk.nextNode()) {
      var el = n.parentElement, t = n.textContent.replace(/\s+/g, ' ').trim();
      if (!t || !el || el.closest('script,style,[data-proto-ui]') || el.closest(NAV) || hidden(el)) continue;
      if (getComputedStyle(el).textTransform === 'uppercase') add('uppercase', t);
      (t.match(/(?<![\w-])[A-Z]{4,}(?![\w-])/g) || []).forEach(function (w) { if (!ACRONYMS.test(w)) add('allcaps', t); });
      CHECKS.forEach(function (c) { if (c[1].test(t)) add(c[0], t); });
      if (app === 'admin' && /\bjobs?\b/i.test(t)) add('visit-job', t);
      if (app === 'admin' && /\bclients?\b/i.test(t)) add('term', t); // the supplier portal rightly says client
      if (app === 'portal' && /\bvisits?\b/i.test(t)) add('visit-job', t);
    }
    document.querySelectorAll('button, a, [data-component$="ButtonComponent"]').forEach(function (b) {
      if (b.closest('[data-proto-ui]') || b.closest(NAV)) return; var t = b.textContent.replace(/\s+/g, ' ').trim();
      if (/^(submit|ok|yes|no|click here)$/i.test(t)) add('button', t);
    });
    document.querySelectorAll('h1, h2, h3, h4, [data-component="Admin::HeadingComponent"]').forEach(function (h) {
      if (h.closest('[data-proto-ui]') || hidden(h)) return; var t = h.textContent.replace(/\s+/g, ' ').trim(), words = t.split(' ').slice(1).filter(function (w) { return /^[A-Za-z]{4,}$/.test(w); });
      if (words.length >= 2 && words.every(function (w) { return /^[A-Z]/.test(w); })) add('title-case', t);
    });
    return out;
  }
  function write(o) { var s = document.createElement('script'); s.type = 'application/json'; s.id = 'qa-results'; s.textContent = JSON.stringify(o).replace(/</g, '\\u003c'); document.body.appendChild(s); }
  function run() {
    var res = { copy: [], a11y: null };
    try { res.copy = copy(); } catch (e) { res.copyError = String(e); }
    if (!window.axe) { res.a11yError = 'axe-core did not load'; return write(res); }
    window.axe.run({ exclude: [['[data-proto-ui]'], ['[data-component="Admin::PrimaryNav::Component"]'], ['[data-component="Vendor::Nav::Component"]']] }, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      rules: { 'html-has-lang': { enabled: false }, 'document-title': { enabled: false }, 'bypass': { enabled: false }, 'meta-viewport': { enabled: false } },
      resultTypes: ['violations']
    }).then(function (r) {
      res.a11y = r.violations.map(function (v) { return { id: v.id, impact: v.impact, help: v.help, url: v.helpUrl, count: v.nodes.length, nodes: v.nodes.slice(0, 3).map(function (x) { return { target: x.target.join(' '), html: x.html.slice(0, 160) }; }) }; });
      write(res);
    }, function (e) { res.a11yError = String(e); write(res); });
  }
  window.addEventListener('load', function () { setTimeout(run, __DELAY__); });
})();`.replace('__DELAY__', String(Math.max(1500, wait - 2500)));
const qaFile = path.join(path.dirname(path.resolve(page)), `.drift-qa-${process.pid}.html`);
let qaBase = base;
if (QA) {
  fs.writeFileSync(qaFile, fs.readFileSync(page, 'utf8') + `\n<script src="${AXE}"></script>\n<script>${QA_SCRIPT}</script>\n`);
  qaBase = pathToFileURL(qaFile).href;
  if (!flag('--keep-qa')) process.on('exit', () => { try { fs.unlinkSync(qaFile); } catch (e) {} });
}
const qaFlags = ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${width},900`, `--virtual-time-budget=${wait + 8000}`];
const render = (hash) => QA ? execFileSync(chrome, [...qaFlags, '--dump-dom', qaBase + hash], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }) : dump(base + hash);
const qaOf = (html) => { const m = html.match(/<script[^>]*id="qa-results"[^>]*>([\s\S]*?)<\/script>/); try { return m ? JSON.parse(m[1]) : null; } catch (e) { return null; } }; // script text is never entity-encoded

// ---------- run ----------
console.log('Rendering the page as it loads…');
const first = render('');
let states = statesFrom(first);
const runs = [{ id: null, label: 'As it loads', html: first }];
if (states) for (const s of states) { process.stdout.write(`  ${s.id}\n`); runs.push({ id: s.id, label: s.label || s.id, marker: s.marker, html: render(`#state=${encodeURIComponent(s.id)}`) }); }
else add('warning', 'states', 'No states list (script#proto-states), so only the page as it loads was checked', null);

// The guide's stories: every state belongs to one, and every state a story names exists.
const storiesM = first.match(/<script[^>]*id="proto-stories"[^>]*>([\s\S]*?)<\/script>/);
let stories = null; try { stories = storiesM ? JSON.parse(ent(storiesM[1])).stories : null; } catch (e) { add('error', 'stories', 'script#proto-stories isn\'t valid JSON', null); }
if (stories && states) {
  const ids = new Set(states.map((s) => s.id)), used = new Set();
  for (const st of stories) for (const g of [...(st.steps || []), ...(st.other || [])]) {
    used.add(g.state);
    if (!ids.has(g.state)) add('error', 'stories', `Story ${st.id} names a state that doesn't exist: ${g.state}`, st.id);
  }
  for (const s of states) if (!used.has(s.id)) add('warning', 'stories', `State ${s.id} isn't in any story, so the guide lists it under "Not in a story yet"`, s.id);
}

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

// Accessibility and copy findings, merged across states.
const COPY_RULES = {
  uppercase: 'Uppercase text. Never uppercase, not even small headings',
  allcaps: 'A word in capitals. Never uppercase; acronyms are fine',
  staffer: '"Staffer" capitalised mid-sentence. It\'s lowercase unless it starts a sentence',
  member: '"member" in lowercase. Member always has a capital M',
  helper: '"helper" in lowercase. Helper always has a capital H',
  term: 'A term the writing guide says not to use (client, patient, carer, worker, staff member…)',
  please: '"please" or "simply"',
  spelling: 'US spelling. Use Australian English',
  date: 'Month-first date. Write 10 Nov 2026',
  'visit-job': '"job" in Admin, or "visit" in the supplier portal. Admin says visit; the supplier portal says job',
  confirm: '"Are you sure". State the consequence instead',
  button: 'A vague button label. Say what happens',
  'title-case': 'A heading in title case. Use sentence case'
};
const a11y = new Map(), copyFound = new Map(), qaMissing = [];
if (QA) for (const r of runs) {
  const where = r.id || '(as it loads)', q = qaOf(r.html);
  if (!q) { qaMissing.push(where); continue; }
  if (q.a11yError) qaMissing.push(where + ' (' + q.a11yError + ')');
  for (const v of q.a11y || []) {
    const e = a11y.get(v.id) || { ...v, total: 0, states: [] };
    e.total += v.count; e.states.push(where); a11y.set(v.id, e);
  }
  for (const c of q.copy || []) {
    const k = c.rule + '|' + c.text, e = copyFound.get(k) || { ...c, states: [] };
    e.states.push(where); copyFound.set(k, e);
  }
}
const IMPACT = { critical: 0, serious: 1, moderate: 2, minor: 3 };
const a11yList = [...a11y.values()].sort((a, b) => (IMPACT[a.impact] ?? 4) - (IMPACT[b.impact] ?? 4) || b.states.length - a.states.length);
const copyList = [...copyFound.values()].sort((a, b) => Object.keys(COPY_RULES).indexOf(a.rule) - Object.keys(COPY_RULES).indexOf(b.rule));
const statesTxt = (s) => s.length > 3 ? s.slice(0, 3).join(', ') + ` and ${s.length - 3} more` : s.join(', ');
const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

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
  accessibility: QA ? { checker: 'axe-core 4.10.2, WCAG 2.2 AA rules', findings: a11yList, notChecked: qaMissing } : null,
  copy: QA ? { findings: copyList } : null,
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
  ...(QA ? [
    '## Accessibility', '',
    'Reported, not failed. axe-core 4.10.2 with its WCAG 2.2 AA rules, on every state, leaving out the prototype bar, the app\'s own navigation and rules about the prototype file itself. Some findings come from the components themselves; they belong to the component, not the prototype. Automated checks find about a third of accessibility problems: keyboard use, focus order and screen reader sense still need a person.', '',
    ...(a11yList.length ? ['| Rule | Impact | Elements | States | Example |', '|---|---|---|---|---|',
      ...a11yList.map((v) => `| [${v.id}](${v.url}): ${cell(v.help)} | ${v.impact || ''} | ${v.total} | ${statesTxt(v.states)} | \`${cell(v.nodes[0] ? v.nodes[0].target : '')}\` |`)] : ['No findings.']),
    ...(qaMissing.length ? ['', `Not checked in: ${statesTxt(qaMissing)}.`] : []), '',
    '## Copy', '',
    'Reported, not failed. Visible text, outside the app\'s own navigation, checked against the writing guide\'s confirmed rules and terminology. Each is a prompt to look, not a verdict: "member" may be right in "team member", and a quoted word may be fine.', '',
    ...(copyList.length ? ['| Rule | Text | States |', '|---|---|---|',
      ...copyList.map((c) => `| ${cell(COPY_RULES[c.rule] || c.rule)} | ${cell(c.text)} | ${statesTxt(c.states)} |`)] : ['No findings.']), ''
  ] : []),
  '## Not checked', '',
  '- Components with no marker at all: the check reads markers, it can\'t see unmarked components.',
  '- Prop values (only prop names), and styling props a component passes through.',
  `- Widths other than ${width}px.`, ''
].join('\n');
fs.writeFileSync(path.join(out, 'drift-report.md'), md);
console.log(`${report.passed ? 'Passed' : 'Failed'}: ${errors.length} errors, ${warnings.length} warnings.` +
  (QA ? ` Accessibility: ${a11yList.length} rules flagged${qaMissing.length ? `, ${qaMissing.length} states not checked` : ''}. Copy: ${copyList.length} to look at.` : '') +
  ` Report: ${path.join(out, 'drift-report.md')}`);
process.exit(report.passed ? 0 : 1);
