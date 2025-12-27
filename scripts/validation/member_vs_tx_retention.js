#!/usr/bin/env node
const path = require('path')
const { writeCsv, ensureDir, fetchAllList } = require('./fetch_helper')
const sdkTemplate = require('../../getessential-whop-app/lib/whop-sdk')
const whop = sdkTemplate.whopsdk

function startOfWeek(d) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() - (day - 1))
  date.setUTCHours(0,0,0,0)
  return date
}
function addDays(date, days){ const nd = new Date(date); nd.setUTCDate(nd.getUTCDate()+days); return nd }

async function main(){
  const company = process.env.COMPANY || process.argv[2]
  if (!company) { console.error('Usage: COMPANY=<companyId> node scripts/validation/member_vs_tx_retention.js'); process.exit(2) }
  const lookback = Number(process.env.LOOKBACK || 12)

  console.log('Fetching members and transactions...')
  const members = await fetchAllList((opts) => whop.members.list?.(opts) ?? whop.members?.())
  const transactions = await fetchAllList((opts) => whop.transactions.list?.(opts) ?? whop.transactions?.())

  const filteredTx = transactions.filter(t => {
    if (!t) return false
    if (t.companyId) return String(t.companyId) === String(company)
    if (t.metadata && t.metadata.companyId) return String(t.metadata.companyId) === String(company)
    return true
  })

  const membersMap = new Map()
  members.forEach(m => {
    const key = String(m.email ?? m.user?.email ?? m.userId ?? m.id ?? m.user_id ?? m.id)
    membersMap.set(key, m)
  })

  // Build per-user aggregates from transactions
  const usersMap = new Map()
  function keyForTx(tx){ return tx.customerEmail || tx.customer?.email || tx.customerId || tx.user_id || tx.customer || tx.id }
  filteredTx.forEach(tx => {
    const key = String(keyForTx(tx) ?? tx.id)
    if (!usersMap.has(key)) usersMap.set(key, { id: key, transactions: [] })
    usersMap.get(key).transactions.push(tx)
  })

  // Merge members into users
  members.forEach(m => {
    const key = String(m.email ?? m.user?.email ?? m.userId ?? m.id ?? m.user_id ?? m.id)
    if (!usersMap.has(key)) usersMap.set(key, { id: key, transactions: [], member: m })
    else usersMap.get(key).member = m
  })

  // Compute first purchase / anchor and retention flags (30/90) for each user
  const users = Array.from(usersMap.values()).map(u => {
    const txDates = (u.transactions || []).map(t => new Date(t.createdAt || t.created_at || t.date)).filter(Boolean).sort((a,b)=>a-b)
    const firstDate = txDates.length ? txDates[0] : (u.member ? new Date(u.member.createdAt || u.member.created_at || u.member.start_date) : null)
    return Object.assign({}, u, { txDates, firstDate })
  }).filter(u => u.firstDate)

  // Filter to most recent cohort (start of week of newest firstDate)
  const weeks = []
  const nowWeek = startOfWeek(new Date())
  for (let i=0;i<lookback;i++){ const wk = startOfWeek(addDays(nowWeek, -7*i)); weeks.push(wk.toISOString().slice(0,10)) }
  const cohortKey = weeks[0]

  const cohortUsers = users.filter(u => {
    const wk = startOfWeek(u.firstDate).toISOString().slice(0,10)
    return wk === cohortKey
  })

  function retainedWithin(u, days){
    if (!u.firstDate) return false
    if (u.member){
      const status = (u.member.status || u.member.state || '')
      const canceledAt = u.member.canceledAt || u.member.canceled_at || u.member.cancelled_at
      if (/active/i.test(status)){
        if (!canceledAt) return true
        const cancelledDate = new Date(canceledAt)
        const cutoff = addDays(u.firstDate, days)
        return cancelledDate > cutoff
      }
      return false
    }
    const cutoff = addDays(u.firstDate, days)
    const hasTx = (u.transactions || []).some(t => {
      const d = new Date(t.createdAt || t.created_at || t.date)
      return d >= u.firstDate && d <= cutoff && (t.status ? /succeeded|paid|completed|success/i.test(t.status) : true)
    })
    return !!hasTx
  }

  const rows = cohortUsers.map(u => ({
    key: u.id,
    firstDate: u.firstDate.toISOString(),
    source: u.member ? 'member' : 'transaction',
    memberStatus: u.member ? (u.member.status || u.member.state || '') : '',
    transactionsCount: (u.transactions||[]).length,
    retained_30: retainedWithin(u, 30) ? 1 : 0,
    retained_90: retainedWithin(u, 90) ? 1 : 0
  }))

  const total = rows.length
  const memberRows = rows.filter(r => r.source==='member')
  const txRows = rows.filter(r => r.source==='transaction')
  const summary = {
    company, cohortKey, total, memberCount: memberRows.length, transactionOnlyCount: txRows.length,
    retained30_total: rows.filter(r=>r.retained_30).length,
    retained90_total: rows.filter(r=>r.retained_90).length,
    retained30_member: memberRows.filter(r=>r.retained_30).length,
    retained30_tx: txRows.filter(r=>r.retained_30).length
  }

  const ts = Date.now()
  const outDir = path.join(process.cwd(), 'validation-results', String(ts))
  ensureDir(outDir)
  writeCsv(path.join(outDir, `member_vs_tx_${company}_${cohortKey}.csv`), rows, ['key','firstDate','source','memberStatus','transactionsCount','retained_30','retained_90'])
  require('fs').writeFileSync(path.join(outDir, 'member_vs_tx_summary.json'), JSON.stringify(summary, null, 2))

  console.log('Wrote CSV and summary:', path.join(outDir, `member_vs_tx_${company}_${cohortKey}.csv`), path.join(outDir,'member_vs_tx_summary.json'))
  console.log('Summary:', summary)
}

main().catch(err => { console.error(err); process.exit(1) })
