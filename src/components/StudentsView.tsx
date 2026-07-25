import { useMemo, useState } from 'react'
import { newId, nowISO, useStore } from '../data/store'
import { LESSON_TYPES, type Student } from '../lib/types'
import Modal from './Modal'

function blankStudent(userId: string): Student {
  return {
    id: newId(),
    user_id: userId,
    name: '',
    contact: null,
    lesson_type: null,
    level: null,
    needs: null,
    notes: null,
    archived: false,
    created_at: nowISO(),
    updated_at: nowISO(),
  }
}

export default function StudentsView() {
  const userId = useStore((s) => s.userId)!
  const students = useStore((s) => s.students)
  const classes = useStore((s) => s.classes)
  const roster = useStore((s) => s.class_students)
  const upsertStudent = useStore((s) => s.upsertStudent)
  const deleteStudent = useStore((s) => s.deleteStudent)

  const [editing, setEditing] = useState<Student | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [query, setQuery] = useState('')

  const classesFor = useMemo(() => {
    const byStudent = new Map<string, string[]>()
    for (const cs of roster) {
      const cls = classes.find((c) => c.id === cs.class_id)
      if (!cls) continue
      byStudent.set(cs.student_id, [...(byStudent.get(cs.student_id) ?? []), cls.name])
    }
    return byStudent
  }, [roster, classes])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return students
      .filter((s) => s.archived === showArchived)
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [students, showArchived, query])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="style-hand rule-under mr-auto text-2xl">Students</h1>
        <input
          className="field max-w-[10rem]"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn" onClick={() => setShowArchived((v) => !v)}>
          {showArchived ? 'Show active' : 'Show archived'}
        </button>
        <button className="btn btn-primary" onClick={() => setEditing(blankStudent(userId))}>
          + Student
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="py-10 text-center text-sm text-ink-faint">
          {showArchived ? 'Nobody archived.' : 'No students yet — add your first one.'}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {visible.map((s) => {
            const inClasses = classesFor.get(s.id) ?? []
            return (
              <button
                key={s.id}
                onClick={() => setEditing(s)}
                className="card p-3 text-left hover:border-accent"
              >
                <div className="flex items-baseline gap-2">
                  <span className="style-hand text-lg">{s.name}</span>
                  {s.level && <span className="text-xs text-ink-faint">{s.level}</span>}
                </div>
                {s.lesson_type && (
                  <div className="mt-0.5 text-xs text-ink-soft">{s.lesson_type}</div>
                )}
                {s.needs && (
                  <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{s.needs}</p>
                )}
                <div className="mt-2 text-xs text-ink-faint">
                  {inClasses.length ? inClasses.join(' · ') : 'Not in a class yet'}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {editing && (
        <StudentEditor
          key={editing.id}
          student={editing}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            upsertStudent({ ...s, updated_at: nowISO() })
            setEditing(null)
          }}
          onDelete={() => {
            deleteStudent(editing.id)
            setEditing(null)
          }}
          existing={students.some((s) => s.id === editing.id)}
        />
      )}
    </div>
  )
}

function StudentEditor({
  student,
  onClose,
  onSave,
  onDelete,
  existing,
}: {
  student: Student
  onClose: () => void
  onSave: (s: Student) => void
  onDelete: () => void
  existing: boolean
}) {
  const [draft, setDraft] = useState<Student>(student)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const set = <K extends keyof Student>(k: K, v: Student[K]) =>
    setDraft((d) => ({ ...d, [k]: v }))

  return (
    <Modal
      title={existing ? draft.name || 'Student' : 'New student'}
      onClose={onClose}
      footer={
        <>
          {existing &&
            (confirmDelete ? (
              <>
                <span className="mr-auto text-sm text-danger">
                  Delete permanently? Their lesson rows stay.
                </span>
                <button className="btn" onClick={() => setConfirmDelete(false)}>
                  Keep
                </button>
                <button
                  className="btn border-danger text-danger"
                  onClick={onDelete}
                >
                  Delete
                </button>
              </>
            ) : (
              <button
                className="btn mr-auto border-danger text-danger"
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </button>
            ))}
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!draft.name.trim()}
            onClick={() => onSave(draft)}
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Name">
          <input
            className="field"
            autoFocus
            value={draft.name}
            onChange={(e) => set('name', e.target.value)}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Lesson type">
            <input
              className="field"
              list="lesson-types"
              value={draft.lesson_type ?? ''}
              onChange={(e) => set('lesson_type', e.target.value || null)}
            />
            <datalist id="lesson-types">
              {LESSON_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Field label="Level">
            <input
              className="field"
              placeholder="B1, C1…"
              value={draft.level ?? ''}
              onChange={(e) => set('level', e.target.value || null)}
            />
          </Field>
        </div>

        <Field label="Contact">
          <input
            className="field"
            placeholder="Email, WhatsApp…"
            value={draft.contact ?? ''}
            onChange={(e) => set('contact', e.target.value || null)}
          />
        </Field>

        <Field label="Needs / goals">
          <textarea
            className="field min-h-[4.5rem]"
            value={draft.needs ?? ''}
            onChange={(e) => set('needs', e.target.value || null)}
          />
        </Field>

        <Field label="Notes">
          <textarea
            className="field min-h-[4.5rem]"
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
          Archived (no longer studying)
        </label>
      </div>
    </Modal>
  )
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-ink-soft">{label}</span>
      {children}
    </label>
  )
}
