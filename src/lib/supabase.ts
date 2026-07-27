import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True once .env holds real values rather than the placeholders. */
export const isConfigured = Boolean(
  url && anonKey && !url.includes('YOUR-PROJECT-REF') && !anonKey.includes('YOUR-ANON'),
)

/**
 * Unlike every other setting, this one stays on the device -- and is scoped to
 * the account as well. How much you trust the machine you are sitting at is a
 * fact about that machine, and two people sharing a laptop can reasonably
 * disagree about it, so it is neither synced nor shared.
 */
const stayKey = (uid: string | null) => (uid ? `lt.stayLoggedIn.${uid}` : 'lt.stayLoggedIn')

/** Set once auth resolves; until then there is no account to ask about. */
let activeUser: string | null = null

/** Default on: asking her to sign in on every visit is not what a planner does. */
export function staysLoggedIn() {
  return localStorage.getItem(stayKey(activeUser)) !== 'false'
}

/**
 * Called when the account becomes known. The session token was written a
 * moment earlier under the default, so if this account had asked not to stay
 * signed in we move it now. The window where it sat in localStorage is a
 * single page load.
 */
export function bindStayToUser(uid: string) {
  activeUser = uid
  const scoped = localStorage.getItem(stayKey(uid))
  if (scoped === null) {
    // First sign-in since this became per-account: adopt whatever the device
    // was set to, so her existing choice is not silently reset.
    const legacy = localStorage.getItem('lt.stayLoggedIn')
    if (legacy !== null) localStorage.setItem(stayKey(uid), legacy)
  }
  if (!staysLoggedIn()) setStaysLoggedIn(false)
}

export function unbindStay() {
  activeUser = null
}

/**
 * Where the session is stored decides how long it lasts: localStorage survives
 * closing the browser, sessionStorage does not. The switch also moves whatever
 * is already stored, so turning it off takes effect immediately rather than at
 * the next sign-in.
 */
export function setStaysLoggedIn(stay: boolean) {
  localStorage.setItem(stayKey(activeUser), stay ? 'true' : 'false')
  const from = stay ? sessionStorage : localStorage
  const to = stay ? localStorage : sessionStorage
  for (const key of Object.keys(from)) {
    if (!key.startsWith('sb-')) continue
    const value = from.getItem(key)
    if (value === null) continue
    to.setItem(key, value)
    from.removeItem(key)
  }
}

/** Reads from wherever the session is; writes to wherever it currently belongs. */
const authStorage = {
  getItem: (key: string) => localStorage.getItem(key) ?? sessionStorage.getItem(key),
  setItem: (key: string, value: string) =>
    (staysLoggedIn() ? localStorage : sessionStorage).setItem(key, value),
  removeItem: (key: string) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: authStorage,
      },
    })
  : null
