import { useEffect, useMemo, useState } from 'react'
import { newId, nowISO, useStore } from '../data/store'
import type { Class, Entry } from '../lib/types'
import { buildLedger } from '../lib/ledger'
import { duration, formatDate, money, todayISO } from '../lib/format'
import { useT } from '../lib/i18n'
import Modal from './Modal'
import {
  AmountInput,
  DeleteButton,
  DurationInput,
  NotesInput,
  PaidControl,
  PresenceSelect,
  StrikeBox,
  type RowProps,
} from './EntryFields'

/**
 * Everything happening today, across every class.
 *
 * Nothing new is stored for this: a lesson already carries a class and a date,
 * and the store holds every entry for the account, so this is the same array
 * the class pages read, filtered on today's date instead of on a class.
 *
 * The editors are the same components the table and the calendar popup use, so
 * marking a lesson present here and marking it present on the class page are
 * the same act — they cannot drift apart.
 */
export default function TodayView({ onOpenClass }: { onOpenClass: (id: string) => void }) {
  const { t } = useT()
  const userId = useStore((s) => s.userId)!
  const classes = useStore((s) => s.classes)
  const students = useStore((s) => s.students)
  const roster = useStore((s) => s.class_students)
  const entries = useStore((s) => s.entries)
  const upsertEntry = useStore((s) => s.upsertEntry)
  const deleteEntry = useStore((s) => s.deleteEntry)

  const [picking, setPicking] = useState(false)
  const [today, setToday] = useState(todayISO)

  // A page called Today that is left open overnight and still shows yesterday
  // would be worse than no page at all, so watch the clock rather than trusting
  // the render that happened to build it.
  useEffect(() => {
    const id = setInterval(() => setToday(todayISO()), 30_000)
    return () => clearInterval(id)
  }, [])

  const rows = useMemo(() => {
    // A lesson is dated by entry_date, a payment by the day it falls due.
    const todays = entries.filter(
      (e) => (e.kind === 'lesson' ? e.entry_date : e.due_date) === today,
    )
    if (todays.length === 0) return []

    // One ledger per class involved, built on that class's whole history --
    // a lesson today can be settled by a payment made months ago.
    const wanted = new Set(todays.map((e) => e.class_id))
    const out = []
    for (const cls of classes.filter((c) => wanted.has(c.id))) {
      const { lines } = buildLedger(cls, entries.filter((e) => e.class_id === cls.id))
      const names = roster
        .filter((cs) => cs.class_id === cls.id)
        .map((cs) => students.find((s) => s.id === cs.student_id)?.name)
        .filter(Boolean)
        .sort() as string[]
      for (const entry of todays.filter((e) => e.class_id === cls.id)) {
        out.push({ entry, cls, names, line: lines.get(entry.id) })
      }
    }
    // Grouped by class, and the classes in the order they read on the classes
    // page. Time of day isn't recorded, so there is no truer order than this.
    // Within a class the lesson comes before the payment, as it does in the
    // class table.
    return out.sort(
      (a, b) =>
        a.cls.name.localeCompare(b.cls.name) ||
        (a.entry.kind === b.entry.kind ? 0 : a.entry.kind === 'lesson' ? -1 : 1) ||
        a.entry.created_at.localeCompare(b.entry.created_at),
    )
  }, [entries, classes, roster, students, today])

  const lessons = rows.filter((r) => r.entry.kind === 'lesson')
  const taught = lessons.reduce((sum, r) => sum + (r.entry.duration_min ?? 0), 0)

  const blankEntry = (classId: string): Omit<Entry, 'kind'> => ({
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

  function addLessonTo(cls: Class) {
    upsertEntry({
      ...blankEntry(cls.id),
      kind: 'lesson',
      entry_date: today,
      duration_min: cls.default_duration_min,
      // Blank on purpose: presence is recorded after the lesson, not guessed
      // when it is put in the diary.
      presence: null,
    })
    setPicking(false)
  }

  const rowProps = (row: (typeof rows)[number]): RowProps => ({
    entry: row.entry,
    line: row.line,
    monthlyClass: row.cls.pricing_mode === 'monthly',
    onPatch: (changes) =>
      upsertEntry({ ...row.entry, ...changes, updated_at: nowISO() }),
    // The same rule as the class page: ticking paid on a lesson writes a real
    // payment row, so the ledger stays the only source of truth.
    onPayOff: () => {
      if (!row.line) return
      const remaining = row.line.charge - row.line.covered
      if (remaining <= 0.005) return
      upsertEntry({
        ...blankEntry(row.cls.id),
        kind: 'payment',
        due_date: row.entry.entry_date,
        amount: Number(remaining.toFixed(2)),
        paid: true,
        paid_date: today,
        extra_notes: 'Paid at the lesson',
      })
    },
  })

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="mr-auto">
          <h1 className="style-hand rule-under text-2xl">{t('app.today')}</h1>
          <div className="mt-1 text-xs text-ink-soft">
            {formatDate(today)}
            {lessons.length > 0 && (
              <>
                {' · '}
                {t('classes.lessonCount', { n: lessons.length })}
                {taught > 0 && ` · ${duration(taught)}`}
              </>
            )}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setPicking(true)}>
          {t('classView.addLesson')}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-faint">{t('today.none')}</p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {rows.map((row) => (
            <LessonCard
              key={row.entry.id}
              row={row}
              props={rowProps(row)}
              onOpenClass={() => onOpenClass(row.cls.id)}
              onDelete={() => deleteEntry(row.entry.id)}
            />
          ))}
        </div>
      )}

      {picking && <ClassPicker onPick={addLessonTo} onClose={() => setPicking(false)} />}
    </div>
  )
}

