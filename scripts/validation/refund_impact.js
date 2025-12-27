#!/usr/bin/env node
const path = require('path')
const { writeCsv, ensureDir, fetchAllList } = require('./fetch_helper')
const sdkTemplate = require('../../getessential-whop-app/lib/whop-sdk')
const whop = sdkTemplate.whopsdk

function addDays(date, days){ const nd = new Date(date); nd.setUTCDate(nd.getUTCDate()+days); return nd }

async function main(){
  const company = process.env.COMPANY || process.argv[2]
  if (!company) { console.error('Usage: COMPANY=<companyId> node scripts/validation/refund_impact.js'); process.exit(2) }
  console.log('Fetching transactions & refunds...')
  const transactions = await fetchAllList((opts) => whop.transactions.list?.(opts) ?? whop.transactions?.())
  const refunds = await fetchAllList((opts) => whop.refunds.list?.(opts) ?? whop.refunds?.())

  const filteredTx = transactions.filter(t => {
    if (!t) return false
    if (t.companyId) return String(t.companyId) === String(company)
    if (t.metadata && t.metadata.companyId) return String(t.metadata.companyId) === String(company)
    return true
  })

  // Build map txId -> refunds
  const refundsByTx = new Map()
  refunds.forEach(r => {
    if (!r.transactionId && !r.txn_id && !r.transaction) return
    const key = String(r.transactionId ?? r.txn_id ?? r.transaction)
    if (!refundsByTx.has(key)) refundsByTx.set(key, [])
    refundsByTx.get(key).push(r)
  })

  const users = {}
  filteredTx.forEach(tx => {
    const key = String(tx.customerEmail || tx.customer?.email || tx.customerId || tx.user_id || tx.customer || tx.id)
    if (!users[key]) users[key] = { key, txs: [] }
    users[key].txs.push(tx)
  })

  // Identify fallback-retained users: users without member (we can't fetch members easily here), we'll approximate by checking if they had another transaction in window
  const rows = []
  Object.values(users).forEach(u => {
    const first = (u.txs||[]).map(t=>new Date(t.createdAt||t.created_at||t.date)).sort((a,b)=>a-b)[0]
    if (!first) return
    const window30 = addDays(first, 30)
    const retained = u.txs.some(t => { const d=new Date(t.createdAt||t.created_at||t.date); return d>=first && d<=window30 && (t.status? /succeeded|paid|completed|success/i.test(t.status):true) })
    const txWithRefund = u.txs.map(t=>({ id: t.id, refunded: (refundsByTx.has(String(t.id)) || false) }))
    const refundCount = txWithRefund.filter(x=>x.refunded).length
    rows.push({ key: u.key, first: first.toISOString(), txCount: u.txs.length, retainedFallback: retained?1:0, refundCount })
  })

  const totalUsers = rows.length
  const fallbackRetained = rows.filter(r=>r.retainedFallback)
  const withRefunds = rows.filter(r=>r.refundCount>0)
  const retainedWithRefunds = rows.filter(r=>r.retainedFallback && r.refundCount>0)

  const summary = { company, totalUsers, fallbackRetainedCount: fallbackRetained.length, withRefundsCount: withRefunds.length, retainedAndRefunds: retainedWithRefunds.length }

  const ts = Date.now()
  const outDir = path.join(process.cwd(), 'validation-results', String(ts))
  ensureDir(outDir)
  writeCsv(path.join(outDir, `refund_impact_${company}.csv`), rows, ['key','first','txCount','retainedFallback','refundCount'])
  require('fs').writeFileSync(path.join(outDir, 'refund_impact_summary.json'), JSON.stringify(summary, null, 2))

  console.log('Wrote CSV and summary:', path.join(outDir, `refund_impact_${company}.csv`), path.join(outDir,'refund_impact_summary.json'))
  console.log('Summary:', summary)
}

main().catch(err => { console.error(err); process.exit(1) })
