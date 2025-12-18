import React from 'react'
import { parse } from 'cookie'
import { createWhopClient } from '@/lib/whop'
import TokenListener from '../../getessential-whop-app/components/TokenListener'
import { Card, Heading, Text, Container, Badge, Button } from '@whop/react/components'

// Ensure this page always renders server-side, shows a clear loading/fallback UI,
// and attempts a best-effort verification using whop token cookie when present.

export default function CompanyDashboard({ companyId, accessVerified, userId, metrics, profile }: { companyId: string; accessVerified: boolean; userId?: string; metrics?: any; profile?: any }) {
  return (
    <Container className="p-4">
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <Heading size={3}>Creator Success Dashboard</Heading>
              <Text className="text-sm text-gray-500">Company ID: <strong>{companyId}</strong></Text>
            </div>
            <div className="flex items-center gap-2">
              {accessVerified ? <Badge tone="positive">Access verified</Badge> : <Badge tone="caution">Not verified</Badge>}
            </div>
          </div>

          {accessVerified ? (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KpiCard title="Active Members" value={metrics?.active?.active ?? '—'} delta="+3% MoM" />
                  <KpiCard title="MRR" value={`$${((metrics?.mrr?.mrr ?? 0) / 100).toFixed(2)}`} delta="+8% MoM" />
                  <KpiCard title="Refunds" value={metrics?.refunds?.refunds ?? 0} />
                  <KpiCard title="Sales (total)" value={metrics?.sales?.totalCount ?? 0} />
                </div>

                <ChartArea data={metrics} />

                <div>
                  <TransactionsTable data={metrics?.transactions ?? []} />
                </div>
              </div>

              <aside className="flex flex-col gap-4">
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                  <h3 className="text-sm text-zinc-400">Profile</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-800" />
                    <div>
                      <div className="text-white">{profile?.name ?? 'Creator'}</div>
                      <div className="text-zinc-500 text-sm">{profile?.email ?? ''}</div>
                    </div>
                  </div>
                </div>

                <AIInsights />
              </aside>
            </section>
          ) : (
            <div>
              <Text className="mb-2">You are not authenticated. Use the token postMessage from the parent or paste a token below to continue.</Text>
              {/* @ts-expect-error Client component */}
              <TokenListener />
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Button variant="ghost" as="a" href="/">Back to app</Button>
            <Button variant="classic" as="a" href="/test-parent">Local test</Button>
          </div>
        </div>
      </Card>
    </Container>
  )
}

export async function getServerSideProps({ req, params }: any) {
  const { companyId } = params || {}

  function withTimeout(p: Promise<any>, ms = 3000) {
    return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))])
  }

  try {
    const cookies = parse(req.headers.cookie || '')
    const token = cookies.whop_token || null
    if (!token) return { props: { companyId, accessVerified: false } }

    const client = createWhopClient(token)
    if (!client) return { props: { companyId, accessVerified: false } }

    // Attempt to get user and check access with a short timeout
    const user = await withTimeout(client.auth?.getUser?.())
    const userId = user?.id || user?.userId || user?.sub || null
    if (!userId) return { props: { companyId, accessVerified: false } }

    const access = await withTimeout(client.users?.checkAccess?.(companyId, { id: userId }))
    if (!access || access.allowed === false) return { props: { companyId, accessVerified: false } }

    // Fetch useful dashboard data for server-side rendering
    let metrics = null
    let profile = null
    try {
      // reuse lib helpers
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const { getMetrics, getProfile } = require('../../lib/whop')
      metrics = await withTimeout(getMetrics(token), 3000)
      profile = await withTimeout(getProfile(token), 3000)
    } catch (e) {
      // best-effort: metrics may be null, but page should still render
      metrics = null
      profile = null
    }

    return { props: { companyId, accessVerified: true, userId, metrics, profile } }
  } catch (err) {
    return { props: { companyId, accessVerified: false } }
  }
}
