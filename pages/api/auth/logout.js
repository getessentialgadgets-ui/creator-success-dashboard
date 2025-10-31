import cookie from 'cookie'

export default async function handler(req, res) {
  // Allow POST for logout
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  // Clear cookie and ensure attributes match the login cookie so the browser removes it correctly
  res.setHeader('Set-Cookie', cookie.serialize('whop_token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'None',
    secure: true,
  }))
  return res.status(200).json({ ok: true })
}
