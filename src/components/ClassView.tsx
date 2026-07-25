import { useMemo, useState } from 'react'
import { newId, nowISO, useStore } from '../data/store'
import {
  PRESENCE_META,
  PRESENCE_ORDER,
  type Entry,
  type Presence,
} from '../lib/types'
import { buildLedger, sortEntries, totalsFor, type Line } from '../lib/ledger'
import { addDays, duration, formatMonth, money, monthKey, todayISO } from '../lib/format'
import ClassEditor from './ClassEditor'
import Modal from './Modal'

type PaidFilter = 'all' | 'paid' | 'unpaid'
type KindFilter = 'all' | 'lesson' | 'payment'

export default function ClassView({
  classId,
  onBack,
}: {
  classId: string
  onBack: () => void
}) {
  const userId = useStore((s) => s.userId)!
  const cls = useStore((s) => s.classes.find((c) => c.id === classId))
  const students = useStore((s) => s.students)
  const roster = useStore((s) => s.class_students)
  const allEntries = useStore((s) => s.entries)
  const upsertEntry = useStore((s) => s.upsertEntry)
  const upsertEntries = useStore((s) => s.upsertEntries)
  const deleteEntry = useStore((s) => s.deleteEntry)

  const [editingClass, setEditingClass] = useState(false)
  const [month, setMonth] = useState<string>('all')
  const [kind, setKind] = useState<KindFilter>('all')
  const [paid, setPaid] = useState<PaidFilter>('all')
  const [presence, setPresence] = useState<Presence | 'all'>('all')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [repeating, setRepeating] = useState<Entry | null>(null)

  const classEntries = useMemo(
    () => allEntries.filter((e) => e.class_id === classId),
    [allEntries, classId],
  )

  // The ledger is always built on the whole history, never the filtered view.
  const lines = useMemo(
    () => (cls ? buildLedger(cls, classEntries) : new Map<string, Line>()),
    [cls, classEntries],
  )

  const months = useMemo(() => {
    const set = new Set<string>()
    for (const e of classEntries) {
      const k = monthKey(e.entry_date ?? e.due_date)
      if (k) set.add(k)
    }
    return [...set].sort().reverse()
  }, [classEntries])

  const visible = useMemo(() => {
    return sortEntries(classEntries).filter((e) => {
      if (month !== 'all' && monthKey(e.entry_date ?? e.due_date) !== month) return false
      if (kind !== 'all' && e.kind !== kind) return false
      if (presence !== 'all' && e.presence !== presence) return false
      if (paid !== 'all') {
        const status = lines.get(e.id)?.status
        const isPaid = status === 'paid' || status === 'received' || status === 'free'
        if (paid === 'paid' && !isPaid) return false
        if (paid === 'unpaid' && isPaid) return false
      }
      return true
    })
  }, [classEntries, month, kind, paid, presence, lines])

  const totals = useMemo(() => totalsFor(visible, lines), [visible, lines])

  const names = useMemo(
    () =>
      roster
        .filter((cs) => cs.class_id === classId)
        .map((cs) => students.find((s) => s.id === cs.student_id)?.name)
        .filter(Boolean)
        .sort() as string[],
    [roster, students, classId],
  )

  if (!cls) {
    return (
      <div className="py-10 text-center text-sm text-ink-faint">
        That class is gone.{' '}
        <button className="underline" onClick={onBack}>
          Back
        </button>
      </div>
    )
  }

  const baseEntry = (): Omit<Entry, 'kind'> => ({
    id: newId(),
    user_id: userId,
    class_id: classId,
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
    created_at: nowISO(),
    updated_at: nowISO(),
  })

  const lastLessonDate = () =>
    sortEntries(classEntries.filter((e) => e.kind === 'lesson')).at(-1)?.entry_date

  function addLesson() {
    const previous = lastLessonDate()
    upsertEntry({
      ...baseEntry(),
      kind: 'lesson',
      // Weekly classes are the norm, so guess a week after the last one.
      entry_date: previous ? addDays(previous, 7) : todayISO(),
      duration_min: cls!.default_duration_min,
      presence: 'present',
    })
  }

  function addPayment() {
    upsertEntry({
      ...baseEntry(),
      kind: 'payment',
      due_date: todayISO(),
      amount:
        cls!.pricing_mode === 'monthly' ? cls!.monthly_price : cls!.price_per_lesson,
    })
  }

  const patch = (entry: Entry, changes: Partial<Entry>) =>
    upsertEntry({ ...entry, ...changes, updated_at: nowISO() })

  /** Ticking "paid" on a lesson records the money as an actual payment row. */
  function payOffLesson(entry: Entry) {
    const line = lines.get(entry.id)
    if (!line) return
    const remaining = line.charge - line.covered
    if (remaining <= 0.005) return
    upsertEntry({
      ...baseEntry(),
      kind: 'payment',
      due_date: entry.entry_date,
      amount: Number(remaining.toFixed(2)),
      paid: true,
      paid_date: todayISO(),
      extra_notes: 'Paid at the lesson',
    })
  }

  function repeatWeekly(entry: Entry, times: number) {
    if (!entry.entry_date) return
    const copies: Entry[] = []
    for (let i = 1; i <= times; i++) {
      copies.push({
        ...entry,
        id: newId(),
        entry_date: addDays(entry.entry_date, 7 * i),
        presence: 'present',
        not_charged: false,
        paid: false,
        paid_date: null,
        lesson_notes: null,
        extra_notes: null,
        created_at: nowISO(),
        updated_at: nowISO(),
      })
    }
    upsertEntries(copies)
  }

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const filtersActive =
    month !== 'all' || kind !== 'all' || paid !== 'all' || presence !== 'all'

  return (
    <div className="pb-32">
      {/* ------------------------------------------------------------ header */}
      <div className="mb-3 flex flex-wrap items-start gap-2">
        <button className="btn no-print" onClick={onBack}>
          ← Classes
        </button>
        <div className="mr-auto">
          <h1 className="style-hand rule-under text-2xl">{cls.name}</h1>
          <div className="mt-1 text-xs text-ink-soft">
            {names.length ? names.join(', ') : 'No students yet'}
            {' · '}
            {cls.lesson_type ? `${cls.lesson_type} · ` : ''}
            {cls.default_duration_min} min ·{' '}
            {cls.pricing_mode === 'per_lesson'
              ? `${cls.price_per_lesson != null ? money(cls.price_per_lesson) : '—'} per lesson`
              : `${cls.monthly_price != null ? money(cls.monthly_price) : '—'} per month`}
          </div>
        </div>
        <button className="btn no-print" onClick={() => setEditingClass(true)}>
          Edit class
        </button>
      </div>

      {/* ----------------------------------------------------------- filters */}
      <div className="no-print mb-3 flex flex-wrap items-center gap-2 text-sm">
        <select className="field w-auto" value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {formatMonth(m)}
            </option>
          ))}
        </select>

        <select
          className="field w-auto"
          value={kind}
          onChange={(e) => setKind(e.target.value as KindFilter)}
        >
          <option value="all">Lessons &amp; payments</option>
          <option value="lesson">Lessons only</option>
          <option value="payment">Payments only</option>
        </select>

        <select
          className="field w-auto"
          value={paid}
          onChange={(e) => setPaid(e.target.value as PaidFilter)}
        >
          <option value="all">Paid &amp; unpaid</option>
          <option value="unpaid">Unpaid only</option>
          <option value="paid">Paid only</option>
        </select>

        <select
          className="field w-auto"
          value={presence}
          onChange={(e) => setPresence(e.target.value as Presence | 'all')}
        >
          <option value="all">Any presence</option>
          {PRESENCE_ORDER.map((p) => (
            <option key={p} value={p}>
              {PRESENCE_META[p].glyph} {PRESENCE_META[p].label}
            </option>
          ))}
        </select>

        {filtersActive && (
          <button
            className="btn"
            onClick={() => {
              setMonth('all')
              setKind('all')
              setPaid('all')
              setPresence('all')
            }}
          >
            Clear filters
          </button>
        )}

        <span className="ml-auto flex gap-2">
          <button className="btn" onClick={addPayment}>
            + Payment
          </button>
          <button className="btn btn-primary" onClick={addLesson}>
            + Lesson
          </button>
        </span>
      </div>

      {/* ------------------------------------------------------------- table */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead className="sticky-head">
            <tr className="border-b border-rule text-left text-xs uppercase tracking-wide text-ink-faint">
              <th className="w-8 px-2 py-2" title="Tick to not charge for this row"></th>
              <th className="px-2 py-2 font-normal">Date</th>
              <th className="w-24 px-2 py-2 font-normal">Length</th>
              <th className="w-40 px-2 py-2 font-normal">Presence</th>
              <th className="w-28 px-2 py-2 text-right font-normal">Amount</th>
              <th className="w-24 px-2 py-2 text-center font-normal">Paid</th>
              <th className="px-2 py-2 font-normal">Notes</th>
              <th className="w-20 px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-ink-faint">
                  {classEntries.length === 0
                    ? 'Empty page. Add your first lesson.'
                    : 'Nothing matches these filters.'}
                </td>
              </tr>
            )}

            {visible.map((entry) => (
              <Row
                key={entry.id}
                entry={entry}
                line={lines.get(entry.id)}
                monthlyClass={cls.pricing_mode === 'monthly'}
                expanded={expanded.has(entry.id)}
                onToggleExpanded={() => toggleExpanded(entry.id)}
                onPatch={(changes) => patch(entry, changes)}
                onPayOff={() => payOffLesson(entry)}
                onRepeat={() => setRepeating(entry)}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------ totals */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-3 py-2.5 text-sm sm:px-5">
          <span className="style-hand text-base">
            Total{filtersActive ? ' (filtered)' : ''}
          </span>
          <Stat label="Lessons" value={String(totals.lessonCount)} />
          <Stat label="Taught" value={duration(totals.taughtMinutes)} />
          <Stat label="Scheduled" value={duration(totals.scheduledMinutes)} />
          <Stat label="Charged" value={money(totals.charged)} />
          <Stat label="Received" value={money(totals.received)} />
          <span className="ml-auto flex items-baseline gap-2">
            <span className="text-ink-soft">Owed</span>
            <strong
              className={`tabular text-lg ${
                totals.owed > 0.005 ? 'text-danger' : 'text-good'
              }`}
            >
              {money(totals.owed)}
            </strong>
          </span>
        </div>
      </div>

      {editingClass && (
        <ClassEditor cls={cls} existing onClose={() => setEditingClass(false)} />
      )}

      {repeating && (
        <RepeatDialog
          entry={repeating}
          onClose={() => setRepeating(null)}
          onConfirm={(n) => {
            repeatWeekly(repeating, n)
            setRepeating(null)
          }}
        />
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-xs text-ink-faint">{label}</span>
      <span className="tabular">{value}</span>
    </span>
  )
}

/* ========================================================================== */

function Row({
  entry,
  line,
  monthlyClass,
  expanded,
  onToggleExpanded,
  onPatch,
  onPayOff,
  onRepeat,
  onDelete,
}: {
  entry: Entry
  line: Line | undefined
  monthlyClass: boolean
  expanded: boolean
  onToggleExpanded: () => void
  onPatch: (changes: Partial<Entry>) => void
  onPayOff: () => void
  onRepeat: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isLesson = entry.kind === 'lesson'
  const struck = isLesson && entry.not_charged
  const status = line?.status

  const cellText = struck ? 'struck' : ''

  return (
    <>
      <tr
        className={`border-b border-rule align-middle ${isLesson ? '' : 'row-payment'}`}
      >
        {/* the discreet strike-out box */}
        <td className="px-2 py-1.5">
          {isLesson && (
            <input
              type="checkbox"
              className="opacity-40 hover:opacity-100"
              checked={entry.not_charged}
              onChange={(e) => onPatch({ not_charged: e.target.checked })}
              title="Don't charge for this lesson"
              aria-label="Don't charge for this lesson"
            />
          )}
        </td>

        {/* date */}
        <td className={`px-2 py-1.5 ${cellText}`}>
          <input
            type="date"
            className="field tabular"
            value={(isLesson ? entry.entry_date : entry.due_date) ?? ''}
            onChange={(e) =>
              onPatch(
                isLesson
                  ? { entry_date: e.target.value || null }
                  : { due_date: e.target.value || null },
              )
            }
          />
          {!isLesson && <div className="mt-0.5 text-xs text-ink-faint">due</div>}
        </td>

        {/* duration */}
        <td className={`px-2 py-1.5 ${cellText}`}>
          {isLesson ? (
            <input
              type="number"
              min={0}
              step={5}
              className="field tabular"
              value={entry.duration_min ?? ''}
              onChange={(e) =>
                onPatch({
                  duration_min: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          ) : (
            <span className="text-xs text-ink-faint">—</span>
          )}
        </td>

        {/* presence */}
        <td className={`px-2 py-1.5 ${cellText}`}>
          {isLesson ? (
            <select
              className="field"
              value={entry.presence ?? ''}
              onChange={(e) => {
                const next = (e.target.value || null) as Presence | null
                // Cancellations you don't charge for strike themselves out;
                // you can always untick it again.
                onPatch({
                  presence: next,
                  not_charged: next ? !PRESENCE_META[next].chargeable : entry.not_charged,
                })
              }}
            >
              <option value="">—</option>
              {PRESENCE_ORDER.map((p) => (
                <option key={p} value={p}>
                  {PRESENCE_META[p].glyph} {PRESENCE_META[p].label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs uppercase tracking-wide text-ink-soft">Payment</span>
          )}
        </td>

        {/* amount */}
        <td className={`px-2 py-1.5 text-right ${cellText}`}>
          {isLesson ? (
            <input
              type="number"
              min={0}
              step="0.01"
              className="field tabular text-right"
              placeholder={
                monthlyClass ? '—' : line ? String(line.charge.toFixed(2)) : ''
              }
              value={entry.amount ?? ''}
              onChange={(e) =>
                onPatch({ amount: e.target.value === '' ? null : Number(e.target.value) })
              }
              title="Leave blank to use the class price"
            />
          ) : (
            <input
              type="number"
              min={0}
              step="0.01"
              className="field tabular text-right"
              value={entry.amount ?? ''}
              onChange={(e) =>
                onPatch({ amount: e.target.value === '' ? null : Number(e.target.value) })
              }
            />
          )}
        </td>

        {/* paid */}
        <td className="px-2 py-1.5 text-center">
          {isLesson ? (
            <LessonPaidCell status={status} onPayOff={onPayOff} />
          ) : (
            <div className="flex flex-col items-center gap-0.5">
              <input
                type="checkbox"
                checked={entry.paid}
                onChange={(e) =>
                  onPatch({
                    paid: e.target.checked,
                    paid_date: e.target.checked ? entry.paid_date ?? todayISO() : null,
                  })
                }
                aria-label="Payment received"
              />
              {entry.paid && (
                <input
                  type="date"
                  className="field tabular text-xs"
                  value={entry.paid_date ?? ''}
                  onChange={(e) => onPatch({ paid_date: e.target.value || null })}
                  title="Date paid"
                />
              )}
            </div>
          )}
        </td>

        {/* notes */}
        <td className={`px-2 py-1.5 ${cellText}`}>
          <input
            className="field"
            placeholder={isLesson ? 'Lesson notes…' : 'Note…'}
            value={(isLesson ? entry.lesson_notes : entry.extra_notes) ?? ''}
            onChange={(e) =>
              onPatch(
                isLesson
                  ? { lesson_notes: e.target.value || null }
                  : { extra_notes: e.target.value || null },
              )
            }
          />
        </td>

        {/* row actions */}
        <td className="px-1 py-1.5 text-right">
          <div className="flex items-center justify-end gap-0.5">
            {isLesson && (
              <>
                <button
                  className="px-1 text-ink-faint hover:text-ink"
                  onClick={onToggleExpanded}
                  title="Extra notes"
                  aria-label="Extra notes"
                >
                  {expanded ? '▾' : '▸'}
                </button>
                <button
                  className="px-1 text-ink-faint hover:text-ink"
                  onClick={onRepeat}
                  title="Repeat weekly"
                  aria-label="Repeat weekly"
                >
                  ⟳
                </button>
              </>
            )}
            <button
              className={`px-1 ${confirmDelete ? 'text-danger' : 'text-ink-faint hover:text-danger'}`}
              onClick={() => (confirmDelete ? onDelete() : setConfirmDelete(true))}
              onBlur={() => setConfirmDelete(false)}
              title={confirmDelete ? 'Click again to delete' : 'Delete row'}
              aria-label="Delete row"
            >
              {confirmDelete ? '✓×' : '×'}
            </button>
          </div>
        </td>
      </tr>

      {expanded && isLesson && (
        <tr className="border-b border-rule">
          <td />
          <td colSpan={7} className="px-2 pb-2">
            <input
              className="field"
              placeholder="Extra notes — homework set, materials, anything else"
              value={entry.extra_notes ?? ''}
              onChange={(e) => onPatch({ extra_notes: e.target.value || null })}
            />
          </td>
        </tr>
      )}
    </>
  )
}

function LessonPaidCell({
  status,
  onPayOff,
}: {
  status: Line['status'] | undefined
  onPayOff: () => void
}) {
  if (status === 'free')
    return <span className="text-xs text-ink-faint" title="Nothing to pay">—</span>

  if (status === 'paid')
    return (
      <span className="text-good" title="Covered by a payment">
        ✓
      </span>
    )

  if (status === 'part')
    return (
      <button className="text-xs text-ink-soft" onClick={onPayOff} title="Partly paid — click to settle the rest">
        part
      </button>
    )

  return (
    <button
      className="text-ink-faint hover:text-ink"
      onClick={onPayOff}
      title="Mark paid — adds a payment row for this amount, dated today"
      aria-label="Mark paid"
    >
      ☐
    </button>
  )
}

/* ========================================================================== */

function RepeatDialog({
  entry,
  onClose,
  onConfirm,
}: {
  entry: Entry
  onClose: () => void
  onConfirm: (times: number) => void
}) {
  const [times, setTimes] = useState(4)

  return (
    <Modal
      title="Repeat weekly"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={() => onConfirm(times)}>
            Add {times} {times === 1 ? 'lesson' : 'lessons'}
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-ink-soft">
        Copies this lesson forward, one week apart, starting the week after{' '}
        {entry.entry_date}. Notes and presence start fresh on each copy.
      </p>
      <label className="block text-sm">
        <span className="mb-1 block text-ink-soft">How many?</span>
        <input
          type="number"
          min={1}
          max={52}
          className="field tabular"
          value={times}
          onChange={(e) => setTimes(Math.min(52, Math.max(1, Number(e.target.value) || 1)))}
        />
      </label>
    </Modal>
  )
}
