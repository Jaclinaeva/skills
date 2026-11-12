// Starter prototype. Copy this folder, rename it, and replace this page with yours.
// Build it with: ../../build.sh . "Page title"   (writes index.html next to this file)
//
// Every piece of the page comes from the kit's components (UI, T2, HEADERS, NAV), which mark themselves.
// When nothing fits, mark a gap with UI.proposed(Name, note) instead of writing new styles.
(function () {
  var state = {
    tab: 'active',
    q: '',
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
    close: function (v, s) { s.panel = null; },
    add: function (v, s) { s.toast = 'Record added'; }
  };

  function listPage(s) {
    var shown = s.rows.filter(function (r) { return r.status === s.tab && r.name.toLowerCase().indexOf(String(s.q).toLowerCase()) >= 0; });
    var head = T2.pageHeader('Example records', null, UI.button('Add a record', { variant: 'primary', a: 'add' }));
    var tabs = T2.tabs([
      ['active', 'Active', s.rows.filter(function (r) { return r.status === 'active'; }).length],
      ['archived', 'Archived', s.rows.filter(function (r) { return r.status === 'archived'; }).length]
    ], s.tab, 'tab');
    var search = UI.input({ bind: 'q', value: s.q, width: 'w-[20rem]', attrs: ' placeholder="Search records"' });
    var body = shown.length
      ? UI.table(['Name', 'Owner', { label: '', right: true }], shown.map(function (r) {
          return UI.tr([
            UI.td(UI.link(r.name, { a: 'open', v: r.id })),
            UI.td(r.owner),
            UI.td(UI.rowActions([{ label: 'Edit', icon: 'edit', a: 'open', v: r.id }]), { right: true })
          ]);
        }))
      : UI.panel('<div class="text-center text-charcoal-700">No records match.</div>');
    // Mark each distinct state, <region>:<state>, so checks and handover can find it.
    var st = !shown.length ? 'list:empty' : 'list:' + s.tab;
    return Proto.page(head, tabs + search + '<div data-state="' + st + '">' + body + '</div>');
  }

  function panel(s) {
    if (s.panel == null) return '';
    var r = s.rows.filter(function (x) { return x.id === s.panel; })[0];
    return UI.sideModal(r.name, '', '<div data-state="record-panel:open">' + UI.dl([['Owner', r.owner], ['Status', r.status === 'active' ? 'Active' : 'Archived']]) +
      // A gap: nothing in the system does this yet, so it's marked, not styled by hand.
      '<div ' + UI.proposed('ActivitySummary', 'Example of a gap. Proposed upstream, not filed.') + '>' + UI.callout('Recent activity would go here.', 'info') + '</div>' + '</div>');
  }

  Proto.start({
    state: state,
    actions: actions,
    note: 'Example data',
    nav: { active: 'Members' },
    // Every state a reviewer or engineer needs to see. Each id matches a data-state on the page.
    states: [
      { id: 'list:active', label: 'Active records' },
      { id: 'list:archived', label: 'Archived records', set: function (s) { s.tab = 'archived'; } },
      { id: 'list:empty', label: 'No records match', kind: 'empty', set: function (s) { s.q = 'zzz'; } },
      { id: 'record-panel:open', label: 'Record open', set: function (s) { s.panel = 1; } }
    ],
    // The guide: one section per user story, copied from the stories doc. Each has its main path as numbered
    // steps, its other paths (with how a user gets there) and what was deliberately not designed. Every state
    // belongs to a story.
    storiesSource: { title: 'Example stories' },
    stories: [
      { id: 'S1', title: 'Find a record', story: 'As a staffer, I want to find a record quickly, so that I can act on it.',
        steps: [
          { state: 'list:active', title: 'Active records', text: 'Tabs, counts and search' },
          { state: 'record-panel:open', title: 'Open a record', text: 'Details in a side panel' }
        ],
        other: [{ state: 'list:empty', how: 'Search for something no record matches' }],
        notDesigned: [{ label: 'Loading the list', reason: 'The list loads instantly' }] },
      { id: 'S2', title: 'See old records', story: 'As a staffer, I want to see archived records, so that nothing is lost.',
        steps: [{ state: 'list:archived', title: 'Archived records', text: 'Where old records go' }] }
    ],
    render: function (s) { return Proto.shell(listPage(s)) + panel(s); }
  });
})();
