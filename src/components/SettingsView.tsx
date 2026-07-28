import { useState } from 'react'
import { useStore } from '../data/store'
import {
  countRows,
  exportClassesCSV,
  exportJSON,
  exportLessonsCSV,
  exportStudentsCSV,
  monthsPresent,
  type ExportOptions,
} from '../lib/exportData'
import { readFile } from '../lib/importData'
import { formatMonth } from '../lib/format'
import { setStaysLoggedIn, staysLoggedIn } from '../lib/supabase'
import {
  DOODLE_SETS,
  EDGES,
  FONTS,
  PALETTES,
  PAPERS,
  PRESETS,
  matchingPreset,
  type DoodleSet,
  type EdgeName,
  type FontName,
  type ModeSetting,
  type PaletteName,
  type PaperName,
  type Theme,
} from '../lib/theme'
import { useT, type TKey } from '../lib/i18n'
import { useSyncLabel } from '../lib/syncLabel'
import LanguageToggle from './LanguageToggle'
import ReportView from './ReportView'

/**
 * Everything that isn't lesson data: how the app looks, the account, and the
 * exports. The look is four separate choices rather than one theme, with the
 * presets as a starting point rather than the only way in.
 */

const MODES: { value: ModeSetting; label: TKey }[] = [
  { value: 'light', label: 'mode.light' },
  { value: 'dark', label: 'mode.dark' },
  { value: 'system', label: 'mode.system' },
]

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="card mb-4 p-4">
      <h2 className="style-hand text-xl">{title}</h2>
      {hint && <p className="mb-3 mt-0.5 text-sm text-ink-faint">{hint}</p>}
      <div className={hint ? '' : 'mt-3'}>{children}</div>
    </section>
  )
}

/** A labelled row of choices. Radio semantics, so a screen reader reads it as one. */
function Choices<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: TKey; hint?: TKey }[]
  value: T
  onChange: (v: T) => void
}) {
  const { t } = useT()
  return (
    <div role="radiogroup" aria-label={label} className="mb-4">
      <div className="style-accent mb-1.5 text-sm text-ink-soft">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            title={o.hint ? t(o.hint) : undefined}
            className={`btn text-left ${value === o.value ? 'btn-selected' : ''}`}
          >
            {value === o.value && <span aria-hidden>✓ </span>}
            {t(o.label)}
          </button>
        ))}
      </div>
    </div>
  )
}

/** A switch that reads as one line: label on the left, state on the right. */
function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="mb-3 flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 accent-[var(--accent)]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block">{label}</span>
        {hint && <span className="block text-sm text-ink-faint">{hint}</span>}
      </span>
    </label>
  )
}

