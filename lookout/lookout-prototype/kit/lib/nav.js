// Admin::PrimaryNav::Component in full: logo row, sections, and the footer with Ask me anything and the user menu.
// Markup from primary_nav/component.html.erb, item_component, collapsible_section_component, user_menu_component
// and hubspot_widget_toggle_component on main. Labels from primary_nav/component.yml, with the H2 2026 flag on.
// Collapse works as admin--primary-nav--nav does: 48px wide, links hidden, the mark instead of the lockup.
var NAV = (function () {
  var dc = UI.dc, icon = function (n, sz, cls) { return '<div class="shrink-0 w-' + sz + ' h-' + sz + ' align-middle inline-block' + (cls ? ' ' + cls : '') + '">' + ICONS[n] + '</div>'; };
  // NAV.config({ active: "Suppliers", add: { section: "procurement", label: "Supplier prices", note: "New nav item" }, user: "Sam Taylor", tenant: "Harbourside Care" })
  var cfg = { active: null, add: null };
  function config(o) { cfg = Object.assign(cfg, o || {}); var k = cfg.add ? cfg.add.section : null; if (k) st.open[k] = true; }
  var st = { collapsed: false, open: { procurement: true } };
  try { var s0 = JSON.parse(localStorage.getItem('ds-nav-v1') || 'null'); if (s0) st = s0; } catch (e) {}
  function save() { try { localStorage.setItem('ds-nav-v1', JSON.stringify(st)); } catch (e) {} }

  var CHEV = '<div class="shrink-0 w-3 h-3 align-middle inline-block"><svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="block"><path d="M7 4L13 10L7 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>';
  var ITEM = 'text-sm text-white group block px-3 py-2 leading-none mb-[1px] rounded-md hover:text-white focus:text-white hover:no-underline focus:no-underline hover:bg-cornflower hover:bg-opacity-40';
  function item(label, o) { o = o || {}; if (cfg.active === label) o.active = true; return '<a ' + dc('Admin::PrimaryNav::ItemComponent', o.active ? { active: true } : null, 'code') + ' class="' + ITEM + (o.active ? ' group-active bg-cornflower-dark' : '') + (o.cls ? ' ' + o.cls : '') + ' cursor-pointer"' + (o.a ? ' data-a="' + o.a + '"' : '') + (o.note ? ' data-note="' + o.note + '"' : '') + '>' + label + '</a>'; }
  function section(key, title, items) {
    if (cfg.add && cfg.add.section === key) items = items.concat([item(cfg.add.label, { active: cfg.active === cfg.add.label, note: cfg.add.note })]);
    var open = !!st.open[key] || items.some(function (i) { return i.indexOf("group-active") >= 0; });
    return '<details ' + dc('Admin::PrimaryNav::CollapsibleSectionComponent', { expanded: open }, 'code') + ' data-nav-section="' + key + '"' + (open ? ' open' : '') + ' class="group my-3"><summary class="sticky -top-3 z-10 list-none outline-none cursor-pointer group text-[0.75rem] font-medium px-3 group-open:mb-1 transition-all ease-out bg-charcoal shadow shadow-charcoal ' + (open ? 'text-royal-200' : 'text-royal-400 hover:text-royal-200') + '"><div class="flex items-center"><div class="flex-1 grow">' + title + '</div><div class="transition-transform ease-out details-open:rotate-90">' + CHEV + '</div></div></summary>' + items.join('') + '</details>';
  }
  var POP_ITEM = 'appearance-none border-0 outline-none box-border bg-white first:rounded-t-[7px] last:rounded-b-[7px] no-underline hover:no-underline text-sm text-charcoal font-medium flex w-full items-center space-x-4 px-5 py-3 leading-normal group/popover-item relative cursor-pointer text-left hover:text-royal hover:bg-royal hover:bg-opacity-05';
  function popItem(label, ic) { return '<a ' + dc('Admin::Popover::ItemComponent', { icon: ic }, 'code') + ' class="' + POP_ITEM + '"><div class="flex items-center justify-center text-manatee group-hover/popover-item:text-royal">' + icon(ic, 4) + '</div><div class="flex-1">' + label + '</div></a>'; }
  function divider() { return '<div class="px-4"><div ' + dc('Admin::DividerComponent', null, 'code') + ' class="border-0 border-t border-solid border-snowflake-muddy my-1"></div></div>'; }
  function userMenu() {
    var USER = cfg.user || 'Sam Taylor', TENANT = cfg.tenant || 'Harbourside Care';
    return '<details ' + dc('Admin::PrimaryNav::UserMenuComponent', null, 'code', 'Opens Admin::WithPopoverComponent to the right, aligned to the bottom.') + ' data-nav-user class="block"><summary class="list-none group rounded-md bg-cornflower-dark p-2 px-2.5 cursor-pointer group-data-[collapsed]/primary-nav:bg-transparent group-data-[collapsed]/primary-nav:px-2"><div class="flex items-center min-w-0"><div class="relative mr-2.5">' +
      UI.avatar(USER).replace('{"full_name":"' + USER + '","size":12}', '{"full_name":"' + USER + '","size":8}').replace('w-12 h-12', 'w-8 h-8').replace('text-xl', 'text-sm').replace('border border-solid border-white', 'border-none') + '</div>' +
      '<div class="select-none group-data-[collapsed]/primary-nav:hidden"><div title="' + USER + '" class="w-[132px] leading-tight text-white text-sm font-medium truncate">' + USER + '</div><div title="' + TENANT + '" class="w-[132px] leading-tight text-cornflower-lighter mt-px font-normal line-clamp-2 text-[13px]">' + TENANT + '</div></div>' +
      '<div class="ml-auto group-data-[collapsed]/primary-nav:hidden" aria-label="User menu">' + icon('overflow', 5, 'text-white/70 group-hover:text-white') + '<div class="sr-only">Settings</div></div></div></summary>' +
      '<div data-nav-pop class="invisible fixed w-max z-50"><div role="menu" class="shadow-action border rounded-lg border-solid border-manatee-diet bg-white min-w-[14rem]">' +
      popItem('Switch to Care', 'repeat') + popItem('Edit my bio', 'person') + popItem('Settings', 'cog_stroke') + popItem('Email deliveries', 'email_stroke') + popItem('Login activity', 'history') + popItem('Release Hub', 'gift_stroke') + divider() +
      popItem('Help and support', 'question_stroke') + popItem('Lookout Academy', 'learning_cap_stroke') + popItem('Roadmap and releases', 'map_stroke') + divider() + popItem('Sign out', 'power') + '</div></div></details>';
  }
  function render() {
    var c = st.collapsed, hide = c ? ' hidden' : '';
    return '<nav ' + dc('Admin::PrimaryNav::Component', null, 'code') + ' class="flex flex-col bg-charcoal relative print:hidden group/primary-nav sticky top-0 h-screen self-start shrink-0" style="width:' + (c ? 48 : 240) + 'px"' + (c ? ' data-collapsed="true"' : '') + ' aria-label="Primary navigation">' +
      '<div class="flex flex-wrap justify-between items-center p-3 mt-3 mb-2"><a aria-label="Lookout home" data-a="hub" class="cursor-pointer"><div class="flex flex-wrap items-center leading-none"><div class="ml-3' + hide + '"><div class="h-6 w-[103px]">' + ICONS.lockup + '</div></div></div></a>' +
      '<div class="flex flex-wrap items-center gap-2"><div class="mb-3 text-white' + (c ? '' : ' hidden') + '">' + icon('logo', 6) + '</div>' +
      '<button type="button" data-nav-toggle aria-label="Expand/collapse" class="cursor-pointer text-cornflower bg-transparent border-0 px-0 transition-transform duration-400 ease-out' + (c ? ' rotate-180' : '') + '">' + icon('nav_collapse', 6) + '</button>' +
      '<div ' + dc('Admin::PrimaryNav::Notifications::MenuComponent', null, 'code', 'The bell opens the notifications menu. Not built in the prototype.') + ' class="list-none relative' + hide + '"><div class="relative w-6 h-6 text-white bg-cornflower rounded-lg flex items-center"><div class="w-5 h-5 mx-auto">' + icon('bell', 5) + '</div></div></div></div></div>' +
      '<div class="flex flex-col w-60 grow p-3 overflow-auto print:hidden primary-nav' + hide + '">' +
      item('Home') + '<div class="mb-3">' + item('Tickets') + item('Communities') + '</div>' +
      section('care', 'Care', [item('Members')]) +
      section('rostering', 'Rostering', [item('Helpers'), item('Scheduling'), item('Group visits &amp; activities'), item('Daily snapshots'), item('Punchcards'), item('Recurring rules'), item('Cancellations')]) +
      section('procurement', 'Procurement', [item('Service requests'), item('Purchase order jobs'), item('Supplier Helpers'), item('Suppliers')]) +
      section('finance', 'Finance', [item('Billing runs'), item('Invoices &amp; credit notes'), item('Invoice summaries'), item('Purchase orders'), item('Supplier invoices'), item('Account transactions'), item('Workforce compliance')]) +
      section('claiming', 'Claiming', [item('Support at Home'), item('Home Care Packages'), item('CHSP DEX'), item('DVA')]) +
      section('reports', 'Reports', [item('All reports')]) +
      '<div class="mt-2">' + item('Analytics') + item('Data import') + item('Data export') + item('Automations') + item('Lookout Assist') + item('Profile search', { cls: 'mt-4' }) + '</div></div>' +
      '<div class="mt-auto shrink-0 mb-2"><div class="p-3 group-data-[collapsed]/primary-nav:p-0">' +
      '<button type="button" ' + dc('Admin::HubspotWidgetToggleComponent', null, 'code', 'Opens the HubSpot chat. Not built in the prototype.') + ' aria-label="Ask me anything…" class="appearance-none border-0 w-full cursor-pointer flex items-center gap-1.5 text-sm text-white px-3 py-2 leading-none my-4 rounded-full bg-cornflower bg-opacity-40 hover:text-white hover:bg-opacity-60 group-data-[collapsed]/primary-nav:w-8 group-data-[collapsed]/primary-nav:h-8 group-data-[collapsed]/primary-nav:p-0 group-data-[collapsed]/primary-nav:mx-auto group-data-[collapsed]/primary-nav:mb-2 group-data-[collapsed]/primary-nav:justify-center">' + icon('assist_star', 4) + '<span class="flex-1 text-left group-data-[collapsed]/primary-nav:hidden">Ask me anything…</span>' + icon('send_solid', 4, 'group-data-[collapsed]/primary-nav:hidden') + '</button>' +
      userMenu() + '</div></div></nav>';
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-nav-toggle]'); if (!t) return;
    st.collapsed = !st.collapsed; save();
    var nav = t.closest('nav'); nav.outerHTML = render();
  });
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d.matches && d.matches('details[data-nav-section]')) { st.open[d.getAttribute('data-nav-section')] = d.open; save(); var sum = d.querySelector('summary'); sum.classList.toggle('text-royal-200', d.open); sum.classList.toggle('text-royal-400', !d.open); return; }
    if (d.matches && d.matches('details[data-nav-user]')) {
      var pop = d.querySelector('[data-nav-pop]'); if (!d.open) { pop.classList.add('invisible'); return; }
      var r = d.querySelector('summary').getBoundingClientRect();
      pop.style.left = (r.right + 8) + 'px'; pop.style.top = Math.max(8, r.bottom - pop.offsetHeight) + 'px'; pop.classList.remove('invisible');
    }
  }, true);
  document.addEventListener('click', function (e) { var u = document.querySelector('details[data-nav-user][open]'); if (u && !u.contains(e.target)) u.open = false; }, true);

  return { render: render, config: config };
})();
T2.primaryNav = NAV.render;
