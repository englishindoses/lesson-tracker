import { useEffect, useRef, useState } from 'react'
import { useStore } from './data/store'
import { useTheme } from './lib/theme'
import { exportCSV, exportJSON } from './lib/exportData'
import AuthGate from './components/AuthGate'
import StudentsView from './components/StudentsView'
import ClassesView from './components/ClassesView'
import ClassView from './components/ClassView'
import ThemeMenu from './components/ThemeMenu'
import Menu from './components/Menu'
import Doodles from './components/Doodles'

type Tab = 'classes' | 'students'

export default function App() {
  const { style, mode, setStyle, setMode } = useTheme()
  const init = useStore((s) => s.init)
  const authReady = useStore((s) => s.authReady)
  const userId = useStore((s) => s.userId)
  const email = useStore((s) => s.email)
  const sync = useStore((s) => s.sync)
  const pending = useStore((s) => s.pendingWrites)
  const signOut = useStore((s) => s.signOut)
  const snapshot = useStore((s) => s.snapshot)

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
      <div className="dotgrid flex min-h-screen items-center justify-center text-ink-faint">
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
    <div className="dotgrid min-h-screen">
      {/* Margin decoration only, on wide screens. Never over the content. */}
      {style !== 'modern' && <Doodles />}

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

          <span className={`ml-auto mb-2 hidden text-xs sm:inline ${syncColor}`}>
            {syncLabel[sync]}
          </span>

          <div className="mb-2">
            <ThemeMenu style={style} mode={mode} setStyle={setStyle} setMode={setMode} />
          </div>

          <Menu label="⋯" title="More" buttonClass="btn mb-2 px-2 py-1 text-xs">
            {(close) => (
              <>
                <div className="truncate px-3 py-2 text-xs text-ink-faint">{email}</div>
                <div className={`px-3 pb-2 text-xs sm:hidden ${syncColor}`}>{syncLabel[sync]}</div>
                <button
                  className="w-full rounded px-3 py-2 text-left hover:bg-accent-soft"
                  onClick={() => {
                    exportJSON(snapshot())
                    close()
                  }}
                >
                  Backup everything (JSON)
                </button>
                <button
                  className="w-full rounded px-3 py-2 text-left hover:bg-accent-soft"
                  onClick={() => {
                    exportCSV(snapshot())
                    close()
                  }}
                >
                  Export spreadsheet (CSV)
                </button>
                <button
                  className="w-full rounded px-3 py-2 text-left hover:bg-accent-soft"
                  onClick={() => {
                    close()
                    void signOut()
                  }}
                >
                  Sign out
                </button>
              </>
            )}
          </Menu>
        </div>
      </header>

      {/* Above the doodles: a fixed z-0 layer would otherwise paint over the
          normal-flow content. */}
      <main className="relative z-10 mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6">
        {openClassId ? (
          <ClassView classId={openClassId} onBack={() => setOpenClassId(null)} />
        ) : tab === 'classes' ? (
          <ClassesView onOpen={setOpenClassId} />
        ) : (
          <StudentsView />
        )}
      </main>
    </div>
  )
}
