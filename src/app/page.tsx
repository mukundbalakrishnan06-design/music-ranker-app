'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Music } from 'lucide-react'

export default function LandingPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const clean = username.trim().toLowerCase()

    if (mode === 'login') {
      // Login: derive the same internal email used at signup
      const { error } = await supabase.auth.signInWithPassword({
        email: `${clean}@musicranker.internal`,
        password,
      })
      if (error) setError('Invalid username or password')
      else window.location.href = '/dashboard'

    } else {
      // Signup: use server-side admin API to avoid email domain validation
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: clean, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong, please try again')
      } else {
        // Account created — now sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: `${clean}@musicranker.internal`,
          password,
        })
        if (signInError) setError('Account created — please log in')
        else window.location.href = '/dashboard'
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mb-4">
            <Music className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">Music Ranker</h1>
          <p className="text-zinc-400 text-sm mt-1">Rate your music, rank your taste</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex rounded-lg bg-zinc-800 p-1 mb-6">
            <button
              onClick={() => { setMode('login'); setError(null) }}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'login' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Log in
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null) }}
              className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="yourname"
                autoComplete="username"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 block mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
                required
              />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
