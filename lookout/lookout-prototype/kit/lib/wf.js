// Wireframe blocks: low-fidelity on purpose, for conveying an idea rather than getting every detail right.
// Greyscale, flat, squared corners, no brand palette. State is shown by form (dashed, double border, ▲), not colour.
//
// Every block marks what it's for with data-wf="<kind>" (and data-wf-label where it helps), so a wireframe can be
// converted to the design system by intent: see references/wireframe-to-prototype.md. These are not components.
// Wireframes use the same runtime as prototypes (Proto.start, states, stories, the guide), with wireframe: true.
var WF = (function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function act(o) { return o && o.a ? ' data-a="' + esc(o.a) + '"' + (o.v != null ? ' data-v="' + esc(o.v) + '"' : '') : ''; }
  function mark(kind, label, extra) { return ' data-wf="' + kind + '"' + (label ? ' data-wf-label="' + esc(label) + '"' : '') + (extra ? ' data-wf-props=\'' + JSON.stringify(extra).replace(/'/g, '&#39;') + '\'' : ''); }

  var CSS = [
    '.wf, .wf * { box-sizing: border-box; }',
    '.wf { --wf-ink: #1a1a1a; --wf-mid: #595959; --wf-line: #b3b3b3; --wf-fill: #ededed; color: var(--wf-ink); font-size: 15px; line-height: 1.45; }',
    '.wf button, .wf input, .wf select, .wf textarea { font: inherit; color: inherit; }',
    '.wf-shell { display: flex; min-height: 100vh; background: #fff; }',
    '.wf-side { width: 208px; flex: none; border-right: 1px solid var(--wf-ink); padding: 20px 16px; display: flex; flex-direction: column; gap: 20px; }',
    '.wf-area { font-weight: 600; }',
    '.wf-here { border-left: 3px solid var(--wf-ink); padding: 2px 0 2px 10px; font-weight: 600; }',
    '.wf-main { flex: 1; min-width: 0; padding: 28px 32px; display: flex; flex-direction: column; gap: 20px; }',
    '.wf-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }',
    '.wf-h1 { font-size: 26px; font-weight: 600; margin: 0; line-height: 1.2; }',
    '.wf-h2 { font-size: 19px; font-weight: 600; margin: 0; }',
    '.wf-h3 { font-size: 16px; font-weight: 600; margin: 0; }',
    '.wf .wf-muted, .wf .wf-hint { color: var(--wf-mid); }',
    '.wf-small { font-size: 13px; }',
    '.wf-p { margin: 0; }',
    '.wf-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }',
    '.wf-between { justify-content: space-between; }',
    '.wf-stack { display: flex; flex-direction: column; gap: 12px; min-width: 0; }',
    '.wf-cols { display: grid; gap: 16px; }',
    '.wf-btn { border: 1px solid var(--wf-ink); background: #fff; padding: 0 16px; height: 40px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }',
    '.wf .wf-btn-primary { background: var(--wf-ink); color: #fff; }',
    '.wf-table, .wf-table *, .wf td, .wf th, .wf p, .wf h1, .wf h2, .wf h3, .wf label, .wf legend, .wf dt, .wf dd { color: inherit; }',
    '.wf-btn-destructive { border-width: 2px; font-weight: 600; }',
    '.wf-btn-sm { height: 32px; padding: 0 12px; font-size: 14px; }',
    '.wf .wf-btn[disabled] { border-style: dashed; color: var(--wf-mid); cursor: default; }',
    '.wf-link { text-decoration: underline; text-underline-offset: 2px; cursor: pointer; background: none; border: 0; padding: 0; }',
    '.wf-tabs { display: flex; border-bottom: 1px solid var(--wf-ink); }',
    '.wf-tab { padding: 8px 16px; border: 1px solid transparent; border-bottom: 0; cursor: pointer; background: none; }',
    '.wf-tab[aria-current="true"] { border-color: var(--wf-ink); background: #fff; margin-bottom: -1px; font-weight: 600; }',
    '.wf-count { color: var(--wf-mid); margin-left: 4px; }',
    '.wf-table { width: 100%; border-collapse: collapse; }',
    '.wf-table th, .wf-table td { text-align: left; padding: 10px 12px; border-bottom: 1px solid var(--wf-line); vertical-align: top; }',
    '.wf-table th { font-weight: 600; border-bottom: 1px solid var(--wf-ink); font-size: 14px; }',
    '.wf-table .wf-right { text-align: right; }',
    '.wf-table tr.wf-flag td { border-left: 0; background: repeating-linear-gradient(135deg, var(--wf-fill) 0 4px, transparent 4px 10px); }',
    '.wf-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }',
    '.wf-label { font-weight: 600; font-size: 14px; }',
    '.wf-input { border: 1px solid var(--wf-ink); height: 40px; padding: 0 10px; width: 100%; background: #fff; border-radius: 0; }',
    'textarea.wf-input { height: 88px; padding: 8px 10px; }',
    '.wf-input::placeholder { color: var(--wf-mid); }',
    '.wf-field-error .wf-input { border-width: 2px; }',
    '.wf-error { font-size: 13px; font-weight: 600; }',
    '.wf-hint { font-size: 13px; color: var(--wf-mid); }',
    '.wf-choice { display: flex; align-items: flex-start; gap: 8px; cursor: pointer; }',
    '.wf-choice input { width: 18px; height: 18px; margin: 2px 0 0; accent-color: var(--wf-ink); }',
    '.wf-panel { border: 1px solid var(--wf-ink); padding: 16px; display: flex; flex-direction: column; gap: 12px; min-width: 0; }',
    '.wf-callout { border: 1px solid var(--wf-ink); padding: 12px 14px; display: flex; gap: 10px; align-items: flex-start; }',
    '.wf-callout-warning { border-width: 2px; }',
    '.wf-callout-error { border: 4px double var(--wf-ink); }',
    '.wf-callout-success { border-style: dashed; }',
    '.wf-glyph { font-weight: 700; width: 18px; flex: none; text-align: center; }',
    '.wf-empty { border: 1px dashed var(--wf-ink); padding: 40px 24px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }',
    '.wf-box { border: 1px solid var(--wf-line); background: repeating-linear-gradient(135deg, var(--wf-fill) 0 6px, #fff 6px 14px); display: flex; align-items: center; justify-content: center; color: var(--wf-mid); font-size: 13px; padding: 8px; text-align: center; }',
    '.wf-tag { border: 1px solid var(--wf-ink); padding: 0 8px; font-size: 13px; display: inline-block; white-space: nowrap; }',
    '.wf-tag-dashed { border-style: dashed; }',
    '.wf-stat { border: 1px solid var(--wf-ink); padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; }',
    '.wf-stat-v { font-size: 22px; font-weight: 600; }',
    '.wf-lines { display: flex; flex-direction: column; gap: 8px; }',
    '.wf-lines span { height: 10px; background: var(--wf-fill); display: block; }',
    '.wf-menu { border: 1px solid var(--wf-line); background: #fff; width: 32px; height: 32px; cursor: pointer; }',
    '.wf-dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 24px; margin: 0; }',
    '.wf-dl dt { font-weight: 600; } .wf-dl dd { margin: 0; }',
    '.wf-hr { border: 0; border-top: 1px solid var(--wf-line); margin: 0; }',
    '.wf-scrim { position: fixed; inset: 0; top: var(--proto-bar-h, 0px); background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 50; }',
    '.wf-scrim-side { justify-content: flex-end; align-items: stretch; padding: 0; }',
    '.wf-modal { background: #fff; border: 1px solid var(--wf-ink); width: 600px; max-width: 100%; max-height: 90vh; display: flex; flex-direction: column; }',
    '.wf-scrim-side .wf-modal { width: 520px; max-height: none; height: 100%; }',
    '.wf-modal-h { padding: 16px 20px; border-bottom: 1px solid var(--wf-ink); display: flex; justify-content: space-between; align-items: center; gap: 12px; }',
    '.wf-modal-b { padding: 20px; overflow: auto; display: flex; flex-direction: column; gap: 16px; flex: 1; }',
    '.wf-modal-f { padding: 14px 20px; border-top: 1px solid var(--wf-ink); display: flex; justify-content: flex-end; gap: 8px; }',
    '.wf-toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: var(--wf-ink); color: #fff; padding: 10px 16px; z-index: 60; }'
  ].join('\n');
  (function mount() {
    if (typeof document === 'undefined' || document.getElementById('wf-css')) return;
    var st = document.createElement('style'); st.id = 'wf-css'; st.textContent = CSS; document.head.appendChild(st);
  })();

  function join(items) { return (Array.isArray(items) ? items : [items]).filter(function (x) { return x != null && x !== false && x !== ''; }).join(''); }

  return {
    // ---------- layout ----------
    // The app frame: only the area and the item being wireframed, never a full fake nav.
    shell: function (content, o) { o = o || {}; return '<div class="wf wf-shell"' + mark('shell', o.area, { here: o.here }) + '><aside class="wf-side">' + (o.area ? '<div class="wf-area">' + esc(o.area) + '</div>' : '') + (o.here ? '<div class="wf-here"' + mark('nav-item', o.here) + '>' + esc(o.here) + '</div>' : '') + '</aside><main class="wf-main">' + content + '</main></div>'; },
    row: function () { return '<div class="wf-row">' + join([].slice.call(arguments)) + '</div>'; },
    between: function () { return '<div class="wf-row wf-between">' + join([].slice.call(arguments)) + '</div>'; },
    stack: function () { return '<div class="wf-stack">' + join([].slice.call(arguments)) + '</div>'; },
    // cols(['2fr', '1fr'], [a, b])
    cols: function (widths, items) { return '<div class="wf-cols" style="grid-template-columns:' + widths.join(' ') + '">' + items.map(function (x) { return '<div class="wf-stack">' + x + '</div>'; }).join('') + '</div>'; },

    // ---------- text ----------
    header: function (title, o) { o = o || {}; return '<div class="wf-header"' + mark('page-header', title) + '><div class="wf-stack" style="gap:4px">' + (o.back ? '<button class="wf-link wf-small"' + act(o.back) + mark('back-link', o.back.label) + '>‹ ' + esc(o.back.label) + '</button>' : '') + '<h1 class="wf-h1">' + esc(title) + '</h1>' + (o.sub ? '<p class="wf-p wf-muted">' + o.sub + '</p>' : '') + '</div>' + (o.actions ? '<div class="wf-row">' + join(o.actions) + '</div>' : '') + '</div>'; },
    heading: function (text, level) { level = level || 2; return '<h' + level + ' class="wf-h' + level + '"' + mark('heading', text, { level: level }) + '>' + esc(text) + '</h' + level + '>'; },
    // text(html, { muted, small })
    text: function (html, o) { o = o || {}; return '<p class="wf-p' + (o.muted ? ' wf-muted' : '') + (o.small ? ' wf-small' : '') + '"' + mark('text') + '>' + html + '</p>'; },
    lines: function (n, widths) { var w = widths || ['100%', '92%', '64%']; var out = ''; for (var i = 0; i < (n || 3); i++) out += '<span style="width:' + w[i % w.length] + '"></span>'; return '<div class="wf-lines"' + mark('placeholder-text') + '>' + out + '</div>'; },

    // ---------- actions ----------
    // button(label, { variant: primary | secondary | destructive, size: 'sm', a, v, disabled })
    button: function (label, o) { o = o || {}; var v = o.variant || 'secondary'; return '<button type="button" class="wf-btn wf-btn-' + v + (o.size === 'sm' ? ' wf-btn-sm' : '') + '"' + act(o) + (o.disabled ? ' disabled' : '') + mark('button', label, { variant: v, disabled: !!o.disabled }) + '>' + esc(label) + '</button>'; },
    link: function (label, o) { return '<button type="button" class="wf-link"' + act(o) + mark('link', label) + '>' + esc(label) + '</button>'; },
    // menu(): a row's "more actions"; menu(['Edit', 'Remove']) lists what it holds for whoever converts it
    menu: function (items, o) { return '<button type="button" class="wf-menu" aria-label="More actions"' + act(o) + mark('row-menu', null, { items: items || [] }) + '>⋯</button>'; },
    tabs: function (items, active, action) { return '<div class="wf-tabs" role="tablist"' + mark('tabs') + '>' + items.map(function (t) { return '<button type="button" class="wf-tab" role="tab" aria-current="' + (t[0] === active) + '"' + (action ? ' data-a="' + action + '" data-v="' + esc(t[0]) + '"' : '') + '>' + esc(t[1]) + (t[2] != null ? '<span class="wf-count">' + esc(t[2]) + '</span>' : '') + '</button>'; }).join('') + '</div>'; },

    // ---------- content ----------
    // table(['Name', { label: 'Price', right: true }], [[cell, cell], …], { flag: [rowIndex] }) flags rows with a hatch
    table: function (cols, rows, o) { o = o || {}; var flag = o.flag || []; return '<table class="wf-table"' + mark('table', o.label) + '><thead><tr>' + cols.map(function (c) { return '<th' + (c.right ? ' class="wf-right"' : '') + '>' + esc(c.label != null ? c.label : c) + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.map(function (r, i) { return '<tr' + (flag.indexOf(i) >= 0 ? ' class="wf-flag"' : '') + '>' + r.map(function (c, j) { return '<td' + (cols[j] && cols[j].right ? ' class="wf-right"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>'; },
    panel: function (body, o) { o = o || {}; return '<section class="wf-panel"' + mark('panel', o.title) + '>' + (o.title || o.actions ? '<div class="wf-row wf-between"><h2 class="wf-h3">' + esc(o.title || '') + '</h2>' + (o.actions ? '<div class="wf-row">' + join(o.actions) + '</div>' : '') + '</div>' : '') + body + '</section>'; },
    // details([['Label', 'Value'], …])
    details: function (pairs) { return '<dl class="wf-dl"' + mark('details') + '>' + pairs.map(function (p) { return '<dt>' + esc(p[0]) + '</dt><dd>' + p[1] + '</dd>'; }).join('') + '</dl>'; },
    stat: function (label, value) { return '<div class="wf-stat"' + mark('stat', label) + '><span class="wf-small wf-muted">' + esc(label) + '</span><span class="wf-stat-v">' + esc(value) + '</span></div>'; },
    // tag(label, { dashed }) dashed: something pending or not yet confirmed
    tag: function (label, o) { o = o || {}; return '<span class="wf-tag' + (o.dashed ? ' wf-tag-dashed' : '') + '"' + mark('tag', label, o.dashed ? { dashed: true } : null) + '>' + esc(label) + '</span>'; },
    // callout(text, { tone: info | warning | error | success, title, actions })
    callout: function (text, o) { o = o || {}; var tone = o.tone || 'info', g = { info: 'i', warning: '▲', error: '✕', success: '✓' }[tone]; return '<div class="wf-callout wf-callout-' + tone + '" role="' + (tone === 'error' ? 'alert' : 'status') + '"' + mark('callout', o.title, { tone: tone }) + '><span class="wf-glyph" aria-hidden="true">' + g + '</span><div class="wf-stack" style="gap:4px;flex:1">' + (o.title ? '<strong>' + esc(o.title) + '</strong>' : '') + '<div>' + text + '</div>' + (o.actions ? '<div class="wf-row">' + join(o.actions) + '</div>' : '') + '</div></div>'; },
    empty: function (title, text, action) { return '<div class="wf-empty"' + mark('empty', title) + '><strong>' + esc(title) + '</strong>' + (text ? '<p class="wf-p wf-muted">' + text + '</p>' : '') + (action || '') + '</div>'; },
    // box('Chart of prices over time', { h: 160 }): anything not worked out yet
    box: function (label, o) { o = o || {}; return '<div class="wf-box" style="min-height:' + (o.h || 96) + 'px"' + mark('placeholder', label) + '>' + esc(label) + '</div>'; },
    divider: function () { return '<hr class="wf-hr"' + mark('divider') + '>'; },

    // ---------- forms ----------
    // field('Price', { type: text | number | money | date | select | textarea | checkbox | radio | toggle,
    //   value, placeholder, hint, error, options, bind, optional, checked })
    field: function (label, o) {
      o = o || {}; var t = o.type || 'text', b = o.bind ? ' data-b="' + esc(o.bind) + '"' : '';
      var props = { type: t }; if (o.error) props.error = true; if (o.optional) props.optional = true;
      if (t === 'checkbox' || t === 'radio' || t === 'toggle') return '<label class="wf-choice"' + mark('choice', label, props) + '><input type="' + (t === 'radio' ? 'radio' : 'checkbox') + '"' + (o.checked ? ' checked' : '') + b + (o.name ? ' name="' + esc(o.name) + '"' : '') + (t === 'toggle' ? ' role="switch"' : '') + '><span><span>' + esc(label) + '</span>' + (o.hint ? '<br><span class="wf-hint">' + esc(o.hint) + '</span>' : '') + '</span></label>';
      var input = t === 'select' ? '<select class="wf-input"' + b + '>' + (o.options || []).map(function (x) { return '<option' + (x === o.value ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>'
        : t === 'textarea' ? '<textarea class="wf-input"' + b + ' placeholder="' + esc(o.placeholder || '') + '">' + esc(o.value || '') + '</textarea>'
        : (t === 'money' ? '<div class="wf-row" style="gap:0;flex-wrap:nowrap"><span class="wf-input" style="width:auto;display:flex;align-items:center;border-right:0">$</span>' : '') + '<input class="wf-input" type="' + (t === 'money' || t === 'number' ? 'text' : t) + '" value="' + esc(o.value || '') + '" placeholder="' + esc(o.placeholder || '') + '"' + b + '>' + (t === 'money' ? '</div>' : '');
      return '<div class="wf-field' + (o.error ? ' wf-field-error' : '') + '"' + mark('field', label, props) + '><label class="wf-label">' + esc(label) + (o.optional ? ' <span class="wf-muted" style="font-weight:400">(optional)</span>' : '') + '</label>' + input + (o.error ? '<span class="wf-error">▲ ' + esc(o.error) + '</span>' : '') + (o.hint ? '<span class="wf-hint">' + esc(o.hint) + '</span>' : '') + '</div>';
    },
    // A group of radios or checkboxes under one label
    choices: function (label, items, o) { o = o || {}; return '<fieldset class="wf-field" style="border:0;padding:0;margin:0"' + mark('choices', label, { type: o.type || 'radio' }) + '><legend class="wf-label" style="margin-bottom:4px">' + esc(label) + '</legend><div class="wf-stack" style="gap:6px">' + items.map(function (x) { return WF.field(x.label || x, { type: o.type || 'radio', checked: x.checked, name: label, hint: x.hint }); }).join('') + '</div></fieldset>'; },

    // ---------- overlays ----------
    // modal(title, body, { footer: [buttons], side: true, close: 'actionName' })
    modal: function (title, body, o) { o = o || {}; return '<div class="wf wf-scrim' + (o.side ? ' wf-scrim-side' : '') + '"' + (o.close ? ' data-a="' + o.close + '" data-scrim' : '') + '><div class="wf-modal" role="dialog" aria-label="' + esc(title) + '"' + mark('modal', title, { side: !!o.side }) + '><div class="wf-modal-h"><h2 class="wf-h2">' + esc(title) + '</h2>' + (o.close ? '<button type="button" class="wf-link" aria-label="Close" data-a="' + o.close + '">✕</button>' : '') + '</div><div class="wf-modal-b">' + body + '</div>' + (o.footer ? '<div class="wf-modal-f">' + join(o.footer) + '</div>' : '') + '</div></div>'; },
    toast: function (text) { return '<div class="wf wf-toast" role="status"' + mark('toast', text) + '>' + esc(text) + '</div>'; }
  };
})();
