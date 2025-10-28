import React from 'react'

export default function Error({ message = 'Something went wrong' }: { message?: string }) {
  return (
    <div className="w-full p-6 bg-red-900/10 border border-red-800 text-red-300 rounded-md">
      {message}
    </div>
  )
}
