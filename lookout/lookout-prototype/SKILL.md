---
name: lookout-prototype
description: Build a Lookout admin prototype from the Lookout Design System kit, with every component marked, so it can go to Figma, gain its states and hand over to engineering without drifting from the system. Also builds quick greyscale wireframes on the same runtime. Use when a designer starts a new Lookout prototype or wireframe, adds a screen or state to one, or asks how prototypes are built here.
---

# Lookout prototype

Prototypes here are built from the design system from the first line, not
converted afterwards. Every component on the page is a real Lookout
component, marked with what it is, so a check can catch drift and an engineer
can build it without asking what anything is.

## The loop

1. **Prototype the main path** with this kit.
2. **Suggest the other states.** Claude proposes the hard-to-find states; the
   designer picks which to build. They're built in the prototype, not in Figma.
3. **Check** with the drift check.
4. **Send a page to Figma** when it needs fine-tuning, with `tools/to-figma`,
   then bring the changes back into the prototype. Only the states being
   tweaked go, not the whole prototype.
5. **Hand over** with the handover step, which checks once more.

Everything here is for prototypes built on the kit. To convert a page that
wasn't, such as a demo or an AI-generated page, use the vibe-killer skill
first, then carry on from step 2.

## Start a prototype

1. Ask where the prototype lives if the designer hasn't said. Default: a
   `prototypes/<slug>/` folder in the current directory.
2. **Ask: design system or wireframe?** The design system is for working
   out the real thing. A wireframe is for conveying an idea quickly, without
   getting every detail right (see Wireframes).
3. **Ask whether there are user stories** to follow, usually a Notion page.
   They're optional. If there are, read them and copy the ones the
   prototype covers into `stories`, in the doc's order, with their IDs and
   wording, and the guide follows them (see The prototype bar). If not, use
   a plain `guide`; stories can be added later.
4. Copy `kit/starter/` there, or `kit/wireframe-starter/` for a wireframe.
   Its `app.js` is a working page to replace.
5. Build it with `<this skill>/kit/build.sh <folder> "<Page title>"`. That
   writes `<folder>/index.html`, one standalone page.
6. Open it, then show the designer.

## Wireframes

A wireframe uses the same runtime, states, guide and stories as a
prototype, but draws with `WF` blocks (`kit/lib/wf.js`) instead of
components. It's low fidelity on purpose, so people discuss the idea, not
the colours or spacing, and nobody reads it as a spec:
- greyscale, flat, squared corners, no brand palette
- state shown by form, not colour: a dashed tag for something pending, a
  thicker border and ▲ for a warning, a double border for an error, hatched
  rows for flagged ones
- the app frame shows only the area and the item being wireframed, never a
  full fake nav
- invented names only, never real clients or suppliers
- no notes or annotations around the screens. Reasoning goes in the guide's
  `detail`, or in the PRD.

Use only `WF` blocks, and never style anything by hand: every block marks
what it's for (`data-wf="table"`, `data-wf-label="Prices"`), which is what
lets it convert later. `WF.box("…")` stands in for anything not worked out
yet. Set `wireframe: true` in `Proto.start`; the bar then reads "Wireframe"
and leaves out Show components. The drift check and Figma steps are for
design system prototypes, not wireframes.

| Need | Block |
|---|---|
| App frame | `WF.shell(content, { area, here })` |
| Page header | `WF.header(title, { sub, back, actions })` |
| Layout | `WF.stack`, `WF.row`, `WF.between`, `WF.cols(widths, items)` |
| Text | `WF.heading`, `WF.text(html, { muted, small })`, `WF.lines(n)` |
| Actions | `WF.button(label, { variant, size, a, v, disabled })`, `WF.link`, `WF.menu(items)` |
| Tabs | `WF.tabs([[id, label, count]], active, action)` |
| Data | `WF.table(cols, rows, { flag })`, `WF.details(pairs)`, `WF.stat`, `WF.tag(label, { dashed })` |
| Containers | `WF.panel(body, { title, actions })`, `WF.modal(title, body, { footer, side, close })` |
| Messages | `WF.callout(text, { tone, title, actions })`, `WF.empty(title, text, action)`, `WF.toast` |
| Forms | `WF.field(label, { type, value, hint, error, bind, optional })`, `WF.choices(label, items)` |
| Not worked out | `WF.box(label, { h })` |

