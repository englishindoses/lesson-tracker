import { useState } from 'react'
import { PRESENCE_META, PRESENCE_ORDER, type Entry, type Presence } from '../lib/types'
import type { Line } from '../lib/ledger'
import { todayISO } from '../lib/format'
import { presenceKey, translate, useT, type Lang } from '../lib/i18n'
import NumberField from './NumberField'
import DateField from './DateField'

/**
 * One row's editors, shared by the table, the phone cards and the calendar
 * popup — so all three stay identical in behaviour by construction.
 */
export interface RowProps {
  entry: Entry
  line: Line | undefined
  monthlyClass: boolean
  onPatch: (changes: Partial<Entry>) => void
  onPayOff: () => void
}

export function StrikeBox({ entry, onPatch }: RowProps) {
  const { t } = useT()
  if (entry.kind !== 'lesson') return null
  return (
    <input
      type="checkbox"
      className="opacity-40 hover:opacity-100"
      checked={entry.not_charged}
      onChange={(e) => onPatch({ not_charged: e.target.checked })}
      title={t('entry.dontCharge')}
      aria-label={t('entry.dontCharge')}
    />
  )
}

export function DateInput({ entry, onPatch }: RowProps) {
  const { t } = useT()
  const isLesson = entry.kind === 'lesson'
  return (
    <DateField
      aria-label={isLesson ? t('entry.lessonDate') : t('entry.dueDate')}
      value={(isLesson ? entry.entry_date : entry.due_date) ?? null}
      onChange={(iso) => onPatch(isLesson ? { entry_date: iso } : { due_date: iso })}
    />
  )
}

export function DurationInput({ entry, onPatch }: RowProps) {
  const { t } = useT()
  return (
    <NumberField
      min={0}
      step={15}
      className="field tabular"
      aria-label={t('entry.lengthMinutes')}
      value={entry.duration_min}
      onChange={(v) => onPatch({ duration_min: v })}
    />
  )
}

export function PresenceSelect({ entry, onPatch }: RowProps) {
  const { t } = useT()
  return (
    <select
      className="field"
      aria-label={t('entry.presence')}
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
          {PRESENCE_META[p].glyph} {t(presenceKey(p))}
        </option>
      ))}
    </select>
  )
}

export function AmountInput({ entry, line, monthlyClass, onPatch }: RowProps) {
  const { t } = useT()
  const isLesson = entry.kind === 'lesson'
  return (
    <NumberField
      min={0}
      step="0.01"
      className="field tabular text-right"
      aria-label={isLesson ? t('entry.priceForLesson') : t('entry.paymentAmount')}
      placeholder={
        isLesson
          ? monthlyClass || line?.status === 'pending'
            ? '—'
            : line
              ? line.charge.toFixed(2)
              : ''
          : ''
      }
      title={isLesson ? t('entry.blankUsesClassPrice') : undefined}
      value={entry.amount}
      onChange={(v) => onPatch({ amount: v })}
    />
  )
}

export function PaidControl({ entry, line, onPatch, onPayOff }: RowProps) {
  const { t } = useT()
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
          aria-label={t('entry.paymentReceived')}
        />
        {entry.paid && (
          <DateField
            className="field tabular text-xs"
            aria-label={t('entry.datePaid')}
            value={entry.paid_date}
            onChange={(iso) => onPatch({ paid_date: iso })}
          />
        )}
      </div>
    )
  }

  const status = line?.status

  if (status === 'free' || status === 'pending')
    return (
      <span
        className="text-xs text-ink-faint"
        title={status === 'pending' ? t('entry.notMarkedYet') : t('entry.nothingToPay')}
      >
        —
      </span>
    )

  if (status === 'paid')
    return (
      <span className="text-good" title={t('entry.coveredByPayment')}>
        ✓
      </span>
    )

  return (
    <button
      className="text-ink-faint hover:text-ink"
      onClick={onPayOff}
      title={t('entry.markPaidHint')}
      aria-label={t('entry.markPaid')}
    >
      ☐
    </button>
  )
}

export function NotesInput({ entry, onPatch }: RowProps) {
  const { t } = useT()
  const isLesson = entry.kind === 'lesson'
  return (
    <input
      className="field"
      aria-label={isLesson ? t('entry.lessonNotes') : t('entry.note')}
      placeholder={isLesson ? t('entry.lessonNotesHint') : t('entry.noteHint')}
      value={(isLesson ? entry.lesson_notes : entry.extra_notes) ?? ''}
      onChange={(e) =>
        onPatch(
          isLesson
            ? { lesson_notes: e.target.value || null }
            : { extra_notes: e.target.value || null },
        )
      }
    />
  )
}

export function DeleteButton({ onDelete, label }: { onDelete: () => void; label?: string }) {
  const { t } = useT()
  const [confirm, setConfirm] = useState(false)
  return (
    <button
      className={`px-1 ${confirm ? 'text-danger' : 'text-ink-faint hover:text-danger'}`}
      onClick={() => (confirm ? onDelete() : setConfirm(true))}
      onBlur={() => setConfirm(false)}
      title={confirm ? t('common.tapAgain') : t('common.deleteRow')}
      aria-label={confirm ? t('common.confirmDelete') : label ?? t('common.deleteRow')}
    >
      {confirm ? (label ? t('common.reallyDelete') : '✓×') : label ?? '×'}
    </button>
  )
}

/** The mark a row gets in a calendar square: presence, plus a tick when paid. */
export function entryMark(entry: Entry, line: Line | undefined, lang: Lang) {
  const say = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
    translate(lang, key, vars)
  const paid =
    entry.kind === 'payment' ? entry.paid : line?.status === 'paid' || line?.status === 'free'
  const glyph =
    entry.kind === 'payment' ? 'R$' : entry.presence ? PRESENCE_META[entry.presence].glyph : '·'
  const presence = entry.presence ? say(presenceKey(entry.presence)) : say('classView.lesson')
  const label =
    entry.kind === 'payment'
      ? say(entry.paid ? 'entry.markPaymentReceived' : 'entry.markPaymentDue')
      : line?.status === 'paid'
        ? say('entry.markLessonPaid', { presence })
        : presence
  return { glyph, paid, label, struck: entry.kind === 'lesson' && entry.not_charged }
}
