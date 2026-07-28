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
- **A lesson with no presence recorded charges nothing** — its ledger status is
  `pending`. A row put in the diary for next month is a plan, not a lesson, so
  it stays out of charged, owed and the paid filter until she marks it. It does
  still count in the lesson count and the scheduled time.
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

It is also the **one setting that does not follow the account**. How much you
trust the machine you are sitting at is a fact about that machine, and two
people sharing a laptop can reasonably disagree — so it is stored per device
*and* per account, under `lt.stayLoggedIn.<userId>`. The session token is
written before auth resolves, so `bindStayToUser` moves it to `sessionStorage`
a moment later if that account had asked not to stay signed in.

## Settings belong to the account

Everything else personal — the six look choices, light/dark, the language, the
list/calendar switch and the pinned filter bar — lives in a `preferences` row
in Supabase and syncs across devices. `src/lib/prefs.ts` owns it.

The rules this was built to satisfy:

- Sign in on a new phone and your own palette comes with you.
- Sign in as someone else on the same laptop and they get **none** of your
  settings.
- **Signed out there are no settings at all.** The sign-in page is therefore
  always **Whimsical** and always **English**. The EN | PT toggle still works
  there, but it is a look at the page rather than a setting: it is held in
  memory and gone on reload.

`prefs.ts` moves an untyped jsonb blob between the browser and the server and
deliberately knows nothing about what a palette or a language *is* — `theme.ts`
and `i18n.ts` own the meaning, and both fall back per field, so an empty blob
simply means "all defaults". One blob rather than a column each: nothing
queries inside it, and a new choice of lettering shouldn't need a migration.

Changes apply locally at once and push after a short debounce, so clicking
through presets to compare them is one write. Offline changes set a dirty flag
and go up on the next reconnect or sign-in. Conflicts are last-write-wins on
`updated_at`, the same rule the data layer uses.

**The default preset is defined once**, as `DEFAULT_THEME` in `theme.ts`
(whimsical). `index.html` hardcodes the same four values to paint before any JS
loads — keep the two in step, along with the four data attributes on `<html>`.

**The pre-paint guess uses `lt.lastUser`.** The account isn't known until auth
resolves, far too late to paint, so `index.html` reads the last account signed
in on this device and applies its mirror (`lt.prefs.<userId>`). Signing out
removes `lt.lastUser`, so the next paint is the default look. A session that
expires without an explicit sign-out will still paint the old look once before
the sign-in page appears.

The mirror is kept on the device after sign-out, unlike the data cache, which
is deleted. It holds a colour scheme, not her students — and keeping it is what
makes a return visit instant.

---

## Exports

`src/lib/exportData.ts`, driven from Settings → Your data. A printable report
and four files:

- **Printable report (PDF)** — `ReportView.tsx`. There is no PDF library: the
  page is rendered and printed, and both phone and laptop offer "Save as PDF"
  in the print box. A library would have to carry its own fonts to get the
  accents right, for a worse result. It renders through a **portal on `<body>`**
  so the print CSS can hide `#root` outright instead of unpicking the app's
  layout; `body[data-printing]` is what switches that on. Plain black on white
  — a printer should not be asked to lay down the paper texture.

- **Students CSV** — one row per student: contact, level, needs, notes,
  archived, their classes, and their teaching for the months chosen (lessons,
  time taught, time on the books). **No money.** Money belongs to a class, not
  to a person — a class can hold two students and there is no honest way to
  split it between them.
- **Classes CSV** — one row per class, and where the money lives: students,
  type, pricing, price, lessons, time, charged, received, owed now. Owed is
  not filtered by month, matching the bottom bar.
- **Lessons CSV** — one row per lesson and payment: date, class, students,
  type, duration, presence, the ledger's charge (not the typed amount),
  payment received, status, date paid, both notes columns.
- **Backup JSON** — always the whole thing, deliberately ignoring the options.
  A restore file holding half the data is a trap.

## Restore

`src/lib/importData.ts` parses and validates a backup file; `importRows` in the
store applies it. The button sits under the backup one in Settings → Your data.

**Add-only, on purpose.** A row whose id is already present is left exactly as
it is. So a restore brings back what has gone missing and can never undo newer
work — which is why there is no confirmation step and nothing to undo. Replace
was considered and rejected: a restore that deletes can destroy the data it
exists to protect. The cost is that it can't repair a damaged row, only a
missing one.

