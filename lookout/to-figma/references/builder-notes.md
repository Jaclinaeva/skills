# Builder notes

What the first full run (32 screens, two prototypes) found in the kit's
capture and builder, so the same faults are recognised quickly. Fixed means
fixed in `../lookout-prototype/tools/to-figma/`.

## Fixed

- **Side panels built on the left.** Chrome reports `justify-end` as
  `flow-end`, which the builder didn't know.
- **Pages cut off at the window's height.** The capture now re-reads a screen
  in a window tall enough for the page, or for a side panel that scrolls to
  the window's bottom. With a modal or side panel open, the screen stays the
  window's size: the page behind isn't extended.
- **A centred modal taller than the window lost its top.** Now measured and
  the window grown to fit it.
- **Lists that scroll inside a modal spilled out.** They're clipped as drawn.
- **Icons dropped** when they sat inside an inline wrapper with no text.
- **Content inside a `display: contents` wrapper dropped**, such as a tag in
  a service badge.
- **Date fields** showed 2026-12-01 or nothing. They now show 01/12/2026, or
  dd/mm/yyyy when empty.
- **Coloured `::before` bars**, such as a drawn metric's, weren't drawn.
- **Input caps (the "$")** were missed on older prototypes, which record them
  in `data-props` where the kit uses `data-slots`.
- **Metric colour** wasn't in the marker. `UI.metric` now records `variant`.
- **Callout title and text** ran together. They're on separate lines.
- **Side panel title bars** with two actions were doubled, because the
  library's Side modal header holds a title and one action. The prototype's
  title bar is kept and the component's header hidden, and the build reports
  it.

## Mapped only when the content fits

These library components are fixed layouts of up to three items with no slot,
so the builder uses them only when a screen fits and draws the rest:

- **Breadcrumb header:** up to three crumbs
- **Radio group:** up to three options, each a label with at most one line
  under it
- **Definition list:** up to three plain title and body rows
- **Form group:** a label over one plain text field, with a hint at most. A
  select, a date, a textarea or a field with a cap is drawn, with its inner
  field still a library instance

## Known, not fixed

- **Library gaps**, each a candidate for 03 Components:
  - Side modal needs room for two header actions, or an actions slot
  - Metric has no line under the amount, so a metric with one is drawn
  - Table row is three fixed text cells: it needs a slot for its cells
    before any real row can use it
  - Breadcrumb header, Radio group, Definition list and Form group need a
    slot, or a way to add items, to cover every case
  - no library match yet for the nav, page header, breadcrumbs, tabs, table
    builder and row actions, banner, form control wrapper, radio group
  - no `Vendor::` components at all
- **Drawn nav:** section chevrons sit beside their label, not at the row's
  end, and "Ask me anything" can overlap its icon.
- **Date fields with a calendar cap** get a "$" cap.
- **Images** inside avatars come through as plain colour.
- **Some table links** are drawn in body colour.
