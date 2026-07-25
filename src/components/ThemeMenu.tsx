import { useState } from 'react'
import type { ModeSetting, StyleName } from '../lib/theme'

const STYLES: { value: StyleName; label: string; hint: string }[] = [
  { value: 'ink', label: 'Notebook', hint: 'Dot grid, warm paper' },
  { value: 'modern', label: 'Modern', hint: 'Clean and plain' },
]

const MODES: { value: ModeSetting; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'Match device' },
]

export default function ThemeMenu({
  style,
  mode,
  setStyle,
  setMode,
}: {
  style: StyleName
  mode: ModeSetting
  setStyle: (s: StyleName) => void
  setMode: (m: ModeSetting) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        className="btn flex items-center gap-1.5"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Theme
        <span aria-hidden className="text-xs">
          ▾
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="card absolute right-0 z-20 mt-1 w-56 p-1 text-sm shadow-lg"
          >
            <div className="px-3 pb-1 pt-2 text-xs uppercase tracking-wide text-ink-faint">
              Style
            </div>
            {STYLES.map((s) => (
              <button
                key={s.value}
                role="menuitemradio"
                aria-checked={style === s.value}
                className="flex w-full items-start gap-2 rounded px-3 py-2 text-left hover:bg-accent-soft"
                onClick={() => {
                  setStyle(s.value)
                  setOpen(false)
                }}
              >
                <span className="w-3 shrink-0 text-accent">{style === s.value ? '✓' : ''}</span>
                <span>
                  <span className="block">{s.label}</span>
                  <span className="block text-xs text-ink-faint">{s.hint}</span>
                </span>
              </button>
            ))}

            <div className="mt-1 border-t border-rule px-3 pb-1 pt-2 text-xs uppercase tracking-wide text-ink-faint">
              Appearance
            </div>
            {MODES.map((m) => (
              <button
                key={m.value}
                role="menuitemradio"
                aria-checked={mode === m.value}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left hover:bg-accent-soft"
                onClick={() => {
                  setMode(m.value)
                  setOpen(false)
                }}
              >
                <span className="w-3 shrink-0 text-accent">{mode === m.value ? '✓' : ''}</span>
                {m.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
