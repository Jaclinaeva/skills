---
system: Lookout admin (app/mounts/admin)
version: "Lookout main, as in the shipped catalog (catalog/catalog.json, its 'generated' line)"
naming: rails-viewcomponent      # Ruby classes rendering Tailwind-classed HTML
tag_style: "Admin::ButtonComponent.new(variant: :primary)"
token_prefix: "Tailwind theme names (bg-royal, text-charcoal, p-6) — no CSS custom properties"
catalog_source: "lookout-prototype/catalog/catalog.json (shipped with the skill); then reads in the user's Lookout checkout, default ~/lookout/app/mounts/admin/components/admin/"
catalog_rung: manifest         # the generated catalog, then the component source for anything it can't answer
runtime_tested: stand-in       # stand-in rendered in headless Chrome 2026-11-11; real app never tested (§2)
verified_on: 2026-11-11
---

# Lookout admin — vibe-killer profile

Lookout's admin app is a Rails app. Its UI is Ruby ViewComponents
(`Admin::*Component`) that render HTML styled with Tailwind 3.4 utility classes,
generated from a custom theme (`tailwind.config.js`). The theme **replaces**
Tailwind's colours, font families, box shadows and drop shadows, so only names
in Lookout's palette produce CSS (`text-gray-500` produces nothing). Tokens are
Tailwind class names, not CSS custom properties. The Lighthouse mount is out of
scope throughout.

Before you convert anything, know that the components can't run outside Rails. A plain HTML page can only
reproduce **the HTML a component would render**. That makes every converted
page a transcription, and the class lists are the contract.

---

## 1. Catalog access

**First rung:** the catalog that ships with the skill,
`lookout-prototype/catalog/catalog.json`, generated from Lookout's component
source on `main`. It answers which components exist, their arguments,
required arguments, slots and tier. Never edit it; one person regenerates it
from `main` when components change.

**Second rung, read on demand:** the component source in the user's own
Lookout checkout, by default `~/lookout/app/mounts/admin/components/admin/`.
Ask where it is if that path doesn't exist. Read it for what the catalog
can't answer (class lists, markup, which variant does what). Before relying on
it, check it's on `main` and up to date (`git -C ~/lookout status`); if it's
on a feature branch, say so and ask, because that branch's components may not
be on `main`. Read only: never change the checkout, and never read files its
`.gitignore` lists.

Authority order inside the source: component `.rb`/`.html.erb`/`.yml` →
Lookbook preview → READMEs → call sites.

**Proof:** the catalog's `Admin::ButtonComponent` and `button_component.rb`:
`variant:` allows `:primary, :secondary, :tertiary, :tertiary_warning,
:secondary_borderless, :destructive, :destructive_borderless, :error,
:destructive_alarm`; default `:secondary`; no slots, block is the label.
Cross-checked against `button_component.rb` and `interactive_box/*.rb`: matches.

**Membership authority:** Jac's Lookout Design System artifact,
https://claude.ai/artifact/T7Yug6WwVXmZyrEYu4rfcy (46 components since
2026-11-05). Read it with the Artifact tool's `read` action; if it can't be
read, use `lookout-prototype/catalog/ds-components.txt`, which mirrors it.
The catalog and the source say a component exists; only this artifact says
it's in the design system. A prototype's own in-system list (e.g. `IN_DS`) mirrors it: if
the two disagree, report it and ask; never edit either.

Tags used here:
- `[verified: spec]`: read in Jac's component specs when this profile was written (11 Nov 2026); re-check in the source if it matters
- `[verified: source]`: read in Lookout's component source
- `[untested]`: never rendered inside the real app

---

## 2. Runtime (how a page loads this system)

### The real app [verified: source, not reproduced]

`app/mounts/admin/views/admin/_layout.html.erb` loads `javascript_include_tag("admin")`
and `stylesheet_link_tag("admin")`. The stylesheet is built from:

- `frontend/src/admin/stylesheets/tailwind.css`: `@tailwind base/components/utilities`
  plus a few helper classes (`content-visibility-*`)
- `bootstrap.scss`: Bootstrap 3 normalize, modals, close, navs
- `elements.scss`: the base layer (box-sizing, `body`, `a`, `h1–h4`)
- ~30 legacy SCSS component files

