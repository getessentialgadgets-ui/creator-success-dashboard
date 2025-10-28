import React from 'react'
import { motion } from 'framer-motion'

type Props = {
  title: string
  value: string | number
  delta?: string
  icon?: React.ReactNode
}

export default function KpiCard({ title, value, delta, icon }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 shadow-md min-w-[160px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-zinc-400">{title}</div>
          <div className="text-2xl font-semibold text-white mt-1">{value}</div>
        </div>
        {icon ? <div className="text-neon-cyan">{icon}</div> : null}
      </div>
      {delta ? <div className="text-xs text-zinc-500 mt-2">{delta}</div> : null}
    </motion.div>
  )
}