## Suggest the other states

Once a story's main path works, and whenever a screen is added, suggest the
states someone would only find if they knew where to look. Don't build them
yet.

1. **Go story by story.** For each story, ask what can go wrong or differ on
   the way through it, and list the states that aren't on its main path. Use
   the story's "Done when" as a source: each rule it states usually has a
   state where the rule bites. Prompts to work through:
   - **Empty:** nothing yet, and nothing matching a filter or search
   - **Loading**, where a wait is noticeable
   - **Error:** a failed save, a failed bulk job, partial failures
   - **Validation:** each rule a form enforces, and what the message says
   - **Confirm:** anything destructive or hard to undo
   - **Warning:** unsaved changes, limits close to being hit
   - **Edge:** lots of records (40 or more), long names, missing data, the
     oldest and newest dates, each status a record can have
   - **Permissions:** what someone with less access sees
   - **Hidden:** anything reached by an interaction with nothing on screen
     pointing to it, like a double-click or a hover
2. **Only suggest what this feature could really show.** Ten real ones beat
   forty generic ones. Use the domain: a price list can be expired, a budget
   can be over-allocated.
3. **Show them as a checklist** grouped by story, each with its kind and one
   line on what it shows. Ask which to build.
4. **Build the ones picked,** each with a `data-state` marker, an entry in
   `states` with its kind, a way to reach it by clicking, and an entry in its
   story's `other` saying how a user gets there.
5. **Record the ones not picked** in the story's `notDesigned`, with the
   designer's reason:
   `notDesigned: [{ label: "Loading the list", reason: "Loads instantly" }]`.
   They show under "Not designed" in that story in the guide, and go into
   the handover, so a skipped state is a decision on record, not a gap
   someone finds later.

Ask again when the prototype changes enough to raise new states.

Rebuild after every change. The build checks the script's syntax and stops if
it's broken.

## How a page is made

`app.js` calls `Proto.start({ state, actions, nav, render })`:

- **`render(state)`** returns the page: `Proto.shell(Proto.page(header, body))`,
  plus any modal or side panel.
- **`actions`**: a click on `data-a="name"` calls `actions.name(value, state)`
  with `data-v` as the value, then redraws. Component functions take
  `{ a, v }` for this.
- **Bindings**: an input with `data-b="path.to.key"` (most inputs take
  `{ bind }`) writes its value into `state`.
- **`note`**: the context line in the prototype bar.
- **`nav`**: `{ active: "Members" }` highlights a nav item.
  `{ add: { section, label, note } }` adds a new one, marked with a note.
  `{ user, tenant }` sets who the user menu shows, to match the prototype's provider.
- **`states`**: every state a reviewer or engineer needs to see, as
  `{ id: "list:empty", label: "No records match", kind: "empty", set: function (s) { … } }`.
  Each starts from a fresh copy of `state`, applies `set`, and must render an
  element with `data-state` equal to its `id`.
- **`stories`** and **`storiesSource`**: the user stories the guide follows
  (see The prototype bar).

## The prototype bar

Every prototype gets the same bar across the top, for designers, reviewers
and engineers. It reads "Prototype", then a context line (`note`, e.g.
"Fictional data · today is 18 Nov 2026"), then its buttons. Hide collapses it
to a small pill; Shift + D toggles it.

