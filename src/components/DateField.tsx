import { useEffect, useRef, useState } from 'react'
import { parseISODate } from '../lib/format'

const pad = (n: number) => String(n).padStart(2, '0')

/** "2026-07-25" -> "25/07/2026" */
function toDisplay(iso: string | null): string {
  if (!iso) return ''
  const { y, m, d } = parseISODate(iso)
  return `${pad(d)}/${pad(m)}/${y}`
}

/** Groups digits as the user types: "2507" -> "25/07". */
function mask(text: string): string {
  const digits = text.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

/** "25/07/2026" -> "2026-07-25", or null if it isn't a real date. */
function toISO(text: string): string | null {
  const digits = text.replace(/\D/g, '')
  if (digits.length !== 8) return null
  const d = Number(digits.slice(0, 2))
  const m = Number(digits.slice(2, 4))
  const y = Number(digits.slice(4, 8))
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2999) return null
  // Rejects the 31st of a 30-day month and bad leap days.
  const probe = new Date(Date.UTC(y, m - 1, d))
  if (probe.getUTCDate() !== d || probe.getUTCMonth() !== m - 1) return null
  return `${y}-${pad(m)}-${pad(d)}`
}

/**
 * A date field that is always day-first.
 *
 * A native <input type="date"> renders in the *browser's* locale, so the same
 * app shows 25/07/2026 on one machine and 07/25/2026 on another, with no way
 * to force it. So the visible box is a plain text field we format ourselves,
 * and the native picker is kept alongside for tapping a date on a phone.
 */
export default function DateField({
  value,
  onChange,
  className = 'field tabular',
  'aria-label': ariaLabel,
}: {
  value: string | null
  onChange: (iso: string | null) => void
  className?: string
  'aria-label'?: string
}) {
  const [text, setText] = useState(toDisplay(value))
  const ours = useRef<string | null>(value)
  const picker = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value !== ours.current) {
      ours.current = value
      setText(toDisplay(value))
    }
  }, [value])

  const commit = (iso: string | null) => {
    ours.current = iso
    onChange(iso)
  }

  return (
    <span className="relative flex items-center gap-1">
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/yyyy"
        aria-label={ariaLabel}
        className={`${className} flex-1`}
        value={text}
        onChange={(e) => {
          const next = mask(e.target.value)
          setText(next)
          if (next === '') commit(null)
          else {
            const iso = toISO(next)
            if (iso) commit(iso)
          }
        }}
        onBlur={() => setText(toDisplay(ours.current))}
      />

      <button
        type="button"
        className="shrink-0 px-1 text-ink-faint hover:text-ink"
        aria-label="Open calendar"
        title="Pick from a calendar"
        onClick={() => {
          const el = picker.current
          if (!el) return
          try {
            el.showPicker()
          } catch {
            el.focus()
          }
        }}
      >
        ▤
      </button>

      {/* Rendered but invisible: showPicker() refuses to open on a hidden input. */}
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-px w-px opacity-0"
        value={value ?? ''}
        onChange={(e) => {
          const iso = e.target.value || null
          commit(iso)
          setText(toDisplay(iso))
        }}
      />
    </span>
  )
}
