import type { NextApiRequest, NextApiResponse } from 'next'
import { createWhopClient } from '../../../../lib/whop'

// Simple helper to parse dates and compare days
function parseDate(d: string | Date) {
  return new Date(d)
}
function addDays(date: Date, days: number) {
  const nd = new Date(date)
  nd.setUTCDate(nd.getUTCDate() + days)
  return nd
}
function startOfWeek(d: Date) {
  // ISO week start (Monday)
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7 // Sunday -> 7
  date.setUTCDate(date.getUTCDate() - (day - 1))
  date.setUTCHours(0, 0, 0, 0)
  return date
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { companyId } = req.query as { companyId: string }
  if (!companyId) return res.status(400).json({ error: 'companyId required' })

  const windowDays = Number(req.query.window || 30) // 30 or 90
  const lookback = Math.max(1, Number(req.query.lookback || 12))
  // granularity fixed to week for V1

  try {
    const client: any = createWhopClient()
    if (!client) {
      return res.status(200).json({ companyId, cohorts: [], meta: { message: 'No Whop client available (using mock)', lookback } })
    }

    // Determine earliest date to fetch transactions for: lookback weeks + window buffer
    const now = new Date()
    const earliest = startOfWeek(addDays(now, -1 * (lookback * 7 + windowDays + 7))) // buffer 1 week

    // Fetch transactions (best-effort). SDK shapes vary so be defensive.
    let transactions: any[] = []
    try {
      if (client.transactions && client.transactions.list) {
        // Some SDKs accept a since param or limit; try common shapes
        transactions = await (client.transactions.list?.({ limit: 10000, since: earliest.toISOString() }) ?? client.transactions.list?.({ limit: 10000 }) )
      } else if (client.transactions) {
        transactions = await (client.transactions?.() ?? [])
      }
    } catch (e) {
      console.warn('transactions fetch failed:', e)
      transactions = []
    }

    // Normalize transactions array
    if ((transactions as any)?.items) transactions = (transactions as any).items
    transactions = Array.isArray(transactions) ? transactions : []

    // Filter for this company if SDK returns cross-company data (best-effort)
    transactions = transactions.filter((t: any) => {
      if (!t) return false
      if (t.companyId) return String(t.companyId) === String(companyId)
      if (t.metadata && t.metadata.companyId) return String(t.metadata.companyId) === String(companyId)
      return true // assume scoped to the app account
    })

    // Fetch members (best-effort)
    let members: any[] = []
    try {
      if (client.members && client.members.list) {
        members = await (client.members.list?.({ limit: 10000 }) ?? client.members.list?.())
      } else if (client.members) {
        members = await (client.members?.() ?? [])
      }
    } catch (e) {
      console.warn('members fetch failed:', e)
      members = []
    }
    if ((members as any)?.items) members = (members as any).items
    members = Array.isArray(members) ? members : []

    // Build a map of users keyed by an identifier (prefer email, else id)
    type UserAgg = {
      id: string
      email?: string
      transactions: any[]
      member?: any
    }
    const usersByKey = new Map<string, UserAgg>()

    function keyForTx(tx: any) {
      return tx.customerEmail || tx.customer?.email || tx.customerId || tx.user_id || tx.customer || tx.id
    }

    transactions.forEach((tx: any) => {
      const key = String(keyForTx(tx) ?? tx.id)
      if (!usersByKey.has(key)) usersByKey.set(key, { id: key, email: tx.customerEmail ?? undefined, transactions: [], member: undefined })
      usersByKey.get(key)!.transactions.push(tx)
    })

    members.forEach((m: any) => {
      // member may have email or user_id
      const key = String(m.email ?? m.user?.email ?? m.userId ?? m.id ?? m.user_id ?? m.id)
      if (!usersByKey.has(key)) usersByKey.set(key, { id: key, email: m.email ?? m.user?.email, transactions: [], member: m })
      else usersByKey.get(key)!.member = m
    })

    // Compute first purchase date for each user and retention flags
    type CohortAgg = {
      cohortDate: string // ISO date (week start)
      cohortKey: string
      cohortSize: number
      retained_30_count: number
      retained_90_count: number
    }

    const cohortsMap = new Map<string, CohortAgg>()

    const allUsers = Array.from(usersByKey.values())
    // For users without transactions but with member createdAt, treat firstDate as member.createdAt
    allUsers.forEach((u) => {
      const txDates = u.transactions.map((t) => new Date(t.createdAt || t.created_at || t.created || t.date))
        .filter(Boolean)
        .sort((a: Date, b: Date) => a.getTime() - b.getTime())

      let firstDate: Date | null = txDates.length ? txDates[0] : null
      if (!firstDate && u.member) {
        const cd = u.member.createdAt || u.member.created_at || u.member.start_date
        if (cd) firstDate = new Date(cd)
      }
      if (!firstDate) return // skip users with no anchor

      // Round cohort by week
      const cohortStart = startOfWeek(firstDate)
      const cohortKey = cohortStart.toISOString().slice(0, 10)

      const cohort = cohortsMap.get(cohortKey) ?? { cohortDate: cohortKey, cohortKey, cohortSize: 0, retained_30_count: 0, retained_90_count: 0 }
      cohort.cohortSize += 1

      // Retention check helper
      const retainedWithin = (days: number) => {
        // Prefer explicit membership status if present
        if (u.member) {
          const status = (u.member.status || u.member.state || '') as string
          const canceledAt = u.member.canceledAt || u.member.canceled_at || u.member.cancelled_at
          // if status includes 'active' or state===active, and not cancelled within window
          if (/active/i.test(status)) {
            if (!canceledAt) return true
            const cancelledDate = new Date(canceledAt)
            const cutoff = addDays(firstDate!, days)
            return cancelledDate > cutoff
          }
          // if not active, not retained
          return false
        }

        // Fallback: transactions proxy — look for any transaction within window (inclusive)
        const cutoff = addDays(firstDate!, days)
        const hasTx = u.transactions.some((t) => {
          const d = new Date(t.createdAt || t.created_at || t.created || t.date)
          return d >= firstDate! && d <= cutoff && (t.status ? /succeeded|paid|completed|success/i.test(t.status) : true)
        })
        return !!hasTx
      }

      if (retainedWithin(30)) cohort.retained_30_count += 1
      if (retainedWithin(90)) cohort.retained_90_count += 1

      cohortsMap.set(cohortKey, cohort)
    })

    // Normalize to last N weekly cohorts
    const weeklyKeys: string[] = []
    const nowWeek = startOfWeek(new Date())
    for (let i = 0; i < lookback; i++) {
      const wkStart = startOfWeek(addDays(nowWeek, -7 * i))
      weeklyKeys.push(wkStart.toISOString().slice(0, 10))
    }

    const cohorts: CohortAgg[] = weeklyKeys.map((k) => cohortsMap.get(k) ?? { cohortDate: k, cohortKey: k, cohortSize: 0, retained_30_count: 0, retained_90_count: 0 })

    return res.status(200).json({ companyId, granularity: 'week', window: windowDays, cohorts, meta: { generatedAt: new Date().toISOString(), lookback } })
  } catch (err) {
    console.error('cohort route error', err)
    return res.status(500).json({ error: 'internal_error', details: String(err) })
  }
}
