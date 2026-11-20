// Runs inside Figma (through the figma-console bridge). Builds Figma frames from capture.mjs output.
// Loaded by fetching this file from serve.mjs and running it: it returns { buildAll, buildState }.
//
//   const tf = await (new Function(await (await fetch(BASE + '/build.js')).text()))();
//   return await tf.buildAll(BASE, { states: ['services:empty'] });
//
// Every frame is auto-layout where the page used flex or a simple stack. Text uses the 03 Components text
// styles in Visuelt. Buttons, tags and icons become library instances when map.json knows them; everything
// else is drawn. Each marked layer carries its component, props, slots, tier and note as shared plugin data
// (namespace "lookout"), and each screen frame carries its prototype and state id.
const W = 1440, GAP = 160;
let MAP, STYLES = {}, COMPS = {}, report, T = {};
const FONTS = new Set();
async function font(name) { const k = name.family + '/' + name.style; if (!FONTS.has(k)) { await figma.loadFontAsync(name); FONTS.add(k); } }
function tick(k, t0) { T[k] = (T[k] || 0) + (Date.now() - t0); }

function solid(c) { return c ? [{ type: 'SOLID', color: { r: c.r, g: c.g, b: c.b }, opacity: c.a == null ? 1 : c.a }] : []; }
function near(a, b, t) { return Math.abs(a - b) <= (t == null ? 2 : t); }
function weightName(w) { return w >= 650 ? 'Bold' : w >= 450 ? 'Medium' : 'Regular'; }
function styleName(f) { const s = MAP.sizes.find(([px]) => Math.abs(px - f.size) < 0.4); return s ? s[1] + '/' + weightName(f.weight) : null; }
async function textStyle(f) { const n = styleName(f); const key = n && MAP.textStyles[n]; if (!key) return null; if (!(n in STYLES)) { try { const s = await figma.importStyleByKeyAsync(key); await font(s.fontName); STYLES[n] = s; } catch (e) { STYLES[n] = null; } } return STYLES[n]; }
async function comp(key) { if (!(key in COMPS)) { try { COMPS[key] = await figma.importComponentByKeyAsync(key); } catch (e) { COMPS[key] = null; } } return COMPS[key]; }
function mark(f, n) { ['component', 'props', 'slots', 'tier', 'note', 'state'].forEach((k) => { if (n[k] != null) f.setSharedPluginData('lookout', k, n[k]); }); }
const ROLE = { header: 'Header', footer: 'Footer', nav: 'Nav', main: 'Main', aside: 'Aside', section: 'Section', form: 'Form', table: 'Table', thead: 'Table head', tbody: 'Table body', tr: 'Row', td: 'Cell', th: 'Heading cell', ul: 'List', ol: 'List', li: 'Item', label: 'Label', p: 'Paragraph', h1: 'Heading', h2: 'Heading', h3: 'Heading', h4: 'Heading', button: 'Button (drawn)', a: 'Link', dl: 'Definition list', dt: 'Term', dd: 'Definition', details: 'Details', summary: 'Summary', input: 'Input (drawn)', select: 'Select (drawn)', textarea: 'Textarea (drawn)' };
function shortName(n) {
  if (n.component) { const parts = n.component.replace(/^proposed:/, '').split('::').filter((x) => x !== 'Admin' && x !== 'Vendor'); let last = parts.pop() || n.component; if (last === 'Component') last = parts.pop() || last; return (n.component.startsWith('proposed:') ? 'Proposed: ' : '') + last.replace(/Component$/, '').replace(/([a-z])([A-Z])/g, '$1 $2'); }
  if (n.state) return 'State: ' + n.state;
  if (ROLE[n.tag]) return ROLE[n.tag];
  const t = n.text || (n.children && n.children.length === 1 && n.children[0].text); if (t) return String(t).slice(0, 30);
  return n.flex ? (n.flex.dir === 'V' ? 'Stack' : 'Row') : 'Group';
}
function shadow(s) { const m = s && s.match(/rgba?\(([^)]+)\)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px(?:\s+(-?[\d.]+)px)?/); if (!m) return []; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return [{ type: 'DROP_SHADOW', color: { r: p[0] / 255, g: p[1] / 255, b: p[2] / 255, a: p.length > 3 ? p[3] : 1 }, offset: { x: +m[2], y: +m[3] }, radius: +m[4], spread: +(m[5] || 0), visible: true, blendMode: 'NORMAL' }]; }

