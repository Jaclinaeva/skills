# Lookout skills

Claude Code skills for Lookout's design team. Kept here, outside the Lookout
repo, while they're being tested; once they settle, they can be proposed for
the Lookout repo's own skills folder.

| Skill | What it does |
|---|---|
| `lookout-prototype` | Builds Lookout prototypes and wireframes from the design system kit, checks them for drift, sends pages to Figma and back, and hands them over |
| `prototype-to-code` | **Work in progress, for engineering.** Turns one story from a handover into a plan against the real views, then a change |

The writing guide and accessibility rules in `lookout-prototype/references/` are adapted from the
lookout-design-system skill by Leila.

To convert a page that wasn't built on the kit, use `vibe-killer`, in
`product-design/vibe-killer/` in this repo, with `lookout-prototype/SYSTEM.md`
as its profile. Everyday prototyping, checking and handover need only
`lookout-prototype`.

## Set up

1. Clone this repo to `~/skills` (see the main README).
2. Link the skills into your Claude Code skills folder:

   ```bash
   ln -s ~/skills/lookout/lookout-prototype ~/.claude/skills/lookout-prototype
   ln -s ~/skills/product-design/vibe-killer ~/.claude/skills/vibe-killer
   ```

3. Start Claude Code in your own prototypes folder, never inside the Lookout
   repo, and type `/lookout-prototype` or ask for a Lookout prototype.

The checks borrow Node from your Lookout checkout at `~/lookout`. The full
testing guide, including the Figma setup, is in Notion: "Prototyping with
Claude Code: testing guide for designers".

`git pull` in `~/skills` gets every update.

## Status

In testing with the design team, from 13 Nov 2026.

**Known issues in the kit**, from vibe-killer's check of the supplier price
lists prototype on 11 Nov:

- `UI.input` sets a `status` prop that `FieldComponent` doesn't have.
- `UI.dl` sets `item_variant`, which `DefinitionListComponent` doesn't have.
- `UI.table` sets a `variant` prop that `Table::BuilderComponent` doesn't take.
- `UI.checkbox` sets `checked` as a prop; it's an attribute.
- Tabs and segments are buttons, and are missing their required `url:`.
- 37 components' classes have drifted from Lookout's source, waiting for review.
- The design system list, `lookout-prototype/catalog/ds-components.txt`, is
  kept in step with the Lookout Design System by hand.