- **Guide:** how anyone finds every state. It follows the user stories,
  one section per story, in the stories doc's order. A section shows:
  - the story's ID, title and wording
  - its main path as numbered steps. Each step has a title, a line of
    context and optional notes (`detail`) shown while you're on it. Back and
    Next walk every story's steps in order.
  - **Other paths:** the hard-to-find states, each tagged with its kind and
    a line on how a user gets there (`how`)
  - **Not designed:** what was considered and deliberately left out, with
    the reason

  ```js
  storiesSource: { title: "Phase 3 rates: user stories", url: "https://app.notion.com/p/…" },
  stories: [{
    id: "U8", title: "Know how to start",
    story: "As a new supplier, I want to know how to start, so that …",
    steps: [{ state: "services:empty", title: "Nothing set up", text: "…", detail: "…" }],
    other: [{ state: "prices:empty", how: "The Prices tab, before any services are chosen" }],
    notDesigned: [{ label: "Loading the list", reason: "Loads instantly" }]
  }]
  ```

  Every state belongs to at least one story; one can appear in several. A
  state in no story is listed under "Not in a story yet", and the drift check
  warns about it. Give each hard-to-find state a `kind` in `states`:
  - `error`, `empty`, `loading`, `confirm`, `warning`
  - `edge`: an unusual case of the data
  - `hidden`: reached through an interaction with nothing on screen pointing
    at it, like a double-click

  A state whose `data-state` doesn't render is flagged "not on screen". A
  page with no stories yet can use `guide: [{ state, title, text, detail }]`
  instead: its states with a kind become the other paths.
- **Show components:** the highlight switch, outlining each component by tier
  and naming it on hover.

Each state also has a link: `index.html#state=list:empty` opens it directly.
Use these links in reviews, Figma notes and the handover.

The bar is `[data-proto-ui]` and lives in `kit/lib/toolbar.js`, which also
works on pages not built from the kit. It isn't part of the design, so
the drift check, the handover and engineers ignore it. Never put product UI in
it, and never build your own switcher on the page instead of using `states`.

## Components

The kit's functions return marked markup. Use them; never retype their HTML.

| Need | Function | Component |
|---|---|---|
| Page shell, nav | `Proto.shell`, `NAV` | `Admin::PrimaryNav::Component` |
| Page header | `T2.pageHeader(title, line, actions)`, `T2.header` | `Admin::HeaderComponent` |
| Breadcrumb title | `UI.breadcrumbs(trail, last)` | `Admin::BreadcrumbHeaderComponent` |
| Tabs | `T2.tabs(items, active, action)` | `Admin::TabbedHeaderComponent`, `TabComponent` |
| Segments | `T2.chips(items, active, action)` | `Admin::SegmentControlsComponent` |
| Heading | `UI.heading(text, level)` | `Admin::HeadingComponent` |
| Button | `UI.button(label, { variant, size, a, v })` | `Admin::ButtonComponent` |
| Tag | `UI.tag(text, color)` | `Admin::TagComponent` |
| Panel | `UI.panel(html, { variant, flush })` | `Admin::PanelComponent` |
| Callout | `UI.callout(html, variant)` | `Admin::CalloutComponent` |
| Banner | `T2.bannerWithActions(…)` | `Admin::BannerWithActionsComponent` |
| Table | `UI.table(cols, rows)`, `UI.tr`, `UI.td` | `Admin::Table::*` |
| Row actions | `UI.rowActions(items)` | `Admin::Table::ActionsComponent` |
| Form field | `UI.field(label, control, { hint, error })` | `Admin::Form::ControlComponent` |
| Inputs | `UI.input`, `UI.select`, `UI.radios`, `UI.checkbox`, `UI.checkRow` | `Admin::Form::Input::*` |
| Definition list | `UI.dl(pairs)` | `Admin::DefinitionListComponent` |
| Metric | `UI.metric(label, value, sub, bar)` | `Admin::MetricComponent` |
| Modal, side panel | `UI.modal`, `UI.sideModal` | `Admin::Modal::Component` |
| Toast | `UI.toast(message)` | `FlashComponent` |
| Avatar, icon | `UI.avatar`, `UI.icon(name)` | `Admin::AvatarComponent`, `IconComponent` |

