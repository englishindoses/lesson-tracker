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
section('One payment ticks off whole lessons, oldest first')
{
  const entries = [
    lesson('l1', '2026-03-04'),
    lesson('l2', '2026-03-11'),
    lesson('l3', '2026-03-18'),
    payment('p1', '2026-03-20', 250, true),
  ]
  const led = buildLedger(perLesson, entries)
  check('first lesson ticked off', led.lines.get('l1')!.status, 'paid')
  check('second lesson ticked off', led.lines.get('l2')!.status, 'paid')
  check('third not fully covered, so still due', led.lines.get('l3')!.status, 'due')
  check('the leftover 50 becomes credit', led.credit, 50)
  check('the whole third lesson counts as unpaid', led.unpaid, 100)
  check('owed is unpaid minus credit', led.owed, 50)

  const t = totalsFor(entries, led.lines)
  check('charged 3 x 100', t.charged, 300)
  check('received 250', t.received, 250)
  check('taught 3 hours', t.taughtMinutes, 180)
}

// ---------------------------------------------------------------------------
section('The real cases: paying short, and paying ahead')
{
  // owes 400, pays 350 -> still owes 50
  const short = [
    lesson('a', '2026-04-01'),
    lesson('b', '2026-04-08'),
    lesson('c', '2026-04-15'),
    lesson('d', '2026-04-22'),
    payment('p', '2026-04-25', 350, true),
  ]
  const s = buildLedger(perLesson, short)
  check(
    'three of four ticked off',
    ['a', 'b', 'c'].map((id) => s.lines.get(id)!.status),
    ['paid', 'paid', 'paid'],
  )
  check('the fourth stays unpaid', s.lines.get('d')!.status, 'due')
  check('50 sits as credit', s.credit, 50)
  check('100 unpaid', s.unpaid, 100)
  check('owes 50', s.owed, 50)

  // owes 480, pays 500 -> 20 credit, not enough for another lesson
  const at120: Class = { ...perLesson, price_per_lesson: 120 }
  const ahead = [
    lesson('a', '2026-05-01'),
    lesson('b', '2026-05-08'),
    lesson('c', '2026-05-15'),
    lesson('d', '2026-05-22'),
    payment('p', '2026-05-02', 500, true),
  ]
  const o = buildLedger(at120, ahead)
  check('all four lessons ticked off', o.unpaid, 0)
  check('20 left as credit', o.credit, 20)
  check('owed goes negative - you hold their money', o.owed, -20)

  const next = [...ahead, lesson('e', '2026-05-29')]
  const n = buildLedger(at120, next)
  check('20 credit does not cover the next lesson', n.lines.get('e')!.status, 'due')
  check('credit still 20', n.credit, 20)
  check('now owed 100', n.owed, 100)
}

// ---------------------------------------------------------------------------
section('A struck-out lesson charges nothing but keeps its time')
{
  const entries = [
    lesson('l1', '2026-03-04'),
    lesson('l2', '2026-03-11', { presence: 'cancellation', not_charged: true }),
  ]
  const led = buildLedger(perLesson, entries)
  const t = totalsFor(entries, led.lines)
  check('only the chargeable lesson counts', t.charged, 100)
  check('both still count as scheduled time', t.scheduledMinutes, 120)
  check('taught time excludes the cancellation', t.taughtMinutes, 60)
  check('the struck lesson adds nothing to the debt', led.unpaid, 100)
}

// ---------------------------------------------------------------------------
section('Presence rules')
{
  const noShow = [lesson('l1', '2026-03-04', { presence: 'no_show' })]
  const ns = totalsFor(noShow, buildLedger(perLesson, noShow).lines)
  check('a no-show still charges', ns.charged, 100)
  check('a no-show is not taught time', ns.taughtMinutes, 0)

  const late = [lesson('l1', '2026-03-04', { presence: 'late_cancellation' })]
  check('a late cancellation charges', totalsFor(late, buildLedger(perLesson, late).lines).charged, 100)
}

