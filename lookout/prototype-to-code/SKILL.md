---
name: prototype-to-code
description: Turn one story from a design handover pack into a plan, then a change, in the Lookout repo. Use when an engineer has a handover pack (HANDOVER.md, prototype.html, components-by-state.json) from lookout-prototype and wants to build a story from it. Works against the views that already exist; a handover rarely means a new page.
---

# Prototype to code

> **Draft, written by design for engineering to take over.** It belongs in the
> Lookout repo (for example `.claude/skills/prototype-to-code/`), where it can
> follow the repo's CLAUDE.md. Engineers own it from there.

A handover pack shows what a feature should look like and which Lookout
components draw it. It doesn't say how to build it, and its prototype is not
code to port. This skill turns one story from the pack into a plan against the
real views, then builds it the way the repo builds everything.

Most stories change pages that exist. So the work is a difference: what each
existing view renders now, against what the pack shows for that story.

## What's in a pack

In the handover folder:
- `HANDOVER.md`: the gate, screens and where they live, components, one
  section per story (states, links, screenshots, what wasn't designed), copy,
  what the prototype doesn't decide, and known deviations.
- `prototype.html`: the frozen prototype. Each state opens at
  `prototype.html#state=<id>`.
- `components-by-state.json`: for every state, its screen (app, page title,
  open panel) and every component with its prop values and slots.
- `drift-check/`: the report and a screenshot of every state.

## Ground rules

1. **One story at a time.** A story is a ticket. Never plan the whole pack.
2. **Never port the prototype's JavaScript.** Its data, rules and timings are
   fake, there to make screens behave. Behaviour comes from the models and
   services, designed by engineering.
3. **Existing code wins.** If the repo already has a component, form or
   pattern that does what the pack shows, use it, and say where the pack
   differs. The pack is a design, not a spec of the markup.
4. **Never invent.** Every component, prop, route and translation key in the
   plan is one you read in the repo, with its path. A `proposed:` component
   in the pack is a new component, and a decision for engineering and design
   together, not something to slip in.
5. **"What the prototype doesn't decide" are questions.** Answer the ones the
   story touches before building, or list them as open in the plan.
6. **Copy comes from the pack.** It goes into the component's translation
   file, word for word. Flag anything that breaks the repo's conventions
   rather than rewording it.

## Steps

### 1. Pick the story

Ask which story, by its ID. Read its section in `HANDOVER.md`: the story, its
main path, other paths, what wasn't designed, and its screenshots. Read the
acceptance criteria it links to, if any.

### 2. Find where it lives

For each state in the story, read its screen from `components-by-state.json`
and find it in the pack's "Where it lives" table. That table was made by
design and isn't trusted: confirm each row in the code (the route, the
controller action, the view and the components it renders). Correct the
table in the plan where it's wrong.

### 3. Compare, state by state

For each state, compare the components the pack shows with what the real view
renders now, read from its templates and components. Sort every difference
into one of these:
- **Unchanged.**
- **Changed props or content:** an existing component with different
  arguments, slots or copy (for example, a menu with a new item).
- **Added:** an existing component placed in a view that doesn't render it
  yet.
- **New:** a `proposed:` component, or a whole new view or panel.
- **Different by design:** the pack draws something the repo does another way
  (a side panel where the app uses a full page; a hand-built form where a
  component exists). Don't follow the pack blindly: list it for the designer
  and engineer to settle.

Skip the app's own shell, navigation and anything marked as a record the
prototype fakes.

### 4. Write the plan

Write `plans/<story id>.md` next to the pack:

1. **The story** and its states, with links.
2. **Where it lives:** the confirmed rows.
3. **Changes**, file by file: each component or view, what changes, and
   which state shows it.
4. **New components:** each one's job, its API, and what it renders, and
   which existing component was considered.
5. **Different by design:** each difference, and a recommendation.
6. **Behaviour this needs:** the model, service, policy and job changes the
   story implies, as questions or a sketch for engineering, never code from
   the prototype.
7. **Specs:** the fewest that pin down the behaviour, following the repo's
   testing rules: which layer, and what each one proves.
8. **Translations:** the keys and strings, from the pack's copy.
9. **Open questions:** from the pack and the acceptance criteria.
10. **Commits:** the order the change lands in, one idea per commit.

Show the plan, and stop for the engineer to agree it.

### 5. Build

Only after the plan is agreed, on a branch, following CLAUDE.md: the
component rules, translations kept with their components, specs, and the
commit rules.

### 6. Check against the pack

For each state in the story, open it in the app with the screenshot helper
and put it beside the pack's screenshot. Scroll to the change before each
screenshot: real pages are longer than the prototype's, and the change is
often below the fold. List every difference, and say which are intended (the
plan's "different by design") and which aren't. Look especially at where a
change lands on the real page; a short prototype panel can hide that it ends
up mid-form.

### When a story depends on something not built yet

If the story needs a model or a feature from another story that doesn't exist
yet, say so in the plan and build that story first. For a dry run only, a
stand-in can take its place: a method on the model, plainly marked as a
stand-in, switched on by a throwaway spec for the screenshots. Never commit a
stand-in or the spec that drives it.

## Not covered yet

- **The drift check on the real app.** If the dev app could add
  `data-component` markers to what it renders, the pack's drift check could
  run on the real page too. Engineering's call.
- **Reaching each state with real data.** Packs don't yet say what records a
  state needs. Until they do, the plan lists the data each spec and
  screenshot needs.
