import { useState } from 'react'
import { PRESENCE_META, PRESENCE_ORDER, type Entry, type Presence } from '../lib/types'
import type { Line } from '../lib/ledger'
import { todayISO } from '../lib/format'
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
  if (entry.kind !== 'lesson') return null
  return (
    <input
      type="checkbox"
      className="opacity-40 hover:opacity-100"
      checked={entry.not_charged}
      onChange={(e) => onPatch({ not_charged: e.target.checked })}
      title="Don't charge for this lesson"
      aria-label="Don't charge for this lesson"
    />
  )
}

export function DateInput({ entry, onPatch }: RowProps) {
  const isLesson = entry.kind === 'lesson'
  return (
    <DateField
      aria-label={isLesson ? 'Lesson date' : 'Due date'}
      value={(isLesson ? entry.entry_date : entry.due_date) ?? null}
      onChange={(iso) => onPatch(isLesson ? { entry_date: iso } : { due_date: iso })}
    />
  )
}

export function DurationInput({ entry, onPatch }: RowProps) {
  return (
    <NumberField
      min={0}
      step={15}
      className="field tabular"
      aria-label="Lesson length in minutes"
      value={entry.duration_min}
      onChange={(v) => onPatch({ duration_min: v })}
    />
  )
}

export function PresenceSelect({ entry, onPatch }: RowProps) {
  return (
    <select
      className="field"
      aria-label="Presence"
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
          {PRESENCE_META[p].glyph} {PRESENCE_META[p].label}
        </option>
      ))}
    </select>
  )
}

export function AmountInput({ entry, line, monthlyClass, onPatch }: RowProps) {
  const isLesson = entry.kind === 'lesson'
  return (
    <NumberField
      min={0}
      step="0.01"
      className="field tabular text-right"
      aria-label={isLesson ? 'Price for this lesson' : 'Payment amount'}
      placeholder={isLesson ? (monthlyClass ? '—' : line ? line.charge.toFixed(2) : '') : ''}
      title={isLesson ? 'Leave blank to use the class price' : undefined}
      value={entry.amount}
      onChange={(v) => onPatch({ amount: v })}
    />
  )
}

export function PaidControl({ entry, line, onPatch, onPayOff }: RowProps) {
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
          aria-label="Payment received"
        />
        {entry.paid && (
          <DateField
            className="field tabular text-xs"
            aria-label="Date paid"
            value={entry.paid_date}
            onChange={(iso) => onPatch({ paid_date: iso })}
          />
        )}
      </div>
    )
  }

  const status = line?.status

  if (status === 'free')
    return (
      <span className="text-xs text-ink-faint" title="Nothing to pay">
        —
      </span>
    )

  if (status === 'paid')
    return (
      <span className="text-good" title="Covered by a payment">
        ✓
      </span>
    )

  if (status === 'part')
    return (
      <button
        className="text-xs text-ink-soft underline"
        onClick={onPayOff}
        title="Partly paid — tap to settle the rest"
      >
        part
      </button>
    )

  return (
    <button
      className="text-ink-faint hover:text-ink"
      onClick={onPayOff}
      title="Mark paid — adds a payment row for this amount, dated today"
      aria-label="Mark paid"
    >
      ☐
    </button>
  )
}

export function NotesInput({ entry, onPatch }: RowProps) {
  const isLesson = entry.kind === 'lesson'
  return (
    <input
      className="field"
      aria-label={isLesson ? 'Lesson notes' : 'Note'}
      placeholder={isLesson ? 'Lesson notes…' : 'Note…'}
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
  const [confirm, setConfirm] = useState(false)
  return (
    <button
      className={`px-1 ${confirm ? 'text-danger' : 'text-ink-faint hover:text-danger'}`}
      onClick={() => (confirm ? onDelete() : setConfirm(true))}
      onBlur={() => setConfirm(false)}
      title={confirm ? 'Tap again to delete' : 'Delete row'}
      aria-label={confirm ? 'Confirm delete' : label ?? 'Delete row'}
    >
      {confirm ? (label ? '✓ really delete' : '✓×') : label ?? '×'}
    </button>
  )
}

/** The mark a row gets in a calendar square: presence, plus a tick when paid. */
export function entryMark(entry: Entry, line: Line | undefined) {
  const paid =
    entry.kind === 'payment' ? entry.paid : line?.status === 'paid' || line?.status === 'free'
  const glyph =
    entry.kind === 'payment' ? 'R$' : entry.presence ? PRESENCE_META[entry.presence].glyph : '·'
  const label =
    entry.kind === 'payment'
      ? `Payment${entry.paid ? ' — received' : ' — due'}`
      : `${entry.presence ? PRESENCE_META[entry.presence].label : 'Lesson'}${
          line?.status === 'paid' ? ' — paid' : ''
        }`
  return { glyph, paid, label, struck: entry.kind === 'lesson' && entry.not_charged }
}