// ---------------------------------------------------------------------------
section('Per-lesson price override')
{
  const entries = [lesson('l1', '2026-03-04', { amount: 150 })]
  check(
    'the override wins over the class price',
    totalsFor(entries, buildLedger(perLesson, entries).lines).charged,
    150,
  )

  const zero = [lesson('l1', '2026-03-04', { amount: 0 })]
  check(
    'an override of zero is honoured, not treated as blank',
    totalsFor(zero, buildLedger(perLesson, zero).lines).charged,
    0,
  )
}

// ---------------------------------------------------------------------------
section('An unticked payment row is only an expectation')
{
  const entries = [lesson('l1', '2026-03-04'), payment('p1', '2026-03-31', 100, false)]
  const led = buildLedger(perLesson, entries)
  const t = totalsFor(entries, led.lines)
  check('it adds no credit', t.received, 0)
  check('and does not double-charge', t.charged, 100)
  check('it is tracked separately as expected', t.expected, 100)
  check('no credit built up', led.credit, 0)
  check('still owed in full', led.owed, 100)
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
  const led = buildLedger(monthly, entries)
  const t = totalsFor(entries, led.lines)
  check('lessons themselves charge nothing', led.lines.get('l1')!.charge, 0)
  check('the invoice carries the charge', t.charged, 400)
  check('the month is settled', led.owed, 0)
  check('time is still counted', t.taughtMinutes, 240)

  const unpaidMonth = [...entries.slice(0, 4), payment('p1', '2026-03-01', 400, false)]
  check('an unpaid month is owed in full', buildLedger(monthly, unpaidMonth).owed, 400)
}

// ---------------------------------------------------------------------------
section('The ledger uses full history even when the view is filtered')
{
  const entries = [
    lesson('l1', '2026-02-25'),
    lesson('l2', '2026-03-04'),
    payment('p1', '2026-03-05', 200, true),
  ]
  const led = buildLedger(perLesson, entries) // built on everything
  const march = entries.filter((e) => (e.entry_date ?? e.due_date)!.startsWith('2026-03'))
  const t = totalsFor(march, led.lines)
  check('the March payment settles the February lesson', led.lines.get('l1')!.status, 'paid')
  check('and the March one too', led.lines.get('l2')!.status, 'paid')
  check('March alone charged', t.charged, 100)
  check('March alone received', t.received, 200)
  check('what is owed ignores the filter', led.owed, 0)
}

// ---------------------------------------------------------------------------
section('Edge cases')
{
  const none: Entry[] = []
  const empty = buildLedger(perLesson, none)
  check('an empty class owes nothing', empty.owed, 0)
  check('and has no lessons', totalsFor(none, empty.lines).lessonCount, 0)

  const noPrice: Class = { ...perLesson, price_per_lesson: null }
  const entries = [lesson('l1', '2026-03-04')]
  check(
    'a class with no price set charges nothing',
    totalsFor(entries, buildLedger(noPrice, entries).lines).charged,
    0,
  )

  const overpaid = [lesson('l1', '2026-03-04'), payment('p1', '2026-03-05', 500, true)]
  const op = buildLedger(perLesson, overpaid)
  check('overpaying leaves credit', op.credit, 400)
  check('with nothing unpaid', op.unpaid, 0)
  check('so owed is negative', op.owed, -400)

  const tiny = [lesson('l1', '2026-03-04'), payment('p1', '2026-03-05', 30, true)]
  const ty = buildLedger(perLesson, tiny)
  check('a payment too small to cover a lesson ticks nothing off', ty.lines.get('l1')!.status, 'due')
  check('it sits as credit instead', ty.credit, 30)
  check('the lesson is unpaid in full', ty.unpaid, 100)
  check('owed 70', ty.owed, 70)

  const cents = [
    lesson('l1', '2026-03-04', { amount: 33.33 }),
    lesson('l2', '2026-03-11', { amount: 33.33 }),
    lesson('l3', '2026-03-18', { amount: 33.34 }),
    payment('p1', '2026-03-20', 100, true),
  ]
  const c = buildLedger(perLesson, cents)
  check('awkward cents still settle exactly', c.owed, 0)
  check('with no phantom credit left over', c.credit, 0)
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
