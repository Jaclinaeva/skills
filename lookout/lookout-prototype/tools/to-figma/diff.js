// Runs inside Figma (through the figma-console bridge). Finds what a designer changed in a frame build.js made.
// It builds a fresh copy of the same state off to the side, pairs every layer with its twin by the "src" tag
// build.js put on it, reports the differences, then deletes the copy.
//
//   const tf = await (new Function(await (await fetch(BASE + '/build.js?t=' + Date.now())).text()))();
//   const df = await (new Function(await (await fetch(BASE + '/diff.js?t=' + Date.now())).text()))();
//   return await df.diffFrame(BASE, tf, '<frame id>');
const hex = (p) => { const f = Array.isArray(p) ? p.find((x) => x.type === 'SOLID' && x.visible !== false) : null; if (!f) return null; const c = f.color; return '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('') + (f.opacity != null && f.opacity < 1 ? '@' + Math.round(f.opacity * 100) : ''); };
const sd = (n, k) => { try { return n.getSharedPluginData('lookout', k); } catch (e) { return ''; } };

async function describe(n) {
  const d = { type: n.type, visible: n.visible };
  if (n.type === 'TEXT') { d.text = n.characters; d.size = typeof n.fontSize === 'number' ? n.fontSize : 'mixed'; d.weight = typeof n.fontName === 'symbol' ? 'mixed' : n.fontName.style; d.color = hex(n.fills); d.style = typeof n.textStyleId === 'string' ? n.textStyleId : 'mixed'; }
  if (n.type === 'INSTANCE') {
    let mc = null; try { mc = await n.getMainComponentAsync(); } catch (e) {}
    d.component = mc ? ((mc.parent && mc.parent.type === 'COMPONENT_SET') ? mc.parent.name + ' / ' + mc.name : mc.name) : '?';
    d.props = {}; for (const [k, v] of Object.entries(n.componentProperties)) if (v.type !== 'SLOT') d.props[k.replace(/#.*/, '')] = v.type === 'INSTANCE_SWAP' ? await swapName(v.value) : v.value;
  }
  if (n.type === 'FRAME' || n.type === 'INSTANCE') {
    d.fill = hex(n.fills); d.stroke = hex(n.strokes); d.radius = typeof n.cornerRadius === 'number' ? n.cornerRadius : 'mixed';
    if (n.layoutMode && n.layoutMode !== 'NONE') { d.layout = n.layoutMode; d.gap = n.itemSpacing; d.pad = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft]; d.align = [n.primaryAxisAlignItems, n.counterAxisAlignItems]; }
    if (n.layoutSizingHorizontal === 'FIXED') d.w = Math.round(n.width);
    if (n.layoutSizingVertical === 'FIXED') d.h = Math.round(n.height);
  }
  return d;
}
async function swapName(id) { try { const c = await figma.getNodeByIdAsync(id); return c ? ((c.parent && c.parent.type === 'COMPONENT_SET') ? c.parent.name + ' / ' + c.name : c.name) : id; } catch (e) { return id; } }

// Every layer build.js tagged, by src, with its parent's src and its tagged children in order.
function index(root) {
  const map = new Map(); const extras = [];
  (function walk(n, parentSrc) {
    const src = sd(n, 'src');
    if (src) map.set(src, { n, parentSrc, kids: [] });
    if (src && parentSrc && map.get(parentSrc)) map.get(parentSrc).kids.push(src);
    // The builder's own helpers aren't designer changes: spacers, and the shapes inside an icon drawn from SVG.
    const helper = !src && (n.name === 'Spacer' || /^(VECTOR|BOOLEAN_OPERATION|GROUP)$/.test(n.type));
    if (!src && parentSrc && n !== root && !helper) extras.push({ n, parentSrc });
    if (!('children' in n)) return;
    if (src && n.name === 'icon') return;
    const kids = n.type === 'INSTANCE' ? n.findAll((x) => x.type === 'SLOT').flatMap((s) => s.children) : n.children;
    if (!src && n.type !== 'INSTANCE' && n !== root) return; // untagged layer: report it, don't walk into it
    for (const c of kids) walk(c, src || parentSrc);
  })(root, '');
  return { map, extras };
}
function context(entry, map) {
  // The nearest marked component and a little text, so a person can tell where a change is.
  let e = entry, comp = '', guard = 0;
  while (e && guard++ < 30) { const c = sd(e.n, 'component'); if (c) { comp = c; break; } e = map.get(e.parentSrc); }
  const txt = entry.n.type === 'TEXT' ? entry.n.characters : (entry.n.findOne ? ((entry.n.findOne((x) => x.type === 'TEXT') || {}).characters || '') : '');
  return (comp ? comp + ': ' : '') + String(txt || entry.n.name).slice(0, 60);
}

async function diffFrame(base, tf, frameId) {
  const cur = await figma.getNodeByIdAsync(frameId);
  const state = sd(cur, 'state'), proto = sd(cur, 'prototype');
  const index0 = await (await fetch(base + '/index.json?t=' + Date.now())).json();
  const s = index0.states.find((x) => x.id === state);
  if (!s) throw new Error('No captured state ' + state);
  await tf.load(base);
  // Build the reference copy in a temporary section far away, then compare.
  const tmp = figma.createSection(); tmp.name = 'Diff reference (temporary)'; tmp.x = -200000; tmp.y = -200000;
  tmp.setSharedPluginData('lookout', 'prototype', '__diff');
  let changes = [];
  try {
    await tf.buildState(base, index0, s, tmp, { x: 0, y: 0 });
    const ref = tmp.children[0];
    const A = index(ref), B = index(cur);
    for (const [src, a] of A.map) {
      const b = B.map.get(src);
      if (!b) { changes.push({ kind: 'removed', src, where: context(a, A.map), was: await describe(a.n) }); continue; }
      const da = await describe(a.n), db = await describe(b.n);
      const diff = {};
      for (const k of new Set([...Object.keys(da), ...Object.keys(db)])) {
        const x = JSON.stringify(da[k]), y = JSON.stringify(db[k]);
        if (x !== y) diff[k] = { was: da[k], now: db[k] };
      }
      if (b.parentSrc !== a.parentSrc) diff.movedTo = { was: a.parentSrc, now: b.parentSrc };
      const ak = a.kids.filter((k) => B.map.has(k)), bk = b.kids.filter((k) => A.map.has(k));
      if (JSON.stringify(ak) !== JSON.stringify(bk)) diff.order = { was: ak, now: bk };
      if (Object.keys(diff).length) changes.push({ kind: 'changed', src, where: context(b, B.map), diff });
    }
    for (const e of B.extras) changes.push({ kind: 'added', parent: e.parentSrc, where: context(B.map.get(e.parentSrc) || { n: cur }, B.map), now: await describe(e.n), name: e.n.name });
  } finally { tmp.remove(); }
  return { state, prototype: proto, frame: cur.name, count: changes.length, changes };
}

return { diffFrame };
