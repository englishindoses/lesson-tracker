import { create } from 'zustand'
import { supabase, isConfigured, bindStayToUser, unbindStay } from '../lib/supabase'
import * as prefs from '../lib/prefs'
import type { Class, ClassStudent, Entry, Student } from '../lib/types'
import type { Backup } from '../lib/importData'
import { getLang, translate } from '../lib/i18n'

/**
 * Offline-first data layer.
 *
 * Reads come from an in-memory copy that is mirrored to localStorage, so the
 * app opens instantly and works with no connection. Writes are applied locally
 * first, then queued; the queue drains whenever we are online and signed in.
 * Conflicts resolve last-write-wins per row, which is right for a single-user
 * planner where the only "conflict" is your phone and laptop disagreeing.
 */

const CACHE_KEY = 'lt.cache.v2'
const QUEUE_KEY = 'lt.queue.v2'

type TableName = 'students' | 'classes' | 'class_students' | 'entries'

interface Snapshot {
  students: Student[]
  classes: Class[]
  class_students: ClassStudent[]
  entries: Entry[]
}

type QueueOp =
  | { op: 'upsert'; table: TableName; row: Record<string, unknown> }
  | { op: 'delete'; table: TableName; match: Record<string, string> }

const emptySnapshot = (): Snapshot => ({
  students: [],
  classes: [],
  class_students: [],
  entries: [],
})

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota or private-mode failure: the app still works, just without cache.
  }
}

/** Columns that only exist in the browser and must be stripped before upsert. */
function forWire(row: Record<string, unknown>) {
  const { ...rest } = row
  delete (rest as Record<string, unknown>).sort_key
  return rest
}

export type SyncState = 'offline' | 'syncing' | 'synced' | 'error' | 'unconfigured'

/** What a restore did: rows brought back, and rows left alone because they exist. */
export interface ImportResult {
  added: { students: number; classes: number; class_students: number; entries: number }
  skipped: number
  /** Rows dropped because the class or student they belong to is nowhere to be found. */
  orphaned: number
  signedOut: boolean
}

interface StoreState extends Snapshot {
  userId: string | null
  email: string | null
  authReady: boolean
  sync: SyncState
  syncError: string | null
  pendingWrites: number

  init: () => Promise<void>
  pull: () => Promise<void>
  flush: () => Promise<void>
  signOut: () => Promise<void>
  /** Resolves with an error message, or null when the password was changed. */
  changePassword: (password: string) => Promise<string | null>

  upsertStudent: (row: Student) => void
  deleteStudent: (id: string) => void
  upsertClass: (row: Class) => void
  deleteClass: (id: string) => void
  addStudentToClass: (classId: string, studentId: string) => void
  removeStudentFromClass: (classId: string, studentId: string) => void
  upsertEntry: (row: Entry) => void
  upsertEntries: (rows: Entry[]) => void
  deleteEntry: (id: string) => void

  /** Merge a parsed backup in. Adds what is missing, never overwrites, never deletes. */
  importRows: (backup: Backup) => ImportResult
  /** Every student, class and lesson, gone -- here and on the server. */
  deleteEverything: () => void

  snapshot: () => Snapshot
}

let queue: QueueOp[] = readJSON<QueueOp[]>(QUEUE_KEY, [])

function persistQueue() {
  writeJSON(QUEUE_KEY, queue)
}

