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
  const capSide = (n) => { let sl = []; try { sl = JSON.parse(n.slots || '[]'); } catch (e) {} if (sl.includes('left')) return 'left'; if (sl.includes('right')) return 'right';
    // Older prototypes record a cap in data-props (left: '$') where the kit uses data-slots.
    let pr = {}; try { pr = JSON.parse(n.props || '{}'); } catch (e) {} return pr.left ? 'left' : pr.right ? 'right' : null; };
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
    'Admin::CalloutComponent': { use: 'Callout', variants: { Type: v('variant', 'info') }, text: { Message: (p, n, h) => h.texts(n).join('\n') }, when: (p, n, h) => simple(n, h) },
    'FlashComponent': { use: 'Toast', variants: { Type: v('type', 'notice') }, text: { Message: (p, n, h) => h.text(n) } },
    'Admin::PanelComponent': { use: 'Panel', page: 'Panels (code-matched)', variants: { Variant: v('variant', 'default'), Size: v('size', '16') }, text: { Content: (p, n, h) => h.text(n) }, when: (p, n, h) => simple(n, h) },
    'Admin::MetricComponent': { use: 'Metric', variants: { Variant: v('variant', 'manatee') }, text: { Label: (p, n, h) => h.texts(n)[0] || '', Amount: (p, n, h) => h.texts(n)[1] || '' }, bools: { 'Show percentage': () => false }, when: (p, n, h) => h.texts(n).length <= 2 },
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
    // The library's Breadcrumb header, Radio group, Definition list and Form group are fixed layouts of up to three
    // items with no slot. Each is used only when the prototype's content fits; anything bigger or richer is drawn.
    'Admin::BreadcrumbHeaderComponent': {
      use: 'Breadcrumb header', page: 'Breadcrumbs',
      when: (p, n, h) => { const c = h.texts(n).filter((t) => t.trim() !== '/'); return c.length >= 1 && c.length <= 3 && simple(n, h); },
      after: async (i, p, n, h) => {
        const crumbs = h.texts(n).filter((t) => t.trim() !== '/');
        const items = i.children.filter((x) => x.type === 'INSTANCE'), seps = i.children.filter((x) => x.type === 'TEXT');
        items.forEach((it, idx) => { if (idx >= crumbs.length) { it.visible = false; return; } const lk = Object.keys(it.componentProperties).find((k) => k.startsWith('Label')); it.setProperties({ [lk]: crumbs[idx], State: idx === crumbs.length - 1 ? 'current' : 'default' }); });
        seps.forEach((s, idx) => { s.visible = idx < crumbs.length - 1; });
      }
    },
    'Admin::Form::Input::RadioButtonCollectionComponent': {
      use: 'Radio group', page: 'Forms (code-matched)',
      when: (p, n, h) => { const o = n.children || []; return o.length >= 1 && o.length <= 3 && o.every((k) => h.find(k, (x) => x.input && x.input.type === 'radio') && !h.find(k, (x) => x.component || x.svg || (x.input && x.input.type !== 'radio')) && h.texts(k).length >= 1 && h.texts(k).length <= 2); },
      after: async (i, p, n, h) => {
        const opts = n.children || [], insts = i.children.filter((x) => x.type === 'INSTANCE');
        for (let idx = 0; idx < insts.length; idx++) {
          const it = insts[idx], o = opts[idx]; if (!o) { it.visible = false; continue; }
          const t = h.texts(o), lk = Object.keys(it.componentProperties).find((k) => k.startsWith('Label'));
          it.setProperties({ [lk]: t[0], Selected: String(!!h.find(o, (x) => x.input).input.checked) });
          const d = it.findOne((x) => x.type === 'TEXT' && x.name === 'Description'); if (d) { if (t[1]) await h.setText(d, t[1]); else d.visible = false; }
          try { it.layoutSizingHorizontal = 'FILL'; } catch (e) {}
        }
      }
    },
    'Admin::DefinitionListComponent': {
      use: 'Definition list', page: 'Definition lists',
      when: (p, n, h) => { const o = n.children || []; return o.length >= 1 && o.length <= 3 && simple(n, h) && o.every((k) => h.texts(k).length === 2); },
      after: async (i, p, n, h) => {
        const rows = n.children || [], items = i.children.filter((x) => x.type === 'INSTANCE'), lines = i.children.filter((x) => x.type !== 'INSTANCE');
        const inline = p.item_variant === 'inline';
        items.forEach((it, idx) => { const r = rows[idx]; if (!r) { it.visible = false; return; } const t = h.texts(r), ks = Object.keys(it.componentProperties); it.setProperties({ [ks.find((k) => k.startsWith('Title'))]: t[0], [ks.find((k) => k.startsWith('Body'))]: t[1], Variant: inline ? 'inline' : 'default' }); try { it.layoutSizingHorizontal = 'FILL'; } catch (e) {} });
        lines.forEach((l, idx) => { l.visible = inline && idx < rows.length - 1; });
      }
    },
    'Admin::Form::ControlComponent': {
      use: 'Form group', page: 'Forms (code-matched)',
      variants: { Layout: v('layout', 'vertical'), State: (p, n, h) => (h.find(n, (x) => x.component === 'Admin::Form::ErrorComponent') ? 'error' : 'default') },
      // Only a label over one plain text field, with a hint at most: the component's own field can't become a select, a date or a field with a cap.
      when: (p, n, h) => {
        const kids = n.children || []; if (!kids.length || !kids[0].text) return false;
        const fields = []; (function w(x) { if (x.input) fields.push(x); (x.children || []).forEach(w); })(n);
        if (fields.length !== 1 || fields[0].input.type !== 'text') return false;
        const field = h.find(n, (x) => x.component === 'Admin::Form::Input::FieldComponent'); if (!field || capSide(field)) return false;
        return !h.find(n, (x) => x !== n && x.component && !['Admin::Form::Input::FieldComponent', 'Admin::Form::HintComponent'].includes(x.component)) && !h.find(n, (x) => x.svg);
      },
      after: async (i, p, n, h) => {
        const set = (inst, vals) => { const ks = Object.keys(inst.componentProperties), out = {}; for (const [k, val] of Object.entries(vals)) { const key = ks.find((x) => x === k || x.startsWith(k + '#')); if (key) out[key] = val; } inst.setProperties(out); };
        const label = i.findOne((x) => x.type === 'INSTANCE' && x.name === 'Label'), field = i.findOne((x) => x.type === 'INSTANCE' && x.name === 'Input'), hint = i.findOne((x) => x.type === 'INSTANCE' && x.name === 'Hint');
        const inp = h.input(n), hintNode = h.find(n, (x) => x.component === 'Admin::Form::HintComponent');
        if (label) set(label, { Text: n.children[0].text, Required: false });
        if (field) { set(field, { Text: inp.value || inp.placeholder || '', Content: inp.value ? 'value' : 'placeholder' }); try { field.layoutSizingHorizontal = 'FILL'; } catch (e) {} }
        if (hint) { if (hintNode) set(hint, { Text: h.text(hintNode) }); else hint.visible = false; }
      }
    },
    'Admin::Modal::Component': {
      use: (p) => (p.variant === 'right' ? 'Side modal' : 'Modal'), page: 'Modal (from code — test)',
      text: { Title: (p, n, h) => h.modalTitle(n) }, bools: { 'Show close': () => true, 'Show footer': (p, n, h) => !!h.find(n, (x) => x.component === 'Admin::Modal::Component::Footer'), 'Show header': () => true, 'Show action': () => false },
      slot: () => 'Body', modal: true
    }
  };
})();