function paint(f, n) {
  f.fills = solid(n.bg);
  if (n.border && n.border.c) {
    f.strokes = solid(n.border.c); f.strokeAlign = 'INSIDE';
    const [t, r, b, l] = n.border.w; if (t === r && r === b && b === l) f.strokeWeight = t; else { f.strokeTopWeight = t; f.strokeRightWeight = r; f.strokeBottomWeight = b; f.strokeLeftWeight = l; }
  }
  if (n.radius) { const [a, b, c, d] = n.radius; if (a === b && b === c && c === d) f.cornerRadius = Math.min(a, 999); else { f.topLeftRadius = a; f.topRightRadius = b; f.bottomRightRadius = c; f.bottomLeftRadius = d; } }
  if (n.shadow) f.effects = shadow(n.shadow);
  if (n.opacity != null) f.opacity = n.opacity;
}

async function makeText(n) {
  const t = figma.createText(); const f = n.font || { size: 14, weight: 400 };
  const t0 = Date.now();
  await font({ family: 'Visuelt Pro', style: weightName(f.weight) });
  t.fontName = { family: 'Visuelt Pro', style: weightName(f.weight) };
  const st = await textStyle(f);
  if (st) { await t.setTextStyleIdAsync(st.id); report.styledText++; } else { t.fontSize = f.size; if (f.lineHeight) t.lineHeight = { unit: 'PIXELS', value: f.lineHeight }; report.rawText++; }
  if (f.letterSpacing) t.letterSpacing = { unit: 'PIXELS', value: f.letterSpacing };
  const chars = f.transform === 'uppercase' ? n.text.toUpperCase() : n.text;
  t.characters = chars; t.fills = solid(f.color || { r: 0.2, g: 0.21, b: 0.44, a: 1 });
  if (f.underline) t.textDecoration = 'UNDERLINE';
  t.textAlignHorizontal = f.align === 'center' ? 'CENTER' : f.align === 'right' || f.align === 'end' ? 'RIGHT' : 'LEFT';
  t.name = chars.slice(0, 40);
  if (n.wraps) { t.textAutoResize = 'HEIGHT'; t.resize(Math.max(n.w, 1), t.height); } else t.textAutoResize = 'WIDTH_AND_HEIGHT';
  tick('text', t0);
  return t;
}

