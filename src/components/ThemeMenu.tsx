import type { ModeSetting, StyleName } from '../lib/theme'
import Menu from './Menu'

const JOURNAL_STYLES: { value: StyleName; label: string; hint: string }[] = [
  { value: 'minimalist', label: 'Minimalist', hint: 'Muted sage, terracotta, ochre' },
  { value: 'cozy', label: 'Cozy', hint: 'Handwritten, soft pastels' },
  { value: 'whimsical', label: 'Whimsical', hint: 'Hand-drawn, bright neon' },
]

const PLAIN_STYLES: { value: StyleName; label: string; hint: string }[] = [
  { value: 'modern', label: 'Modern', hint: 'Plain, not a journal' },
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
  return (
    <Menu
      label={
        <span className="flex items-center gap-1.5">
          Theme
          <span aria-hidden className="text-xs">
            ▾
          </span>
        </span>
      }
    >
      {(close) => {
        const styleButton = (s: { value: StyleName; label: string; hint: string }) => (
          <button
            key={s.value}
            role="menuitemradio"
            aria-checked={style === s.value}
            className="flex w-full items-start gap-2 rounded px-3 py-2 text-left hover:bg-accent-soft"
            onClick={() => {
              setStyle(s.value)
              close()
            }}
          >
            <span className="w-3 shrink-0 text-accent">{style === s.value ? '✓' : ''}</span>
            <span>
              <span className="block">{s.label}</span>
              <span className="block text-xs text-ink-faint">{s.hint}</span>
            </span>
          </button>
        )

        return (
        <>
          <div className="px-3 pb-1 pt-2 text-xs uppercase tracking-wide text-ink-faint">
            Bullet journal styles
          </div>
          {JOURNAL_STYLES.map(styleButton)}

          <div className="mt-1 border-t border-rule px-3 pb-1 pt-2 text-xs uppercase tracking-wide text-ink-faint">
            Plain style
          </div>
          {PLAIN_STYLES.map(styleButton)}

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
                close()
              }}
            >
              <span className="w-3 shrink-0 text-accent">{mode === m.value ? '✓' : ''}</span>
              {m.label}
            </button>
          ))}
        </>
        )
      }}
    </Menu>
  )
}