Body classes: `h-full flex flex-col antialiased font-sans text-charcoal dark:invert dark:hue-rotate-180 dark:mix-blend-screen`.
Behaviour comes from Stimulus controllers (`admin--modal--modal`,
`admin--with-tooltip`, `flash`, `admin--form--input--select`…).

### Stand-in runtime for standalone pages `[untested]` against the real app

Defined by the user on 2026-11-11 for this test. **Not the real app.**

```html
<!-- 1. Fonts: Visuelt Pro isn't available; Figtree stacked after it -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;700;800&display=swap">

<!-- 2. Base layer excerpt, copied from frontend/src/admin/stylesheets/elements.scss
        with its SCSS variables resolved (settings/variables.scss, tools/mixins.scss) -->
<style>
  html { box-sizing: border-box; }
  *, *:before, *:after { box-sizing: inherit; }
  body { background: white; font-size: 16px; line-height: 1.2; position: relative; }
  a { cursor: pointer; color: #0034E5; text-decoration: none; }
  a:active, a:focus, a:hover { color: #0029B2; text-decoration: underline; }
  h1, h2, h3, h4 { margin: 0; margin-bottom: 20px; font-weight: 500; }
</style>

<!-- 3. Tailwind Play CDN, pinned, with the container-queries plugin -->
<script src="https://cdn.tailwindcss.com/3.4.17?plugins=container-queries"></script>

<!-- 4. Lookout's theme, inlined -->
<script>
  tailwind.config = {
    corePlugins: { preflight: false },             // as the real config
    darkMode: ["selector", "[data-mode='dark']"],
    theme: {
      fontFamily: { sans: ["Visuelt Pro", "Figtree", /* rest of fonts.js */], serif: [...], mono: ["monospace"] },
      colors: COLORS, stroke: COLORS, fill: COLORS, // colors.js verbatim
      boxShadow: {...}, dropShadow: {...},           // tailwind.config.js verbatim
      extend: {...}                                  // tailwind.config.js verbatim
    },
    plugins: [/* the config's inline variant plugins, copied */]
  };
</script>
```

The full boot block, with every value inlined, is the kit's
`lookout-prototype/kit/head.html` with `kit/lookout-tailwind.js`. Copy it from
there.

**Theme activation:** none. The default (light) is the only theme. Dark mode
is `[data-mode='dark']` plus `dark:` utilities and the CSS filter trick on `body`;
there are no dark tokens.

**Pinning:** Tailwind pinned to `3.4.17` (the repo pins `tailwindcss ^3.4.19`;
3.4.17 is the newest Play CDN build the user named). Figtree is unpinned
(Google Fonts serves one version).

**What the stand-in can't reproduce** (all silent):

| Missing | Effect |
|---|---|
| Visuelt Pro | Figtree renders instead. Weight 200 isn't requested, because Figtree's lightest is 300 |
| `tailwindcss-animate` plugin | `animate-in`, `fade-in`, `zoom-in-95`, `slide-in-from-top-4`, `animate-out`, `delay-4.5s`… generate nothing. Modals and flashes appear without motion; flashes don't auto-dismiss |
| Bootstrap normalize + legacy SCSS | Bare-element defaults differ from the app (form control fonts, `button` margins) |
| `content-visibility-*` helpers (tailwind.css) | Tooltip hide/show uses only `opacity` and `pointer-events` |
| `src/admin/images/*.svg` | `Form::Input::CheckboxComponent`'s tick image (`bg-[url('src/admin/images/check-white.svg')]`) doesn't resolve. Checked boxes render solid royal with no tick |
| Stimulus controllers | Modal open/close, tooltip positioning, select enhancement and flash dismiss are all absent. A page has to supply its own JS for these |
| Rails form builder | `for`/`id` pairing, required-field inference, error states. Controls are labelled via `aria-labelledby` only |

**Tested:** stand-in only. On 2026-11-11 headless Chrome rendered the stand-in at 1280px and,
through a 375px iframe, at 375px. Theme colours, Figtree, container queries and the
Facade variants all resolved. Every class that generated no CSS traced to a
missing plugin or a source bug in §7. Nothing has been compared with the real
app. Headless Chrome's `--window-size` floors at 500px, so measure narrow widths
inside an iframe.

