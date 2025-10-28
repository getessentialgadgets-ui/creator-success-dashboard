import React from 'react'

export default function Loading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="w-full flex items-center justify-center p-8">
      <div className="animate-pulse text-zinc-400">{text}</div>
    </div>
  )
}
