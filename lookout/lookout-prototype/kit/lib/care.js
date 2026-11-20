// Care components: each function returns a real Care component's rendered markup, marked with what it is.
// Markup is copied from the component's template in app/mounts/care/components/care/ in the Lookout repo, and its
// look comes from Care's own stylesheet (kit/care/care.css). Care prototypes use these, never UI or T2, whose
// classes are the admin's. Read a component's source before adding a function here; never guess its markup.
var CARE = (function () {
  var esc = UI.esc;
  // Every Care component is in code. Whether it's also in the design system is decided by catalog/ds-components.txt.
  function dc(name, props, note, slots) { return UI.dc(name, props, 'code', note, slots); }
  function act(o) { return UI.act(o); }
  function st(o) { return o && o.state ? ' data-state="' + esc(o.state) + '"' : ''; }
  // A transparent pixel. Care::AvatarComponent always renders a photo and has no initials fallback, so without a
  // photo the component's own placeholder circle shows.
  var PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  // An image from Care's image folder (care-assets.js), e.g. CARE.img('services/ic_car.svg').
  function img(file, size) {
    if (!CARE_ASSETS[file]) console.warn('No Care image named', file);
    return '<img src="' + (CARE_ASSETS[file] || '') + '" alt="" width="' + (size || 44) + '" height="' + (size || 44) + '">';
  }

  // Care::AvatarComponent. size: extra_small, small, medium, large, extra_large, extra_extra_large. shape: circle, square.
  function avatar(size, o) {
    o = o || {}; size = size || 'medium'; var shape = o.shape || 'circle';
    var props = { avatarable: 'record' }; if (size !== 'medium') props.size = size; if (shape !== 'circle') props.shape = shape;
    return '<img ' + dc('Care::AvatarComponent', props, o.src ? null : 'No photo in the prototype: the component\'s empty placeholder shows') +
      ' class="avatar--' + size + ' avatar--' + shape + '" src="' + (o.src || PIXEL) + '" alt="' + esc(o.alt || '') + '">';
  }

  // Care::TopnavComponent. items: [[id, label]], active: the selected id, o.a: the action a click calls with the id.
  function topnav(items, active, o) {
    o = o || {};
    return '<div ' + dc('Care::TopnavComponent', { user: 'current_user' }) + ' class="topnav">' +
      '<div class="topnav__logo"><img class="topnav__logo_img" src="' + CARE_ASSETS['lookout-logo-lockup-light.svg'] + '" height="24" alt="Lookout"></div>' +
      '<div class="topnav__menu">' + items.map(function (i) {
        var on = i[0] === active;
        return '<div class="topnav__menu-item--' + (on ? 'selected' : 'unselected') + '"><a href="#"' + (o.a ? act({ a: o.a, v: i[0] }) : '') + (on ? ' aria-current="page"' : '') + '>' + esc(i[1]) + '</a></div>';
      }).join('') + '</div>' +
      '<div class="topnav__actions"><div class="topnav__actions_bar"><a class="topnav__avatar" href="#" aria-label="' + esc(o.user || 'Your profile') + '">' + avatar('small') + '</a></div></div></div>';
  }

  // Care::SubtitleComponent: the band that starts a section. variant: default, blue, snowflake.
  var SUBTITLE = { 'default': 'text-white bg-charcoal border-charcoal-dark', blue: 'text-white bg-royal border-royal', snowflake: 'text-charcoal bg-snowflake border-charcoal-200' };
  function subtitle(text, o) {
    o = o || {}; var v = o.variant || 'default', el = o.element || 'h2';
    return '<' + el + ' ' + dc('Care::SubtitleComponent', v === 'default' ? null : { variant: v }) + ' class="sticky top-0 z-10 align-left border-0 border-b border-solid text-base leading-5 m-0 px-5 py-2 block ' + SUBTITLE[v] + '">' + text + '</' + el + '>';
  }

  // Care::ButtonComponent. variant: primary, secondary, tertiary, warning. size: large, small, tiny.
  // o.link renders it as a link, as Care's views often do; o.block makes it full width.
  function button(label, o) {
    o = o || {}; var v = o.variant || 'primary', size = o.size || 'small', el = o.link ? 'a' : 'button';
    var props = {}; if (v !== 'primary') props.variant = v; if (size !== 'small') props.size = size; if (o.block) props.block = true; if (o.link) props.element = 'a';
    return '<' + el + ' ' + dc('Care::ButtonComponent', props) + (o.link ? ' href="#"' : ' type="button"') + ' class="button--' + v + '--' + size + (o.block ? ' w-full' : '') + (o.link ? ' block' : '') + '"' + act(o) + (o.disabled ? ' disabled' : '') + st(o) + '>' + label + '</' + el + '>';
  }

  // Care::ChipComponent. icon: one of the component's icons (in_progress, complete, pending, yes, no, info, warning…).
  function chip(icon, title, o) {
    o = o || {}; var props = { icon: icon, title: title }; if (o.subtitle) props.subtitle = o.subtitle;
    return '<div ' + dc('Care::ChipComponent', props) + st(o) + ' class="chip chip--' + icon + '"><div class="chip__icon"></div><div class="chip__content">' +
      '<div class="chip__content_text small-body--dark--medium">' + title + '</div>' +
      (o.subtitle ? '<div class="chip__content_text small-body--dark">' + o.subtitle + '</div>' : '') + '</div></div>';
  }
  // Care::BagOfChipsComponent: a stack of chips.
  function chips(list) { return '<div ' + dc('Care::BagOfChipsComponent', { chips_data: '…' }) + ' class="flex flex-col space-y-2">' + list.join('') + '</div>'; }

  // Care::BannerComponent. variant: manatee (default), magenta, royal, royal_light, butterscotch. o.body goes in the body slot.
  var BAR = { manatee: 'manatee', magenta: 'magenta', royal: 'royal', royal_light: 'royal-400', butterscotch: 'butterscotch' };
  function banner(title, o) {
    o = o || {}; var v = o.variant || 'manatee', slots = ['title']; if (o.subtitle) slots.push('subtitle'); if (o.body) slots.push('body');
    return '<div ' + dc('Care::BannerComponent', v === 'manatee' ? null : { variant: v }, null, slots) + st(o) +
      ' class="relative p-4 pl-6 flex flex-wrap justify-between items-center gap-4 leading-normal text-charcoal rounded-lg border border-solid before:content-[&quot;&quot;] before:absolute before:w-2 before:-left-px before:-inset-y-px before:rounded-l-lg before:bg-' + BAR[v] + ' bg-gray-pale border-manatee-polar">' +
      '<div class="grow basis-1/2"><div class="font-bold leading-tight mb-0.5">' + title + '</div>' + (o.subtitle ? '<div class="text-sm leading-snug">' + o.subtitle + '</div>' : '') + '</div>' + (o.body || '') + '</div>';
  }

  // Care::Visits::HeaderComponent: the person a visit is with. o.subtitle is the line above the name.
  function personHeader(name, o) {
    o = o || {};
    return '<header ' + dc('Care::Visits::HeaderComponent', { avatarable: o.avatarable || 'member' }) + ' class="flex items-center pl-1 gap-4 sm:gap-6">' + avatar('extra_large', { src: o.src }) +
      '<div class="flex flex-col"><span class="small-body--dark--medium--subtle">' + esc(o.subtitle || 'Your visit with') + '</span><h1 class="h1--dark--bold font-medium hyphenate m-0">' + esc(name) + '</h1></div></header>';
  }

  // Care::Visits::DurationComponent. start and finish: { day: 'Today, 2 Nov', time: '8:00am' }.
  function duration(start, finish) {
    function col(side, label, t) {
      return '<div class="grow ' + side + ' flex flex-col justify-start"><span class="text-sm font-medium leading-normal text-charcoal-700 pb-1">' + label + '</span>' +
        '<span class="text-base text-charcoal leading-tight mb-0.5">' + esc(t.day) + '</span><span class="text-xl leading-snug text-charcoal font-medium">' + esc(t.time) + '</span></div>';
    }
    return '<div ' + dc('Care::Visits::DurationComponent', { start_time: '…', finish_time: '…', user_time: 'now' }) + ' class="flex px-4 pb-2 last:pb-0 divide-x divide-solid divide-manatee-polar divide-y-0">' + col('pr-4', 'Start', start) + col('pl-4', 'Finish', finish) + '</div>';
  }

  // Care::Helpers::Visits::HeaderComponent: the top of a Helper's visit screen. tabs: [[id, label]] with the active id,
  // then the person, then o.body (the visit's state, banners and must-dos) in the component's padded stack.
  function visitHeader(o) {
    var tabs = o.tabs ? '<div class="helpers-visit-header__tabs p-0 truncate">' + o.tabs.map(function (t) {
      var on = t[0] === o.active;
      return '<a href="#" class="flex-1 flex h-10 py-6 items-center justify-center' + (on ? ' text-royal border-0 border-solid border-b-2' : '') + '"' + (o.a ? act({ a: o.a, v: t[0] }) : '') + (on ? ' aria-current="page"' : '') + '>' + esc(t[1]) + '</a>';
    }).join('') + '</div>' : '';
    return '<div ' + dc('Care::Helpers::Visits::HeaderComponent', { visit: 'visit' }) + '>' + tabs +
      '<div class="t-spaced h-spaced">' + personHeader(o.name, { subtitle: o.subtitle, src: o.src }) + '</div>' +
      '<div class="padded space-y-3">' + (o.body || '') + '</div>' + (o.actions ? '<div class="padded pt-0">' + o.actions + '</div>' : '') + '</div>';
  }

  // A tuple row, as Care's views write it: an icon, a title with an optional line under it, and an optional value on
  // the right. It's the views' own markup (Care's "tuple" SCSS objects), not a component, so it isn't marked.
  function row(icon, title, o) {
    o = o || {};
    return '<div class="padded tuple__container tuple__list-item"' + st(o) + '><span class="tuple__lhs-icon">' + img(icon) + '</span><div class="tuple__lhs-content"><span class="body--dark--medium hyphenate">' + esc(title) + '</span>' +
      (o.sub ? '<span class="small-body--dark--subtle">' + esc(o.sub) + '</span>' : '') + '</div>' + (o.value ? '<div class="tuple__rhs-content body--dark--bold">' + esc(o.value) + '</div>' : '') + '</div>';
  }


  // Care::TagComponent. color: any of the component's colours. A tag's text is short: a word or two.
  var TAG = {
    aqua: 'bg-aqua-100 border-aqua-200', butterscotch: 'bg-butterscotch-100 border-butterscotch-200', charcoal: 'bg-charcoal-100 border-charcoal-200',
    emerald: 'bg-emerald-100 border-emerald-200', 'legacy-red': 'bg-legacy-red-100 border-legacy-red', lime: 'bg-lime-100 border-lime-200',
    magenta: 'bg-magenta-100 border-magenta-200', orange: 'bg-orange-100 border-orange-200', royal: 'bg-royal-100 border-royal-200',
    snowflake: 'bg-snowflake-muddy border-manatee-polar', warning: 'bg-warning-100 border-warning-200', warning_bright: 'bg-warning border-warning-200', white: 'bg-white border-manatee-polar'
  };
  function tag(text, o) {
    o = o || {}; var color = o.color || 'charcoal';
    if (!TAG[color]) console.warn('No Care tag colour named', color);
    return '<span ' + dc('Care::TagComponent', color === 'charcoal' ? { element: 'span' } : { color: color, element: 'span' }) + st(o) +
      ' class="text-sm px-2 py-1 border rounded-md border-solid w-fit h-fit inline-flex items-center rounded-lg font-medium space-x-1 whitespace-nowrap leading-none ' + TAG[color] + ' text-xs"><span class="min-w-0 h-full">' + esc(text) + '</span></span>';
  }

  // Care::ScheduleComponent: the home screen. days: the HTML of each CARE.scheduleDay, in order.
  function schedule(days) { return '<div ' + dc('Care::ScheduleComponent', { timeline: 'timeline' }) + ' class="schedule">' + days.join('') + '</div>'; }
  // One day of Care::Schedule::DaysComponent: its band, then its cards. o.today uses the blue band.
  // cards: the HTML of each card; with none, the "nothing scheduled" card shows.
  function scheduleDay(label, cards, o) {
    o = o || {};
    return '<div class="schedule__day">' + subtitle('<div class="flex items-center"><time class="font-medium">' + esc(label) + '</time></div>', { variant: o.today ? 'blue' : 'default' }) +
      '<div class="padded">' + (cards && cards.length ? cards.join('') : nothingScheduled(o.empty || 'No visits')) + '</div></div>';
  }
  // Care::Schedule::NothingScheduledComponent
  function nothingScheduled(text) {
    return '<a ' + dc('Care::Schedule::NothingScheduledComponent', { date: 'date' }) + ' class="card card--empty card--unclickable"><span class="schedule__empty-text">' + esc(text) + '</span></a>';
  }
  // Care::Schedule::VisitComponent: a visit's card on the schedule. name: who the visit is with (the Helper, for a
  // Member). time: '9:00am – 10:30am'. o.chips: [chipHtml]. o.a, o.v: the action a tap calls.
  // o.heading replaces the name line and o.under adds a line under the time, for a prototype trying something the
  // component doesn't do yet; mark what's added with UI.proposed.
  function scheduleVisit(name, time, o) {
    o = o || {};
    return '<a href="#" ' + dc('Care::Schedule::VisitComponent', { visit: 'visit', show_visitor: false }) + act(o) + st(o) + ' class="card flex flex-col relative overflow-hidden adj-y-gap-medium space-y-4">' +
      '<div class="tuple__container"><div class="tuple__lhs-icon">' + avatar('medium', { src: o.src }) + '</div><div class="tuple__lhs-content">' +
      '<div class="body--dark--medium">' + (o.heading || esc(name)) + '</div>' +
      '<div class="flex flex-wrap items-center small-body--dark--subtle">' + esc(time) + '</div>' + (o.under || '') + '</div></div>' +
      (o.chips && o.chips.length ? '<div class="space-y-2">' + chips(o.chips) + '</div>' : '') + '</a>';
  }

  return { dc: dc, img: img, avatar: avatar, topnav: topnav, subtitle: subtitle, button: button, chip: chip, chips: chips, banner: banner, personHeader: personHeader, duration: duration, visitHeader: visitHeader, row: row, tag: tag, schedule: schedule, scheduleDay: scheduleDay, nothingScheduled: nothingScheduled, scheduleVisit: scheduleVisit };
})();
