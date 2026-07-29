import { useMemo } from 'react'
import type { Entry } from '../lib/types'
import type { Line } from '../lib/ledger'
import {
  dateInMonth,
  daysInMonth,
  firstWeekdayOfMonth,
  formatDate,
  todayISO,
  weekdayInitials,
  weekdayNames,
} from '../lib/format'
import { useT } from '../lib/i18n'
import { entryMark } from './EntryFields'

/**
 * Month grid for one class.
 *
 * Squares stay deliberately sparse — presence mark, and a tick once paid.
 * Everything else lives in list view; a square is too small to be a form.
 */
export default function CalendarView({
  month,
  entries,
  lines,
  onAdd,
  onOpen,
}: {
  /** "YYYY-MM" */
  month: string
  /** Already filtered, so the calendar honours the same filters as the list. */
  entries: Entry[]
  lines: Map<string, Line>
  onAdd: (dateISO: string) => void
  onOpen: (entry: Entry) => void
}) {
  const { t, lang } = useT()
  const initials = weekdayInitials()
  const names = weekdayNames()

  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>()
    for (const e of entries) {
      const iso = e.entry_date ?? e.due_date
      if (!iso) continue
      map.set(iso, [...(map.get(iso) ?? []), e])
    }
    return map
  }, [entries])

  const total = daysInMonth(month)
  const lead = firstWeekdayOfMonth(month) // 0 = Sunday
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const today = todayISO()

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-rule text-center text-xs text-ink-faint">
        {initials.map((initial, i) => (
          <div key={i} className="py-1.5" title={names[i]}>
            <span aria-hidden>{initial}</span>
            <span className="sr-only">{names[i]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null)
            return <div key={i} className="min-h-[4.5rem] border-b border-r border-rule/50" />

          const iso = dateInMonth(month, day)
          const items = byDay.get(iso) ?? []
          const isToday = iso === today

          return (
            <div
              key={i}
              className={`day-cell relative min-h-[6.5rem] border-b border-r border-rule/50 p-1 sm:min-h-[8.5rem] ${
                isToday ? 'day-today' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={`tabular ${
                    isToday
                      ? 'rounded bg-accent px-1.5 py-0.5 text-sm font-semibold text-paper'
                      : 'px-1 text-xs text-ink-soft'
                  }`}
                >
                  {day}
                </span>
                <button
                  className="day-add"
                  onClick={() => onAdd(iso)}
                  title={t('calendar.add', { date: formatDate(iso) })}
                  aria-label={t('calendar.add', { date: formatDate(iso) })}
                >
                  <span aria-hidden>+</span>
                </button>
              </div>

              {/* Stacked, not wrapped: at most a lesson and a payment, and a
                  full-width mark is far easier to read than a small one. */}
              <div className="mt-1 flex flex-col gap-1">
                {items.map((entry) => {
                  const line = lines.get(entry.id)
                  const { glyph, word, paid, label, struck } = entryMark(entry, line, lang)
                  // The same tints as the table and the cards, in the same
                  // order, plus the one a row never needs: a lesson that was
                  // taught and hasn't been paid for.
                  const tint =
                    entry.kind === 'payment'
                      ? 'row-payment'
                      : struck
                        ? 'row-void'
                        : line?.status === 'paid'
                          ? 'row-paid'
                          : line?.status === 'due'
                            ? 'day-chip-due'
                            : ''
                  return (
                    <button
                      key={entry.id}
                      onClick={() => onOpen(entry)}
                      title={`${label} — ${formatDate(iso)}`}
                      aria-label={`${label} — ${formatDate(iso)}`}
                      className={`day-chip ${tint} ${struck ? 'line-through' : ''}`}
                    >
                      {/* A laptop square is wide enough to say the presence
                          outright; a phone square is not, so it keeps the
                          symbol. A payment stays R$ at both widths -- the
                          symbol already reads as a word. */}
                      {entry.kind === 'payment' ? (
                        <span aria-hidden>{glyph}</span>
                      ) : (
                        <>
                          <span aria-hidden className="lg:hidden">
                            {glyph}
                          </span>
                          <span aria-hidden className="day-chip-word hidden lg:inline">
                            {word}
                          </span>
                        </>
                      )}
                      {/* Sized off the glyph, so it stays a companion mark
                          rather than competing with the presence. */}
                      {paid && (
                        <span aria-hidden className="text-[0.6em] text-good">
                          ✓
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
