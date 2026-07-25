import { useCallback, useEffect, useState } from 'react'

export type StyleName = 'ink' | 'modern'
export type ModeSetting = 'light' | 'dark' | 'system'

const STYLE_KEY = 'lt.style'
const MODE_KEY = 'lt.mode'

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
 * Style (how it looks) and mode (light/dark) are deliberately independent, so
 * either notebook style can be read at night.
 */
export function useTheme() {
  const [style, setStyleState] = useState<StyleName>(
    () => (localStorage.getItem(STYLE_KEY) as StyleName) || 'ink',
  )
  const [mode, setModeState] = useState<ModeSetting>(
    () => (localStorage.getItem(MODE_KEY) as ModeSetting) || 'system',
  )

  useEffect(() => {
    document.documentElement.dataset.style = style
    localStorage.setItem(STYLE_KEY, style)
    applyMode(mode)
  }, [style, mode])

  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyMode('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  const setStyle = useCallback((s: StyleName) => {
    setStyleState(s)
    localStorage.setItem(STYLE_KEY, s)
  }, [])

  const setMode = useCallback((m: ModeSetting) => {
    setModeState(m)
    localStorage.setItem(MODE_KEY, m)
  }, [])

  const toggleStyle = useCallback(
    () => setStyle(style === 'ink' ? 'modern' : 'ink'),
    [style, setStyle],
  )

  const cycleMode = useCallback(() => {
    const order: ModeSetting[] = ['system', 'light', 'dark']
    setMode(order[(order.indexOf(mode) + 1) % order.length])
  }, [mode, setMode])

  return { style, mode, setStyle, setMode, toggleStyle, cycleMode }
}
