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
   mkdir -p ~/.claude/skills
   ln -s ~/skills/lookout/lookout-prototype ~/.claude/skills/lookout-prototype
   ln -s ~/skills/product-design/vibe-killer ~/.claude/skills/vibe-killer
   ```

3. Give prototypes a folder in your Lookout checkout that git ignores, using
   the checkout's local exclude list. Nothing in the repo changes, and
   `git add .` can't commit the folder:

   ```bash
   mkdir -p ~/lookout/prototypes
   grep -qx '/prototypes/' ~/lookout/.git/info/exclude || echo '/prototypes/' >> ~/lookout/.git/info/exclude
   ```

4. Start Claude Code in `~/lookout` (`cd ~/lookout && claude`) and type
   `/lookout-prototype` or ask for a Lookout prototype.

The checks and figma-console use Node from the Lookout setup, so they work
from there with no extra setup. The full
testing guide, including the Figma setup, is in Notion: "Prototyping with
Claude Code: testing guide for designers".

`git pull` in `~/skills` gets every update.

## Status

In testing with the design team, from 13 Nov 2026.

**Known issues in the kit**, from vibe-killer's check of the supplier price
lists prototype on 11 Nov. The invalid props it found were fixed on 13 Nov.

- Some components' classes have drifted from Lookout's source; being checked
  against the source one by one.
- The design system list, `lookout-prototype/catalog/ds-components.txt`, is
  kept in step with the Lookout Design System by hand.
