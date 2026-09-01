import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Login() {
  const [mode, setMode] = useState('sign_in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setInfo('Account created. Check your inbox to confirm your email, then sign in.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="font-display text-4xl text-paper tracking-tight">Kram Finance</div>
          <div className="text-textmuted mt-2 text-sm font-sans">Your ledger, everywhere.</div>
        </div>

        <form onSubmit={handleSubmit} className="bg-paper rounded-sm p-8 border border-line/40">
          <label className="block text-xs uppercase tracking-wide text-textmuted mb-1 font-sans">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-3 py-2 bg-white border border-line rounded-sm font-sans text-textdark focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <label className="block text-xs uppercase tracking-wide text-textmuted mb-1 font-sans">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-6 px-3 py-2 bg-white border border-line rounded-sm font-sans text-textdark focus:outline-none focus:ring-2 focus:ring-gold"
          />

          {error && <div className="text-negative text-sm mb-4 font-sans">{error}</div>}
          {info && <div className="text-positive text-sm mb-4 font-sans">{info}</div>}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-ink text-paper py-2.5 rounded-sm font-sans font-medium hover:bg-inkdeep transition-colors disabled:opacity-50"
          >
            {busy ? 'Please wait…' : mode === 'sign_in' ? 'Sign in' : 'Create account'}
          </button>

          <button
            type="button"
            onClick={() => { setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in'); setError(''); setInfo('') }}
            className="w-full text-center text-sm text-textmuted mt-4 font-sans hover:text-textdark"
          >
            {mode === 'sign_in' ? "First time here? Create an account" : 'Already have an account? Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
