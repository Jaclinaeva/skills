// The prototype toolbar: Guide and Show components, across the top. Self-contained, so it works on any marked page,
// built from the kit or not. Everything it adds is [data-proto-ui], which every builder and check ignores.
//
// The guide is how people find every state. It follows the feature's user stories: each story is a section with its
// main path as numbered steps, then its other paths (errors, empty states, edge cases) and what was deliberately not
// designed. There is no separate list of states.
//
//   Toolbar.init({
//     scope: '#app',                 // where the design lives (CSS selector list); components are counted there
//     inDs: ['Admin::…'],            // components in the design system: a data-tier="code" on these is cleared
//     states: [{ id, label, kind, marker }],
//       kind    what makes it hard to find: error | empty | loading | confirm | warning | edge | hidden (reached through an
//               interaction with nothing on screen to point at it, like a double-click). Shown as a tag in the guide.
//       marker  the data-state this state must render (default: none, so it isn't checked)
//     stories: [{
//       id: 'U8', title: 'Know how to start',       // as in the stories doc
//       story: 'As a new supplier, I want …',        // optional: the story itself
//       url: 'https://…',                            // optional: a link to it
//       area: 'Purchase orders',                     // optional: groups stories; the guide gets a switch, one area at a time
//       steps: [{ state, title, text, detail }],     // the main path; detail: HTML, or a function returning it
//       other: [{ state, how, detail }],             // other paths; how: how a user gets there
//       notDesigned: [{ label, reason }]             // considered and deliberately not built
//     }],
//     storiesSource: { title: 'Phase 3 rates: user stories', url: 'https://…' },
//     guideIntro: '…',
//     guide: [{ state, title, text, detail }],   // pages without stories: one main path, with states that have a kind
//     notDesigned: [{ id, reason }],             //   as its other paths
//     go: function (id) { … },       // opens a state. Omit it when using recipes.
//     recipes: { id: [step, …] },    // for pages not built on the kit: opening a state resets the page, reloads at
//                                    // #state=<id> and runs its steps in order (each may return a promise)
//     reset: function () { … },      // with recipes: clears the page's saved data before a reload
//     note: 'Fictional data · today is 18 Nov 2026'   // the context line in the bar (default: the page title)
//     wireframe: true                // labels the bar Wireframe and leaves out Show components
//   })
//   Toolbar.setCurrent(id)   tells the toolbar which state is on screen
//   Toolbar.update()         call after the page redraws
var Toolbar = (function () {
  var cfg = { scope: '#app', inDs: [], states: [], stories: [], storiesSource: null, guide: [], guideIntro: '', notDesigned: [], go: null };
  var current = null, guidePos = null, openStory = null, pickedArea = null;
  var KEY = 'ds-legend-v1', on = false, open = null, hidden = false, tiers = { ds: false, code: true, proposed: true };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) { on = saved.on; tiers = saved.tiers; hidden = !!saved.hidden; } } catch (e) {}
  try { var g0 = JSON.parse(sessionStorage.getItem(KEY + '-guide') || 'null'); if (g0) { guidePos = g0.pos || null; openStory = g0.story == null ? null : g0.story; open = g0.open === 'states' ? 'guide' : g0.open; } } catch (e) {}
  if (location.hash === '#components') on = true;
  // ?proto-bar=off hides the bar for this page load only, for screenshots.
  var barOff = /[?&]proto-bar=off\b/.test(location.search); if (barOff) hidden = true;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ on: on, tiers: tiers, hidden: barOff ? false : hidden })); } catch (e) {}
    try { sessionStorage.setItem(KEY + '-guide', JSON.stringify({ pos: guidePos, story: openStory, open: open })); } catch (e) {}
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- styles and containers ----------
  var CSS = [
    'body.ds-ds [data-component]:not([data-tier]) { outline: 1px solid #1F826A; outline-offset: 1px; }',
    'body.ds-code [data-tier="code"] { outline: 2px dashed #0034E5; outline-offset: 2px; }',
    'body.ds-proposed [data-tier="proposed"] { outline: 2px dashed #B50575; outline-offset: 2px; background-image: repeating-linear-gradient(135deg, rgba(181,5,117,.05) 0 6px, transparent 6px 12px); }',
    // The bar sits across the top. The page is padded to make room, and sticky headers and full-screen overlays move below it.
    'html { --proto-bar-h: 48px; }',
    'body.proto-bar-on { padding-top: var(--proto-bar-h) !important; box-sizing: border-box; }',
    'body.proto-bar-on .sticky.top-0, body.proto-bar-on .fixed.top-0:not([data-menu-pop]), body.proto-bar-on .fixed.inset-0 { top: var(--proto-bar-h) !important; }',
    'body.proto-bar-on .sticky.h-screen { height: calc(100vh - var(--proto-bar-h)) !important; }',
    // The same for responsive sticky and drawer shells, like the supplier portal's nav (lg:sticky lg:top-0 lg:h-dvh, fixed inset-y-0 below lg).
    'body.proto-bar-on .fixed.inset-y-0 { top: var(--proto-bar-h) !important; }',
    '@media (min-width: 1024px) { body.proto-bar-on .lg\\:sticky.lg\\:top-0 { top: var(--proto-bar-h) !important; } body.proto-bar-on .lg\\:sticky.lg\\:h-dvh { height: calc(100dvh - var(--proto-bar-h)) !important; } body.proto-bar-on .sticky.top-0.lg\\:relative { top: auto !important; } }',
    '#ds-legend { position: fixed; top: 0; left: 0; right: 0; z-index: 2147483000; font: 13px/1.4 "Visuelt Pro", "Figtree", system-ui, sans-serif; }',
    '#ds-legend .ds-bar { height: var(--proto-bar-h); box-sizing: border-box; background: #162250; color: #fff; display: flex; align-items: center; gap: 12px; padding: 0 16px; }',
    '#ds-legend .ds-tag { background: #FBAE26; color: #162250; font-weight: 500; font-size: 12px; border-radius: 8px; padding: 0 8px; height: 24px; display: inline-flex; align-items: center; white-space: nowrap; }',
    '#ds-legend .ds-note { flex: 1; min-width: 0; color: rgba(255,255,255,.8); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 14px; }',
    '#ds-legend .ds-btns { display: flex; gap: 8px; flex-wrap: nowrap; }',
    '#ds-legend .ds-toggle { appearance: none; border: 1px solid rgba(255,255,255,.4); background: transparent; color: #fff; border-radius: 6px; padding: 0 10px; height: 32px; font: inherit; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; gap: 6px; }',
    '#ds-legend .ds-toggle:hover { border-color: #fff; }',
    '#ds-legend .ds-toggle:focus-visible { outline: 2px solid #FBAE26; outline-offset: 2px; }',
    '#ds-legend .ds-toggle[aria-expanded="true"], #ds-legend .ds-toggle[aria-pressed="true"] { background: #fff; color: #162250; border-color: #fff; }',
    '#ds-legend .ds-show { position: fixed; top: 8px; right: 8px; appearance: none; border: 0; background: #162250; color: #fff; border-radius: 999px; padding: 0 12px; height: 32px; font: inherit; font-size: 12px; font-weight: 500; cursor: pointer; box-shadow: 0 .5rem 1rem rgba(51,53,112,.15); opacity: .85; }',
    '#ds-legend .ds-show:hover { opacity: 1; }',
    '#ds-legend .ds-panel { position: absolute; top: calc(var(--proto-bar-h) + 8px); right: 16px; background: #fff; border: 1px solid #DEDEE7; border-radius: 8px; padding: 12px 14px; width: 320px; max-width: calc(100vw - 32px); max-height: calc(100vh - var(--proto-bar-h) - 24px); overflow: auto; box-shadow: 0 .5rem 1rem rgba(51,53,112,.15); display: flex; flex-direction: column; gap: 6px; color: #333570; box-sizing: border-box; }',
    '#ds-legend .ds-panel b { color: #162250; font-weight: 500; }',
    '#ds-legend .ds-row { display: flex; align-items: center; gap: 8px; cursor: pointer; }',
    '#ds-legend .ds-sw { width: 18px; height: 12px; border-radius: 3px; flex: none; }',
    '#ds-legend .ds-k-ds .ds-sw { border: 1px solid #1F826A; }',
    '#ds-legend .ds-k-code .ds-sw { border: 2px dashed #0034E5; }',
    '#ds-legend .ds-k-proposed .ds-sw { border: 2px dashed #B50575; }',
    '#ds-legend ul { margin: 0 0 4px 26px; padding: 0; list-style: none; color: #70729B; font-size: 12px; display: flex; flex-direction: column; gap: 2px; word-break: break-word; }',
    '#ds-legend p { margin: 4px 0 0; color: #70729B; font-size: 12px; }',
    '#ds-legend .ds-group { margin-top: 6px; color: #70729B; font-size: 12px; }',
    '#ds-legend .ds-state { appearance: none; border: 0; background: none; font: inherit; color: #0034E5; text-align: left; padding: 4px 6px; margin: 0 -6px; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; gap: 8px; }',
    '#ds-legend .ds-state:hover { background: #F0F3FE; }',
    '#ds-legend .ds-state[aria-current="true"] { background: #E5EBFD; color: #162250; font-weight: 500; }',
    '#ds-legend .ds-kind { font-style: normal; font-size: 11px; font-weight: 500; border-radius: 4px; padding: 1px 6px; background: #EBEBF1; color: #333570; white-space: nowrap; align-self: center; }',
    '#ds-legend .ds-kind-error { background: #FDE8E8; color: #B3261E; }',
    '#ds-legend .ds-kind-warning { background: #FFF1D6; color: #7A4B00; }',
    '#ds-legend .ds-kind-hidden { background: #F3E3EE; color: #8A1F63; }',
    '#ds-legend .ds-nd { margin: 0; color: #70729B; }',
    '#ds-legend .ds-nd b { color: #333570; font-weight: 500; }',
    '#ds-legend .ds-state small { color: #B50575; font-size: 11px; font-weight: 400; }',
    '#ds-legend .ds-guide { width: 400px; }',
    '#ds-legend .ds-intro { margin: 0 0 6px; color: #70729B; font-size: 13px; }',
    '#ds-legend .ds-steps { border: 1px solid #DEDEE7; border-radius: 8px; overflow: hidden; }',
    '#ds-legend .ds-step { appearance: none; border: 0; border-top: 1px solid #DEDEE7; background: #fff; font: inherit; width: 100%; text-align: left; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; cursor: pointer; color: #70729B; }',
    '#ds-legend .ds-step:first-child { border-top: 0; }',
    '#ds-legend .ds-step:hover { background: #F0F3FE; }',
    '#ds-legend .ds-step[aria-current="true"] { background: #E5EBFD; }',
    '#ds-legend .ds-step > span:first-child { display: flex; flex-direction: column; gap: 2px; min-width: 0; }',
    '#ds-legend .ds-step-t { color: #162250; font-weight: 500; }',
    '#ds-legend .ds-step-d { font-size: 12px; }',
    '#ds-legend .ds-detail { padding: 4px 12px 12px; background: #E5EBFD; color: #333570; font-size: 13px; line-height: 1.5; }',
    '#ds-legend .ds-detail ul { margin: 0; padding-left: 18px; list-style: disc; color: inherit; font-size: inherit; gap: 4px; }',
    '#ds-legend .ds-detail b { font-weight: 500; }',
    '#ds-legend .ds-areas { display: flex; gap: 2px; padding: 2px; margin: 2px 0 4px; background: #EFF0F7; border-radius: 8px; }',
    '#ds-legend .ds-area { appearance: none; border: 0; background: none; font: inherit; font-size: 12px; font-weight: 500; color: #52549A; flex: 1; padding: 6px 4px; border-radius: 6px; cursor: pointer; white-space: nowrap; }',
    '#ds-legend .ds-area:hover { color: #162250; }',
    '#ds-legend .ds-area[aria-pressed="true"] { background: #fff; color: #162250; box-shadow: 0 1px 2px rgba(51,53,112,.15); }',
    '#ds-legend .ds-area:focus-visible { outline: 2px solid #0034E5; outline-offset: 1px; }',
    '#ds-legend .ds-sec { display: flex; flex-direction: column; gap: 6px; }',
    '#ds-legend .ds-sec + .ds-sec { border-top: 1px solid #DEDEE7; padding-top: 6px; }',
    '#ds-legend .ds-story { appearance: none; border: 0; background: none; font: inherit; color: #162250; text-align: left; padding: 6px; margin: 0 -6px; border-radius: 4px; cursor: pointer; display: flex; align-items: baseline; gap: 8px; }',
    '#ds-legend .ds-story:hover { background: #F0F3FE; }',
    '#ds-legend .ds-story-id { font-size: 12px; font-weight: 500; color: #70729B; flex: none; min-width: 24px; }',
    '#ds-legend .ds-story-t { flex: 1; font-weight: 500; }',
    '#ds-legend .ds-story-n { font-size: 12px; color: #70729B; white-space: nowrap; }',
    '#ds-legend .ds-story-text { margin: 0; color: #70729B; font-size: 12px; }',
    '#ds-legend .ds-story-text a, #ds-legend .ds-intro a { color: #0034E5; }',
    '#ds-legend .ds-state > span:first-child { display: flex; flex-direction: column; gap: 1px; }',
    '#ds-legend .ds-how { color: #70729B; font-size: 12px; }',
    '#ds-legend .ds-step-nav { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; color: #70729B; font-size: 12px; }',
    '#ds-legend .ds-link { appearance: none; border: 0; background: none; font: inherit; color: #0034E5; cursor: pointer; padding: 4px 0; }',
    '#ds-legend .ds-link:disabled { color: #B9BAD0; cursor: default; }',
    '[data-state].ds-flash { outline: 3px solid #0034E5 !important; outline-offset: 4px; }',
    '#ds-tip { position: fixed; z-index: 2147483001; max-width: 320px; background: #162250; color: #fff; border-radius: 6px; padding: 8px 10px; font: 12px/1.4 "Visuelt Pro", "Figtree", system-ui, sans-serif; display: flex; flex-direction: column; gap: 2px; pointer-events: none; box-shadow: 0 3px 4px rgba(51,53,112,.05), 0 8px 16px rgba(51,53,112,.05); }',
    '#ds-tip b { font-weight: 500; }',
    '#ds-tip span { color: #CFD9FB; }'
  ].join('\n');
  function mount() {
    if (document.getElementById('ds-legend')) return;
    var st = document.createElement('style'); st.setAttribute('data-proto-ui', ''); st.textContent = CSS; document.head.appendChild(st);
    var box = document.createElement('div'); box.id = 'ds-legend'; box.setAttribute('data-proto-ui', ''); document.body.appendChild(box);
    var tip = document.createElement('div'); tip.id = 'ds-tip'; tip.setAttribute('data-proto-ui', ''); tip.hidden = true; document.body.appendChild(tip);
  }

  // ---------- tiers ----------
  function tierOf(el) { return el.getAttribute('data-tier') || 'ds'; }
  function inScope(sel) { return cfg.scope.split(',').map(function (s) { return s.trim() + ' ' + sel; }).join(', '); }
  function settle() { document.querySelectorAll('[data-tier="code"]').forEach(function (el) { if (cfg.inDs.indexOf(el.getAttribute('data-component')) >= 0) el.removeAttribute('data-tier'); }); }
  function apply() { document.body.classList.toggle('ds-show', on); ['ds', 'code', 'proposed'].forEach(function (t) { document.body.classList.toggle('ds-' + t, on && tiers[t]); }); }

  // ---------- panels ----------
  function componentsPanel() {
    var names = { ds: {}, code: {}, proposed: {} };
    document.querySelectorAll(inScope('[data-component]')).forEach(function (el) { var n = el.getAttribute('data-component').replace(/^proposed:/, ''); var t = tierOf(el); names[t][n] = (names[t][n] || 0) + 1; });
    var rows = [['ds', 'In the design system'], ['code', 'In code, not in the design system yet'], ['proposed', 'Proposed: exists nowhere yet']];
    return '<div class="ds-panel"><b>Components on this screen</b>' + rows.map(function (r) {
      var list = Object.keys(names[r[0]]);
      return '<label class="ds-row ds-k-' + r[0] + '"><input type="checkbox" data-t="' + r[0] + '"' + (tiers[r[0]] ? ' checked' : '') + '><span class="ds-sw"></span><span>' + r[1] + ' · ' + list.length + '</span></label>' + (r[0] !== 'ds' && list.length ? '<ul>' + list.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '');
    }).join('') + '<p>Hover an outline to see its name and why it is there.</p></div>';
  }
  var KINDS = { error: 'Error', empty: 'Empty', loading: 'Loading', confirm: 'Confirm', warning: 'Warning', edge: 'Edge case', hidden: 'Hidden' };
  function stateOf(id) { return cfg.states.filter(function (x) { return x.id === id; })[0] || { id: id, label: id }; }
  function ndList(list) { return list.map(function (n) { return { label: n.label || n.id, reason: n.reason }; }); }
  // The guide's sections: one per story, then any state no story reaches, so every state can still be found.
  function sections() {
    if (cfg.stories.length) {
      var used = {};
      cfg.stories.forEach(function (st) { (st.steps || []).concat(st.other || []).forEach(function (g) { used[g.state] = 1; }); });
      var loose = cfg.states.filter(function (x) { return !used[x.id]; });
      var secs = cfg.stories.slice();
      if (loose.length || cfg.notDesigned.length) secs.push({ id: '', title: 'Not in a story yet', other: loose.map(function (x) { return { state: x.id }; }), notDesigned: ndList(cfg.notDesigned) });
      return secs;
    }
    // Pages without stories: the guide is the main path. States with a kind (or every other state, if none has a kind) are its other paths.
    var inGuide = {}; cfg.guide.forEach(function (g) { inGuide[g.state] = 1; });
    var anyKind = cfg.states.some(function (x) { return x.kind; });
    return [{ id: '', title: '', steps: cfg.guide, other: cfg.states.filter(function (x) { return !inGuide[x.id] && (x.kind || !anyKind); }).map(function (x) { return { state: x.id }; }), notDesigned: ndList(cfg.notDesigned) }];
  }
  // Positions are '<section>:step:<i>' or '<section>:other:<i>'. Back and Next walk every story's steps in order.
  function flatSteps(secs) { var f = []; secs.forEach(function (sec, si) { (sec.steps || []).forEach(function (g, i) { f.push(si + ':step:' + i); }); }); return f; }
  function posItem(secs, pos) { var p = String(pos).split(':'), sec = secs[+p[0]], list = sec && (p[1] === 'step' ? sec.steps : sec.other); return list ? list[+p[2]] : null; }
  function openSection(secs) {
    if (openStory != null && (openStory === -1 || secs[openStory])) return openStory;
    if (guidePos != null) return +String(guidePos).split(':')[0];
    for (var si = 0; si < secs.length; si++) if ((secs[si].steps || []).concat(secs[si].other || []).some(function (g) { return g.state === current; })) return si;
    return 0;
  }
  function detailOf(g) { return g.detail ? '<div class="ds-detail">' + (typeof g.detail === 'function' ? g.detail() : g.detail) + '</div>' : ''; }
  function isCur(key, state) { return guidePos != null ? guidePos === key && state === current : state === current; }
  // Areas (optional): stories with an `area` get a switch at the top of the guide that shows one area at a time.
  // The area follows the open story until someone picks one; sections with no area show in every area.
  function areasOf(secs) { var a = []; secs.forEach(function (s) { if (s.area && a.indexOf(s.area) < 0) a.push(s.area); }); return a; }
  function activeArea(secs) { var areas = areasOf(secs); if (!areas.length) return null; if (pickedArea && areas.indexOf(pickedArea) >= 0) return pickedArea; var os = openSection(secs); return (secs[os] && secs[os].area) || areas[0]; }
  function guidePanel() {
    var secs = sections(), flat = flatSteps(secs), os = openSection(secs), single = secs.length === 1 && !secs[0].title;
    var areas = areasOf(secs), area = activeArea(secs);
    var areaBar = areas.length > 1 ? '<div class="ds-areas" role="group" aria-label="Areas">' + areas.map(function (a) { return '<button type="button" class="ds-area" data-t="area" data-v="' + esc(a) + '" aria-pressed="' + (a === area) + '">' + esc(a) + '</button>'; }).join('') + '</div>' : '';
    var src = cfg.storiesSource ? '<p class="ds-intro">Stories from ' + (cfg.storiesSource.url ? '<a href="' + esc(cfg.storiesSource.url) + '" target="_blank" rel="noopener">' + esc(cfg.storiesSource.title || 'the stories doc') + '</a>' : esc(cfg.storiesSource.title)) + '.</p>' : '';
    var html = secs.map(function (sec, si) {
      if (area && sec.area && sec.area !== area) return '';
      var steps = sec.steps || [], other = sec.other || [], nd = sec.notDesigned || [], isOpen = single || si === os;
      var counts = [steps.length ? steps.length + (steps.length === 1 ? ' step' : ' steps') : '', other.length ? other.length + ' other' : '', nd.length ? nd.length + ' not designed' : ''].filter(Boolean).join(' · ');
      var head = single ? '' : '<button type="button" class="ds-story" data-t="story" data-s="' + si + '" aria-expanded="' + isOpen + '"><span class="ds-story-id">' + esc(sec.id || '') + '</span><span class="ds-story-t">' + esc(sec.title) + '</span><span class="ds-story-n">' + counts + '</span></button>';
      if (!isOpen) return '<div class="ds-sec">' + head + '</div>';
      var body = (sec.story ? '<p class="ds-story-text">' + esc(sec.story) + (sec.url ? ' <a href="' + esc(sec.url) + '" target="_blank" rel="noopener">Story</a>' : '') + '</p>' : '') +
        (steps.length ? '<div class="ds-steps">' + steps.map(function (g, i) {
          var key = si + ':step:' + i, cur = isCur(key, g.state);
          return '<button type="button" class="ds-step" data-t="go" data-p="' + key + '" aria-current="' + cur + '"><span><span class="ds-step-t">' + (i + 1) + '. ' + esc(g.title) + '</span>' + (g.text ? '<span class="ds-step-d">' + esc(g.text) + '</span>' : '') + '</span><span aria-hidden="true">›</span></button>' + (cur ? detailOf(g) : '');
        }).join('') + '</div>' : '') +
        (other.length ? '<div class="ds-group">' + (steps.length ? 'Other paths' : 'States') + '</div>' + other.map(function (o, i) {
          var key = si + ':other:' + i, st = stateOf(o.state), cur = isCur(key, o.state), missing = cur && st.marker && !document.querySelector('[data-state="' + st.marker + '"]');
          return '<button type="button" class="ds-state" data-t="go" data-p="' + key + '" aria-current="' + cur + '"><span><span>' + esc(st.label || st.id) + '</span>' + (o.how ? '<span class="ds-how">' + esc(o.how) + '</span>' : '') + '</span>' + (missing ? '<small>not on screen</small>' : st.kind ? '<em class="ds-kind ds-kind-' + st.kind + '">' + esc(KINDS[st.kind] || st.kind) + '</em>' : '') + '</button>' + (cur ? detailOf(o) : '');
        }).join('') : '') +
        (nd.length ? '<div class="ds-group">Not designed</div><ul class="ds-nd">' + nd.map(function (n) { return '<li><b>' + esc(n.label) + '</b> · ' + esc(n.reason || 'No reason given') + '</li>'; }).join('') + '</ul>' : '');
      return '<div class="ds-sec">' + head + body + '</div>';
    }).join('');
    var fi = flat.indexOf(guidePos);
    var nav = fi >= 0 ? '<div class="ds-step-nav"><button type="button" class="ds-link" data-t="go" data-p="' + (flat[fi - 1] || '') + '"' + (fi === 0 ? ' disabled' : '') + '>Back</button><span>Step ' + (fi + 1) + ' of ' + flat.length + '</span><button type="button" class="ds-link" data-t="go" data-p="' + (flat[fi + 1] || '') + '"' + (fi === flat.length - 1 ? ' disabled' : '') + '>Next</button></div>' : '';
    return '<div class="ds-panel ds-guide"><b>Guide</b>' + (cfg.guideIntro ? '<p class="ds-intro">' + esc(cfg.guideIntro) + '</p>' : '') + src + areaBar + html + nav + '<p>Each state opens from a fresh start. Its link: #state=&lt;id&gt;.</p></div>';
  }
  function hasGuide() { return !!(cfg.stories.length || cfg.guide.length || cfg.states.length); }
  function update() {
    mount(); settle(); apply();
    var box = document.getElementById('ds-legend');
    document.body.classList.toggle('proto-bar-on', !hidden);
    document.documentElement.style.setProperty('--proto-bar-h', hidden ? '0px' : '48px');
    if (hidden && barOff) { box.innerHTML = ''; return; }
    if (hidden) { box.innerHTML = '<button type="button" class="ds-show" data-t="hide" title="Show the prototype bar (Shift + D)">Prototype</button>'; return; }
    var panel = open === 'guide' && hasGuide() ? guidePanel() : open === 'components' ? componentsPanel() : '';
    box.innerHTML = '<div class="ds-bar" role="navigation" aria-label="Prototype controls"><span class="ds-tag">' + (cfg.wireframe ? 'Wireframe' : 'Prototype') + '</span><span class="ds-note">' + esc(cfg.note || document.title) + '</span><div class="ds-btns">' +
      (hasGuide() ? '<button type="button" class="ds-toggle" data-t="guide" aria-expanded="' + (open === 'guide') + '">Guide</button>' : '') +
      (cfg.wireframe ? '' : '<button type="button" class="ds-toggle" data-t="toggle" aria-pressed="' + on + '">' + (on ? 'Hide components' : 'Show components') + '</button>') +
      '<button type="button" class="ds-toggle" data-t="hide" title="Hide the prototype bar (Shift + D)">Hide</button></div></div>' + panel;
  }
  function flash(marker) {
    var el = marker && document.querySelector('[data-state="' + marker + '"]');
    if (el) { el.scrollIntoView({ block: 'nearest' }); el.classList.add('ds-flash'); setTimeout(function () { el.classList.remove('ds-flash'); }, 1500); }
  }

  // ---------- events ----------
  document.addEventListener('click', function (e) {
    var t = e.target.closest('#ds-legend [data-t]'); if (!t) return;
    var k = t.getAttribute('data-t');
    if (k === 'go') { var p = t.getAttribute('data-p'), g = p && posItem(sections(), p); if (!g) return; guidePos = p; openStory = +p.split(':')[0]; pickedArea = null; save(); cfg.go(g.state); return; }
    if (k === 'area') {
      var secs0 = sections(); pickedArea = t.getAttribute('data-v');
      var first = secs0.map(function (s, i) { return s.area === pickedArea ? i : -1; }).filter(function (i) { return i >= 0; })[0];
      if (secs0[openSection(secs0)].area !== pickedArea) openStory = first;
    }
    if (k === 'story') { var si = +t.getAttribute('data-s'); openStory = openSection(sections()) === si ? -1 : si; }
    else if (k === 'area') { /* handled above */ }
    else if (k === 'guide') open = open === k ? null : k;
    else if (k === 'toggle') { on = !on; open = on ? 'components' : (open === 'components' ? null : open); }
    else if (k === 'hide') { hidden = !hidden; open = null; }
    else if (t.tagName === 'INPUT') tiers[k] = t.checked; else return;
    save(); update();
  });
  document.addEventListener('keydown', function (e) {
    if (e.shiftKey && (e.key === 'D' || e.key === 'd') && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && !e.target.isContentEditable) { hidden = !hidden; open = null; save(); update(); }
  });
  // A click outside the bar closes the Components panel. The guide stays open while you try things.
  document.addEventListener('click', function (e) { if (open && open !== 'guide' && !e.target.closest('#ds-legend')) { open = null; save(); update(); } }, true);
  document.addEventListener('mouseover', function (e) {
    if (!on) return; var tip = document.getElementById('ds-tip'); if (!tip) return;
    var el = e.target.closest(inScope('[data-component]'));
    while (el && !tiers[tierOf(el)]) el = el.parentElement && el.parentElement.closest('[data-component]');
    if (!el || el.closest('[data-proto-ui]')) { tip.hidden = true; return; }
    var t = tierOf(el), note = el.getAttribute('data-note');
    tip.innerHTML = '<b>' + esc(el.getAttribute('data-component').replace(/^proposed:/, '')) + '</b><span>' + (t === 'ds' ? 'In the design system' : t === 'code' ? 'In code, not in the design system yet' : 'Proposed') + '</span>' + (note ? '<span>' + esc(note) + '</span>' : '');
    var r = el.getBoundingClientRect(); tip.style.left = Math.max(8, Math.min(r.left, innerWidth - 328)) + 'px'; tip.style.top = (r.top > 90 ? r.top - 8 : r.bottom + 8) + 'px'; tip.style.transform = r.top > 90 ? 'translateY(-100%)' : 'none'; tip.hidden = false;
  });

  // ---------- recipes ----------
  function stateFromHash() { var m = location.hash.match(/^#state=(.+)$/); return m ? decodeURIComponent(m[1]) : null; }
  function runRecipe(id) {
    var steps = cfg.recipes[id]; if (!steps) return;
    var i = 0;
    (function next() {
      if (i >= steps.length) { current = id; update(); var s = cfg.states.filter(function (x) { return x.id === id; })[0]; flash(s && s.marker); return; }
      var r; try { r = steps[i++](); } catch (err) { console.warn('State ' + id + ' failed at step ' + i, err); }
      Promise.resolve(r).then(function () { setTimeout(next, 150); });
    })();
  }

  function init(o) {
    for (var k in o) cfg[k] = o[k];
    if (cfg.recipes && !o.go) cfg.go = function (id) {
      if (cfg.reset) cfg.reset();
      location.hash = 'state=' + encodeURIComponent(id); location.reload();
    };
    // The states, stories and what wasn't designed, as JSON for the drift check, the Figma capture and the handover.
    function data(id, value) { var el = document.createElement('script'); el.type = 'application/json'; el.id = id; el.setAttribute('data-proto-ui', ''); el.textContent = JSON.stringify(value).replace(/</g, '\\u003c'); document.body.appendChild(el); }
    data('proto-states', cfg.states.map(function (s) { var x = { id: s.id, label: s.label || s.id }; if (s.kind) x.kind = s.kind; if (s.marker) x.marker = s.marker; return x; }));
    if (cfg.stories.length) data('proto-stories', { source: cfg.storiesSource, stories: cfg.stories.map(function (st) {
      return { id: st.id, title: st.title, story: st.story, url: st.url, steps: (st.steps || []).map(function (g) { return { state: g.state, title: g.title }; }), other: (st.other || []).map(function (o) { return { state: o.state, how: o.how }; }), notDesigned: st.notDesigned || [] };
    }) });
    var nds = ndList(cfg.notDesigned);
    cfg.stories.forEach(function (st) { (st.notDesigned || []).forEach(function (n) { nds.push({ label: n.label, reason: n.reason, story: st.id }); }); });
    if (nds.length) data('proto-not-designed', nds);
    update();
    if (cfg.recipes) { var id = stateFromHash(); if (id) setTimeout(function () { runRecipe(id); }, 300); }
  }
  return { init: init, update: update, flash: flash, setCurrent: function (id) { current = id; }, clearGuide: function () { guidePos = null; save(); } };
})();
