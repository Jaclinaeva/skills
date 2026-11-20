// Prototype runtime: the admin shell, actions and bindings, and wiring for the toolbar (toolbar.js).
// None of this is part of the design. Everything inside #app is; the toolbar is [data-proto-ui], which every
// builder and check ignores.
//
//   Proto.start({ state, actions, render, states })
//     states: [{ id: 'list:empty', label: 'No records match', set: function (s) { s.q = 'zzz'; } }]
//       Each one starts from a fresh copy of `state`, applies set(), and must render a [data-state="<id>"].
//       #state=<id> in the URL opens one directly.
//     stories: [{ id: 'U8', title: 'Know how to start', steps: [{ state, title, text }], other: [{ state, how }], notDesigned: [{ label, reason }] }]
//       The guide, one section per user story: its main path as numbered steps, then its other paths. Every state
//       belongs to a story. storiesSource: { title, url } names the stories doc. See toolbar.js for every field.
//     guide: [{ state, title, text }]   for a page with no stories yet: one main path.
//     render(state) returns the page's HTML, usually Proto.shell(Proto.page(header, body)).
//     template: 'care' makes it a Care prototype: a phone with toggles and notes beside it. See care-shell.js.
//     A click on [data-a="name"] calls actions.name(value, state), value from data-v, then re-renders.
//     An input with data-b="path.to.key" writes its value into state at that path.
var Proto = (function () {
  var app = { state: {}, init: '{}', actions: {}, states: [], render: function () { return ''; } };
  function fresh() { return JSON.parse(app.init); }

  // ---------- layout ----------
  // The admin shell: Admin::PrimaryNav::Component beside the page.
  function shell(content) {
    return '<div class="flex min-h-screen bg-white">' + NAV.render() + '<main class="flex-1 min-w-0 flex flex-col">' + content + '</main></div>';
  }
  // A page under the shell: the header, then the body with the admin's standard padding and gaps.
  function page(head, body) { return head + '<div class="px-6 py-6 flex flex-col gap-6 min-w-0">' + body + '</div>'; }

  // ---------- render loop ----------
  // In a Care prototype the phone's screen scrolls on its own. A redraw keeps its place while the same screen is
  // showing (the id given to Proto.phone), and starts at the top when the screen changes or reset is true.
  function draw(reset) {
    var was = document.querySelector('#app .screen'), id = was && was.getAttribute('data-screen'), top = was ? was.scrollTop : 0;
    document.getElementById('app').innerHTML = app.render(app.state);
    var now = document.querySelector('#app .screen');
    if (now && top && reset !== true && now.getAttribute('data-screen') === id) now.scrollTop = top;
    if (app.care) CareShell.update(app.state);
    Toolbar.update();
  }
  function setPath(obj, path, value) {
    var keys = path.split('.'), last = keys.pop();
    keys.forEach(function (k) { if (obj[k] == null || typeof obj[k] !== 'object') obj[k] = {}; obj = obj[k]; });
    obj[last] = value;
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-a]'); if (!el || el.disabled) return;
    if (el.closest('[data-proto-ui]')) return;
    // A click on a modal's scrim closes it; a click inside the modal doesn't.
    if (el.hasAttribute('data-scrim') && e.target !== el) return;
    // Clicking a label's text fires a second click on its input. Act on that one only.
    if (el.tagName === 'LABEL' && e.target.tagName !== 'INPUT') return;
    var fn = app.actions[el.getAttribute('data-a')];
    if (!fn) { console.warn('No action named', el.getAttribute('data-a')); return; }
    fn(el.getAttribute('data-v'), app.state); Toolbar.setCurrent(null); draw();
  });
  function bind(el) {
    var b = el.getAttribute && el.getAttribute('data-b'); if (!b) return null;
    setPath(app.state, b, el.type === 'checkbox' ? el.checked : el.value);
    return b;
  }
  // Typing only updates state, so a click straight after typing still lands. Leaving a field redraws.
  document.addEventListener('input', function (e) { bind(e.target); });
  document.addEventListener('change', function (e) { if (bind(e.target)) draw(); });

  // Admin::MultiActionMenuComponent: the app places its popover with JS. Below, aligned to the end.
  var MENU = 'details[data-component="Admin::MultiActionMenuComponent"]';
  document.addEventListener('toggle', function (e) {
    var d = e.target; if (!d.matches || !d.matches(MENU)) return;
    // A menu a state draws open (data-menu-static) stays where it's drawn.
    if (d.hasAttribute('data-menu-static')) return;
    var pop = d.querySelector('[data-menu-pop]'); if (!d.open) { pop.classList.add('invisible'); return; }
    document.querySelectorAll(MENU + '[open]').forEach(function (o) { if (o !== d) o.open = false; });
    var r = d.querySelector('summary').getBoundingClientRect(); pop.style.top = (r.bottom + 6) + 'px'; pop.style.left = Math.max(8, r.right - pop.offsetWidth) + 'px'; pop.classList.remove('invisible');
  }, true);
  document.addEventListener('click', function (e) { document.querySelectorAll(MENU + '[open]').forEach(function (o) { if (!o.contains(e.target)) o.open = false; }); }, true);
  window.addEventListener('scroll', function () { document.querySelectorAll(MENU + '[open]').forEach(function (o) { o.open = false; }); }, true);

  // ---------- states ----------
  function stateById(id) { return app.states.filter(function (x) { return x.id === id; })[0]; }
  function goState(id) {
    var st = stateById(id); if (!st) return;
    var s = fresh(); if (st.set) st.set(s);
    app.state = s; Toolbar.setCurrent(id); draw(true);
    try { history.replaceState(null, '', '#state=' + encodeURIComponent(id)); } catch (e) {}
    Toolbar.flash(id);
  }
  function stateFromHash() { var m = location.hash.match(/^#state=(.+)$/); return m ? decodeURIComponent(m[1]) : null; }

  function start(o) {
    app.init = JSON.stringify(o.state || {}); app.state = fresh();
    app.actions = o.actions || {}; app.render = o.render; app.states = o.states || [];
    app.actions.toastHide = app.actions.toastHide || function () { document.getElementById('toast').hidden = true; };
    if (o.nav) NAV.config(o.nav);
    // template: 'care' runs the prototype in a phone, with toggles and notes beside it (care-shell.js).
    app.care = o.template === 'care';
    if (app.care) CareShell.init(o, {
      state: function () { return app.state; },
      redraw: function (reset) { Toolbar.setCurrent(null); draw(reset); },
      restart: function () { app.state = fresh(); Toolbar.setCurrent(null); try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} draw(true); },
      act: function (name) { var fn = app.actions[name]; if (!fn) { console.warn('No action named', name); return; } fn(null, app.state); Toolbar.setCurrent(null); draw(); }
    });
    // The toolbar: Guide and Show components. Kit states must render their own id as data-state.
    Toolbar.init({
      scope: app.care ? '#app' : '#app, body > .fixed',
      // What's in the design system, from catalog/ds-components.txt (build.sh fills this in).
      inDs: [/*DS_COMPONENTS*/],
      states: app.states.map(function (x) { return { id: x.id, label: x.label, kind: x.kind, marker: x.id }; }),
      stories: o.stories || [], storiesSource: o.storiesSource || null, wireframe: !!o.wireframe,
      guide: o.guide || [], guideIntro: o.guideIntro || '', note: o.note, notDesigned: o.notDesigned || [],
      go: goState
    });
    var id = stateFromHash();
    if (id && stateById(id)) goState(id); else draw();
  }
  // The phone's content in a Care prototype: Proto.phone(top, screen, { id, bar }). See care-shell.js.
  function phone(top, screen, o) { return CareShell.phone(top, screen, o); }
  return { start: start, shell: shell, page: page, phone: phone, draw: draw, goState: goState };
})();
