import type { Class, ClassStudent, Entry, Student } from './types'
import { buildLedger, totalsFor, type Line, type PaidStatus, type Totals } from './ledger'
import { formatDate, formatMonth, monthKey } from './format'
import { getLang, presenceKey, translate, type TKey } from './i18n'

interface Snapshot {
  students: Student[]
  classes: Class[]
  class_students: ClassStudent[]
  entries: Entry[]
}

/**
 * What to put in a spreadsheet. The months are "YYYY-MM" buckets, inclusive at
 * both ends; null means open-ended. Archived people and classes are left out
 * unless asked for, so last year's students don't turn up in this year's
 * figures.
 */
export interface ExportOptions {
  from: string | null
  to: string | null
  includeArchived: boolean
}

export const ALL_MONTHS: ExportOptions = { from: null, to: null, includeArchived: false }

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

/** "2026-01_2026-07", or "all" — part of the filename, so she can tell them apart. */
function rangeTag(o: ExportOptions): string {
  if (!o.from && !o.to) return 'all'
  return `${o.from ?? 'start'}_${o.to ?? 'end'}`
}

/**
 * Semicolons, not commas. A Brazilian Excel reads a comma as the decimal point
 * and expects semicolons between the columns — fed commas it puts the whole
 * line in one cell, which is what made the first version of this unreadable.
 * Google Sheets detects either.
 */
const SEP = ';'

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * Money as a plain number in Brazilian form ("1234,50"), not "R$ 1.234,50":
 * a spreadsheet can add these up, and a currency symbol turns the column into
 * text she then has to clean by hand.
 */
const num = (v: number) => v.toFixed(2).replace('.', ',')

const inRange = (ym: string, o: ExportOptions) =>
  (!o.from || ym >= o.from) && (!o.to || ym <= o.to)

const entryMonth = (e: Entry) => monthKey(e.entry_date ?? e.due_date)

function byDate(a: Entry, b: Entry) {
  return ((a.entry_date ?? a.due_date ?? '') + a.id).localeCompare(
    (b.entry_date ?? b.due_date ?? '') + b.id,
  )
}

/**
 * The slice of the data a spreadsheet describes.
 *
 * Note the two different sets of entries. `visible` is what gets a row and
 * what the totals are built from; `allByClass` is the class's whole history,
 * which is what the ledger has to be built on — a payment in March settles a
 * lesson in February even when only March was asked for.
 */
function select(snap: Snapshot, o: ExportOptions) {
  const classes = snap.classes.filter((c) => o.includeArchived || !c.archived)
  const students = snap.students.filter((s) => o.includeArchived || !s.archived)
  const classIds = new Set(classes.map((c) => c.id))

  const allByClass = new Map<string, Entry[]>()
  for (const e of snap.entries) {
    if (!classIds.has(e.class_id)) continue
    const list = allByClass.get(e.class_id) ?? []
    list.push(e)
    allByClass.set(e.class_id, list)
  }

  const visible = snap.entries
    .filter((e) => classIds.has(e.class_id) && inRange(entryMonth(e), o))
    .sort(byDate)

  const ledgers = new Map(
    classes.map((c) => [c.id, buildLedger(c, allByClass.get(c.id) ?? [])]),
  )

  // Both ways round: a class needs its students named, a student needs theirs.
  const studentIds = new Set(students.map((s) => s.id))
  const studentsOfClass = new Map<string, Student[]>()
  const classesOfStudent = new Map<string, Class[]>()
  const studentById = new Map(snap.students.map((s) => [s.id, s]))
  const classById = new Map(classes.map((c) => [c.id, c]))
  for (const cs of snap.class_students) {
    const cls = classById.get(cs.class_id)
    const student = studentById.get(cs.student_id)
    if (!cls || !student) continue
    // A class still lists an archived student by name, so a lesson row isn't
    // left anonymous; the student sheet is the one that leaves them out.
    studentsOfClass.set(cs.class_id, [...(studentsOfClass.get(cs.class_id) ?? []), student])
    if (studentIds.has(student.id))
      classesOfStudent.set(student.id, [...(classesOfStudent.get(student.id) ?? []), cls])
  }

  return { classes, students, classById, visible, ledgers, studentsOfClass, classesOfStudent }
}

