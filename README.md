# Lesson Tracker

A teacher's planner for lessons and money: student profiles, classes, and a
bullet-journal style table that tracks attendance, time and payments.

Installable as a PWA on phone and laptop, works offline, syncs through Supabase.

---

## Setup (once)

### 1. Create the database

1. Sign in at [supabase.com](https://supabase.com) and create a new project
   (free tier is plenty).
2. Open **SQL Editor → New query**, paste the whole of
   [`supabase/schema.sql`](supabase/schema.sql), and press **Run**.
   That creates the tables and the Row Level Security policies.
3. Go to **Project Settings → API** and copy:
   - **Project URL**
   - the **anon public** key (*not* `service_role` — that one never leaves the dashboard)

### 2. Point the app at it

```bash
cp .env.example .env
```

Paste the two values into `.env`, then:

```bash
npm install
npm run dev
```

Open the URL it prints, enter your email, and click the sign-in link that
arrives. That email address becomes your account — everything you enter is
scoped to it.

> **Note on email:** Supabase's built-in email sender is rate-limited to a few
> messages an hour. That's fine for a single user. If links stop arriving, wait
> an hour or add your own SMTP under **Authentication → Emails**.

---

## How the money works

The tracker is a **ledger**, so one payment can settle several lessons.

| | Charges | Credits |
|---|---|---|
| **Per-lesson class** | every lesson row that isn't struck out, at the class price | payment rows ticked *paid* |
| **Monthly package** | each payment row *is* that month's invoice | the same row, once ticked *paid* |

**Owed = charges − credits.**

Received money is applied to lesson charges **oldest first**, which is why
ticking one R$ 400 payment can turn four lessons green at once.

Other things worth knowing:

- The **discreet checkbox in the first column** strikes a row out: it stays in
  your records and in the time totals, but charges nothing.
- Choosing a presence you don't normally charge for (cancellation, teacher
  cancellation, reschedule) **ticks that box for you**. You can always untick it.
  No-shows and late cancellations charge by default.
- The **Amount** column on a lesson is an override. Leave it blank to use the
  class price.
- Ticking **paid** on a lesson creates a payment row for the outstanding amount,
  dated today — so the ledger stays the single source of truth.
- On a monthly package, lessons cost nothing; add one payment row per month.
- **Totals respect your filters.** Filter to March and the totals are March's.
  The ledger itself is always computed on the full history, so a March payment
  still settles a February lesson.

### Presence marks

| Mark | Meaning | Charges by default |
|---|---|---|
| `×` | Present | yes |
| `⊘` | No-show | yes |
| `◑` | Late cancellation | yes |
| `○` | Cancellation | no |
| `—` | Teacher cancellation | no |
| `›` | Rescheduled | no |

---

## Offline

Data is cached on the device, so the app opens and works with no connection.
Edits are queued and sent when you're back online; the header shows
*Saved* / *Syncing* / *Offline · n to send*.

Conflicts resolve last-write-wins per row. With one teacher and two devices
that's the right trade-off, but don't edit the same lesson on your phone and
laptop simultaneously while offline.

**Back up anyway.** The `⋯` menu has:
- **Backup everything (JSON)** — a complete, restorable snapshot.
- **Export spreadsheet (CSV)** — readable rows for accounting.

---

## Deploying to GitHub Pages

`vite.config.ts` uses a relative base, so the build works from a subpath.

1. Push this folder to a GitHub repo.
2. Add the two Supabase values as repo **Secrets** (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) — the workflow injects them at build time.
3. **Settings → Pages → Source: GitHub Actions.**
4. Push to `main`; the included workflow builds and publishes.

Pages only serves from a public repo on the free plan. That's fine here: no
student data lives in the code, and the anon key is meant to be public — Row
Level Security is what protects your rows. If you'd rather keep everything
private, Netlify's free tier serves private repos and works with the same build.

Once it's live, open it on your phone and use **Add to Home Screen**.

---

## Scripts

| | |
|---|---|
| `npm run dev` | local dev server |
| `npm run build` | production build into `dist/` |
| `npm run preview` | serve the built app |
| `npm run typecheck` | TypeScript check |
| `node scripts/make-icons.mjs` | regenerate the PWA icons |
