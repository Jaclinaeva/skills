# Care prototypes


A Care prototype is for the Care app: what Members and Helpers see, mostly
on a phone. It uses the same runtime, states, stories, guide and drift check
as an admin prototype. Three things differ:

- **It runs in a phone.** `template: 'care'` in `Proto.start` is what makes
  it a Care prototype; the build reads that line. The page is a phone frame
  with a side panel beside it.
- **Care has its own components and its own stylesheet.** Use `CARE`
  (`kit/lib/care.js`), never `UI` or `T2`, whose classes are the admin's.
  Care's look comes from `kit/care/care.css`, the Care app's own compiled
  CSS, not from Tailwind on the page.
- **Toggles sit beside the phone,** for the things a reviewer wants to
  flip between: which screen, which scenario, a company setting on or off.

## The side panel

```js
Proto.start({
  template: 'care',
  title: 'Split visits in the Care app',
  intro: 'How a Helper checks out of a visit charged at more than one rate.',
  toggles: [
    { key: 'scenario', label: 'Scenario',
      options: [['split', 'Split'], ['single', 'Single rate']],
      on: function (value, state) { state.screen = 'visit'; },
      show: function (state) { return state.screen !== 'opportunity'; } }
  ],
  notes: function (state) {
    return { label: 'Visit screen', title: 'Rates show their share of the visit',
             points: ['Each rate shows the services it covers.'] };
  },
  …
});
```

- **`toggles`:** each writes its choice into `state` at `key` and redraws.
  `on` runs afterwards, for a choice that should also change something else.
  `show` hides a toggle on screens it doesn't apply to.
- **`notes`:** what a reviewer should notice on the screen showing now.
  Keep reasoning here or in the guide's `detail`, never on the screen.
- **Restart** puts the prototype back to its starting state.
- **Labels are sentence case,** like everything else.

A toggle is a quick way to flip between variations. It doesn't replace
`states`: every state still gets a `data-state` marker and an entry in
`states`, set through the same keys the toggles use, so the guide, the state
links and the drift check all work.

## The phone

`render` returns `Proto.phone(top, screen, { id, bar })`:

- **`top`:** what stays above the scrolling screen, usually `CARE.topnav`.
- **`screen`:** the screen's content, which scrolls inside the phone.
- **`id`:** names the screen. A redraw of the same screen keeps its scroll
  position; a different screen starts at the top.
- **`bar`:** `{ title, back: 'actionName' }` draws the native app's
  navigation bar. It's chrome, not design: Care's web pages have no back
  button or title bar, the iOS and Android shells add them.

## Care components

| Need | Function | Component |
|---|---|---|
| Top nav | `CARE.topnav(items, active, { a, user })` | `Care::TopnavComponent` |
| Top of a Helper's visit: tabs, person, state | `CARE.visitHeader({ tabs, active, name, body, actions })` | `Care::Helpers::Visits::HeaderComponent` |
| The person a visit is with | `CARE.personHeader(name, { subtitle })` | `Care::Visits::HeaderComponent` |
| Start and finish times | `CARE.duration(start, finish)` | `Care::Visits::DurationComponent` |
| Chip, stack of chips | `CARE.chip(icon, title, { subtitle })`, `CARE.chips(list)` | `Care::ChipComponent`, `Care::BagOfChipsComponent` |
| Banner | `CARE.banner(title, { variant, subtitle, body })` | `Care::BannerComponent` |
| Button | `CARE.button(label, { variant, size, block, link, a, v })` | `Care::ButtonComponent` |
| Section band | `CARE.subtitle(text, { variant })` | `Care::SubtitleComponent` |
| Avatar | `CARE.avatar(size, { shape, src })` | `Care::AvatarComponent` |
| Tag | `CARE.tag(text, { color })` | `Care::TagComponent` |
| Home screen (the schedule) | `CARE.schedule(days)`, `CARE.scheduleDay(label, cards, { today })` | `Care::ScheduleComponent`, `Care::Schedule::DaysComponent` |
| Visit card on the schedule | `CARE.scheduleVisit(name, time, { chips, heading, under })` | `Care::Schedule::VisitComponent` |
| Empty day | `CARE.nothingScheduled(text)` | `Care::Schedule::NothingScheduledComponent` |
| Row: icon, title, value | `CARE.row(icon, title, { sub, value })` | none: Care's views write these rows by hand |
| An image from Care's folder | `CARE.img('services/ic_car.svg')` | |

This is a first set: a Helper's visit screen and the home screen. When a
prototype needs another Care component, follow "When the kit doesn't have
it" in the skill: read its template in `app/mounts/care/components/care/` and add a
function to `kit/lib/care.js`, marked with `CARE.dc`. If it uses an image
that isn't in `kit/lib/care-assets.js`, add the file from
`frontend/src/care/images/`.

## Rules for Care prototypes

- **Layout uses the classes Care's own views use:** `padded`, `spaced`,
  `tuple__container`, and the Tailwind classes already in Care's templates.
  A Tailwind class Care never uses isn't in `care.css`, so it does nothing.
  If a layout needs one, that's a gap to raise, not a style to write.
- **Never edit `care.css`.** It's a copy of the app's stylesheet.
- **Avatars have no initials.** `Care::AvatarComponent` always renders a
  photo, so without one its grey placeholder shows.
- **Sending to Figma isn't set up for Care yet.** The builder places admin
  components from 03 Components; it has no map to the Care components
  library. Say so if asked, don't send drawn frames.

## Refreshing Care's stylesheet

`care.css` was taken on 20 Nov 2026. When Care's components change, replace
it with the app's current one: run the Lookout dev app, open any Care page,
save the Care stylesheet the page loads, inline its images, and remove the
embedded `@font-face` rules (Visuelt Pro comes from the machine). Rebuild
the Care starter and run the drift check on it afterwards.
