// The Care template's chrome: the phone a Care prototype runs in, and the side panel beside it with the
// prototype's title, its toggles, the notes for the current screen and Restart. None of it is part of the design.
//
//   Proto.start({ template: 'care', title, intro, toggles, notes, state, actions, states, stories, render })
//     toggles: [{ key: 'scenario', label: 'Scenario', options: [['split', 'Split'], ['single', 'Single rate']],
//                 on: function (value, state) { … }, show: function (state) { return true; } }]
//       key is a path in state. Choosing an option writes it there, calls on() if given, and redraws.
//       show() hides a toggle on screens it doesn't apply to.
//     notes: function (state) { return { label: 'Visit screen', title: '…', points: ['…', '…'] }; }
//       What a reviewer should notice on the screen showing now. points can be one string of HTML instead.
//     render(state) returns the phone's content, usually Proto.phone(top, screen, { bar }).
var CareShell = (function () {
  var cfg = null, esc = UI.esc;
  var BACK = '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M13 4L7 10L13 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function get(obj, path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj); }
  function set(obj, path, value) {
    var keys = path.split('.'), last = keys.pop();
    keys.forEach(function (k) { if (obj[k] == null || typeof obj[k] !== 'object') obj[k] = {}; obj = obj[k]; });
    obj[last] = value;
  }

  // The phone's content. top: what stays put above the scrolling screen, usually CARE.topnav(…).
  // o.id names the screen, so a redraw of the same screen keeps its scroll position.
  // o.bar: { title, back: 'actionName', backLabel } draws the native app's navigation bar, which Care's web markup
  // doesn't have (the iOS and Android shells add it).
  function phone(top, screen, o) {
    o = o || {}; var bar = '';
    if (o.bar) {
      // A nav, never a div marked as prototype chrome: the drift check reads the page up to the first of those.
      bar = '<nav aria-label="App" class="native-bar' + (o.bar.back ? '' : ' no-back') + '" data-proto-ui data-note="The native app\'s navigation bar. Care\'s web markup has no back button or title bar.">' +
        (o.bar.back ? '<button class="native-back" type="button" data-care-back="' + esc(o.bar.back) + '" aria-label="' + esc(o.bar.backLabel || 'Back') + '">' + BACK + '</button>' : '') +
        '<div class="native-title">' + esc(o.bar.title) + '</div></nav>';
    }
    return (top || '') + bar + '<main class="screen"' + (o.id ? ' data-screen="' + esc(o.id) + '"' : '') + '>' + screen + '</main>';
  }

  function update(state) {
    var el = document.getElementById('care-side'); if (!el || !cfg) return;
    var groups = (cfg.toggles || []).filter(function (t) { return !t.show || t.show(state); }).map(function (t, i) {
      var cur = get(state, t.key), id = 'care-toggle-' + i;
      return '<div class="scen"><span class="scen-label" id="' + id + '">' + esc(t.label) + '</span><div class="seg' + (t.options.length > 3 ? ' seg-wrap' : '') + '" role="group" aria-labelledby="' + id + '">' +
        t.options.map(function (o) { return '<button type="button" data-care-toggle="' + esc(t.key) + '" data-v="' + esc(o[0]) + '" aria-pressed="' + (String(cur) === String(o[0])) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div></div>';
    }).join('');
    var n = cfg.notes ? cfg.notes(state) : null, card = '';
    if (n) {
      card = '<div class="note-card">' + (n.label ? '<div class="step">' + esc(n.label) + '</div>' : '') + (n.title ? '<h2>' + esc(n.title) + '</h2>' : '') +
        (Array.isArray(n.points) ? '<ul>' + n.points.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>' : (n.points ? '<p>' + n.points + '</p>' : '')) + '</div>';
    }
    el.innerHTML = '<h1>' + esc(cfg.title || document.title) + '</h1>' + (cfg.intro ? '<p class="lede">' + esc(cfg.intro) + '</p>' : '') + groups + card +
      '<button class="restart" type="button" data-care-restart>↺ Restart</button>';
  }

  function init(o, api) {
    cfg = o;
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-care-toggle]');
      if (t) {
        var key = t.getAttribute('data-care-toggle'), v = t.getAttribute('data-v'), s = api.state();
        var def = (cfg.toggles || []).filter(function (x) { return x.key === key; })[0];
        // Keep the option's own type: true/false and numbers survive the round trip through the attribute.
        var opt = def && def.options.filter(function (x) { return String(x[0]) === v; })[0];
        set(s, key, opt ? opt[0] : v); if (def && def.on) def.on(opt ? opt[0] : v, s);
        api.redraw(); return;
      }
      if (e.target.closest('[data-care-restart]')) { api.restart(); return; }
      var b = e.target.closest('[data-care-back]');
      if (b) { api.act(b.getAttribute('data-care-back')); }
    });
  }
  return { init: init, update: update, phone: phone };
})();
