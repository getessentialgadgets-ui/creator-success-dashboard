import React from 'react'
import { parse } from 'cookie'
import { createWhopClient } from '../../lib/whop'
import TokenListener from '../../getessential-whop-app/components/TokenListener'
// Avoid importing large UI libs on the server (can cause ESM directory import errors).
// Provide small, local primitive wrappers so server-side rendering remains robust.
const Container = ({ children, className = '' }: any) => <div className={className}>{children}</div>
const Card = ({ children, className = '' }: any) => <div className={`bg-zinc-900 rounded-xl border border-zinc-800 p-4 ${className}`}>{children}</div>
const Heading = ({ children, className = '' }: any) => <h2 className={`text-2xl font-semibold ${className}`}>{children}</h2>
const Text = ({ children, className = '' }: any) => <p className={className}>{children}</p>
const Badge = ({ children, className = '' }: any) => <span className={`px-2 py-1 rounded bg-zinc-700 text-sm ${className}`}>{children}</span>
const Button = (props: any) => <a className="px-3 py-2 rounded bg-zinc-800 inline-block" {...props}>{props.children}</a>

import KpiCard from '../../components/KpiCard'
import ChartArea from '../../components/ChartArea'
import TransactionsTable from '../../components/TransactionsTable'
import AIInsights from '../../components/AIInsights'

// Ensure this page always renders server-side, shows a clear loading/fallback UI,
// and attempts a best-effort verification using whop token cookie when present.

export default function CompanyDashboard({ companyId, accessVerified, userId, metrics, profile, embedPreview }: { companyId: string; accessVerified: boolean; userId?: string; metrics?: any; profile?: any; embedPreview?: boolean }) {
  const previewMetrics = {
    active: { active: 128 },
    mrr: { mrr: 129900 },
    refunds: { refunds: 1 },
    sales: { totalCount: 412 },
    transactions: [
      { id: 'txn_1', amount: 2999, date: '2025-12-01' },
      { id: 'txn_2', amount: 4999, date: '2025-11-28' }
    ]
  }

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
              {accessVerified ? <Badge tone="positive">Access verified</Badge> : embedPreview ? <Badge tone="caution">Preview</Badge> : <Badge tone="caution">Not verified</Badge>}
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
          ) : embedPreview ? (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <KpiCard title="Active Members" value={previewMetrics.active.active} delta="Preview" />
                  <KpiCard title="MRR" value={`$${(previewMetrics.mrr.mrr / 100).toFixed(2)}`} delta="Preview" />
                  <KpiCard title="Refunds" value={previewMetrics.refunds.refunds} />
                  <KpiCard title="Sales (total)" value={previewMetrics.sales.totalCount} />
                </div>

                <ChartArea data={previewMetrics} />

                <div>
                  <TransactionsTable data={previewMetrics.transactions} />
                </div>
              </div>

              <aside className="flex flex-col gap-4">
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                  <h3 className="text-sm text-zinc-400">Profile (Preview)</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-zinc-800" />
                    <div>
                      <div className="text-white">Preview Creator</div>
                      <div className="text-zinc-500 text-sm">creator+preview@whop.com</div>
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

  // Heuristics to detect an embed coming from Whop so we can show a preview (read-only)
  const referer = (req.headers?.referer || '') as string
  const isIframeHeader = req.headers && (req.headers['sec-fetch-dest'] === 'iframe' || req.headers['x-whop-embed'] === '1')
  const isEmbed = !!(referer.includes('whop.com') || referer.includes('whop.app') || isIframeHeader || (req.url && req.url.includes('embed=1')))

  try {
    const cookies = parse(req.headers.cookie || '')
    const token = cookies.whop_token || null
    if (!token) {
      if (isEmbed) return { props: { companyId, accessVerified: false, embedPreview: true } }
      return { props: { companyId, accessVerified: false } }
    }

    const client = createWhopClient(token)
    if (!client) {
      if (isEmbed) return { props: { companyId, accessVerified: false, embedPreview: true } }
      return { props: { companyId, accessVerified: false } }
    }

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
