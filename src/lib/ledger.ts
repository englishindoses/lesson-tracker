import type { Class, Entry } from './types'

/**
 * The money model.
 *
 * Charges (what the student owes you)
 *   - per-lesson class: every lesson row that isn't struck out charges the
 *     class price, or the row's own amount if you overrode it.
 *   - monthly class: lessons charge nothing. A payment row *is* the monthly
 *     invoice, so its amount is the charge.
 *
 * Credits (money actually received)
 *   - any payment row with "paid" ticked, for its amount.
 *
 * Owed = charges - credits.
 *
 * Credits are then allocated across unpaid lesson charges oldest-first, which
 * is what lets one payment tick off four lessons at once.
 */

export type PaidStatus =
  | 'paid' // fully covered by payments received
  | 'part' // partly covered
  | 'due' // charged, nothing received against it yet
  | 'free' // struck out, or a non-charging lesson on a monthly package
  | 'received' // a payment row that has been received
  | 'expected' // a payment row still outstanding

export interface Line {
  entry: Entry
  /** What this row adds to the amount owed. */
  charge: number
  /** What this row pays off. */
  credit: number
  /** How much of `charge` has been covered by credits so far. */
  covered: number
  status: PaidStatus
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
export function buildLedger(cls: Class, allEntries: Entry[]): Map<string, Line> {
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
        status: charge > 0 ? 'due' : 'free',
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
      })
    }
  }

  // Allocate received money to lesson charges, oldest first.
  let pot = ordered.reduce(
    (sum, e) => sum + (e.kind === 'payment' && e.paid ? e.amount ?? 0 : 0),
    0,
  )
  if (cls.pricing_mode === 'monthly') {
    // Monthly invoices already consumed their own payment above.
    pot = 0
  }

  for (const entry of ordered) {
    if (entry.kind !== 'lesson') continue
    const line = lines.get(entry.id)!
    if (line.charge <= 0) continue
    const applied = Math.min(pot, line.charge)
    pot -= applied
    line.covered = applied
    line.status =
      applied >= line.charge - 0.001 ? 'paid' : applied > 0 ? 'part' : 'due'
  }

  return lines
}

export interface Totals {
  /** Minutes actually taught (lessons marked present). */
  taughtMinutes: number
  /** Minutes on the books, whatever the presence. */
  scheduledMinutes: number
  lessonCount: number
  charged: number
  received: number
  owed: number
  /** Payment rows not yet ticked -- money you're still waiting on. */
  expected: number
}

/** Totals for whatever set of rows is currently on screen. */
export function totalsFor(visible: Entry[], lines: Map<string, Line>): Totals {
  const t: Totals = {
    taughtMinutes: 0,
    scheduledMinutes: 0,
    lessonCount: 0,
    charged: 0,
    received: 0,
    owed: 0,
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

  t.owed = t.charged - t.received
  return t
}
