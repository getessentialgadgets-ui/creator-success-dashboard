'use client'
import React, { useEffect, useState } from 'react'

type Cohort = {
  cohortDate: string
  cohortKey: string
  cohortSize: number
  retained_30_count: number
  retained_90_count: number
}

export default function RetentionCohort({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cohorts, setCohorts] = useState<Cohort[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/dashboard/${companyId}/cohorts?lookback=12&window=30`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const data = json.cohorts ?? []
        if (mounted) setCohorts(data)
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [companyId])

  const latest = cohorts[0] ?? null

  const pct = (num: number, denom: number) => (denom > 0 ? Math.round((num / denom) * 100) : 0)
  const colorForPct = (p: number) => {
    // p is 0..100
    const alpha = 0.15 + (Math.min(100, Math.max(0, p)) / 100) * 0.7 // 0.15..0.85
    return `rgba(16,185,129,${alpha})` // teal-green
  }

  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold">Retention cohorts (weekly)</h3>
          <p className="text-sm text-zinc-400">Last 12 weeks — 30-day and 90-day retention (active members)</p>
        </div>
        <div className="text-right">
          {loading ? <div className="text-sm text-zinc-400">Laden…</div> : error ? <div className="text-sm text-rose-400">{error}</div> : (
            <div className="text-sm text-zinc-400">Latest cohort size: <strong className="text-white">{latest?.cohortSize ?? 0}</strong></div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-24 flex items-center justify-center text-zinc-500">Loading cohorts…</div>
      ) : error ? (
        <div className="text-rose-400">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-zinc-400 text-xs uppercase">
                <th className="pb-2 pr-4">Week</th>
                <th className="pb-2 pr-4">Cohort size</th>
                <th className="pb-2 pr-4">30d retention</th>
                <th className="pb-2">90d retention</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => {
                const r30 = pct(c.retained_30_count, c.cohortSize)
                const r90 = pct(c.retained_90_count, c.cohortSize)
                return (
                  <tr key={c.cohortKey} className="align-top border-t border-zinc-800">
                    <td className="py-3 pr-4 align-top">{c.cohortKey}</td>
                    <td className="py-3 pr-4 align-top">{c.cohortSize}</td>
                    <td className="py-3 pr-4 align-top">
                      <div className="w-full rounded-md overflow-hidden">
                        <div style={{ background: colorForPct(r30), padding: '6px 8px', borderRadius: 6 }}>
                          <div className="flex items-center justify-between">
                            <div className="text-white font-medium">{r30}%</div>
                            <div className="text-zinc-400 text-xs">{c.retained_30_count}/{c.cohortSize}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 align-top">
                      <div className="w-full rounded-md overflow-hidden">
                        <div style={{ background: colorForPct(r90), padding: '6px 8px', borderRadius: 6 }}>
                          <div className="flex items-center justify-between">
                            <div className="text-white font-medium">{r90}%</div>
                            <div className="text-zinc-400 text-xs">{c.retained_90_count}/{c.cohortSize}</div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 text-xs text-zinc-500">Retention defined as user active (membership status) within 30/90 days of first purchase. Uses transactions as fallback when membership data is not available.</div>
    </div>
  )
}