function toCSV(header: string[], rows: unknown[][]): string {
  // No "sep=;" preamble: Excel understands it, but Google Sheets shows it as a
  // stray first row and then stops detecting the separator on its own.
  return [header, ...rows].map((r) => r.map(csvCell).join(SEP)).join('\r\n')
}

/** "January 2026 — July 2026", for the note at the top of a sheet. */
function rangeWords(o: ExportOptions, say: (k: TKey) => string): string {
  if (!o.from && !o.to) return say('csv.allMonths')
  const from = o.from ? formatMonth(o.from) : say('settings.fromStart')
  const to = o.to ? formatMonth(o.to) : say('settings.toEnd')
  return o.from === o.to && o.from ? formatMonth(o.from) : `${from} — ${to}`
}

export const statusKey = (s: PaidStatus) => `csv.status.${s}` as TKey

/** Complete backup. This is the file that can restore everything. */
export function exportJSON(snap: Snapshot) {
  download(
    `lesson-tracker-backup-${stamp()}.json`,
    'application/json',
    JSON.stringify({ version: 1, exported_at: new Date().toISOString(), ...snap }, null, 2),
  )
}

/**
 * One row per lesson and payment: what it was, what it charged, whether it has
 * been paid. The charge is the ledger's, not the typed-in amount, so a struck
 * out row reads 0 and a monthly class puts its money on the invoice row.
 */
export function exportLessonsCSV(snap: Snapshot, o: ExportOptions) {
  const lang = getLang()
  const say = (key: TKey) => translate(lang, key)
  const { classById, visible, ledgers, studentsOfClass } = select(snap, o)

  const header: TKey[] = [
    'classView.colDate', 'csv.class', 'csv.students', 'csv.type', 'csv.row', 'csv.duration',
    'entry.presence', 'csv.charge', 'csv.payment', 'csv.status', 'csv.datePaid',
    'entry.lessonNotes', 'classView.extraNotes',
  ]

  const rows = visible.map((e) => {
    const cls = classById.get(e.class_id)
    const line = ledgers.get(e.class_id)?.lines.get(e.id)
    const isLesson = e.kind === 'lesson'
    return [
      formatDate(e.entry_date ?? e.due_date),
      cls?.name ?? '',
      (studentsOfClass.get(e.class_id) ?? []).map((s) => s.name).join(', '),
      cls?.lesson_type ?? '',
      say(isLesson ? 'classView.lesson' : 'classView.payment'),
      isLesson ? e.duration_min ?? '' : '',
      e.presence ? say(presenceKey(e.presence)) : '',
      num(line?.charge ?? 0),
      !isLesson && e.paid ? num(e.amount ?? 0) : '',
      line ? say(statusKey(line.status)) : '',
      formatDate(e.paid_date),
      e.lesson_notes ?? '',
      e.extra_notes ?? '',
    ]
  })

  download(
    `lesson-tracker-lessons-${rangeTag(o)}.csv`,
    'text/csv;charset=utf-8',
    toCSV(header.map(say), rows),
  )
}

/**
 * One row per student: who they are, what they need, which classes they are
 * in, and how much teaching they had in the months chosen.
 *
 * No money here on purpose. Money is owed by a class, not by a person — a
 * class can have two students in it, and splitting its figures between them
 * would be an invention. The classes sheet carries it.
 */
export function exportStudentsCSV(snap: Snapshot, o: ExportOptions) {
  const lang = getLang()
  const say = (key: TKey) => translate(lang, key)
  const { students, visible, ledgers, classesOfStudent } = select(snap, o)

  const header: TKey[] = [
    'students.name', 'csv.contact', 'csv.level', 'csv.needs', 'csv.studentNotes', 'csv.archived',
    'csv.classes', 'csv.months', 'csv.lessonCount', 'csv.taughtTime', 'csv.scheduledTime',
  ]

  const months = rangeWords(o, say)

  const rows = students.map((s) => {
    const classes = classesOfStudent.get(s.id) ?? []
    const ids = new Set(classes.map((c) => c.id))
    const mine = visible.filter((e) => ids.has(e.class_id))
    const lines: Map<string, Line> = new Map(
      classes.flatMap((c) => [...(ledgers.get(c.id)?.lines.entries() ?? [])]),
    )
    const t = totalsFor(mine, lines)

    return [
      s.name,
      s.contact ?? '',
      s.level ?? '',
      s.needs ?? '',
      s.notes ?? '',
      say(s.archived ? 'csv.yes' : 'csv.no'),
      classes.map((c) => c.name).join(', '),
      months,
      t.lessonCount,
      t.taughtMinutes,
      t.scheduledMinutes,
    ]
  })

  download(
    `lesson-tracker-students-${rangeTag(o)}.csv`,
    'text/csv;charset=utf-8',
    toCSV(header.map(say), rows),
  )
}

