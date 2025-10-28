import cookie from 'cookie'
import { createWhopClient, getProfile } from '../../../lib/whop'

export default async function handler(req, res) {
  const cookies = cookie.parse(req.headers.cookie || '')
  const token = cookies.whop_token || null
  if (!token) return res.status(200).json({ ok: false, authenticated: false })

  try {
    // instantiate client with token and attempt to fetch profile
    const client = createWhopClient(token)
    const profile = await getProfile(token)
    return res.status(200).json({ ok: true, authenticated: !!profile, profile })
  } catch (e) {
    console.error('me error', e)
    return res.status(200).json({ ok: false, authenticated: false })
  }
}
