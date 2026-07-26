import { useState } from 'react'
import { useStore } from '../data/store'
import { exportCSV, exportJSON } from '../lib/exportData'
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
            className={`btn text-left ${
              value === o.value ? 'border-accent bg-accent-soft text-ink' : ''
            }`}
          >
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
  const snapshot = useStore((s) => s.snapshot)

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
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={() => exportJSON(snapshot())}>
            {t('settings.backup')}
          </button>
          <button className="btn" onClick={() => exportCSV(snapshot())}>
            {t('settings.exportCSV')}
          </button>
        </div>
      </Section>
    </div>
  )
}
