#!/usr/bin/env node
// Generates the parts of a handover pack that must never be typed by hand: the component table, the screens, the
// stories and states (or, with no stories, the states), and the copy. Reads them from the frozen prototype, state by
// state. Also writes components-by-state.json: every state's screen and components with their prop values and slots,
// which the engineer's prototype-to-code skill compares with the real views.
//
//   node handover-tables.mjs <handover dir> [--width 1280]
//
// The handover dir holds prototype.html and drift-check/shots/ (from the drift check's --shots, same width).
// If HANDOVER.md has the markers from templates/handover.md, it fills them in place, so it can be re-run:
//   <!-- generated:components --> … <!-- /generated -->   and the same for screens, stories and copy
// Without HANDOVER.md (or its markers) it writes the three parts to generated.md instead.
// Needs Node 18+ and Chrome (set CHROME if it isn't found).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const dirArg = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--width');
if (!dirArg) { console.error('Usage: node handover-tables.mjs <handover dir> [--width 1280]'); process.exit(2); }
const width = argv.includes('--width') ? +argv[argv.indexOf('--width') + 1] : 1280;
const dir = path.resolve(dirArg);
const page = path.join(dir, 'prototype.html');
if (!fs.existsSync(page)) { console.error('No prototype.html in ' + dir + '. Freeze the prototype first.'); process.exit(2); }

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const c = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium'];
  const hit = c.find((p) => fs.existsSync(p)); if (!hit) { console.error('Chrome not found. Set CHROME.'); process.exit(2); } return hit;
}
const chrome = findChrome();
const dump = (hash) => execFileSync(chrome, ['--headless=new', '--disable-gpu', `--window-size=${width},900`, '--virtual-time-budget=6000', '--dump-dom', pathToFileURL(page).href + '?proto-bar=off' + hash], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const ent = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const attr = (tag, n) => { const m = tag.match(new RegExp('\\s' + n + '=(?:"([^"]*)"|\'([^\']*)\')')); return m ? ent(m[1] != null ? m[1] : m[2]) : null; };
const script = (html, id) => { const m = html.match(new RegExp('<script[^>]*id="' + id + '"[^>]*>([\\s\\S]*?)</script>')); try { return m ? JSON.parse(ent(m[1])) : null; } catch (e) { return null; } };
// The design: #app and anything fixed on top of it, without scripts, styles, drawn icons or the prototype bar.
function design(html) {
  const a = html.indexOf('<div id="app"'); let b = html.indexOf('<div id="ds-legend"', a); if (b < 0) b = html.length;
  return html.slice(a < 0 ? 0 : a, b).replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<svg\b[\s\S]*?<\/svg>/gi, '');
}
// The app's own navigation isn't the feature's copy.
const NAVS = /<nav [^>]*data-component="(Admin::PrimaryNav::Component|Vendor::Nav::Component)"[\s\S]*?<\/nav>/g;
function texts(html) {
  return html.replace(NAVS, '').replace(/<input\b[^>]*placeholder="([^"]*)"[^>]*>/g, '\u0000$1\u0000').replace(/<[^>]+>/g, '\u0000').split('\u0000')
    .map((x) => ent(x).replace(/\s+/g, ' ').trim()).filter((x) => x && !/^[\d$.,:%\-–+/ ]+$/.test(x));
}

