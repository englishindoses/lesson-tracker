import { useState, type FormEvent } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

/** Shown until Supabase is wired up and someone is signed in. */
export default function AuthGate() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function signIn(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    })
    setBusy(false)
    if (error) setError(error.message)
    else setSent(true)
  }

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
                <em>Project URL</em> and the <em>anon public</em> key.
              </li>
              <li>
                Copy <span className="font-mono">.env.example</span> to{' '}
                <span className="font-mono">.env</span> and paste both values in.
              </li>
              <li>Restart the dev server.</li>
            </ol>
          </div>
        ) : sent ? (
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Check your email</p>
            <p className="text-ink-soft">
              A sign-in link is on its way to <span className="font-mono">{email}</span>. Open it
              on this device.
            </p>
            <button className="btn mt-2" onClick={() => setSent(false)}>
              Use a different address
            </button>
          </div>
        ) : (
          <form onSubmit={signIn} className="space-y-3">
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
            <button className="btn btn-primary w-full" disabled={busy || !email.trim()}>
              {busy ? 'Sending…' : 'Send me a sign-in link'}
            </button>
            <p className="text-xs text-ink-faint">
              No password to remember — you get a one-time link by email.
            </p>
            {error && <p className="text-sm text-danger">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
