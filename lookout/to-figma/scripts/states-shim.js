// Gives a prototype that isn't on the kit runtime the two things the kit's Figma capture reads:
// a list of states (script#proto-states) and a #state=<id> link that opens each one.
// The prototype's own file is never changed: add-states.mjs writes a copy with this shim and a states file added.
//
// A states file calls ProtoStates.define([...]) with one entry per screen:
//   { id: 'edit-price:correct', label: 'Edit price: correct the price', kind: null, steps: [...] }
// The id's part before the colon is the region; the builder puts one region on each row.
// A step is one of:
//   ['action', 'value']         calls window.__act(action, value), the hook Lookout's older prototypes expose
//   { click: 'css selector' }   clicks the first match
//   { set: ['css selector', 'value'] }   types into a field and fires input and change
//   function () { ... }         anything else
window.ProtoStates = (function () {
  var states = [];
  function run(step) {
    if (typeof step === 'function') return step();
    if (Array.isArray(step)) { if (typeof window.__act !== 'function') throw new Error('No window.__act hook: use click or set steps'); return window.__act(step[0], step[1]); }
    if (step.click) { var el = document.querySelector(step.click); if (!el) throw new Error('Nothing matches ' + step.click); return el.click(); }
    if (step.set) { var f = document.querySelector(step.set[0]); if (!f) throw new Error('Nothing matches ' + step.set[0]); f.value = step.set[1]; f.dispatchEvent(new Event('input', { bubbles: true })); f.dispatchEvent(new Event('change', { bubbles: true })); }
  }
  function open(id) {
    var s = states.filter(function (x) { return x.id === id; })[0]; if (!s) return false;
    var failed = null;
    (s.steps || []).forEach(function (step, i) { if (failed) return; try { run(step); } catch (e) { failed = 'step ' + (i + 1) + ': ' + e.message; } });
    // Mark the state on the page, as kit states do, and record a failure where the capture and a person can both see it.
    var app = document.getElementById('app') || document.body; app.setAttribute('data-state', id);
    if (failed) { app.setAttribute('data-state-error', failed); console.warn('State ' + id + ' failed at ' + failed); }
    window.scrollTo(0, 0);
    return !failed;
  }
  function define(list) {
    states = list;
    var el = document.createElement('script'); el.type = 'application/json'; el.id = 'proto-states'; el.setAttribute('data-proto-ui', '');
    el.textContent = JSON.stringify(list.map(function (s) { var x = { id: s.id, label: s.label || s.id }; if (s.kind) x.kind = s.kind; return x; })).replace(/</g, '\\u003c');
    document.body.appendChild(el);
    // The capture has no prototype bar to switch off, but anything marked as prototype chrome should not be drawn.
    if (/[?&]proto-bar=off/.test(location.search)) { var st = document.createElement('style'); st.textContent = '[data-proto-ui]{display:none!important}'; document.head.appendChild(st); }
    // A prototype with its own links may rewrite the hash as it loads, so add-states.mjs saves the first one.
    var m = String(window.__protoHash0 || location.hash).match(/^#state=(.+)$/); var id = m && decodeURIComponent(m[1]);
    function go() { if (id) open(id); }
    if (document.readyState === 'complete') setTimeout(go, 0); else window.addEventListener('load', function () { setTimeout(go, 0); });
  }
  return { define: define, open: open };
})();
