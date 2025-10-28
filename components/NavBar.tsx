import React, { useEffect, useState } from 'react'

export default function NavBar() {
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/auth/me')
        const j = await r.json()
        if (mounted && j?.authenticated) setProfile(j.profile ?? null)
      } catch (e) {
        // ignore
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  async function signOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/login'
    }
  }

  return (
    <nav className="w-full bg-transparent px-6 py-4 flex items-center justify-between backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="text-neon-pink font-bold text-lg">Creator Success</div>
        <div className="text-sm text-zinc-400">Dashboard</div>
      </div>
      <div className="flex items-center gap-4">
        <button className="px-3 py-1 rounded-md border border-zinc-700 text-sm text-zinc-300 hover:bg-white/5 transition">New</button>
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-sm text-zinc-400">{profile?.email ?? ''}</div>
          <button onClick={signOut} className="text-sm px-3 py-1 rounded bg-zinc-800 border border-zinc-700 hover:bg-white/5">Sign out</button>
        </div>
      </div>
    </nav>
  )
}
