#!/usr/bin/env node
const path = require('path')
const { ensureDir, fetchAllList } = require('./fetch_helper')
const sdkTemplate = require('../../getessential-whop-app/lib/whop-sdk')
const whop = sdkTemplate.whopsdk

async function main(){
  const company = process.env.COMPANY || process.argv[2]
  if (!company) { console.error('Usage: COMPANY=<companyId> node scripts/validation/pagination_check.js'); process.exit(2) }

  console.log('Running pagination check for transactions...')

  // Try a single-page fetch with a large limit
  const singlePage = await (whop.transactions.list?.({ limit: 10000 }) ?? whop.transactions?.())
  let singleLen = 0
  if (Array.isArray(singlePage)) singleLen = singlePage.length
  else if (singlePage && Array.isArray(singlePage.items)) singleLen = singlePage.items.length
  else singleLen = 0

  console.log('Single page returned items:', singleLen)

  // Now run a fully-paginated fetch
  const all = await fetchAllList((opts) => whop.transactions.list?.(opts) ?? whop.transactions?.())
  console.log('Total fetched with pagination:', all.length)

  const ts = Date.now()
  const outDir = path.join(process.cwd(), 'validation-results', String(ts))
  ensureDir(outDir)
  require('fs').writeFileSync(path.join(outDir, 'pagination_check_summary.json'), JSON.stringify({ company, singleLen, totalFetched: all.length }, null, 2))
  console.log('Wrote summary to', outDir)
}

main().catch(err => { console.error(err); process.exit(1) })