Three things it has to get right:

- **`user_id` is re-stamped** with the account doing the restoring. It's what
  row-level security checks, so a file from another account would otherwise be
  rejected in full by the server.
- **Rows are queued in dependency order** — students and classes before the
  roster rows and lessons that point at them — because the queue is FIFO and the
  server has foreign keys. Anything still dangling after the file's own rows are
  counted in is dropped rather than left to fail forever in the queue.
- **It goes through the store, not through Supabase.** One local update and one
  queue write for the whole file: a year of teaching is thousands of rows. Going
  direct would leave the local cache showing the old data.

**If the backup format ever changes**, bump `SUPPORTED` in `importData.ts` to 2
and teach `parseBackup` to accept **both** 1 and 2 — reading the old shape and
filling in whatever the new one adds. Refusing a v1 file would recreate exactly
the problem this feature was built to fix: a backup she can't restore. The
version check refuses anything unrecognised only because there is nothing but
version 1 today; it is not a reason to drop old files later.

The file itself is a plain browser download — the app never holds a copy, which
is why restoring means picking the file yourself.

**Getting it off the device.** A backup in Downloads on the phone it was taken
on protects against a wrong deletion but not against losing the phone, so
"Send it somewhere" hands the same file to the system share sheet — Drive,
Files, email, WhatsApp. `canShareBackup()` probes with a real `File`, since the
phones disagree about which types they accept, and the button isn't rendered at
all where that fails; a laptop has the download and a synced folder. Cancelling
the sheet reports an `AbortError` and is silent — it isn't a failure.

All three spreadsheets take a month range (`from`/`to`, "YYYY-MM", either end
open) and an include-archived switch, off by default. The ledger is still built
on each class's full history and only the *rows* are filtered, so a March
payment settles a February lesson even in a March-only export.

Money in the CSVs is a plain Brazilian number (`1234,50`), no `R$` — a
spreadsheet can add those up. The report writes `R$` in full, since it is read
rather than calculated with.

**The CSV separator is a semicolon, not a comma.** A Brazilian Excel reads a
comma as the decimal point and expects `;` between columns; fed commas it puts
the whole line in one cell, which is what made the first version unreadable.
No `sep=;` preamble — Excel understands it but Google Sheets shows it as a
stray first row and then stops detecting the separator itself.

## Updating the app

`registerType: 'autoUpdate'`, so a new build is fetched in the background and
applied on a later launch with nothing to press. The gap that leaves: an
installed PWA only checks when it feels like it, so a change pushed minutes ago
can be invisible with no way to hurry it.

Settings → App version has a **Check for updates** button. `src/lib/pwaUpdate.ts`
owns it: registration moved out of the plugin's injected script
(`injectRegister: null` in `vite.config.ts`) purely so the registration can be
kept and `update()` called on demand. If a new worker turns up, autoUpdate
reloads the page itself — which is why "reloading…" is the last thing that
component renders. Offline reports "could not check", not an error.

The types were already in place: `tsconfig` lists `vite-plugin-pwa/client`.

## Delete everything

Its own section at the foot of Settings, below the exports on purpose — the file
that makes it survivable is right above it. `deleteEverything` in the store.

Four queued deletes matched on `user_id`, not thousands matched on `id`:
row-level security already scopes a delete to the account, so it is smaller and
can't half-succeed. Children before parents for the foreign keys, and queued
rather than sent directly so it works offline and reaches the other devices like
any other change.

Confirmation is **typing a word** (`DELETE` / `APAGAR`, translated — typing an
English word is a poor test of intent in Portuguese), not a second button you
can hit twice by reflex. The account, the settings and any backup file all
survive; only the teaching data goes.

**The reds are hardcoded** in `index.css` — `.danger-zone`, `.danger-text`,
`.btn-danger`, Tailwind's red-600/700 as literals. Not `--danger`, which is
tuned per palette and can be a soft pink. This is the one control that should
look the same alarming red in every look. They are classes rather than
`bg-red-600` because `.btn` sets its own background after the utilities layer, so
a utility would lose — the `.btn-selected` trap again.

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
