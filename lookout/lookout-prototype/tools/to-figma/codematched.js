// How each ViewComponent becomes an instance of its code-matched component in the 03 Components library.
// build.js loads this alongside library/components.json (the library's components, read by read-library).
//
// A rule says which library component to use and how to set its properties from the prototype:
//   use       library component name (and optional page), or a function of (props, n) returning one
//   variants  { FigmaProp: function (props, n, h) → value }   only values the component has are applied
//   text      { FigmaTextProp: function (props, n, h) → string }
//   bools     { FigmaBoolProp: function (props, n, h) → true/false }
//   swap      { FigmaInstanceSwapProp: function (props, n, h) → icon name }
//   slot      FigmaSlotProp: the prototype's content is built into it
//   when      function (props, n, h) → false to fall back to drawing
// h holds helpers: text(n), firstText(n), find(n, test), has(n, component), icon(n), input(n).
var CODE_MATCHED = (function () {
  const v = (k, d) => (p) => (p[k] != null ? String(p[k]) : d);
  const capSide = (n) => { let sl = []; try { sl = JSON.parse(n.slots || '[]'); } catch (e) {} return sl.includes('left') ? 'left' : sl.includes('right') ? 'right' : null; };
  const plainCell = (n) => !!n.text && !n.children;
  const simple = (n, h) => !h.find(n, (x) => x !== n && (x.component || x.svg || x.input));
  return {
    'Admin::ButtonComponent': {
      use: 'Buttons', page: 'Buttons (code-matched)', variants: { Type: v('variant', 'secondary'), Size: v('size', '10'), State: (p) => (p.disabled ? 'disabled' : 'default') },
      text: { Text: (p, n, h) => h.text(n) }, bools: { 'Has text': (p, n, h) => !!h.text(n), 'Show icon': (p, n, h) => !!h.icon(n) }, swap: { Icon: (p, n, h) => h.icon(n) }
    },
    'Admin::IconButtonComponent': {
      use: 'Buttons', page: 'Buttons (code-matched)', variants: { Type: v('variant', 'secondary'), Size: v('size', '10') },
      text: { Text: (p, n, h) => h.text(n) }, bools: { 'Has text': (p, n, h) => !!h.text(n), 'Show icon': () => true }, swap: { Icon: (p, n, h) => h.icon(n) || (p.icon && (p.icon.name || p.icon)) }
    },
    'Admin::HeadingComponent': { use: 'Heading', page: 'Typography (code-matched)', variants: { Level: v('level', '3') }, text: { Text: (p, n, h) => h.text(n) }, when: (p, n, h) => simple(n, h) },
    'Admin::TagComponent': { use: 'Tags', page: 'Tags (code-matched)', variants: { Colour: v('color', 'charcoal') }, text: { Text: (p, n, h) => h.text(n) }, bools: { 'Show icon': (p, n, h) => !!h.icon(n) }, swap: { Icon: (p, n, h) => h.icon(n) } },
    'Admin::Form::Input::FieldComponent': {
      use: (p, n) => (capSide(n) ? 'Input group' : 'Input'), page: 'Forms (code-matched)',
      variants: { Content: (p, n, h) => (h.input(n).value ? 'value' : 'placeholder'), State: (p, n, h) => (h.input(n).error ? 'error' : 'default'), Side: (p, n) => capSide(n) || 'left', Type: () => 'text' },
      text: { Text: (p, n, h) => h.input(n).value || h.input(n).placeholder || '' },
      after: async (i, p, n, h) => { if (!capSide(n)) return; const cap = h.texts(n).filter((t) => t !== h.input(n).value)[0]; if (cap) await h.setText(i.findOne((x) => x.type === 'TEXT' && x.name === 'Cap text'), cap); }
    },
    'Admin::EmptyPanelComponent': {
      use: 'Empty state', page: 'Empty states',
      text: { Title: (p, n, h) => h.texts(n)[0] || '', Subtitle: (p, n, h) => h.texts(n).slice(1).filter((t) => { const b = h.find(n, (x) => x.component === 'Admin::ButtonComponent'); return !b || t !== h.text(b); })[0] || '' },
      bools: { 'Show subtitle': (p, n, h) => h.texts(n).length > 1, 'Show button': (p, n, h) => !!h.find(n, (x) => x.component === 'Admin::ButtonComponent'), 'Show image': () => true },
      after: async (i, p, n, h) => h.relabelButton(i, n)
    },
    'Admin::Form::LabelComponent': { use: 'Label', page: 'Forms (code-matched)', text: { Text: (p, n, h) => h.text(n).replace(/\s*Optional$/, '') }, bools: { Required: (p) => !!p.required }, when: (p, n, h) => simple(n, h) },
    'Admin::Form::HintComponent': { use: 'Hint', page: 'Forms (code-matched)', variants: { State: () => 'default' }, text: { Text: (p, n, h) => h.text(n) }, when: (p, n, h) => simple(n, h) },
    'Admin::Form::ErrorComponent': { use: 'Hint', page: 'Forms (code-matched)', variants: { State: () => 'error' }, text: { Text: (p, n, h) => h.text(n) }, when: (p, n, h) => simple(n, h) },
    'Admin::Form::Input::SelectComponent': { use: 'Select', page: 'Forms (code-matched)', variants: { State: (p, n, h) => (h.input(n).error ? 'error' : 'default') }, text: { Text: (p, n, h) => h.input(n).value || '' } },
    'Admin::Form::Input::TextAreaComponent': { use: 'Textarea', page: 'Forms (code-matched)', variants: { State: () => 'default' }, text: { Text: (p, n, h) => h.input(n).value || h.input(n).placeholder || '' } },
    'Admin::Form::Input::CheckboxComponent': { use: 'Checkbox', page: 'Forms (code-matched)', variants: { State: (p, n, h) => (h.input(n).checked ? 'checked' : 'default') } },
    'Admin::Form::Input::RadioButtonComponent': { use: 'Radio', page: 'Forms (code-matched)', variants: { State: (p, n, h) => (h.input(n).checked ? 'checked' : 'default') } },
    'Admin::Form::Input::CheckboxToggleComponent': { use: 'Toggle', page: 'Forms (code-matched)', variants: { State: (p, n, h) => (h.input(n).checked ? 'checked' : 'unchecked') } },
    'Admin::Form::CheckboxInsideLabelComponent': {
      use: 'Checkbox row', page: 'Forms (code-matched)', variants: { Checked: (p, n, h) => String(!!h.input(n).checked) },
      text: { Label: (p, n, h) => h.firstText(n), Description: (p, n, h) => h.texts(n).slice(1).join(' ') }, bools: { 'Show description': (p, n, h) => h.texts(n).length > 1 }
    },
    'Admin::Form::Input::RadioButton::OptionComponent': { use: 'Radio option', page: 'Forms (code-matched)', variants: { Selected: (p, n, h) => String(!!h.input(n).checked) }, text: { Label: (p, n, h) => h.texts(n)[0] || '' },
      // The component has a fixed supporting text line: give it the hint, or hide it.
      after: async (i, p, n, h) => { const hint = h.texts(n).slice(1).join(' '); const t = i.findAll((x) => x.type === 'TEXT').filter((x) => x.characters !== (h.texts(n)[0] || '')); for (const x of t) { if (hint) await h.setText(x, hint); else x.visible = false; } } },
    'Admin::CalloutComponent': { use: 'Callout', variants: { Type: v('variant', 'info') }, text: { Message: (p, n, h) => h.text(n) }, when: (p, n, h) => simple(n, h) },
    'FlashComponent': { use: 'Toast', variants: { Type: v('type', 'notice') }, text: { Message: (p, n, h) => h.text(n) } },
    'Admin::PanelComponent': { use: 'Panel', page: 'Panels (code-matched)', variants: { Variant: v('variant', 'default'), Size: v('size', '16') }, text: { Content: (p, n, h) => h.text(n) }, when: (p, n, h) => simple(n, h) },
    'Admin::MetricComponent': { use: 'Metric', variants: { Variant: v('variant', 'manatee') }, text: { Label: (p, n, h) => h.texts(n)[0] || '', Amount: (p, n, h) => h.texts(n)[1] || '' }, bools: { 'Show percentage': () => false } },
    'Admin::DefinitionListItemComponent': { use: 'Definition list item', variants: { Variant: (p, n) => { const d = p.variant || 'default', k = n.children || []; return d === 'default' && k.length === 2 && k[1].x >= k[0].x + k[0].w - 1 ? 'inline_left' : d; } }, text: { Title: (p, n, h) => h.texts(n)[0] || '', Body: (p, n, h) => h.texts(n).slice(1).join(' ') }, when: (p, n, h) => simple(n, h) },
    'Admin::Popover::ItemComponent': { use: 'Popover item', variants: { Variant: (p) => (p.variant === 'destructive' ? 'destructive' : 'default') }, text: { Label: (p, n, h) => h.text(n) }, bools: { 'Show icon': (p, n, h) => !!h.icon(n) } },
    'Admin::Table::HeaderComponent': { use: 'Table heading', variants: { Padding: (p, n) => String(Math.round((n.pad ? n.pad[0] : 12) / 4)) }, text: { Text: (p, n, h) => h.text(n) }, when: (p, n, h) => simple(n, h) },
    'Admin::Table::DataComponent': {
      // Only plain text goes in the Text property; links, tags, icons or anything styled go in the Content slot.
      use: 'Table cell', variants: { Padding: (p, n) => String(Math.round((n.pad ? n.pad[0] : 12) / 4)) }, text: { Text: (p, n) => (plainCell(n) ? n.text : '') },
      bools: { 'Show text': (p, n) => plainCell(n), 'Show content': (p, n) => !plainCell(n) }, slot: (p, n) => (plainCell(n) ? null : 'Content')
    },
    'Admin::MultiActionMenuComponent': { use: 'Multi action menu', variants: { Type: (p, n, h) => (h.text(n) ? 'label' : 'icon'), State: () => 'closed' } },
    'Admin::AvatarComponent': { use: 'Avatar', variants: { Size: v('size', '8'), Colour: (p) => p.color || 'magenta' }, text: { Initials: (p, n, h) => h.text(n) } },
    'Admin::FloatingActionBarComponent': { use: 'Floating action bar', text: { Label: (p, n, h) => h.firstText(n) }, when: (p, n, h) => simple(n, h) },
    'Admin::Modal::Component': {
      use: (p) => (p.variant === 'right' ? 'Side modal' : 'Modal'), page: 'Modal (from code — test)',
      text: { Title: (p, n, h) => h.modalTitle(n) }, bools: { 'Show close': () => true, 'Show footer': (p, n, h) => !!h.find(n, (x) => x.component === 'Admin::Modal::Component::Footer'), 'Show header': () => true, 'Show action': () => false },
      slot: () => 'Body', modal: true
    }
  };
})();
