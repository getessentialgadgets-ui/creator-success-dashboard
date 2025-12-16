// Simple token-based auth endpoint. Stores a session cookie with the provided token.
import cookie from 'cookie'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  const { email, token } = req.body || {}

  // Allow token via Authorization header as Bearer token for postMessage fallback
  const authHeader = (req.headers.authorization || req.headers.Authorization || '')
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null

  const tokenToUse = token || bearer || process.env.WHOP_API_KEY || null
  if (!tokenToUse) return res.status(400).json({ ok: false, error: 'Token required' })

  // Optionally verify the token before issuing the cookie
  try {
    // Try to use the template whopsdk if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const template = require('../../getessential-whop-app/lib/whop-sdk')
    if (template?.whopsdk && template.whopsdk.verifyUserToken) {
      // Build a minimal headers-like object for verification
      const hdrs = { get: (k) => (k?.toLowerCase() === 'authorization' ? `Bearer ${tokenToUse}` : undefined) }
      await template.whopsdk.verifyUserToken(hdrs)
    }
  } catch (err) {
    console.warn('Token verification failed:', err)
    return res.status(401).json({ ok: false, error: 'Invalid token' })
  }

  // Set a cookie for session (HttpOnly)
  res.setHeader('Set-Cookie', cookie.serialize('whop_token', tokenToUse, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'None',
    secure: true,
  }))
  return res.status(200).json({ ok: true })
}
