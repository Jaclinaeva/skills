// Puts a "Frame status" tag above every screen frame on the current page: Up to date, WIP or Stale, with the date.
// Run it inside Figma after setting the current page. Safe to run again: it reuses the component and skips frames that have a tag.
// Set these two before running.
const STATUS = 'WIP';            // 'Up to date' | 'WIP' | 'Stale'
const TODAY = '20 Nov 2026';     // used when a frame has no build date of its own
const page = figma.currentPage;
// In the cloud runtime Visuelt Pro can't load, so the tag is set in Figtree. Through the desktop bridge, use the library's text style instead.
let R = { family: 'Figtree', style: 'Regular' }, M = { family: 'Figtree', style: 'SemiBold' };
try { await figma.loadFontAsync(R); await figma.loadFontAsync(M); } catch (e) { R = { family: 'Inter', style: 'Regular' }; M = { family: 'Inter', style: 'Semi Bold' }; await figma.loadFontAsync(R); await figma.loadFontAsync(M); }
const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
let set = page.findOne((n) => n.type === 'COMPONENT_SET' && n.name === 'Frame status');
if (!set) {
  // emerald, butterscotch and warning, from Lookout's colours
  const V = { 'Up to date': ['#E9F3F1', '#1F826A'], 'WIP': ['#FFF7EA', '#DC8E04'], 'Stale': ['#FDEFED', '#DD3822'] };
  const comps = [];
  for (const [name, [bg, fg]] of Object.entries(V)) {
    const c = figma.createComponent(); c.name = 'Status=' + name; c.layoutMode = 'HORIZONTAL'; c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'AUTO';
    c.paddingLeft = c.paddingRight = 16; c.paddingTop = c.paddingBottom = 8; c.itemSpacing = 10; c.counterAxisAlignItems = 'CENTER'; c.cornerRadius = 8;
    c.fills = [{ type: 'SOLID', color: hex(bg) }]; c.strokes = [{ type: 'SOLID', color: hex(fg) }]; c.strokeWeight = 1;
    const dot = figma.createEllipse(); dot.resize(12, 12); dot.fills = [{ type: 'SOLID', color: hex(fg) }]; dot.name = 'Dot'; c.appendChild(dot);
    const s = figma.createText(); s.fontName = M; s.fontSize = 24; s.characters = name; s.fills = [{ type: 'SOLID', color: hex('#162250') }]; s.name = 'Status'; c.appendChild(s);
    const d = figma.createText(); d.fontName = R; d.fontSize = 24; d.characters = 'Updated ' + TODAY; d.fills = [{ type: 'SOLID', color: hex('#333570') }]; d.name = 'Updated'; c.appendChild(d);
    comps.push(c);
  }
  set = figma.combineAsVariants(comps, page); set.name = 'Frame status';
  set.layoutMode = 'VERTICAL'; set.itemSpacing = 16; set.paddingLeft = set.paddingRight = set.paddingTop = set.paddingBottom = 24; set.primaryAxisSizingMode = 'AUTO'; set.counterAxisSizingMode = 'AUTO';
  const key = set.addComponentProperty('Updated', 'TEXT', 'Updated ' + TODAY);
  for (const c of set.children) c.findOne((n) => n.name === 'Updated').componentPropertyReferences = { characters: key };
  set.description = 'Flags when a screen was last updated from the prototype. Up to date: matches the prototype. WIP: being refined. Stale: the prototype has moved on since.';
  const left = Math.min(...page.children.filter((n) => n !== set).map((n) => n.x), 0); set.x = left - set.width - 200; set.y = 0;
}
const variant = set.children.find((c) => c.name === 'Status=' + STATUS);
const updatedKey = Object.keys(set.componentPropertyDefinitions).find((k) => k.startsWith('Updated'));
const fmt = (iso) => { const d = new Date(iso); return d.getDate() + ' ' + ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()] + ' ' + d.getFullYear(); };
const tagged = [], skipped = [];
for (const sec of page.children.filter((n) => n.type === 'SECTION')) for (const f of sec.children.filter((n) => n.type === 'FRAME')) {
  if (sec.children.some((n) => n.type === 'INSTANCE' && n.name === 'Frame status' && Math.abs(n.x - f.x) < 1 && n.y < f.y && f.y - n.y < 120)) { skipped.push(f.id); continue; }
  const inst = variant.createInstance(); sec.appendChild(inst); inst.name = 'Frame status';
  // The kit's builder stamps each frame with when it was built.
  const built = f.getSharedPluginData('lookout', 'built'); inst.setProperties({ [updatedKey]: 'Updated ' + (built ? fmt(built) : TODAY) });
  inst.x = f.x; inst.y = f.y - inst.height - 12; tagged.push(inst.id);
}
return { component: set.id, tagged: tagged.length, alreadyTagged: skipped.length };