/**
 * One row per class, and this is where the money lives: charged and received
 * for the months chosen, and what the class owes overall.
 *
 * Owed is deliberately not filtered by month — what is outstanding is a fact
 * about the class as a whole, the same rule the bottom bar follows.
 */
export function exportClassesCSV(snap: Snapshot, o: ExportOptions) {
  const lang = getLang()
  const say = (key: TKey) => translate(lang, key)
  const { classes, visible, ledgers, studentsOfClass } = select(snap, o)

  const header: TKey[] = [
    'csv.className', 'csv.students', 'csv.type', 'csv.pricing', 'csv.price', 'csv.archived',
    'csv.months', 'csv.lessonCount', 'csv.taughtTime', 'csv.scheduledTime',
    'csv.charged', 'csv.received', 'csv.owedNow',
  ]

  const months = rangeWords(o, say)

  const rows = classes.map((c) => {
    const led = ledgers.get(c.id)
    const t = totalsFor(
      visible.filter((e) => e.class_id === c.id),
      led?.lines ?? new Map<string, Line>(),
    )
    const monthlyClass = c.pricing_mode === 'monthly'

    return [
      c.name,
      (studentsOfClass.get(c.id) ?? []).map((s) => s.name).join(', '),
      c.lesson_type ?? '',
      say(monthlyClass ? 'classEditor.monthly' : 'classEditor.perLesson'),
      num((monthlyClass ? c.monthly_price : c.price_per_lesson) ?? 0),
      say(c.archived ? 'csv.yes' : 'csv.no'),
      months,
      t.lessonCount,
      t.taughtMinutes,
      t.scheduledMinutes,
      num(t.charged),
      num(t.received),
      num(led?.owed ?? 0),
    ]
  })

  download(
    `lesson-tracker-classes-${rangeTag(o)}.csv`,
    'text/csv;charset=utf-8',
    toCSV(header.map(say), rows),
  )
}

/** One class as it appears in the printable report. */
export interface ReportClass {
  cls: Class
  students: Student[]
  rows: { entry: Entry; line: Line | undefined }[]
  totals: Totals
  owed: number
}

export interface Report {
  /** The months in words, for the heading. */
  range: string
  students: Student[]
  classes: ReportClass[]
}

/**
 * The same slice of data as the spreadsheets, arranged for reading rather than
 * for a machine: students first, then a section per class with its rows and
 * its totals. A class with nothing in the months chosen is left out — an empty
 * heading only wastes a page.
 */
export function buildReport(snap: Snapshot, o: ExportOptions): Report {
  const lang = getLang()
  const say = (key: TKey) => translate(lang, key)
  const { classes, students, visible, ledgers, studentsOfClass } = select(snap, o)

  return {
    range: rangeWords(o, say),
    students,
    classes: classes
      .map((cls) => {
        const led = ledgers.get(cls.id)
        const mine = visible.filter((e) => e.class_id === cls.id)
        return {
          cls,
          students: studentsOfClass.get(cls.id) ?? [],
          rows: mine.map((entry) => ({ entry, line: led?.lines.get(entry.id) })),
          totals: totalsFor(mine, led?.lines ?? new Map<string, Line>()),
          owed: led?.owed ?? 0,
        }
      })
      .filter((c) => c.rows.length),
  }
}

/** The months that actually have something in them, newest first. */
export function monthsPresent(snap: Snapshot): string[] {
  const set = new Set<string>()
  for (const e of snap.entries) {
    const m = entryMonth(e)
    if (m) set.add(m)
  }
  return [...set].sort().reverse()
}

/** How many rows an export would carry — so a pointless download can be caught. */
export function countRows(snap: Snapshot, o: ExportOptions) {
  const { students, classes, visible } = select(snap, o)
  return { students: students.length, classes: classes.length, entries: visible.length }
}
