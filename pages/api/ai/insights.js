import cookie from 'cookie'
import { getMetrics } from '../../../lib/whop'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const OPENAI_KEY = process.env.OPENAI_API_KEY
  if (!OPENAI_KEY) return res.status(500).json({ ok: false, error: 'OPENAI_API_KEY not set in env' })

  try {
    const cookies = cookie.parse(req.headers.cookie || '')
    const token = cookies.whop_token || null

    const metrics = await getMetrics(token)

    // Build a concise prompt for the model
    const prompt = `You are an expert SaaS growth advisor. Given the following metrics, return 3 short, actionable "Creator Growth Tips" tailored to creators. Metrics: Sales totalCount=${metrics.sales.totalCount}, monthlyRevenue=${metrics.sales.monthlyRevenue}, MRR=${metrics.mrr.mrr}, ActiveMembers=${metrics.active.active}, Refunds=${metrics.refunds.refunds}. Provide each tip as a short sentence and one tactical step.`

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a concise growth advisor for creator businesses.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 400,
      temperature: 0.7
    }

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(body),
    })

    if (!r.ok) {
      const txt = await r.text()
      return res.status(502).json({ ok: false, error: 'OpenAI error', details: txt })
    }

    const data = await r.json()
    const content = data.choices?.[0]?.message?.content ?? ''

    return res.status(200).json({ ok: true, tips: content, raw: data })
  } catch (err) {
    console.error('ai/insights error', err)
    return res.status(500).json({ ok: false, error: err?.message || String(err) })
  }
}
