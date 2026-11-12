# Accessibility

> Adapted from Leila's lookout-design-system skill.

**Target:** WCAG 2.2 Level AA (it includes all of 2.1 AA). Lookout's official target.

Build to these rules from the start; the review pass checks them again.

## Baseline (both apps)
- **Contrast:** 4.5:1 for normal text, 3:1 for large text, icons and the boundaries of controls. Check `tokens.md` contrast notes.
- **Never colour alone:** status, severity, validation and chart series also use text, icons or patterns.
- **Keyboard:** everything reachable and operable by keyboard, in a logical order, with a visible focus indicator that isn't hidden behind sticky headers or footers.
- **Semantics:** real headings in order, landmarks, lists, tables with header cells, buttons for actions and links for navigation.
- **Labels:** every input has a visible label (not only a placeholder); errors are linked to their field and explained in text.
- **Names:** icon-only buttons have accessible names ("Edit care plan", not "pencil").
- **Motion:** respect reduced-motion settings; nothing flashes.
- **Zoom and reflow:** usable at 200% zoom and at 320px width without horizontal scrolling (data tables excepted).
- **Timeouts:** warn before a session expires and allow extension, so Helpers don't lose a half-written note.
- **Redundant entry:** don't make users re-type information they've already given in the same process.

## Care (mobile) specifics
Helpers use Care on the move, often one-handed, in cars, homes and outdoors.
- Touch targets at least 44 × 44 px for primary actions (WCAG 2.2's minimum is 24 × 24; aim higher).
- Primary actions within thumb reach, near the bottom of the screen.
- Works with large system font sizes without truncating critical information.
- Offline and syncing states are visible and announced.
- Don't rely on gestures alone (swipe, long-press); provide a visible alternative.

## Admin (web) specifics
Staffers work in dense data views for long periods.
- Data tables: proper header cells, sortable columns announce their sort state, row actions are reachable by keyboard.
- Dialogs trap focus while open and return focus when closed.
- Filters and bulk actions announce their results (e.g. "24 Members shown").

## Members and families
Some screens or outputs may be read by older people or people with disability. Prefer larger default text, generous spacing, plain language and predictable layouts on anything Member-facing.
