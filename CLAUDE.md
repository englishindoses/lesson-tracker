# Lesson Tracker — working notes for Claude

A teacher's planner: student profiles, classes, and a tracker for attendance,
time and money. Installable PWA, works offline, syncs through Supabase.

- Live: https://englishindoses.github.io/lesson-tracker/
- Repo: `englishindoses/lesson-tracker` (public — `main` auto-deploys to Pages in ~40s)
- Stack: Vite + React + TypeScript + Tailwind, Supabase for database and login
- Setup instructions live in `README.md`

---

## How Katerina wants me to work

**Push by default.** Commit and push every change to `main` without being asked.
An unpushed change is invisible to her — pushing is how it reaches her phone.
Only hold off if she says so.

**Don't test unless asked.** She will say when she wants testing. If I think a
change genuinely needs verifying before she tries it, I ask **before starting the
edit**, not after. Running a build to check the code compiles is fine — that's
seconds. Anything that drives a browser, signs in, or writes to her Supabase
project needs her go-ahead first.

**No quote marks in commit messages.** They break the shell command. Never work
around this by writing the message to a file — just write it without quotes.

**Keep the docs current, and remind her.** When we change how something works,
this file and `memory/project-log.md` need updating too. She has asked to be
reminded when they're drifting out of date — say so rather than silently fixing
or silently ignoring it.

**Never create a git branch without asking.** Work on `main`.

**Plain language.** No jargon, no padding, no over-explaining. She'll ask if she
wants more detail. Don't estimate how long things will take — that's been wrong
every time.

---

## The money model

This is the part worth being careful about, because a bug here costs real money
and might not be noticed for months. `src/lib/ledger.ts` owns all of it, and
`src/lib/ledger.check.ts` covers it — run `npm run check` after touching it.

Charges:
- **Per-lesson class**: every lesson row that isn't struck out charges the class
  price, or the row's own `amount` if it was overridden.
- **Monthly class**: lessons charge nothing. A payment row *is* the monthly
  invoice, so its amount is the charge.

Money received: any payment row with `paid` ticked.

Received money ticks off **whole** lessons, oldest first, and stops at the first
one it can't cover completely. A lesson is paid or it isn't — there is no
half-paid lesson. Whatever is left over is the student's **credit**.

**Owed = unpaid lessons − credit.** It goes negative when they've paid ahead,
meaning you're holding their money.

The bottom bar shows three figures, and they describe the **whole class**, not
the filtered view — what a student owes isn't a per-month question. The other
stats (lessons, time, charged, received) stay filtered.

Other rules:
- The first-column checkbox (`not_charged`) strikes a row out: it stays in the
  time totals but charges nothing.
- Choosing a presence that isn't normally charged (cancellation, teacher
  cancellation, reschedule) ticks that box automatically. No-shows and late
  cancellations charge by default.
- Ticking paid on a *lesson* creates a payment row for the outstanding amount, so
  the ledger stays the single source of truth.
- The ledger is always built on the class's **full history**, never the filtered
  view — a March payment still settles a February lesson. Only the totals are
  filtered.

---

## Traps already hit — don't repeat these

**Tailwind opacity modifiers break on this theme.** Colours are CSS variables, so
`bg-paper/95` emits invalid CSS and the element ends up with *no* background.
This made the sticky header transparent. Use solid `bg-paper`, or add a token.
Real Tailwind palette colours like `bg-black/40` are fine.

**`.field` beats Tailwind utilities.** It's plain CSS after the utilities layer,
so `w-auto` loses to it. Use the `.field-inline` class instead.

**Never coerce a number input's value on change.** `Number(e.target.value) || 60`
turns an empty box into a falsy 0 and snaps the old value back, so a 60 can never
become a 6. Use `NumberField`, which keeps the typed text as its own state.

**Native `<input type="date">` renders in the browser's locale**, so it can't be
forced to day-first. `DateField` formats the text itself: `Sat 25/07/2026` when
idle, plain `25/07/2026` while focused.

**Locale is fixed:** Brazilian real, `Sat 25/07/2026` dates, weeks start Sunday.

---

## Layout

- Laptop (1024px+): the full table. Below that: stacked cards. Same field
  components in both, so they can't drift apart — see `EntryFields.tsx`.
- Calendar view shares those components too, via `EntryDialog`.
- Two styles (notebook / modern) and light/dark, all driven by CSS variables in
  `index.css`. Components never hardcode a colour.

## Commands

| | |
|---|---|
| `npm run dev` | local dev server |
| `npm run build` | production build |
| `npm run check` | the money-logic checks |
| `npm run typecheck` | TypeScript only |

There is a throwaway test account in the Supabase project
(`claude-e2e-...@example.com`) with junk data attached. It can be deleted from
Authentication → Users whenever.
