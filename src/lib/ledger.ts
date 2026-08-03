import type { Class, Entry } from './types'

/**
 * The money model.
 *
 * Charges (what the student owes you)
 *   - per-lesson class: every lesson row that isn't struck out, and has a
 *     presence recorded, charges the class price, or the row's own amount if
 *     you overrode it. A row with no presence yet is a plan, not a lesson, so
 *     it charges nothing until you mark it.
 *   - monthly class: lessons charge nothing. A payment row *is* the monthly
 *     invoice, so its amount is the charge.
 *
 * Money received: any payment row with "paid" ticked.
 *
 * Received money ticks off **whole** lessons, oldest first, and stops at the
 * first lesson it cannot cover completely. A lesson is paid or it isn't —
 * there is no half-paid lesson. Whatever is left over becomes the student's
 * credit, carried against future lessons.
 *
 *   4 x R$100 owed, R$350 paid
 *     -> three lessons ticked, the fourth still unpaid,
 *        R$50 credit, R$50 owed
 *
 * So: owed = unpaid lessons - credit. It goes negative when they have paid
 * ahead, which means you are holding their money.
 */

export type PaidStatus =
  | 'paid' // fully covered by money received
  | 'due' // charged, not yet covered
  | 'free' // struck out, or a non-charging lesson on a monthly package
  | 'pending' // no presence recorded yet -- not part of the money at all
  | 'received' // a payment row that has been received
  | 'expected' // a payment row still outstanding

export interface Line {
  entry: Entry
  /** What this row adds to the amount owed. */
  charge: number
  /** What this row pays off. */
  credit: number
  /** How much of `charge` has been covered — all of it, or none. */
  covered: number
  status: PaidStatus
  /** This row's share of the class's `unpaid`. */
  owing: number
  /** This row's share of the class's `credit` — money received on it that no
   *  lesson has used up. */
  unspent: number
}

/** A class's standing: what's outstanding, and what's paid ahead. */
export interface Ledger {
  lines: Map<string, Line>
  /** Money received that hasn't ticked off a whole lesson yet. */
  credit: number
  /** Total charge of every lesson still unpaid. */
  unpaid: number
  /** unpaid - credit. Negative means they've paid ahead. */
  owed: number
}

export const isLesson = (e: Entry) => e.kind === 'lesson'

function entryDate(e: Entry): string {
  return (e.kind === 'lesson' ? e.entry_date : e.due_date) ?? ''
}

/** Chronological, with payments settling after the lessons they cover. */
export function sortEntries(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => {
    const d = entryDate(a).localeCompare(entryDate(b))
    if (d !== 0) return d
    if (a.kind !== b.kind) return a.kind === 'lesson' ? -1 : 1
    return a.created_at.localeCompare(b.created_at)
  })
}

export function lessonCharge(entry: Entry, cls: Class): number {
  if (entry.kind !== 'lesson' || entry.not_charged) return 0
  // A lesson you haven't marked yet hasn't happened as far as the money is
  // concerned -- a row put in the diary for next month must not be charged.
  if (entry.presence == null) return 0
  if (entry.amount != null) return entry.amount
  if (cls.pricing_mode === 'monthly') return 0
  return cls.price_per_lesson ?? 0
}

/**
 * Builds the full ledger for one class, over ALL its entries.
 *
 * Always computed on the complete history, never on the filtered view -- a
 * March payment still has to pay off a February lesson even when you're only
 * looking at March.
 */
