#!/usr/bin/env node
// Captures every state of a kit prototype as JSON, ready for build.js to turn into Figma frames.
//
//   node capture.mjs <prototype>/index.html [--out <dir>] [--states id,id] [--regions file.json] [--width 1440] [--height 900]
//
// Writes <out>/index.json (the prototype and its states) and one <out>/<state>.json per state.
// Default <out>: <prototype folder>/figma-export. Needs Node 18+ and Chrome (set CHROME if it isn't found).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const page = argv.find((a, i) => !a.startsWith('--') && !String(argv[i - 1]).startsWith('--'));
if (!page) { console.error('Usage: node capture.mjs <prototype>/index.html [--out dir] [--states a,b] [--width 1440] [--height 900]'); process.exit(2); }
const width = +opt('--width', 1440), height = +opt('--height', 900);
const out = path.resolve(opt('--out', path.join(path.dirname(page), 'figma-export')));
fs.mkdirSync(out, { recursive: true });

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const c = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/usr/bin/google-chrome', '/usr/bin/chromium'];
  const hit = c.find((p) => fs.existsSync(p)); if (!hit) { console.error('Chrome not found. Set CHROME.'); process.exit(2); } return hit;
}
const chrome = findChrome();

// Runs in the page: serialises #app (and fixed overlays such as modals) into a tree Figma can rebuild.
const CAPTURE = String.raw`
(function () {
  // Headless Chrome does not run CSS transitions, so a state that redraws would be read mid-transition.
  var noAnim = document.createElement('style'); noAnim.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }'; document.head.appendChild(noAnim);
  function px(v) { return parseFloat(v) || 0; }
  function rgba(c) { var m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); var a = p.length > 3 ? p[3] : 1; if (a === 0) return null; return { r: p[0] / 255, g: p[1] / 255, b: p[2] / 255, a: a }; }
  // Screen-reader-only text (Tailwind's sr-only): in the page for assistive tech, never on screen.
  function srOnly(el, cs) { cs = cs || getComputedStyle(el); var r = el.getBoundingClientRect(); return (cs.position === 'absolute' && r.width <= 1 && r.height <= 1) || /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(cs.clip) || cs.clipPath === 'inset(50%)'; }
  function inClosedDetails(el) { var d = el.parentElement && el.parentElement.closest('details:not([open])'); return !!d && !(el.closest('summary') && el.closest('summary').parentElement === d); }
  function visible(el, cs) { if (inClosedDetails(el) || cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0 || srOnly(el, cs)) return false; var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function inlineOnly(el) { /* An icon, image or field deeper down means this is layout, not a run of text: reading it as text would drop them. */ if (el.querySelector('svg, img, input, select, textarea, [data-component]')) return false; for (var c = el.firstElementChild; c; c = c.nextElementSibling) { var d = getComputedStyle(c).display; if (!/^inline/.test(d) || c.tagName === 'svg' || c.tagName === 'IMG' || c.hasAttribute('data-component') || /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(c.tagName)) return false; } return true; }
  function textOf(el) { var out = ''; (function walk(x) { for (var c = x.firstChild; c; c = c.nextSibling) { if (c.nodeType === 3) out += c.textContent; else if (c.nodeType === 1 && !srOnly(c) && getComputedStyle(c).display !== 'none') { if (c.tagName === 'BR') out += ' '; else walk(c); } } })(el); return out.replace(/\s+/g, ' ').trim(); }
  function font(cs) { return { size: px(cs.fontSize), weight: +cs.fontWeight || 400, lineHeight: cs.lineHeight === 'normal' ? null : px(cs.lineHeight), letterSpacing: cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing), color: rgba(cs.color), align: cs.textAlign, transform: cs.textTransform, italic: cs.fontStyle === 'italic', underline: /underline/.test(cs.textDecorationLine) }; }
  function node(el, origin) {
    var cs = getComputedStyle(el); if (!visible(el, cs)) return null;
    if (el.closest('[data-proto-ui]')) return null;
    var r = el.getBoundingClientRect();
    var n = { tag: el.tagName.toLowerCase(), x: r.left - origin.x, y: r.top - origin.y, w: r.width, h: r.height };
    ['component', 'props', 'slots', 'tier', 'note', 'state'].forEach(function (k) { var v = el.getAttribute('data-' + k); if (v != null) n[k] = v; });
    var bg = rgba(cs.backgroundColor); if (bg) n.bg = bg;
    var bw = [px(cs.borderTopWidth), px(cs.borderRightWidth), px(cs.borderBottomWidth), px(cs.borderLeftWidth)];
    if (bw.some(Boolean)) { n.border = { w: bw, c: rgba(cs.borderTopColor) || rgba(cs.borderRightColor) || rgba(cs.borderBottomColor) || rgba(cs.borderLeftColor), sides: [rgba(cs.borderTopColor), rgba(cs.borderRightColor), rgba(cs.borderBottomColor), rgba(cs.borderLeftColor)] }; }
    var rad = [px(cs.borderTopLeftRadius), px(cs.borderTopRightRadius), px(cs.borderBottomRightRadius), px(cs.borderBottomLeftRadius)]; if (rad.some(Boolean)) n.radius = rad;
    if (cs.boxShadow && cs.boxShadow !== 'none') n.shadow = cs.boxShadow;
    if (+cs.opacity < 1) n.opacity = +cs.opacity;
    n.pad = [px(cs.paddingTop), px(cs.paddingRight), px(cs.paddingBottom), px(cs.paddingLeft)];
    if (/flex/.test(cs.display)) n.flex = { dir: /column/.test(cs.flexDirection) ? 'V' : 'H', gap: /column/.test(cs.flexDirection) ? px(cs.rowGap) : px(cs.columnGap), justify: cs.justifyContent, align: cs.alignItems, wrap: cs.flexWrap === 'wrap' };
    if (cs.display === 'grid') n.grid = true;
    if (/(auto|scroll|hidden)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) n.clip = true;
    if (cs.position === 'fixed' || cs.position === 'absolute') n.pos = cs.position;
    if (el.tagName === 'svg' || el.tagName === 'SVG') { n.svg = el.outerHTML; n.color = rgba(cs.color); return n; }
    if (el.tagName === 'IMG') { n.img = el.getAttribute('alt') || 'image'; return n; }
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      var val = el.tagName === 'SELECT' ? (el.options[el.selectedIndex] || {}).text : el.value;
      // A date field holds 2026-12-01 but shows 01/12/2026, and shows dd/mm/yyyy when empty.
      var isDate = el.type === 'date'; if (isDate && val) val = val.split('-').reverse().join('/');
      n.input = { type: el.type, value: /^(checkbox|radio)$/.test(el.type) ? '' : (val || ''), placeholder: el.getAttribute('placeholder') || (isDate ? 'dd/mm/yyyy' : ''), checked: !!el.checked };
      n.font = font(cs); return n;
    }
    if (inlineOnly(el)) { var t = textOf(el); if (t) { n.text = t; n.font = font(cs); n.wraps = r.height > (px(cs.lineHeight) || px(cs.fontSize) * 1.4) * 1.5; } return (t || bg || n.border) ? n : null; }
    n.children = [];
    // A coloured ::before or ::after block, such as a metric's bar, is drawn as a layer of its own.
    ['::before', '::after'].forEach(function (ps) { var p = getComputedStyle(el, ps); if (!p || p.content === 'none' || p.content === 'normal' || p.display === 'none') return; var pb = rgba(p.backgroundColor); if (!pb || p.position !== 'absolute') return; var pw = px(p.width), ph = px(p.height); if (pw < 1 || ph < 1) return; var pr = px(p.borderTopLeftRadius); n.children.push({ tag: ps, x: r.left - origin.x + px(p.left), y: r.top - origin.y + px(p.top), w: pw, h: ph, bg: pb, radius: pr ? [pr, pr, pr, pr] : undefined, pos: 'absolute', pad: [0, 0, 0, 0] }); });
    // A display:contents wrapper has no box of its own: its children are laid out as the parent's, so read them that way.
    (function kidsOf(host) { for (var c = host.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 1 && getComputedStyle(c).display === 'contents') { kidsOf(c); continue; }
      if (c.nodeType === 3) { var s = c.textContent.replace(/\s+/g, ' ').trim(); if (s) { var range = document.createRange(); range.selectNodeContents(c); var rr = range.getBoundingClientRect(); n.children.push({ tag: '#text', x: rr.left - origin.x, y: rr.top - origin.y, w: rr.width, h: rr.height, text: s, font: font(cs) }); } continue; }
      if (c.nodeType !== 1 || c.tagName === 'SCRIPT' || c.tagName === 'STYLE') continue;
      var k = node(c, origin); if (k) n.children.push(k);
    } })(el);
    return n;
  }
  function capture() {
    var origin = { x: 0, y: 0 };
    var root = { tag: 'screen', x: 0, y: 0, w: innerWidth, h: innerHeight, bg: rgba(getComputedStyle(document.body).backgroundColor) || rgba(getComputedStyle(document.documentElement).backgroundColor) || { r: 1, g: 1, b: 1, a: 1 }, children: [] };
    var app = document.getElementById('app'); if (app) { var a = node(app, origin); if (a) root.children.push(a); }
    document.querySelectorAll('body > .fixed, body > [data-component]').forEach(function (el) { if (el.closest('[data-proto-ui]')) return; var k = node(el, origin); if (k) { k.pos = 'fixed'; root.children.push(k); } });
    // How tall the window would have to be to show everything: the page, and anything that scrolls inside it, such as a side panel.
    // With a modal or side panel open the screen is the window: only the overlay's own needs count, not the page behind it.
    var overlay = Array.prototype.filter.call(document.querySelectorAll('#app .fixed, body > .fixed'), function (el) { if (el.closest('[data-proto-ui]') || getComputedStyle(el).position !== 'fixed' || getComputedStyle(el).display === 'none') return false; var r = el.getBoundingClientRect(); return r.width >= innerWidth - 1 && r.height >= innerHeight - 1 && el.querySelector('[role=dialog], [data-component*="Modal"]'); })[0];
    var need = overlay ? innerHeight : Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, innerHeight);
    // A centred modal taller than the window overflows equally above and below, and the part above can't be scrolled to.
    if (overlay) { var dl = overlay.querySelector('[role=dialog], [data-component*="Modal"]'), dr = dl.getBoundingClientRect(); if (dr.top < 0) need = Math.max(need, innerHeight + 2 * Math.ceil(-dr.top) + 48); else if (dr.bottom > innerHeight) need = Math.max(need, Math.ceil(dr.bottom) + Math.max(0, Math.ceil(dr.top))); }
    (overlay ? overlay.querySelectorAll('*') : document.querySelectorAll('#app *, body > .fixed *')).forEach(function (el) { if (el.scrollHeight <= el.clientHeight + 1 || el.closest('nav')) return; var oy = getComputedStyle(el).overflowY; if (oy !== 'auto' && oy !== 'scroll') return; var r = el.getBoundingClientRect(); /* Only a scroller that runs to the bottom of the window grows with it. A list that scrolls inside a modal is meant to. */ if (r.bottom < innerHeight - 2) return; need = Math.max(need, r.top + el.scrollHeight + Math.max(0, innerHeight - r.bottom)); });
    root.need = Math.ceil(need);
    var s = document.createElement('script'); s.type = 'application/json'; s.id = 'fig-capture'; s.textContent = JSON.stringify(root).replace(/</g, '\\u003c'); document.body.appendChild(s);
  }
  setTimeout(capture, 1500);
})();`;

