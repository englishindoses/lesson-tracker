import type { Entry } from '../lib/types'
import { formatDate } from '../lib/format'
import { useT } from '../lib/i18n'
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
  const { t } = useT()
  const { entry, onPatch } = props
  const isLesson = entry.kind === 'lesson'
  const date = entry.entry_date ?? entry.due_date

  const untouched =
    !entry.lesson_notes && !entry.extra_notes && entry.amount == null && !entry.paid

  return (
    <Modal
      title={date ? formatDate(date) : isLesson ? t('classView.lesson') : t('classView.payment')}
      onClose={onClose}
      footer={
        <>
          <DeleteButton onDelete={onDelete} label={t('common.delete')} />
          <button className="btn btn-primary ml-auto" onClick={onClose}>
            {t('common.done')}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {untouched && (
          <div className="flex gap-2">
            {(
              [
                ['lesson', t('classView.lesson')],
                ['payment', t('classView.payment')],
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
          <span className="mb-1 block text-ink-soft">
            {isLesson ? t('entry.date') : t('entry.dueDate')}
          </span>
          <DateInput {...props} />
        </label>

        {isLesson && (
          <>
            <label className="block text-sm">
              <span className="mb-1 block text-ink-soft">{t('entry.presence')}</span>
              <PresenceSelect {...props} />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block text-ink-soft">{t('entry.lengthLabel')}</span>
              <DurationInput {...props} />
            </label>
          </>
        )}

        <label className="block text-sm">
          <span className="mb-1 block text-ink-soft">
            {isLesson ? t('entry.amountBlankHint') : t('entry.amountLabel')}
          </span>
          <AmountInput {...props} />
        </label>

        <div className="text-sm">
          <span className="mb-1 block text-ink-soft">{t('entry.paid')}</span>
          <div className="flex items-center gap-3">
            <PaidControl {...props} />
          </div>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-ink-soft">
            {isLesson ? t('entry.lessonNotes') : t('entry.note')}
          </span>
          <NotesInput {...props} />
        </label>

        {isLesson && (
          <>
            <label className="block text-sm">
              <span className="mb-1 block text-ink-soft">{t('classView.extraNotes')}</span>
              <input
                className="field"
                placeholder={t('entry.extraNotesHint')}
                value={entry.extra_notes ?? ''}
                onChange={(e) => onPatch({ extra_notes: e.target.value || null })}
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <StrikeBox {...props} />
              {t('entry.dontCharge')}
            </label>
          </>
        )}
      </div>
    </Modal>
  )
}