**Supplier portal pages** use `VP` (`kit/lib/portal.js`) for the portal's
own pieces, with `UI` and `T2` for everything shared with admin. Every
`Vendor::` component is in code, not the design system.

| Need | Function | Component |
|---|---|---|
| Page shell, nav, user menu | `VP.shell(content, { active, user, org, navActions, messages })` | `Vendor::Layout::Component`, `Vendor::Nav::Component` |
| Page with count tabs | `VP.tabbedPage(heading, tabs, active, action, body)` | `Vendor::Layout::TabbedPageComponent`, `Vendor::FilterLinkComponent` |
| Modal | `VP.modal(title, body, footer)` | `Vendor::Modal::Component` |
| Empty state | `VP.emptyPanel(title, text, button)` | `Admin::EmptyPanelComponent` |
| Collapsible section | `VP.collapsible(title, summary, body, { open })` | `Vendor::CollapsibleSectionComponent` |
| Service type badge | `VP.serviceBadge(type)` | `Vendor::ServiceTypeBadgeComponent` |
| Date, textarea, file | `VP.dateInput`, `VP.textarea`, `VP.dropzone` | `Admin::Form::Input::DateComponent`, `TextAreaComponent`, `FileDropzoneComponent` |
| Days of the week | `VP.days(days, publicHolidays)` | `Admin::DayApplicabilityComponent` |
| Actions menu, icon button | `VP.actionsMenu(label, items)`, `VP.iconButton(label, icon, o)` | `Admin::MultiActionMenuComponent`, `Admin::IconButtonComponent` |
| Highlighted row | `VP.tr(cells, { color: 'butterscotch' })` | `Admin::Table::RowComponent` |

Read the function in `kit/lib/` for its exact options before using it.

## When the kit doesn't have it

Work down this list and stop at the first that fits:

1. **Compose it** from kit components. Most new screens need nothing new.
2. **It exists in Lookout's code but not in the kit.** Read the component's
   source (`.rb`, `.html.erb`) in the Lookout repo, or ask for it if the repo
   isn't available. Write a function for it in the prototype's own
   `components.js`, marked `UI.dc(name, props, "code")`. Never guess its
   markup. Tell the designer it should be added to the kit.
3. **It exists nowhere.** Wrap the nearest composition in
   `UI.proposed("Name", "What it does and why nothing fits")`. That's a design
   decision for review, not a hand-built component.

## Rules

- **No one-off styling.** No `<style>`, no hex colours, no arbitrary values
  like `w-[37px]`. Layout between components uses Lookout's Tailwind
  utilities (`flex`, `gap-4`, `px-6`) and nothing else.
- **Never edit a component's classes** to make it look different. If it needs
  to look different, that's a gap (rule 3 above).
- **Every component is marked.** The kit does this; your own `components.js`
  functions must too.
- **Every state is marked and listed.** Wrap each region that changes with
  `data-state="<region>:<state>"`, e.g. `list:empty`, `record-panel:open`,
  and add it to `states`. Every state must also be reachable by clicking
  through the prototype, as a user would.
- **Copy follows `references/writing-guide.md`.** Read it before writing any
  words. Its confirmed Lookout rules (sentence case, never uppercase, "Member",
  "Helper", "visit" vs "job") win over anything marked draft.
- **Accessible as you build.** Follow `references/accessibility.md` while
  building, not only in review: real headings and labels, keyboard access,
  status never shown by colour alone.
- **Real-looking data, at scale.** Follow `references/sample-data.md`: made-up
  Australian data, never a client's, and at least one big case of 40 or more
  in every list, generated with `Sample`.
- **Keep the toolbar.** It's prototype chrome, outside `#app`.

