import { useEffect, useRef, useState } from 'react'
import { useStore } from './data/store'
import { useTheme } from './lib/theme'
import { useT } from './lib/i18n'
import { useSyncLabel } from './lib/syncLabel'
import AuthGate from './components/AuthGate'
import StudentsView from './components/StudentsView'
import ClassesView from './components/ClassesView'
import ClassView from './components/ClassView'
import TodayView from './components/TodayView'
import MonthView from './components/MonthView'
import SettingsView from './components/SettingsView'
import Doodles from './components/Doodles'

type Tab = 'today' | 'month' | 'classes' | 'students' | 'settings'

/** Everything that decides which page you are looking at. */
type View = { tab: Tab; classId: string | null }

const HOME: View = { tab: 'classes', classId: null }

const sameView = (a: View, b: View) => a.tab === b.tab && a.classId === b.classId

/** The view stashed on a history entry, if it is one of ours and still sane. */
function viewFromHistory(state: unknown): View | null {
  const saved = (state as { ltView?: View } | null)?.ltView
  return saved && typeof saved.tab === 'string' ? saved : null
}

export default function App() {
  const { theme, mode, setTheme, setMode } = useTheme()
  const { t } = useT()
  const init = useStore((s) => s.init)
  const authReady = useStore((s) => s.authReady)
  const userId = useStore((s) => s.userId)
  const syncLabel = useSyncLabel()

  /* Reloading lands you back where you were: the browser hands the same
     history entry back, and the view is riding on it. */
  const [view, setView] = useState<View>(() => viewFromHistory(window.history.state) ?? HOME)
  const { tab, classId: openClassId } = view
  /** Where the gear was pressed, so pressing it again goes back there. */
  const [beforeSettings, setBeforeSettings] = useState<View>(HOME)

  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    void init()
  }, [init])

  /**
   * Moving about the app is a history entry, so the phone's back button walks
   * back through it instead of straight out of it.
   *
   * Nothing is written to the URL — the view rides on `history.state`. There is
   * no router and no path to get wrong under the Pages subpath, and a reload
   * still fetches the same page it always did.
   *
   * Dialogs are deliberately not part of this. Back is for pages; a dialog is
   * closed with its ×, Escape, or a tap outside it. A dialog belongs to the
   * page under it, so navigating away takes it with it and can't strand one.
   */
  const go = (next: View) => {
    if (sameView(view, next)) return
    window.history.pushState({ ltView: next }, '')
    setView(next)
  }

  useEffect(() => {
    // Stamp the entry we opened on, or the first back press has nothing to
    // land on and leaves the app from the second page in.
    window.history.replaceState(
      { ...(window.history.state as object | null), ltView: view },
      '',
    )
    // Once, for the entry we arrived on. Every later entry is stamped by `go`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onPop = (e: PopStateEvent) => setView(viewFromHistory(e.state) ?? HOME)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

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
          {/* One row. The labels are short and the language toggle has moved to
              Settings, so four tabs and the gear fit even on a narrow phone in
              the widest of the lettering sets -- see the padding on `.tab`. */}
          <nav className="flex min-w-0 items-end">
            {(
              [
                ['today', t('app.today')],
                ['month', t('app.month')],
                ['classes', t('app.classes')],
                ['students', t('app.students')],
              ] as [Tab, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                aria-current={tab === value && !openClassId ? 'page' : undefined}
                onClick={() => go({ tab: value, classId: null })}
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

          {/* Settings is a page like the others, so it gets a tab -- but a
              labelled one would crowd the three that matter on a phone. The
              gear is a toggle: pressing it again returns to whatever was open.
              ml-auto because the sync line beside it is hidden on a phone. */}
          <button
            aria-current={tab === 'settings' ? 'page' : undefined}
            aria-label={t('app.settings')}
            title={t('app.settings')}
            onClick={() => {
              if (tab === 'settings') {
                go(beforeSettings)
                return
              }
              setBeforeSettings(view)
              go({ tab: 'settings', classId: null })
            }}
            className="tab ml-auto shrink-0 text-lg leading-none sm:ml-0"
          >
            <span aria-hidden>⚙</span>
          </button>
        </div>
      </header>

      {/* Above the doodles: a fixed z-0 layer would otherwise paint over the
          normal-flow content. */}
      <main className="relative z-10 mx-auto max-w-[1600px] px-3 py-4 sm:px-6 sm:py-6">
        {openClassId ? (
          // Back out to whichever tab the class was opened from.
          <ClassView classId={openClassId} onBack={() => go({ tab, classId: null })} />
        ) : tab === 'today' ? (
          <TodayView onOpenClass={(id) => go({ tab, classId: id })} />
        ) : tab === 'month' ? (
          <MonthView onOpenClass={(id) => go({ tab, classId: id })} />
        ) : tab === 'classes' ? (
          <ClassesView onOpen={(id) => go({ tab, classId: id })} />
        ) : tab === 'students' ? (
          <StudentsView />
        ) : (
          <SettingsView theme={theme} mode={mode} setTheme={setTheme} setMode={setMode} />
        )}
      </main>
    </div>
  )
}