/** One of today's rows: which class it is, then the usual row editors. */
function LessonCard({
  row,
  props,
  onOpenClass,
  onDelete,
}: {
  row: { entry: Entry; cls: Class; names: string[]; line: RowProps['line'] }
  props: RowProps
  onOpenClass: () => void
  onDelete: () => void
}) {
  const { t } = useT()
  const { entry, cls, names, line } = row
  const isLesson = entry.kind === 'lesson'
  const struck = isLesson && entry.not_charged

  // A payment is ringed in green whether or not it has come in yet — it is
  // money either way. The fill is what says the money has actually arrived.
  const tint = isLesson
    ? struck
      ? 'row-void'
      : line?.status === 'paid'
        ? 'row-paid'
        : ''
    : `card-payment ${entry.paid ? 'row-payment' : ''}`

  return (
    <div
      data-entry-id={entry.id}
      className={`card p-3 ${tint} ${struck ? 'struck' : ''}`}
    >
      <div className="flex items-start gap-2">
        {isLesson ? (
          <StrikeBox {...props} />
        ) : (
          <span className="mt-1 text-xs uppercase tracking-wide text-good">
            {t('classView.payment')}
          </span>
        )}
        <button
          className="min-w-0 flex-1 text-left hover:text-accent"
          onClick={onOpenClass}
          title={t('today.openClass')}
        >
          <div className="style-hand truncate text-lg">{cls.name}</div>
          <div className="truncate text-xs text-ink-soft">
            {names.length ? names.join(', ') : t('classes.noStudents')}
            {isLesson &&
              cls.pricing_mode === 'per_lesson' &&
              cls.price_per_lesson != null &&
              ` · ${money(cls.price_per_lesson)}`}
          </div>
        </button>
        <DeleteButton onDelete={onDelete} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {isLesson && (
          <>
            <label className="col-span-2 block text-xs text-ink-soft">
              {t('entry.presence')}
              <PresenceSelect {...props} />
            </label>

            <label className="block text-xs text-ink-soft">
              {t('classView.minutes')}
              <DurationInput {...props} />
            </label>
          </>
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
    </div>
  )
}

/** Adding a lesson to today only needs one answer: which class. */
function ClassPicker({
  onPick,
  onClose,
}: {
  onPick: (cls: Class) => void
  onClose: () => void
}) {
  const { t } = useT()
  const classes = useStore((s) => s.classes)
  const students = useStore((s) => s.students)
  const roster = useStore((s) => s.class_students)

  const options = useMemo(
    () => classes.filter((c) => !c.archived).sort((a, b) => a.name.localeCompare(b.name)),
    [classes],
  )

  return (
    <Modal title={t('today.pickClass')} onClose={onClose}>
      {options.length === 0 ? (
        <p className="py-4 text-center text-sm text-ink-faint">{t('today.noClasses')}</p>
      ) : (
        <div className="space-y-1">
          {options.map((cls) => {
            const names = roster
              .filter((cs) => cs.class_id === cls.id)
              .map((cs) => students.find((s) => s.id === cs.student_id)?.name)
              .filter(Boolean)
              .sort() as string[]
            return (
              <button
                key={cls.id}
                className="w-full rounded px-3 py-2 text-left hover:bg-accent-soft"
                onClick={() => onPick(cls)}
              >
                <div className="style-hand">{cls.name}</div>
                <div className="text-xs text-ink-soft">
                  {names.length ? names.join(', ') : t('classes.noStudents')}
                  {` · ${cls.default_duration_min} min`}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
