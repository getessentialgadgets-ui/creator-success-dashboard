import cookie from 'cookie'

export default async function handler(req, res) {
  // Allow POST for logout
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  res.setHeader('Set-Cookie', cookie.serialize('whop_token', '', { httpOnly: true, path: '/', maxAge: 0 }))
  return res.status(200).json({ ok: true })
}
