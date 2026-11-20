# Skills

Claude Code skills, grouped by category. **Private:** the `lookout/` skills hold
Lookout's component markup, its component catalog and its Figma library keys.

## Lookout

For Lookout's design team. Setup and status are in [`lookout/README.md`](lookout/README.md).

- **[lookout-prototype](lookout/lookout-prototype/)**: builds Lookout prototypes from the design system kit, in three templates: admin and supplier portal screens, Care app screens shown in a phone, and greyscale wireframes. Suggests the hard-to-find states, checks for drift and packs a handover.
- **[to-figma](lookout/to-figma/)**: sends a prototype's screens to Figma as real library components, grouped by story and flagged with when each was updated.
- **[to-lookbook](lookout/to-lookbook/)**: adds a component, pattern or layout to Lookbook as ViewComponent previews, on a branch.
- **[prototype-to-code](lookout/prototype-to-code/)**: work in progress, for engineering. Turns one story from a handover into a plan against the real Lookout views.

## Product design

- **[vibe-killer](product-design/vibe-killer/)**: rebuilds a vibe-coded page from real design system components and tokens. Adapted from Brad Frost's [skills](https://github.com/bradfrost/skills) (MIT).

## Install

The repo is private: ask Jac for access. Then link a skill into your Claude Code
skills folder:

```bash
git clone https://github.com/Jaclinaeva/skills.git ~/skills
ln -s ~/skills/product-design/vibe-killer ~/.claude/skills/vibe-killer
```

The folder name becomes the command, so this one runs as `/vibe-killer`.
`git pull` in `~/skills` gets every update.

## Licences

Each adapted skill keeps its original licence in its own folder.
