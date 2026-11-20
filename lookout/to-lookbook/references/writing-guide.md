# Writing guide

> **DRAFT.** These are starting defaults based on Lookout's context. Replace or extend them with Lookout's official writing and style guide, and remove anything that conflicts with it.

## Voice
Clear, calm, respectful and practical. Lookout is used in moments that matter to people's care and wellbeing, so plain words beat clever ones. Write like a capable colleague, not a marketing site.

- Helpers are often busy, on the move, on a phone, possibly with a Member present. Be brief; put the action first.
- Staffers make decisions with compliance and funding consequences. Be precise; say what will happen.
- Members (and their families) may read what Helpers write or see summaries. Write about people with dignity.

## Confirmed Lookout rules

These come from design decisions already made. They win over anything marked draft in this file.

- **Never uppercase,** not even small headings or labels. Sentence case everywhere; small headings use `Admin::HeadingComponent` level 4.
- **"staffer"** is the term for Admin users. Lowercase, unless it starts a sentence.
- **"Member"** always has a capital M, mid-sentence too: "this Member's services".
- **"Helper"** always has a capital H, including "supplier Helper". Code names stay lowercase. In supplier rates stories and docs, plain "supplier" is fine.
- **"Visit" or "job":** provider-facing copy says "visit", even for supplier work. "Job" is supplier portal language.
- **Supplier portal roles:** "Worker" and "Worker (Limited)" are role names there, so the "don't use worker" rule below doesn't apply to them.
- **Text colour:** charcoal is the default. Use `charcoal-700` only where the real component does, such as form hints.

## Terminology
| Use | Don't use | Notes |
|---|---|---|
| Member | client, patient, resident, customer | The person receiving care |
| Helper | carer, worker, staff member | Care workers who support Members directly |
| staffer | admin, office staff | Administrative and management users |
| Admin | web app, portal, back office | The web/desktop app |
| Care | mobile app, the app | The mobile app |
| *(add: visit vs shift vs appointment, care plan, incident, community, etc.)* | | Confirm Lookout's canonical terms |

Use official program and regulatory names exactly as published (e.g. NDIS). Confirm current names before using them in UI, as they change.

## Australian English
- Spelling: organisation, colour, centre, prioritise, cancelled, enrol, licence (noun) / license (verb), program, judgement.
- Dates: `10 Nov 2026` in UI text; `10/11/2026` in dense tables. Never month-first.
- Times: `9:30 am`, `2 pm`. Use 24-hour time only where Lookout's settings require it.
- Currency: `$1,240.50`. Add "AUD" only where currency could be ambiguous.
- Phone: `04xx xxx xxx`, `(07) xxxx xxxx`.

## Style
- Sentence case for everything: titles, buttons, labels, tabs.
- Buttons say what happens: "Save care plan", "Send to Helper", not "Submit" or "OK".
- Destructive actions name the thing: "Delete visit", and the confirmation explains the consequence.
- Use "you" for the reader. Avoid "we" unless Lookout itself is acting.
- Numbers as numerals ("3 visits"). Avoid "please" and "simply".
- No jargon, abbreviations or internal codes unless users genuinely use them.

## Patterns
**Errors:** what happened + what to do next, without blame.
> "We couldn't save this note because you're offline. It's stored on your phone and will sync when you reconnect."

**Empty states:** what this area is for + how to fill it.
> "No incidents reported this month. Incidents logged by Helpers in Care will appear here."

**Confirmations:** state the consequence, not "Are you sure?"
> "Cancel this visit? Jordan will be notified and the visit removed from their roster."

**Success:** brief, and only when the result isn't already visible.

## Sensitive content
Health, behaviour, incidents and finances are sensitive. Don't show more personal detail than the task needs, especially on lists, notifications and lock screens. Notification text should make sense without revealing private information.
