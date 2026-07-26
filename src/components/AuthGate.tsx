import { useState, type FormEvent } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { useT } from '../lib/i18n'
import LanguageToggle from './LanguageToggle'

type Mode = 'signin' | 'signup' | 'reset'

/**
 * Email + password sign-in.
 *
 * Deliberately not magic links: tapping one in the Gmail app opens Gmail's
 * in-app browser, which keeps the session in a sealed box you can't install
 * the PWA from. A password works in whichever browser you're already in.
 */
export default function AuthGate() {
  const { t } = useT()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    setNotice(null)

    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin + window.location.pathname,
        })
        if (error) throw error
        setNotice(t('auth.resetSent'))
        return
      }

      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: window.location.origin + window.location.pathname },
        })
        if (error) throw error
        // With email confirmation switched off, signUp returns a session and
        // the app just opens. With it on, it doesn't, and we have to explain.
        if (!data.session) setNotice(t('auth.confirmNotice'))
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
    } catch (e) {
      const message = (e as Error).message
      setError(message === 'Invalid login credentials' ? t('auth.badCredentials') : message)
    } finally {
      setBusy(false)
    }
  }

  const title =
    mode === 'signup'
      ? t('auth.createTitle')
      : mode === 'reset'
        ? t('auth.resetTitle')
        : t('auth.signIn')

  return (
    <div className="paper-bg relative flex min-h-screen items-center justify-center p-5">
      {/* Top corner, same place as inside the app. */}
      <LanguageToggle className="absolute right-4 top-4" />

      <div className="card w-full max-w-md p-6">
        <h1 className="style-hand rule-under mb-1 inline-block text-2xl">{t('app.title')}</h1>
        <p className="mb-5 text-sm text-ink-soft">{t('auth.tagline')}</p>

        {!isConfigured ? (
          <div className="space-y-3 text-sm">
            <p className="font-semibold">{t('auth.setupTitle')}</p>
            <p className="text-ink-soft">{t('auth.setupIntro')}</p>
            <ol className="list-decimal space-y-1 pl-5 text-ink-soft">
              <li>{t('auth.setup1')}</li>
              <li>{t('auth.setup2')}</li>
              <li>{t('auth.setup3')}</li>
              <li>{t('auth.setup4')}</li>
            </ol>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-sm font-semibold">{title}</p>

            <label className="block text-sm">
              <span className="mb-1 block text-ink-soft">{t('auth.email')}</span>
              <input
                className="field"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            {mode !== 'reset' && (
              <label className="block text-sm">
                <span className="mb-1 block text-ink-soft">{t('auth.password')}</span>
                <input
                  className="field"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? t('auth.atLeast8') : ''}
                />
              </label>
            )}

            <button
              className="btn btn-primary w-full"
              disabled={busy || !email.trim() || (mode !== 'reset' && password.length < 8)}
            >
              {busy
                ? t('auth.working')
                : mode === 'signup'
                  ? t('auth.createAccount')
                  : mode === 'reset'
                    ? t('auth.sendReset')
                    : t('auth.signIn')}
            </button>

            {error && <p className="text-sm text-danger">{error}</p>}
            {notice && <p className="text-sm text-ink-soft">{notice}</p>}

            <div className="flex flex-wrap justify-between gap-2 pt-1 text-xs text-ink-soft">
              {mode === 'signin' ? (
                <>
                  <button type="button" className="underline" onClick={() => setMode('signup')}>
                    {t('auth.createAccount')}
                  </button>
                  <button type="button" className="underline" onClick={() => setMode('reset')}>
                    {t('auth.forgot')}
                  </button>
                </>
              ) : (
                <button type="button" className="underline" onClick={() => setMode('signin')}>
                  {t('auth.backToSignIn')}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
