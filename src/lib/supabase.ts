import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** True once .env holds real values rather than the placeholders. */
export const isConfigured = Boolean(
  url && anonKey && !url.includes('YOUR-PROJECT-REF') && !anonKey.includes('YOUR-ANON'),
)

const STAY_KEY = 'lt.stayLoggedIn'

/** Default on: asking her to sign in on every visit is not what a planner does. */
export function staysLoggedIn() {
  return localStorage.getItem(STAY_KEY) !== 'false'
}

/**
 * Where the session is stored decides how long it lasts: localStorage survives
 * closing the browser, sessionStorage does not. The switch also moves whatever
 * is already stored, so turning it off takes effect immediately rather than at
 * the next sign-in.
 */
export function setStaysLoggedIn(stay: boolean) {
  localStorage.setItem(STAY_KEY, stay ? 'true' : 'false')
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
