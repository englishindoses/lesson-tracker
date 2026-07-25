import type { Class, ClassStudent, Entry, Student } from './types'
import { formatDate, money } from './format'
import { PRESENCE_META } from './types'

interface Snapshot {
  students: Student[]
  classes: Class[]
  class_students: ClassStudent[]
  entries: Entry[]
}

function download(filename: string, mime: string, contents: string) {
  // A BOM so Excel opens accented student names correctly.
  const blob = new Blob([mime.startsWith('text/csv') ? '﻿' + contents : contents], {
    type: mime,
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Complete backup. This is the file that can restore everything. */
export function exportJSON(snap: Snapshot) {
  download(
    `lesson-tracker-backup-${stamp()}.json`,
    'application/json',
    JSON.stringify({ version: 1, exported_at: new Date().toISOString(), ...snap }, null, 2),
  )
}

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Readable spreadsheet of every row, for accounting or a tax return. */
export function exportCSV(snap: Snapshot) {
  const classById = new Map(snap.classes.map((c) => [c.id, c]))
  const studentsByClass = new Map<string, string[]>()
  const studentById = new Map(snap.students.map((s) => [s.id, s.name]))
  for (const cs of snap.class_students) {
    const list = studentsByClass.get(cs.class_id) ?? []
    list.push(studentById.get(cs.student_id) ?? '?')
    studentsByClass.set(cs.class_id, list)
  }

  const header = [
    'Class', 'Students', 'Type', 'Row', 'Date', 'Duration (min)',
    'Presence', 'Charged', 'Amount', 'Paid', 'Date paid',
    'Lesson notes', 'Extra notes',
  ]

  const rows = snap.entries
    .slice()
    .sort((a, b) =>
      ((a.entry_date ?? a.due_date ?? '') + a.id).localeCompare(
        (b.entry_date ?? b.due_date ?? '') + b.id,
      ),
    )
    .map((e) => {
      const cls = classById.get(e.class_id)
      return [
        cls?.name ?? '',
        (studentsByClass.get(e.class_id) ?? []).join(', '),
        cls?.lesson_type ?? '',
        e.kind === 'lesson' ? 'Lesson' : 'Payment',
        formatDate(e.entry_date ?? e.due_date),
        e.kind === 'lesson' ? e.duration_min ?? '' : '',
        e.presence ? PRESENCE_META[e.presence].label : '',
        e.kind === 'lesson' ? (e.not_charged ? 'No' : 'Yes') : '',
        e.amount != null ? money(e.amount) : '',
        e.kind === 'payment' ? (e.paid ? 'Yes' : 'No') : '',
        formatDate(e.paid_date),
        e.lesson_notes ?? '',
        e.extra_notes ?? '',
      ].map(csvCell)
    })

  download(
    `lesson-tracker-${stamp()}.csv`,
    'text/csv;charset=utf-8',
    [header.map(csvCell).join(','), ...rows.map((r) => r.join(','))].join('\r\n'),
  )
}
