// Formatting sweep for screen frames on the current page. Read-only: it reports, it changes nothing.
// Run it inside Figma (the bridge's execute tool, or use_figma) after setting the current page.
// Checks every FRAME that sits directly inside a SECTION.
const page = figma.currentPage; const out = []; const fonts = {};
for (const sec of page.children.filter((n) => n.type === 'SECTION')) for (const f of sec.children.filter((n) => n.type === 'FRAME')) {
  const fb = f.absoluteBoundingBox, issues = [];
  const add = (kind, what) => issues.push(kind + ': ' + what);
  // Tall screens: the nav and a side panel should run the frame's full height, and the frame should fit its content.
  const nav = f.findOne((n) => /^Navigation|PrimaryNav/.test(n.name)); if (nav && nav.height < f.height - 2) add('nav stops short', Math.round(nav.height) + ' of ' + Math.round(f.height));
  const dlg = f.findOne((n) => n.name === 'Dialog' || /Modal::Component/.test(n.name));
  if (dlg && dlg.width < f.width - 2 && dlg.height < f.height - 2 && Math.abs(dlg.absoluteBoundingBox.y - fb.y) < 2) add('side panel stops short', Math.round(dlg.height) + ' of ' + Math.round(f.height));
  if (dlg) { let bottom = 0; for (const t of dlg.findAllWithCriteria({ types: ['TEXT'] })) { const b = t.absoluteBoundingBox; if (b) bottom = Math.max(bottom, b.y + b.height - fb.y); } if (bottom > f.height + 2) add('panel content cut off', 'content runs to ' + Math.round(bottom) + ', frame is ' + Math.round(f.height)); }
  for (const c of f.children) { const b = c.absoluteBoundingBox; if (b && c.layoutPositioning !== 'ABSOLUTE' && b.y + b.height > fb.y + fb.height + 2) add('frame shorter than content', c.name + ' by ' + Math.round(b.y + b.height - fb.y - fb.height)); }
  if (!f.clipsContent) add('frame does not clip', 'shadows and overlays can spill outside it');
  // Native date and time inputs lose their value in a browser capture.
  for (const d of f.findAll((n) => n.type === 'FRAME' && /Date Picker|Time Picker/.test(n.name))) if (!d.findAllWithCriteria({ types: ['TEXT'] }).length) add('empty date field', d.id);
  // Menus that were closed in the prototype but drawn anyway.
  for (const c of f.children) if (c.layoutPositioning === 'ABSOLUTE' && 'children' in c && c.children.length === 1 && c.children[0].name === 'Menu') add('stray closed menu', c.id);
  // Text: which fonts, and anything wider than its container. Overruns of a few px are often the cloud's fallback font, not real.
  let spill = 0, worst = 0;
  for (const t of f.findAllWithCriteria({ types: ['TEXT'] })) {
    if (!t.visible) continue;
    const fn = t.fontName; const fam = fn === figma.mixed ? 'mixed' : fn.family; fonts[fam] = (fonts[fam] || 0) + 1;
    const tb = t.absoluteBoundingBox, pb = t.parent.absoluteBoundingBox; if (!tb || !pb) continue;
    if (t.parent.type === 'FRAME' && tb.width > pb.width + 3) { spill++; worst = Math.max(worst, Math.round(tb.width - pb.width)); }
    if (tb.x + tb.width > fb.x + fb.width + 2 || tb.x < fb.x - 2) add('text outside the frame', '"' + t.characters.slice(0, 30) + '"');
  }
  if (spill) add('text wider than its container', spill + ' layers, worst ' + worst + 'px (check in the desktop app before fixing)');
  // What the frame is made of: a screen meant to use the library should be mostly instances.
  const inst = f.findAllWithCriteria({ types: ['INSTANCE'] }).length;
  out.push({ id: f.id, section: sec.name, name: f.name, instances: inst, issues });
}
return { fonts, frames: out.length, withIssues: out.filter((x) => x.issues.length).length, noInstances: out.filter((x) => !x.instances).map((x) => x.name), out };
