import { useMemo, useState } from 'react'
import { newId, nowISO, useStore } from '../data/store'
import type { Class } from '../lib/types'
import { buildLedger, totalsFor } from '../lib/ledger'
import { duration, money } from '../lib/format'
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
        const lines = buildLedger(cls, mine)
        const totals = totalsFor(mine, lines)
        const names = roster
          .filter((cs) => cs.class_id === cls.id)
          .map((cs) => students.find((s) => s.id === cs.student_id)?.name)
          .filter(Boolean)
          .sort() as string[]
        return { cls, totals, names }
      })
  }, [classes, entries, roster, students, showArchived])

  const grandOwed = cards.reduce((sum, c) => sum + c.totals.owed, 0)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="style-hand rule-under mr-auto text-2xl">Classes</h1>
        {!showArchived && grandOwed > 0.005 && (
          <span className="text-sm text-ink-soft">
            Outstanding: <strong className="tabular text-ink">{money(grandOwed)}</strong>
          </span>
        )}
        <button className="btn" onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? 'Show active' : 'Show archived'}
        </button>
        <button className="btn btn-primary" onClick={() => setCreating(blankClass(userId))}>
          + Class
        </button>
      </div>

      {cards.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-faint">
          {showArchived
            ? 'Nothing archived.'
            : 'No classes yet. Add students first, then set up a class.'}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ cls, totals, names }) => (
            <button
              key={cls.id}
              onClick={() => onOpen(cls.id)}
              className="card p-3 text-left hover:border-accent"
            >
              <div className="style-hand text-lg">{cls.name}</div>
              <div className="mt-0.5 text-xs text-ink-soft">
                {names.length ? names.join(', ') : 'No students yet'}
              </div>

              <div className="mt-2 text-xs text-ink-faint">
                {cls.lesson_type ? `${cls.lesson_type} · ` : ''}
                {cls.default_duration_min} min ·{' '}
                {cls.pricing_mode === 'per_lesson'
                  ? `${cls.price_per_lesson != null ? money(cls.price_per_lesson) : '—'}/lesson`
                  : `${cls.monthly_price != null ? money(cls.monthly_price) : '—'}/month`}
              </div>

              <div className="mt-3 flex items-baseline justify-between border-t border-rule pt-2 text-sm">
                <span className="text-ink-soft">
                  {totals.lessonCount} lessons · {duration(totals.taughtMinutes)}
                </span>
                <span
                  className={`tabular font-semibold ${
                    totals.owed > 0.005 ? 'text-danger' : 'text-good'
                  }`}
                >
                  {totals.owed > 0.005 ? money(totals.owed) : 'settled'}
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
