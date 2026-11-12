# Skills

Claude Code skills, grouped by category. **Private:** the `lookout/` skills hold
Lookout's component markup, its component catalog and its Figma library keys.

## Lookout

For Lookout's design team. Setup and status are in [`lookout/README.md`](lookout/README.md).

- **[lookout-prototype](lookout/lookout-prototype/)**: builds Lookout prototypes and wireframes from the design system kit, suggests the hard-to-find states, checks for drift, sends pages to Figma and back, and packs a handover.
- **[prototype-to-code](lookout/prototype-to-code/)**: work in progress, for engineering. Turns one story from a handover into a plan against the real Lookout views.

## Product design

- **[vibe-killer](product-design/vibe-killer/)**: rebuilds a vibe-coded page from real design system components and tokens. Adapted from Brad Frost's [skills](https://github.com/bradfrost/skills) (MIT).
- **layers-\***: nine skills that work through the seven layers of product design, from observed behaviour to surface. Start with [`/layers-intro`](product-design/layers-intro/), then [`/layers-orient`](product-design/layers-orient/) or the layer you're working at:
  - [layers-observed-behaviour](product-design/layers-observed-behaviour/)
  - [layers-domain](product-design/layers-domain/)
  - [layers-user-needs](product-design/layers-user-needs/)
  - [layers-product-strategy](product-design/layers-product-strategy/)
  - [layers-conceptual-model](product-design/layers-conceptual-model/)
  - [layers-interaction-flow](product-design/layers-interaction-flow/)
  - [layers-surface](product-design/layers-surface/)

  Adapted from Jamie Mill's [layers-skills](https://github.com/jamiemill/layers-skills) (MIT).

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
