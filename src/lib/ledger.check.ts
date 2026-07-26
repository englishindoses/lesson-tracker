/**
 * Checks for the money logic. Run with `npm run check`.
 *
 * This is the part of the app where a bug costs real money and might not be
 * noticed for months, so every rule in the ledger gets an example here with the
 * answer worked out by hand. If you change ledger.ts, run this.
 */
import { buildLedger, totalsFor } from './ledger'
import type { Class, Entry } from './types'

let failures = 0
let checks = 0

function check(name: string, actual: unknown, expected: unknown) {
  checks++
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures++
  console.log(
    `${ok ? '  ok  ' : 'FAIL  '}${name}` +
      (ok ? '' : `\n        expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`),
  )
}

function section(title: string) {
  console.log(`\n${title}`)
}

const base = {
  user_id: 'u',
  class_id: 'c',
  entry_date: null,
  duration_min: null,
  presence: null,
  not_charged: false,
  lesson_notes: null,
  due_date: null,
  amount: null,
  paid: false,
  paid_date: null,
  extra_notes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
} as const

const lesson = (id: string, date: string, extra: Partial<Entry> = {}): Entry => ({
  ...base,
  id,
  kind: 'lesson',
  entry_date: date,
  duration_min: 60,
  presence: 'present',
  ...extra,
})

const payment = (id: string, date: string, amount: number, paid: boolean): Entry => ({
  ...base,
  id,
  kind: 'payment',
  due_date: date,
  amount,
  paid,
  paid_date: paid ? date : null,
})

const perLesson: Class = {
  id: 'c',
  user_id: 'u',
  name: 'Business',
  lesson_type: 'Business',
  default_duration_min: 60,
  pricing_mode: 'per_lesson',
  price_per_lesson: 100,
  monthly_price: null,
  notes: null,
  archived: false,
  created_at: base.created_at,
  updated_at: base.updated_at,
}

const monthly: Class = {
  ...perLesson,
  pricing_mode: 'monthly',
  price_per_lesson: null,
  monthly_price: 400,
}

// ---------------------------------------------------------------------------
section('One payment settles several lessons, oldest first')
{
  const entries = [
    lesson('l1', '2026-03-04'),
    lesson('l2', '2026-03-11'),
    lesson('l3', '2026-03-18'),
    payment('p1', '2026-03-20', 250, true),
  ]
  const lines = buildLedger(perLesson, entries)
  check('first lesson fully paid', lines.get('l1')!.status, 'paid')
  check('second lesson fully paid', lines.get('l2')!.status, 'paid')
  check('third only partly covered', lines.get('l3')!.status, 'part')

  const t = totalsFor(entries, lines)
  check('charged 3 x 100', t.charged, 300)
  check('received 250', t.received, 250)
  check('owed 50', t.owed, 50)
  check('taught 3 hours', t.taughtMinutes, 180)
}

// ---------------------------------------------------------------------------
section('A struck-out lesson charges nothing but keeps its time')
{
  const entries = [
    lesson('l1', '2026-03-04'),
    lesson('l2', '2026-03-11', { presence: 'cancellation', not_charged: true }),
  ]
  const t = totalsFor(entries, buildLedger(perLesson, entries))
  check('only the chargeable lesson counts', t.charged, 100)
  check('both still count as scheduled time', t.scheduledMinutes, 120)
  check('taught time excludes the cancellation', t.taughtMinutes, 60)
}

// ---------------------------------------------------------------------------
section('Presence rules')
{
  const noShow = [lesson('l1', '2026-03-04', { presence: 'no_show' })]
  check('a no-show still charges', totalsFor(noShow, buildLedger(perLesson, noShow)).charged, 100)
  check('a no-show is not taught time', totalsFor(noShow, buildLedger(perLesson, noShow)).taughtMinutes, 0)

  const late = [lesson('l1', '2026-03-04', { presence: 'late_cancellation' })]
  check('a late cancellation charges', totalsFor(late, buildLedger(perLesson, late)).charged, 100)
}

