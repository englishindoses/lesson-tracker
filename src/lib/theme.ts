import { useCallback, useEffect, useSyncExternalStore } from 'react'
import type { TKey } from './i18n'
import * as prefs from './prefs'

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
/** Named after the presets: a set of doodles belongs to a look. */
export type DoodleSet =
  | 'minimalist'
  | 'cozy'
  | 'whimsical'
  | 'botanical'
  | 'seaside'
  | 'berry'
  | 'typewriter'
  | 'none'
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
  { value: 'minimalist', label: 'preset.minimalist', hint: 'doodles.minimalist.hint' },
  { value: 'cozy', label: 'preset.cozy', hint: 'doodles.cozy.hint' },
  { value: 'whimsical', label: 'preset.whimsical', hint: 'doodles.whimsical.hint' },
  { value: 'botanical', label: 'preset.botanical', hint: 'doodles.botanical.hint' },
  { value: 'seaside', label: 'preset.seaside', hint: 'doodles.seaside.hint' },
  { value: 'berry', label: 'preset.berry', hint: 'doodles.berry.hint' },
  { value: 'typewriter', label: 'preset.typewriter', hint: 'doodles.typewriter.hint' },
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
      doodles: 'minimalist',
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
      doodles: 'cozy',
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
      doodles: 'whimsical',
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
      doodles: 'botanical',
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
      doodles: 'seaside',
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
      doodles: 'berry',
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
      doodles: 'typewriter',
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

/**
 * The look signed-out visitors get, and the fallback for any field that is
 * missing or unrecognised. Whimsical rather than the first preset: the sign-in
 * page is the one page with nothing on it, so it may as well be the liveliest.
 * index.html hardcodes the same four choices to paint before this file loads --
 * keep the two in step.
 */
const DEFAULT_THEME = PRESETS.find((p) => p.value === 'whimsical')!.theme

const OLD_STYLES: Record<string, string> = {
  minimalist: 'minimalist',
  cozy: 'cozy',
  whimsical: 'whimsical',
  modern: 'modern',
}

const isIn = <T extends string>(list: readonly { value: T }[], v: unknown): v is T =>
  typeof v === 'string' && list.some((o) => o.value === v)

/** The doodle sets were first named after their contents, not after a look. */
const OLD_DOODLES: Record<string, DoodleSet> = {
  plants: 'botanical',
  marks: 'whimsical',
  all: 'cozy',
}

/** Anything missing or unrecognised falls back, so a stale key can't break the app. */
function clean(raw: unknown): Theme {
  const t = (raw ?? {}) as Partial<Theme>
  const doodles = OLD_DOODLES[t.doodles as string] ?? t.doodles
  return {
    palette: isIn(PALETTES, t.palette) ? t.palette : DEFAULT_THEME.palette,
    fonts: isIn(FONTS, t.fonts) ? t.fonts : DEFAULT_THEME.fonts,
    paper: isIn(PAPERS, t.paper) ? t.paper : DEFAULT_THEME.paper,
    edges: t.edges === 'clean' || t.edges === 'hand' ? t.edges : DEFAULT_THEME.edges,
    doodles: isIn(DOODLE_SETS, doodles) ? doodles : DEFAULT_THEME.doodles,
    doodlesOnPhone: t.doodlesOnPhone === true,
  }
}

export function readTheme(): Theme {
  const stored = prefs.get()
  if (stored.theme) return clean(stored.theme)
  // A device last used before the look became four separate choices.
  const preset = PRESETS.find((p) => p.value === OLD_STYLES[stored.style as string])
  return preset ? preset.theme : DEFAULT_THEME
}

function readMode(): ModeSetting {
  const m = prefs.get().mode
  return m === 'light' || m === 'dark' || m === 'system' ? m : 'system'
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

/**
 * The theme comes from the preferences blob, which changes both when she picks
 * something and when another device's choice arrives -- so it is an external
 * store rather than component state. Reading through a cache keeps the
 * snapshot referentially stable, which useSyncExternalStore requires.
 */
let themeCache: Theme = readTheme()
let themeCacheFrom: unknown = prefs.get()
function themeSnapshot(): Theme {
  const source = prefs.get()
  if (source !== themeCacheFrom) {
    themeCacheFrom = source
    themeCache = readTheme()
  }
  return themeCache
}

export function useTheme() {
  const theme = useSyncExternalStore(prefs.subscribe, themeSnapshot, themeSnapshot)
  const mode = useSyncExternalStore(prefs.subscribe, readMode, readMode)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.palette = theme.palette
    root.dataset.fonts = theme.fonts
    root.dataset.paper = theme.paper
    root.dataset.edges = theme.edges
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
    prefs.patch({ theme: { ...readTheme(), ...patch } })
  }, [])

  const setMode = useCallback((m: ModeSetting) => {
    prefs.patch({ mode: m })
  }, [])

  return { theme, mode, setTheme, setMode }
}
