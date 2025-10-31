import React from 'react'

export default function ExperiencePage({ params }: { params?: { experienceId?: string } }) {
  // Minimal experience page so Whop can load /experiences/[experienceId]
  const id = params?.experienceId ?? 'unknown'
  return (
    <div className="min-h-screen bg-[#071018] text-zinc-100 flex items-center justify-center">
      <div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800">
        <h1 className="text-2xl font-semibold">Experience</h1>
        <p className="text-zinc-400 mt-2">Experience ID: {id}</p>
        <p className="text-zinc-500 mt-4">This is a lightweight placeholder page used when Whop embeds your app. Replace with your full experience UI if needed.</p>
      </div>
    </div>
  )
}
