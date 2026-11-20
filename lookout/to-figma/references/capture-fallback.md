# Browser capture: the fallback

A capture turns the rendered page into plain frames and text. Nothing in it
is a library instance. Use it only when the designer has agreed to that, and
say "captured, not built from components" in the section name and the
summary.

## How

1. Make a copy of the prototype with two scripts added at the end: one that
   opens a screen from a `?s=<name>` parameter by calling the prototype's
   actions, and Figma's capture script
   (`https://mcp.figma.com/mcp/html-to-design/capture.js`).
2. Serve the copy on localhost with `scripts/capture-fallback/server.js`.
3. For each screen, ask Figma for a capture id (`generate_figma_design` with
   the file key and page node), then open the screen in headless Chrome with
   `scripts/capture-fallback/cap.js <page> <screen> <capture id> <prompt id>`.
   Each id works once, and ids can't be invented. About seven at a time is
   reliable.
4. Poll each id until it completes, and record which frame is which screen.

## What it gets wrong

Check for each of these afterwards; `scripts/figma/sweep.js` finds most.

- **Side panels land on the left.** A fixed, right-aligned panel is captured
  left-aligned. Set the overlay's `primaryAxisAlignItems` to `MAX`.
- **Closed menus are drawn.** The contents of a closed `<details>` are
  captured. Hide them before capture with
  `details:not([open])>*:not(summary){display:none!important}`, or delete
  them after.
- **Toasts float mid-page.** A fixed toast is captured wherever the viewport
  ended. Remove it.
- **Everything is one viewport tall.** The nav, a side panel and a modal's
  backdrop stop at the window's height on a taller page. Stretch them to the
  frame, and make the frame as tall as a panel's content when the panel
  scrolled.
- **Native date fields are empty.** Their value isn't captured. Type it in.
- **Right-aligned inputs in table cells slide left.** Set the cell's
  alignment to the end.
- **Frames don't clip**, so panel shadows spill out. Turn clipping on.
- **Prototype chrome comes along**: the prototype bar, banners, guide links.
  Hide anything marked `data-proto-ui` before capture and ask about the rest.
- **Text is set in the page's font**, which the cloud can't load. It shows in
  a fallback there and correctly in the desktop app.
