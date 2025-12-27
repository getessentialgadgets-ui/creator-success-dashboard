const fs = require('fs')
const path = require('path')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function writeCsv(filePath, rows, headers) {
  ensureDir(path.dirname(filePath))
  const out = [headers.join(','), ...rows.map(r => headers.map(h => csvSafe(r[h])).join(','))].join('\n')
  fs.writeFileSync(filePath, out)
}

function csvSafe(value) {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('\n') || s.includes('"')) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

async function fetchAllList(listFn, opts = {}) {
  // Generic pagination helper.
  // listFn should accept an options object and return either array or { items, nextCursor/has_more }
  const pageLimit = opts.limit || 1000
  let all = []
  let cursor = undefined
  let page = 0
  while (true) {
    page++
    const args = Object.assign({}, opts, { limit: pageLimit })
    if (cursor) args.cursor = cursor
    // eslint-disable-next-line no-await-in-loop
    const resp = await listFn(args)
    if (!resp) break
    if (Array.isArray(resp)) {
      all = all.concat(resp)
      if (resp.length < pageLimit) break
      // If array reached pageLimit, attempt next by advancing cursor not available—break to avoid infinite loop
      break
    }
    const items = resp.items || resp.data || resp
    if (Array.isArray(items)) all = all.concat(items)
    else break

    // Detect cursor patterns
    if (resp.nextCursor) {
      cursor = resp.nextCursor
      continue
    }
    if (resp.has_more && resp.has_more === true && resp.next) {
      // Some libs use next url
      // eslint-disable-next-line no-await-in-loop
      const nextResp = await resp.next()
      if (!nextResp) break
      continue
    }
    // no known pagination info — break
    break
  }
  return all
}

module.exports = { ensureDir, writeCsv, fetchAllList }