const src = fs.readFileSync(page, 'utf8');
const tmp = path.join(os.tmpdir(), `to-figma-${process.pid}.html`);
fs.writeFileSync(tmp, src.replace(/<\/body>\s*<\/html>\s*$/i, '') + `<script>${CAPTURE}</script>`);
const base = pathToFileURL(tmp).href;
let winH = height;
const flags = () => ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=${width},${winH}`, '--virtual-time-budget=6000'];
const dump = (url) => execFileSync(chrome, [...flags(), '--dump-dom', url], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
const grab = (html, id) => { const m = html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)</script>`)); return m ? m[1].replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') : null; };

let first = dump(`${base}?proto-bar=off`);
// The window size includes Chrome's own frame, so grow it until the page itself is the height asked for.
const measured = (() => { try { return JSON.parse(grab(first, 'fig-capture')).h; } catch (e) { return height; } })();
if (measured < height) { winH = height + (height - measured); first = dump(`${base}?proto-bar=off`); }
let states = JSON.parse(grab(first, 'proto-states') || '[]');
const pick = opt('--states'); if (pick) { const want = pick.split(','); states = states.filter((s) => want.includes(s.id)); }
if (!states.length) states = [{ id: 'default', label: 'As it loads' }];
// --regions <file.json>: { "state id": "row" } puts states on rows of your choosing, such as one per story or card, in the file's order.
// Without it a state's row is the part of its id before the colon.
const regionMap = opt('--regions') ? JSON.parse(fs.readFileSync(opt('--regions'), 'utf8')) : null;
if (regionMap) { const order = Object.keys(regionMap); states = states.filter((s) => order.includes(s.id)).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)); }
const title = (src.match(/<title>([^<]*)/) || [])[1] || path.basename(path.dirname(page));
const slug = path.basename(path.dirname(path.resolve(page)));
const index = { prototype: slug, title, width, height, capturedAt: new Date().toISOString(), states: [] };
for (const s of states) {
  const html = s.id === 'default' ? first : dump(`${base}?proto-bar=off#state=${encodeURIComponent(s.id)}`);
  let json = grab(html, 'fig-capture');
  if (!json) { console.warn(`  ${s.id}: nothing captured`); continue; }
  // A page or side panel taller than the window is captured again in a window tall enough to show all of it.
  const size = (j) => { const h = +(j.match(/"h":([\d.]+)/) || [])[1], need = +(j.match(/"need":(\d+)/) || [])[1]; return { h, need }; };
  let sz = size(json);
  if (sz.need > sz.h + 1) { const keep = winH; winH += Math.ceil(sz.need - sz.h); const again = grab(dump(`${base}?proto-bar=off#state=${encodeURIComponent(s.id)}`), 'fig-capture'); winH = keep; if (again) { json = again; sz = size(json); } }
  const file = s.id.replace(/[^\w-]+/g, '-') + '.json';
  fs.writeFileSync(path.join(out, file), json);
  index.states.push({ id: s.id, label: s.label, kind: s.kind || null, region: (regionMap && regionMap[s.id]) || s.id.split(':')[0], file, h: Math.round(sz.h) });
  console.log(`  ${s.id}`);
}
// Capturing some states updates them in an existing index rather than replacing it.
const idxFile = path.join(out, 'index.json');
if (pick && fs.existsSync(idxFile)) { const prev = JSON.parse(fs.readFileSync(idxFile, 'utf8')); const fresh = new Map(index.states.map((s) => [s.id, s])); index.states = prev.states.map((s) => fresh.get(s.id) || s).concat(index.states.filter((s) => !prev.states.some((p) => p.id === s.id))); }
fs.writeFileSync(idxFile, JSON.stringify(index, null, 1));
fs.unlinkSync(tmp);
console.log(`Captured ${index.states.length} states to ${out}`);
