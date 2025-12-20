import React from 'react'

export default function EmbedPreviewBanner({ text = 'Preview (read-only)', className = '' }: { text?: string; className?: string }) {
  return (
    <div className={`p-2 rounded-md bg-yellow-600 text-black text-sm font-medium ${className}`}>
      {text}
    </div>
  )
}
