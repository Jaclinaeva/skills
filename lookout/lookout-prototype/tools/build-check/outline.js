// Runs in the page, on a prototype state or a built page. Defines window.__buildCheck(), which resolves to:
//   components  every marked component in document order: { name, inner?, depth, text }
//   bespoke     (built page only) styled markup written in a view rather than a component: { file, tag, classes, text }
//   copy        the interface's words: headings, buttons, links, labels, column headers, placeholders, paragraphs
//   rules       copy that breaks the writing guide's confirmed rules (same checks as the drift check)
//   a11y        axe-core WCAG 2.2 AA violations, when axe is on the page
// A built page has its components marked by the spec helper (data-component), and its templates annotated with
// BEGIN/END comments (annotate_rendered_view_with_filenames), which is how markup is traced to a view or a component.
(function () {
  var NAV = '[data-component="Admin::PrimaryNav::Component"], [data-component="Vendor::Nav::Component"]';
  var SKIP = 'script, style, template, [data-proto-ui]';
  var LAYOUT = /^(-?(flex|grid|inline|block|hidden|contents|items|justify|self|place|content|gap|space|order|grow|shrink|basis|col|row|w|h|min|max|size|p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|overflow|relative|static|sticky|isolate|z|divide-[xy]|sr-only|not-sr-only|truncate|whitespace|break|wrap|nowrap|group|peer|container)(-|$)|(sm|md|lg|xl|2xl):)/;
  function clean(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }
  function hidden(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) { var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return true; }
    var r = el.getBoundingClientRect(); return r.width <= 1 && r.height <= 1;
  }
  function root() { return document.querySelector('#app') || document.body; }

  // Which template wrote each element, from the annotation comments.
  function origins() {
    var map = new Map(), stack = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT);
    for (var n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeType === 8) {
        var m = n.data.match(/^\s*(BEGIN|END)\s+(\S+)/); if (!m) continue;
        if (m[1] === 'BEGIN') stack.push(m[2]); else { var i = stack.lastIndexOf(m[2]); if (i >= 0) stack.length = i; }
      } else if (stack.length) map.set(n, stack[stack.length - 1]);
    }
    return map;
  }

  function components() {
    var out = [];
    root().querySelectorAll('[data-component]').forEach(function (el) {
      if (el.closest(SKIP) || hidden(el)) return;
      var depth = 0; for (var p = el.parentElement; p; p = p.parentElement) if (p.hasAttribute('data-component')) depth++;
      var c = { name: el.getAttribute('data-component'), depth: depth, text: clean(el.innerText).slice(0, 80) };
      if (el.getAttribute('data-inner')) c.inner = el.getAttribute('data-inner');
      if (el.getAttribute('data-tier')) c.tier = el.getAttribute('data-tier');
      out.push(c);
    });
    return out;
  }

  // Styled markup in a view: the drift a prototype can't have, because the kit marks everything.
  function bespoke(map) {
    if (!map.size) return [];
    var out = [], taken = new Set();
    root().querySelectorAll('*').forEach(function (el) {
      if (el.closest(SKIP) || el.hasAttribute('data-component') || el.closest(NAV)) return;
      var file = map.get(el); if (!file || !/\/views\//.test(file)) return;
      for (var p = el.parentElement; p; p = p.parentElement) if (taken.has(p)) return;
      if (hidden(el)) return;
      var cls = (el.getAttribute('class') || '').split(/\s+/).filter(Boolean), styled = cls.filter(function (c) { return !LAYOUT.test(c); });
      var ownText = [].some.call(el.childNodes, function (n) { return n.nodeType === 3 && clean(n.textContent); });
      var control = /^(BUTTON|A|INPUT|SELECT|TEXTAREA|TABLE|UL|OL|H[1-6])$/.test(el.tagName);
      if (!styled.length && !ownText && !control) return;
      taken.add(el);
      out.push({ file: file, tag: el.tagName.toLowerCase(), classes: styled.join(' '), text: clean(el.innerText).slice(0, 80) });
    });
    return out;
  }

  function copy() {
    var out = [], seen = {};
    function add(kind, t) { t = clean(t); if (!t || t.length > 160) return; var k = kind + '|' + t; if (!seen[k]) { seen[k] = 1; out.push({ kind: kind, text: t }); } }
    function ok(el) { return !el.closest(SKIP) && !el.closest(NAV) && !hidden(el); }
    root().querySelectorAll('h1, h2, h3, h4').forEach(function (e) { if (ok(e)) add('heading', e.innerText); });
    root().querySelectorAll('button, [role="button"], input[type="submit"]').forEach(function (e) { if (ok(e) && !e.closest('tbody')) add('button', e.innerText || e.value || e.getAttribute('aria-label')); });
    root().querySelectorAll('a').forEach(function (e) { if (ok(e) && !e.closest('tbody')) add('link', e.innerText); });
    root().querySelectorAll('label, legend').forEach(function (e) { if (ok(e)) add('label', e.innerText); });
    root().querySelectorAll('th').forEach(function (e) { if (ok(e)) add('column', e.innerText); });
    root().querySelectorAll('[placeholder]').forEach(function (e) { if (ok(e)) add('placeholder', e.getAttribute('placeholder')); });
    root().querySelectorAll('[aria-label]').forEach(function (e) { if (ok(e) && !e.closest('tbody')) add('aria-label', e.getAttribute('aria-label')); });
    root().querySelectorAll('p').forEach(function (e) { if (ok(e) && !e.closest('table')) add('text', e.innerText); });
    return out;
  }

  // The writing guide's confirmed rules, as in the drift check.
  function rules() {
    var app = document.querySelector('[data-component^="Vendor::Layout"]') ? 'portal' : 'admin', out = [], seen = {};
    var ACRONYMS = /^(NDIS|GST|ABN|ABNS|AUD|PDF|CSV|XLSX|SAH|HCP|CHSP|DVA|DEX|NSW|VIC|QLD|ACT|API|URL|ID|IDS|SMS|FAQ|AT-HM|PO|POS|TAX)$/;
    var CHECKS = [['member', /\bmembers?\b/], ['helper', /\bhelpers?\b/], ['term', /\b(patients?|residents?|customers?|carers?|staff members?)\b/i],
      ['please', /\b(please|simply)\b/i], ['spelling', /\b(organiz\w*|colors?|centers?|prioritiz\w*|canceled|canceling|catalogs?)\b/i],
      ['date', /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/], ['confirm', /\bare you sure\b/i]];
    function add(rule, t) { var k = rule + '|' + t; if (!seen[k]) { seen[k] = 1; out.push({ rule: rule, text: t.slice(0, 140) }); } }
    var w = document.createTreeWalker(root(), NodeFilter.SHOW_TEXT);
    for (var n = w.nextNode(); n; n = w.nextNode()) {
      var el = n.parentElement, t = clean(n.textContent);
      if (!t || !el || el.closest(SKIP) || el.closest(NAV) || hidden(el)) continue;
      if (getComputedStyle(el).textTransform === 'uppercase') add('uppercase', t);
      (t.match(/(?<![\w-])[A-Z]{4,}(?![\w-])/g) || []).forEach(function (x) { if (!ACRONYMS.test(x)) add('allcaps', t); });
      CHECKS.forEach(function (c) { if (c[1].test(t)) add(c[0], t); });
      if (app === 'portal' && /\bvisits?\b/i.test(t)) add('visit-job', t);
      if (app === 'admin' && /\bjobs?\b/i.test(t)) add('visit-job', t);
    }
    return out;
  }

  function a11y() {
    if (!window.axe) return Promise.resolve(null);
    return window.axe.run({ include: [[root() === document.body ? 'body' : '#app']], exclude: [['[data-proto-ui]'], [NAV]] }, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      rules: { 'html-has-lang': { enabled: false }, 'document-title': { enabled: false }, 'bypass': { enabled: false }, 'meta-viewport': { enabled: false } },
      resultTypes: ['violations']
    }).then(function (r) {
      return r.violations.map(function (v) { return { id: v.id, impact: v.impact, help: v.help, count: v.nodes.length, nodes: v.nodes.slice(0, 3).map(function (x) { return x.target.join(' '); }) }; });
    }, function (e) { return [{ id: 'axe-error', help: String(e), count: 0 }]; });
  }

  window.__buildCheck = function () {
    var res = { url: location.href, components: components(), bespoke: bespoke(origins()), copy: copy(), rules: rules() };
    return a11y().then(function (a) { res.a11y = a; return res; });
  };
})();
