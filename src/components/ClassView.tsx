import { useMemo, useState } from 'react'
import { newId, nowISO, useStore } from '../data/store'
import { PRESENCE_META, PRESENCE_ORDER, type Entry, type Presence } from '../lib/types'
import { buildLedger, sortEntries, totalsFor, type Line } from '../lib/ledger'
import {
  addDays,
  addMonths,
  duration,
  formatMonth,
  money,
  moneySigned,
  monthKey,
  todayISO,
} from '../lib/format'
import ClassEditor from './ClassEditor'
import Modal from './Modal'
import NumberField from './NumberField'
import CalendarView from './CalendarView'
import EntryDialog from './EntryDialog'
import {
  AmountInput,
  DateInput,
  DeleteButton,
  DurationInput,
  NotesInput,
  PaidControl,
  PresenceSelect,
  StrikeBox,
  type RowProps,
} from './EntryFields'

type PaidFilter = 'all' | 'paid' | 'unpaid'
type KindFilter = 'all' | 'lesson' | 'payment'
type ViewMode = 'list' | 'calendar'

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
  const [openEntryId, setOpenEntryId] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>(
    () => (localStorage.getItem('lt.classView') as ViewMode) || 'list',
  )
  // Pinning is a preference, so it survives reloads and applies to every class.
  const [pinned, setPinned] = useState(() => localStorage.getItem('lt.pinFilters') !== 'off')

  const classEntries = useMemo(
    () => allEntries.filter((e) => e.class_id === classId),
    [allEntries, classId],
  )

  // The ledger is always built on the whole history, never the filtered view:
  // credit and what's owed describe the student, not the month on screen.
  const ledger = useMemo(
    () =>
      cls
        ? buildLedger(cls, classEntries)
        : { lines: new Map<string, Line>(), credit: 0, unpaid: 0, owed: 0 },
    [cls, classEntries],
  )
  const lines = ledger.lines

  const months = useMemo(() => {
    const set = new Set<string>()
    for (const e of classEntries) {
      const k = monthKey(e.entry_date ?? e.due_date)
      if (k) set.add(k)
    }
    return [...set].sort().reverse()
  }, [classEntries])

  // In calendar mode a concrete month is always on screen, so the filter and
  // the totals stay honest about what you're looking at.
  const calendarMonth = month === 'all' ? monthKey(todayISO()) : month

  const matching = useMemo(() => {
    const effectiveMonth = view === 'calendar' ? calendarMonth : month
    return sortEntries(classEntries).filter((e) => {
      if (effectiveMonth !== 'all' && monthKey(e.entry_date ?? e.due_date) !== effectiveMonth)
        return false
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
  }, [classEntries, view, calendarMonth, month, kind, paid, presence, lines])

  /**
   * A row you're editing shouldn't slide away under your cursor. While a row
   * has focus its position is held, and it stays on screen even if the edit
   * makes it stop matching the filters. It settles when you move away.
   */
  const [held, setHeld] = useState<{ order: string[]; rowId: string } | null>(null)

  const holdOrder = (rowId: string) => {
    // Recompute from scratch, which also settles whichever row was held before.
    setHeld({ order: sortEntries(classEntries).map((e) => e.id), rowId })
  }

  const visible = useMemo(() => {
    if (!held) return matching
    const rank = new Map(held.order.map((id, i) => [id, i]))
    const shown = [...matching]
    // Keep the row being edited on screen even if it no longer matches.
    if (!shown.some((e) => e.id === held.rowId)) {
      const editing = classEntries.find((e) => e.id === held.rowId)
      if (editing) shown.push(editing)
    }
    return shown.sort(
      (a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER),
    )
  }, [matching, held, classEntries])

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

  function newLessonOn(dateISO: string): Entry {
    return {
      ...baseEntry(),
      kind: 'lesson',
      entry_date: dateISO,
      duration_min: cls!.default_duration_min,
      presence: 'present',
    }
  }

  function addLesson() {
    const previous = lastLessonDate()
    // Weekly classes are the norm, so guess a week after the last one.
    upsertEntry(newLessonOn(previous ? addDays(previous, 7) : todayISO()))
  }

  function addPayment() {
    upsertEntry({
      ...baseEntry(),
      kind: 'payment',
      due_date: todayISO(),
      amount: cls!.pricing_mode === 'monthly' ? cls!.monthly_price : cls!.price_per_lesson,
    })
  }

  /** The + inside a calendar square: create there, then open it for filling in. */
  function addOnDay(dateISO: string) {
    const entry = newLessonOn(dateISO)
    upsertEntry(entry)
    setOpenEntryId(entry.id)
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

  /** Turn a freshly added row into the other kind, carrying its date across. */
  function switchKind(entry: Entry, next: Entry['kind']) {
    if (entry.kind === next) return
    const date = entry.entry_date ?? entry.due_date
    patch(
      entry,
      next === 'lesson'
        ? {
            kind: 'lesson',
            entry_date: date,
            due_date: null,
            duration_min: cls!.default_duration_min,
            presence: 'present',
          }
        : {
            kind: 'payment',
            due_date: date,
            entry_date: null,
            duration_min: null,
            presence: null,
            not_charged: false,
            amount:
              cls!.pricing_mode === 'monthly' ? cls!.monthly_price : cls!.price_per_lesson,
          },
    )
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

  const setViewMode = (next: ViewMode) => {
    setView(next)
    localStorage.setItem('lt.classView', next)
  }

  const filtersActive =
    (view === 'list' && month !== 'all') ||
    kind !== 'all' ||
    paid !== 'all' ||
    presence !== 'all'

  const rowProps = (entry: Entry): RowProps => ({
    entry,
    line: lines.get(entry.id),
    monthlyClass: cls.pricing_mode === 'monthly',
    onPatch: (changes) => patch(entry, changes),
    onPayOff: () => payOffLesson(entry),
  })

  const openEntry = openEntryId ? classEntries.find((e) => e.id === openEntryId) : undefined

  const emptyMessage =
    classEntries.length === 0
      ? 'Empty page. Add your first lesson.'
      : 'Nothing matches these filters.'

  return (
    <div className="pb-28 sm:pb-24">
      {/* ------------------------------------------------------------ header */}
      <div className="mb-3 flex flex-wrap items-start gap-2">
        <button className="btn no-print" onClick={onBack}>
          ← Back
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
      <div
        style={pinned ? { top: 'var(--header-h, 3.25rem)' } : undefined}
        className={`no-print mb-3 flex flex-wrap items-center gap-2 text-sm ${
          pinned ? 'sticky z-20 -mx-3 border-b border-rule bg-paper px-3 py-2 sm:-mx-6 sm:px-6' : ''
        }`}
      >
        {/* list / calendar */}
        <div className="flex overflow-hidden rounded border border-ink-faint">
          {(
            [
              ['list', 'List'],
              ['calendar', 'Calendar'],
            ] as [ViewMode, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setViewMode(value)}
              aria-pressed={view === value}
              className={`px-2.5 py-1 ${
                view === value ? 'bg-accent text-paper' : 'text-ink-soft hover:bg-accent-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'calendar' ? (
          <div className="flex items-center gap-1">
            <button
              className="btn px-2"
              onClick={() => setMonth(addMonths(calendarMonth, -1))}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="min-w-[8.5rem] text-center">{formatMonth(calendarMonth)}</span>
            <button
              className="btn px-2"
              onClick={() => setMonth(addMonths(calendarMonth, 1))}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        ) : (
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
        )}

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
              if (view === 'list') setMonth('all')
              setKind('all')
              setPaid('all')
              setPresence('all')
            }}
          >
            Clear filters
          </button>
        )}

        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <button className="btn flex-1 sm:flex-none" onClick={addPayment}>
            + Payment
          </button>
          <button className="btn btn-primary flex-1 sm:flex-none" onClick={addLesson}>
            + Lesson
          </button>
          <button
            className={`btn shrink-0 px-2 ${pinned ? 'text-accent' : 'text-ink-faint'}`}
            aria-pressed={pinned}
            aria-label={pinned ? 'Unpin filters' : 'Pin filters to the top'}
            title={pinned ? 'Filters stay on screen — tap to unpin' : 'Pin filters to the top'}
            onClick={() => {
              const next = !pinned
              setPinned(next)
              localStorage.setItem('lt.pinFilters', next ? 'on' : 'off')
            }}
          >
            {pinned ? '📌' : '📍'}
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <CalendarView
          month={calendarMonth}
          entries={visible}
          lines={lines}
          onAdd={addOnDay}
          onOpen={(entry) => setOpenEntryId(entry.id)}
        />
      ) : (
        <div
          onFocus={(e) => {
            const row = (e.target as HTMLElement).closest('[data-entry-id]')
            const id = row?.getAttribute('data-entry-id')
            if (id && id !== held?.rowId) holdOrder(id)
          }}
          onBlur={(e) => {
            // Only let go once focus has left the list entirely.
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(null)
          }}
        >
          {/* --------------------------------------------- wide screens: table */}
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

          {/* -------------------------------------------- narrow screens: cards */}
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
        </div>
      )}

      {/* ------------------------------------------------------------ totals */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-paper">
        <div className="mx-auto max-w-[1600px] px-3 py-2 sm:px-6">
          {/* The three money figures describe the whole class, not the filtered
              view — what a student owes isn't a per-month question. */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
            <span className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
              <Figure label="Credit" value={money(ledger.credit)} className="text-good" />
              <Figure label="Unpaid" value={money(ledger.unpaid)} className="text-danger" />
              <Figure label="Owed" value={moneySigned(ledger.owed)} className="text-ink" big />
            </span>

            <span className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-ink-soft">
              <span className="hidden sm:inline">
                {filtersActive || view === 'calendar' ? 'Showing:' : 'All:'}
              </span>
              <span>{totals.lessonCount} lessons</span>
              <span>Taught {duration(totals.taughtMinutes)}</span>
              <span className="hidden lg:inline">
                Scheduled {duration(totals.scheduledMinutes)}
              </span>
              <span>Charged {money(totals.charged)}</span>
              <span>Received {money(totals.received)}</span>
            </span>
          </div>
        </div>
      </div>

      {editingClass && <ClassEditor cls={cls} existing onClose={() => setEditingClass(false)} />}

      {openEntry && (
        <EntryDialog
          props={rowProps(openEntry)}
          onClose={() => setOpenEntryId(null)}
          onDelete={() => {
            deleteEntry(openEntry.id)
            setOpenEntryId(null)
          }}
          onSwitchKind={(next) => switchKind(openEntry, next)}
        />
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

function Figure({
  label,
  value,
  className,
  big,
}: {
  label: string
  value: string
  className: string
  big?: boolean
}) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-xs text-ink-soft">{label}</span>
      <strong className={`tabular ${big ? 'text-lg' : 'text-base'} ${className}`}>{value}</strong>
    </span>
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
  const { entry, line, onPatch, expanded, onToggleExpanded, onRepeat, onDelete } = props
  const isLesson = entry.kind === 'lesson'
  const struck = isLesson && entry.not_charged
  const cell = struck ? 'struck' : ''
  const paidLesson = isLesson && line?.status === 'paid'

  return (
    <>
      <tr
        data-entry-id={entry.id}
        className={`border-b border-rule align-middle ${
          isLesson ? (paidLesson ? 'row-paid' : '') : 'row-payment'
        }`}
      >
        <td className="px-2 py-1.5">
          <StrikeBox {...props} />
        </td>

        <td className={`px-2 py-1.5 ${cell}`}>
          <DateInput {...props} />
          {!isLesson && <div className="mt-0.5 text-xs text-ink-faint">due</div>}
        </td>

        <td className={`px-2 py-1.5 ${cell}`}>
          {isLesson ? (
            <DurationInput {...props} />
          ) : (
            <span className="text-xs text-ink-faint">—</span>
          )}
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
  const { entry, line, onPatch, onRepeat, onDelete } = props
  const [showExtra, setShowExtra] = useState(Boolean(entry.extra_notes))
  const isLesson = entry.kind === 'lesson'
  const struck = isLesson && entry.not_charged
  const paidLesson = isLesson && line?.status === 'paid'

  return (
    <div
      data-entry-id={entry.id}
      className={`card p-3 ${
        isLesson ? (paidLesson ? 'row-paid' : '') : 'row-payment'
      } ${struck ? 'struck' : ''}`}
    >
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
