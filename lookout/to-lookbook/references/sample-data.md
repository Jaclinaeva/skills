# Sample data

Preview data should look like a real provider's, so reviewers react to the
component, not to "Test Member 1". Write it into the preview as fixed values.

## Realistic, never real

- Made-up people and organisations only. Never a client's name, a real
  Member's details or a colleague's.
- Names that reflect Australia's diversity, in Members, Helpers and staffers.
- Australian formats:
  - **Dates:** `10 Nov 2026` in text, `10/11/2026` in dense tables. Never
    month first.
  - **Times:** `9:30 am`, `2 pm`.
  - **Currency:** `$1,240.50`.
  - **Phone:** `04xx xxx xxx`, `(07) xxxx xxxx`.
  - **Addresses:** real suburbs and states (`Footscray VIC`), made-up
    street numbers.
- Never lorem ipsum.

## Lots of records

Every list, table, callout and nested row must work with **40 or more** items.
Real data goes well past that: supplier Helpers can have 75 to 130 linked
supplier Helpers.

1. **Show the big case in a preview,** not just the tidy one, when the
   component holds a list. Build the rows with a short loop over fixed names
   rather than typing 40 out.
2. **Look for how the component copes:** whether it caps what's shown, sums up
   the rest ("and 36 more") or just grows. If it just grows, say so in the
   summary; that's a finding for design.

## Awkward cases

Include at least one of each where it applies:

- a very long name, an organisation name with a branch suffix
  ("Hallowmere Allied Health – Geelong")
- missing data: no phone, no email, no end date
- zero, one and many: no records, exactly one, and the big case
- the oldest and newest dates the feature can hold
