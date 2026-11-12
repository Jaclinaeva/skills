# Converting a wireframe to a prototype

A wireframe built with `WF` blocks already says what each piece is for
(`data-wf`), so converting it is mapping by intent, not guessing from looks.
This follows vibe-killer's method (map by intent, never invent a component,
mark gaps as proposed, prove it with the drift check) without its forensics
step, which the markers make unnecessary.

## Steps

1. **Copy, don't overwrite.** Make a new folder for the prototype. The
   wireframe stays as it is, so the two can be compared.
2. **Map every block** with the table below. Read the kit function before
   using it. Where the table gives a choice, pick by what the block is doing
   on that screen, and list the choice in the receipt.
3. **Keep the content.** Copy every word, label, state id, state, guide step
   and story across unchanged. Fix only what breaks the writing guide, and
   list each fix.
4. **Fill placeholders honestly.** `WF.lines` becomes real content: ask the
   designer, or use `Sample` data and say so. `WF.box` is something nobody
   has worked out: ask what it is. If it stays unknown, mark it
   `UI.proposed(Name, note)`, never a drawn guess.
5. **Rebuild and run the drift check.** It must pass, as for any prototype.
6. **Write the receipt:** every mapping choice, every placeholder filled,
   every gap proposed, and anything the wireframe implied that the system
   can't do. Then screenshot each state beside the wireframe's.

## Mapping

| `data-wf` | Admin | Supplier portal |
|---|---|---|
| `shell` | `Proto.shell`, `nav: { active: here }` | `VP.shell(content, { active: here })`: `Vendor::Layout::Component` |
| `page-header` | `T2.pageHeader(title, sub, actions)` | Followed by `tabs`: the heading of `VP.tabbedPage`. Its `sub` and `actions` go at the top of the body, since the component has no slot for them |
| `tabs` | `T2.tabs` | `Vendor::FilterLinkComponent`s in `VP.tabbedPage` |
| `heading` | `UI.heading(text, level)` | same |
| `text` | A paragraph, `<p class="m-0">` | same |
| `button` | `UI.button` with the same variant; `destructive` stays `destructive` | same |
| `link` | `UI.link` | same |
| `row-menu` | `UI.rowActions` with the listed items, an icon for each, destructive ones marked | same |
| `table` | `UI.table`, `UI.tr`, `UI.td`. A flagged row: `tr` with `color: 'butterscotch'` | flagged rows via `VP.tr` |
| `panel` | `UI.panel`; its title is `UI.heading(…, 3)` | same |
| `details` | `UI.dl` | same |
| `stat` | `UI.metric` | same |
| `tag` | `UI.tag`. Dashed (pending): `butterscotch` | same |
| `callout` info | `UI.callout(…, 'info')` | same |
| `callout` warning with actions | `T2.bannerWithActions(title, text, actions, 'butterscotch')` | same |
| `callout` warning without actions | `UI.callout(…, 'alert')` | same |
| `callout` error | `UI.callout(…, 'warning')` (Lookout's warning colour is its error colour) | same |
| `callout` success | `UI.callout(…, 'ok')` | same |
| `empty` | `Admin::EmptyPanelComponent` | `VP.emptyPanel` |
| `field` text, number | `UI.field(label, UI.input(…), { hint, error, optional })` | same |
| `field` money | `UI.input` with `left: '$'` | same |
| `field` date | `Admin::Form::Input::DateComponent` | `VP.dateInput` |
| `field` select, textarea | `UI.select`, `Admin::Form::Input::TextAreaComponent` | same, `VP.textarea` |
| `choice`, `choices` | `UI.checkbox`, `UI.checkRow`, `UI.radios` | same |
| `modal` | `UI.modal(title, body, footer)` | `VP.modal` |
| `modal` side | `UI.sideModal(title, actions, body)`: actions in the title bar, not a footer | same |
| `toast` | `UI.toast` | same |
| `placeholder-text` | Real content (step 4) | same |
| `placeholder` | Ask, or `UI.proposed` (step 4) | same |
| `divider` | Spacing between sections, not a rule | same |

The supplier portal's pieces (`VP`) are in the kit (`kit/lib/portal.js`).
