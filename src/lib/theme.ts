import { useCallback, useEffect, useState } from 'react'
import type { TKey } from './i18n'

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

/** Every option carries its translation keys; Settings does the wording. */
export type Option<T extends string> = { value: T; label: TKey; hint: TKey }

export const PALETTES: Option<PaletteName>[] = [
  { value: 'sage', label: 'palette.sage', hint: 'palette.sage.hint' },
  { value: 'peach', label: 'palette.peach', hint: 'palette.peach.hint' },
  { value: 'neon', label: 'palette.neon', hint: 'palette.neon.hint' },
  { value: 'ocean', label: 'palette.ocean', hint: 'palette.ocean.hint' },
  { value: 'plum', label: 'palette.plum', hint: 'palette.plum.hint' },
  { value: 'forest', label: 'palette.forest', hint: 'palette.forest.hint' },
  { value: 'mono', label: 'palette.mono', hint: 'palette.mono.hint' },
  { value: 'slate', label: 'palette.slate', hint: 'palette.slate.hint' },
]

export const FONTS: Option<FontName>[] = [
  { value: 'quicksand', label: 'fonts.quicksand', hint: 'fonts.quicksand.hint' },
  { value: 'script', label: 'fonts.script', hint: 'fonts.script.hint' },
  { value: 'sketch', label: 'fonts.sketch', hint: 'fonts.sketch.hint' },
  { value: 'serif', label: 'fonts.serif', hint: 'fonts.serif.hint' },
  { value: 'typewriter', label: 'fonts.typewriter', hint: 'fonts.typewriter.hint' },
  { value: 'system', label: 'fonts.system', hint: 'fonts.system.hint' },
]

export const PAPERS: Option<PaperName>[] = [
  { value: 'dots', label: 'paper.dots', hint: 'paper.dots.hint' },
  { value: 'ruled', label: 'paper.ruled', hint: 'paper.ruled.hint' },
  { value: 'plain', label: 'paper.plain', hint: 'paper.plain.hint' },
]

export const EDGES: Option<EdgeName>[] = [
  { value: 'hand', label: 'edges.hand', hint: 'edges.hand.hint' },
  { value: 'clean', label: 'edges.clean', hint: 'edges.clean.hint' },
]

export const DOODLE_SETS: Option<DoodleSet>[] = [
  { value: 'plants', label: 'doodles.plants', hint: 'doodles.plants.hint' },
  { value: 'marks', label: 'doodles.marks', hint: 'doodles.marks.hint' },
  { value: 'all', label: 'doodles.all', hint: 'doodles.all.hint' },
  { value: 'none', label: 'doodles.none', hint: 'doodles.none.hint' },
]

export const PRESETS: { value: string; label: TKey; hint: TKey; theme: Theme }[] = [
  {
    value: 'minimalist',
    label: 'preset.minimalist',
    hint: 'preset.minimalist.hint',
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
    label: 'preset.cozy',
    hint: 'preset.cozy.hint',
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
    label: 'preset.whimsical',
    hint: 'preset.whimsical.hint',
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
    label: 'preset.botanical',
    hint: 'preset.botanical.hint',
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
    label: 'preset.seaside',
    hint: 'preset.seaside.hint',
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
    label: 'preset.berry',
    hint: 'preset.berry.hint',
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
    label: 'preset.typewriter',
    hint: 'preset.typewriter.hint',
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
    label: 'preset.modern',
    hint: 'preset.modern.hint',
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
