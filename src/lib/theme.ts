import { useCallback, useEffect, useState } from 'react'

/**
 * The look is four independent choices rather than one theme name, so a palette
 * can be worn with any lettering. Presets are just a set of all four at once.
 *
 *   palette  colours          -> data-palette
 *   fonts    lettering        -> data-fonts
 *   paper    page background  -> data-paper
 *   edges    hand-drawn or straight borders -> data-edges
 *
 * Doodles are React, not CSS, so they stay out of the data attributes.
 * Mode (light/dark) is separate again: any look must be readable at night.
 */

export type PaletteName =
  | 'sage'
  | 'peach'
  | 'neon'
  | 'ocean'
  | 'plum'
  | 'forest'
  | 'mono'
  | 'slate'
export type FontName = 'quicksand' | 'script' | 'sketch' | 'serif' | 'typewriter' | 'system'
export type PaperName = 'dots' | 'ruled' | 'plain'
export type EdgeName = 'hand' | 'clean'
export type DoodleSet = 'plants' | 'marks' | 'all' | 'none'
export type ModeSetting = 'light' | 'dark' | 'system'

export type Theme = {
  palette: PaletteName
  fonts: FontName
  paper: PaperName
  edges: EdgeName
  doodles: DoodleSet
  doodlesOnPhone: boolean
}

export const PALETTES: { value: PaletteName; label: string; hint: string }[] = [
  { value: 'sage', label: 'Sage', hint: 'Muted sage, terracotta, ochre' },
  { value: 'peach', label: 'Peach', hint: 'Warm cream and soft pastels' },
  { value: 'neon', label: 'Neon', hint: 'Bright coral, lime and orange' },
  { value: 'ocean', label: 'Ocean', hint: 'Teal, sea blue and sand' },
  { value: 'plum', label: 'Plum', hint: 'Purple, berry and dusty pink' },
  { value: 'forest', label: 'Forest', hint: 'Deep green, moss and bark' },
  { value: 'mono', label: 'Mono', hint: 'Greys with one blue accent' },
  { value: 'slate', label: 'Slate', hint: 'Plain white and office blue' },
]

export const FONTS: { value: FontName; label: string; hint: string }[] = [
  { value: 'quicksand', label: 'Rounded', hint: 'Quicksand headings, Inter text' },
  { value: 'script', label: 'Script', hint: 'Sacramento and Caveat' },
  { value: 'sketch', label: 'Sketch', hint: 'Amatic SC and Patrick Hand' },
  { value: 'serif', label: 'Serif', hint: 'Classic book lettering' },
  { value: 'typewriter', label: 'Typewriter', hint: 'Even-width, like a typed page' },
  { value: 'system', label: 'Plain', hint: 'Your device sans-serif' },
]

export const PAPERS: { value: PaperName; label: string; hint: string }[] = [
  { value: 'dots', label: 'Dot grid', hint: 'The bullet journal standard' },
  { value: 'ruled', label: 'Ruled', hint: 'Horizontal lines, like a notebook' },
  { value: 'plain', label: 'Plain', hint: 'No background at all' },
]

export const DOODLE_SETS: { value: DoodleSet; label: string; hint: string }[] = [
  { value: 'plants', label: 'Plants', hint: 'Ferns, monstera, daisies, cactus' },
  { value: 'marks', label: 'Pen marks', hint: 'Stars, arrows, banner, paperclip' },
  { value: 'all', label: 'Everything', hint: 'Both sets, a full margin' },
  { value: 'none', label: 'None', hint: 'Clean margins' },
]

