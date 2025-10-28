// Simple token-based auth endpoint. Stores a session cookie with the provided token.
import cookie from 'cookie'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const { email, token } = req.body || {}

  // Very small validation: token or env fallback must exist
  const tokenToUse = token || process.env.WHOP_API_KEY || null
  if (!tokenToUse) return res.status(400).json({ ok: false, error: 'Token required' })

  // Set a cookie for session (HttpOnly) — simple approach for Codespaces/dev
  res.setHeader('Set-Cookie', cookie.serialize('whop_token', tokenToUse, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 }))
  return res.status(200).json({ ok: true })
}