---

## 3. Vocabulary

Everything renders as HTML with the exact classes below. On a standalone page,
mark each one with a comment such as `<!-- Admin::ButtonComponent variant: :primary size: 10 -->`.

| Need | Component | Props | Slots / children | Required wrapper | Evidence |
|---|---|---|---|---|---|
| Page shell | Layout from `_layout.html.erb`: `body` › `div.flex.min-h-0.flex-1.bg-white.text-charcoal` › `Admin::Layout::ViewportComponent element: :main` | — | — | — | `[verified: source]` |
| Page frame | `Admin::Layout::WithHeaderComponent` | `element:` `:section` | `header`, `body` | — | `[verified: spec]` |
| Header bar | `Admin::Layout::HeaderComponent` (WithHeader's header slot) | `element:` `:header` | block | — | `[verified: spec]` |
| Page header with tabs | `Admin::TabbedHeaderComponent` | `row_styles:`, `header_container_styles:` | `heading`, `actions`, `tabs` (many, `Admin::TabComponent`) | — | `[verified: source]` |
| Tab | `Admin::TabComponent` | `url:` (required), `element:` `:a`, `active:`, `variant:` `:default`/`:warning` | block | inside TabbedHeader | `[verified: source]` |
| Page header, no tabs | `Admin::SimpleHeaderComponent` | `styles:` (call sites pass `px-6 py-4`) | `title` (HeadingComponent L2 by default, `as:`), `actions` | — | `[verified: spec]` |
| Page title + trail | `Admin::BreadcrumbHeaderComponent` | — | `breadcrumbs` (many, `<a>`), `current` (`<h1>`) | — | `[verified: spec]` |
| Heading | `Admin::HeadingComponent` | `level:` 1–4, `element:`, `weight:` | block; `subheadings` | — | `[verified: spec]` |
| Muted / secondary text | `Admin::SubtextComponent` | `element:` | block | — | `[verified: source]` |
| Text link | bare `<a>`, styled by the base layer (`a` → royal, underline on hover) | — | — | — | `[verified: source]` (`elements.scss`) |
| Icon | `IconComponent` (`app/components/`) | name (positional), `size:` (Square scale, default 4), `display:`, `align:` | — | — | `[verified: source]` |
| Button | `Admin::ButtonComponent` | `variant:`, `size:` 6/8/10/12/16/`:fluid`, `element:`, `display:`, `styles:` | block = label | — | `[verified: spec]` |
| Button with icon | `Admin::IconButtonComponent` | `icon: {name:}` + Button's | block | — | `[verified: spec]` |
| Create-record button | `Admin::NewButtonComponent` | `resource_name:`, `element:` `:a` | — | — | `[verified: spec]` |
| Segmented control | `Admin::SegmentControlsComponent` › `Admin::SegmentComponent` | segment: `url:` (required), `active:` | block | segments inside controls | `[verified: source]` |
| Count pill | `CountPillComponent` (`app/components/`), usually via `Admin::WithCountComponent` | `variant:` `:default`/`:royal`/`:warning` | WithCount: `body`, `count` | — | `[verified: source]` |
| Panel | `Admin::PanelComponent` | `variant:` (9), `size:` 12/16/20 | block | — | `[verified: spec]` |
| Empty state | `Admin::EmptyPanelComponent` | `size:`, `padding:`, `background:` | `image`, `title`, `subtitle`, `button` | — | `[verified: spec]` |
| Badge / tag | `Admin::TagComponent` | `color:` (27), `font_size:`, `height:`, `whitespace:` | `icon` | — | `[verified: spec]` |
| Alert / notice | `Admin::CalloutComponent` | `variant:` `:info`/`:ok`/`:alert`/`:warning`/`:royal`/`:aqua`/`:cornflower`, `padding:` | block | — | `[verified: spec]` |
| Toast / flash | `FlashComponent` (`app/components/`) | `type:` `:notice`/`:alert`, `message:` | — | layout's flash container `div.absolute.top-5.left-1/2.-translate-x-1/2.z-50` | `[verified: source]` |
| Key/value list | `Admin::DefinitionListComponent` › items | `variant:` `:default`/`:inline`/`:inline_left`/`:details`, `divided:` | items: `title`, `body` | items inside list | `[verified: source]` |
| Table | `Admin::Table::Component` › `HeadComponent`/`BodyComponent` › `RowComponent` › `HeaderComponent`/`DataComponent` | `table_variant:` `:default`/`:border` | block | **all five layers** | `[verified: spec]` |
| Row actions | `Admin::Table::ActionsComponent` | `position:` | `actions` (many): `element:`, `icon:`, `variant:` | in last DataComponent | `[verified: spec]` |
| Tooltip | `Admin::WithTooltipComponent` | `position:`, `variant:` | `body`, `tooltip` | — | `[verified: spec]` |
| Form section | `Admin::Form::SectionComponent` | — | `title`, `hint`, `body` | — | `[verified: spec]` |
| Form field | `Admin::Form::ControlComponent` | `layout:` `:vertical`/`:horizontal` | `label`, `input`, `description`, `hint`, `error` | — | `[verified: spec]` |
| Text input | `Admin::Form::Input::FieldComponent` | `type:`, `value:`, `variant:`, `width:`, `height:`, input attrs (`readonly`, `placeholder`…) | `left`, `control`, `right` | Facade wrapper (rendered for you) | `[verified: source]` |
| Search input | `Admin::Form::Input::SearchComponent` | FieldComponent's | — | — | `[verified: source]` |
| Price input | `Admin::Form::Input::PriceComponent` | FieldComponent's; sets `type: number`, `step: 0.01`, `min: 0` | — | — | `[verified: source]` |
| Select | `Admin::Form::Input::SelectComponent` | `value:`, `variant:`, `input_styles:` | `options` (`value:`, `label:`), `option_groups`, `left` | — | `[verified: source]` |
| Radio group | `Admin::Form::Input::RadioButtonCollectionComponent` | `variant:` `:default`/`:button_group` | `options` (`value:`, `label:`, `description:`, block = content shown when checked) | options inside collection | `[verified: source]` |
| Checkbox row | `Admin::Form::CheckboxInsideLabelComponent` | `variant:` `:default`/`:centered`/`:panel` | `input`, `label_text`, `description`, `hint`, `error` | — | `[verified: source]` |
| Modal | `Admin::Modal::Component` | `width:` `:narrow`/`:medium`/`:wide`/`:large`/`:extra_large`, `variant:` `:default`/`:right`, `open:`… | `title` (HeaderTitleComponent, `<h3>`), `body`, `footer` | renders `Modal::DialogComponent` for you | `[verified: source]` |
| Screen-reader text | `Admin::ScreenReaderTextComponent` | — | block | — | `[verified: source]` |
| Grid / columns | **unmapped**. No grid component. Callers use Tailwind `grid`/`gap-*` | — | — | — | — |
| Navigation (app) | `Admin::PrimaryNav::Component`, **not read**. Out of scope for single pages | — | — | — | — |
| Sticky table column | **unmapped** | — | — | — | — |
| Nested/child table rows | **unmapped**. `RowComponent color:` is only `:transparent`/`:butterscotch` | — | — | — | — |

### Page templates

None published. `_layout.html.erb` is the only shell.

### Canonical compositions (from spec code examples and source templates)

```erb
<%# Page with header bar (page-headers.md) %>
<%= render Admin::Layout::WithHeaderComponent.new do |layout| %>
  <% layout.with_header do %>
    <%= render Admin::SimpleHeaderComponent.new(styles: %w[px-6 py-4]) do |simple_header| %>
      <%= simple_header.with_title do %>
        <%= render Admin::BreadcrumbHeaderComponent.new do |breadcrumb| %>
          <% breadcrumb.with_breadcrumb(href: …) { … } %>
          <% breadcrumb.with_current { … } %>
        <% end %>
      <% end %>
      <% simple_header.with_actions do %> … <% end %>
    <% end %>
  <% end %>
<% end %>

<%# Bordered table (table.md) %>
<%= render(Admin::Table::Component.new(table_variant: :border)) do %>
  <%= render(Admin::Table::HeadComponent.new) do %>
    <%= render(Admin::Table::RowComponent.new) do %>
      <%= render(Admin::Table::HeaderComponent.new) { … } %>
    <% end %>
  <% end %>
  <%= render(Admin::Table::BodyComponent.new) do %>
    <%= render(Admin::Table::RowComponent.new) do %>
      <%= render(Admin::Table::DataComponent.new) { … } %>
    <% end %>
  <% end %>
<% end %>
```

Rendered HTML for the same compositions: see the kit's component functions in
`lookout-prototype/kit/lib/` (`ui.js`, `tier2.js`, `ui2.js`, `portal.js`). Each
one emits one component's markup with its source classes and its marker.

---

## 4. Tokens

**Prefix:** none. Tokens are Tailwind class names generated from the theme.

**Tiers:** one. `colors.js` is a flat palette (families with shades and a
`DEFAULT`). There is no semantic tier. Meaning lives in the components (primary
= `royal`, text = `charcoal`, borders = `manatee-polar`/`grey-light`, error = `warning`).

**Which tier consumers may use:** the palette, through component props. Raw
colour utilities outside a component are drift (the token audit counts 429
non-palette colour classes). Rostering colours are rostering-only.

| Family | Pattern | Example |
|---|---|---|
| Background | `bg-{family}[-shade]` | `bg-white`, `bg-snowflake`, `bg-royal-50` |
| Content | `text-{family}[-shade]` | `text-charcoal`, `text-charcoal-700` (hint), `text-warning` |
| Border | `border-{family}[-shade]` | `border-manatee-polar` (panel), `border-grey-light` (table) |
| Spacing | Tailwind 0.25rem scale + `13`, `30`, `150` | `p-6`, `gap-2`, `space-y-4` |
| Radius | Tailwind scale + `4xl` | `rounded-md` (6/8 boxes, callout), `rounded-lg` (10+, panel, tag) |
| Shadow | replaced scale, charcoal-tinted | `shadow`, `shadow-action`, `shadow-xl` |
| Type | Tailwind scale + `text-md` (15px), `text-2xs` | `text-md` (table, callout), `text-sm` (buttons, hints) |
| Weight | 400, 500 in components | `font-medium`, `font-normal` |

---

## 5. The rules

**Naming convention:** consumers don't write classes. Components take Ruby
arguments, and `styles:` appends extra Tailwind classes.

**Spacing doctrine** (CLAUDE.md / `app/components/README.md`, via
spacing-and-size.md): components have **no outer margins**. The caller spaces
siblings with `space-*` or `gap-*`. No fixed heights on text containers.
Let text wrap.

**What counts as bespoke on a converted page:**
- **Allowed:** Tailwind **layout** utilities from the theme scale on plain wrapper
  elements (`flex`, `grid`, `gap-*`, `space-*`, `p-*`, `max-w-*`, `overflow-*`,
  `w-full`, breakpoints). That's how the app's own templates arrange components.
- **Allowed:** `styles:` with layout utilities (`ml-auto`, `w-full`,
  `text-right`, `pl-*`). This is the components' published API. 64 of 98
  ActionsComponent call sites pass `styles: %w[ml-auto]`.
- **Bespoke:** colour, type, border, radius or shadow utilities outside a
  component; any arbitrary value (`[…]`) a component doesn't itself emit; any
  `<style>` rule; any class name not generated by the theme.

**Accessibility baseline:** no stated level. Components supply focus rings
(`focus:ring-4 ring-royal/20`), `role="dialog"` + `aria-modal` on modals,
`role="alert"` on flashes, `aria-labelledby` from ControlComponent to input,
sr-only labels on single table actions. Consumers supply heading order, labels,
alt text and `lang`.

**Anti-patterns:** non-palette colour classes (`text-gray-500`, `text-black`), which
generate nothing. Also `shadow-md`, `shadow-none` and `drop-shadow-none`, which
don't exist. Arbitrary near-miss sizes (`text-[13px]`, `rounded-[5px]`) and
`rgba(0,0,0,…)` shadows.

**The don'ts worth remembering:**
- A button needing an icon → IconButtonComponent, not Button + icon. Creating a record → NewButtonComponent.
- Row actions → `Table::ActionsComponent`, not hand-placed buttons.
- A sentence-long status → Callout, not Tag. A container → Panel, not Callout.
- A form group → `Form::SectionComponent`, not Panel + Heading.
- A page title with actions → SimpleHeaderComponent, not a bare Heading.
- Tooltips can't hold interactive content or essential information.

---

## 6. Validation

**Command:** the drift check in the lookout-prototype skill, against the Lookout catalog:

```bash
node <lookout-prototype>/tools/drift-check.mjs <page.html> \
  --catalog <lookout-prototype>/catalog/catalog.json
```

**Catalog:** `lookout-prototype/catalog/catalog.json`, generated from Lookout's
component source by `catalog/build-catalog.mjs`. Tiers come from
`catalog/ds-components.txt`, which mirrors the Lookout Design System artifact;
the kit's highlight switch reads the same file. Regenerate the catalog when
components change: `node build-catalog.mjs <lookout repo>`.

**What it catches:** unknown names, wrong tiers, props a component doesn't
take, slots recorded as props, missing or identical states. It reports
one-off styling without failing. Styled components pass extra keys through
as HTML attributes, so their extra props can't be flagged.

---

## 7. Known gaps and source findings

Found while reading the source. None of these are the specs' errors; the specs
didn't cover these files.

| Where | Finding |
|---|---|
| `modal/dialog_component.rb` | Uses `box-shadow-xl`, which isn't a Tailwind class (should be `shadow-xl`). Dialogs render with no shadow |
| `modal/header_title_component.rb` | Uses `text-medium`, which isn't a class (should be `font-medium`). This is masked in practice, because the base layer's `h3 { font-weight: 500 }` supplies the weight. Confirmed in the stand-in render |
| `modal/dialog_component.rb` | The dialog gets `role="dialog"` and `aria-modal` but no `aria-labelledby` to its title, so it has no accessible name |
| `modal/close_button_component.rb` | Icon-only button with no `aria-label` or sr-only text, so it has no accessible name |
| `segment_component.rb` | Fixed `h-10` plus `min-w-32` on a text container (against the "no fixed heights" rule). At 375px a two-word label with a count wraps and is clipped. Seen in the stand-in render |
| `tabbed_header_component.html.erb` | Actions are `shrink-0` with no wrap, and the heading is `min-w-0`. At 375px the actions overlap and crush the breadcrumb title. Seen in the stand-in render |
| `layout/with_header_component.rb` + `viewport_component.rb` | `h-full overflow-auto` on both the section and its body (with `grow-1`/`shrink-1` generating nothing), so the stand-in shows two nested scroll containers. Whether the real shell does the same is untested |
| `form/input/select/control_component.rb` | `border-box` isn't a class (should be `box-border`) |
| `form/input/facade/*_component.rb` | `flex-0` isn't a Tailwind 3 class (`flex-none` or `flex-[0]`) |
| `layout/box_component.rb` | `grow-1`/`shrink-1` aren't Tailwind 3 classes (`grow`/`shrink`) |
| `app/components/icons/arrows_compare.svg` | Hard-coded `fill="#333570"`, not `currentColor`, so it ignores button hover colour. Answers one of icon-button.md's unverified items: not every SVG uses `currentColor` |
| `count_pill_component.rb` | `text-[13px]`, a near-miss the audit already counts |
| Specs vs source, Button | button.md's class tables omit `appearance-none`, `cursor-pointer`, `outline-none`, `hover:/active:/focus:no-underline` and `print:hidden`, which the source applies. Converted pages include them, tagged `[verified: source]` |
| Spec unverified item, Tag | Source confirms `styled_like [BoxComponent]` at size 6 adds `text-sm px-2 py-1 rounded-md` alongside `text-xs`/`rounded-lg`. By Tailwind's generated order `text-sm` and `rounded-lg` should win (14px, not the spec's 12px). **Not measured.** No tag rendered with the price-groups seed data |
| Spec unverified item, Button sizes 6/8 | Measured in the stand-in: a size 6 button's computed `padding-left` is 10px, so the button's `px-2.5` beats the box's `px-2` |

Gaps (needed by a page, nothing in the system):
- Sticky first column in a wide table
- Nested/child rows (variants under a parent rate)
- A link-styled text button (an action that reads like a link). Nearest: `ButtonComponent variant: :secondary_borderless size: 6`
- Scroll-capped list container (prototype `max-height` lists)