export const PRESETS: { value: string; label: string; hint: string; theme: Theme }[] = [
  {
    value: 'minimalist',
    label: 'Minimalist',
    hint: 'Muted sage, rounded lettering, plants',
    theme: {
      palette: 'sage',
      fonts: 'quicksand',
      paper: 'dots',
      edges: 'hand',
      doodles: 'plants',
      doodlesOnPhone: false,
    },
  },
  {
    value: 'cozy',
    label: 'Cozy',
    hint: 'Pastels, handwriting, every doodle',
    theme: {
      palette: 'peach',
      fonts: 'script',
      paper: 'dots',
      edges: 'hand',
      doodles: 'all',
      doodlesOnPhone: false,
    },
  },
  {
    value: 'whimsical',
    label: 'Whimsical',
    hint: 'Neon, sketchy capitals, pen marks',
    theme: {
      palette: 'neon',
      fonts: 'sketch',
      paper: 'dots',
      edges: 'hand',
      doodles: 'marks',
      doodlesOnPhone: false,
    },
  },
  {
    value: 'botanical',
    label: 'Botanical',
    hint: 'Forest green on ruled paper, serif',
    theme: {
      palette: 'forest',
      fonts: 'serif',
      paper: 'ruled',
      edges: 'hand',
      doodles: 'plants',
      doodlesOnPhone: false,
    },
  },
  {
    value: 'seaside',
    label: 'Seaside',
    hint: 'Teal and sand, rounded lettering',
    theme: {
      palette: 'ocean',
      fonts: 'quicksand',
      paper: 'dots',
      edges: 'hand',
      doodles: 'plants',
      doodlesOnPhone: false,
    },
  },
  {
    value: 'berry',
    label: 'Berry',
    hint: 'Plum and dusty pink, handwriting',
    theme: {
      palette: 'plum',
      fonts: 'script',
      paper: 'dots',
      edges: 'hand',
      doodles: 'all',
      doodlesOnPhone: false,
    },
  },
  {
    value: 'typewriter',
    label: 'Typewriter',
    hint: 'Grey, typed, on ruled paper',
    theme: {
      palette: 'mono',
      fonts: 'typewriter',
      paper: 'ruled',
      edges: 'clean',
      doodles: 'marks',
      doodlesOnPhone: false,
    },
  },
  {
    value: 'modern',
    label: 'Modern',
    hint: 'Plain, not a journal',
    theme: {
      palette: 'slate',
      fonts: 'system',
      paper: 'plain',
      edges: 'clean',
      doodles: 'none',
      doodlesOnPhone: false,
    },
  },
]

const THEME_KEY = 'lt.theme'
const MODE_KEY = 'lt.mode'
/** Written by versions that had one theme name instead of four choices. */
const OLD_STYLE_KEY = 'lt.style'

const DEFAULT_THEME = PRESETS[0].theme

const OLD_STYLES: Record<string, string> = {
  minimalist: 'minimalist',
  cozy: 'cozy',
  whimsical: 'whimsical',
  modern: 'modern',
}

const isIn = <T extends string>(list: readonly { value: T }[], v: unknown): v is T =>
  typeof v === 'string' && list.some((o) => o.value === v)

/** Anything missing or unrecognised falls back, so a stale key can't break the app. */
function clean(raw: unknown): Theme {
  const t = (raw ?? {}) as Partial<Theme>
  return {
    palette: isIn(PALETTES, t.palette) ? t.palette : DEFAULT_THEME.palette,
    fonts: isIn(FONTS, t.fonts) ? t.fonts : DEFAULT_THEME.fonts,
    paper: isIn(PAPERS, t.paper) ? t.paper : DEFAULT_THEME.paper,
    edges: t.edges === 'clean' || t.edges === 'hand' ? t.edges : DEFAULT_THEME.edges,
    doodles: isIn(DOODLE_SETS, t.doodles) ? t.doodles : DEFAULT_THEME.doodles,
    doodlesOnPhone: t.doodlesOnPhone === true,
  }
}

export function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored) return clean(JSON.parse(stored))
  } catch {
    // Unreadable JSON is the same as none.
  }
  const old = localStorage.getItem(OLD_STYLE_KEY)
  const preset = old && PRESETS.find((p) => p.value === OLD_STYLES[old])
  return preset ? preset.theme : DEFAULT_THEME
}

/** The preset this theme matches exactly, if any -- so Settings can tick one. */
export function matchingPreset(theme: Theme): string | null {
  const keys = ['palette', 'fonts', 'paper', 'edges', 'doodles'] as const
  return PRESETS.find((p) => keys.every((k) => p.theme[k] === theme[k]))?.value ?? null
}

function prefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyMode(mode: ModeSetting) {
  const dark = mode === 'dark' || (mode === 'system' && prefersDark())
  document.documentElement.dataset.mode = dark ? 'dark' : 'light'
  const theme = getComputedStyle(document.documentElement).getPropertyValue('--paper')
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.trim())
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readTheme)
  const [mode, setModeState] = useState<ModeSetting>(
    () => (localStorage.getItem(MODE_KEY) as ModeSetting) || 'system',
  )

  useEffect(() => {
    const root = document.documentElement
    root.dataset.palette = theme.palette
    root.dataset.fonts = theme.fonts
    root.dataset.paper = theme.paper
    root.dataset.edges = theme.edges
    localStorage.setItem(THEME_KEY, JSON.stringify(theme))
    applyMode(mode)
  }, [theme, mode])

  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyMode('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  /** Change one choice without disturbing the others. */
  const setTheme = useCallback((patch: Partial<Theme>) => {
    setThemeState((prev) => ({ ...prev, ...patch }))
  }, [])

  const setMode = useCallback((m: ModeSetting) => {
    setModeState(m)
    localStorage.setItem(MODE_KEY, m)
  }, [])

  return { theme, mode, setTheme, setMode }
}
