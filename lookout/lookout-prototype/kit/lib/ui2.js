// Row actions and segment controls, as the app renders them.
(function () {
  var dc = UI.dc, esc = UI.esc;
  function icon(n) { return '<div class="shrink-0 w-4 h-4 align-middle inline-block">' + ICONS[n] + '</div>'; }
  var SB = UI.button('', { variant: 'secondary_borderless' }).match(/class="([^"]*)"/)[1].replace(' text-sm px-4 py-3 h-11 inline-flex', '');

  // Admin::Table::ActionsComponent. One action: an icon button with a tooltip on its left.
  // Two or more: Admin::MultiActionMenuComponent. items: [{ label, icon, a, v, destructive }]
  function rowActions(items) {
    var inner;
    if (items.length === 1) {
      var it = items[0];
      inner = '<div ' + dc('Admin::WithTooltipComponent', { position: 'left' }, 'code') + ' class="relative inline-flex group/tt">' +
        UI.button('<div class="sr-only">' + it.label + '</div>' + icon(it.icon), { a: it.a, v: it.v, variant: it.destructive ? 'destructive_borderless' : 'secondary_borderless' }) +
        '<div class="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-1 hidden group-hover/tt:flex group-focus-within/tt:flex z-30 items-center"><div class="shadow-action border rounded-md border-solid border-charcoal-dark bg-charcoal-dark"><div class="text-sm px-3 py-2 text-white whitespace-nowrap">' + it.label + '</div></div>' +
        '<svg viewBox="0 0 10 20" height="12" width="6" class="block -ml-px" overflow="visible"><polygon points="0,0 8,10 0,20" class="fill-charcoal-dark"></polygon></svg></div></div>';
    } else inner = menu(items);
    return '<div ' + dc('Admin::Table::ActionsComponent', { styles: ['flex', 'justify-end'] }, 'code') + ' class="flex justify-end">' + inner + '</div>';
  }
  var ITEM = 'appearance-none border-0 outline-none box-border bg-white first:rounded-t-[7px] last:rounded-b-[7px] focus:no-underline active:no-underline hover:no-underline no-underline text-sm text-charcoal font-medium flex w-full items-center space-x-4 px-5 py-3 leading-normal group/popover-item relative focus:z-10 disabled:opacity-50 hover:bg-opacity-05 active:bg-opacity-05 focus:bg-opacity-05 focus-within:bg-opacity-05 focus:ring-opacity-20 focus:ring-4 focus-within:ring-opacity-20 focus-within:ring-4 cursor-pointer text-left ';
  var OK = 'hover:text-royal hover:bg-royal active:text-royal active:bg-royal focus:text-royal focus:bg-royal focus:ring-royal';
  var BAD = 'hover:text-warning hover:bg-warning active:text-warning active:bg-warning focus:text-warning focus:bg-warning focus:ring-warning';
  function menu(items) {
    return '<details ' + dc('Admin::MultiActionMenuComponent', { position: 'below' }) + ' class="group/popover relative inline-block ml-auto"><summary class="' + SB + ' text-sm px-4 py-3 h-11 gap-2 details-open:border-royal outline-none list-none box-border inline-flex"><div class="sr-only">Actions</div>' + icon('overflow') + '</summary>' +
      '<div data-menu-pop class="invisible fixed w-max top-0 left-0 z-40"><div role="menu" class="shadow-action border rounded-lg border-solid border-manatee-diet bg-white">' + items.map(function (it) {
        return '<button type="button" role="menuitem" data-a="' + it.a + '"' + (it.v != null ? ' data-v="' + esc(it.v) + '"' : '') + ' class="' + ITEM + (it.destructive ? BAD : OK) + '"><div class="flex-row items-center flex justify-center ' + (it.destructive ? 'text-warning' : 'text-manatee group-hover/popover-item:text-royal') + '">' + icon(it.icon) + '</div><div class="flex-1">' + it.label + '</div></button>';
      }).join('') + '</div></div></details>';
  }
  UI.rowActions = rowActions;
  UI.icon = icon;

  // Admin::SegmentControlsComponent with Admin::SegmentComponent, as budgets uses under its record tabs.
  // The app's segments are links that load a page; here they switch the view in place.
  T2.chips = function (items, active, action) {
    return '<nav ' + dc('Admin::SegmentControlsComponent', null, 'code') + ' class="bg-grey-lighter border-grey-light border rounded-md border-solid flex-row flex w-fit max-w-full overflow-x-auto">' + items.map(function (t) {
      var on = t[0] === active, warn = (t[0] === 'error' || t[0] === 'need') && t[2] > 0;
      var label = t[2] != null ? '<div class="flex items-center justify-center gap-2"><div>' + t[1] + '</div>' + T2.count(t[2], warn) + '</div>' : t[1];
      return '<button type="button" ' + dc('Admin::SegmentComponent', { active: on }, 'code') + ' data-a="' + action + '" data-v="' + t[0] + '" class="font-medium text-center hover:no-underline min-w-32 h-10 px-5 flex-auto text-sm px-3 py-2 border rounded-md border-solid whitespace-nowrap cursor-pointer ' + (on ? 'bg-white border-grey-light text-royal hover:text-charcoal' : 'bg-transparent border-transparent text-charcoal hover:text-royal') + '">' + label + '</button>';
    }).join('') + '</nav>';
  };
})();