export function buildLedger(cls: Class, allEntries: Entry[]): Ledger {
  const ordered = sortEntries(allEntries)
  const lines = new Map<string, Line>()

  for (const entry of ordered) {
    if (entry.kind === 'lesson') {
      const charge = lessonCharge(entry, cls)
      lines.set(entry.id, {
        entry,
        charge,
        credit: 0,
        covered: 0,
        status:
          entry.presence == null ? 'pending' : charge > 0 ? 'due' : 'free',
        owing: 0,
        unspent: 0,
      })
    } else {
      const amount = entry.amount ?? 0
      lines.set(entry.id, {
        entry,
        // On a monthly package the invoice row carries the charge itself.
        charge: cls.pricing_mode === 'monthly' ? amount : 0,
        credit: entry.paid ? amount : 0,
        covered: entry.paid ? amount : 0,
        status: entry.paid ? 'received' : 'expected',
        owing: 0,
        unspent: 0,
      })
    }
  }

  /* The money received, oldest payment first, each still holding whatever is
     left of it. Lessons draw from the front, so at the end every unspent real
     can be pointed back at the payment it arrived on -- which is what lets the
     bottom bar slice `credit` by whatever is filtered. Monthly invoices consume
     their own payment above, so there is nothing here to draw on. */
  const purse =
    cls.pricing_mode === 'monthly'
      ? []
      : ordered
          .filter((e) => e.kind === 'payment' && e.paid)
          .map((e) => ({ id: e.id, left: e.amount ?? 0 }))

  const draw = (amount: number) => {
    let needed = amount
    for (const p of purse) {
      if (needed <= 0) break
      const taken = Math.min(p.left, needed)
      p.left -= taken
      needed -= taken
    }
  }

  // Tick off whole lessons, oldest first, with the money actually received.
  let pot = purse.reduce((sum, p) => sum + p.left, 0)
  let unpaid = 0

  for (const entry of ordered) {
    if (entry.kind !== 'lesson') continue
    const line = lines.get(entry.id)!
    if (line.charge <= 0) continue

    // Part of a lesson is not a paid lesson: once the pot can't cover one
    // outright, everything from here on stays due and the rest is credit.
    if (pot >= line.charge - 0.001) {
      pot -= line.charge
      draw(line.charge)
      line.covered = line.charge
      line.status = 'paid'
    } else {
      line.covered = 0
      line.status = 'due'
      line.owing = line.charge
      unpaid += line.charge
    }
  }

  if (cls.pricing_mode === 'monthly') {
    for (const entry of ordered) {
      if (entry.kind === 'payment' && !entry.paid) {
        const amount = entry.amount ?? 0
        lines.get(entry.id)!.owing = amount
        unpaid += amount
      }
    }
  }

  let credit = 0
  for (const p of purse) {
    const left = Math.max(0, Number(p.left.toFixed(2)))
    lines.get(p.id)!.unspent = left
    credit += left
  }

  credit = Number(credit.toFixed(2))
  unpaid = Number(unpaid.toFixed(2))

  return { lines, credit, unpaid, owed: Number((unpaid - credit).toFixed(2)) }
}

/**
 * The three money figures for whatever rows are on screen.
 *
 * Every row carries its own share of what's unpaid and of the credit sitting
 * in hand, so this is a slice of the real ledger rather than a second sum done
 * a different way: filter to July and you get July's part, clear the filters
 * and the parts add back up to exactly the whole class.
 *
 * The consequence is that with a filter on, `owed` is what's outstanding in
 * that slice — not what the student owes you altogether. Only the unfiltered
 * view answers that.
 */
export function figuresFor(rows: Entry[], lines: Map<string, Line>) {
  let credit = 0
  let unpaid = 0

  for (const row of rows) {
    const line = lines.get(row.id)
    if (!line) continue
    credit += line.unspent
    unpaid += line.owing
  }

  credit = Number(credit.toFixed(2))
  unpaid = Number(unpaid.toFixed(2))

  return { credit, unpaid, owed: Number((unpaid - credit).toFixed(2)) }
}

export interface Totals {
  /** Minutes actually taught (lessons marked present). */
  taughtMinutes: number
  /** Minutes on the books, whatever the presence. */
  scheduledMinutes: number
  lessonCount: number
  charged: number
  received: number
  /** Payment rows not yet ticked -- money you're still waiting on. */
  expected: number
}

/**
 * Totals for whatever set of rows is currently on screen.
 *
 * Deliberately does not include what's owed: that's a property of the class as
 * a whole, not of the month you happen to be looking at. See `Ledger`.
 */
export function totalsFor(visible: Entry[], lines: Map<string, Line>): Totals {
  const t: Totals = {
    taughtMinutes: 0,
    scheduledMinutes: 0,
    lessonCount: 0,
    charged: 0,
    received: 0,
    expected: 0,
  }

  for (const entry of visible) {
    const line = lines.get(entry.id)
    if (!line) continue

    if (entry.kind === 'lesson') {
      t.lessonCount += 1
      const mins = entry.duration_min ?? 0
      t.scheduledMinutes += mins
      if (entry.presence === 'present') t.taughtMinutes += mins
    } else if (!entry.paid) {
      t.expected += entry.amount ?? 0
    }

    t.charged += line.charge
    t.received += line.credit
  }

  return t
}
