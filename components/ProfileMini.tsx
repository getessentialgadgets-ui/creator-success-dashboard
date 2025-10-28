import React from 'react'
import { useEffect, useState } from 'react'

export default function ProfileMini() {
  const [profile, setProfile] = useState<{ email?: string; avatar?: string; name?: string } | null>(null)

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

  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
        {profile?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar} alt={profile.email || 'avatar'} className="w-full h-full object-cover" />
        ) : (
          <div className="text-sm text-zinc-400">{(profile?.name || 'C').charAt(0)}</div>
        )}
      </div>
      <div className="hidden sm:flex flex-col text-sm">
        <span className="text-zinc-200">{profile?.name ?? 'Creator'}</span>
        <span className="text-zinc-500 text-xs">{profile?.email ?? ''}</span>
      </div>
    </div>
  )
}
