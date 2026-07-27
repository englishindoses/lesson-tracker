import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { buildReport, statusKey, type ExportOptions } from '../lib/exportData'
import { duration, formatDate, money, moneySigned, todayISO } from '../lib/format'
import { presenceKey, useT } from '../lib/i18n'
import type { Entry, Student } from '../lib/types'

/**
 * The printable report — the same data as the spreadsheets, laid out to be
 * read rather than calculated with. Print it and both phone and laptop offer
 * "Save as PDF", which is the only way to make a PDF here without shipping a
 * PDF library that would have to carry its own fonts for the accents.
 *
 * It goes into a portal on <body>, not inside the app, so printing can hide
 * #root outright and nothing of the app's chrome leaks into the page.
 */
export default function ReportView({
  snapshot,
  options,
  onClose,
}: {
  snapshot: Parameters<typeof buildReport>[0]
  options: ExportOptions
  onClose: () => void
}) {
  const { t } = useT()
  const report = buildReport(snapshot, options)

  useEffect(() => {
    document.body.dataset.printing = 'report'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      delete document.body.dataset.printing
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const profile = (s: Student) =>
    [s.level, s.contact, s.needs].filter(Boolean).join(' · ')

  const rowLabel = (e: Entry) =>
    e.kind === 'payment'
      ? t('classView.payment')
      : e.presence
        ? t(presenceKey(e.presence))
        : t('classView.lesson')

  return createPortal(
    <div className="report-print fixed inset-0 z-50 overflow-auto">
      <div className="no-print sticky top-0 flex gap-2 border-b border-rule bg-paper p-3">
        <button className="btn btn-primary" onClick={() => window.print()}>
          {t('report.print')}
        </button>
        <button className="btn" onClick={onClose}>
          {t('common.close')}
        </button>
        <span className="self-center text-sm text-ink-faint">{t('report.printHint')}</span>
      </div>

      <div className="report">
        <h1>{t('app.title')}</h1>
        <p className="report-sub">
          {report.range} · {t('report.generated', { date: formatDate(todayISO()) })}
        </p>

        {report.students.length > 0 && (
          <section>
            <h2>{t('report.students')}</h2>
            {report.students.map((s) => (
              <div key={s.id} className="report-student">
                <strong>{s.name}</strong>
                {profile(s) && <span className="report-meta"> — {profile(s)}</span>}
                {s.notes && <div className="report-meta">{s.notes}</div>}
              </div>
            ))}
          </section>
        )}

        {report.classes.map(({ cls, students, rows, totals, owed }) => (
          <section key={cls.id}>
            <h2>{cls.name}</h2>
            <p className="report-meta">
              {[students.map((s) => s.name).join(', '), cls.lesson_type]
                .filter(Boolean)
                .join(' · ')}
            </p>

            <table>
              <thead>
                <tr>
                  <th>{t('classView.colDate')}</th>
                  <th>{t('csv.row')}</th>
                  <th className="num">{t('csv.duration')}</th>
                  <th className="num">{t('csv.charge')}</th>
                  <th className="num">{t('csv.payment')}</th>
                  <th>{t('csv.status')}</th>
                  <th>{t('entry.lessonNotes')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ entry, line }) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.entry_date ?? entry.due_date)}</td>
                    <td>{rowLabel(entry)}</td>
                    <td className="num">
                      {entry.kind === 'lesson' && entry.duration_min
                        ? duration(entry.duration_min)
                        : ''}
                    </td>
                    <td className="num">{line?.charge ? money(line.charge) : ''}</td>
                    <td className="num">
                      {entry.kind === 'payment' && entry.paid ? money(entry.amount ?? 0) : ''}
                    </td>
                    <td>{line ? t(statusKey(line.status)) : ''}</td>
                    <td>{[entry.lesson_notes, entry.extra_notes].filter(Boolean).join(' — ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="report-totals">
              {t('csv.lessonCount')} {totals.lessonCount} ·{' '}
              {t('classView.taught', { time: duration(totals.taughtMinutes) })} ·{' '}
              {t('classView.charged', { amount: money(totals.charged) })} ·{' '}
              {t('classView.received', { amount: money(totals.received) })} ·{' '}
              <strong>
                {t('csv.owedNow')} {moneySigned(owed)}
              </strong>
            </p>
          </section>
        ))}

        {report.classes.length === 0 && <p>{t('settings.nothingToExport')}</p>}
      </div>
    </div>,
    document.body,
  )
}
