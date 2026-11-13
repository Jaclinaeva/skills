// Lookout components for the prototype. Markup is copied from the Lookout Design System
// (https://claude.ai/artifact/T7Yug6WwVXmZyrEYu4rfcy) or rendered from the ViewComponents on main.
// Every root carries data-component and data-props, so the handover reads straight across to `render` calls.
// data-tier marks where a component stands:
//   (none)       in the design system
//   "code"       a ViewComponent in the app, not in the design system yet
//   proposed:X   exists nowhere yet: a design decision to review
var UI = (function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function sq(s) { return String(s).replace(/'/g, '&#39;'); }
  // props: constructor arguments only. slots: names of the slots this instance fills, e.g. ['left'].
  function dc(name, props, tier, note, slots) {
    return 'data-component="' + name + '"' + (props && Object.keys(props).length ? " data-props='" + sq(JSON.stringify(props)) + "'" : '') + (slots && slots.length ? " data-slots='" + sq(JSON.stringify(slots)) + "'" : '') + (tier ? ' data-tier="' + tier + '"' : '') + (note ? ' data-note="' + esc(note) + '"' : '');
  }
  function proposed(name, note) { return dc('proposed:' + name, null, 'proposed', note); }
  function act(o) { return o && o.a ? ' data-a="' + o.a + '"' + (o.v != null ? ' data-v="' + esc(o.v) + '"' : '') : ''; }

  // ---------- Admin::ButtonComponent ----------
  var B0 = 'appearance-none hover:no-underline active:no-underline focus:no-underline font-medium items-center whitespace-nowrap cursor-pointer print:hidden ';
  var B1 = ' outline-none border-b-2 active:border-b disabled:opacity-50 disabled:active:border-b-2 aria-readonly:opacity-50 aria-readonly:pointer-events-none focus:ring-opacity-20 focus:ring-4 focus-within:ring-opacity-20 focus-within:ring-4 border rounded-lg border-solid ';
  var BTN = {
    primary: B0 + 'bg-royal text-white disabled:bg-royal disabled:text-white hover:bg-royal-dark hover:text-white focus:bg-royal-dark focus:text-white focus-within:bg-royal-dark focus-within:text-white' + B1 + 'border-royal divide-white border-b-charcoal disabled:border-royal disabled:divide-white hover:border-royal-dark hover:border-b-charcoal-dark hover:divide-white focus:border-royal-dark focus:divide-white focus:ring-royal focus-within:border-royal-dark focus-within:divide-white focus-within:ring-royal',
    secondary: B0 + 'bg-white text-charcoal disabled:bg-white disabled:text-charcoal hover:bg-white hover:text-royal focus:bg-white focus:text-royal focus-within:bg-white focus-within:text-royal' + B1 + 'border-manatee-diet divide-manatee-diet disabled:border-manatee-diet disabled:divide-manatee-diet hover:border-royal hover:divide-royal focus:border-royal focus:divide-royal focus:ring-royal focus-within:border-royal focus-within:divide-royal focus-within:ring-royal',
    tertiary: B0 + 'bg-royal-100/50 text-royal disabled:bg-manatee-polar disabled:text-charcoal hover:bg-royal-100 hover:text-royal focus:bg-royal-100 focus:text-royal focus-within:bg-royal-100 focus-within:text-royal' + B1 + 'border-dashed border-royal-400 divide-royal-400 !border-b disabled:border-manatee disabled:divide-royal disabled:active:!border-b hover:border-royal hover:divide-royal focus:border-royal focus:divide-royal focus:ring-royal focus-within:border-royal focus-within:divide-royal focus-within:ring-royal',
    secondary_borderless: B0 + 'bg-white text-charcoal disabled:bg-white disabled:text-charcoal hover:bg-white hover:text-royal focus:bg-white focus:text-royal focus-within:bg-white focus-within:text-royal' + B1 + 'border-transparent divide-transparent disabled:border-transparent disabled:divide-transparent hover:border-royal hover:divide-royal focus:border-royal focus:divide-royal focus:ring-royal focus-within:border-royal focus-within:divide-royal focus-within:ring-royal',
    destructive: B0 + 'bg-white text-warning disabled:bg-white disabled:text-warning hover:bg-white hover:text-warning focus:bg-white focus:text-warning focus-within:bg-white focus-within:text-warning' + B1 + 'border-manatee-diet divide-manatee-diet disabled:border-manatee-diet disabled:divide-manatee-diet hover:border-warning hover:divide-warning focus:border-warning focus:divide-warning focus:ring-warning focus-within:border-warning focus-within:divide-warning focus-within:ring-warning'
  };
  BTN.destructive_borderless = B0 + 'bg-white text-warning disabled:bg-white disabled:text-warning hover:bg-white hover:text-warning focus:bg-white focus:text-warning focus-within:bg-white focus-within:text-warning' + B1 + 'border-transparent divide-transparent disabled:border-transparent disabled:divide-transparent hover:border-warning hover:divide-warning focus:border-warning focus:divide-warning focus:ring-warning focus-within:border-warning focus-within:divide-warning focus-within:ring-warning';
  var SIZE = { 10: ' text-sm px-4 py-3 h-11 inline-flex', 8: ' text-sm px-3.5 py-2 h-10 inline-flex', 6: ' text-sm px-2.5 py-1 h-8 inline-flex' };
  function button(label, o) {
    o = o || {}; var v = o.variant || 'secondary', s = o.size || 10, props = { variant: v };
    if (s !== 10) props.size = s;
    return '<button type="button" ' + dc('Admin::ButtonComponent', props) + ' class="' + BTN[v] + SIZE[s] + '"' + act(o) + (o.disabled ? ' disabled' : '') + '>' + label + '</button>';
  }
  // A text link. Lookout links are royal, underlined on hover. Base styles, not a component.
  function link(label, o) { return '<button type="button" class="appearance-none bg-transparent border-0 p-0 font-[inherit] text-royal hover:text-royal-dark hover:underline cursor-pointer text-left"' + act(o) + '>' + label + '</button>'; }
  function aLink(label, href) { return '<a href="' + href + '" target="_blank" rel="noopener" class="text-royal hover:text-royal-dark hover:underline">' + label + '</a>'; }

  // ---------- Admin::TagComponent ----------
  var TAG = { charcoal: 'bg-charcoal-100 border-charcoal-200', royal: 'bg-royal-100 border-royal-200', emerald: 'bg-emerald-100 border-emerald-200', butterscotch: 'bg-butterscotch-100 border-butterscotch-200', warning: 'bg-warning-100 border-warning-200', aqua: 'bg-aqua-100 border-aqua-200', magenta: 'bg-magenta-100 border-magenta-200', orange: 'bg-orange-100 border-orange-200', lime: 'bg-lime-100 border-lime-200' };
  function tag(text, color) { color = color || 'charcoal'; return '<div ' + dc('Admin::TagComponent', { color: color }) + ' class="w-fit px-2 inline-flex items-center rounded-lg font-medium space-x-1 text-sm px-2 py-1 border rounded-md border-solid ' + TAG[color] + ' text-xs h-6 whitespace-nowrap align-middle"><span class="min-w-0">' + text + '</span></div>'; }

  // ---------- Admin::PanelComponent ----------
  var PANEL = { '': 'border-manatee-polar bg-white', snowflake: 'bg-snowflake border-manatee-polar', royal: 'bg-royal-50 border-royal-200', warning: 'bg-warning-100 border-warning', alert: 'bg-butterscotch-100 border-butterscotch' };
  function panel(inner, o) {
    o = o || {}; var v = o.variant || '', props = v ? { variant: v } : {};
    if (o.flush) props.styles = ['p-0', 'overflow-hidden'];
    return '<div ' + dc('Admin::PanelComponent', props) + ' class="shadow print:shadow-transparent print:border-0 print:p-0 border rounded-lg border-solid ' + (o.flush ? 'p-0 overflow-hidden' : 'p-4') + ' ' + PANEL[v] + (o.cls ? ' ' + o.cls : '') + '">' + inner + '</div>';
  }

  // ---------- Admin::CalloutComponent ----------
  var CALLOUT = { alert: 'border-l-butterscotch bg-butterscotch-100', ok: 'border-l-emerald bg-emerald-100', warning: 'border-l-warning bg-warning-100', info: 'border-l-charcoal bg-snowflake' };
  function callout(inner, variant) { variant = variant || 'info'; return '<div ' + dc('Admin::CalloutComponent', { variant: variant }) + ' class="rounded-md border-0 border-solid border-l-4 text-md leading-normal ' + CALLOUT[variant] + ' px-6 py-4 flex flex-col gap-2">' + inner + '</div>'; }

  // ---------- Admin::HeadingComponent ----------
  var H = { 1: 'text-2xl', 2: 'text-xl', 3: 'text-base', 4: 'text-sm' };
  function heading(text, level) { level = level || 3; return '<h' + level + ' ' + dc('Admin::HeadingComponent', { level: level }) + ' class="m-0 ' + H[level] + ' font-medium text-charcoal">' + text + '</h' + level + '>'; }

  // ---------- Form ----------
  function hint(html) { return '<div ' + dc('Admin::Form::HintComponent') + ' class="leading-snug text-pretty [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 text-sm text-charcoal-700">' + html + '</div>'; }
  function error(html) { return '<div ' + dc('Admin::Form::ErrorComponent', null, 'code') + ' class="text-sm text-warning">' + html + '</div>'; }
  // The label always points at its control, as Rails' form builder pairs them: given an id (o.for), or one made up
  // here for the control's first input, select or textarea. Radio and checkbox groups are labelled by their options.
  var fieldSeq = 0;
  function field(label, control, o) {
    o = o || {};
    if (label && !o.for && !/type="(radio|checkbox)"/.test(control)) {
      var m = control.match(/<(input|select|textarea)\b[^>]*>/);
      if (m) { var idm = m[0].match(/\sid="([^"]+)"/); o.for = idm ? idm[1] : 'field-' + (++fieldSeq); if (!idm) control = control.replace(m[0], m[0].replace(/^<(input|select|textarea)/, '<$1 id="' + o.for + '"')); }
    }
    return '<div ' + dc('Admin::Form::ControlComponent', { layout: 'vertical' }) + ' class="flex flex-col gap-2 w-full">' + (label ? '<label class="block font-medium"' + (o.for ? ' for="' + o.for + '"' : '') + '>' + label + (o.optional ? ' <span class="font-normal text-charcoal-700">Optional</span>' : '') + '</label>' : '') +
      '<div class="space-y-2 grow">' + control + (o.error ? error(o.error) : '') + (o.hint ? hint(o.hint) : '') + '</div></div>';
  }
  var BOX = 'flex max-w-full p-0 bg-white rounded-lg border border-solid divide-x divide-solid focus:ring-opacity-20 focus:ring-4 focus-within:ring-opacity-20 focus-within:ring-4 disabled:bg-snowflake disabled:opacity-50 disabled:pointer-events-none disabled-within:bg-snowflake disabled-within:opacity-50 disabled-within:pointer-events-none aria-readonly-within:opacity-60 aria-readonly-within:cursor-not-allowed aria-readonly-within:*:pointer-events-none text-charcoal ';
  var BOX_OK = 'divide-manatee-diet border-manatee-diet hover:border-royal hover:divide-royal focus:border-royal focus:divide-royal focus:ring-royal focus-within:border-royal focus-within:divide-royal focus-within:ring-royal';
  var BOX_ERR = 'border-warning divide-warning hover:border-warning hover:divide-warning focus-within:border-warning focus-within:divide-warning focus-within:ring-warning';
  var INNER = 'appearance-none bg-transparent border-0 p-0 block w-full box-border leading-tight font-sans text-charcoal focus:outline-none focus-visible:outline-none disabled:opacity-50 disabled:active:border-b-2 read-only:cursor-not-allowed read-only:opacity-60 py-3 h-full ';
  // o: { type, bind, value, id, left, right, width ('w-max' | 'w-full' | 'w-[10rem]'), error, attrs, size: 8 }
  function input(o) {
    var props = {}, slots = []; if (o.left) slots.push('left'); if (o.right) slots.push('right');
    if (o.error) props.variant = 'error'; if (o.type && o.type !== 'text') props.type = o.type;
    var h = o.size === 8 ? 'h-10' : 'h-11';
    var inp = '<input type="' + (o.type || 'text') + '" class="' + INNER + (o.left ? 'px-3' : 'px-4') + (o.alignRight ? ' text-right' : '') + '"' + (o.id ? ' id="' + o.id + '"' : '') + (o.bind ? ' data-b="' + o.bind + '"' : '') + ' value="' + esc(o.value == null ? '' : o.value) + '"' + (o.attrs || '') + '>';
    return '<div ' + dc('Admin::Form::Input::FieldComponent', props, null, null, slots) + ' class="' + BOX + (o.error ? BOX_ERR : BOX_OK) + ' ' + (o.width || 'w-max') + ' ' + h + '">' +
      (o.left ? '<div class="flex-0 flex items-center rounded-l-lg h-full px-4 bg-grey-lighter text-charcoal flex items-center">' + o.left + '</div>' : '') +
      '<div class="flex-1 border-0 min-w-0 ' + (o.left ? 'rounded-r-lg' : o.right ? 'rounded-l-lg' : 'rounded-lg') + '">' + inp + '</div>' +
      (o.right ? '<div class="flex-0 flex items-center rounded-r-lg h-full px-4 bg-grey-lighter text-charcoal flex items-center">' + o.right + '</div>' : '') + '</div>';
  }
  var CHEVRON = '<div class="shrink-0 w-4 h-4 align-middle inline-block"><svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="block"><path d="M16 8L10 14L4 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>';
  // options: [[value, label]]
  function select(o) {
    return '<div ' + dc('Admin::Form::Input::SelectComponent') + ' class="' + BOX + BOX_OK + ' cursor-pointer outline-none relative text-sm font-medium items-center relative cursor-pointer leading-4 ' + (o.width || 'w-max') + ' ' + (o.size === 8 ? 'h-10' : 'h-11') + '"><div class="flex-1 border-0 min-w-0 p-0 p-0 rounded-lg"><select' + (o.id ? ' id="' + o.id + '"' : '') + (o.label ? ' aria-label="' + esc(o.label) + '"' : '') + (o.bind ? ' data-b="' + o.bind + '"' : '') + ' class="appearance-none bg-transparent border-none w-full border-box pl-4 pr-14 py-3 h-full cursor-pointer outline-none">' +
      o.options.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (String(x[0]) === String(o.value) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') +
      '</select></div><div class="flex-0 border-0 flex items-center rounded-r-lg h-full w-10 justify-center border-0 border-l border-solid absolute right-0 bottom-0 top-0 pointer-events-none">' + CHEVRON + '</div></div>';
  }
  var RADIO_IN = 'appearance-none rounded-full border border-solid w-4 h-4 shrink-0 bg-no-repeat bg-center cursor-pointer bg-white border-solid border-manatee-diet text-royal hover:border-royal checked:bg-royal checked:border-royal outline-none focus:ring-opacity-20 focus:ring-4 focus:ring-royal focus:border-royal disabled:opacity-50 disabled:border-manatee-diet disabled:pointer-events-none mt-[0.1em]';
  var RADIO_DOT = "background-image:url(&quot;data:image/svg+xml;charset=UTF-8,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle r='8' cx='10' cy='10' stroke='white' stroke-width='4' fill='none' /%3E%3C/svg%3E&quot;);background-size:cover";
  // One option of Admin::Form::Input::RadioButtonCollectionComponent. Wrap a set in radios().
  function radio(on, label, sub, o) {
    return '<label ' + dc('Admin::Form::Input::RadioButton::OptionComponent', { label: String(label).replace(/<[^>]*>/g, '') }, 'code') + ' class="block flex gap-x-3 group/radio-option items-start w-fit font-normal cursor-pointer"' + act(o) + '><input type="radio" name="' + (o && o.name || 'r') + '"' + (on ? ' checked' : '') + ' class="' + RADIO_IN + '" style="' + RADIO_DOT + '">' +
      '<div class="flex-1 flex flex-col gap-1"><div class="flex items-center gap-1"><span>' + label + '</span></div>' + (sub ? '<div class="leading-snug text-pretty text-sm text-charcoal-700">' + sub + '</div>' : '') + '</div></label>';
  }
  function radios(inner) { return '<div ' + dc('Admin::Form::Input::RadioButtonCollectionComponent') + ' class="space-y-4">' + inner + '</div>'; }
  var CHECK_IN = "appearance-none rounded border border-solid shrink-0 bg-no-repeat bg-center bg-[length:60%] cursor-pointer bg-white border-manatee-diet checked:bg-royal checked:border-royal hover:border-royal outline-none focus:ring-opacity-20 focus:ring-4 focus:ring-royal focus:border-royal disabled:opacity-50 disabled:hover:border-manatee-diet disabled:cursor-not-allowed w-4 h-4";
  function checkbox(on, o) { return '<input ' + dc('Admin::Form::Input::CheckboxComponent') + ' type="checkbox"' + (on ? ' checked' : '') + ' class="' + CHECK_IN + '" aria-label="' + esc(o && o.label || 'Select') + '">'; }
  // A checkbox with its label: Admin::Form::CheckboxInsideLabelComponent
  function checkRow(on, label, sub, o) {
    var panelV = o && o.panel;
    return '<label ' + dc('Admin::Form::CheckboxInsideLabelComponent', panelV ? { variant: 'panel' } : null, 'code') + ' class="flex gap-2.5 w-full cursor-pointer items-start' + (panelV ? ' p-4 border-manatee-polar border border-solid rounded-lg has-[:checked]:bg-royal-50 has-[:checked]:border-royal-400' : '') + '"' + act(o) + '>' + checkbox(on, { label: label }) + '<div class="space-y-2 grow"><div class="block font-medium leading-none">' + label + '</div>' + (sub ? '<div class="text-sm text-charcoal-700 leading-snug">' + sub + '</div>' : '') + '</div></label>';
  }

  // ---------- Admin::MetricComponent ----------
  function metric(label, value, sub, bar) {
    return '<div ' + dc('Admin::MetricComponent') + ' class="relative flex flex-col gap-1 pl-6 before:content-[\'\'] before:absolute before:top-0 before:left-0 before:w-1.5 before:h-full before:rounded-md before:bg-' + (bar || 'manatee-polar') + '"><div class="flex items-center space-x-1"><div class="font-medium leading-tight text-sm">' + label + '</div></div><div class="flex gap-2"><div class="font-medium leading-none whitespace-nowrap text-2xl">' + value + '</div></div>' + (sub ? '<div class="text-sm text-charcoal whitespace-normal">' + sub + '</div>' : '') + '</div>';
  }

  // ---------- Admin::DefinitionListComponent ----------
  function dl(pairs, inline) {
    return '<dl ' + dc('Admin::DefinitionListComponent', inline ? { variant: 'inline' } : { divided: false }) + ' class="m-0 grid grid-cols-1 @container/definition-list gap-4' + (inline ? ' divide-solid divide-x-0 divide-y divide-manatee-polar' : '') + '">' + pairs.map(function (p) {
      var item = dc('Admin::DefinitionListItemComponent', inline ? { variant: 'inline' } : null, 'code', null, ['title', 'body']);
      return inline ? '<div ' + item + ' class="flex flex-col gap-1 @md/definition-list:flex-row @md/definition-list:items-center @md/definition-list:justify-between pt-4 first:pt-0"><dt class="font-medium leading-snug">' + p[0] + '</dt><dd class="m-0 leading-snug @md/definition-list:text-right">' + p[1] + '</dd></div>'
        : '<div ' + item + ' class="flex flex-col gap-1 @md/definition-list:flex-row @md/definition-list:justify-between"><dt class="font-medium leading-snug @md/definition-list:basis-1/4 @md/definition-list:shrink-0">' + p[0] + '</dt><dd class="m-0 leading-snug @md/definition-list:basis-3/4">' + p[1] + '</dd></div>';
    }).join('') + '</dl>';
  }

  // ---------- Admin::Table::* ----------
  var TH = 'relative text-md font-medium border-0 border-b border-solid border-grey-light first:rounded-tl-lg last:rounded-tr-lg whitespace-nowrap p-3 bg-snowflake text-charcoal ';
  var TD = 'text-charcoal text-md border-0 border-b border-solid border-grey-light p-3 ';
  // cols: [label | {label, right}]; rows: array of tr strings. o: { border: true (default), cls }
  function table(cols, rows, o) {
    o = o || {}; var border = o.border !== false;
    return '<div class="overflow-x-auto max-w-full"><div ' + dc('Admin::Table::BuilderComponent', border ? { table_variant: 'border' } : null) + ' class="min-w-min"><table class="min-w-full border-separate' + (border ? ' border border-solid border-grey-light rounded-lg shadow print:shadow-transparent print:border-0 bg-white' : '') + '" style="border-spacing:0"><thead class="top-0"><tr>' +
      cols.map(function (c) { c = typeof c === 'string' ? { label: c } : c; return '<th ' + dc('Admin::Table::HeaderComponent', null, 'code') + ' class="' + TH + (c.right ? 'text-right' : 'text-left') + '">' + c.label + '</th>'; }).join('') + '</tr></thead><tbody>' + rows.join('') + '</tbody></table></div></div>';
  }
  function td(html, o) { o = o || {}; return '<td ' + dc('Admin::Table::DataComponent', null, 'code') + ' class="' + TD + (o.right ? 'text-right' : 'text-left') + (o.dim ? ' text-charcoal-700' : '') + (o.cls ? ' ' + o.cls : '') + '"' + (o.colspan ? ' colspan="' + o.colspan + '"' : '') + '>' + html + '</td>'; }
  // Admin::Table::RowComponent: color butterscotch highlights a row
  function tr(cells, o) { o = o || {}; return '<tr' + (o.color === 'butterscotch' ? ' ' + dc('Admin::Table::RowComponent', { color: 'butterscotch' }) + ' class="bg-butterscotch-100 border-0 border-solid border-l-4 border-l-butterscotch"' : o.attrs ? ' ' + o.attrs : '') + '>' + cells.join('') + '</tr>'; }

  // ---------- Admin::Modal::Component ----------
  var CLOSE = '<div class="shrink-0 w-4 h-4 align-middle inline-block"><svg width="100%" height="100%" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" class="block"><path d="M16 4L9.99999 10M9.99999 10L16 16M9.99999 10L4 4M9.99999 10L4 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>';
  // Side modal: the primary action lives in the title bar.
  function sideModal(title, actions, body, o) {
    o = o || {};
    return '<div class="fixed inset-0 z-40 flex justify-end bg-charcoal-dark/50" data-a="close" data-scrim="1"><div ' + dc('Admin::Modal::Component', { variant: 'right', width: o.width || 'narrow' }) + ' role="dialog" aria-modal="true" class="bg-white border-white shadow-2xl flex flex-col max-h-full relative text-charcoal w-full h-full ' + (o.width === 'medium' ? 'max-w-xl' : o.width === 'wide' ? 'max-w-screen-sm' : 'max-w-[29rem]') + '">' +
      '<div class="px-6 py-4 border-0 border-b border-solid border-grey-light"><div class="flex items-center gap-4 flex-wrap"><div class="grow min-w-0"><h3 class="flex m-0 text-lg font-medium leading-normal items-center text-charcoal">' + title + '</h3></div><div class="flex gap-2 flex-wrap">' + actions + '</div></div></div>' +
      '<div class="flex-1 overflow-auto">' + (o.fluid ? '<div class="leading-normal min-h-fit pb-6">' : '<div class="space-y-6 leading-normal h-full p-6">') + body + '</div></div></div></div>';
  }
  // Centred modal. Widths from Admin::Modal::DialogComponent: narrow 464, medium 576, wide 640, large 800, extra_large 960.
  var MW = { narrow: 'max-w-[29rem]', medium: 'max-w-xl', wide: 'max-w-screen-sm', large: 'max-w-[50rem]', extra_large: 'max-w-[60rem]' };
  function modal(title, body, foot, o) {
    o = o || {}; var w = o.width || 'wide';
    return '<div class="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto bg-charcoal-dark/50 p-6"><div ' + dc('Admin::Modal::Component', { width: w, show_close: true }) + ' role="dialog" aria-modal="true" class="bg-white border-white shadow-2xl flex flex-col relative text-charcoal w-full rounded-xl ' + MW[w] + '">' +
      '<div class="px-6 py-4 border-0 border-b border-solid border-grey-light"><div class="flex items-start gap-4"><div class="grow min-w-0 flex flex-col gap-2"><h3 class="flex m-0 text-lg font-medium leading-normal items-center text-charcoal">' + title + '</h3>' + (o.sub || '') + '</div>' +
      '<button type="button" data-a="' + (o.closeA || 'close') + '" aria-label="Close" class="appearance-none p-0 bg-transparent border border-solid border-transparent hover:text-royal hover:border-royal focus:text-royal focus:ring-opacity-20 focus:ring-4 focus:ring-royal focus:border-royal rounded-full w-6 h-6 flex-row items-center flex justify-center cursor-pointer">' + CLOSE + '</button></div></div>' +
      '<div class="flex-1 overflow-auto"><div class="space-y-4 leading-normal h-full p-6">' + body + '</div></div>' + (foot ? '<div ' + dc('Admin::Modal::Component::Footer', { styles: ['justify-end', 'items-center'] }) + ' class="flex gap-x-2 border-0 border-t border-solid border-grey-light px-6 py-4 justify-end items-center flex-wrap">' + foot + '</div>' : '') + '</div></div>';
  }

  // ---------- FlashComponent ----------
  function toast(msg) {
    return '<div ' + dc('FlashComponent', { type: 'notice' }) + ' role="alert" class="w-full max-w-2xl flex justify-center text-base text-white leading-snug p-4 space-x-4 rounded-md shadow-action bg-emerald"><span>' + esc(msg) + '</span><button type="button" data-a="toastHide" aria-label="Dismiss" class="appearance-none bg-transparent text-current border border-solid border-transparent cursor-pointer -mt-1">' + CLOSE + '</button></div>';
  }

  // ---------- Admin::BreadcrumbHeaderComponent ----------
  // trail: [[label, action, value]], last: the current page
  function breadcrumbs(trail, last) {
    return '<div ' + dc('Admin::BreadcrumbHeaderComponent') + ' class="flex flex-nowrap items-center gap-x-2 min-w-0 font-medium text-xl text-manatee-diet">' + trail.map(function (t) {
      return '<a data-a="' + t[1] + '"' + (t[2] != null ? ' data-v="' + esc(t[2]) + '"' : '') + ' class="hover:no-underline block shrink-0 whitespace-nowrap text-manatee-diet hover:text-charcoal active:text-royal text-lg lg:text-xl font-medium cursor-pointer">' + t[0] + '</a><div class="shrink-0">/</div>';
    }).join('') + '<h1 class="m-0 flex-1 min-w-0 text-charcoal text-lg lg:text-xl font-medium"><div class="truncate">' + last + '</div></h1></div>';
  }

  // ---------- Admin::AvatarComponent ----------
  var AV = ['bg-aqua', 'bg-butterscotch', 'bg-cornflower', 'bg-emerald', 'bg-magenta'];
  function avatar(name) {
    var ini = name.split(' ').filter(function (w) { return /^[A-Za-z]/.test(w); }).slice(0, 2).map(function (w) { return w[0]; });
    var idx = ini.reduce(function (n, c) { return n + ('abcdefghijklmnopqrstuvwxyz'.indexOf(c.toLowerCase()) + 1); }, 0);
    return '<div ' + dc('Admin::AvatarComponent', { full_name: name, size: 12 }) + ' class="w-12 h-12 rounded-full flex items-center justify-center text-white font-medium overflow-hidden shrink-0 border border-solid border-white text-xl ' + AV[idx % 5] + '">' + ini.join('').toUpperCase() + '</div>';
  }

  return { esc: esc, dc: dc, proposed: proposed, act: act, button: button, link: link, aLink: aLink, tag: tag, panel: panel, callout: callout, heading: heading, hint: hint, error: error, field: field, input: input, select: select, radio: radio, radios: radios, checkbox: checkbox, checkRow: checkRow, metric: metric, dl: dl, table: table, td: td, tr: tr, sideModal: sideModal, modal: modal, toast: toast, breadcrumbs: breadcrumbs, avatar: avatar, CLOSE: CLOSE, CHEVRON: CHEVRON };
})();
