# Sending a prototype to Figma

- `capture.mjs` reads every state of a prototype in Chrome and writes `figma-export/`.
- `serve.mjs` serves that, plus `build.js`, `codematched.js`, `map.json` and `library/`, to the bridge plugin on localhost.
- `build.js` runs inside Figma and builds one frame per state.
- `codematched.js` maps each ViewComponent onto its code-matched component in 03 Components.
- `library/` holds what was read from 03 Components: `components.json` and `icons.json`.
- `map.json` holds the text style keys and sizes.

## Re-reading the library

With the bridge plugin open on 03 Components and `serve.mjs` running, run this through the bridge's execute tool,
targeting the 03 Components file. It saves the library's components and icons into `library/`.

```js
await figma.loadAllPagesAsync();
const BASE = 'http://localhost:9231';
const ip = figma.root.children.find((x) => x.name === 'Icons'); const icons = {};
for (const s of ip.findAllWithCriteria({ types: ['COMPONENT_SET'] })) {
  const base = s.name.toLowerCase().replace(/[\s-]+/g, '_');
  for (const v of s.children) {
    let vals; try { vals = Object.values(v.variantProperties || {}); } catch (e) { vals = v.name.split(',').map((x) => x.split('=')[1] || x); }
    vals = vals.map((x) => String(x).trim().toLowerCase().replace(/[\s\/-]+/g, '_'));
    icons[[base].concat(vals).join('_')] = v.key; if (!icons[base]) icons[base] = v.key;
  }
}
for (const c of ip.findAllWithCriteria({ types: ['COMPONENT'] }).filter((c) => c.parent.type !== 'COMPONENT_SET')) icons[c.name.toLowerCase().replace(/[\s-]+/g, '_')] = c.key;
const comps = [];
for (const p of figma.root.children) {
  if (p.name === 'Icons' || p.name === 'Archive') continue;
  for (const c of p.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) {
    if (c.type === 'COMPONENT' && c.parent && c.parent.type === 'COMPONENT_SET') continue;
    let defs = {}; try { defs = c.componentPropertyDefinitions; } catch (e) {}
    const props = {}; for (const [k, d] of Object.entries(defs)) props[k] = d.type === 'VARIANT' ? { type: 'VARIANT', options: d.variantOptions, default: d.defaultValue } : { type: d.type, default: d.type === 'SLOT' ? null : d.defaultValue };
    const def = c.type === 'COMPONENT_SET' ? (c.defaultVariant || c.children[0]) : c;
    const mirrors = ((c.description || '').match(/((?:Admin|Vendor)::[A-Za-z:]+Component|[A-Z][A-Za-z]+Component)/) || [])[1] || null;
    comps.push({ page: p.name, name: c.name, mirrors, key: def.key, props, w: Math.round(def.width), h: Math.round(def.height) });
  }
}
await fetch(BASE + '/save/icons.json', { method: 'POST', body: JSON.stringify(icons) });
await fetch(BASE + '/save/components.json', { method: 'POST', body: JSON.stringify(comps) });
return { icons: Object.keys(icons).length, components: comps.length };
```
