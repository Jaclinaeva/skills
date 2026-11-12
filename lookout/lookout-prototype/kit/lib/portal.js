// The supplier portal (app/mounts/vendor): its shell and the components its pages use that the admin kit doesn't have.
// Markup is rendered from the ViewComponents in the Lookout repo (app/mounts/vendor, app/mounts/admin) on main.
// Usage: VP.shell(content, { active: "Services", user, org, navActions, messages }), VP.tabbedPage, VP.modal, VP.emptyPanel,
// VP.dateInput, VP.textarea, VP.dropzone, VP.days, VP.collapsible, VP.serviceBadge, VP.iconButton, VP.actionsMenu, VP.tr, VP.icon.
// Every Vendor:: component is in code, not in the design system, so each is marked data-tier="code".
var VP = (function () {
  var dc = UI.dc, esc = UI.esc;
  // The kit's icon() reads ICONS; add the portal's icons from the repo.
  Object.keys(VICONS).forEach(function (k) { if (!ICONS[k]) ICONS[k] = VICONS[k]; });

  // ---------- IconComponent ----------
  function icon(name, size, cls) { return '<div ' + dc('IconComponent', { name: name, size: size || 4 }, 'code') + ' class="shrink-0 w-' + (size || 4) + ' h-' + (size || 4) + ' align-middle inline-block' + (cls ? ' ' + cls : '') + '">' + ICONS[name] + '</div>'; }
  function img(name, cls) { return '<div class="' + cls + '">' + VICONS[name].replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"') + '</div>'; }

  // ---------- Vendor::Nav::Component ----------
  // Labels from app/mounts/vendor/components/vendor/nav/component.yml. Shown as an Owner sees it.
  var LABEL = {
    active: 'text-royal bg-royal bg-opacity-05 font-medium border-0 border-r-2 border-solid border-royal',
    active_section: 'text-royal font-medium',
    def: 'text-charcoal hover:text-royal focus:text-royal'
  };
  var ICON_ST = { active: 'text-royal', active_section: 'text-royal', def: 'text-inherit group-hover/nav-item:text-royal group-focus/nav-item:text-royal' };
  function countPill(n) {
    return '<span ' + dc('Vendor::Nav::CountComponent', { count: n }, 'code') + ' class="contents"><span ' + dc('CountPillComponent', { variant: 'royal' }, 'code') + ' class="box-border shrink-0 self-center items-center justify-center min-w-8 whitespace-nowrap inline-flex rounded-full border border-solid border-royal-400 bg-royal-100 text-royal px-2 text-[13px] font-semibold h-6 -my-2"><span class="inline-flex items-center gap-1.5 leading-none text-charcoal"><span class="w-2 h-2 rounded-full bg-royal"></span>' + n + '</span></span></span>';
  }
  function navItem(label, ic, o) {
    o = o || {}; var st = o.active ? (o.section ? 'active_section' : 'active') : 'def';
    var props = { label: label, icon: ic }; if (o.active) props.active = true; if (o.section) props.variant = 'section'; if (o.count) props.count = o.count;
    return '<a ' + dc('Vendor::Nav::ItemComponent', props, 'code') + ' href="javascript:void(0)" class="group/nav-item flex items-center gap-3 px-6 py-3 text-base leading-tight lg:py-2.5 lg:text-sm no-underline hover:no-underline focus:no-underline ' + LABEL[st] + '"' + (o.a ? ' data-a="' + o.a + '"' : '') + (o.active ? ' aria-current="page"' : '') + '>' +
      icon(ic, 5, ICON_ST[st]) + '<span class="flex-1 truncate">' + label + '</span>' + (o.count ? countPill(o.count) : '') + '</a>';
  }
  function subItem(label) { return '<a href="javascript:void(0)" class="flex items-center pl-14 pr-6 py-3 text-base leading-tight lg:py-2 lg:text-sm lg:leading-tight no-underline hover:no-underline focus:no-underline ' + LABEL.def + '">' + label + '</a>'; }
  function nav(active, o) {
    o = o || {}; var on = function (l) { return active === l; }, acts = o.navActions || {};
    // o.navActions: { "Services": ["tab", "services"] } makes a nav item run a prototype action. o.messages: the unread count.
    function go(l) { var x = acts[l]; return x ? { a: x[0], v: x[1] } : {}; }
    return '<nav ' + dc('Vendor::Nav::Component', null, 'code', 'Shown as an Owner sees it. Workers see no Messages, Your team, Service areas, Services or Your company.') + ' id="vendor-nav-drawer" aria-label="Main" class="fixed inset-y-0 left-0 z-40 flex flex-col w-72 max-w-[85vw] bg-white border-0 border-r border-solid border-manatee-polar -translate-x-full transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-dvh lg:self-start lg:z-auto lg:w-56 lg:max-w-none lg:translate-x-0 lg:transition-none dark:invert dark:hue-rotate-180">' +
      '<div class="hidden sm:flex justify-center px-5 pt-2 pb-4 lg:pt-6 shrink-0"><a href="javascript:void(0)" aria-label="Supplier portal home" class="block no-underline hover:no-underline rounded-lg"><span class="flex flex-col items-center gap-2.5">' + img('logo_mark', 'block h-9 w-9 shrink-0') + '<span class="text-lg font-semibold leading-tight text-charcoal">Supplier portal</span></span></a></div>' +
      '<div class="flex-1 min-h-0 overflow-y-auto pt-2 lg:pb-2 mt-1"><div class="space-y-1">' +
      navItem('Service requests', 'question_stroke', Object.assign({ active: on('Service requests') }, go('Service requests'))) +
      navItem('Jobs', 'calendar_time_stroke', { section: true, active: on('Jobs') }) + '<div class="space-y-1">' + subItem('Scheduled') + subItem('Completed') + '</div>' +
      navItem('Messages', 'chat', Object.assign({ count: o.messages, active: on('Messages') }, go('Messages'))) +
      navItem('Your team', 'group_team', Object.assign({ active: on('Your team') }, go('Your team'))) +
      navItem('Service areas', 'map_stroke', Object.assign({ active: on('Service areas') }, go('Service areas'))) +
      navItem('Services', 'handheart_stroke', Object.assign({ active: on('Services') }, go('Services'))) +
      navItem('Your company', 'marketplace_stroke', Object.assign({ active: on('Your company') }, go('Your company'))) +
      '</div><div class="px-6"><div ' + dc('Admin::DividerComponent', { margin: 'my-4' }) + ' class="border-0 border-t border-solid border-snowflake-muddy my-4"></div></div>' +
      '<a href="javascript:void(0)" class="block px-6 py-3.5 text-base font-medium leading-none lg:py-2.5 lg:text-sm lg:leading-none text-warning no-underline hover:no-underline hover:text-warning hover:bg-warning hover:bg-opacity-05">Sign out</a></div>' +
      '<div class="justify-center px-5 py-5 shrink-0 hidden lg:flex"><a ' + dc('Vendor::WebsiteLinkComponent', null, 'code') + ' href="javascript:void(0)" aria-label="Lookout website" class="block px-1 text-cornflower hover:text-charcoal no-underline hover:no-underline rounded">' + img('lockup', 'h-6 w-24') + '</a></div></nav>';
  }

  // ---------- Vendor::Header::UserMenuComponent ----------
  function userMenu(name, org) {
    var av = UI.avatar(name).replace('"size":12', '"size":6').replace('w-12 h-12', 'w-6 h-6').replace('text-xl', 'text-xs').replace('border border-solid border-white', 'border-none');
    return '<div ' + dc('Vendor::Header::UserMenuComponent', null, 'code', 'Opens Admin::WithPopoverComponent: Settings, view mode and Sign out. Not built in the prototype.') + ' class="cursor-pointer text-sm flex items-center gap-1 p-2.5 pr-3 lg:p-2 rounded-full border border-solid border-snowflake-muddy lg:border-0 lg:shadow lg:pl-3 lg:pr-4 lg:bg-white" aria-label="Your account">' +
      '<div class="mr-1">' + av + '</div><span class="leading-tight hidden sm:block text-left mr-2 max-w-64 md:max-w-96"><span class="block font-medium truncate">' + esc(name) + '</span><span class="block text-xs text-manatee truncate">' + esc(org) + '</span></span>' + icon('chevron_down') + '</div>';
  }

  // ---------- Vendor::Layout::Component ----------
  // The real content area is bg-vendor: royal-100 with a gradient and background images. The images are left out here.
  function shell(content, o) {
    return '<div ' + dc('Vendor::Layout::Component', null, 'code', 'bg-vendor drawn as its base colour, bg-royal-100; the gradient and background images are left out.') + ' class="flex flex-1 min-h-0">' + nav(o.active, o) +
      '<div class="flex flex-col flex-1 min-w-0 bg-royal-100 min-h-screen dark:invert dark:hue-rotate-180"><header class="sticky top-0 z-10 lg:relative flex items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8 lg:justify-end bg-white lg:bg-transparent shadow lg:shadow-[0_0_#0000]">' + userMenu(o.user, o.org) + '</header>' +
      '<main class="isolate flex-1 min-w-0">' + content + '</main></div></div>';
  }

  // ---------- Vendor::Layout::TabbedPageComponent + Vendor::FilterLinkComponent + Vendor::BoxComponent ----------
  // tabs: [[key, label, count]]
  function filterLink(t, active, action) {
    var on = t[0] === active;
    return '<a ' + dc('Vendor::FilterLinkComponent', { active: on, count: t[2] }, 'code', 'The real label is uppercase (text-[11px] uppercase). The copy is sentence case.') + ' href="javascript:void(0)" data-a="' + action + '" data-v="' + t[0] + '"' + (on ? ' aria-current="page"' : '') + ' class="flex-1 text-white no-underline flex flex-col gap-1.5 justify-center items-center max-w-32 rounded-lg p-1.5' + (on ? ' border border-solid border-aqua bg-aqua/30' : '') + '"><span class="text-2xl leading-none font-bold">' + t[2] + '</span><span class="text-[11px] uppercase tracking-wide font-medium leading-none ' + (on ? 'text-white' : 'text-royal-400') + '">' + t[1] + '</span></a>';
  }
  function tabbedPage(heading, tabs, active, action, body) {
    return '<div ' + dc('Vendor::Layout::TabbedPageComponent', null, 'code', null, ['heading', 'tabs', 'body']) + ' class="mx-auto px-4 pt-6 pb-5 sm:p-8 lg:pt-0 w-full space-y-6 max-w-screen-lg">' +
      '<header class="flex items-baseline justify-between gap-2 flex-wrap"><h1 class="m-0 text-xl sm:text-2xl font-medium text-charcoal">' + heading + '</h1></header>' +
      '<div class="rounded-2xl bg-charcoal"><nav class="flex p-2 gap-1 overflow-x-auto sm:py-4 sm:px-5 sm:gap-2" aria-label="Services and prices">' + tabs.map(function (t) { return filterLink(t, active, action); }).join('') + '</nav>' +
      '<div ' + dc('Vendor::BoxComponent', { border_color: ['border-charcoal'] }, 'code') + ' class="relative bg-white border-2 border-solid rounded-2xl p-4 sm:p-6 border-charcoal">' + body + '</div></div></div>';
  }

  // ---------- Vendor::CollapsibleSectionComponent ----------
  function collapsible(title, summary, main, o) {
    o = o || {};
    return '<details ' + dc('Vendor::CollapsibleSectionComponent', o.open ? { open: true } : null, 'code', null, ['title', 'group_summary', 'main']) + (o.open ? ' open' : '') + ' class="px-4 group py-4 border border-manatee-polar rounded-lg border-solid">' +
      '<summary class="list-none cursor-pointer text-charcoal hover:text-royal"' + (o.a ? ' data-a="' + o.a + '" data-v="' + o.v + '"' : '') + '><div class="flex items-center leading-tight space-x-4"><div class="flex-none w-4 h-4 flex items-center justify-center text-manatee rotate-0 details-open:rotate-180">' + icon('chevron_down') + '</div><div class="flex-grow font-medium">' + title + '</div>' +
      (summary ? '<div><span class="text-charcoal-700 whitespace-nowrap">' + summary + '</span></div>' : '') + '</div></summary>' +
      (o.open ? '<div class="mt-4 space-y-4">' + main + '</div>' : '') + '</details>';
  }

  // ---------- Vendor::ServiceTypeBadgeComponent ----------
  // Admin::TagComponent.colored_for(service_type): a colour picked from the service type's name.
  var COLORS = ['royal', 'emerald', 'butterscotch', 'aqua', 'magenta', 'orange', 'lime'];
  function serviceBadge(type) {
    var n = 0; for (var i = 0; i < type.length; i++) n = (n * 31 + type.charCodeAt(i)) % 9973;
    return '<span ' + dc('Vendor::ServiceTypeBadgeComponent', null, 'code') + ' class="contents">' + UI.tag(type, COLORS[n % COLORS.length]) + '</span>';
  }

  // ---------- Admin::IconButtonComponent ----------
  function iconButton(label, ic, o) {
    o = o || {};
    return UI.button('<span ' + dc('Admin::WithIconComponent', { icon: ic }, 'code') + ' class="inline-flex items-center gap-2">' + icon(ic) + '<span>' + label + '</span></span>', o)
      .replace(/data-component="Admin::ButtonComponent" data-props='([^']*)'/, function (m, p) { return dc('Admin::IconButtonComponent', Object.assign(JSON.parse(p.replace(/&#39;/g, "'")), { icon: { name: ic } }), 'code'); });
  }

  // ---------- Admin::EmptyPanelComponent ----------
  function emptyPanel(title, sub, button) {
    return '<div ' + dc('Admin::EmptyPanelComponent', { styles: ['rounded-2xl'], background: 'bg-grey-lighter' }, null, null, ['image', 'title', 'subtitle', 'button']) + ' class="shadow border rounded-2xl border-solid border-manatee-polar bg-grey-lighter flex flex-col items-center justify-center text-center py-10 px-6">' +
      img('ic_bill', 'w-14 h-14') + '<div class="mt-2 text-xl font-medium text-charcoal">' + title + '</div>' + (sub ? '<div class="mt-2 leading-snug text-charcoal">' + sub + '</div>' : '') + (button ? '<div class="mt-4">' + button + '</div>' : '') + '</div>';
  }

  // ---------- Vendor::Modal::Component ----------
  // Admin::Modal::Component's markup with the portal's dialog. Centred, as its default variant is.
  function modal(title, body, foot, o) {
    // The footer is the modal's footer slot, not a component of its own: the kit marks it Admin::Modal::Component::Footer.
    return UI.modal(title, body, foot, o).replace(/data-component="Admin::Modal::Component" data-props='([^']*)'/, function (m, p) { return dc('Vendor::Modal::Component', JSON.parse(p.replace(/&#39;/g, "'")), 'code', 'Title and footer are slots it inherits from Admin::Modal::Component. Left off the marker: the catalog lists no inherited slots.'); })
      .replace(/<div data-component="Admin::Modal::Component::Footer" data-props='[^']*' /, '<div ')
      .replace('flex justify-center items-start overflow-y-auto bg-charcoal-dark/50 p-6', 'flex justify-center items-start sm:items-center overflow-y-auto bg-charcoal-dark/50 p-6');
  }

  // ---------- Admin::Form::Input::DateComponent ----------
  // FieldWithIconComponent: a date field with the calendar icon on the left.
  function dateInput(o) {
    return '<div ' + dc('Admin::Form::Input::DateComponent', null, 'code') + ' class="contents">' + UI.input({ type: 'date', bind: o.bind, value: o.value, id: o.id, error: o.error, left: icon('calendar'), width: 'w-max', attrs: ' placeholder="dd/mm/yyyy" min="' + (o.min || '') + '"' }) + '</div>';
  }

  // ---------- Admin::Form::Input::TextAreaComponent ----------
  function textarea(o) {
    return '<textarea ' + dc('Admin::Form::Input::TextAreaComponent', null) + (o.id ? ' id="' + o.id + '"' : '') + ' data-b="' + o.bind + '" rows="' + (o.rows || 3) + '" class="block box-border shrink font-normal min-w-0 outline-none p-2 placeholder-manatee text-charcoal w-full min-h-14 min-w-64 max-h-full max-w-full bg-white rounded-lg border border-solid border-manatee-diet hover:border-royal focus:border-royal focus:ring-4 focus:ring-royal focus:ring-opacity-20 font-sans">' + esc(o.value || '') + '</textarea>';
  }

  // ---------- Admin::Form::Input::FileDropzoneComponent ----------
  // o: { prompt, a } with nothing chosen; { file, size, replace, remove } once a file is chosen.
  function dropzone(o) {
    var box = 'shadow print:shadow-transparent border-2 rounded-lg';
    var inner = o.file
      ? '<div class="' + box + ' border-solid border-manatee-polar bg-white flex items-center gap-4 p-4"><span class="relative flex size-12 shrink-0 items-center justify-center rounded-md bg-snowflake">' + icon('file_text_stroke', 6, 'text-manatee') + '</span>' +
        '<span class="flex min-w-0 flex-1 flex-col"><span class="font-medium break-words">' + esc(o.file) + '</span><span class="text-sm text-charcoal-700">' + o.size + '</span></span>' +
        UI.button('Replace', { size: 8, a: o.replace }) + UI.button('Remove', { size: 8, variant: 'destructive_borderless', a: o.remove }) + '</div>'
      : '<div role="button" tabindex="0" data-a="' + o.a + '" class="' + box + ' relative block border-dashed bg-snowflake border-manatee-polar cursor-pointer hover:bg-royal-50"><div class="flex flex-col items-center gap-2 p-6 text-center">' + icon('file_text_stroke', 8, 'text-manatee') + '<span>' + o.prompt + '</span><span class="text-sm text-royal">Choose a file</span></div></div>';
    return '<div ' + dc('Admin::Form::Input::FileDropzoneComponent', { accept: ['.xlsx', '.csv'] }, 'code') + ' class="group/dropzone relative space-y-2">' + inner + '</div>';
  }

  // ---------- Admin::DayApplicabilityComponent + WeekdayCircleComponent ----------
  // As the Support at Home prices table renders days: a circle per day, Sunday first, or public holidays on their own.
  var DAYNAMES = [['Sun', 'Sunday'], ['Mon', 'Monday'], ['Tue', 'Tuesday'], ['Wed', 'Wednesday'], ['Thu', 'Thursday'], ['Fri', 'Friday'], ['Sat', 'Saturday']];
  function days(on, ph) {
    var inner = ph && !on.length
      ? '<div class="space-x-1">' + icon('holiday_stroke') + '<span>Public holidays</span></div>'
      : DAYNAMES.map(function (d) { var sw = on.indexOf(d[0]) >= 0; return '<div ' + dc('WeekdayCircleComponent', { weekday: d[1].toLowerCase(), switch: sw, size: 6 }, 'code') + ' class="w-6 h-6 shrink-0 flex justify-center items-center rounded-full font-medium text-xs ' + (sw ? 'bg-royal text-white' : 'bg-snowflake text-charcoal') + '"><span title="' + d[1] + '">' + d[0][0] + '</span></div>'; }).join('');
    return '<div ' + dc('Admin::DayApplicabilityComponent', { occurrence_days: on, public_holidays: !!ph && !on.length, size: 6 }, 'code') + ' class="flex flex-row space-x-1">' + inner + '</div>';
  }

  // ---------- Admin::MultiActionMenuComponent with its label slot ----------
  // With a label, the control is a button with the label and a chevron, in the variant passed (secondary here).
  function actionsMenu(label, items) {
    var html = UI.rowActions(items).replace(/^<div [^>]*>/, '').replace(/<\/div>$/, '');
    var sec = UI.button('', { variant: 'secondary' }).match(/class="([^"]*)"/)[1].replace(' text-sm px-4 py-3 h-11 inline-flex', '');
    return html
      .replace(/data-component="Admin::MultiActionMenuComponent" data-props='[^']*'/, dc('Admin::MultiActionMenuComponent', { position: 'below', variant: 'secondary' }, null, null, ['label']))
      .replace(/<summary class="[^"]*">[\s\S]*?<\/summary>/, '<summary class="' + sec + ' text-sm px-4 py-3 h-11 gap-2 details-open:border-royal outline-none list-none box-border inline-flex">' + label + icon('chevron_down', 4, '-m-1') + '</summary>');
  }

  // ---------- Admin::Table::RowComponent ----------
  // In code, not in the design system: the kit's UI.tr leaves its tier off.
  function tr(cells, o) { var h = UI.tr(cells, o); return o && o.color ? h.replace('data-component="Admin::Table::RowComponent"', 'data-component="Admin::Table::RowComponent"').replace(/(data-component="Admin::Table::RowComponent" data-props='[^']*')/, '$1 data-tier="code"') : h; }

  return { actionsMenu: actionsMenu, tr: tr, days: days, icon: icon, nav: nav, shell: shell, tabbedPage: tabbedPage, collapsible: collapsible, serviceBadge: serviceBadge, iconButton: iconButton, emptyPanel: emptyPanel, modal: modal, dateInput: dateInput, textarea: textarea, dropzone: dropzone };
})();
