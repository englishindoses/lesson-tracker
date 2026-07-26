import { useMemo, useState } from 'react'
import { nowISO, useStore } from '../data/store'
import { type Class } from '../lib/types'
import { LESSON_TYPE_KEYS, useT } from '../lib/i18n'
import Modal from './Modal'
import NumberField from './NumberField'
import { Field } from './StudentsView'

export default function ClassEditor({
  cls,
  existing,
  onClose,
}: {
  cls: Class
  existing: boolean
  onClose: () => void
}) {
  const { t } = useT()
  const students = useStore((s) => s.students)
  const roster = useStore((s) => s.class_students)
  const entries = useStore((s) => s.entries)
  const upsertClass = useStore((s) => s.upsertClass)
  const upsertEntries = useStore((s) => s.upsertEntries)
  const deleteClass = useStore((s) => s.deleteClass)
  const addStudentToClass = useStore((s) => s.addStudentToClass)
  const removeStudentFromClass = useStore((s) => s.removeStudentFromClass)

  const [draft, setDraft] = useState<Class>(cls)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [picking, setPicking] = useState(false)
  // Duration is non-null on the record but has to be allowed to sit empty
  // while you're retyping it, so it gets its own nullable draft.
  const [durationDraft, setDurationDraft] = useState<number | null>(cls.default_duration_min)

  const set = <K extends keyof Class>(k: K, v: Class[K]) => setDraft((d) => ({ ...d, [k]: v }))

  const toSave = (): Class => ({
    ...draft,
    default_duration_min: durationDraft ?? 60,
    updated_at: nowISO(),
  })

  /**
   * A price change applies to future lessons only.
   *
   * Lessons that were charging the class price carry no amount of their own, so
   * they'd silently re-price themselves. Before saving a new price, write the
   * old one onto each of them, freezing what they were worth at the time.
   */
  function freezeExistingPrices(next: Class) {
    const previous = cls.price_per_lesson
    const changed =
      next.pricing_mode === 'per_lesson' &&
      previous != null &&
      next.price_per_lesson !== previous

    if (!existing || !changed) return

    const stamped = entries
      .filter((e) => e.class_id === cls.id && e.kind === 'lesson' && e.amount == null)
      .map((e) => ({ ...e, amount: previous, updated_at: nowISO() }))

    if (stamped.length) upsertEntries(stamped)
  }

  function save() {
    const next = toSave()
    freezeExistingPrices(next)
    upsertClass(next)
    onClose()
  }

  const enrolled = useMemo(
    () =>
      roster
        .filter((cs) => cs.class_id === draft.id)
        .map((cs) => students.find((s) => s.id === cs.student_id))
        .filter((s): s is NonNullable<typeof s> => Boolean(s))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [roster, students, draft.id],
  )

  const available = useMemo(
    () =>
      students
        .filter((s) => !s.archived && !enrolled.some((e) => e.id === s.id))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [students, enrolled],
  )

  // The class row has to exist before students can be attached to it.
  const ensureSaved = () => {
    if (!useStore.getState().classes.some((c) => c.id === draft.id)) {
      upsertClass(toSave())
    }
  }

  return (
    <Modal
      title={existing ? draft.name || t('classEditor.one') : t('classEditor.new')}
      onClose={onClose}
      footer={
        <>
          {existing &&
            (confirmDelete ? (
              <>
                <span className="mr-auto text-sm text-danger">
                  {t('classEditor.deleteWarning')}
                </span>
                <button className="btn" onClick={() => setConfirmDelete(false)}>
                  {t('common.keep')}
                </button>
                <button
                  className="btn border-danger text-danger"
                  onClick={() => {
                    deleteClass(draft.id)
                    onClose()
                  }}
                >
                  {t('common.delete')}
                </button>
              </>
            ) : (
              <button
                className="btn mr-auto border-danger text-danger"
                onClick={() => setConfirmDelete(true)}
              >
                {t('common.delete')}
              </button>
            ))}
          <button className="btn" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            className="btn btn-primary"
            disabled={!draft.name.trim()}
            onClick={save}
          >
            {t('common.save')}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label={t('classEditor.name')}>
          <input
            className="field"
            autoFocus
            placeholder={t('classEditor.nameHint')}
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('classEditor.lessonType')}>
            <input
              className="field"
              list="lesson-types-class"
              value={draft.lesson_type ?? ''}
              onChange={(e) => set('lesson_type', e.target.value || null)}
            />
            <datalist id="lesson-types-class">
              {LESSON_TYPE_KEYS.map((key) => (
                <option key={key} value={t(key)} />
              ))}
            </datalist>
          </Field>
          <Field label={t('classEditor.usualLength')}>
            <NumberField
              className="field tabular"
              min={0}
              step={15}
              value={durationDraft}
              fallback={60}
              onChange={setDurationDraft}
            />
          </Field>
        </div>

        {/* ---------------------------------------------------------- pricing */}
        <div className="card p-3">
          <div className="mb-2 text-sm text-ink-soft">{t('classEditor.howCharged')}</div>
          <div className="mb-3 flex gap-2">
            {(
              [
                ['per_lesson', t('classEditor.perLesson')],
                ['monthly', t('classEditor.monthly')],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => set('pricing_mode', value)}
                className={`btn flex-1 ${
                  draft.pricing_mode === value ? 'btn-primary' : ''
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {draft.pricing_mode === 'per_lesson' ? (
            <>
              <Field label={t('classEditor.pricePerLesson')}>
                <NumberField
                  className="field tabular"
                  min={0}
                  step="0.01"
                  value={draft.price_per_lesson}
                  onChange={(v) => set('price_per_lesson', v)}
                />
              </Field>
              {existing && (
                <p className="mt-2 text-xs text-ink-faint">{t('classEditor.priceNote')}</p>
              )}
            </>
          ) : (
            <>
              <Field label={t('classEditor.monthlyPrice')}>
                <NumberField
                  className="field tabular"
                  min={0}
                  step="0.01"
                  value={draft.monthly_price}
                  onChange={(v) => set('monthly_price', v)}
                />
              </Field>
              <p className="mt-2 text-xs text-ink-faint">{t('classEditor.monthlyNote')}</p>
            </>
          )}
        </div>

        {/* ---------------------------------------------------------- students */}
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-ink-soft">
            <span>{t('classEditor.studentsIn')}</span>
            <span className="text-xs text-ink-faint">{t('classEditor.priceIsPerClass')}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {enrolled.map((s) => (
              <span
                key={s.id}
                className="card flex items-center gap-1.5 px-2 py-1 text-sm"
              >
                {s.name}
                <button
                  className="text-ink-faint hover:text-danger"
                  aria-label={t('classEditor.remove', { name: s.name })}
                  onClick={() => removeStudentFromClass(draft.id, s.id)}
                >
                  ×
                </button>
              </span>
            ))}

            <div className="relative">
              <button
                className="btn"
                onClick={() => {
                  ensureSaved()
                  setPicking((v) => !v)
                }}
              >
                {t('classEditor.addStudent')}
              </button>

              {picking && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setPicking(false)} />
                  <div className="card absolute left-0 z-20 mt-1 max-h-60 w-56 overflow-y-auto p-1 text-sm">
                    {available.length === 0 ? (
                      <div className="px-3 py-2 text-ink-faint">
                        {t('classEditor.everyoneIn')}
                      </div>
                    ) : (
                      available.map((s) => (
                        <button
                          key={s.id}
                          className="w-full rounded px-3 py-2 text-left hover:bg-accent-soft"
                          onClick={() => {
                            addStudentToClass(draft.id, s.id)
                            setPicking(false)
                          }}
                        >
                          {s.name}
                          {s.level && (
                            <span className="ml-2 text-xs text-ink-faint">{s.level}</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <Field label={t('classEditor.notes')}>
          <textarea
            className="field min-h-[4rem]"
            value={draft.notes ?? ''}
            onChange={(e) => set('notes', e.target.value || null)}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={draft.archived}
            onChange={(e) => set('archived', e.target.checked)}
          />
          {t('classEditor.archived')}
        </label>
      </div>
    </Modal>
  )
}
