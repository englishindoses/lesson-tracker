import type { Entry } from '../lib/types'
import { formatDate } from '../lib/format'
import Modal from './Modal'
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

/**
 * Full editor for one entry, opened from a calendar square.
 *
 * Uses the same field components as the list, so edits made here and edits
 * made in the table behave identically — they're the same row either way.
 */
export default function EntryDialog({
  props,
  onClose,
  onDelete,
  onSwitchKind,
}: {
  props: RowProps
  onClose: () => void
  onDelete: () => void
  /** Only offered while the row is still blank, to avoid orphaning data. */
  onSwitchKind: (kind: Entry['kind']) => void
}) {
  const { entry, onPatch } = props
  const isLesson = entry.kind === 'lesson'
  const date = entry.entry_date ?? entry.due_date

  const untouched =
    !entry.lesson_notes && !entry.extra_notes && entry.amount == null && !entry.paid

  return (
    <Modal
      title={date ? formatDate(date) : isLesson ? 'Lesson' : 'Payment'}
      onClose={onClose}
      footer={
        <>
          <DeleteButton onDelete={onDelete} label="Delete" />
          <button className="btn btn-primary ml-auto" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {untouched && (
          <div className="flex gap-2">
            {(
              [
                ['lesson', 'Lesson'],
                ['payment', 'Payment'],
              ] as [Entry['kind'], string][]
            ).map(([kind, label]) => (
              <button
                key={kind}
                className={`btn flex-1 ${entry.kind === kind ? 'btn-primary' : ''}`}
                onClick={() => onSwitchKind(kind)}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <label className="block text-sm">
          <span className="mb-1 block text-ink-soft">{isLesson ? 'Date' : 'Due date'}</span>
          <DateInput {...props} />
        </label>

        {isLesson && (
          <>
            <label className="block text-sm">
              <span className="mb-1 block text-ink-soft">Presence</span>
              <PresenceSelect {...props} />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-ink-soft">Length (minutes)</span>
              <DurationInput {...props} />
            </label>
          </>
        )}

        <label className="block text-sm">
          <span className="mb-1 block text-ink-soft">
            Amount (R$){isLesson ? ' — blank uses the class price' : ''}
          </span>
          <AmountInput {...props} />
        </label>

        <div className="text-sm">
          <span className="mb-1 block text-ink-soft">Paid</span>
          <div className="flex items-center gap-3">
            <PaidControl {...props} />
          </div>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-ink-soft">{isLesson ? 'Lesson notes' : 'Note'}</span>
          <NotesInput {...props} />
        </label>

        {isLesson && (
          <>
            <label className="block text-sm">
              <span className="mb-1 block text-ink-soft">Extra notes</span>
              <input
                className="field"
                placeholder="Homework set, materials…"
                value={entry.extra_notes ?? ''}
                onChange={(e) => onPatch({ extra_notes: e.target.value || null })}
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <StrikeBox {...props} />
              Don't charge for this lesson
            </label>
          </>
        )}
      </div>
    </Modal>
  )
}
