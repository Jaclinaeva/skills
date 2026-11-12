# Drift check — prove the markers

Phase 4 runs this on a converted page when the profile names a catalog. It
renders every state and checks every marker against the system's components,
so a conversion can't claim components, props or tiers the code doesn't have.
It reads markers; it doesn't convert anything. The same check works on any
marked page, so it's also useful for re-checking a converted page later.

**Output:** `drift-check/drift-report.md` and `drift-report.json`, next to the
page unless told otherwise.

---

## What it needs

- **The page**, marked the way phase 3 describes: `data-component`,
  `data-props`, `data-slots`, `data-tier`, `data-note`, `data-state`.
- **A states list**, so it can open every state:
  `<script type="application/json" id="proto-states">` holding
  `[{ "id": "region:state", "label": "…" }]`, with each state opening at
  `<page>#state=<id>`. Without one, only the page as it loads is checked. Say
  so in the report.
- **A catalog** of the system's components, named in `SYSTEM.md`. It's JSON:

  ```json
  { "generated": { "source": "repo@commit" },
    "components": { "ButtonComponent": {
      "args": ["element", "size"], "required": [], "positional": [],
      "anyArgs": true, "slots": [], "tier": "ds" } } }
  ```

  `tier` is `ds` for components in the design system and `code` for the
  rest. The membership authority decides it. Whoever has the system's source
  regenerates the catalog when components change; people checking
  prototypes only need the file.
- **Node 18 or later, and Chrome or Chromium.**

---

## Run it

```bash
node <this skill>/tools/drift-check.mjs <page.html> --catalog <catalog.json> [--shots] [--strict]
```

- `--shots` saves a screenshot of every state.
- `--strict` fails on warnings too.
- `--width` sets the viewport, 1280 by default.

It renders each state in headless Chrome and reads the markers from the
rendered page, so markup built by JavaScript is checked as it really appears.

---

## What it checks

**Errors** (the check fails):

- A component name that isn't in the catalog and isn't `proposed:`
- A tier that disagrees with the catalog
- A prop the component doesn't take, when it doesn't pass extras through
- **A slot recorded as a prop.** Slots go in `data-slots`
- A slot the component doesn't have
- A `proposed:` component without `data-tier="proposed"`
- A listed state that renders no matching `data-state`
- Two states that render the same page

**Warnings:**

- A required argument that isn't set. Usually a record the prototype fakes;
  list those in the receipt
- A proposed component with no note
- No states list

**Reported, never failed:** one-off styling. These are inline styles, colours
written into markup, arbitrary Tailwind values, and CSS rules the page writes
itself. Some come from the components' own source, so a person decides which
matter. The receipt carries the counts.

**Not checked:** components with no marker at all, prop values (only names),
and other widths. Say so wherever the result is reported.

---

## Fixing what it finds

Fix the prototype, not the check:

- **Unknown name:** find the real component in the catalog, or make it a
  `proposed:` gap.
- **Tier disagreement:** if the membership authority moved, regenerate the
  catalog. If the page is wrong, fix its marker. Never edit the page's own
  in-system list to match; ask the designer.
- **Slot as prop:** move the key from `data-props` to `data-slots`.
- **Missing state:** the state's `set` doesn't produce its region, or the
  region lost its `data-state`.
- **Identical states:** a lost distinction, the most serious finding. Restore
  the difference.

Then run it again until it passes.