// ---------------------------------------------------------------------------
section('Per-lesson price override')
{
  const entries = [lesson('l1', '2026-03-04', { amount: 150 })]
  check('the override wins over the class price', totalsFor(entries, buildLedger(perLesson, entries)).charged, 150)

  const zero = [lesson('l1', '2026-03-04', { amount: 0 })]
  check('an override of zero is honoured, not treated as blank', totalsFor(zero, buildLedger(perLesson, zero)).charged, 0)
}

// ---------------------------------------------------------------------------
section('An unticked payment row is only an expectation')
{
  const entries = [lesson('l1', '2026-03-04'), payment('p1', '2026-03-31', 100, false)]
  const t = totalsFor(entries, buildLedger(perLesson, entries))
  check('it adds no credit', t.received, 0)
  check('and does not double-charge', t.charged, 100)
  check('it is tracked separately as expected', t.expected, 100)
  check('still owed', t.owed, 100)
}

// ---------------------------------------------------------------------------
section('Monthly package: the payment row is the invoice')
{
  const entries = [
    lesson('l1', '2026-03-04'),
    lesson('l2', '2026-03-11'),
    lesson('l3', '2026-03-18'),
    lesson('l4', '2026-03-25'),
    payment('p1', '2026-03-01', 400, true),
  ]
  const lines = buildLedger(monthly, entries)
  const t = totalsFor(entries, lines)
  check('lessons themselves charge nothing', lines.get('l1')!.charge, 0)
  check('the invoice carries the charge', t.charged, 400)
  check('the month is settled', t.owed, 0)
  check('time is still counted', t.taughtMinutes, 240)

  const unpaid = [...entries.slice(0, 4), payment('p1', '2026-03-01', 400, false)]
  check('an unpaid month is owed in full', totalsFor(unpaid, buildLedger(monthly, unpaid)).owed, 400)
}

// ---------------------------------------------------------------------------
section('The ledger uses full history even when the view is filtered')
{
  const entries = [
    lesson('l1', '2026-02-25'),
    lesson('l2', '2026-03-04'),
    payment('p1', '2026-03-05', 200, true),
  ]
  const lines = buildLedger(perLesson, entries) // built on everything
  const march = entries.filter((e) => (e.entry_date ?? e.due_date)!.startsWith('2026-03'))
  const t = totalsFor(march, lines)
  check('the March payment settles the February lesson', lines.get('l1')!.status, 'paid')
  check('March alone charged', t.charged, 100)
  check('March alone received', t.received, 200)
  check('so March alone shows a credit', t.owed, -100)
}

// ---------------------------------------------------------------------------
section('Edge cases')
{
  const none: Entry[] = []
  const t = totalsFor(none, buildLedger(perLesson, none))
  check('an empty class owes nothing', t.owed, 0)
  check('and has no lessons', t.lessonCount, 0)

  const noPrice: Class = { ...perLesson, price_per_lesson: null }
  const entries = [lesson('l1', '2026-03-04')]
  check('a class with no price set charges nothing', totalsFor(entries, buildLedger(noPrice, entries)).charged, 0)

  const overpaid = [lesson('l1', '2026-03-04'), payment('p1', '2026-03-05', 500, true)]
  check('overpaying shows as a credit, not a negative debt', totalsFor(overpaid, buildLedger(perLesson, overpaid)).owed, -400)
}

// ---------------------------------------------------------------------------
console.log(
  failures
    ? `\n${failures} of ${checks} checks FAILED\n`
    : `\nAll ${checks} checks passed\n`,
)

// The runner reads this and sets the exit code. Done this way rather than
// calling process.exit, which doesn't exist in the browser types this project
// is compiled against.
;(globalThis as Record<string, unknown>).__ledgerCheckFailures = failures
