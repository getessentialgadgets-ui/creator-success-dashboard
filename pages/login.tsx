import React, { useState, useEffect } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/auth/me')
        const j = await r.json()
        if (mounted && j?.authenticated) window.location.href = '/dashboard'
      } catch (e) {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      })
      const j = await res.json()
      if (!j.ok) throw new Error(j.error || 'Login failed')
      // redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err?.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#071018] flex items-center justify-center">
      <form onSubmit={submit} className="bg-zinc-900 p-8 rounded-xl w-full max-w-md border border-zinc-800">
        <h2 className="text-2xl font-semibold mb-4">Sign in — Whop</h2>
        <div className="space-y-3">
          <label className="block text-sm text-zinc-300">Email</label>
          <input className="w-full p-2 rounded bg-zinc-800 border border-zinc-700" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label className="block text-sm text-zinc-300">Token (or leave blank to continue with env)</label>
          <input className="w-full p-2 rounded bg-zinc-800 border border-zinc-700" value={token} onChange={(e) => setToken(e.target.value)} />

          {error ? <div className="text-red-400">{error}</div> : null}

          <div className="flex justify-end">
            <button className="px-4 py-2 rounded bg-neon-cyan text-black font-semibold" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
          </div>
        </div>
      </form>
    </div>
  )
}