console.log('Rendering the page as it loads…');
const first = dump('');
const states = script(first, 'proto-states') || [];
const storyData = script(first, 'proto-stories');
const stories = storyData ? storyData.stories || [] : [];
const notDesigned = script(first, 'proto-not-designed') || [];
const comps = {}, copy = [], seen = new Set(), byState = {};
const strip = (h) => ent(h.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
// The screen a state shows: which app, the page's title, and the panel or modal open on top, if any.
function screenOf(html) {
  const app = html.includes('data-component="Vendor::Layout::Component"') ? 'Supplier portal' : html.includes('data-component="Admin::PrimaryNav::Component"') ? 'Admin' : 'Page';
  const after = (marker, tags) => { const i = html.indexOf(marker); if (i < 0) return null; const m = html.slice(i).match(new RegExp('<(' + tags + ')\\b[^>]*>([\\s\\S]*?)</\\1>')); return m ? strip(m[2]) : null; };
  const title = after('data-component="Admin::HeaderComponent"', 'h1|h2') || after('data-component="Vendor::Layout::TabbedPageComponent"', 'h1') || after('<main', 'h1|h2') || '';
  const panel = after('role="dialog"', 'h3|h2');
  return { app: app, title: title, panel: panel };
}
for (const s of [{ id: null }].concat(states)) {
  if (s.id) process.stdout.write(`  ${s.id}\n`);
  const html = design(s.id ? dump('#state=' + encodeURIComponent(s.id)) : first);
  // Marks the app's own navigation, so the per-state list leaves it out.
  const navRanges = [...html.matchAll(NAVS)].map((n) => [n.index, n.index + n[0].length]);
  for (const m of html.matchAll(/<[a-zA-Z][\w-]*\s[^>]*?data-component=[^>]*>/g)) {
    m.inNav = navRanges.some((r) => m.index >= r[0] && m.index < r[1]);
    const t = m[0], name = attr(t, 'data-component');
    const c = comps[name] || (comps[name] = { tier: attr(t, 'data-tier') || 'ds', props: new Set(), slots: new Set(), states: new Set(), count: 0, note: attr(t, 'data-note') });
    c.count++;
    try { Object.keys(JSON.parse(attr(t, 'data-props') || '{}')).forEach((k) => c.props.add(k)); } catch (e) {}
    try { JSON.parse(attr(t, 'data-slots') || '[]').forEach((k) => c.slots.add(k)); } catch (e) {}
    c.states.add(s.id || '(as it loads)');
    if (s.id && !m.inNav) { let props = {}; try { props = JSON.parse(attr(t, 'data-props') || '{}'); } catch (e) {} let slots = []; try { slots = JSON.parse(attr(t, 'data-slots') || '[]'); } catch (e) {}
      (byState[s.id] || (byState[s.id] = { components: [] })).components.push({ name: name, tier: attr(t, 'data-tier') || 'ds', props: props, slots: slots }); }
  }
  if (s.id) { const sc = screenOf(html); Object.assign(byState[s.id] || (byState[s.id] = { components: [] }), { label: s.label || s.id, kind: s.kind || null }, sc); }
  const fresh = texts(html).filter((x) => !seen.has(x)); fresh.forEach((x) => seen.add(x));
  if (fresh.length) copy.push({ label: s.id ? (s.label || s.id) + ' (`' + s.id + '`)' : 'The page as it loads', texts: fresh });
}

// ---------- components ----------
const TIER = { ds: 'Design system', code: 'In code', proposed: 'Proposed' }, ORDER = { proposed: 0, code: 1, ds: 2 };
const rows = Object.entries(comps).sort((a, b) => (ORDER[a[1].tier] ?? 3) - (ORDER[b[1].tier] ?? 3) || a[0].localeCompare(b[0]));
const code = (x) => '`' + x + '`';
const components = 'Generated from the markers on every state: ' + rows.length + ' components (' +
  ['proposed', 'code', 'ds'].map((t) => rows.filter(([, c]) => c.tier === t).length + ' ' + TIER[t].toLowerCase()).join(', ') + ').\n\n' +
  '| Component | Tier | Instances | States | Props and slots used | Notes |\n|---|---|---|---|---|---|\n' +
  rows.map(([n, c]) => `| ${code(n)} | ${TIER[c.tier] || c.tier} | ${c.count} | ${c.states.size} | ${[...c.props].map(code).join(', ')}${c.slots.size ? (c.props.size ? '; ' : '') + 'slots ' + [...c.slots].map(code).join(', ') : ''} | ${(c.note || '').replace(/\|/g, '\\|')} |`).join('\n');

// ---------- stories and states ----------
const byId = Object.fromEntries(states.map((s) => [s.id, s]));
const shot = (id) => `drift-check/shots/${id.replace(/[^\w-]+/g, '-')}-${width}.png`;
const shotCell = (id) => fs.existsSync(path.join(dir, shot(id))) ? `[screenshot](${shot(id)})` : '**missing**';
const link = (id) => `[${code('#state=' + id)}](prototype.html#state=${encodeURIComponent(id)})`;
const label = (id) => (byId[id] || {}).label || id;
const kind = (id) => (byId[id] || {}).kind || '';
const ndTable = (list) => '**Not designed** (considered and deliberately not built)\n\n' + (list.length ? '| What | Reason |\n|---|---|\n' + list.map((n) => `| ${n.label || n.id} | ${n.reason || 'No reason given'} |`).join('\n') : 'None: nothing was considered and left out.') + '\n';
let storiesMd;
if (stories.length) {
  const used = new Set();
  storiesMd = (storyData.source ? 'From ' + (storyData.source.url ? `[${storyData.source.title}](${storyData.source.url})` : storyData.source.title) + '. ' : '') + 'One section per story, in the doc\'s order.\n\n' + stories.map((st) => {
    let o = `### ${st.id ? st.id + ' ' : ''}${st.title}\n\n${st.story ? st.story + '\n\n' : ''}`;
    if ((st.steps || []).length) o += '**Main path**\n\n| Step | State | Link | Screenshot |\n|---|---|---|---|\n' + st.steps.map((g, i) => { used.add(g.state); return `| ${i + 1}. ${g.title} | ${label(g.state)} | ${link(g.state)} | ${shotCell(g.state)} |`; }).join('\n') + '\n\n';
    if ((st.other || []).length) o += '**Other paths**\n\n| State | Kind | How a user gets there | Link | Screenshot |\n|---|---|---|---|---|\n' + st.other.map((g) => { used.add(g.state); return `| ${label(g.state)} | ${kind(g.state)} | ${g.how || ''} | ${link(g.state)} | ${shotCell(g.state)} |`; }).join('\n') + '\n\n';
    return o + ndTable(st.notDesigned || []);
  }).join('\n');
  const loose = states.filter((s) => !used.has(s.id));
  if (loose.length) storiesMd += '\n### Not in a story\n\n| State | Kind | Link | Screenshot |\n|---|---|---|---|\n' + loose.map((s) => `| ${s.label || s.id} | ${s.kind || ''} | ${link(s.id)} | ${shotCell(s.id)} |`).join('\n') + '\n';
  const pageNd = notDesigned.filter((n) => !n.story);
  if (pageNd.length) storiesMd += '\n' + ndTable(pageNd);
} else {
  const sorted = states.slice().sort((a, b) => (b.kind ? 1 : 0) - (a.kind ? 1 : 0));
  storiesMd = 'No user stories. Every state, hard-to-find ones first.\n\n| State | Kind | Link | Screenshot |\n|---|---|---|---|\n' + sorted.map((s) => `| ${s.label || s.id} | ${s.kind || ''} | ${link(s.id)} | ${shotCell(s.id)} |`).join('\n') + '\n\n' + ndTable(notDesigned);
}

// ---------- copy ----------
const copyMd = 'Every visible string, grouped by the state it first appears in. The app\'s own navigation is left out. ' + seen.size + ' strings.\n\n' +
  copy.map((c) => `### ${c.label}\n\n` + c.texts.map((t) => '- ' + t).join('\n')).join('\n\n');

// ---------- screens ----------
// States grouped by the screen they show, so each screen can be found in the app ("Where it lives").
const screens = {};
for (const st of states) { const b = byState[st.id]; if (!b) continue; const k = b.app + ' · ' + (b.title || '(untitled)'); (screens[k] || (screens[k] = { app: b.app, title: b.title, panels: {}, states: [] })).states.push(st.id); if (b.panel) (screens[k].panels[b.panel] || (screens[k].panels[b.panel] = [])).push(st.id); }
const screensMd = Object.keys(screens).length + ' screens. Each lists its states, and the panels or modals opened on it.\n\n| App | Screen | States | Panels and modals |\n|---|---|---|---|\n' +
  Object.values(screens).map((sc) => `| ${sc.app} | ${sc.title || '(untitled)'} | ${sc.states.map(code).join(', ')} | ${Object.entries(sc.panels).map(([p, ids]) => p + ' (' + ids.length + ')').join('; ')} |`).join('\n');
fs.writeFileSync(path.join(dir, 'components-by-state.json'), JSON.stringify(byState, null, 1));

// ---------- write ----------
const parts = { components, screens: screensMd, stories: storiesMd, copy: copyMd };
const hand = path.join(dir, 'HANDOVER.md');
let doc = fs.existsSync(hand) ? fs.readFileSync(hand, 'utf8') : '';
const filled = [];
for (const [k, v] of Object.entries(parts)) {
  const re = new RegExp(`(<!-- generated:${k} -->)[\\s\\S]*?(<!-- /generated -->)`);
  if (re.test(doc)) { doc = doc.replace(re, (m, a, b) => `${a}\n${v.trim()}\n${b}`); filled.push(k); }
}
if (filled.length) fs.writeFileSync(hand, doc);
const missing = Object.keys(parts).filter((k) => !filled.includes(k));
if (missing.length) fs.writeFileSync(path.join(dir, 'generated.md'), missing.map((k) => `<!-- generated:${k} -->\n${parts[k].trim()}\n<!-- /generated -->`).join('\n\n') + '\n');
const noShot = states.filter((s) => !fs.existsSync(path.join(dir, shot(s.id)))).map((s) => s.id);
console.log(`${rows.length} components, ${Object.keys(screens).length} screens, ${states.length} states, ${stories.length} stories, ${seen.size} copy strings.` +
  (filled.length ? ` Filled ${filled.join(', ')} in HANDOVER.md.` : '') + (missing.length ? ` Wrote ${missing.join(', ')} to generated.md.` : '') +
  (noShot.length ? ` Missing screenshots: ${noShot.join(', ')}.` : ''));
