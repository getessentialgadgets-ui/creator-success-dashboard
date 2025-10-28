import React from 'react'

export default function Button({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`px-3 py-2 rounded-md bg-gradient-to-r from-neon-cyan to-neon-pink text-black font-semibold ${className}`}
    >
      {children}
    </button>
  )
}
