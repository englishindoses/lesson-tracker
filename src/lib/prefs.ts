import { supabase } from './supabase'

/**
 * Everything personal that isn't her data: the look, the language, and the two
 * view switches.
 *
 * These belong to the account, not the machine. Signing in on a new phone
 * should bring your own palette with you, and signing in as someone else on a
 * shared laptop must not hand them your settings. Both of those were wrong
 * while this lived in one unscoped localStorage key.
 *
 * The blob is deliberately untyped here. This module moves it between the
 * browser and the server and knows nothing about what a palette or a language
 * is -- theme.ts and i18n.ts own the meaning, and both already fall back
 * per-field, so an empty blob is simply "all defaults".
 *
 * Signed out there is no blob at all, which is what makes the sign-in page
 * always Whimsical and always English.
 */

export type Prefs = {
  theme?: unknown
  mode?: unknown
  lang?: unknown
  classView?: unknown
  pinFilters?: unknown
  /** The full table on a narrow screen, instead of one card per row. */
  phoneTable?: unknown
  /** Only ever adopted, never written: the pre-four-choices theme name. */
  style?: unknown
}

/** The device's copy of one account's settings, so a return visit is instant. */
const mirrorKey = (uid: string) => `lt.prefs.${uid}`
/** Who was last signed in, so index.html can pick the right mirror pre-paint. */
const LAST_USER_KEY = 'lt.lastUser'

/**
 * Written by versions that kept one unscoped copy for the whole device.
 * Partial: settings added after that era were never stored this way.
 */
const LEGACY: Partial<Record<keyof Prefs, string>> = {
  theme: 'lt.theme',
  mode: 'lt.mode',
  lang: 'lt.lang',
  classView: 'lt.classView',
  pinFilters: 'lt.pinFilters',
  style: 'lt.style',
}

let userId: string | null = null
let data: Prefs = {}
/** Epoch ms of the last local change, compared against the server's row. */
let updatedAt = 0
/** A change made offline, or one whose push failed. */
let dirty = false
let pushTimer: ReturnType<typeof setTimeout> | null = null

const listeners = new Set<() => void>()

function notify() {
  for (const fn of listeners) fn()
}

export function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function get(): Prefs {
  return data
}

export function isSignedIn() {
  return userId !== null
}

/**
 * Change one or more settings. Applies locally at once -- the look must not
 * wait for a round trip -- then pushes in the background.
 */
export function patch(next: Prefs) {
  data = { ...data, ...next }
  updatedAt = Date.now()
  dirty = true
  saveMirror()
  notify()
  schedulePush()
}

function saveMirror() {
  if (!userId) return
  try {
    localStorage.setItem(mirrorKey(userId), JSON.stringify({ data, updatedAt, dirty }))
  } catch {
    // Quota or private mode: the settings still work, they just won't survive
    // a reload before the server has them.
  }
}

function readMirror(uid: string): { data: Prefs; updatedAt: number; dirty: boolean } | null {
  try {
    const raw = localStorage.getItem(mirrorKey(uid))
    if (!raw) return null
    const parsed = JSON.parse(raw) as { data?: Prefs; updatedAt?: number; dirty?: boolean }
    return {
      data: parsed.data ?? {},
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
      dirty: parsed.dirty === true,
    }
  } catch {
    return null
  }
}

/**
 * First sign-in after the change to per-account settings: adopt whatever this
 * device was already using, so her existing look survives the upgrade instead
 * of being reset to the default preset.
 */
function adoptLegacy(): Prefs {
  const out: Prefs = {}
  for (const [field, key] of Object.entries(LEGACY) as [keyof Prefs, string][]) {
    const raw = localStorage.getItem(key)
    if (raw === null) continue
    if (field === 'theme') {
      try {
        out.theme = JSON.parse(raw)
      } catch {
        // Unreadable: leave it out and let the field fall back.
      }
    } else if (field === 'pinFilters') {
      out.pinFilters = raw !== 'off'
    } else {
      out[field] = raw
    }
  }
  return out
}

/**
 * Called when the account is known. Applies the device's copy immediately so
 * there is no flash, then reconciles with the server.
 */
export async function signIn(uid: string) {
  userId = uid
  try {
    localStorage.setItem(LAST_USER_KEY, uid)
  } catch {
    // Only costs a pre-paint flash next time.
  }

  const mirror = readMirror(uid)
  if (mirror) {
    data = mirror.data
    updatedAt = mirror.updatedAt
    dirty = mirror.dirty
  } else {
    data = adoptLegacy()
    updatedAt = Date.now()
    // Nothing on this device belonged to this account before, so whatever we
    // adopted still needs pushing.
    dirty = Object.keys(data).length > 0
    saveMirror()
  }
  notify()

  await reconcile()
}

/** Signed out: back to no settings at all, which is the default look and English. */
export function signOut() {
  userId = null
  data = {}
  updatedAt = 0
  dirty = false
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
  try {
    localStorage.removeItem(LAST_USER_KEY)
  } catch {
    // Nothing to do -- worst case the next visit paints the old look briefly.
  }
  notify()
}

/**
 * Last write wins, the same rule the data layer uses. Compared on wall-clock
 * time, so a device with a badly wrong clock could hold on to a stale look --
 * a wrong palette, never wrong data.
 */
async function reconcile() {
  if (!supabase || !userId || !navigator.onLine) return
  const uid = userId
  try {
    const { data: row, error } = await supabase
      .from('preferences')
      .select('data, updated_at')
      .eq('user_id', uid)
      .maybeSingle()
    if (error) return
    if (userId !== uid) return // signed out again while we were waiting

    const remoteAt = row ? Date.parse(row.updated_at as string) : 0
    if (row && remoteAt > updatedAt && !dirty) {
      data = (row.data as Prefs) ?? {}
      updatedAt = remoteAt
      saveMirror()
      notify()
      return
    }
    if (!row || dirty || updatedAt > remoteAt) await push()
  } catch {
    // Offline or unreachable: the mirror is still correct and dirty stays set.
  }
}

function schedulePush() {
  if (pushTimer) clearTimeout(pushTimer)
  // Clicking through presets to compare them shouldn't be one write each.
  pushTimer = setTimeout(() => void push(), 800)
}

export async function push() {
  if (pushTimer) {
    clearTimeout(pushTimer)
    pushTimer = null
  }
  if (!supabase || !userId || !navigator.onLine) return
  const uid = userId
  try {
    const { error } = await supabase
      .from('preferences')
      .upsert({ user_id: uid, data, updated_at: new Date(updatedAt).toISOString() })
    if (!error && userId === uid) {
      dirty = false
      saveMirror()
    }
  } catch {
    // Stays dirty, so the next reconnect or sign-in sends it.
  }
}

/** Retry anything that was changed while offline. */
export function flush() {
  if (dirty) void push()
}
