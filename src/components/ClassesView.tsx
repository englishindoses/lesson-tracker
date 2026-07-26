import { useMemo, useState } from 'react'
import { newId, nowISO, useStore } from '../data/store'
import type { Class } from '../lib/types'
import { buildLedger, totalsFor } from '../lib/ledger'
import { duration, money } from '../lib/format'
import { useT } from '../lib/i18n'
import ClassEditor from './ClassEditor'

function blankClass(userId: string): Class {
  return {
    id: newId(),
    user_id: userId,
    name: '',
    lesson_type: null,
    default_duration_min: 60,
    pricing_mode: 'per_lesson',
    price_per_lesson: null,
    monthly_price: null,
    notes: null,
    archived: false,
    created_at: nowISO(),
    updated_at: nowISO(),
  }
}

export default function ClassesView({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useT()
  const userId = useStore((s) => s.userId)!
  const classes = useStore((s) => s.classes)
  const students = useStore((s) => s.students)
  const roster = useStore((s) => s.class_students)
  const entries = useStore((s) => s.entries)

  const [creating, setCreating] = useState<Class | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const cards = useMemo(() => {
    return classes
      .filter((c) => c.archived === showArchived)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((cls) => {
        const mine = entries.filter((e) => e.class_id === cls.id)
        const ledger = buildLedger(cls, mine)
        const totals = totalsFor(mine, ledger.lines)
        const names = roster
          .filter((cs) => cs.class_id === cls.id)
          .map((cs) => students.find((s) => s.id === cs.student_id)?.name)
          .filter(Boolean)
          .sort() as string[]
        return { cls, totals, ledger, names }
      })
  }, [classes, entries, roster, students, showArchived])

  const grandOwed = cards.reduce((sum, c) => sum + c.ledger.owed, 0)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="style-hand rule-under mr-auto text-2xl">{t('app.title')}</h1>
        {!showArchived && grandOwed > 0.005 && (
          <span className="text-sm text-ink-soft">
            {t('classes.outstanding')}{' '}
            <strong className="tabular text-ink">{money(grandOwed)}</strong>
          </span>
        )}
        <button className="btn" onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? t('common.showActive') : t('common.showArchived')}
        </button>
        <button className="btn btn-primary" onClick={() => setCreating(blankClass(userId))}>
          {t('classes.add')}
        </button>
      </div>

      {cards.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-faint">
          {showArchived ? t('classes.noneArchived') : t('classes.none')}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {cards.map(({ cls, totals, ledger, names }) => (
            <button
              key={cls.id}
              onClick={() => onOpen(cls.id)}
              className="card p-3 text-left hover:border-accent"
            >
              <div className="style-hand text-lg">{cls.name}</div>
              <div className="mt-0.5 text-xs text-ink-soft">
                {names.length ? names.join(', ') : t('classes.noStudents')}
              </div>

              <div className="mt-2 text-xs text-ink-faint">
                {cls.lesson_type ? `${cls.lesson_type} · ` : ''}
                {cls.default_duration_min} min ·{' '}
                {cls.pricing_mode === 'per_lesson'
                  ? t('classes.perLesson', {
                      price: cls.price_per_lesson != null ? money(cls.price_per_lesson) : '—',
                    })
                  : t('classes.perMonth', {
                      price: cls.monthly_price != null ? money(cls.monthly_price) : '—',
                    })}
              </div>

              <div className="mt-3 flex items-baseline justify-between border-t border-rule pt-2 text-sm">
                <span className="text-ink-soft">
                  {t('classes.lessonCount', { n: totals.lessonCount })} ·{' '}
                  {duration(totals.taughtMinutes)}
                </span>
                <span
                  className={`tabular font-semibold ${
                    ledger.owed > 0.005 ? 'text-danger' : 'text-good'
                  }`}
                >
                  {ledger.owed > 0.005
                    ? money(ledger.owed)
                    : ledger.credit > 0.005
                      ? t('classes.credit', { amount: money(ledger.credit) })
                      : t('classes.settled')}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {creating && (
        <ClassEditor cls={creating} existing={false} onClose={() => setCreating(null)} />
      )}
    </div>
  )
}
