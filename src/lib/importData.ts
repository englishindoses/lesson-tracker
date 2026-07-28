import type { Class, ClassStudent, Entry, Student } from './types'
import type { TKey } from './i18n'

/**
 * Reading a backup file written by exportData's exportJSON.
 *
 * The whole file is checked before a single row is applied: a truncated or
 * wrong file is refused outright rather than half-restored. Every row keeps its
 * original id, so the restore is an upsert and running it twice changes nothing
 * the second time.
 *
 * This file only parses. Deciding what to keep and what is already there is the
 * store's job, in importRows.
 */

export interface Backup {
  students: Student[]
  classes: Class[]
  class_students: ClassStudent[]
  entries: Entry[]
}

export type ParseResult =
  | { ok: true; backup: Backup }
  | { ok: false; error: TKey }

/** The version exportJSON writes. An older or newer file is refused. */
const SUPPORTED = 1

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

const isText = (v: unknown) => typeof v === 'string' && v.length > 0

/**
 * Enough of a check to be sure this is our file and its rows can be written.
 * Not a full schema: a missing optional note is harmless, a missing id is not.
 */
function looksLikeRows(rows: unknown, required: string[]): boolean {
  if (!Array.isArray(rows)) return false
  return rows.every((row) => isRecord(row) && required.every((k) => isText(row[k])))
}

export function parseBackup(text: string): ParseResult {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'import.notJSON' }
  }

  if (!isRecord(raw)) return { ok: false, error: 'import.notBackup' }
  if (raw.version !== SUPPORTED) return { ok: false, error: 'import.wrongVersion' }

  const { students, classes, class_students, entries } = raw
  if (
    !looksLikeRows(students, ['id', 'name']) ||
    !looksLikeRows(classes, ['id', 'name']) ||
    !looksLikeRows(class_students, ['class_id', 'student_id']) ||
    !looksLikeRows(entries, ['id', 'class_id', 'kind'])
  ) {
    return { ok: false, error: 'import.notBackup' }
  }

  return {
    ok: true,
    backup: {
      students: students as Student[],
      classes: classes as Class[],
      class_students: class_students as ClassStudent[],
      entries: entries as Entry[],
    },
  }
}

/** Read a picked file as text, so the caller can stay synchronous about the rest. */
export async function readFile(file: File): Promise<ParseResult> {
  try {
    return parseBackup(await file.text())
  } catch {
    return { ok: false, error: 'import.unreadable' }
  }
}
