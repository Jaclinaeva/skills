# Skills

Claude Code skills, grouped by category. **Private:** the `lookout/` skills hold
Lookout's component markup, its component catalog and its Figma library keys.

## Lookout

For Lookout's design team. Setup and status are in [`lookout/README.md`](lookout/README.md).

- **[lookout-prototype](lookout/lookout-prototype/)**: builds Lookout prototypes and wireframes from the design system kit, suggests the hard-to-find states, checks for drift, sends pages to Figma and back, and packs a handover.
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
