# Drift check: index.html

**Passed** · 0 errors · 6 warnings · checked 2026-11-20 at 1280px against lookout-snapshot

| Check | Result |
|---|---|
| States rendered | 4 listed, plus the page as it loads |
| Component markers | 385, 26 names |
| Names in the catalog | 26 of 26 |
| Proposed | 1 |

## Errors

None.

## Warnings

- **required:** Admin::PrimaryNav::Component needs "current_user"; fine if it's a record the prototype fakes ((as it loads), list:active, list:archived and 2 more)
- **required:** Admin::PrimaryNav::Notifications::MenuComponent needs "staffer"; fine if it's a record the prototype fakes ((as it loads), list:active, list:archived and 2 more)
- **required:** Admin::PrimaryNav::ItemComponent needs "title"; fine if it's a record the prototype fakes ((as it loads), list:active, list:archived and 2 more)
- **required:** Admin::PrimaryNav::ItemComponent needs "url"; fine if it's a record the prototype fakes ((as it loads), list:active, list:archived and 2 more)
- **required:** Admin::PrimaryNav::CollapsibleSectionComponent needs "cookie_name"; fine if it's a record the prototype fakes ((as it loads), list:active, list:archived and 2 more)
- **required:** Admin::PrimaryNav::UserMenuComponent needs "current_user"; fine if it's a record the prototype fakes ((as it loads), list:active, list:archived and 2 more)

## One-off styling

Reported, not failed. Some arbitrary values are copied from the components themselves; the rest are the prototype's own.

| Kind | Count | Examples |
|---|---|---|
| Inline `style` attributes | 3 | `--proto-bar-h: 48px;`, `width:240px`, `border-spacing:0` |
| Colours in markup | 0 |  |
| Arbitrary Tailwind values | 29 | `w-[103px]`, `mb-[1px]`, `text-[0.75rem]`, `group-data-[collapsed]/primary-nav:p-0`, `group-data-[collapsed]/primary-nav:w-8` |
| CSS rules in `<style>` | 8 | `:root`, `body`, `[hidden]`, `table`, `a` |

## Accessibility

Reported, not failed. axe-core 4.10.2 with its WCAG 2.2 AA rules, on every state, leaving out the prototype bar, the app's own navigation and rules about the prototype file itself. Some findings come from the components themselves; they belong to the component, not the prototype. Automated checks find about a third of accessibility problems: keyboard use, focus order and screen reader sense still need a person.

No findings.

## Copy

Reported, not failed. Visible text, outside the app's own navigation, checked against the writing guide's confirmed rules and terminology. Each is a prompt to look, not a verdict: "member" may be right in "team member", and a quoted word may be fine.

No findings.

## Not checked

- Components with no marker at all: the check reads markers, it can't see unmarked components.
- Prop values (only prop names), and styling props a component passes through.
- Widths other than 1280px.
