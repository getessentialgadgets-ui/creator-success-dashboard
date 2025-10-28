import React from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type Props = {
  data?: Array<{ date: string; value: number }>
}

export default function ChartArea({ data }: Props) {
  const sample = data ?? Array.from({ length: 8 }).map((_, i) => ({ date: `M-${8 - i}`, value: Math.round(Math.random() * 5000) }))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="w-full h-64 bg-zinc-900 rounded-xl border border-zinc-800 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={sample} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00FFD1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#00FFD1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip contentStyle={{ background: '#0f1720', border: '1px solid #222' }} />
          <Area type="monotone" dataKey="value" stroke="#00FFD1" fillOpacity={1} fill="url(#colorUv)" />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