## Tiers

The highlight switch shows three tiers, which `data-tier` records:

1. **In the design system:** no `data-tier`.
2. **In code, not in the design system yet:** `data-tier="code"`.
3. **Exists nowhere:** `data-tier="proposed"`, named `proposed:Name`.

The Lookout Design System artifact
(https://claude.ai/artifact/T7Yug6WwVXmZyrEYu4rfcy) decides tiers. The
`IN_DS` list in `kit/lib/proto.js` mirrors it; update both together.

## Checking

Run the drift check:

```bash
node <this skill>/tools/drift-check.mjs <prototype>/index.html \
  --catalog <this skill>/catalog/catalog.json
```

Run it:

- before sending to Figma
- after building the states
- before handover, which runs it for you

**If `node` isn't found:** designers get Node from their local Lookout setup,
which only loads inside the Lookout repo. Run the same command through it:
`direnv exec <lookout repo> node …`, where the repo is usually `~/lookout`. Ask
where it is if that path doesn't exist. Ignore the 1Password CLI warning it
prints. Never install Node without asking.

It opens every state, checks every marker against Lookout's components, and
writes `drift-check/drift-report.md` next to the page. Fix what it finds in
the prototype, not in the check.

Mark slots the way the kit does: an instance's filled slots go in
`data-slots='["left"]'` (`UI.dc`'s fifth argument), never in `data-props`.

## Sending to Figma

Send the page the designer wants to fine-tune, not the whole prototype. Ask
which story or steps, find their state ids in `stories`, and send only those. A full
export is slow and leaves frames nobody edits. Send everything only when the
designer asks for it.

The states go to Figma as editable frames, through the Figma bridge (the
figma-console MCP server). The tools are in `tools/to-figma/`.

**Before you start:**
- The prototype passes the drift check.
- The designer has the Figma desktop app open on the file they want, with the
  bridge plugin running. Check with the bridge's status tool, and confirm the
  file and page with the designer before writing anything.
- `node` works (see Checking for the fallback).
- **03 Components is published and enabled in the target file.** The builder
  can only place library components that are published. If they aren't, it
  falls back to drawing them, and says so. Check before building, and tell
  the designer rather than sending drawn frames as if they were components.

**Steps:**

1. **Capture** the chosen states:
   `node <this skill>/tools/to-figma/capture.mjs <prototype>/index.html --states id,id`.
   It writes `<prototype>/figma-export/`, adding to what's already there.
2. **Serve** the capture to Figma, in the background:
   `node <this skill>/tools/to-figma/serve.mjs <prototype>/figma-export --port 9231`.
   The bridge plugin can only fetch from localhost ports 9224 to 9232.
3. **Build** with one bridge `execute` call (timeout up to 300000 ms):

   ```js
   const BASE = 'http://localhost:9231';
   const tf = await (new Function(await (await fetch(BASE + '/build.js?t=' + Date.now())).text()))();
   return await tf.buildAll(BASE, { states: ['id', 'id'] });
   ```

   Leaving out `states` builds everything in the capture.
4. **Check:** screenshot the frames and compare them with the prototype.
   Report what the build returned: library instances, drawn components, text
   in library styles, and anything that failed.
5. **Stop the server** until the designer has finished tweaking.

**Bringing changes back:** when the designer says they've edited a frame,
serve the same capture again and run the diff for each frame they name (the
node id is in the Figma link, with `-` read as `:`):

```js
const BASE = 'http://localhost:9231';
const tf = await (new Function(await (await fetch(BASE + '/build.js?t=' + Date.now())).text()))();
const df = await (new Function(await (await fetch(BASE + '/diff.js?t=' + Date.now())).text()))();
return await df.diffFrame(BASE, tf, '<frame id>');
```

It rebuilds the state off to the side, compares layer by layer and deletes the
copy. Then:
1. List each change in plain words, traced to the line in the prototype that
   makes it. Say when that line is shared by other states.
2. Flag changes that can't be made in the prototype, such as spacing inside a
   component. Those are proposed changes to the component, for engineering.
3. Apply the ones the designer approves, rebuild and run the drift check.

Don't rebuild a frame the designer has edited unless they agree.

**What it builds:** one section per prototype, one row per region, one frame
per state, named `<prototype> / <state> · <label>`. Running it again replaces
the frames for the states it builds, in place.
- **Auto-layout** wherever the page used flex or a simple stack. Margins
  become spacers so the spacing survives.
- **Text** in the 03 Components text styles, in Visuelt.
- **Code-matched library instances** for every ViewComponent that
  `tools/to-figma/codematched.js` maps: buttons, headings, tags, inputs,
  selects, textareas, checkboxes, radios, toggles, callouts, panels, toasts,
  metrics, avatars, menus, table cells and modals. Their properties come from
  the prototype's props, and slots (a modal's Body, a table cell's Content)
  hold the prototype's content. Icons come from the library's icon set.
- **Drawn frames** only for what the library doesn't have, such as supplier
  portal (`Vendor::`) components, named after their component or role, never
  "div". The build lists them so they can be added to the library.
- **Every marked layer** keeps its component, props, slots, tier and note as
  shared plugin data (namespace `lookout`). Each frame keeps its prototype
  and state id. Bringing Figma changes back relies on these.

**Keeping it current:** when the library changes, re-read it: run the
read-library snippet (in `tools/to-figma/README.md`) with the bridge open on
03 Components. It saves `library/components.json` and `library/icons.json`.
When a new code-matched component appears, add its rule to `codematched.js`. Colours are values, not variables, until the Figma file
subscribes to the library's colour variables.

## Handing over

When the prototype is final, follow `references/handover.md`. It asks who the
prototype is from, runs the drift check as a gate, freezes the prototype,
screenshots every state and writes `HANDOVER.md` from
`templates/handover.md`. If the gate fails, it stops and reports why instead
of packing.

## Keeping the kit current

Someone with the Lookout repo does this when components change:

1. Update `catalog/ds-components.txt` when the design system artifact gains
   or loses a component. It's the one list of what's in the design system;
   the catalog and the highlight switch both read it.
2. Run `node catalog/build-catalog.mjs <lookout repo>` to regenerate
   `catalog/catalog.json`.
3. Run the drift check on `kit/starter/` to confirm the kit still passes.

## Files

- `references/writing-guide.md`: Lookout's writing rules and copy patterns
- `references/accessibility.md`: accessibility rules for Admin and Care
- `references/sample-data.md`: sample data, Australian formats and scale
- `references/handover.md`, `templates/handover.md`: the handover step and
  its pack
- `tools/drift-check.mjs`: the drift check (Node and Chrome)
- `tools/to-figma/`: capture, serve and build, for sending states to Figma
- `tools/handover-tables.mjs`: generates a handover pack's components, stories and states, and copy
- `SYSTEM.md`: the Lookout profile, for converting pages with vibe-killer
- `catalog/catalog.json`: Lookout's components, for the drift check
- `catalog/ds-components.txt`: what's in the design system
- `catalog/build-catalog.mjs`: regenerates the catalog from the Lookout repo
- `kit/head.html`, `kit/lookout-tailwind.js`: the runtime, with Lookout's
  Tailwind theme and the highlight switch styles
- `kit/lib/`: the components (`ui.js`, `tier2.js`, `ui2.js`, `nav.js`,
  `icons.js`), the supplier portal's pieces (`portal.js`, `portal-icons.js`),
  the wireframe blocks (`wf.js`), sample data (`sample.js`), the prototype
  runtime (`proto.js`) and the prototype bar (`toolbar.js`)
- `kit/starter/`, `kit/wireframe-starter/`: the pages to copy
- `kit/build.sh`: builds a prototype folder into one page
