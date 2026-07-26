# Lesson Tracker — working notes for Claude

A teacher's planner: student profiles, classes, and a tracker for attendance,
time and money. Installable PWA, works offline, syncs through Supabase.

- Live: https://englishindoses.github.io/lesson-tracker/
- Repo: `englishindoses/lesson-tracker` (public — `main` auto-deploys to Pages)
- Stack: Vite + React + TypeScript + Tailwind, Supabase for database and login
- Setup instructions live in `README.md`

---

## How Katerina wants me to work

**Push by default.** Commit and push every change to `main` without being asked.
An unpushed change is invisible to her — pushing is how it reaches her phone.
Only hold off if she says so.

**Don't test unless asked.** She will say when she wants testing. If I think a
change genuinely needs verifying before she tries it, I ask **before starting the
edit**, not after. Running a build or `npm run check` to confirm the code
compiles and the money logic still holds is fine. Anything that opens a browser,
signs in, or writes to her Supabase project needs her go-ahead first.

**Commit messages: short, plain, no quote marks.** A subject line, and a few
lines of body only when the reason isn't obvious from the diff. Not essays — my
recent ones were far too long. Never any quote marks: they break the shell
command, and never work around that by writing the message to a file.

**Keep the docs current, and remind her.** When we change how something works,
this file and `memory/project-log.md` need updating too. She has asked to be
reminded when they're drifting out of date — say so rather than silently fixing
or silently ignoring it.

**Never create a git branch without asking.** Work on `main`.

**Never state how long anything will take.** Not in minutes, not in hours, not
"quick" or "a moment". I have no reliable sense of my own wall-clock time, so any
figure I give is invented. This includes build times, deploy times and effort
estimates. If the size of a job matters, describe it relatively — which part is
bigger than which.

**Neutral, informational, concise.** Report what changed and what it does. Avoid:
- performative phrasing chosen to sound impressive
- padding, throat-clearing, restating the request back
- heavy bold and tables where plain sentences would do
- casual jargon ("drive it", "ship it", "under the hood")
- announcing decisions as if they were achievements

She'll ask if she wants more detail. She has raised the tone more than once —
take it seriously rather than acknowledging and reverting.

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

**Numbers and dates are Brazilian in both languages:** real, `Sat 25/07/2026`
(`sáb 25/07/2026`), weeks start Sunday. Only the weekday and month names change
with the language.

---

## Two languages

English and Brazilian Portuguese, toggled EN | PT in the top corner — on the
sign-in page too. Everything is in `src/lib/i18n.ts`: one entry per string,
English first, Portuguese second. Adding a string means adding it there and
using `const { t } = useT()`; TypeScript rejects a key that doesn't exist.

- The setting lives outside zustand (module state + `useSyncExternalStore`),
  because the sign-in page renders before the store has anything in it.
- Outside a component, use `translate(getLang(), key)` — that is how the CSV
  export and the store's error strings do it.
- Weekday and month names are in `format.ts`, keyed off `getLang()`.
- `PRESENCE_META` holds only the glyph and the money rule; the wording is under
  `presence.*` in i18n.

---

## Settings

One page, opened by the ⚙ tab in the header. It holds the look, the language,
the account (password, stay signed in, sign out) and the exports. There is no
theme menu or ⋯ menu any more.

**Stay signed in** works by moving the Supabase session between `localStorage`
and `sessionStorage` (`src/lib/supabase.ts`), so switching it off takes effect
immediately rather than at the next sign-in.

---

## Layout

- Laptop (1024px+): the full table. Below that: stacked cards. Same field
  components in both, so they can't drift apart — see `EntryFields.tsx`.
- Calendar view shares those components too, via `EntryDialog`.
- The look is **four independent choices**, not one theme name — all CSS
  variables in `index.css`, all set as data attributes on `<html>`:
  - `data-palette` — sage, peach, neon, ocean, plum, forest, mono, slate
  - `data-fonts` — quicksand, script, sketch, serif, typewriter, system
  - `data-paper` — dots, ruled, plain (drawn by `.paper-bg`)
  - `data-edges` — hand (wobbly borders, ruled inputs) or clean (plain boxes)

  Plus `data-mode` for light/dark, and the doodle set, which is React rather
  than CSS. `PRESETS` in `theme.ts` sets all of them at once; the option lists
  there carry i18n keys, not English words.

  Every shape rule keys off `data-edges`, never off a theme name, so any palette
  can be worn either way. Each font set supplies `--font-hand`, `--font-accent`,
  `--font-body`, and a `--heading-scale` / `--body-scale` correction, because a
  condensed script sets far smaller than a sans at the same nominal size.

  `index.html` re-applies all four attributes before first paint, and migrates
  the old single `lt.style` key; keep it in step with `theme.ts`.

  Highlighter colours are used as backgrounds (`--good-soft`, `--danger-soft`,
  `--accent-soft`); `--good`, `--danger` and `--accent` are darkened versions of
  the same hues, since pastels and neons are unreadable as text.

- Margin doodles live in `Doodles.tsx`: stroke-only SVG using `currentColor`, so
  one set works for every palette and both modes. One set per preset, chosen in
  Settings, each a left and a right column of small and large drawings.
  Overlap is prevented by construction — a margin is a full-height flex column
  with `justify-between`, so the browser does the spacing and a short set just
  spreads further apart. Wide screens only unless she turns on the phone
  option, which shows just the marks flagged `phone` — the corner ones.

- Fonts are **self-hosted** in `src/fonts/`, not linked from Google, so the app
  keeps its typography offline. Regenerate with `node scripts/fetch-fonts.mjs`;
  licences are in `FONT-LICENCES.md`. They live in `src/` rather than `public/`
  so Vite rewrites the URLs — an absolute `/fonts/` path breaks under the Pages
  subpath. `@import './fonts.css'` must stay the first line of `index.css`, or
  CSS discards it.

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
