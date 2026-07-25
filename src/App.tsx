import { useEffect, useState } from 'react'
import { useStore } from './data/store'
import { useTheme } from './lib/theme'
import { exportCSV, exportJSON } from './lib/exportData'
import AuthGate from './components/AuthGate'
import StudentsView from './components/StudentsView'
import ClassesView from './components/ClassesView'
import ClassView from './components/ClassView'

type Tab = 'classes' | 'students'

export default function App() {
  const { style, mode, toggleStyle, cycleMode } = useTheme()
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
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    void init()
  }, [init])

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
      <header className="no-print sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 sm:px-5">
          <button
            className="style-hand text-lg leading-none sm:text-xl"
            onClick={() => {
              setOpenClassId(null)
              setTab('classes')
            }}
          >
            Lesson Tracker
          </button>

          <nav className="ml-2 flex gap-1">
            {(['classes', 'students'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t)
                  setOpenClassId(null)
                }}
                className={`rounded px-2.5 py-1 text-sm capitalize ${
                  tab === t && !openClassId
                    ? 'bg-accent-soft text-ink'
                    : 'text-ink-soft hover:text-ink'
                }`}
              >
                {t}
              </button>
            ))}
          </nav>

          <span className={`ml-auto hidden text-xs sm:inline ${syncColor}`}>
            {syncLabel[sync]}
          </span>

          <button
            className="btn px-2 py-1 text-xs"
            onClick={toggleStyle}
            title={`Style: ${style === 'ink' ? 'notebook' : 'modern'} — tap to switch`}
          >
            {style === 'ink' ? '✎ notebook' : '▢ modern'}
          </button>

          <button
            className="btn px-2 py-1 text-xs"
            onClick={cycleMode}
            title={`Appearance: ${mode}`}
          >
            {mode === 'system' ? '◐' : mode === 'light' ? '☀' : '☾'}
          </button>

          <div className="relative">
            <button className="btn px-2 py-1 text-xs" onClick={() => setMenuOpen((v) => !v)}>
              ⋯
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="card absolute right-0 z-20 mt-1 w-56 p-1 text-sm">
                  <div className="truncate px-3 py-2 text-xs text-ink-faint">{email}</div>
                  <div className={`px-3 pb-2 text-xs sm:hidden ${syncColor}`}>
                    {syncLabel[sync]}
                  </div>
                  <button
                    className="w-full rounded px-3 py-2 text-left hover:bg-accent-soft"
                    onClick={() => {
                      exportJSON(snapshot())
                      setMenuOpen(false)
                    }}
                  >
                    Backup everything (JSON)
                  </button>
                  <button
                    className="w-full rounded px-3 py-2 text-left hover:bg-accent-soft"
                    onClick={() => {
                      exportCSV(snapshot())
                      setMenuOpen(false)
                    }}
                  >
                    Export spreadsheet (CSV)
                  </button>
                  <button
                    className="w-full rounded px-3 py-2 text-left hover:bg-accent-soft"
                    onClick={() => {
                      setMenuOpen(false)
                      void signOut()
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-4 sm:px-5 sm:py-6">
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
