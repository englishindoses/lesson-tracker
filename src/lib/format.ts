// Locale settings: Brazilian real, and dates written with the weekday first
// (e.g. "Sat 25/07/2026").

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
})

export function money(value: number): string {
  return brl.format(value)
}

/** Signed money, used where a negative total means credit rather than debt. */
export function moneySigned(value: number): string {
  return value < 0 ? `-${brl.format(Math.abs(value))}` : brl.format(value)
}

/**
 * Dates are stored as plain "YYYY-MM-DD" strings, never as Date objects, so a
 * lesson on the 4th can't drift to the 3rd through a timezone conversion.
 */
export function parseISODate(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m, d }
}

function weekdayOf(iso: string): string {
  const { y, m, d } = parseISODate(iso)
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

const pad = (n: number) => String(n).padStart(2, '0')

/** "Sat 25/07/2026" */
export function formatDate(iso: string | null): string {
  if (!iso) return ''
  const { y, m, d } = parseISODate(iso)
  return `${weekdayOf(iso)} ${pad(d)}/${pad(m)}/${y}`
}

/** "Sat 25/07" -- for narrow columns on a phone. */
export function formatDateShort(iso: string | null): string {
  if (!iso) return ''
  const { m, d } = parseISODate(iso)
  return `${weekdayOf(iso)} ${pad(d)}/${pad(m)}`
}

/** "July 2026" */
export function formatMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

/** "2026-07" -- the month bucket a date belongs to. */
export function monthKey(iso: string | null): string {
  return iso ? iso.slice(0, 7) : ''
}

/** Shifts a "YYYY-MM" month bucket, e.g. addMonths('2026-01', -1) -> '2025-12'. */
export function addMonths(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number)
  const shifted = new Date(Date.UTC(y, m - 1 + delta, 1))
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}`
}

/** Weekday index (0 = Sunday) of the 1st of a "YYYY-MM" month. */
export function firstWeekdayOfMonth(ym: string): number {
  const [y, m] = ym.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).getUTCDay()
}

export function daysInMonth(ym: string): number {
  const [y, m] = ym.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

/** "2026-07" + 25 -> "2026-07-25" */
export function dateInMonth(ym: string, day: number): string {
  return `${ym}-${pad(day)}`
}

export const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
export const WEEKDAY_NAMES = WEEKDAYS

export function todayISO(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** Adds whole days to a "YYYY-MM-DD" string, staying in local calendar terms. */
export function addDays(iso: string, days: number): string {
  const { y, m, d } = parseISODate(iso)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`
}

/** "3h 30m", "45m", "2h" */
export function duration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (!h) return `${m}m`
  if (!m) return `${h}h`
  return `${h}h ${m}m`
}
