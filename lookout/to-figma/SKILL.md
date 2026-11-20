---
name: to-figma
description: Turn a Lookout prototype's screens into Figma frames built from real 03 Components library instances, laid out by story, each flagged with when it was last updated, then swept for formatting problems. Use whenever someone wants prototype screens "in Figma", a Figma design or frames "from the prototype", screens for cards, stories or a handover put into a Figma file, or asks why Figma frames aren't using real components, even if they only paste a Figma link and a prototype link. Also use to re-send screens after a prototype changes, to flag frames as WIP or stale, or to check sent frames for formatting issues.
---

# To Figma

A prototype's components are marked with the ViewComponent each one is. That
marking is what lets a screen arrive in Figma as instances of the 03
Components library, not as a picture of the page. Frames of plain layers look
right and are useless: they don't update with the library, a designer can't
swap a variant, and an engineer can't read what anything is. So the rule this
skill exists for:

**Screens go to Figma as library components, or the designer is told plainly
that they aren't before anything is built.** A browser capture of the page
(Figma's `generate_figma_design`, or any HTML-to-Figma import) only ever
makes plain layers. Never choose it because it's quicker, and never offer it
as the recommended option.

The building itself is done by the lookout-prototype kit's builder, in
`../lookout-prototype/tools/to-figma/`. This skill is the way in: it works
out which route a prototype can take, gets it ready, runs the builder, and
finishes the frames.

## 1. Work out which route the prototype can take

Look at the prototype's built page before promising anything.

| The page has | Route |
|---|---|
| `data-component` markers and a states list (built on the kit: it has a `Proto.start` call) | Straight to the builder (step 4) |
| `data-component` markers but no states list (an older prototype built from the design system by hand) | Add states (step 3), then the builder |
| No markers | It can't become components yet. Convert it with the vibe-killer skill first, or find the kit version of the same prototype |

Check with:

```bash
grep -c 'data-component' <page>.html     # 0 means no markers
grep -c 'Proto.start' <page>.html        # 0 means no states list
```

Tell the designer the route in one line before going on. If the answer is
"no markers", say so and stop: don't fall back to a capture on your own.

Supplier portal (`Vendor::`) components aren't in the library, so the builder
draws those as named frames and lists them. Say this up front when the
screens are supplier portal screens, so nobody expects instances there.

## 2. Agree which screens, and how they're grouped

Send the screens someone needs, not the whole prototype.

- Ask which stories, cards or steps. When the request points at Basecamp
  cards or Notion stories, read them and list the screens each one shows.
- The builder lays out one row per **region**. To group by story or card,
  set the rows before building, never by moving frames afterwards (see
  "Don't move built frames"):
  - a states file you write (step 3): start each id with its row,
    `next-price-list:cancel`
  - a kit prototype, whose ids you shouldn't change: give the capture a rows
    file, `--regions rows.json`, as `{ "state id": "row" }`. Only the
    states in the file are captured, in its order.
- Cards or stories with no screen get no frames. List them in the summary.

## 3. Add states to a prototype that isn't on the kit

The builder's capture opens each screen from a link (`#state=<id>`) and reads
the list of states from the page. An older prototype has neither. Two scripts
add them to a copy, leaving the prototype's own file untouched:

1. **Write a states file** next to the prototype's source, one entry per
   screen:

   ```js
   ProtoStates.define([
     { id: 'edit-price:correct', label: 'Edit price: correct the price',
       steps: [['openSup', 'fern'], ['fix', 'P-10231']] },
     { id: 'next-list:cancel', label: 'Cancel the price list', kind: 'confirm',
       steps: [['openSup', 'brin'], ['openList', 'L-b2'], ['cancelL']] }
   ]);
   ```

   A step is `['action', 'value']` (the prototype's own `window.__act` hook),
   `{ click: 'selector' }`, `{ set: ['selector', 'value'] }` or a function.
   Find the action names by reading the prototype's click handlers; drive it
   with the same actions a click would, so the screen is one a user can reach.
2. **Make the capture-ready copy:**

   ```bash
   node <this skill>/scripts/add-states.mjs <prototype>.html <states>.js --out <prototypes folder>/<slug>
   ```

   The folder's name becomes the prototype's name in Figma.
3. **Check every state before Figma is involved.** Run the kit's capture
   (step 4) and confirm each state's file holds different components, with a
   modal where a panel should be open. A state that silently failed looks
   like the start page; `data-state-error` on `#app` says which step broke.

Keep the states file with the prototype's source. It's what lets the same
screens be sent again after the prototype changes.

## 4. Build with the kit's builder

Follow "Sending to Figma" in `../lookout-prototype/SKILL.md` exactly: capture
the chosen states, serve them, build through the bridge, check, stop the
server. Before starting, confirm all of these and tell the designer about any
that fail, because each one silently lowers the result:

- **The bridge.** The builder runs in the designer's Figma desktop app
  through the figma-console bridge, which is also what gives it Visuelt Pro.
  If the bridge's tools aren't in this session, ask the designer to turn
  `figma-console` on (`/mcp`) and open the bridge plugin on the file. Don't
  switch to Figma's cloud tools to do the build: the cloud can't load
  Visuelt, so text can't use the library's styles.
- **03 Components is published and enabled in the target file.** Otherwise
  the builder draws everything.
- **The file and page.** Confirm both with the designer before writing.

Check the result frame by frame against the prototype before reporting. The
builder is young: when a screen comes out wrong, find whether the capture
dropped something or the builder drew it wrongly, fix that in
`../lookout-prototype/tools/to-figma/`, recapture and rebuild. Don't patch
frames by hand in Figma, because the next build would undo it. Faults fixed
this way so far are listed in `references/builder-notes.md`.

Afterwards, report what the build returned: how many library instances, what
was drawn and why, and anything that failed. A build where most components
were drawn is a problem to raise, not a result to hand over.

### Don't move built frames

The builder finds its frames by the prototype and state recorded on them, in
its own section, and replaces them in place when run again. A frame moved to
another section is no longer found: the next build makes a second copy. Add
labels, links and status tags around the frames; leave the frames where the
builder put them.

## 5. Finish the frames

1. **Label each row and flag every frame** with `scripts/figma/row-labels.js`,
   after filling in `ROWS` and `STATUS` at its top. It writes each row's
   title, story ids and link, and puts a status tag above every frame, so
   staleness is visible once the designer starts refining. Run it again after
   every rebuild: rows move when a frame's height changes.
2. **About the status tag:**
   - the first time on a page, run `scripts/figma/status-tags.js` once to
     make the "Frame status" component
   - statuses: Up to date, WIP, Stale. Ask which applies; don't guess from
     the prototype's own "work in progress" notes
   - the date comes from when the builder built the frame
   - it's one component, "Frame status", so the designer changes a tag in the
     properties panel
3. **Link back from the cards**, only if asked: a comment on each card with
   the link to its row. A comment notifies everyone on the card, so confirm
   before posting.

## 6. Sweep for formatting problems

Run `scripts/figma/sweep.js` on the page, then look at every frame, because
the script can't see misalignment. Report before fixing. What it checks, and
what to look for by eye:

- frames with no library instances at all (the build drew everything, or the
  frames came from a capture)
- a nav or side panel that stops short of a tall frame
- panel content cut off below the frame
- a frame shorter than its content, or one that doesn't clip
- date and time fields that came through empty
- menus that were closed in the prototype but drawn open
- inputs that don't sit under their column heading
- prototype chrome that isn't part of the design: banners, guide links, a
  heading naming the prototype
- text in a font that isn't Visuelt

**Text wider than its container is usually not real.** Figma's cloud renders
Visuelt in a fallback font and measures a few pixels wide. Ask the designer
to look at one frame in the desktop app before changing any text.

Fix mechanical problems once the designer agrees. Leave what's a design
decision, such as removing chrome, until they say.

## 7. Keep the record

- Save the states file and note the Figma page in the prototype's folder.
- When the prototype changes, send the changed states again (step 4) and
  set their tags to Up to date; set tags to Stale for screens that changed
  but weren't re-sent.
- If the designer edits a frame, bring the change back with the kit's diff
  ("Bringing changes back" in lookout-prototype) before rebuilding it.

## When a capture is the only option

Only when the designer has been told the frames will be plain layers and
still wants them, for example as a layout reference. Read
`references/capture-fallback.md` first: it lists what a capture gets wrong
and how to correct it. Label the result as a capture in the section name, so
nobody later mistakes it for built frames.

## Files

- `scripts/states-shim.js`, `scripts/add-states.mjs`: give a prototype that
  isn't on the kit a states list and state links, in a copy
- `scripts/figma/row-labels.js`: row labels with story ids and links, and a
  status tag on every frame; run again after each rebuild
- `scripts/figma/status-tags.js`: makes the Frame status component (and
  tags frames that aren't in builder rows, such as captures)
- `scripts/figma/sweep.js`: the formatting sweep (read-only)
- `scripts/capture-fallback/`, `references/capture-fallback.md`: the browser
  capture route and its known faults
