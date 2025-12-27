#!/usr/bin/env node
const path = require('path')
const { writeCsv, ensureDir, fetchAllList } = require('./fetch_helper')

const sdkTemplate = require('../../getessential-whop-app/lib/whop-sdk')
const whop = sdkTemplate.whopsdk

async function main() {
  const company = process.env.COMPANY || process.argv[2]
  if (!company) {
    console.error('Usage: COMPANY=<companyId> node scripts/validation/identity_coverage.js')
    process.exit(2)
  }
  const lookbackWeeks = Number(process.env.LOOKBACK || 12)
  const sinceDate = new Date()
  sinceDate.setDate(sinceDate.getDate() - (lookbackWeeks * 7 + 7)) // buffer

  console.log(`Fetching transactions since ${sinceDate.toISOString()} for company ${company} (lookback ${lookbackWeeks}w)`)

  const transactions = await fetchAllList((opts) => whop.transactions.list?.(opts) ?? whop.transactions?.())
  // Filter by company metadata if present
  const filtered = transactions.filter(t => {
    if (!t) return false
    if (t.companyId) return String(t.companyId) === String(company)
    if (t.metadata && t.metadata.companyId) return String(t.metadata.companyId) === String(company)
    return true
  })

  const rows = filtered.map(t => ({ id: t.id, createdAt: t.createdAt ?? t.created_at ?? t.date, customerEmail: t.customerEmail ?? t.customer?.email ?? '', customerId: t.customerId ?? t.customer?.id ?? '' }))

  const total = rows.length
  const withEmail = rows.filter(r => r.customerEmail && r.customerEmail.trim()).length
  const pctWithEmail = total === 0 ? 0 : Math.round((withEmail/total)*10000)/100

  const ts = Date.now()
  const outDir = path.join(process.cwd(), 'validation-results', String(ts))
  ensureDir(outDir)
  const csvPath = path.join(outDir, `identity_coverage_${company}.csv`)
  writeCsv(csvPath, rows, ['id','createdAt','customerEmail','customerId'])
  const summary = { company, totalTransactions: total, withEmail, pctWithEmail, csv: csvPath }
  require('fs').writeFileSync(path.join(outDir, 'identity_coverage_summary.json'), JSON.stringify(summary, null, 2))

  console.log('Wrote CSV:', csvPath)
  console.log('Summary:', summary)
}

main().catch(err => { console.error(err); process.exit(1) })
