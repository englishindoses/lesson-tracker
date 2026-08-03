import { useMemo, useState, useSyncExternalStore } from 'react'
import { newId, nowISO, useStore } from '../data/store'
import * as prefs from '../lib/prefs'
import { PRESENCE_ORDER, type Entry, type Presence } from '../lib/types'
import { buildLedger, figuresFor, sortEntries, type Line } from '../lib/ledger'
import {
  addDays,
  addMonths,
  formatDate,
  formatMonth,
  money,
  moneySigned,
  monthKey,
  todayISO,
} from '../lib/format'
import { presenceKey, useT } from '../lib/i18n'
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

const readView = (): ViewMode => (prefs.get().classView === 'calendar' ? 'calendar' : 'list')
/** Pinned unless she has said otherwise. */
const readPinned = () => prefs.get().pinFilters !== false
/** Cards on a narrow screen unless she has asked for the full table there. */
const readPhoneTable = () => prefs.get().phoneTable === true

export default function ClassView({
  classId,
  onBack,
}: {
  classId: string
  onBack: () => void
}) {
  const { t } = useT()
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
  const [reminding, setReminding] = useState(false)
  // Both of these are preferences: they survive reloads, apply to every class,
  // and follow the account rather than the machine.
  const view = useSyncExternalStore(prefs.subscribe, readView, readView)
  const pinned = useSyncExternalStore(prefs.subscribe, readPinned, readPinned)
  const phoneTable = useSyncExternalStore(prefs.subscribe, readPhoneTable, readPhoneTable)

  const classEntries = useMemo(
    () => allEntries.filter((e) => e.class_id === classId),
    [allEntries, classId],
  )

  // The ledger is always built on the whole history, never the filtered view —
  // a March payment still settles a February lesson. The bottom bar then takes
  // its slice of it, which is what `figuresFor` is for.
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
        // An unmarked lesson is neither: there is no money on it either way.
        if (status === 'pending') return false
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

  const figures = useMemo(() => figuresFor(visible, lines), [visible, lines])

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
      // Left blank on purpose: presence is something you record after the
      // lesson, not a guess made when you schedule it.
      presence: null,
    }
  }

  function addLesson() {
    const previous = lastLessonDate()
    // Weekly classes are the norm, so guess a week after the last one.
    upsertEntry(newLessonOn(previous ? addDays(previous, 7) : todayISO()))
    remindFilters()
  }

  function addPayment() {
    upsertEntry({
      ...baseEntry(),
      kind: 'payment',
      due_date: todayISO(),
      amount: cls!.pricing_mode === 'monthly' ? cls!.monthly_price : cls!.price_per_lesson,
    })
    remindFilters()
  }

  /** The + inside a calendar square: create there, then open it for filling in. */
  function addOnDay(dateISO: string) {
    const entry = newLessonOn(dateISO)
    upsertEntry(entry)
    setOpenEntryId(entry.id)
    remindFilters()
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
            presence: null,
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
        presence: null,
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
    remindFilters()
  }

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const setViewMode = (next: ViewMode) => prefs.patch({ classView: next })

  // The month filter only filters in list view; the calendar shows a month
  // because that is what a calendar does.
  const monthFiltering = view === 'list' && month !== 'all'
  const filtersActive =
    monthFiltering || kind !== 'all' || paid !== 'all' || presence !== 'all'

  /* What the money at the foot of the page is counting, in words. Empty when
     nothing is filtered, since then it is simply the whole class. The calendar
     always shows one month, so it always names it. */
  const filterLabel = [
    view === 'calendar' ? formatMonth(calendarMonth) : monthFiltering ? formatMonth(month) : '',
    kind === 'lesson'
      ? t('classView.kindLesson')
      : kind === 'payment'
        ? t('classView.kindPayment')
        : '',
    paid === 'paid' ? t('classView.paidPaid') : paid === 'unpaid' ? t('classView.paidUnpaid') : '',
    presence === 'all' ? '' : t(presenceKey(presence)),
  ]
    .filter(Boolean)
    .join(', ')

  /* A new row can land outside the filter and never appear, which looks like
     the button did nothing. The outlined filters flash twice instead. */
  function remindFilters() {
    if (!filtersActive) return
    // Off, then on a frame later: without the gap a second press won't restart
    // an animation that is already running.
    setReminding(false)
    requestAnimationFrame(() => setReminding(true))
  }

  /** The classes for a filter control: a ring if it is filtering, flashing if
   *  a row has just been added behind it. */
  const ring = (on: boolean) => (on ? (reminding ? 'filter-on filter-remind' : 'filter-on') : '')

  const rowProps = (entry: Entry): RowProps => ({
    entry,
    line: lines.get(entry.id),
    monthlyClass: cls.pricing_mode === 'monthly',
    onPatch: (changes) => patch(entry, changes),
    onPayOff: () => payOffLesson(entry),
  })

  const openEntry = openEntryId ? classEntries.find((e) => e.id === openEntryId) : undefined

  const emptyMessage =
    classEntries.length === 0 ? t('classView.empty') : t('classView.noMatches')

  /**
   * Today's rows, outlined as one block. They are in date order, so a lesson
   * taught today and a payment taken today are already neighbours — the run
   * gets sides all the way down, a lid on the first row and a floor on the
   * last, rather than each row being boxed separately.
   */
  const today = todayISO()
  const onToday = (e: Entry) => (e.entry_date ?? e.due_date) === today
  const todayEdges = (i: number) => {
    if (!onToday(visible[i])) return ''
    const first = i === 0 || !onToday(visible[i - 1])
    const last = i === visible.length - 1 || !onToday(visible[i + 1])
    return `row-today${first ? ' row-today-first' : ''}${last ? ' row-today-last' : ''}`
  }

  /**
   * The rail down the left of the run is one cell with a rowSpan, so the first
   * of today's rows carries it and the rest leave the slot alone. An open
   * extra-notes line is a table row of its own and has to be counted in.
   */
  const firstToday = visible.findIndex(onToday)
  const todayRowCount = visible.reduce(
    (n, e) => (onToday(e) ? n + 1 + (expanded.has(e.id) ? 1 : 0) : n),
    0,
  )
  const railFor = (i: number): number | 'skip' | null =>
    i === firstToday ? todayRowCount : onToday(visible[i]) ? 'skip' : null

  return (
    <div className="pb-28 sm:pb-24">
      {/* ------------------------------------------------------------ header */}
      <div className="mb-3 flex flex-wrap items-start gap-2">
        <button className="btn no-print" onClick={onBack}>
          {t('common.back')}
        </button>
        <div className="order-last w-full sm:order-none sm:mr-auto sm:w-auto">
          <h1 className="style-hand rule-under text-xl sm:text-2xl">{cls.name}</h1>
          <div className="mt-1 text-xs text-ink-soft">
            {names.length ? names.join(', ') : t('classes.noStudents')}
            {' · '}
            {cls.lesson_type ? `${cls.lesson_type} · ` : ''}
            {cls.default_duration_min} min ·{' '}
            {cls.pricing_mode === 'per_lesson'
              ? t('classes.perLessonLong', {
                  price: cls.price_per_lesson != null ? money(cls.price_per_lesson) : '—',
                })
              : t('classes.perMonthLong', {
                  price: cls.monthly_price != null ? money(cls.monthly_price) : '—',
                })}
          </div>
        </div>
        <button className="btn no-print ml-auto sm:ml-0" onClick={() => setEditingClass(true)}>
          {t('classView.editClass')}
        </button>
      </div>

      {/* ----------------------------------------------------------- filters */}
      <div
        style={pinned ? { top: 'var(--header-h, 3.25rem)' } : undefined}
        // Animation events bubble, so one handler here retires the flash for
        // however many filters were wearing it.
        onAnimationEnd={() => setReminding(false)}
        className={`no-print mb-3 flex flex-wrap items-center gap-2 text-sm ${
          pinned ? 'sticky z-20 -mx-3 border-b border-rule bg-paper px-3 py-2 sm:-mx-6 sm:px-6' : ''
        }`}
      >
        {/* list / calendar */}
        <div className="flex overflow-hidden rounded border border-ink-faint">
          {(
            [
              ['list', t('classView.list')],
              ['calendar', t('classView.calendar')],
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
              aria-label={t('classView.prevMonth')}
            >
              ‹
            </button>
            <span className="min-w-[8.5rem] text-center">{formatMonth(calendarMonth)}</span>
            <button
              className="btn px-2"
              onClick={() => setMonth(addMonths(calendarMonth, 1))}
              aria-label={t('classView.nextMonth')}
            >
              ›
            </button>
          </div>
        ) : (
          <select
            className={`field field-inline ${ring(monthFiltering)}`}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            aria-label={t('classView.filterMonth')}
          >
            <option value="all">{t('classView.allMonths')}</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        )}

        <select
          className={`field field-inline ${ring(kind !== 'all')}`}
          value={kind}
          onChange={(e) => setKind(e.target.value as KindFilter)}
          aria-label={t('classView.filterKind')}
        >
          <option value="all">{t('classView.kindAll')}</option>
          <option value="lesson">{t('classView.kindLesson')}</option>
          <option value="payment">{t('classView.kindPayment')}</option>
        </select>

        <select
          className={`field field-inline ${ring(paid !== 'all')}`}
          value={paid}
          onChange={(e) => setPaid(e.target.value as PaidFilter)}
          aria-label={t('classView.filterPaid')}
        >
          <option value="all">{t('classView.paidAll')}</option>
          <option value="unpaid">{t('classView.paidUnpaid')}</option>
          <option value="paid">{t('classView.paidPaid')}</option>
        </select>

        <select
          className={`field field-inline ${ring(presence !== 'all')}`}
          value={presence}
          onChange={(e) => setPresence(e.target.value as Presence | 'all')}
          aria-label={t('classView.filterPresence')}
        >
          <option value="all">{t('classView.anyPresence')}</option>
          {PRESENCE_ORDER.map((p) => (
            <option key={p} value={p}>
              {t(presenceKey(p))}
            </option>
          ))}
        </select>

        {/* Phones only: the table is always what a laptop gets. It scrolls
            sideways at this width, which is the trade being offered. */}
        {view === 'list' && (
          <button
            className="btn lg:hidden"
            onClick={() => prefs.patch({ phoneTable: !phoneTable })}
          >
            {phoneTable ? t('classView.asCards') : t('classView.asTable')}
          </button>
        )}

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
            {t('classView.clearFilters')}
          </button>
        )}

        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <button className="btn flex-1 sm:flex-none" onClick={addPayment}>
            {t('classView.addPayment')}
          </button>
          <button className="btn btn-primary flex-1 sm:flex-none" onClick={addLesson}>
            {t('classView.addLesson')}
          </button>
          <button
            className={`btn shrink-0 px-2 ${pinned ? 'text-accent' : 'text-ink-faint'}`}
            aria-pressed={pinned}
            aria-label={pinned ? t('classView.unpin') : t('classView.pin')}
            title={pinned ? t('classView.pinned') : t('classView.pin')}
            onClick={() => prefs.patch({ pinFilters: !pinned })}
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
          {/* ------------------------------------------------------ the table */}
          <div className={`card overflow-x-auto lg:block ${phoneTable ? '' : 'hidden'}`}>
            <table className="table-compact w-full border-collapse text-sm">
              <thead className="sticky-head">
                <tr className="border-b border-rule text-left text-xs uppercase tracking-wide text-ink-faint">
                  {/* The rail's column. Empty everywhere but today's block. */}
                  <th className="rail-blank" />
                  <th className="w-8 px-2 py-2" title={t('classView.dontChargeCol')} />
                  <th className="col-date px-2 py-2 font-normal">{t('classView.colDate')}</th>
                  <th className="col-narrow w-24 px-2 py-2 font-normal">
                    {t('classView.colLength')}
                  </th>
                  <th className="w-44 px-2 py-2 font-normal">{t('classView.colPresence')}</th>
                  <th className="col-narrow w-32 px-2 py-2 text-right font-normal">
                    {t('classView.colAmount')}
                  </th>
                  <th className="w-28 px-2 py-2 text-center font-normal">
                    {t('classView.colPaid')}
                  </th>
                  <th className="col-hide px-2 py-2 font-normal">
                    <span className="hidden lg:inline">{t('classView.colNotes')}</span>
                  </th>
                  <th className="w-20 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-ink-faint">
                      {emptyMessage}
                    </td>
                  </tr>
                )}

                {visible.map((entry, i) => (
                  <TableRow
                    key={entry.id}
                    {...rowProps(entry)}
                    todayEdges={todayEdges(i)}
                    rail={railFor(i)}
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
          <div className={`space-y-2 lg:hidden ${phoneTable ? 'hidden' : ''}`}>
            {visible.length === 0 && (
              <p className="card px-3 py-10 text-center text-sm text-ink-faint">{emptyMessage}</p>
            )}
            {visible.map((entry) => (
              <EntryCard
                key={entry.id}
                {...rowProps(entry)}
                today={onToday(entry)}
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
          {/* The three money figures count the rows on screen. With nothing
              filtered that is the whole class; filtered, it is that slice of
              it — so the label spells out which, and Owed then means what is
              outstanding there rather than what the student owes altogether. */}
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <Figure
              label={t('classView.figureCredit')}
              value={money(figures.credit)}
              className="text-good"
            />
            <Figure
              label={t('classView.figureUnpaid')}
              value={money(figures.unpaid)}
              className="text-danger"
            />
            <Figure
              label={t('classView.figureOwed')}
              value={moneySigned(figures.owed)}
              className="text-ink"
              big
            />
            {filterLabel && <span className="text-xs text-ink-soft">({filterLabel})</span>}
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

/** The background tint for a lesson row. Struck first: a row that charges
 *  nothing is set aside, whatever the ledger says about it. */
function rowTint(struck: boolean, paid: boolean) {
  if (struck) return 'row-void'
  return paid ? 'row-paid' : ''
}

/* ------------------------------------------------------- wide screens: table */

function TableRow(
  props: RowProps & {
    /** '', or the row-today classes marking this row's place in today's run. */
    todayEdges: string
    /** How many rows the rail spans here, 'skip' if a row above carries it. */
    rail: number | 'skip' | null
    expanded: boolean
    onToggleExpanded: () => void
    onRepeat: () => void
    onDelete: () => void
  },
) {
  const { t } = useT()
  const { entry, line, onPatch, todayEdges, rail, expanded, onToggleExpanded, onRepeat, onDelete } =
    props
  const isLesson = entry.kind === 'lesson'
  const struck = isLesson && entry.not_charged
  const cell = struck ? 'struck' : ''
  const paidLesson = isLesson && line?.status === 'paid'

  // The extra-notes row belongs to the same lesson, so the outline has to run
  // around both -- the floor moves down to it when it is open.
  const extraRow = expanded
  const closesRun = todayEdges.includes('row-today-last')
  const mainEdges = extraRow ? todayEdges.replace(' row-today-last', '') : todayEdges

  return (
    <>
      <tr
        data-entry-id={entry.id}
        className={`border-b border-rule align-middle ${
          isLesson ? rowTint(struck, paidLesson) : 'row-payment'
        } ${mainEdges}`}
      >
        {rail === 'skip' ? null : typeof rail === 'number' ? (
          <td className="rail-cell" rowSpan={rail}>
            <span className="rail-word">{t('app.today')}</span>
          </td>
        ) : (
          <td className="rail-blank" />
        )}

        <td className="px-2 py-1.5">
          <StrikeBox {...props} />
        </td>

        <td className={`col-date px-2 py-1.5 ${cell}`}>
          <DateInput {...props} />
          {!isLesson && <div className="mt-0.5 text-xs text-ink-faint">{t('classView.due')}</div>}
        </td>

        <td className={`col-narrow px-2 py-1.5 ${cell}`}>
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
            <span className="text-xs uppercase tracking-wide text-ink-soft">
              {t('classView.payment')}
            </span>
          )}
        </td>

        <td className={`col-narrow px-2 py-1.5 text-right ${cell}`}>
          <AmountInput {...props} />
        </td>

        <td className="px-2 py-1.5 text-center">
          <PaidControl {...props} />
        </td>

        {/* A phone hasn't the width for notes as well as the money, so they
            move into the drawer with everything else that can wait. The cell
            itself stays: hiding a td would leave this row a column short of the
            header and slide every heading along one. */}
        <td className={`col-hide px-2 py-1.5 ${cell}`}>
          <div className="hidden lg:block">
            <NotesInput {...props} />
          </div>
        </td>

        <td className="px-1 py-1.5 text-right">
          <div className="flex items-center justify-end gap-0.5">
            {/* On a phone a payment needs the drawer too -- it is the only way
                to reach its note and its delete. */}
            <button
              className={`px-1 text-ink-faint hover:text-ink ${isLesson ? '' : 'lg:hidden'}`}
              onClick={onToggleExpanded}
              title={t('classView.extraNotes')}
              aria-label={t('classView.extraNotes')}
            >
              {expanded ? '▾' : '▸'}
            </button>
            {isLesson && (
              <button
                className="hidden px-1 text-ink-faint hover:text-ink lg:inline"
                onClick={onRepeat}
                title={t('classView.repeatWeekly')}
                aria-label={t('classView.repeatWeekly')}
              >
                ⟳
              </button>
            )}
            <span className="hidden lg:inline">
              <DeleteButton onDelete={onDelete} />
            </span>
          </div>
        </td>
      </tr>

      {extraRow && (
        <tr
          className={`border-b border-rule ${isLesson ? '' : 'lg:hidden'} ${
            todayEdges ? `row-today${closesRun ? ' row-today-last' : ''}` : ''
          }`}
        >
          {/* Inside today's block the rail already covers this row. */}
          {!todayEdges && <td className="rail-blank" />}
          <td />
          <td colSpan={7} className="space-y-1.5 px-2 pb-2">
            <div className="lg:hidden">
              <NotesInput {...props} />
            </div>

            {isLesson && (
              <input
                className="field"
                placeholder={t('classView.extraNotesHint')}
                aria-label={t('classView.extraNotes')}
                value={entry.extra_notes ?? ''}
                onChange={(e) => onPatch({ extra_notes: e.target.value || null })}
              />
            )}

            <div className="flex items-center gap-3 lg:hidden">
              {isLesson && (
                <button className="btn" onClick={onRepeat}>
                  ⟳ {t('classView.repeatWeekly')}
                </button>
              )}
              <DeleteButton onDelete={onDelete} label={t('common.delete')} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

/* ----------------------------------------------------- narrow screens: cards */

function EntryCard(
  props: RowProps & { today: boolean; onRepeat: () => void; onDelete: () => void },
) {
  const { t } = useT()
  const { entry, line, onPatch, today, onRepeat, onDelete } = props
  const [showExtra, setShowExtra] = useState(Boolean(entry.extra_notes))
  const isLesson = entry.kind === 'lesson'
  const struck = isLesson && entry.not_charged
  const paidLesson = isLesson && line?.status === 'paid'

  return (
    <div
      data-entry-id={entry.id}
      className={`card p-3 ${
        isLesson ? rowTint(struck, paidLesson) : 'row-payment'
      } ${struck ? 'struck' : ''} ${today ? 'card-today' : ''}`}
    >
      <div className="flex items-center gap-2">
        {isLesson ? (
          <StrikeBox {...props} />
        ) : (
          <span className="text-xs uppercase tracking-wide text-ink-soft">
            {t('classView.payment')}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <DateInput {...props} />
        </div>
        {isLesson && (
          <button
            className="px-1 text-ink-faint"
            onClick={onRepeat}
            title={t('classView.repeatWeekly')}
            aria-label={t('classView.repeatWeekly')}
          >
            ⟳
          </button>
        )}
        <DeleteButton onDelete={onDelete} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {isLesson && (
          <label className="col-span-2 block text-xs text-ink-soft">
            {t('entry.presence')}
            <PresenceSelect {...props} />
          </label>
        )}

        {isLesson && (
          <label className="block text-xs text-ink-soft">
            {t('classView.minutes')}
            <DurationInput {...props} />
          </label>
        )}

        <label className={`block text-xs text-ink-soft ${isLesson ? '' : 'col-span-1'}`}>
          {t('classView.amountBRL')}
          <AmountInput {...props} />
        </label>

        <div className={`text-xs text-ink-soft ${isLesson ? 'col-span-2' : 'col-span-1'}`}>
          <span className="mb-1 block">{t('entry.paid')}</span>
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
            placeholder={t('classView.extraNotesHintShort')}
            aria-label={t('classView.extraNotes')}
            value={entry.extra_notes ?? ''}
            onChange={(e) => onPatch({ extra_notes: e.target.value || null })}
          />
        ) : (
          <button
            className="mt-1 text-xs text-ink-faint underline"
            onClick={() => setShowExtra(true)}
          >
            {t('classView.addExtraNotes')}
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
  const { t } = useT()
  // Nullable so the box can be cleared and retyped without snapping back.
  const [times, setTimes] = useState<number | null>(4)
  const count = Math.min(52, Math.max(1, times ?? 1))

  return (
    <Modal
      title={t('repeat.title')}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            className="btn btn-primary"
            disabled={times == null}
            onClick={() => onConfirm(count)}
          >
            {count === 1 ? t('repeat.add', { n: count }) : t('repeat.addPlural', { n: count })}
          </button>
        </>
      }
    >
      <p className="mb-3 text-sm text-ink-soft">
        {t('repeat.explain', { date: formatDate(entry.entry_date) })}
      </p>
      <label className="block text-sm">
        <span className="mb-1 block text-ink-soft">{t('repeat.howMany')}</span>
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
