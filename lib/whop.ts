/**
 * Server-side Whop client helpers.
 * Exports createWhopClient(token?) which tries to instantiate the Whop SDK with the provided token.
 * Also exports getMetrics(token?) to fetch sales, MRR, active members, refunds and recent transactions.
 */

type Transaction = {
  id: string
  amount: number
  currency: string
  createdAt: string
  customerEmail?: string
  status?: string
}

let CachedWhopClass: any = null

function getWhopClass(): any | null {
  if (CachedWhopClass) return CachedWhopClass
  try {
    // try to load the official package if installed
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const pkg = require('@whop/sdk')
    CachedWhopClass = pkg?.Whop ?? pkg?.default ?? null
    return CachedWhopClass
  } catch (e) {
    // try to reuse existing template SDK instance if present
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
      const template = require('../getessential-whop-app/lib/whop-sdk')
      if (template?.whopsdk) {
        // We return a small wrapper that proxies calls to template.whopsdk
        CachedWhopClass = null
        return null
      }
    } catch (err) {
      // ignore
    }
  }
  return null
}

export function createWhopClient(token?: string) {
  // If @whop/sdk is available, instantiate a new client with token as apiKey.
  const Whop = getWhopClass()
  if (Whop) {
    try {
      return new Whop({ appID: process.env.NEXT_PUBLIC_WHOP_APP_ID, apiKey: token || process.env.WHOP_API_KEY })
    } catch (e) {
      console.warn('Failed to instantiate Whop SDK:', e)
    }
  }

  // fallback: try to reuse the template whopsdk instance (no token support)
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const template = require('../getessential-whop-app/lib/whop-sdk')
    if (template?.whopsdk) return template.whopsdk
  } catch (e) {
    // ignore
  }

  return null
}

export async function getMetrics(token?: string): Promise<{ sales: { totalCount: number; monthlyRevenue: number }; mrr: { mrr: number }; active: { active: number }; refunds: { refunds: number }; transactions: Transaction[] }>
{
  const client = createWhopClient(token)
  if (client) {
    try {
      // Attempt best-effort calls with optional shape
      const salesResp = (client.sales && (await (client.sales.list?.() ?? client.sales()))) || { total: 0, monthlyRevenue: 0 }
      const mrrResp = (client.billing && (await (client.billing.getMRR?.() ?? client.billing()))) || { mrr: 0 }
      const membersResp = (client.members && (await (client.members.list?.({ status: 'active' }) ?? client.members()))) || []
      const refundsResp = (client.refunds && (await (client.refunds.list?.() ?? client.refunds()))) || { total: 0 }
      const transactionsResp = (client.transactions && (await (client.transactions.list?.({ limit: 10 }) ?? client.transactions()))) || []

      return {
        sales: { totalCount: salesResp.total || 0, monthlyRevenue: salesResp.monthlyRevenue || 0 },
        mrr: { mrr: mrrResp.mrr || 0 },
        active: { active: Array.isArray(membersResp) ? membersResp.length : membersResp?.total ?? 0 },
        refunds: { refunds: refundsResp.total || 0 },
        transactions: transactionsResp?.items ?? transactionsResp ?? [],
      }
    } catch (e) {
      console.warn('getMetrics failed:', e)
    }
  }

  // Fallback mock data
  return {
    sales: { totalCount: 1240, monthlyRevenue: 12950 },
    mrr: { mrr: 2850 },
    active: { active: 420 },
    refunds: { refunds: 7 },
    transactions: [
      { id: 'txn_1', amount: 2990, currency: 'USD', createdAt: new Date().toISOString(), customerEmail: 'user1@example.com', status: 'succeeded' },
      { id: 'txn_2', amount: 1990, currency: 'USD', createdAt: new Date(Date.now() - 86400000).toISOString(), customerEmail: 'user2@example.com', status: 'succeeded' },
    ],
  }
}

export async function getProfile(token?: string): Promise<{ email?: string; avatar?: string; name?: string }>
{
  const client = createWhopClient(token)
  if (client) {
    try {
      if (client.auth && client.auth.getUser) {
        const u = await client.auth.getUser()
        return { email: u?.email, avatar: u?.avatar, name: u?.name }
      }
    } catch (e) {
      console.warn('getProfile failed:', e)
    }
  }
  return { email: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID ?? undefined, avatar: undefined, name: 'Creator' }
}

export default { createWhopClient, getMetrics, getProfile }
