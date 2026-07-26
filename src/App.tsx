import { useEffect, useRef, useState } from 'react'
import { useStore } from './data/store'
import { useTheme } from './lib/theme'
import { useT } from './lib/i18n'
import { useSyncLabel } from './lib/syncLabel'
import AuthGate from './components/AuthGate'
import StudentsView from './components/StudentsView'
import ClassesView from './components/ClassesView'
import ClassView from './components/ClassView'
import SettingsView from './components/SettingsView'
import Doodles from './components/Doodles'
import LanguageToggle from './components/LanguageToggle'

type Tab = 'classes' | 'students' | 'settings'

export default function App() {
  const { theme, mode, setTheme, setMode } = useTheme()
  const { t } = useT()
  const init = useStore((s) => s.init)
  const authReady = useStore((s) => s.authReady)
  const userId = useStore((s) => s.userId)
  const syncLabel = useSyncLabel()

  const [tab, setTab] = useState<Tab>('classes')
  const [openClassId, setOpenClassId] = useState<string | null>(null)

  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    void init()
  }, [init])

  // Anything else that wants to stick below the header needs its real height,
  // which changes with font size and screen width -- so publish it as a
  // variable rather than hardcoding a guess.
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    const publish = () =>
      document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`)
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(el)
    return () => observer.disconnect()
  }, [userId])

  if (!authReady) {
    return (
      <div className="paper-bg flex min-h-screen items-center justify-center text-ink-faint">
        {t('app.opening')}
      </div>
    )
  }

  if (!userId) return <AuthGate />

  return (
    <div className="paper-bg min-h-screen">
      {/* Margin decoration. Never over the content. */}
      <Doodles set={theme.doodles} onPhone={theme.doodlesOnPhone} />

      {/* Opaque, not bg-paper/95: Tailwind's opacity modifier emits invalid CSS
          for a var() colour, which leaves the bar see-through. */}
      <header
        ref={headerRef}
        className="no-print sticky top-0 z-30 border-b border-rule bg-paper"
      >
        <div className="mx-auto flex max-w-[1600px] items-end gap-2 px-3 pt-2 sm:gap-3 sm:px-6">
          <nav className="flex items-end gap-1">
            {(
              [
                ['classes', t('app.title')],
                ['students', t('app.students')],
              ] as [Tab, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                aria-current={tab === value && !openClassId ? 'page' : undefined}
                onClick={() => {
                  setTab(value)
                  setOpenClassId(null)
                }}
                className="tab style-hand text-base sm:text-lg"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Hidden on a phone, where the header has no room -- Settings shows
              the same line instead. */}
          <span className={`ml-auto mb-2 hidden text-xs sm:inline ${syncLabel.className}`}>
            {syncLabel.text}
          </span>

          <LanguageToggle className="mb-2 ml-auto sm:ml-0" />

          {/* Settings is a page like the others, so it gets a tab -- but a
              labelled one would crowd the two that matter on a phone. */}
          <button
            aria-current={tab === 'settings' && !openClassId ? 'page' : undefined}
            aria-label={t('app.settings')}
            title={t('app.settings')}
            onClick={() => {
              setTab('settings')
              setOpenClassId(null)
            }}
            className="tab text-lg leading-none"
          >
            <span aria-hidden>⚙</span>
          </button>
        </div>
      </header>

      {/* Above the doodles: a fixed z-0 layer would otherwise paint over the
          normal-flow content. */}
      <main className="relative z-10 mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6">
        {openClassId ? (
          <ClassView classId={openClassId} onBack={() => setOpenClassId(null)} />
        ) : tab === 'classes' ? (
          <ClassesView onOpen={setOpenClassId} />
        ) : tab === 'students' ? (
          <StudentsView />
        ) : (
          <SettingsView theme={theme} mode={mode} setTheme={setTheme} setMode={setMode} />
        )}
      </main>
    </div>
  )
}
