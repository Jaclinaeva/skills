// Wireframe starter. Copy this folder, rename it, and replace this page with yours.
// Build it with: ../../build.sh . "Page title"   (writes index.html next to this file)
//
// Use only WF blocks (kit/lib/wf.js): they're greyscale on purpose and mark what each piece is for, so the
// wireframe can be converted to the design system later. Anything not worked out yet is a WF.box.
(function () {
  var state = {
    tab: 'active',
    panel: null,
    rows: [
      { id: 1, name: 'Example record one', owner: 'Sam Taylor', status: 'active' },
      { id: 2, name: 'Example record two', owner: 'Alex Morgan', status: 'active' },
      { id: 3, name: 'Example record three', owner: 'Jordan Lee', status: 'archived' }
    ]
  };

  var actions = {
    tab: function (v, s) { s.tab = v; },
    open: function (v, s) { s.panel = +v; },
    close: function (v, s) { s.panel = null; }
  };

  function listPage(s) {
    var shown = s.rows.filter(function (r) { return r.status === s.tab; });
    var body = shown.length
      ? WF.table(['Name', 'Owner', { label: '', right: true }], shown.map(function (r) { return [WF.link(r.name, { a: 'open', v: r.id }), r.owner, WF.menu(['Edit', 'Archive'])]; }))
      : WF.empty('No records', 'Records you archive show here.');
    return WF.stack(
      WF.header('Example records', { actions: [WF.button('Add a record', { variant: 'primary' })] }),
      WF.tabs([['active', 'Active', 2], ['archived', 'Archived', 1]], s.tab, 'tab'),
      '<div data-state="list:' + (shown.length ? s.tab : 'empty') + '">' + body + '</div>'
    );
  }

  function panel(s) {
    if (s.panel == null) return '';
    var r = s.rows.filter(function (x) { return x.id === s.panel; })[0];
    return '<div data-state="record-panel:open">' + WF.modal(r.name, WF.details([['Owner', r.owner], ['Status', r.status]]) + WF.box('Recent activity, not worked out yet', { h: 120 }), { side: true, close: 'close' }) + '</div>';
  }

  Proto.start({
    state: state,
    actions: actions,
    wireframe: true,
    note: 'Example data',
    states: [
      { id: 'list:active', label: 'Active records' },
      { id: 'list:archived', label: 'Archived records', set: function (s) { s.tab = 'archived'; } },
      { id: 'record-panel:open', label: 'Record open', set: function (s) { s.panel = 1; } }
    ],
    guide: [
      { state: 'list:active', title: 'Find a record', text: 'Tabs and a table' },
      { state: 'record-panel:open', title: 'Open a record', text: 'Details in a side panel' }
    ],
    render: function (s) { return WF.shell(listPage(s), { area: 'Admin', here: 'Records' }) + panel(s); }
  });
})();
