# Handover: pack a prototype for engineering

The prototype is final. This step packages it so an engineer can build it
without asking the designer what anything is. Engineering does the build; this
step only makes the pack trustworthy.

**Output:** a `handover/` folder next to the prototype's `index.html`, with
`HANDOVER.md` from `templates/handover.md`.

## 1. Ask who it's from

Ask for the designer's name and the feature name. Never assume the person
running the handover made the prototype.

## 2. Gate: the drift check has to pass

Run the drift check with screenshots, against the current catalog:

```bash
node <this skill>/tools/drift-check.mjs <prototype>/index.html \
  --catalog <this skill>/catalog/catalog.json --shots --out <prototype>/handover/drift-check
```

If `node` isn't found, run it through the Lookout setup as the skill's
Checking section says: `direnv exec <lookout repo> node …`.

It has to pass, with no errors:

- every name is in the catalog, or is `proposed:`
- every tier agrees with `catalog/ds-components.txt`
- every prop is a real argument, and no slot is recorded as a prop
- every listed state renders its `data-state`, and no two states look the same

Warnings about required arguments are fine when they're records the
prototype fakes (a user, an account). List them in the pack.

One-off styling never fails the gate, but its counts go in the pack so the
engineer sees what isn't built from components.

If anything fails, stop and report it. A pack built on wrong markers sends the
engineer to build the wrong thing with full confidence.

Never write your own checking scripts for the pack. The engineer has to be able
to re-run the gate, so it's always this skill's drift check, and the exact
command goes in `HANDOVER.md`. Record which catalog it ran against (the
`generated` line in the report).

## 3. Freeze the prototype

Copy `index.html` into the pack as `prototype.html`. The pack is a snapshot:
later prototype changes need a new pack, not an edited one.

## 4. Screenshots

The gate's `--shots` saves one screenshot per state, without the prototype
bar. Add other widths the product supports. Every state needs one: a state
with no screenshot is a state nobody can prove was built.

## 5. Write HANDOVER.md

Copy `templates/handover.md` into the pack as `HANDOVER.md`, then generate
the parts nobody should type:

```bash
node <this skill>/tools/handover-tables.mjs <prototype>/handover
```

It renders every state of the frozen `prototype.html` and fills the marked
sections in place, so it can be re-run:

- **Screens:** each screen (app and page title), its states, and the panels
  or modals opened on it.
- **Components:** every name, tier, instance count and the states it's in,
  with the props and slots used.
- **Stories and states:** one section per story, in the stories doc's order.
  Each lists its main path steps, then its other paths, each state with its
  link (`prototype.html#state=<id>`), its kind, how a user reaches it, and
  its screenshot, then what wasn't designed and why. Engineers can pick up a
  story as a ticket. With no stories, every state, hard-to-find ones first.
- **Copy:** every visible string, grouped by the state it first appears in,
  without the app's navigation.

It reports any state with no screenshot; fix that before handing over. It
also writes `components-by-state.json`, which the engineer's
prototype-to-code skill compares with the real views.

Write the rest yourself:

- **Where it lives:** for each screen, find where it is in the Lookout code
  today: the route and controller, the view, and the main components it
  renders. Search the code, never guess, and give file paths. Say whether the
  screen exists and changes, or is new. Mark it as found by Claude, for an
  engineer to confirm.
- **New components:** each `proposed:` one, with its job, where it's used,
  the states it needs, and a suggested API. Say which existing component was
  considered and why it didn't fit.
- **What the prototype doesn't decide:** data sources, routes, permissions,
  validation rules, error and loading behaviour, and anything else it fakes.
  Each one is a question for the engineer, not an answer.
- **Known deviations:** every override, open item and accepted gap.

## 6. Close it out

Tell the designer:

1. Where the pack is.
2. The counts: components, new components, states, open questions.
3. Anything the gate flagged and how it was resolved.

Then stop. Building it is the engineer's job, in their repo, with their
conventions.
