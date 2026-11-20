// Care starter: a prototype of the Care app (what Members and Helpers use), shown in a phone with its toggles and
// notes beside it. Copy this folder, rename it, and replace these screens with yours.
// Build it with: ../build.sh . "Page title"   (writes index.html next to this file)
//
// template: 'care' is what makes it a Care prototype. Every piece of a screen comes from CARE (kit/lib/care.js),
// which marks itself, laid out with the classes Care's own views use. Never use UI or T2 here: those are the admin's.
(function () {
  var state = {
    screen: 'visit',       // visit, checkout
    stage: 'in_progress',  // upcoming, in_progress, complete
    helper: 'employee'     // employee, contractor
  };
  var VISIT = { member: 'Patricia Sculthorpe', day: 'Today, 2 Nov', start: '8:00am', finish: '12:00pm' };

  var actions = {
    nav: function (v, s) { s.screen = 'visit'; },
    checkIn: function (v, s) { s.stage = 'in_progress'; },
    checkOut: function (v, s) { s.screen = 'checkout'; },
    finish: function (v, s) { s.stage = 'complete'; s.screen = 'visit'; },
    back: function (v, s) { s.screen = 'visit'; }
  };

  function top() { return CARE.topnav([['schedule', 'Schedule'], ['people', 'People'], ['notifications', 'Notifications']], 'schedule', { a: 'nav', user: 'Hilda Helper' }); }

  function visitScreen(s) {
    var chip = s.stage === 'complete' ? CARE.chip('complete', 'Checked out at ' + VISIT.finish, { state: 'visit:complete' })
      : s.stage === 'in_progress' ? CARE.chip('in_progress', 'Checked in at ' + VISIT.start, { subtitle: 'Check out when you finish the visit.', state: 'visit:in-progress' })
      : CARE.chip('pending', 'Starts at ' + VISIT.start, { state: 'visit:upcoming' });
    var mustDos = CARE.banner('2 must-dos', { variant: 'magenta', body: '<ul class="w-full m-0 pl-5 text-sm leading-snug"><li>Take out the rubbish</li><li>Make the beds</li></ul>' });
    var action = s.stage === 'upcoming' ? CARE.button('Check in', { link: true, a: 'checkIn' })
      : s.stage === 'in_progress' ? CARE.button('Check out', { link: true, a: 'checkOut' }) : '';
    var header = CARE.visitHeader({
      tabs: [['visit', 'Visit'], ['contacts', 'Contacts'], ['care-plan', 'Care plan'], ['notes', 'Notes']], active: 'visit',
      name: VISIT.member,
      body: CARE.duration({ day: VISIT.day, time: VISIT.start }, { day: VISIT.day, time: VISIT.finish }) + CARE.chips([chip]) + (s.stage === 'complete' ? '' : mustDos),
      actions: action
    });
    var rates = CARE.subtitle('Rates for this visit') +
      CARE.row('clock.svg', 'Duration', { value: '4 hours' }) +
      CARE.row('money.svg', 'Activities of daily living | Standard', { sub: 'Domestic Assistance' }) +
      // Support at Home only pays travel to contractors, so the row is the contractor's alone.
      (s.helper === 'contractor' ? CARE.row('services/ic_car.svg', 'Provider Travel (km)', { sub: 'Rate for travel distance to the visit', state: 'rates:travel' }) : '');
    var services = CARE.subtitle('Services for this visit') + CARE.row('services/ic_spraybottle.svg', 'Domestic Assistance');
    return Proto.phone(top(), header + rates + services, { id: 'visit' });
  }

  function checkoutScreen(s) {
    var body = '<div class="padded space-y-3" data-state="checkout:confirm">' +
      CARE.banner('Check out of your visit with Patricia', { subtitle: 'Your visit ran from ' + VISIT.start + ' to ' + VISIT.finish + '.' }) +
      CARE.button('Complete check-out', { block: true, a: 'finish' }) + '</div>';
    return Proto.phone(top(), body, { id: 'checkout', bar: { title: 'Check-out', back: 'back' } });
  }

  Proto.start({
    template: 'care',
    title: 'Care starter',
    intro: 'A Helper\'s visit screen, to show how a Care prototype is put together.',
    state: state,
    actions: actions,
    note: 'Example data',
    // The toggles beside the phone. Each one writes its choice into state at `key` and redraws.
    toggles: [
      { key: 'stage', label: 'Visit', options: [['upcoming', 'Upcoming'], ['in_progress', 'In progress'], ['complete', 'Complete']],
        on: function (v, s) { s.screen = 'visit'; } },
      { key: 'helper', label: 'Helper', options: [['employee', 'Employee'], ['contractor', 'Contractor']],
        show: function (s) { return s.screen === 'visit'; } }
    ],
    // What a reviewer should notice on the screen showing now.
    notes: function (s) {
      if (s.screen === 'checkout') return { label: 'Check-out', title: 'One step to check out', points: ['The native app adds the bar with the back button; Care\'s own pages don\'t have one.'] };
      return { label: 'Visit screen', title: 'The visit, its state and its rates', points: [
        'The chip under the times says where the visit is up to.',
        s.helper === 'contractor' ? 'A contractor also sees the travel rate.' : 'An employee sees no travel rate.'
      ] };
    },
    // Every state a reviewer or engineer needs to see. Each id matches a data-state on the screen.
    states: [
      { id: 'visit:in-progress', label: 'Visit, checked in' },
      { id: 'visit:upcoming', label: 'Visit, before check-in', set: function (s) { s.stage = 'upcoming'; } },
      { id: 'checkout:confirm', label: 'Check-out', set: function (s) { s.screen = 'checkout'; } },
      { id: 'visit:complete', label: 'Visit, checked out', set: function (s) { s.stage = 'complete'; } },
      { id: 'rates:travel', label: 'Rates for a contractor', kind: 'edge', set: function (s) { s.helper = 'contractor'; } }
    ],
    storiesSource: { title: 'Example stories' },
    stories: [
      { id: 'S1', title: 'Check out of a visit', story: 'As a Helper, I want to check out when I finish, so that my visit is recorded.',
        steps: [
          { state: 'visit:in-progress', title: 'Checked in', text: 'The visit while it\'s under way' },
          { state: 'checkout:confirm', title: 'Check out', text: 'One step to confirm' },
          { state: 'visit:complete', title: 'Checked out', text: 'The visit afterwards' }
        ],
        other: [
          { state: 'visit:upcoming', how: 'Before the Helper checks in' },
          { state: 'rates:travel', how: 'When the Helper is a contractor' }
        ],
        notDesigned: [{ label: 'Check-out fails', reason: 'An example, not a real flow' }] }
    ],
    render: function (s) { return s.screen === 'checkout' ? checkoutScreen(s) : visitScreen(s); }
  });
})();
