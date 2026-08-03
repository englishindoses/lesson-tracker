import { useMemo, useState } from 'react'
import { useStore } from '../data/store'
import { buildLedger, figuresFor, totalsFor } from '../lib/ledger'
import { addMonths, duration, formatMonth, money, moneySigned, monthKey, todayISO } from '../lib/format'
import { useT } from '../lib/i18n'

/**
 * One month across every class: what each one earned, what is still unpaid,
 * and how long was taught.
 *
 * Each class's ledger is still built on its **full history** — a March payment
 * settles a February lesson whichever month is on screen — and only the rows
 * counted are narrowed to the month. So Credit, Unpaid and Owed here are that
 * month's slice of each class, exactly as the bottom bar inside a class works,
 * and the months add back up to the class total.
 */
export default function MonthView({ onOpenClass }: { onOpenClass: (id: string) => void }) {
  const { t } = useT()
  const classes = useStore((s) => s.classes)
  const entries = useStore((s) => s.entries)

  const [month, setMonth] = useState<string>(() => monthKey(todayISO()))
  const [showArchived, setShowArchived] = useState(false)

  /* Every month with something in it, plus this one and whichever is chosen —
     the arrows can walk into an empty month, and the dropdown has to be able to
     show where you are. */
  const months = useMemo(() => {
    const set = new Set<string>([monthKey(todayISO())])
    if (month !== 'all') set.add(month)
    for (const e of entries) {
      const k = monthKey(e.entry_date ?? e.due_date)
      if (k) set.add(k)
    }
    return [...set].sort().reverse()
  }, [entries, month])

  const rows = useMemo(() => {
    return classes
      .filter((c) => c.archived === showArchived)
      .map((cls) => {
        const mine = entries.filter((e) => e.class_id === cls.id)
        // Full history for the ledger, the month for what gets counted.
        const ledger = buildLedger(cls, mine)
        const inMonth =
          month === 'all'
            ? mine
            : mine.filter((e) => monthKey(e.entry_date ?? e.due_date) === month)
        return {
          cls,
          figures: figuresFor(inMonth, ledger.lines),
          taughtMinutes: totalsFor(inMonth, ledger.lines).taughtMinutes,
          rowCount: inMonth.length,
        }
      })
      // A class with nothing in the month isn't part of that month.
      .filter((r) => r.rowCount > 0)
      .sort((a, b) => a.cls.name.localeCompare(b.cls.name))
  }, [classes, entries, month, showArchived])

  const grand = rows.reduce(
    (sum, r) => ({
      credit: sum.credit + r.figures.credit,
      unpaid: sum.unpaid + r.figures.unpaid,
      owed: sum.owed + r.figures.owed,
      taughtMinutes: sum.taughtMinutes + r.taughtMinutes,
    }),
    { credit: 0, unpaid: 0, owed: 0, taughtMinutes: 0 },
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="style-hand rule-under mr-auto text-2xl">
          {month === 'all' ? t('classView.allMonths') : formatMonth(month)}
        </h1>

        <div className="flex items-center gap-1">
          <button
            className="btn px-2"
            disabled={month === 'all'}
            onClick={() => setMonth(addMonths(month, -1))}
            aria-label={t('classView.prevMonth')}
          >
            ‹
          </button>
          <select
            className="field field-inline"
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
          <button
            className="btn px-2"
            disabled={month === 'all'}
            onClick={() => setMonth(addMonths(month, 1))}
            aria-label={t('classView.nextMonth')}
          >
            ›
          </button>
        </div>

        <button className="btn" onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? t('common.showActive') : t('common.showArchived')}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-faint">
          {month === 'all' ? t('month.nothingAtAll') : t('month.nothing')}
        </p>
      ) : (
        <>
          <div className="card overflow-x-auto">
            <table className="table-compact w-full border-collapse text-sm">
              <thead className="sticky-head">
                <tr className="border-b border-rule text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-2 py-2 font-normal">{t('csv.className')}</th>
                  <th className="px-2 py-2 text-right font-normal">
                    {t('classView.figureCredit')}
                  </th>
                  <th className="px-2 py-2 text-right font-normal">
                    {t('classView.figureUnpaid')}
                  </th>
                  <th className="px-2 py-2 text-right font-normal">{t('classView.figureOwed')}</th>
                  <th className="px-2 py-2 text-right font-normal">{t('month.hours')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ cls, figures, taughtMinutes }) => (
                  <tr key={cls.id} className="border-b border-rule last:border-0">
                    <td className="px-2 py-2">
                      <button className="text-left hover:text-accent" onClick={() => onOpenClass(cls.id)}>
                        {cls.name}
                      </button>
                    </td>
                    <td className="tabular px-2 py-2 text-right text-good">
                      {money(figures.credit)}
                    </td>
                    <td className="tabular px-2 py-2 text-right text-danger">
                      {money(figures.unpaid)}
                    </td>
                    <td className="tabular px-2 py-2 text-right font-semibold">
                      {moneySigned(figures.owed)}
                    </td>
                    <td className="tabular px-2 py-2 text-right">{duration(taughtMinutes)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-rule font-semibold">
                  <td className="px-2 py-2">{t('month.total')}</td>
                  <td className="tabular px-2 py-2 text-right text-good">{money(grand.credit)}</td>
                  <td className="tabular px-2 py-2 text-right text-danger">
                    {money(grand.unpaid)}
                  </td>
                  <td className="tabular px-2 py-2 text-right">{moneySigned(grand.owed)}</td>
                  <td className="tabular px-2 py-2 text-right">{duration(grand.taughtMinutes)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="mt-2 text-xs text-ink-faint">{t('month.note')}</p>
        </>
      )}
    </div>
  )
}