async function makeSvg(n) {
  const c = n.color ? '#' + [n.color.r, n.color.g, n.color.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('') : '#333570';
  try { const s = figma.createNodeFromSvg(n.svg.replace(/currentColor/g, c)); s.resize(Math.max(n.w, 1), Math.max(n.h, 1)); s.name = 'icon'; report.svg++; return s; } catch (e) { const f = figma.createFrame(); f.resize(n.w, n.h); f.fills = []; return f; }
}

// ---------- library instances ----------
// CODE_MATCHED (codematched.js) says how each ViewComponent maps onto its code-matched library component;
// LIB (library/components.json) and ICONS (library/icons.json) are what read-library saved from 03 Components.
let CM = {}, LIB = [], ICONS = {};
function texts(n) { const out = []; (function w(x) { if (x.text) out.push(x.text); if (x.input && x.input.value) return; (x.children || []).forEach(w); })(n); return out; }
function find(n, test) { if (test(n)) return n; for (const k of n.children || []) { const r = find(k, test); if (r) return r; } return null; }
function iconName(n) { const i = find(n, (x) => x.component === 'IconComponent'); if (!i) return null; try { return JSON.parse(i.props || '{}').name || null; } catch (e) { return null; } }
function inputOf(n) { const i = find(n, (x) => !!x.input); return i ? i.input : {}; }
function modalTitle(n) { const h = find(n, (x) => /^h[1-4]$/.test(x.tag) && x.text) || find(n, (x) => x.text); return h ? h.text : ''; }
async function setText(node, chars) { if (!node || node.type !== 'TEXT') return; const fn = node.fontName; if (typeof fn === 'symbol') { for (const seg of node.getStyledTextSegments(['fontName'])) await font(seg.fontName); } else await font(fn); node.characters = String(chars); }
async function relabelButton(i, n) {
  // A component with its own button inside: give it the prototype's label and variant.
  const want = find(n, (x) => x.component === 'Admin::ButtonComponent'); const b = i.findOne((x) => x.type === 'INSTANCE' && /button/i.test(x.name)); if (!want || !b) return;
  let props = {}; try { props = JSON.parse(want.props || '{}'); } catch (e) {}
  const d = b.componentProperties; const set = {}; const tk = Object.keys(d).find((k) => k.startsWith('Text#')); if (tk) set[tk] = H.text(want);
  const ty = Object.keys(d).find((k) => k === 'Type'); if (ty && props.variant) { const opts = d[ty].value; set[ty] = props.variant; }
  try { b.setProperties(set); } catch (e) { try { if (tk) b.setProperties({ [tk]: H.text(want) }); } catch (e2) {} }
}
const H = { setText, relabelButton, text: (n) => texts(n).join(' ').replace(/\s+/g, ' ').trim(), texts, firstText: (n) => texts(n)[0] || '', find, icon: iconName, input: inputOf, modalTitle };
function libEntry(name, page, mirrors) { return LIB.find((c) => c.name === name && (!page || c.page === page)) || LIB.find((c) => c.name === name && c.mirrors === mirrors) || LIB.find((c) => c.name === name); }
async function iconComp(name) { if (!name) return null; const tries = [name, name.replace(/_(stroke|solid)$/, ''), name.replace(/_stroke$/, '_solid'), name.replace(/_solid$/, '_stroke')]; for (const t of tries) { const key = ICONS[t] || (MAP.icons || {})[t]; if (key) return await comp(key); } return null; }

function inSlot(p) { for (; p; p = p.parent) if (p.type === 'SLOT') return true; return false; }

// Returns { inst, slot, slotKids } for a marked component with a library match, or null to draw it.
async function libraryInstance(n) {
  let props = {}; try { props = JSON.parse(n.props || '{}'); } catch (e) {}
  if (n.component === 'IconComponent') {
    const c = await iconComp(props.name); if (!c) return null;
    const i = c.createInstance(); i.resize(n.w, n.h);
    const col = (n.children || []).find((k) => k.svg); const color = col && col.color;
    if (color) { i.findAll((x) => 'fills' in x && Array.isArray(x.fills) && x.fills.length && x.type !== 'FRAME' && x.type !== 'INSTANCE').forEach((x) => { x.fills = solid(color); }); i.findAll((x) => 'strokes' in x && Array.isArray(x.strokes) && x.strokes.length && x.type !== 'FRAME').forEach((x) => { x.strokes = solid(color); }); }
    return { inst: i };
  }
  let name = n.component;
  if (!name && n.input) name = n.input.type === 'radio' ? 'Admin::Form::Input::RadioButtonComponent' : n.input.type === 'checkbox' ? 'Admin::Form::Input::CheckboxComponent' : null;
  const rule = name && CM[name]; if (!rule) return null;
  if (rule.when && !rule.when(props, n, H)) return null;
  const libName = typeof rule.use === 'function' ? rule.use(props, n, H) : rule.use;
  const entry = libEntry(libName, rule.page, name); if (!entry) return null;
  const c = await comp(entry.key); if (!c) return null;
  const i = c.createInstance(); const defs = i.componentProperties; const set = {};
  const keyFor = (prop) => Object.keys(defs).find((k) => k === prop || k.startsWith(prop + '#'));
  for (const [prop, fn] of Object.entries(rule.variants || {})) { const val = fn(props, n, H); const d = entry.props[prop]; if (d && d.options && d.options.includes(val)) set[prop] = val; else if (d) report.misses.add(name + ' ' + prop + '=' + val); }
  for (const [prop, fn] of Object.entries(rule.text || {})) { const k = keyFor(prop); if (k) set[k] = String(fn(props, n, H) || ''); }
  for (const [prop, fn] of Object.entries(rule.bools || {})) { const k = keyFor(prop); if (k) set[k] = !!fn(props, n, H); }
  for (const [prop, fn] of Object.entries(rule.swap || {})) { const k = keyFor(prop); const ic = k && await iconComp(fn(props, n, H)); if (ic) set[k] = ic.id; }
  try { i.setProperties(set); } catch (e) { for (const [k, val] of Object.entries(set)) { try { i.setProperties({ [k]: val }); } catch (e2) { report.misses.add(name + ' ' + k); } } }
  if (rule.after) { try { await rule.after(i, props, n, H); } catch (e) { report.misses.add(name + ' after: ' + e.message); } }
  const slotName = typeof rule.slot === 'function' ? rule.slot(props, n, H) : rule.slot;
  if (!slotName) return { inst: i };
  const slot = i.findOne((x) => x.type === 'SLOT' && (x.name === slotName || x.name.startsWith(slotName))) || i.findOne((x) => x.type === 'SLOT');
  if (!slot) return { inst: i };
  let kids = n.children || [];
  if (rule.modal) {
    // Header (title and close) and footer come from the component; the rest goes into its Body slot.
    let box = n; while (box.children && box.children.length === 1 && box.children[0].children) box = box.children[0];
    const title = modalTitle(n);
    kids = (box.children || []).filter((k) => k.component !== 'Admin::Modal::Component::Footer' && !find(k, (x) => x.component === 'Admin::Modal::Component::Footer') && !(title && find(k, (x) => x.text === title) && texts(k).length <= 2));
    // A title bar with more than the component's header can hold (a title plus two or more actions, as side panels have)
    // stays in the body as the prototype drew it, and the component's own header is hidden so the title isn't shown twice.
    const bar = title && (box.children || []).find((k) => find(k, (x) => x.text === title) && texts(k).length > 2 && find(k, (x) => x.component === 'Admin::ButtonComponent'));
    if (bar) { const hd = i.findOne((x) => x.name === 'Header'); if (hd) { hd.visible = false; report.misses.add(name + ' header hidden: the title bar has actions it has no place for'); } }
    if (kids.length === 1 && kids[0].children && !kids[0].component) kids = kids[0].children;
    await modalFooter(i, find(n, (x) => x.component === 'Admin::Modal::Component::Footer'));
  }
  return { inst: i, slot, slotKids: kids };
}
// The component's footer has its own buttons: give them the prototype's labels and variants, hide the rest.
async function modalFooter(i, footer) {
  if (!footer) return;
  const want = []; (function w(x) { if (x.component === 'Admin::ButtonComponent') want.push(x); else (x.children || []).forEach(w); })(footer);
  const frame = i.findOne((x) => x.name === 'Footer'); if (!frame) return;
  const have = frame.findAll((x) => x.type === 'INSTANCE' && /button/i.test(x.name + ' ' + ((x.mainComponent && x.mainComponent.parent && x.mainComponent.parent.name) || '')));
  have.forEach((b, idx) => {
    const p = want[idx]; if (!p) { b.visible = false; return; }
    let props = {}; try { props = JSON.parse(p.props || '{}'); } catch (e) {}
    const d = b.componentProperties; const set = {};
    const tk = Object.keys(d).find((k) => k.startsWith('Text#')); if (tk) set[tk] = H.text(p);
    if (d.Type && props.variant) set.Type = props.variant;
    try { b.setProperties(set); } catch (e) {}
  });
}

function textIn(n) { if (n.text) return n.text; return (n.children || []).map(textIn).filter(Boolean).join(' ').trim(); }

function stacked(kids) { const inFlow = kids.filter((k) => !k.pos); for (let i = 1; i < inFlow.length; i++) if (inFlow[i].y < inFlow[i - 1].y + inFlow[i - 1].h - 1) return false; return true; }
function rowLike(kids) { const inFlow = kids.filter((k) => !k.pos); for (let i = 1; i < inFlow.length; i++) if (inFlow[i].x < inFlow[i - 1].x + inFlow[i - 1].w - 1) return false; return inFlow.length > 1; }
const JUSTIFY = { 'flex-start': 'MIN', start: 'MIN', normal: 'MIN', center: 'CENTER', 'flex-end': 'MAX', end: 'MAX', 'flow-end': 'MAX', right: 'MAX', 'space-between': 'SPACE_BETWEEN' };
const ALIGN = { center: 'CENTER', 'flex-end': 'MAX', end: 'MAX', baseline: 'BASELINE' };

// Builds a node and appends it to parent. The caller places it once the parent's layout is set, so each
// frame gets auto-layout after its children are in: one layout pass instead of one per child.
async function build(n, parent, src) {
  if (!n.pad) n.pad = [0, 0, 0, 0];
  let f;
  // src: where this layer came from in the capture (child indexes from the screen), for reading changes back.
  const tag = (x) => { x.setSharedPluginData('lookout', 'src', src); return x; };
  if (n.component || (n.input && /^(checkbox|radio)$/.test(n.input.type))) {
    const ti = Date.now(); let got = await libraryInstance(n); tick('instance', ti);
    // Figma cannot fill a slot of an instance that sits inside another instance's slot, so draw those instead.
    if (got && got.slot && inSlot(parent)) { got.inst.remove(); got = null; }
    if (got) {
      const inst = got.inst; report.instances++; if (n.component) { mark(inst, n); report.marked++; report.used.add(n.component); }
      parent.appendChild(inst); tag(inst);
      if (got.slot) {
        // The slot's own layout may differ from the page's, so its content goes in one wrapper that keeps the page's layout.
        let kids = got.slotKids;
        if (kids.length > 1) { const xs = kids.map((k) => k.x), ys = kids.map((k) => k.y); const x = Math.min(...xs), y = Math.min(...ys); kids = [{ tag: 'div', name: 'Content', x, y, w: Math.max(...kids.map((k) => k.x + k.w)) - x, h: Math.max(...kids.map((k) => k.y + k.h)) - y, pad: [0, 0, 0, 0], flex: n.flex && got.slotKids === n.children ? n.flex : null, children: got.slotKids }]; }
        const placed = []; for (let ki = 0; ki < kids.length; ki++) placed.push([await build(kids[ki], got.slot, src + '.s' + ki), kids[ki]]);
        // The slot grows with its content: full width of the component, its own height.
        try { got.slot.layoutSizingHorizontal = 'FILL'; } catch (e) {} try { got.slot.layoutSizingVertical = 'HUG'; } catch (e) {} try { got.slot.clipsContent = false; } catch (e) {}
        for (const [node, k] of placed) place(node, k, got.slot, null);
      }
      return inst;
    }
  }
  if (n.svg) { f = await makeSvg(n); parent.appendChild(f); return tag(f); }
  if ((n.text && !n.children) || n.tag === '#text') {
    if (!n.bg && !n.border && !n.component && !(n.pad || []).some(Boolean)) { f = await makeText(n); parent.appendChild(f); return tag(f); }
  }
  f = figma.createFrame(); f.name = shortName(n); f.clipsContent = !!n.clip; paint(f, n); tag(f);
  if (n.component) { mark(f, n); report.marked++; if (n.tier !== 'proposed') report.drawn.add(n.component); else report.proposed.add(n.component); }
  if (n.state) f.setSharedPluginData('lookout', 'state', n.state);
  parent.appendChild(f);
  const kids = n.children || (n.text ? [{ tag: '#text', x: n.x + n.pad[3], y: n.y + n.pad[0], w: n.w - n.pad[1] - n.pad[3], h: n.h - n.pad[0] - n.pad[2], text: n.text, font: n.font, wraps: n.wraps }] : []);
  if (n.input && (n.input.value || n.input.placeholder)) kids.push({ tag: '#text', x: n.x + n.pad[3], y: n.y + n.pad[0], w: n.w, h: n.h, text: n.input.value || n.input.placeholder, font: Object.assign({}, n.font, n.input.value ? {} : { color: { r: 0.44, g: 0.45, b: 0.61, a: 1 } }) });
  const flow = kids.filter((k) => !k.pos);
  let mode = 'NONE', gaps = null, spacing = 0;
  if (n.flex && !n.flex.wrap) mode = n.flex.dir === 'V' ? 'VERTICAL' : 'HORIZONTAL';
  else if (!n.grid && flow.length && stacked(flow)) mode = 'VERTICAL';
  else if (!n.grid && rowLike(flow)) mode = 'HORIZONTAL';
  if (mode !== 'NONE') {
    // Measure the real space between items: margins add to any flex gap.
    gaps = []; for (let i = 1; i < flow.length; i++) gaps.push(mode === 'VERTICAL' ? flow[i].y - (flow[i - 1].y + flow[i - 1].h) : flow[i].x - (flow[i - 1].x + flow[i - 1].w));
    spacing = n.flex ? (n.flex.justify === 'space-between' ? 0 : (n.flex.gap || 0)) : (gaps.length ? Math.max(0, Math.round(Math.min(...gaps))) : 0);
  }
  const built = [];
  for (let ki = 0; ki < kids.length; ki++) { const k = kids[ki];
    // Uneven gaps become spacers, so the spacing survives in auto-layout.
    if (mode !== 'NONE' && gaps && !(n.flex && n.flex.justify === 'space-between') && !k.pos) { const idx = flow.indexOf(k); if (idx > 0) { const extra = Math.round(gaps[idx - 1] - spacing); if (extra > 1) { const sp = figma.createFrame(); sp.name = 'Spacer'; sp.fills = []; f.appendChild(sp); sp.resize(mode === 'VERTICAL' ? 1 : extra, mode === 'VERTICAL' ? extra : 1); } } }
    built.push([await build(k, f, src + '.' + ki), k]);
  }
  if (mode !== 'NONE') {
    f.layoutMode = mode; f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'AUTO';
    const [pt, pr, pb, pl] = n.pad; f.paddingTop = pt; f.paddingRight = pr; f.paddingBottom = pb; f.paddingLeft = pl;
    f.itemSpacing = spacing;
    if (n.flex) { f.primaryAxisAlignItems = JUSTIFY[n.flex.justify] || 'MIN'; const a = ALIGN[n.flex.align] || 'MIN'; f.counterAxisAlignItems = a === 'BASELINE' && mode !== 'HORIZONTAL' ? 'MIN' : a; }
    else if (mode === 'VERTICAL' && flow.length && flow.every((k) => near(k.x - n.x, n.x + n.w - (k.x + k.w), 3)) && flow.some((k) => k.w < n.w - n.pad[1] - n.pad[3] - 4)) f.counterAxisAlignItems = 'CENTER';
    report.autoLayout++;
  } else { f.resize(Math.max(n.w, 1), Math.max(n.h, 1)); report.absolute++; }
  for (const [node, k] of built) place(node, k, f, n);
  return f;
}

// Size and position a built node inside its parent.
function place(f, n, parent, parentNode) { const tp = Date.now(); try { return place0(f, n, parent, parentNode); } finally { tick('place', tp); } }
function place0(f, n, parent, parentNode) {
  const pm = parent.layoutMode;
  if (n.pos && pm && pm !== 'NONE') { f.layoutPositioning = 'ABSOLUTE'; }
  if (!pm || pm === 'NONE' || n.pos) { f.x = n.x - (parentNode ? parentNode.x : 0); f.y = n.y - (parentNode ? parentNode.y : 0); if (f.type === 'FRAME' && f.layoutMode && f.layoutMode !== 'NONE') fix(f, n); return; }
  if (f.type === 'TEXT') { if (n.wraps) { f.layoutSizingHorizontal = 'FILL'; } return; }
  if (f.type === 'INSTANCE') {
    const innerW = parentNode ? parentNode.w - parentNode.pad[1] - parentNode.pad[3] : n.w;
    const innerH = parentNode ? parentNode.h - parentNode.pad[0] - parentNode.pad[2] : n.h;
    // Keep the measured width (table columns, fields); fill the row's height where the page did.
    try { if (pm === 'VERTICAL' && near(n.w, innerW, 3)) f.layoutSizingHorizontal = 'FILL'; else if (Math.abs(f.width - n.w) > 4) { f.layoutSizingHorizontal = 'FIXED'; f.resize(Math.max(n.w, 1), f.height); } } catch (e) {}
    try { if (pm === 'HORIZONTAL' && near(n.h, innerH, 3) && f.height < n.h - 2) f.layoutSizingVertical = 'FILL'; } catch (e) {}
    return;
  }
  if (f.type !== 'FRAME') return;
  const inner = parentNode ? parentNode.w - parentNode.pad[1] - parentNode.pad[3] : n.w;
  const innerH = parentNode ? parentNode.h - parentNode.pad[0] - parentNode.pad[2] : n.h;
  if (pm === 'VERTICAL' && near(n.w, inner, 2)) f.layoutSizingHorizontal = 'FILL';
  if (f.layoutMode && f.layoutMode !== 'NONE') fix(f, n);
}
// Keep the measured size where hugging the content would come out different.
function fix(f, n) {
  if (f.layoutSizingHorizontal !== 'FILL' && !near(f.width, n.w, 2)) { f.layoutSizingHorizontal = 'FIXED'; f.resize(Math.max(n.w, 1), f.height); }
  if (f.layoutSizingVertical !== 'FILL' && !near(f.height, n.h, 2)) { f.layoutSizingVertical = 'FIXED'; f.resize(f.width, Math.max(n.h, 1)); }
}

async function buildState(base, index, s, section, at) {
  const data = await (await fetch(base + '/' + s.file + '?t=' + Date.now())).json();
  (function norm(x) { if (!x.pad) x.pad = [0, 0, 0, 0]; (x.children || []).forEach(norm); })(data);
  report = { used: new Set(), misses: new Set(), state: s.id, instances: 0, marked: 0, styledText: 0, rawText: 0, svg: 0, autoLayout: 0, absolute: 0, drawn: new Set(), proposed: new Set() };
  for (const w of ['Regular', 'Medium', 'Bold']) await font({ family: 'Visuelt Pro', style: w });
  T = {}; const tStart = Date.now();
  const old = section.children.find((c) => c.getSharedPluginData('lookout', 'state') === s.id && c.getSharedPluginData('lookout', 'prototype') === index.prototype);
  const pos = old ? { x: old.x, y: old.y } : at;
  if (old) old.remove();
  const screen = figma.createFrame(); screen.name = index.prototype + ' / ' + s.id + (s.label ? ' · ' + s.label : '');
  section.appendChild(screen); screen.resize(index.width, Math.round(data.h) || index.height); screen.clipsContent = true; screen.fills = solid(data.bg);
  screen.setSharedPluginData('lookout', 'prototype', index.prototype); screen.setSharedPluginData('lookout', 'state', s.id);
  if (s.kind) screen.setSharedPluginData('lookout', 'kind', s.kind);
  section.setSharedPluginData('lookout', 'building', s.id);
  for (const k of data.children) { const node = await build(k, screen, String(data.children.indexOf(k))); place(node, k, screen, data); if (k.pos) { node.x = k.x; node.y = k.y; } else if (node.type === 'FRAME') { node.x = 0; node.y = 0; if (node.layoutMode && node.layoutMode !== 'NONE') { node.layoutSizingHorizontal = 'FIXED'; node.layoutSizingVertical = 'FIXED'; } node.resize(index.width, Math.max(node.height, index.height)); } }
  screen.x = pos.x; screen.y = pos.y;
  screen.setSharedPluginData('lookout', 'built', new Date().toISOString());
  T.total = Date.now() - tStart;
  const r = Object.assign({}, report, { drawn: [...report.drawn], proposed: [...report.proposed], used: [...report.used], misses: [...report.misses], id: screen.id, ms: T });
  return r;
}

// Loads the text styles, code-matched rules and library lists. buildAll calls it; call it yourself before buildState.
async function load(base) {
  MAP = await (await fetch(base + '/map.json?t=' + Date.now())).json();
  CM = (new Function(await (await fetch(base + '/codematched.js?t=' + Date.now())).text() + '\nreturn CODE_MATCHED;'))();
  LIB = await (await fetch(base + '/library/components.json?t=' + Date.now())).json();
  ICONS = await (await fetch(base + '/library/icons.json?t=' + Date.now())).json();
}

async function buildAll(base, opts) {
  opts = opts || {};
  await load(base);
  const index = await (await fetch(base + '/index.json?t=' + Date.now())).json();
  const page = figma.currentPage; await page.loadAsync();
  let section = page.children.find((c) => c.type === 'SECTION' && c.getSharedPluginData('lookout', 'prototype') === index.prototype);
  if (!section) {
    section = figma.createSection(); section.name = 'Prototype: ' + index.title; section.setSharedPluginData('lookout', 'prototype', index.prototype);
    const right = page.children.filter((c) => c !== section).reduce((m, c) => Math.max(m, c.x + c.width), 0);
    section.x = right ? right + 400 : 0; section.y = 0;
  }
  const regions = [...new Set(index.states.map((s) => s.region))];
  const states = opts.states ? index.states.filter((s) => opts.states.includes(s.id)) : index.states;
  const results = [];
  for (const s of states) {
    const row = regions.indexOf(s.region), col = index.states.filter((x) => x.region === s.region).indexOf(s);
    const at = { x: 80 + col * (index.width + GAP), y: 80 + row * (index.height + GAP) };
    results.push(await buildState(base, index, s, section, at));
  }
  // Rows follow the tallest frame in each, so a tall page never runs into the row below.
  const mine = section.children.filter((c) => c.type === 'FRAME' && c.getSharedPluginData('lookout', 'prototype') === index.prototype);
  let rowY = 200;
  for (const r of regions) { const rowFrames = mine.filter((c) => { const st = index.states.find((x) => x.id === c.getSharedPluginData('lookout', 'state')); return st && st.region === r; }); if (!rowFrames.length) continue; rowFrames.forEach((c) => { c.y = rowY; }); rowY += Math.max(...rowFrames.map((c) => c.height)) + GAP + 80; }
  const kids = section.children; const maxX = kids.reduce((m, c) => Math.max(m, c.x + c.width), 0), maxY = kids.reduce((m, c) => Math.max(m, c.y + c.height), 0);
  section.resizeWithoutConstraints(maxX + 80, maxY + 80);
  section.setSharedPluginData('lookout', 'building', '');
  return { section: section.id, built: results };
}

return { buildAll, buildState, load };
