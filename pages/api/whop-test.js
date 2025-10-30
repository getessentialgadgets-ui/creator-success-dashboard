/*
  Lightweight API route that demonstrates calling the Whop wrapper.
  Returns sales, mrr, active members, refunds and sample transactions.
*/

import cookie from 'cookie'
import { getMetrics, getProfile } from '../../../lib/whop'

export default async function handler(req, res) {
  try {
    const cookies = cookie.parse(req.headers.cookie || '')
    const token = cookies.whop_token || null

    const metrics = await getMetrics(token)
    const profile = await getProfile(token)

    res.status(200).json({ ok: true, ...metrics, profile })
  } catch (err) {
    console.error('whop-test error', err)
    res.status(500).json({ ok: false, error: (err && err.message) || String(err) })
  }
}