/** One end of the month range. Outside the component, so it isn't remounted. */
function MonthSelect({
  label,
  months,
  value,
  onChange,
  openLabel,
}: {
  label: string
  months: string[]
  value: string | null
  onChange: (v: string | null) => void
  openLabel: string
}) {
  return (
    <label className="text-sm">
      <span className="mr-1.5 text-ink-soft">{label}</span>
      <select
        className="field field-inline"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">{openLabel}</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {formatMonth(m)}
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * Reading a backup back in. The other direction from the JSON button above it,
 * and the reason that button is worth pressing.
 *
 * A file picker rather than anything cleverer: the file was downloaded to the
 * device, the app never held on to it, so choosing it is the user's to do. The
 * restore only adds, so there is nothing here to confirm or undo.
 */
function RestoreControl() {
  const { t } = useT()
  const importRows = useStore((s) => s.importRows)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Clear it straight away, so choosing the same file twice still fires.
    e.target.value = ''
    if (!file) return

    setBusy(true)
    setNote(null)
    const parsed = await readFile(file)
    setBusy(false)

    if (!parsed.ok) {
      setNote({ ok: false, text: t(parsed.error) })
      return
    }

    const r = importRows(parsed.backup)
    if (r.signedOut) {
      setNote({ ok: false, text: t('import.signedOut') })
      return
    }

    const added = [
      [r.added.students, t('import.students')] as const,
      [r.added.classes, t('import.classes')] as const,
      [r.added.entries, t('import.entries')] as const,
    ].filter(([n]) => n > 0)

    if (!added.length) {
      setNote({ ok: true, text: t('import.nothingNew') })
      return
    }

    const parts = [`${t('import.done')}: ${added.map(([n, w]) => `${n} ${w}`).join(', ')}.`]
    if (r.skipped) parts.push(`${r.skipped} ${t('import.alreadyHere')}.`)
    if (r.orphaned) parts.push(`${r.orphaned} ${t('import.orphaned')}.`)
    setNote({ ok: true, text: parts.join(' ') })
  }

  return (
    <div className="mt-4">
      <label className="btn inline-block cursor-pointer">
        {busy ? t('import.reading') : t('settings.restore')}
        <input
          type="file"
          accept="application/json,.json"
          className="hidden"
          disabled={busy}
          onChange={(e) => void pick(e)}
        />
      </label>
      <p className="mt-1 text-sm text-ink-faint">{t('settings.restoreHint')}</p>
      {note && (
        <p className={`mt-2 text-sm ${note.ok ? 'text-good' : 'text-danger'}`}>{note.text}</p>
      )}
    </div>
  )
}

/**
 * The exports. Three spreadsheets, each answering one question: who the
 * students are, what each class is owed, and what happened on each day. The
 * money sits on the classes sheet, because a class is what owes money — it can
 * have two students in it, and there is no honest way to split it between them.
 *
 * All three take the same month range and archived switch. The backup
 * deliberately ignores both: a restore file that only holds half the data is a
 * trap.
 */
function ExportControls() {
  const { t } = useT()
  // Subscribed, not just read through snapshot(), so the month list and the
  // row counts follow a sync arriving while this page is open.
  const entries = useStore((s) => s.entries)
  const students = useStore((s) => s.students)
  const classes = useStore((s) => s.classes)
  const snapshot = useStore((s) => s.snapshot)

  const [opts, setOpts] = useState<ExportOptions>({
    from: null,
    to: null,
    includeArchived: false,
  })
  const [report, setReport] = useState(false)

  const snap = { ...snapshot(), entries, students, classes }
  const months = monthsPresent(snap)
  const counts = countRows(snap, opts)
  const empty = !counts.entries && !counts.students && !counts.classes

  // Picking a "from" after the "to" would mean an empty file; the other end
  // moves with it rather than leaving her with nothing.
  const setFrom = (v: string | null) =>
    setOpts((o) => ({ ...o, from: v, to: o.to && v && v > o.to ? v : o.to }))
  const setTo = (v: string | null) =>
    setOpts((o) => ({ ...o, to: v, from: o.from && v && v < o.from ? v : o.from }))

  return (
    <>
      <div className="style-accent mb-1.5 text-sm text-ink-soft">{t('settings.exportMonths')}</div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <MonthSelect
          label={t('settings.exportFrom')}
          months={months}
          value={opts.from}
          onChange={setFrom}
          openLabel={t('settings.fromStart')}
        />
        <MonthSelect
          label={t('settings.exportTo')}
          months={months}
          value={opts.to}
          onChange={setTo}
          openLabel={t('settings.toEnd')}
        />
      </div>

      <Toggle
        label={t('settings.includeArchived')}
        hint={t('settings.includeArchivedHint')}
        checked={opts.includeArchived}
        onChange={(v) => setOpts((o) => ({ ...o, includeArchived: v }))}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="btn btn-primary"
          disabled={!counts.entries}
          title={t('settings.exportPDFHint')}
          onClick={() => setReport(true)}
        >
          {t('settings.exportPDF')}
        </button>
        <button
          className="btn"
          disabled={!counts.students}
          title={t('settings.exportStudentsHint')}
          onClick={() => exportStudentsCSV(snap, opts)}
        >
          {t('settings.exportStudents')} ({counts.students})
        </button>
        <button
          className="btn"
          disabled={!counts.classes}
          title={t('settings.exportClassesHint')}
          onClick={() => exportClassesCSV(snap, opts)}
        >
          {t('settings.exportClasses')} ({counts.classes})
        </button>
        <button
          className="btn"
          disabled={!counts.entries}
          title={t('settings.exportLessonsHint')}
          onClick={() => exportLessonsCSV(snap, opts)}
        >
          {t('settings.exportLessons')} ({counts.entries})
        </button>
      </div>
      {empty && <p className="mt-2 text-sm text-danger">{t('settings.nothingToExport')}</p>}
      <p className="mt-1 text-sm text-ink-faint">{t('settings.exportPDFHint')}</p>
      <p className="text-sm text-ink-faint">{t('settings.exportStudentsHint')}</p>
      <p className="text-sm text-ink-faint">{t('settings.exportClassesHint')}</p>
      <p className="text-sm text-ink-faint">{t('settings.exportLessonsHint')}</p>

      <div className="mt-5 border-t border-rule pt-4">
        <button className="btn" onClick={() => exportJSON(snapshot())}>
          {t('settings.backup')}
        </button>
        <p className="mt-1 text-sm text-ink-faint">{t('settings.backupHint')}</p>
        <RestoreControl />
      </div>

      {report && (
        <ReportView snapshot={snap} options={opts} onClose={() => setReport(false)} />
      )}
    </>
  )
}

export default function SettingsView({
  theme,
  mode,
  setTheme,
  setMode,
}: {
  theme: Theme
  mode: ModeSetting
  setTheme: (patch: Partial<Theme>) => void
  setMode: (m: ModeSetting) => void
}) {
  const { t } = useT()
  const syncLabel = useSyncLabel()
  const email = useStore((s) => s.email)
  const signOut = useStore((s) => s.signOut)
  const changePassword = useStore((s) => s.changePassword)

  const [stay, setStay] = useState(staysLoggedIn)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null)

  const preset = matchingPreset(theme)

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setNote({ ok: false, text: t('settings.tooShort') })
      return
    }
    if (password !== confirm) {
      setNote({ ok: false, text: t('settings.noMatch') })
      return
    }
    setBusy(true)
    const error = await changePassword(password)
    setBusy(false)
    setNote(error ? { ok: false, text: error } : { ok: true, text: t('settings.changed') })
    if (!error) {
      setPassword('')
      setConfirm('')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="style-hand rule-under mb-4 text-2xl">{t('app.settings')}</h1>

      <Section title={t('settings.language')} hint={t('settings.languageHint')}>
        <LanguageToggle className="text-sm" />
      </Section>

      <Section title={t('settings.look')} hint={t('settings.lookHint')}>
        <Choices
          label={t('settings.presets')}
          options={PRESETS.map((p) => ({ value: p.value, label: p.label, hint: p.hint }))}
          value={preset ?? ''}
          onChange={(v) => {
            const found = PRESETS.find((p) => p.value === v)
            // Keep her phone choice: it is about screen size, not about looks.
            if (found) setTheme({ ...found.theme, doodlesOnPhone: theme.doodlesOnPhone })
          }}
        />
        <p className="-mt-2 mb-4 text-sm text-ink-faint">
          {preset
            ? t(PRESETS.find((p) => p.value === preset)!.hint)
            : t('settings.ownMix')}
        </p>

        <Choices<ModeSetting>
          label={t('settings.mode')}
          options={MODES}
          value={mode}
          onChange={setMode}
        />
        <Choices<PaletteName>
          label={t('settings.colours')}
          options={PALETTES}
          value={theme.palette}
          onChange={(v) => setTheme({ palette: v })}
        />
        <Choices<FontName>
          label={t('settings.lettering')}
          options={FONTS}
          value={theme.fonts}
          onChange={(v) => setTheme({ fonts: v })}
        />
        <Choices<PaperName>
          label={t('settings.paper')}
          options={PAPERS}
          value={theme.paper}
          onChange={(v) => setTheme({ paper: v })}
        />
        <Choices<EdgeName>
          label={t('settings.edges')}
          options={EDGES}
          value={theme.edges}
          onChange={(v) => setTheme({ edges: v })}
        />
        <Choices<DoodleSet>
          label={t('settings.doodles')}
          options={DOODLE_SETS}
          value={theme.doodles}
          onChange={(v) => setTheme({ doodles: v })}
        />
        {theme.doodles !== 'none' && (
          <Toggle
            label={t('settings.doodlesOnPhone')}
            hint={t('settings.doodlesOnPhoneHint')}
            checked={theme.doodlesOnPhone}
            onChange={(v) => setTheme({ doodlesOnPhone: v })}
          />
        )}
      </Section>

      <Section title={t('settings.account')} hint={email ?? undefined}>
        <p className={`mb-3 text-sm ${syncLabel.className}`}>{syncLabel.text}</p>

        <Toggle
          label={t('settings.stayIn')}
          hint={t('settings.stayInHint')}
          checked={stay}
          onChange={(v) => {
            setStay(v)
            setStaysLoggedIn(v)
          }}
        />

        <form onSubmit={submitPassword} className="mt-4 max-w-sm">
          <div className="style-accent mb-1.5 text-sm text-ink-soft">
            {t('settings.changePassword')}
          </div>
          <input
            className="field mb-2"
            type="password"
            autoComplete="new-password"
            placeholder={t('settings.newPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            className="field mb-2"
            type="password"
            autoComplete="new-password"
            placeholder={t('settings.repeatPassword')}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button className="btn btn-primary" disabled={busy || !password}>
            {busy ? t('settings.saving') : t('settings.changePassword')}
          </button>
          {note && (
            <p className={`mt-2 text-sm ${note.ok ? 'text-good' : 'text-danger'}`}>{note.text}</p>
          )}
        </form>

        <button className="btn mt-5" onClick={() => void signOut()}>
          {t('auth.signOut')}
        </button>
      </Section>

      <Section title={t('settings.data')} hint={t('settings.dataHint')}>
        <ExportControls />
      </Section>
    </div>
  )
}
