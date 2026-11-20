// Labels each row of built frames with its story or card, and puts a Frame status tag above every frame.
// Run it inside Figma through the desktop bridge, on the page the builder built on. Safe to run again after a
// rebuild: it removes its own labels and tags first, then puts them back where the frames now are.
// Set these before running.
const STATUS = 'WIP';                       // 'Up to date' | 'WIP' | 'Stale'
const ROWS = {                              // prototype (its folder name) -> row -> [title, story ids, link]
  // 'supplier-price-lists': { 'next-price-list': ['Manage the next supplier price list', 'R5 · R9 · R11', 'https://…'] }
};
const REGION = {};                          // state id -> row, when rows came from capture's --regions file
const page = figma.currentPage;
const M = { family: 'Visuelt Pro', style: 'Medium' }, R = { family: 'Visuelt Pro', style: 'Regular' }; await figma.loadFontAsync(M); await figma.loadFontAsync(R);
const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const set = page.findOne((n) => n.type === 'COMPONENT_SET' && n.name === 'Frame status');
if (!set) throw new Error('Run status-tags.js once first: it makes the Frame status component');
const variant = set.children.find((c) => c.name === 'Status=' + STATUS);
for (const t of variant.findAll((n) => n.type === 'TEXT')) await figma.loadFontAsync(t.fontName);
const out = { labels: 0, tags: 0, sections: [] };
for (const sec of page.children.filter((n) => n.type === 'SECTION' && ROWS[n.getSharedPluginData('lookout', 'prototype')])) {
  const rows = ROWS[sec.getSharedPluginData('lookout', 'prototype')];
  sec.children.filter((n) => n.getSharedPluginData('lookout', 'label') || (n.type === 'INSTANCE' && n.name === 'Frame status')).forEach((n) => n.remove());
  const byRow = {};
  for (const f of sec.children.filter((n) => n.type === 'FRAME' && n.getSharedPluginData('lookout', 'state'))) { const st = f.getSharedPluginData('lookout', 'state'); const r = REGION[st] || st.split(':')[0]; (byRow[r] = byRow[r] || []).push(f); }
  for (const [r, fs] of Object.entries(byRow)) {
    const info = rows[r]; if (!info) continue;
    const y = Math.min(...fs.map((f) => f.y)), x = Math.min(...fs.map((f) => f.x));
    const t = figma.createText(); t.fontName = M; t.fontSize = 32; t.characters = info[0]; t.fills = [{ type: 'SOLID', color: hex('#162250') }]; sec.appendChild(t); t.x = x; t.y = y - 172; t.name = 'Row label'; t.setSharedPluginData('lookout', 'label', r);
    const s = figma.createText(); s.fontName = R; s.fontSize = 20; s.characters = 'Stories ' + info[1] + (info[2] ? '  ·  Open the card' : ''); s.fills = [{ type: 'SOLID', color: hex('#333570') }]; sec.appendChild(s); s.x = x; s.y = y - 124; s.name = 'Row stories'; s.setSharedPluginData('lookout', 'label', r);
    if (info[2]) { const i0 = s.characters.indexOf('Open the card'); s.setRangeHyperlink(i0, s.characters.length, { type: 'URL', value: info[2] }); s.setRangeTextDecoration(i0, s.characters.length, 'UNDERLINE'); }
    out.labels++;
    for (const f of fs) { const inst = variant.createInstance(); sec.appendChild(inst); inst.name = 'Frame status'; inst.x = f.x; inst.y = f.y - inst.height - 12; out.tags++; }
  }
  out.sections.push({ id: sec.id, rows: Object.fromEntries(Object.entries(byRow).map(([r, fs]) => [r, fs[0].id])) });
}
return out;
