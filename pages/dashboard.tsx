import React, { useEffect, useState } from 'react'
import NavBar from '../components/NavBar'
import KpiCard from '../components/KpiCard'
import ChartArea from '../components/ChartArea'
import TransactionsTable from '../components/TransactionsTable'
import Loading from '../components/Loading'
import ErrorComp from '../components/Error'
import AIInsights from '../components/AIInsights'

type ApiShape = {
  ok: boolean
  sales?: { totalCount: number; monthlyRevenue: number }
  mrr?: { mrr: number }
  active?: { active: number }
  refunds?: { refunds: number }
  transactions?: any[]
  profile?: { email?: string; avatar?: string; name?: string }
}

export default function Dashboard() {
  const [data, setData] = useState<ApiShape | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  // simple guard: check /api/auth/me and if not authenticated, redirect to /login
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const r = await fetch('/api/auth/me')
        const j = await r.json()
        if (mounted && (!j.authenticated)) {
          window.location.href = '/login'
          return
        }
      } catch (e) {
        console.error('auth check failed', e)
        if (mounted) window.location.href = '/login'
        return
      } finally {
        if (mounted) setAuthChecked(true)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/whop-test')
        const json = await res.json()
        if (mounted) {
          setData(json)
        }
      } catch (e) {
        console.error(e)
        if (mounted) setError('Failed to load dashboard data')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#071018] text-zinc-100">
      <NavBar />
      <main className="p-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Creator Success Dashboard</h1>
              <p className="text-zinc-500 mt-1">Overview of your Whop store performance</p>
            </div>
          </header>

          {(!authChecked || loading) ? (
            <Loading />
          ) : error ? (
            <ErrorComp message={error} />
          ) : (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KpiCard title="Active Members" value={data?.active?.active ?? '—'} delta="+3% MoM" />
                  <KpiCard title="MRR" value={`$${((data?.mrr?.mrr ?? 0) / 100).toFixed(2)}`} delta="+8% MoM" />
                  <KpiCard title="Refunds" value={data?.refunds?.refunds ?? 0} />
                  <KpiCard title="Sales (total)" value={data?.sales?.totalCount ?? 0} />
                </div>

                <ChartArea data={undefined} />

                <div>
                  <TransactionsTable data={data?.transactions ?? []} />
                </div>
              </div>

              <aside className="flex flex-col gap-4">
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                  <h3 className="text-sm text-zinc-400">Profile</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-800" />
                    <div>
                      <div className="text-white">{data?.profile?.name ?? 'Creator'}</div>
                      <div className="text-zinc-500 text-sm">{data?.profile?.email ?? ''}</div>
                    </div>
                  </div>
                </div>

                <AIInsights />
              </aside>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
