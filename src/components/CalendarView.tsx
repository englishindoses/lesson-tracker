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
              className="group relative min-h-[4.5rem] border-b border-r border-rule/50 p-1 sm:min-h-[6rem]"
            >
              <div className="flex items-start justify-between">
                <span
                  className={`text-xs tabular ${
                    isToday
                      ? 'rounded bg-accent px-1.5 py-0.5 font-semibold text-paper'
                      : 'px-1 text-ink-soft'
                  }`}
                >
                  {day}
                </span>
                <button
                  className="rounded px-1 text-sm leading-none text-ink-faint hover:bg-accent-soft hover:text-ink"
                  onClick={() => onAdd(iso)}
                  title={t('calendar.add', { date: formatDate(iso) })}
                  aria-label={t('calendar.add', { date: formatDate(iso) })}
                >
                  +
                </button>
              </div>

              <div className="mt-0.5 flex flex-wrap gap-1">
                {items.map((entry) => {
                  const line = lines.get(entry.id)
                  const { glyph, paid, label, struck } = entryMark(entry, line, lang)
                  // Same tints as the table and the cards, in the same order:
                  // payment, then struck, then settled.
                  const tint =
                    entry.kind === 'payment'
                      ? 'row-payment'
                      : struck
                        ? 'row-void'
                        : line?.status === 'paid'
                          ? 'row-paid'
                          : ''
                  return (
                    <button
                      key={entry.id}
                      onClick={() => onOpen(entry)}
                      title={`${label} — ${formatDate(iso)}`}
                      aria-label={`${label} — ${formatDate(iso)}`}
                      className={`flex items-center gap-0.5 rounded border px-1 py-0.5 text-xs leading-none hover:border-accent ${
                        entry.kind === 'payment'
                          ? 'border-accent/60 text-accent'
                          : 'border-rule text-ink'
                      } ${tint} ${struck ? 'opacity-50 line-through' : ''}`}
                    >
                      <span>{glyph}</span>
                      {paid && <span className="text-good">✓</span>}
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
