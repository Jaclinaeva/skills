---
name: to-lookbook
description: Add a component, design system element or layout to Lookout's Lookbook, as ViewComponent previews in the Lookout repo, on a branch, rendered, screenshotted and checked for layout, writing and accessibility problems, with a commit proposed and nothing pushed. Use whenever a designer or engineer wants something "in Lookbook", wants previews or examples of a component, wants to document a pattern or page layout, or wants to take a component from a lookout-prototype (code-tier or proposed) into Lookbook, even if they don't say "preview" or name Lookbook directly.
---

# To Lookbook

Lookbook is how engineers and designers browse Lookout's components. It runs
in development at `/lookbook` and reads ViewComponent previews from
`spec/components/previews/`. Getting something into Lookbook means writing
or extending a preview class there, so the work is always a small, reviewable
change to the Lookout repo.

This skill takes one of three things:
1. **An existing ViewComponent** with no preview, or a thin one.
2. **A component from a lookout-prototype page**: one marked `data-tier="code"`
   (it exists in code, so it's case 1 with better examples) or `proposed:Name`
   (it doesn't exist yet).
3. **A layout, pattern or product page**: several components composed into a
   form page, a side panel with a table, a page header with tabs, or a real
   screen of the product rebuilt as a page template. Optionally with a written
   docs page.

It works for designers and engineers. For an engineer who knows the component,
steps 2 and 3 can be quick: say which branch you're on and that the plan is
fine, and it carries on.

For a product page, the aim is relocation, not redesign. Rebuild the screen from the
components the real view renders, and mark every region that isn't a
system component, so the preview doubles as a record of the gaps.

## Ground rules

- **Read before writing.** Every component, prop, slot and variant in a
  preview must come from the component's `.rb` and `.html.erb`, with its path.
  A preview that passes a prop the component doesn't take fails at render, or
  worse, renders something misleading in Lookbook.
- **Extend before adding.** Search `spec/components/previews/` for an existing
  preview of the component first. Add examples to it rather than create a
  second one; Lookbook would show both and nobody would know which is right.
- **Previews are not product code.** They're dev-only, never run in
  production, and don't need specs of their own. Keep them to rendering the
  component; no new models, factories or helpers for a preview's sake.
- **A new component is engineering territory.** Writing a preview is design's
  to do. Creating a ViewComponent (case 2, proposed) changes `app/`, so say so
  before starting, and get a yes. Then follow the repo's component rules in
  `app/components/README.md` and CLAUDE.md, and mark it as proposed in its
  preview notes so reviewers know it's a design proposal.
- **Copy and data follow this skill's references.** Read
  `references/writing-guide.md` for words (sentence case, never uppercase,
  "Member", "Helper", "visit" in admin and "job" in the supplier portal) and
  `references/sample-data.md` for made-up Australian names and places. Don't
  copy names from nearby specs either: many use TV characters. Never a real client's name. Show at
  least one long or large case (a long name, 40+ rows), because that's what
  a preview is for: seeing how the component holds up. Skip it only when
  nothing the component shows varies in length, such as a status tag with
  fixed labels, and say so in the plan. Write the values into the preview,
  fixed. A preview never reads records or fetches anything, and never shows
  real people's data. If real data turns up (copied from a view, the dev
  database or a screenshot), remove it and tell the user.
- **A record as a prop gets an unsaved one.** When a component takes a model,
  pass `Export.new(status: :failed, …)` with fixed attributes: never
  `.create`, `.first` or a factory (FactoryBot isn't loaded in development).
  Set only the attributes the component reads, and an associated record the
  same way, with `Model.new`.
- **Git stays with the person running it.** Never work on `main`, never
  commit without asking, and never push. If the user has stricter git rules of
  their own, follow those.

## Steps

### 1. Work out what's being added

Ask what it is if it isn't clear, and which of the three cases it falls into.

- **Existing component:** find its class (`grep -rn "class XComponent"` under
  `app/components` and `app/mounts/*/components`) and read the `.rb`,
  `.html.erb` and any `.yml` translations.
- **From a prototype:** open the prototype's `index.html` and find the marker:
  `data-component` (the name), `data-props`, `data-slots`, `data-tier`, and
  the note on a `proposed:` one. The prototype's states show which variants
  matter; use their examples, with their copy. If the tier is `code`, find the
  real component and continue as an existing one. The prototype's markup is a
  sketch, never the component's markup.
- **Layout, pattern or product page:** read the real view
  (`app/mounts/*/views/...`) and list the regions it renders, top to bottom.
  For each region, record where it comes from, using the same three tiers as
  lookout-prototype:
  - **design system:** a component in the Lookout Design System artifact
    (https://claude.ai/artifact/T7Yug6WwVXmZyrEYu4rfcy), which decides tiers.
    If you can't open it, ask the user, or mark the tier "code" and say so
  - **code:** a ViewComponent that isn't in the design system yet
  - **bespoke:** markup written in the view itself, with no component

  A bespoke region goes into the preview as the view's own markup, copied
  as it is, never redesigned or converted to a component along the way. The
  list of bespoke regions is the gap list; it goes in the preview's notes
  and in the summary at the end.

Then search for an existing preview:
`grep -rln "XComponent" spec/components/previews`.

### 2. Check the branch

Run `git branch --show-current` and `git status --short`.
- On `main`: ask for a branch name (plain kebab-case, like the repo's, no
  personal prefix), then `git switch -c <name>`.
- On another branch with someone's work in progress: ask whether to add to it
  or start a new branch. Don't mix this into unrelated work.
- If the branch changes, or commits appear, while you work, stop and ask.

### 3. Plan the examples, and wait

List the examples you'll add, with each one's label and what it shows, and
for a page its regions and their tiers. Wait for the user's yes before
writing anything: this is the cheapest point to drop an example or add a
missing state. Pick the ones a designer or engineer needs to see:
- each variant the component takes
- each state it can be in (empty, error, disabled, loading, long content)
- a playground with `@param` controls, when the component has a few simple
  props worth flicking through
- for a layout, the layout as a whole, plus any state of it that changes
  its structure (a panel open, an empty list)
- for a component that sits in a list (a row, an entry, a list item), the
  component as a group of several rows in one parent, as well as on its own.
  Look for `group-last`, `group-first` or `divide-*` in its template: those
  styles only show when there are siblings, such as a timeline's connecting
  line or the dividers between rows

### 4. Write the preview

Read `references/preview-patterns.md` for the file layout, naming and the
annotations Lookout uses, with examples from the repo. In short:
- `spec/components/previews/<namespace>/<name>_component_preview.rb`,
  mirroring the component's namespace (`Admin::Tickets::FooComponent` goes in
  `admin/tickets/foo_component_preview.rb`).
- `layout "admin/component_preview"` (or `care/component_preview`) to match
  the component's app.
- Examples that need slots or several components get a template in a folder
  named after the preview, `<name>_component_preview/<example>.html.erb`,
  with an empty method in the class.
- A layout is a `<Name>LayoutPreview` or `<Name>PatternPreview` with
  templates, like `admin/page_layout_preview.rb`.
- To fill a slot the way a real page does, copy that call site's slot
  content as it is: the same components, markup and classes, with only the
  values swapped for fixed ones. Don't restyle it or tidy it into something
  new. Note the call site's path in a comment, so a reviewer can compare.
- Inside `module Admin`, a model from another namespace needs a leading
  `::`: `::Vendor::Organisation.new`, or Ruby finds `Admin::Vendor` instead.
- Lookbook sizes an embed from the height of `<body>`, and
  `admin/component_preview` sets `h-full` on it, so embedded examples can't
  grow and have to scroll. Examples a guide page embeds use
  `layout "admin/pattern_preview"`, which lets `<body>` grow (if it doesn't
  exist yet on the branch, it's a copy of `component_preview` with
  `min-h-full` on `<body>`: say so, since it's a file in `app/`).
- A modal sits over the page and adds no height. Wrap the example in a
  `<div class="min-h-[…rem]">` sized to the modal plus some margin, with a
  comment saying why. It's preview-only, so the one-off value is fine.
- Written guidance goes in a Lookbook page under
  `spec/components/previews/docs/` (a `.md.erb` with `title` and `label`
  front matter), only when the user wants words alongside the examples.
  Embed examples with `<%= embed Admin::FooComponentPreview, :example %>`.
  Lookbook isn't loaded in tests, so check the pages in development:
  `bin/rails runner --skip-1password` with
  `Lookbook::Engine.previews.find_by_preview_class(Admin::FooComponentPreview)&.scenario(:example)`
  for each embed. A missing one breaks the whole page.
  Lookbook merges examples inside `# @!group` into one combined example, so
  they can't be embedded one by one. Don't group examples a guide embeds,
  or examples that sit over the page, such as modals.

### 5. Render and check every example

Lookbook isn't loaded in tests, but the same previews render at
`/rails/view_components/<preview path>/<example>`. Check each one through the
repo's screenshot helper, never a browser plugin or a hand-rolled render:

1. Copy `scripts/preview_check.rb` from this skill into
   `spec/features/tmp_lookbook/`, then write a throwaway spec next to it,
   `spec/features/tmp_lookbook/<name>_spec.rb`:

   ```ruby
   require_relative "preview_check"

   RSpec.describe "Lookbook check", :js do
     it "renders the previews" do
       create(:company) unless Company.exists? # the preview controller needs a tenant
       visit "/rails/view_components/admin/foo_component/default"
       expect(page).to have_text("Something the example shows")
       ScreenshotHelper.take_curated_screenshot(page, "01 Foo default", viewport: "laptop")
       PreviewCheck.run(page, "01 Foo default")
       # …one visit, expectation, screenshot and check per example
     end
   end
   ```

   For a small component (a tag, a button, a single row), add a small
   `width:` and `height:` to `viewport: "laptop"`, such as
   `viewport: "laptop", width: 400, height: 120`, so the component fills the
   shot rather than sitting in a corner of an empty page. Always pass
   `viewport: "laptop"`: the helper defaults to `"mobile"`, which names every
   file "Mobile" whatever its size, hides the nav and saves a second
   "Large text" copy of each shot.

2. Run it, with `PREVIEW_CHECK_DIR` set to this skill's `scripts` folder:
   `PREVIEW_CHECK_DIR=<this skill>/scripts ALLOW_CURATED_SCREENSHOTS=true direnv exec . bin/rspec spec/features/tmp_lookbook/<name>_spec.rb`.
   In a fresh git worktree, set it up first: `direnv allow`, then
   `direnv exec . bin/worktree-setup run`, then `yarn build && yarn build:css`.
   Without the asset build, every `:js` spec fails before it reaches the page.
   If the run stops with "Migrations are pending", the test database is
   behind the branch: run `RAILS_ENV=test direnv exec . bin/rails db:test:prepare`
   (it touches only the test database) and run the spec again.
3. Open and look at every screenshot, not just the ones that seem risky. A
   passing spec only proves the text is there. Check each shot shows what
   its example says, with no missing slots, broken layout, overflow or
   placeholder text, and mention anything odd about the component itself
   (misalignment, a prop that does nothing) in the summary.
4. Read `tmp/preview-check.json`: the styling checks for every example (see
   below).
5. Move the screenshots from `public/screenshots/` into a folder named after
   the branch: `~/Desktop/Screenshots/<branch name>/` unless the user keeps
   them somewhere else. Then delete `spec/features/tmp_lookbook/` and
   `tmp/preview-check.json`. None of it may be committed.

**The styling checks.** `PreviewCheck.run` checks each example at the
window's size and again at phone width (360px). It reports, never fails:
- **overflow:** the page scrolls sideways, or something sticks out past the
  edge. At 360px, this is often the finding that matters most.
- **clipped:** text cut off by a container. Truncation with … is listed
  separately, with whether the full text is in a `title`.
- **rules:** words that break the writing guide: uppercase, title-case
  headings, "member" or "helper" in lowercase, "visit" or "job" in the wrong
  app, US spelling, month-first dates.
- **a11y:** axe-core's WCAG 2.2 AA rules, such as colour contrast, missing
  labels and missing alt text. Automated checks find about a third of
  accessibility problems; keyboard use and screen readers still need a person.

Sort each finding:
- **The preview's own:** copy you wrote that breaks the guide, or an example
  too wide for its container. Fix it in the preview.
- **The component's:** it happens in every example, or comes from the
  component's own markup. Don't fix it; it goes in the summary for engineering.
- **Fine as it is:** a word the check can't judge, such as a supplier's name.

A failure here is a wrong prop, a missing slot or a missing translation in
the preview. Fix the preview. Only touch the component if it's a new
(proposed) one you're building.

### 6. Check the component's own styles

Read the component's template and its `styled` class list against the
component rules in CLAUDE.md and `app/components/README.md`. A quick first
pass:

```bash
grep -nE '(^|[ "])-?m[trblxyse]?-[0-9]|\babsolute\b|\bfixed\b|(^|[ "])h-[0-9]|\[[0-9.]+(px|rem|%)\]|#[0-9a-fA-F]{3,6}\b|\buppercase\b|\bwhitespace-nowrap\b' <the component's .rb and .html.erb>
```

Then judge each hit, because some are fine:
- **outer margins** (`m-`, `mt-`, negative margins) on the root element break
  "components must be layout-independent". Inside the component, they're fine.
- **`absolute` or `fixed`** positioning, and **fixed heights**, are against
  the rules unless the component has a stated reason.
- **arbitrary values** (`w-[3px]`) and **hex colours** bypass the design tokens.
- **`uppercase`** is never used in Lookout.
- **`whitespace-nowrap`** stops text wrapping; check the long-content example.

Report them in the summary as findings for engineering, with file and line.
Never change the component.

### 7. Lint

Run `direnv exec . bundle exec rubocop <the new .rb files>` and fix what it
reports. For templates, run Herb on just the preview's template folder:
`direnv exec . yarn herb-lint spec/components/previews/<namespace>/<name>_component_preview`.
(`linters` checks the whole repo, which is slow.) If Herb won't run, say so.

### 8. Propose the commit and stop

Show the user:
- the files added or changed, with full paths
- the screenshots folder
- for a page, its gap list: each bespoke region and where it is in the view
- the styling findings that belong to the component, from steps 5 and 6,
  with file and line, as a short list for engineering
- where to find it in Lookbook: run `dev`, open `/lookbook`, and look under
  the component's namespace. If `dev` was already running, restart it first:
  Lookbook may not pick up new preview classes until it does

Then propose one short commit message, in the repo's style ("Add Lookbook
previews for the callout component"), and wait. Commit only when asked.
Never push.

## What not to do

- Don't port a prototype's JavaScript, data or rules into a preview. A preview
  shows the component with plain values.
- Don't add previews to make a component look different. If a preview needs
  a variant the component doesn't have, that's a design proposal; say so.
- Don't touch other previews, components or the Lookbook config along the
  way. One thing per branch keeps the change easy to review.
