# Handover: <Feature name>

**Prototype:** `prototype.html` (frozen <date>) · **Designer:** <name>
**Checked against:** the Lookout catalog generated from <source> on <date>

<One paragraph: what this feature does and who uses it.>

---

## Gate

| Check | Result |
|---|---|
| Component instances with a marker | n of n |
| Names that exist in code, or are `proposed:` | n of n |
| Props that are real arguments | n of n |
| Tiers that agree with the membership authority | n of n |
| States marked and distinct | n of n |
| Slots recorded as props | 0 |

**One-off styling** (not built from components; reported, not failed):

| Kind | Count | Examples |
|---|---|---|
| Inline styles | | |
| Colours in markup | | |
| Arbitrary Tailwind values | | |
| CSS rules the page writes | | |

**Re-run the gate** against your version of the code before building:

```bash
node <lookout-prototype>/tools/drift-check.mjs prototype.html \
  --catalog <lookout-prototype>/catalog/catalog.json
```

Regenerate the catalog from your checkout first: `node <lookout-prototype>/catalog/build-catalog.mjs <lookout repo>`. A failure means the code
moved since this pack was made. The full report from packing is in
`drift-check/drift-report.md`.

---

## Screens and where they live

<!-- generated:screens -->
Filled in by `tools/handover-tables.mjs`: each screen, its states, and the panels or modals opened on it.
<!-- /generated -->

**Where it lives** (found in the Lookout code; an engineer confirms before building):

| Screen | Today | Route and controller | View and main components | New or changed |
|---|---|---|---|---|
| | Exists / new | | | |

---

## Components

<!-- generated:components -->
Filled in by `tools/handover-tables.mjs`. Never type this table.
<!-- /generated -->

**Required arguments left out** (records the prototype fakes): …

---

## New components

One block per `proposed:` component.

### proposed:<Name>

- **Job:** what it does, in one line
- **Used in:** screens and regions
- **States:** …
- **Suggested API:** arguments, slots
- **Considered instead:** <existing component>, and why it didn't fit

---

## Stories and states

<!-- generated:stories -->
Filled in by `tools/handover-tables.mjs`: one section per story, with each state's link, kind, how a user gets there, screenshot, and what wasn't designed. With no stories, every state.
<!-- /generated -->

---

## Copy

<!-- generated:copy -->
Filled in by `tools/handover-tables.mjs`: every visible string, grouped by the state it first appears in.
<!-- /generated -->

---

## What the prototype doesn't decide

Questions for engineering. The prototype fakes these.

- [ ] **Data:** where each value comes from
- [ ] **Routes:** URLs and navigation
- [ ] **Permissions:** who can see and do what
- [ ] **Validation:** rules and error messages
- [ ] **Loading and failure:** what shows while waiting, and when it fails

---

## Known deviations

Overrides, open items and accepted gaps.

- …
