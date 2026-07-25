import { useState, type FormEvent } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

type Mode = 'signin' | 'signup' | 'reset'

/**
 * Email + password sign-in.
 *
 * Deliberately not magic links: tapping one in the Gmail app opens Gmail's
 * in-app browser, which keeps the session in a sealed box you can't install
 * the PWA from. A password works in whichever browser you're already in.
 */
export default function AuthGate() {
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
        setNotice(
          'Password reset email sent. Open the link in a real browser, not inside your email app.',
        )
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
        if (!data.session) {
          setNotice(
            'Account created. Supabase wants you to confirm your address first — check your email, ' +
              'or turn off Authentication → Sign In / Providers → Email → "Confirm email" in your ' +
              'Supabase dashboard and sign in straight away.',
          )
        }
        return
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
    } catch (e) {
      const message = (e as Error).message
      setError(
        message === 'Invalid login credentials'
          ? "That email and password don't match. If you haven't made an account yet, choose Create account."
          : message,
      )
    } finally {
      setBusy(false)
    }
  }

  const title =
    mode === 'signup' ? 'Create your account' : mode === 'reset' ? 'Reset password' : 'Sign in'

  return (
    <div className="dotgrid flex min-h-screen items-center justify-center p-5">
      <div className="card w-full max-w-md p-6">
        <h1 className="style-hand rule-under mb-1 inline-block text-2xl">Lesson Tracker</h1>
        <p className="mb-5 text-sm text-ink-soft">Lessons, students and money, in one notebook.</p>

        {!isConfigured ? (
          <div className="space-y-3 text-sm">
            <p className="font-semibold">One-time setup needed</p>
            <p className="text-ink-soft">
              The app can't reach a database yet. Create your free Supabase project, then:
            </p>
            <ol className="list-decimal space-y-1 pl-5 text-ink-soft">
              <li>
                Open <span className="font-mono">supabase/schema.sql</span> from this project,
                paste it into the Supabase <em>SQL Editor</em> and run it.
              </li>
              <li>
                In Supabase go to <em>Project Settings → API</em> and copy the{' '}
                <em>Project URL</em> and the <em>publishable</em> key.
              </li>
              <li>
                Copy <span className="font-mono">.env.example</span> to{' '}
                <span className="font-mono">.env</span> and paste both values in.
              </li>
              <li>Restart the dev server.</li>
            </ol>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-sm font-semibold">{title}</p>

            <label className="block text-sm">
              <span className="mb-1 block text-ink-soft">Email address</span>
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
                <span className="mb-1 block text-ink-soft">Password</span>
                <input
                  className="field"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 8 characters' : ''}
                />
              </label>
            )}

            <button
              className="btn btn-primary w-full"
              disabled={busy || !email.trim() || (mode !== 'reset' && password.length < 8)}
            >
              {busy
                ? 'Working…'
                : mode === 'signup'
                  ? 'Create account'
                  : mode === 'reset'
                    ? 'Send reset email'
                    : 'Sign in'}
            </button>

            {error && <p className="text-sm text-danger">{error}</p>}
            {notice && <p className="text-sm text-ink-soft">{notice}</p>}

            <div className="flex flex-wrap justify-between gap-2 pt-1 text-xs text-ink-soft">
              {mode === 'signin' ? (
                <>
                  <button type="button" className="underline" onClick={() => setMode('signup')}>
                    Create account
                  </button>
                  <button type="button" className="underline" onClick={() => setMode('reset')}>
                    Forgot password?
                  </button>
                </>
              ) : (
                <button type="button" className="underline" onClick={() => setMode('signin')}>
                  ← Back to sign in
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
