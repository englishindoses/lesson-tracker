import { useMemo, useState } from 'react'
import { newId, nowISO, useStore } from '../data/store'
import { PRESENCE_META, PRESENCE_ORDER, type Entry, type Presence } from '../lib/types'
import { buildLedger, sortEntries, totalsFor, type Line } from '../lib/ledger'
import { addDays, duration, formatMonth, money, monthKey, todayISO } from '../lib/format'
import ClassEditor from './ClassEditor'
import Modal from './Modal'
import NumberField from './NumberField'

type PaidFilter = 'all' | 'paid' | 'unpaid'
type KindFilter = 'all' | 'lesson' | 'payment'

/** Everything a row editor needs, whether drawn as a table row or a card. */
interface RowProps {
  entry: Entry
  line: Line | undefined
  monthlyClass: boolean
  onPatch: (changes: Partial<Entry>) => void
  onPayOff: () => void
}

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
      amount: cls!.pricing_mode === 'monthly' ? cls!.monthly_price : cls!.price_per_lesson,
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
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const filtersActive = month !== 'all' || kind !== 'all' || paid !== 'all' || presence !== 'all'

  const rowProps = (entry: Entry): RowProps => ({
    entry,
    line: lines.get(entry.id),
    monthlyClass: cls.pricing_mode === 'monthly',
    onPatch: (changes) => patch(entry, changes),
    onPayOff: () => payOffLesson(entry),
  })

  const emptyMessage =
    classEntries.length === 0 ? 'Empty page. Add your first lesson.' : 'Nothing matches these filters.'

  return (
    <div className="pb-28 sm:pb-24">
      {/* ------------------------------------------------------------ header */}
      <div className="mb-3 flex flex-wrap items-start gap-2">
        <button className="btn no-print" onClick={onBack}>
          ← Classes
        </button>
        <div className="order-last w-full sm:order-none sm:mr-auto sm:w-auto">
          <h1 className="style-hand rule-under text-xl sm:text-2xl">{cls.name}</h1>
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
        <button className="btn no-print ml-auto sm:ml-0" onClick={() => setEditingClass(true)}>
          Edit class
        </button>
      </div>

      {/* ----------------------------------------------------------- filters */}
      <div className="no-print mb-3 flex flex-wrap items-center gap-2 text-sm">
        <select
          className="field field-inline"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Filter by month"
        >
          <option value="all">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {formatMonth(m)}
            </option>
          ))}
        </select>

        <select
          className="field field-inline"
          value={kind}
          onChange={(e) => setKind(e.target.value as KindFilter)}
          aria-label="Filter by row type"
        >
          <option value="all">Lessons &amp; payments</option>
          <option value="lesson">Lessons only</option>
          <option value="payment">Payments only</option>
        </select>

        <select
          className="field field-inline"
          value={paid}
          onChange={(e) => setPaid(e.target.value as PaidFilter)}
          aria-label="Filter by paid status"
        >
          <option value="all">Paid &amp; unpaid</option>
          <option value="unpaid">Unpaid only</option>
          <option value="paid">Paid only</option>
        </select>

        <select
          className="field field-inline"
          value={presence}
          onChange={(e) => setPresence(e.target.value as Presence | 'all')}
          aria-label="Filter by presence"
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

        <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
          <button className="btn flex-1 sm:flex-none" onClick={addPayment}>
            + Payment
          </button>
          <button className="btn btn-primary flex-1 sm:flex-none" onClick={addLesson}>
            + Lesson
          </button>
        </div>
      </div>

      {/* ------------------------------------------------- wide screens: table */}
      <div className="card hidden overflow-x-auto lg:block">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky-head">
            <tr className="border-b border-rule text-left text-xs uppercase tracking-wide text-ink-faint">
              <th className="w-8 px-2 py-2" title="Tick to not charge for this row" />
              <th className="px-2 py-2 font-normal">Date</th>
              <th className="w-24 px-2 py-2 font-normal">Length</th>
              <th className="w-44 px-2 py-2 font-normal">Presence</th>
              <th className="w-32 px-2 py-2 text-right font-normal">Amount</th>
              <th className="w-28 px-2 py-2 text-center font-normal">Paid</th>
              <th className="px-2 py-2 font-normal">Notes</th>
              <th className="w-20 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-ink-faint">
                  {emptyMessage}
                </td>
              </tr>
            )}

            {visible.map((entry) => (
              <TableRow
                key={entry.id}
                {...rowProps(entry)}
                expanded={expanded.has(entry.id)}
                onToggleExpanded={() => toggleExpanded(entry.id)}
                onRepeat={() => setRepeating(entry)}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------ narrow screens: cards */}
      <div className="space-y-2 lg:hidden">
        {visible.length === 0 && (
          <p className="card px-3 py-10 text-center text-sm text-ink-faint">{emptyMessage}</p>
        )}
        {visible.map((entry) => (
          <EntryCard
            key={entry.id}
            {...rowProps(entry)}
            onRepeat={() => setRepeating(entry)}
            onDelete={() => deleteEntry(entry.id)}
          />
        ))}
      </div>

      {/* ------------------------------------------------------------ totals */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-paper/95 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-3 py-2 sm:px-6">
          {/* phones: the number that matters, big, with the rest underneath */}
          <div className="flex items-baseline justify-between gap-3 lg:hidden">
            <span className="style-hand text-base">
              Total{filtersActive ? ' (filtered)' : ''}
            </span>
            <span className="flex items-baseline gap-2">
              <span className="text-xs text-ink-soft">Owed</span>
              <strong
                className={`tabular text-lg ${totals.owed > 0.005 ? 'text-danger' : 'text-good'}`}
              >
                {money(totals.owed)}
              </strong>
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-soft lg:hidden">
            <span>{totals.lessonCount} lessons</span>
            <span>Taught {duration(totals.taughtMinutes)}</span>
            <span>Charged {money(totals.charged)}</span>
            <span>Received {money(totals.received)}</span>
          </div>

          {/* laptops: one wide line */}
          <div className="hidden flex-wrap items-center gap-x-6 gap-y-1 text-sm lg:flex">
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
                className={`tabular text-lg ${totals.owed > 0.005 ? 'text-danger' : 'text-good'}`}
              >
                {money(totals.owed)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {editingClass && <ClassEditor cls={cls} existing onClose={() => setEditingClass(false)} />}

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

/* ==========================================================================
   Field editors, shared by the table and the cards so the two layouts can
   never drift apart in behaviour.
   ========================================================================== */

function StrikeBox({ entry, onPatch }: RowProps) {
  if (entry.kind !== 'lesson') return null
  return (
    <input
      type="checkbox"
      className="opacity-40 hover:opacity-100"
      checked={entry.not_charged}
      onChange={(e) => onPatch({ not_charged: e.target.checked })}
      title="Don't charge for this lesson"
      aria-label="Don't charge for this lesson"
    />
  )
}

function DateInput({ entry, onPatch }: RowProps) {
  const isLesson = entry.kind === 'lesson'
  return (
    <input
      type="date"
      className="field tabular"
      aria-label={isLesson ? 'Lesson date' : 'Due date'}
      value={(isLesson ? entry.entry_date : entry.due_date) ?? ''}
      onChange={(e) =>
        onPatch(isLesson ? { entry_date: e.target.value || null } : { due_date: e.target.value || null })
      }
    />
  )
}

function DurationInput({ entry, onPatch }: RowProps) {
  return (
    <NumberField
      min={0}
      step={5}
      className="field tabular"
      aria-label="Lesson length in minutes"
      value={entry.duration_min}
      onChange={(v) => onPatch({ duration_min: v })}
    />
  )
}

function PresenceSelect({ entry, onPatch }: RowProps) {
  return (
    <select
      className="field"
      aria-label="Presence"
      value={entry.presence ?? ''}
      onChange={(e) => {
        const next = (e.target.value || null) as Presence | null
        // Cancellations you don't charge for strike themselves out; you can
        // always untick it again.
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
  )
}

function AmountInput({ entry, line, monthlyClass, onPatch }: RowProps) {
  const isLesson = entry.kind === 'lesson'
  return (
    <NumberField
      min={0}
      step="0.01"
      className="field tabular text-right"
      aria-label={isLesson ? 'Price for this lesson' : 'Payment amount'}
      placeholder={isLesson ? (monthlyClass ? '—' : line ? line.charge.toFixed(2) : '') : ''}
      title={isLesson ? 'Leave blank to use the class price' : undefined}
      value={entry.amount}
      onChange={(v) => onPatch({ amount: v })}
    />
  )
}

function PaidControl({ entry, line, onPatch, onPayOff }: RowProps) {
  if (entry.kind === 'payment') {
    return (
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
            aria-label="Date paid"
          />
        )}
      </div>
    )
  }

  const status = line?.status

  if (status === 'free')
    return (
      <span className="text-xs text-ink-faint" title="Nothing to pay">
        —
      </span>
    )

  if (status === 'paid')
    return (
      <span className="text-good" title="Covered by a payment">
        ✓
      </span>
    )

  if (status === 'part')
    return (
      <button
        className="text-xs text-ink-soft underline"
        onClick={onPayOff}
        title="Partly paid — tap to settle the rest"
      >
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

function NotesInput({ entry, onPatch }: RowProps) {
  const isLesson = entry.kind === 'lesson'
  return (
    <input
      className="field"
      aria-label={isLesson ? 'Lesson notes' : 'Note'}
      placeholder={isLesson ? 'Lesson notes…' : 'Note…'}
      value={(isLesson ? entry.lesson_notes : entry.extra_notes) ?? ''}
      onChange={(e) =>
        onPatch(
          isLesson ? { lesson_notes: e.target.value || null } : { extra_notes: e.target.value || null },
        )
      }
    />
  )
}

function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false)
  return (
    <button
      className={`px-1 ${confirm ? 'text-danger' : 'text-ink-faint hover:text-danger'}`}
      onClick={() => (confirm ? onDelete() : setConfirm(true))}
      onBlur={() => setConfirm(false)}
      title={confirm ? 'Tap again to delete' : 'Delete row'}
      aria-label={confirm ? 'Confirm delete' : 'Delete row'}
    >
      {confirm ? '✓×' : '×'}
    </button>
  )
}

/* ------------------------------------------------------- wide screens: table */

function TableRow(
  props: RowProps & {
    expanded: boolean
    onToggleExpanded: () => void
    onRepeat: () => void
    onDelete: () => void
  },
) {
  const { entry, onPatch, expanded, onToggleExpanded, onRepeat, onDelete } = props
  const isLesson = entry.kind === 'lesson'
  const struck = isLesson && entry.not_charged
  const cell = struck ? 'struck' : ''

  return (
    <>
      <tr className={`border-b border-rule align-middle ${isLesson ? '' : 'row-payment'}`}>
        <td className="px-2 py-1.5">
          <StrikeBox {...props} />
        </td>

        <td className={`px-2 py-1.5 ${cell}`}>
          <DateInput {...props} />
          {!isLesson && <div className="mt-0.5 text-xs text-ink-faint">due</div>}
        </td>

        <td className={`px-2 py-1.5 ${cell}`}>
          {isLesson ? <DurationInput {...props} /> : <span className="text-xs text-ink-faint">—</span>}
        </td>

        <td className={`px-2 py-1.5 ${cell}`}>
          {isLesson ? (
            <PresenceSelect {...props} />
          ) : (
            <span className="text-xs uppercase tracking-wide text-ink-soft">Payment</span>
          )}
        </td>

        <td className={`px-2 py-1.5 text-right ${cell}`}>
          <AmountInput {...props} />
        </td>

        <td className="px-2 py-1.5 text-center">
          <PaidControl {...props} />
        </td>

        <td className={`px-2 py-1.5 ${cell}`}>
          <NotesInput {...props} />
        </td>

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
            <DeleteButton onDelete={onDelete} />
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
              aria-label="Extra notes"
              value={entry.extra_notes ?? ''}
              onChange={(e) => onPatch({ extra_notes: e.target.value || null })}
            />
          </td>
        </tr>
      )}
    </>
  )
}

/* ----------------------------------------------------- narrow screens: cards */

function EntryCard(props: RowProps & { onRepeat: () => void; onDelete: () => void }) {
  const { entry, onPatch, onRepeat, onDelete } = props
  const [showExtra, setShowExtra] = useState(Boolean(entry.extra_notes))
  const isLesson = entry.kind === 'lesson'
  const struck = isLesson && entry.not_charged

  return (
    <div className={`card p-3 ${isLesson ? '' : 'row-payment'} ${struck ? 'struck' : ''}`}>
      <div className="flex items-center gap-2">
        {isLesson ? (
          <StrikeBox {...props} />
        ) : (
          <span className="text-xs uppercase tracking-wide text-ink-soft">Payment</span>
        )}
        <div className="min-w-0 flex-1">
          <DateInput {...props} />
        </div>
        {isLesson && (
          <button
            className="px-1 text-ink-faint"
            onClick={onRepeat}
            title="Repeat weekly"
            aria-label="Repeat weekly"
          >
            ⟳
          </button>
        )}
        <DeleteButton onDelete={onDelete} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {isLesson && (
          <label className="col-span-2 block text-xs text-ink-soft">
            Presence
            <PresenceSelect {...props} />
          </label>
        )}

        {isLesson && (
          <label className="block text-xs text-ink-soft">
            Minutes
            <DurationInput {...props} />
          </label>
        )}

        <label className={`block text-xs text-ink-soft ${isLesson ? '' : 'col-span-1'}`}>
          Amount (R$)
          <AmountInput {...props} />
        </label>

        <div className={`text-xs text-ink-soft ${isLesson ? 'col-span-2' : 'col-span-1'}`}>
          <span className="mb-1 block">Paid</span>
          <div className="flex items-center gap-2">
            <PaidControl {...props} />
          </div>
        </div>
      </div>

      <div className="mt-2">
        <NotesInput {...props} />
      </div>

      {isLesson &&
        (showExtra ? (
          <input
            className="field mt-2"
            placeholder="Extra notes — homework, materials…"
            aria-label="Extra notes"
            value={entry.extra_notes ?? ''}
            onChange={(e) => onPatch({ extra_notes: e.target.value || null })}
          />
        ) : (
          <button
            className="mt-1 text-xs text-ink-faint underline"
            onClick={() => setShowExtra(true)}
          >
            + extra notes
          </button>
        ))}
    </div>
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
  // Nullable so the box can be cleared and retyped without snapping back.
  const [times, setTimes] = useState<number | null>(4)
  const count = Math.min(52, Math.max(1, times ?? 1))

  return (
    <Modal
      title="Repeat weekly"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={times == null}
            onClick={() => onConfirm(count)}
          >
            Add {count} {count === 1 ? 'lesson' : 'lessons'}
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-ink-soft">
        Copies this lesson forward, one week apart, starting the week after {entry.entry_date}.
        Notes and presence start fresh on each copy.
      </p>
      <label className="block text-sm">
        <span className="mb-1 block text-ink-soft">How many?</span>
        <NumberField
          min={1}
          max={52}
          className="field tabular"
          value={times}
          fallback={4}
          onChange={setTimes}
        />
      </label>
    </Modal>
  )
}
