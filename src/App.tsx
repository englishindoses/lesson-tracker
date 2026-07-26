import { useEffect, useRef, useState } from 'react'
import { useStore } from './data/store'
import { useTheme } from './lib/theme'
import AuthGate from './components/AuthGate'
import StudentsView from './components/StudentsView'
import ClassesView from './components/ClassesView'
import ClassView from './components/ClassView'
import SettingsView from './components/SettingsView'
import Doodles from './components/Doodles'

type Tab = 'classes' | 'students' | 'settings'

export default function App() {
  const { theme, mode, setTheme, setMode } = useTheme()
  const init = useStore((s) => s.init)
  const authReady = useStore((s) => s.authReady)
  const userId = useStore((s) => s.userId)
  const sync = useStore((s) => s.sync)
  const pending = useStore((s) => s.pendingWrites)

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
        Opening the notebook…
      </div>
    )
  }

  if (!userId) return <AuthGate />

  const syncLabel: Record<typeof sync, string> = {
    offline: pending ? `Offline · ${pending} to send` : 'Offline',
    syncing: 'Syncing…',
    synced: 'Saved',
    error: pending ? `Not sent · ${pending}` : 'Sync problem',
    unconfigured: 'No database',
  }
  const syncColor =
    sync === 'error' ? 'text-danger' : sync === 'synced' ? 'text-ink-faint' : 'text-ink-soft'

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
                ['classes', 'Lesson Tracker'],
                ['students', 'Students'],
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

          <span className={`ml-auto mb-2 text-xs ${syncColor}`}>{syncLabel[sync]}</span>

          {/* Settings is a page like the others, so it gets a tab -- but a
              labelled one would crowd the two that matter on a phone. */}
          <button
            aria-current={tab === 'settings' && !openClassId ? 'page' : undefined}
            aria-label="Settings"
            title="Settings"
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
