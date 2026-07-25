import { useEffect, useRef, useState, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | null
  onChange: (value: number | null) => void
  /** Used when the box is left empty on blur. Omit to allow a genuinely empty value. */
  fallback?: number
}

/**
 * A number input you can actually edit.
 *
 * A plain controlled <input type="number"> bound straight to a number fights
 * you: clearing the last digit yields "", and any `Number(x) || default`
 * coercion silently snaps the old value back, so a 60 can never become a 6.
 * Here the text you typed is the state, and the parsed number is only pushed
 * outward when it's valid.
 */
export default function NumberField({ value, onChange, fallback, ...rest }: Props) {
  const [text, setText] = useState(value == null ? '' : String(value))
  // What we last told the parent, so an echo of our own value doesn't clobber
  // half-typed text like "6" while the user is still going.
  const ours = useRef<number | null>(value)

  useEffect(() => {
    if (value !== ours.current) {
      ours.current = value
      setText(value == null ? '' : String(value))
    }
  }, [value])

  return (
    <input
      {...rest}
      type="number"
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        const next = e.target.value
        setText(next)
        if (next.trim() === '') {
          ours.current = null
          onChange(null)
          return
        }
        const parsed = Number(next)
        if (Number.isFinite(parsed)) {
          ours.current = parsed
          onChange(parsed)
        }
      }}
      onBlur={(e) => {
        if (text.trim() === '' && fallback != null) {
          ours.current = fallback
          setText(String(fallback))
          onChange(fallback)
        }
        rest.onBlur?.(e)
      }}
    />
  )
}