export const useStore = create<StoreState>((set, get) => {
  const cacheNow = () => {
    const { students, classes, class_students, entries } = get()
    writeJSON(CACHE_KEY, { students, classes, class_students, entries })
  }

  /** Apply a change locally, mirror it to cache, queue it, and try to send. */
  const enqueue = (op: QueueOp) => {
    queue.push(op)
    persistQueue()
    set({ pendingWrites: queue.length })
    cacheNow()
    void get().flush()
  }

  return {
    ...readJSON<Snapshot>(CACHE_KEY, emptySnapshot()),
    userId: null,
    email: null,
    authReady: false,
    sync: isConfigured ? 'syncing' : 'unconfigured',
    syncError: null,
    pendingWrites: queue.length,

    async init() {
      if (!supabase) {
        set({ authReady: true, sync: 'unconfigured' })
        return
      }

      const { data } = await supabase.auth.getSession()
      const startId = data.session?.user.id ?? null
      // Before authReady, so the first paint after opening is already wearing
      // the right look rather than correcting itself a frame later.
      if (startId) {
        bindStayToUser(startId)
        void prefs.signIn(startId)
      }
      set({
        userId: startId,
        email: data.session?.user.email ?? null,
        authReady: true,
      })

      supabase.auth.onAuthStateChange((_event, session) => {
        const nextId = session?.user.id ?? null
        const changed = nextId !== get().userId
        set({ userId: nextId, email: session?.user.email ?? null })
        if (nextId && changed) {
          bindStayToUser(nextId)
          void prefs.signIn(nextId)
          void get().pull()
        }
        if (!nextId) {
          // Signing out must not leave another account's rows on the device.
          localStorage.removeItem(CACHE_KEY)
          set(emptySnapshot())
          // Nor its settings: the next person gets the default look and English.
          unbindStay()
          prefs.signOut()
        }
      })

      window.addEventListener('online', () => {
        void get().flush()
        prefs.flush()
      })
      window.addEventListener('offline', () => set({ sync: 'offline' }))
      window.addEventListener('focus', () => {
        if (get().userId && navigator.onLine) void get().pull()
      })

      if (get().userId) await get().pull()
    },

    async pull() {
      if (!supabase || !get().userId) return
      if (!navigator.onLine) {
        set({ sync: 'offline' })
        return
      }
      set({ sync: 'syncing', syncError: null })

      // Send anything queued before reading, so we don't pull stale rows over
      // edits that haven't landed yet.
      await get().flush()

      try {
        const [students, classes, roster, entries] = await Promise.all([
          supabase.from('students').select('*'),
          supabase.from('classes').select('*'),
          supabase.from('class_students').select('*'),
          supabase.from('entries').select('*'),
        ])
        const err =
          students.error || classes.error || roster.error || entries.error
        if (err) throw err

        set({
          students: (students.data ?? []) as Student[],
          classes: (classes.data ?? []) as Class[],
          class_students: (roster.data ?? []) as ClassStudent[],
          entries: (entries.data ?? []) as Entry[],
          sync: 'synced',
        })
        cacheNow()
      } catch (e) {
        set({ sync: 'error', syncError: (e as Error).message })
      }
    },

    async flush() {
      if (!supabase || !get().userId || !navigator.onLine || !queue.length) {
        if (!navigator.onLine) set({ sync: 'offline' })
        return
      }
      set({ sync: 'syncing' })

      while (queue.length) {
        const op = queue[0]
        try {
          const res =
            op.op === 'upsert'
              ? await supabase.from(op.table).upsert(forWire(op.row))
              : await supabase.from(op.table).delete().match(op.match)
          if (res.error) throw res.error
        } catch (e) {
          // Keep the op queued and try again on the next online event.
          set({ sync: 'error', syncError: (e as Error).message })
          return
        }
        queue.shift()
        persistQueue()
        set({ pendingWrites: queue.length })
      }
      set({ sync: 'synced', syncError: null })
    },

    async signOut() {
      await supabase?.auth.signOut()
    },

    async changePassword(password) {
      if (!supabase) return translate(getLang(), 'settings.noDatabase')
      if (!navigator.onLine) return translate(getLang(), 'settings.offlinePassword')
      const { error } = await supabase.auth.updateUser({ password })
      return error ? error.message : null
    },

    upsertStudent(row) {
      const rest = get().students.filter((s) => s.id !== row.id)
      set({ students: [...rest, row] })
      enqueue({ op: 'upsert', table: 'students', row: row as unknown as Record<string, unknown> })
    },

    deleteStudent(id) {
      set({
        students: get().students.filter((s) => s.id !== id),
        class_students: get().class_students.filter((cs) => cs.student_id !== id),
      })
      enqueue({ op: 'delete', table: 'students', match: { id } })
    },

    upsertClass(row) {
      const rest = get().classes.filter((c) => c.id !== row.id)
      set({ classes: [...rest, row] })
      enqueue({ op: 'upsert', table: 'classes', row: row as unknown as Record<string, unknown> })
    },

    deleteClass(id) {
      set({
        classes: get().classes.filter((c) => c.id !== id),
        class_students: get().class_students.filter((cs) => cs.class_id !== id),
        entries: get().entries.filter((e) => e.class_id !== id),
      })
      enqueue({ op: 'delete', table: 'classes', match: { id } })
    },

    addStudentToClass(classId, studentId) {
      const userId = get().userId
      if (!userId) return
      if (
        get().class_students.some(
          (cs) => cs.class_id === classId && cs.student_id === studentId,
        )
      )
        return
      const row: ClassStudent = { class_id: classId, student_id: studentId, user_id: userId }
      set({ class_students: [...get().class_students, row] })
      enqueue({ op: 'upsert', table: 'class_students', row: row as unknown as Record<string, unknown> })
    },

    removeStudentFromClass(classId, studentId) {
      set({
        class_students: get().class_students.filter(
          (cs) => !(cs.class_id === classId && cs.student_id === studentId),
        ),
      })
      enqueue({
        op: 'delete',
        table: 'class_students',
        match: { class_id: classId, student_id: studentId },
      })
    },

    upsertEntry(row) {
      const rest = get().entries.filter((e) => e.id !== row.id)
      set({ entries: [...rest, row] })
      enqueue({ op: 'upsert', table: 'entries', row: row as unknown as Record<string, unknown> })
    },

    upsertEntries(rows) {
      const ids = new Set(rows.map((r) => r.id))
      set({ entries: [...get().entries.filter((e) => !ids.has(e.id)), ...rows] })
      for (const row of rows) {
        queue.push({
          op: 'upsert',
          table: 'entries',
          row: row as unknown as Record<string, unknown>,
        })
      }
      persistQueue()
      set({ pendingWrites: queue.length })
      cacheNow()
      void get().flush()
    },

    deleteEntry(id) {
      set({ entries: get().entries.filter((e) => e.id !== id) })
      enqueue({ op: 'delete', table: 'entries', match: { id } })
    },

    /**
     * Restore. Deliberately add-only: a row whose id is already here is left
     * exactly as it is, so pointing this at an old file can never undo newer
     * work. What it does do is bring back anything that has gone missing.
     *
     * Rows are stamped with the account doing the restoring, because user_id is
     * what row-level security checks -- a file exported from another account
     * would otherwise be rejected in full by the server.
     *
     * One local update and one queue write for the whole file rather than per
     * row, since a year of teaching is thousands of rows. Students and classes
     * are queued ahead of the rows that point at them, so the server never sees
     * a lesson before its class.
     */
    importRows(backup) {
      const userId = get().userId
      if (!userId) {
        return {
          added: { students: 0, classes: 0, class_students: 0, entries: 0 },
          skipped: 0,
          orphaned: 0,
          signedOut: true,
        }
      }

      const state = get()
      const own = <T extends { user_id: string }>(row: T): T => ({ ...row, user_id: userId })

      const haveStudent = new Set(state.students.map((s) => s.id))
      const haveClass = new Set(state.classes.map((c) => c.id))
      const haveEntry = new Set(state.entries.map((e) => e.id))
      const haveLink = new Set(
        state.class_students.map((cs) => `${cs.class_id}/${cs.student_id}`),
      )

      const newStudents = backup.students.filter((s) => !haveStudent.has(s.id)).map(own)
      const newClasses = backup.classes.filter((c) => !haveClass.has(c.id)).map(own)

      // A lesson needs its class, and a roster row needs both ends: after the
      // file's own rows are counted in, anything still dangling is dropped
      // rather than queued to fail against the server's foreign keys forever.
      const classesAfter = new Set([...haveClass, ...newClasses.map((c) => c.id)])
      const studentsAfter = new Set([...haveStudent, ...newStudents.map((s) => s.id)])

      const wantedLinks = backup.class_students.filter(
        (cs) => !haveLink.has(`${cs.class_id}/${cs.student_id}`),
      )
      const newLinks = wantedLinks
        .filter((cs) => classesAfter.has(cs.class_id) && studentsAfter.has(cs.student_id))
        .map(own)

      const wantedEntries = backup.entries.filter((e) => !haveEntry.has(e.id))
      const newEntries = wantedEntries
        .filter((e) => classesAfter.has(e.class_id))
        .map(own)

      const result: ImportResult = {
        added: {
          students: newStudents.length,
          classes: newClasses.length,
          class_students: newLinks.length,
          entries: newEntries.length,
        },
        skipped:
          backup.students.length - newStudents.length +
          (backup.classes.length - newClasses.length) +
          (backup.class_students.length - wantedLinks.length) +
          (backup.entries.length - wantedEntries.length),
        orphaned:
          wantedLinks.length - newLinks.length + (wantedEntries.length - newEntries.length),
        signedOut: false,
      }

      const total =
        newStudents.length + newClasses.length + newLinks.length + newEntries.length
      if (!total) return result

      set({
        students: [...state.students, ...newStudents],
        classes: [...state.classes, ...newClasses],
        class_students: [...state.class_students, ...newLinks],
        entries: [...state.entries, ...newEntries],
      })

      const push = (table: TableName, rows: { [k: string]: unknown }[]) => {
        for (const row of rows) queue.push({ op: 'upsert', table, row })
      }
      push('students', newStudents as unknown as Record<string, unknown>[])
      push('classes', newClasses as unknown as Record<string, unknown>[])
      push('class_students', newLinks as unknown as Record<string, unknown>[])
      push('entries', newEntries as unknown as Record<string, unknown>[])

      persistQueue()
      set({ pendingWrites: queue.length })
      cacheNow()
      void get().flush()

      return result
    },

    /**
     * Start again from nothing. Four queued deletes matched on user_id rather
     * than thousands matched on id: row-level security already scopes a delete
     * to the account, so this is both smaller and impossible to get half-right.
     *
     * Children before parents, since the queue is FIFO and the server has
     * foreign keys. Queued rather than sent directly, so it behaves offline like
     * every other change and reaches the other devices on the next sync.
     */
    deleteEverything() {
      const userId = get().userId
      if (!userId) return

      set(emptySnapshot())
      for (const table of ['entries', 'class_students', 'classes', 'students'] as TableName[]) {
        queue.push({ op: 'delete', table, match: { user_id: userId } })
      }
      persistQueue()
      set({ pendingWrites: queue.length })
      cacheNow()
      void get().flush()
    },

    snapshot() {
      const { students, classes, class_students, entries } = get()
      return { students, classes, class_students, entries }
    },
  }
})

/** Fresh id that works offline -- the server never assigns one for us. */
export function newId(): string {
  if (crypto.randomUUID) return crypto.randomUUID()
  return URL.createObjectURL(new Blob()).slice(-36)
}

export function nowISO(): string {
  return new Date().toISOString()
}
