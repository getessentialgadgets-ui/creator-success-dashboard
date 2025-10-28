import React, { useEffect, useState } from 'react'

export default function AIInsights() {
  const [tips, setTips] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/ai/insights')
        const j = await res.json()
        if (!mounted) return
        if (!j.ok) {
          setError(j.error || 'Failed to fetch insights')
        } else {
          setTips(j.tips)
        }
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message ?? String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return <div className="p-4 text-sm text-zinc-400">Generating tips…</div>
  if (error) return <div className="p-4 text-sm text-red-400">{error}</div>
  if (!tips) return null

  return (
    <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800">
      <h4 className="text-sm text-zinc-400 mb-2">Creator Growth Tips</h4>
      <div className="prose prose-invert text-sm text-zinc-200 max-w-none">
        {tips.split('\n').map((line, i) => (
          <p key={i} className="mb-1">{line}</p>
        ))}
      </div>
    </div>
  )
}
