// ViewComponents that are in the app but not in the Lookout Design System yet (data-tier="code").
// Rendered from main with Admin::BaseController.renderer, then cut down to what the prototype needs.
var T2 = (function () {
  var dc = UI.dc, esc = UI.esc;
  var CHEV_R = '<div class="shrink-0 w-3 h-3 align-middle inline-block"><svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="block"><path d="M7 4L13 10L7 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
  var CHEV_R5 = '<div class="shrink-0 w-5 h-5 mx-3 align-middle inline-block"><svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="block"><path d="M7 4L13 10L7 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';

  // ---------- Admin::PrimaryNav::Component ----------
  var ITEM = 'text-sm text-white group block px-3 py-2 leading-none mb-[1px] rounded-md hover:text-white focus:text-white hover:no-underline focus:no-underline hover:bg-cornflower hover:bg-opacity-40';
  function navItem(label, o) { o = o || {}; return '<a ' + dc('Admin::PrimaryNav::ItemComponent', o.active ? { active: true } : null, 'code') + ' class="' + ITEM + (o.active ? ' group-active bg-cornflower-dark' : '') + (o.a ? ' cursor-pointer' : ' cursor-default') + '"' + (o.a ? ' data-a="' + o.a + '"' : '') + '>' + label + '</a>'; }
  function navSection(title, items, open) {
    return '<details ' + dc('Admin::PrimaryNav::CollapsibleSectionComponent', { expanded: !!open }, 'code') + (open ? ' open' : '') + ' class="group my-3"><summary class="sticky -top-3 z-10 list-none outline-none cursor-pointer group text-[0.75rem] font-medium px-3 group-open:mb-1 transition-all ease-out bg-charcoal shadow shadow-charcoal ' + (open ? 'text-royal-200' : 'text-royal-400 hover:text-royal-200') + '"><div class="flex items-center"><div class="flex-1 grow">' + title + '</div><div class="transition-transform ease-out details-open:rotate-90">' + CHEV_R + '</div></div></summary>' + items.join('') + '</details>';
  }
  function primaryNav() {
    return '<nav ' + dc('Admin::PrimaryNav::Component', null, 'code', 'Shell hand-assembled from component.rb; items and sections rendered. Logo, notifications and user menu left out.') + ' class="hidden md:flex flex-col shrink-0 min-h-screen bg-charcoal relative print:hidden" aria-label="Primary navigation"><div class="flex flex-col w-60 grow p-3 overflow-auto sticky top-0 max-h-screen">' +
      navItem('Home') + '<div class="mb-3">' + navItem('Tickets') + '</div>' +
      navSection('Care', [navItem('Members'), navItem('Care plans')], false) +
      navSection('Rostering', [navItem('Roster'), navItem('Helpers')], false) +
      navSection('Procurement', [navItem('Service requests'), navItem('Purchase order jobs'), navItem('Supplier Helpers'), navItem('Suppliers'), navItem('Supplier prices', { active: true, a: 'hub' })], true) +
      navSection('Finance', [navItem('Billing runs'), navItem('Invoices &amp; credit notes')], false) +
      '<div class="mt-2">' + navItem('Analytics') + '</div></div></nav>';
  }

  // ---------- Admin::HeaderComponent ----------
  // title: a heading or breadcrumbs. line: a sentence under the header (the component has no subtitle slot).
  function header(title, actions, line, extra) {
    return '<header ' + dc('Admin::HeaderComponent', null, 'code') + ' class="min-h-[77px] px-6 py-4 flex flex-nowrap items-center justify-between gap-4 sticky top-0 z-10 border-0 bg-white border-b border-solid border-grey-light shadow print:shadow-transparent"><div class="flex flex-nowrap items-center gap-3 min-w-0 flex-1">' + title + (extra || '') + '</div>' + (actions ? '<div class="flex flex-wrap items-center gap-2 shrink-0 print:hidden">' + actions + '</div>' : '') + '</header>' +
      (line ? '<div class="px-6 pt-6 -mb-2 text-md text-charcoal max-w-[72ch]">' + line + '</div>' : '');
  }
  function pageHeader(title, line, actions) { return header('<h2 class="m-0 text-xl font-medium text-charcoal">' + title + '</h2>', actions, line); }

  // ---------- Admin::TabComponent (+ WithCountComponent) ----------
  var TAB = 'border-0 hover:no-underline active:no-underline focus:no-underline py-3 border-solid border-b-2 font-medium flex items-center leading-loose whitespace-nowrap data-[disabled=true]:opacity-40 data-[disabled=true]:pointer-events-none data-[active=true]:hover:text-charcoal data-[active=true]:hover:border-charcoal border-transparent text-charcoal hover:text-royal hover:border-royal focus:text-royal focus:border-royal data-[active=true]:text-royal data-[active=true]:border-royal bg-transparent cursor-pointer';
  function count(n, warn) { return '<div ' + dc('Admin::WithCountComponent', warn ? { variant: 'warning' } : null, 'code') + ' class="box-border shrink-0 self-center items-center justify-center min-w-8 whitespace-nowrap inline-flex rounded-full border-solid border border-transparent ' + (warn ? 'bg-warning-100' : 'bg-charcoal-100') + ' px-2 text-[13px] font-medium h-6">' + n + '</div>'; }
  // items: [[key, label, count?, warn?]]. With an action, tabs switch views in place; without, they're the record's tabs.
  function tabs(items, active, action) {
    return '<div ' + dc('Admin::TabbedHeaderComponent', null, 'code') + ' class="flex-row flex space-x-6 flex-nowrap overflow-x-auto">' + items.map(function (t) {
      var on = t[0] === active, label = t[2] != null ? '<div class="flex items-center gap-2"><div>' + t[1] + '</div>' + count(t[2], t[3] && t[2] > 0) + '</div>' : t[1];
      return '<a href="javascript:void(0)" ' + dc('Admin::TabComponent', { url: '#', active: on }, 'code') + ' data-active="' + on + '" class="' + TAB + '"' + (action ? ' data-a="' + action + '" data-v="' + t[0] + '"' : '') + (on ? ' aria-current="page"' : '') + '>' + label + '</a>';
    }).join('') + '</div>';
  }
  // In-page view switches. Pass 1 uses TabComponent, as Admin::Rates::TabbedHeaderComponent does for Active / Archived.
  function chips(items, active, action) {
    return '<div class="border-0 border-b border-solid border-grey-light">' + tabs(items.map(function (t) { return [t[0], t[1], t[2], t[0] === 'error' || t[0] === 'need']; }), active, action) + '</div>';
  }

  // ---------- Admin::BannerWithActionsComponent (accent shape) ----------
  var BANNER = { butterscotch: 'bg-butterscotch-100 border-l-butterscotch', charcoal: 'bg-charcoal-100 border-l-charcoal', emerald: 'bg-emerald-100 border-l-emerald', royal: 'bg-royal-100 border-l-royal', royal_lite: 'bg-royal/5 border-l-royal/40', warning: 'bg-warning-100 border-l-warning' };
  function bannerWithActions(title, text, actions, color, stack) {
    color = color === 'alert' ? 'butterscotch' : color || 'charcoal';
    return '<div ' + dc('Admin::BannerWithActionsComponent', { color: color, shape: 'accent' }, 'code', 'Actions render as plain buttons here. The component renders one action as an IconButton and two or more as an Actions menu.') + ' class="px-6 py-4 flex justify-between border-0 border-solid ' + BANNER[color] + ' flex-col gap-4 items-start' + (stack ? '' : ' lg:flex-row lg:items-center lg:gap-6') + ' rounded-md border-l-4"><div class="space-y-1 grow min-w-0">' + (title ? '<h3 class="m-0 text-base font-medium text-charcoal">' + title + '</h3>' : '') + '<div class="text-md max-w-screen-lg">' + text + '</div></div>' + (actions ? '<div class="flex flex-wrap gap-2 shrink-0">' + actions + '</div>' : '') + '</div>';
  }

  // ---------- Admin::Payroll::AwardVersionCardComponent ----------
  // Reused for price lists. The header pill is AwardStatusComponent (Active / Inactive); next and expired get an
  // AwardVersionStatusComponent tag, which is where the richer states live.
  function statusPill(active) {
    return active ? '<div class="w-fit h-fit inline-flex items-center font-medium leading-snug whitespace-nowrap leading-none px-2 py-1 border border-solid rounded-lg bg-white border-emerald text-xs"><span class="relative flex h-2 w-2 mr-1.5"><span class="animate-[ping_2s_ease-in-out_infinite] absolute inline-flex h-full w-full rounded-full bg-emerald opacity-75"></span><span class="relative inline-flex rounded-full h-2 w-2 bg-emerald"></span></span>Active</div>'
      : '<div class="w-fit h-fit inline-flex items-center font-medium leading-snug whitespace-nowrap leading-none px-2 py-1 border border-solid rounded-lg bg-white border-manatee-diet text-charcoal-700 text-xs"><span class="relative flex h-2 w-2 mr-1.5"><span class="relative inline-flex rounded-full h-2 w-2 bg-manatee-diet"></span></span>Inactive</div>';
  }
  function versionCard(o) {
    var active = o.status === 'active';
    var stateTag = o.status === 'next' ? UI.tag('New prices start ' + o.start, 'royal') : o.status === 'expired' ? UI.tag('Ended ' + o.end, 'charcoal') : !o.end ? UI.tag('Does not expire', 'butterscotch') : '';
    var openRow = function (label, value) { return '<div class="flex flex-row items-center justify-between"><div><div class="font-medium mb-2">' + label + '</div>' + value + '</div>' + (o.open ? '<button type="button" class="appearance-none bg-transparent border-0 p-0 text-charcoal cursor-pointer" data-a="' + o.open[0] + '" data-v="' + o.open[1] + '" aria-label="Open">' + CHEV_R5 + '</button>' : '') + '</div>'; };
    return '<div ' + dc('Admin::Payroll::AwardVersionCardComponent', { editable: true }, 'code', 'The award version card, reused for a price list. Needs a price-list version of its rows.') + ' class="bg-grey-lightest rounded-lg border border-solid border-manatee-polar relative' + (active ? ' shadow-xl' : '') + '">' +
      '<div class="bg-white border-0 border-solid rounded-t-lg border-b border-manatee-polar"><div class="flex flex-row flex-wrap items-center gap-4 justify-between p-6 pb-4"><div class="flex flex-wrap items-center gap-2 min-w-0"><div class="text-lg font-medium text-charcoal">' + o.name + '</div>' + stateTag + '</div>' + statusPill(active) + '</div></div>' +
      '<div class="px-6 *:py-4 *:border-0 *:border-solid *:border-b *:border-grey-light [&>*:last-child]:border-b-0 rounded-b-lg">' +
      '<div><div class="font-medium">Active dates</div><div class="flex flex-row flex-wrap gap-x-4 mt-4"><div class="flex flex-col flex-grow space-y-2"><div class="text-sm text-charcoal-700 font-medium">Start date</div><div>' + o.start + '</div></div><div class="flex flex-col flex-grow space-y-2"><div class="text-sm text-charcoal-700 font-medium">Expiry date</div><div>' + (o.end || '--') + '</div></div></div></div>' +
      openRow('Prices', '<button type="button" class="appearance-none bg-transparent border-0 p-0 text-royal font-medium cursor-pointer hover:underline text-left" data-a="' + o.open[0] + '" data-v="' + o.open[1] + '">' + o.count + '</button>') +
      '<div><div class="font-medium mb-2">Made by</div><div class="text-md">' + o.by + '</div></div></div></div>';
  }
  function newVersionCard(text, act) {
    return '<div ' + dc('Admin::Payroll::NewAwardVersionCardComponent', null, 'code') + ' class="flex flex-col items-center justify-center p-6 rounded-lg border border-dashed border-manatee-diet text-center gap-2"><div class="text-lg font-medium text-charcoal">Create the next price list</div><p class="text-center leading-snug m-0">' + text + '</p><div class="pt-2">' + UI.button('Update prices from a date', { a: act[0], v: act[1] }) + '</div></div>';
  }

  // ---------- Admin::HistoryItemComponent ----------
  function historyItem(o) {
    var dot = o.state === 'active' ? 'bg-emerald text-white' : o.state === 'next' ? 'bg-royal-100 text-royal' : 'bg-charcoal-100 text-charcoal-700';
    return '<div ' + dc('Admin::HistoryItemComponent', { connected: o.connected }, 'code') + ' class="group flex gap-4"><div class="relative flex w-6 shrink-0 justify-center self-stretch"><div class="flex h-6 w-6 items-center justify-center rounded-lg ' + dot + '"><span class="w-2 h-2 rounded-full bg-current"></span></div>' +
      (o.connected ? '<div class="absolute bottom-1 left-1/2 top-7 w-[3px] -translate-x-1/2 bg-manatee-polar"></div>' : '') + '</div>' +
      '<div class="min-w-0 flex-1 ' + (o.connected ? 'pb-6' : '') + '"><header class="flex flex-wrap items-center gap-2 mb-1.5"><div class="font-medium flex-1 text-charcoal">' + o.title + '</div>' + (o.extra || '') + '<span class="block font-medium text-sm whitespace-nowrap">' + o.when + '</span></header>' + o.body + '</div></div>';
  }

  return { primaryNav: primaryNav, header: header, pageHeader: pageHeader, tabs: tabs, chips: chips, count: count, bannerWithActions: bannerWithActions, versionCard: versionCard, newVersionCard: newVersionCard, historyItem: historyItem };
})();
