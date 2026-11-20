# Sample data

Prototype data should look like a real provider's, so reviewers react to the
design, not to "Test Member 1".

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

1. **Show the big case in the prototype,** not just the tidy one. At least one
   example in each list has 40 or more items.
2. **Design for it:** cap what's shown, sum up the rest ("and 36 more"), and
   link to a filtered full view.
3. **Give the big case its own state** with kind `edge`, such as
   `supplier-list:many`, so reviewers and engineers can open it directly.

Generate big lists with the kit's `Sample` helpers rather than typing them out
(see `kit/lib/sample.js`). They're seeded, so the same prototype shows the same
names every time.

## Awkward cases

Include at least one of each where it applies:

- a very long name, an organisation name with a branch suffix
  ("Hallowmere Allied Health – Geelong")
- missing data: no phone, no email, no end date
- zero, one and many: no records, exactly one, and the big case
- the oldest and newest dates the feature can hold
