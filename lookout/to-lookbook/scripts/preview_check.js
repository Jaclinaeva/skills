// Runs in a rendered preview. Defines window.__previewCheck(), which resolves to:
//   overflow  the page scrolls sideways, or an element sticks out past the edge of the window
//   clipped   text cut off by a container that hides its overflow (truncation with … is reported separately)
//   rules     words that break the writing guide's confirmed rules
//   a11y      axe-core WCAG 2.2 AA violations, when axe is on the page
(function () {
  function clean(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }
  function hidden(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) { var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return true; }
    var r = el.getBoundingClientRect(); return r.width <= 1 && r.height <= 1;
  }
  function where(el) {
    var s = el.tagName.toLowerCase(), c = (el.getAttribute('class') || '').trim().split(/\s+/).slice(0, 4).join('.');
    return s + (c ? '.' + c : '') + ' "' + clean(el.innerText).slice(0, 50) + '"';
  }

  // Inside a container that scrolls sideways on purpose, such as a wide table.
  function scrolls(el) {
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) if (/auto|scroll/.test(getComputedStyle(p).overflowX)) return true;
    return false;
  }

  function overflow() {
    var out = [], vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw + 1) out.push({ what: 'The page scrolls sideways', detail: document.documentElement.scrollWidth + 'px wide in a ' + vw + 'px window' });
    document.body.querySelectorAll('*').forEach(function (el) {
      if (hidden(el) || out.length > 10 || scrolls(el)) return;
      var r = el.getBoundingClientRect();
      if (r.right > vw + 1 && !(el.parentElement && el.parentElement.getBoundingClientRect().right > vw + 1)) out.push({ what: 'Sticks out past the window', detail: where(el) });
    });
    return out;
  }

  function clipped() {
    var out = [];
    document.body.querySelectorAll('*').forEach(function (el) {
      if (hidden(el) || !clean(el.innerText)) return;
      var cs = getComputedStyle(el), clipsX = /hidden|clip/.test(cs.overflowX), clipsY = /hidden|clip/.test(cs.overflowY);
      var wide = el.scrollWidth > el.clientWidth + 1, tall = el.scrollHeight > el.clientHeight + 1;
      if (clipsX && wide && cs.textOverflow === 'ellipsis') out.push({ what: 'Truncated with …', detail: where(el) + (el.closest('[title]') ? ' (full text in its title)' : ' (no title with the full text)') });
      else if ((clipsX && wide) || (clipsY && tall && cs.webkitLineClamp === 'none')) out.push({ what: 'Text cut off', detail: where(el) });
      else if (clipsY && tall) out.push({ what: 'Line-clamped', detail: where(el) });
    });
    return out.slice(0, 15);
  }

  // The writing guide's confirmed rules that a machine can check.
  function rules() {
    var app = document.querySelector('[class*="vendor"], [data-controller*="vendor"]') ? 'portal' : 'admin', out = [], seen = {};
    var ACRONYMS = /^(NDIS|GST|ABN|ABNS|AUD|PDF|CSV|XLSX|SAH|HCP|CHSP|DVA|DEX|NSW|VIC|QLD|ACT|API|URL|ID|IDS|SMS|FAQ|AT-HM|PO|POS|TAX)$/;
    var CHECKS = [['Member has a capital M', /\bmembers?\b/], ['Helper has a capital H', /\bhelpers?\b/],
      ['A term the guide says not to use', /\b(patients?|residents?|customers?|carers?|staff members?)\b/i],
      ['"please" or "simply"', /\b(please|simply)\b/i], ['US spelling', /\b(organiz\w*|colors?|centers?|prioritiz\w*|canceled|canceling|catalogs?)\b/i],
      ['Month-first date', /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/], ['"Are you sure"', /\bare you sure\b/i]];
    function add(rule, t) { var k = rule + '|' + t; if (!seen[k]) { seen[k] = 1; out.push({ rule: rule, text: t.slice(0, 140) }); } }
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (var n = w.nextNode(); n; n = w.nextNode()) {
      var el = n.parentElement, t = clean(n.textContent);
      if (!t || !el || el.closest('script, style') || hidden(el)) continue;
      if (getComputedStyle(el).textTransform === 'uppercase') add('Uppercase text', t);
      (t.match(/(?<![\w-])[A-Z]{4,}(?![\w-])/g) || []).forEach(function (x) { if (!ACRONYMS.test(x)) add('A word in capitals', t); });
      CHECKS.forEach(function (c) { if (c[1].test(t)) add(c[0], t); });
      if (app === 'admin' && /\bjobs?\b/i.test(t)) add('"job" in Admin, which says visit', t);
      if (app === 'portal' && /\bvisits?\b/i.test(t)) add('"visit" in the supplier portal, which says job', t);
    }
    document.querySelectorAll('h1, h2, h3, h4').forEach(function (h) {
      if (hidden(h)) return; var t = clean(h.textContent), ws = t.split(' ').slice(1).filter(function (x) { return /^[A-Za-z]{4,}$/.test(x); });
      if (ws.length >= 2 && ws.every(function (x) { return /^[A-Z]/.test(x); })) add('Heading in title case', t);
    });
    return out;
  }

  function a11y() {
    if (!window.axe) return Promise.resolve(null);
    return window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
      // Rules about the page as a document, which a component preview can't meet and shouldn't.
      rules: { 'html-has-lang': { enabled: false }, 'document-title': { enabled: false }, 'bypass': { enabled: false }, 'meta-viewport': { enabled: false }, 'landmark-one-main': { enabled: false }, 'page-has-heading-one': { enabled: false }, 'region': { enabled: false } },
      resultTypes: ['violations']
    }).then(function (r) {
      return r.violations.map(function (v) { return { rule: v.id, impact: v.impact, help: v.help, where: v.nodes.slice(0, 3).map(function (x) { return x.target.join(' '); }) }; });
    }, function (e) { return [{ rule: 'axe-error', help: String(e), where: [] }]; });
  }

  window.__previewCheck = function (opts) {
    var res = { overflow: overflow(), clipped: clipped() };
    if (opts && opts.layoutOnly) return Promise.resolve(res);
    res.rules = rules();
    return a11y().then(function (a) { res.a11y = a; return res; });
  };
})();
