"use client"

import React, { useEffect, useState } from 'react'

export default function TokenListener() {
  const [status, setStatus] = useState<string | null>(null)
  const [manual, setManual] = useState('')

  useEffect(() => {
    function handler(e: MessageEvent) {
      try {
        const origin = e.origin || ''
        // Accept tokens only from whop or localhost for dev
        if (!(origin.includes('whop.com') || origin.includes('localhost') || origin.includes('127.0.0.1'))) return
        const data = e.data || {}
        if (data && data.type === 'WHOP_TOKEN' && data.token) {
          setStatus('Received token from parent — logging in...')
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: data.token }),
            credentials: 'include'
          })
            .then(r => r.json())
            .then(j => {
              if (j?.ok) {
                setStatus('Login success — reloading...')
                window.location.reload()
              } else {
                setStatus('Login failed: ' + (j?.error || 'unknown'))
              }
            }).catch(err => setStatus('Login failed: ' + err?.message))
        }
      } catch (err: any) {
        setStatus('Error handling message: ' + err?.message)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  function submitManual() {
    if (!manual) return setStatus('Paste a token first')
    setStatus('Logging in with manual token...')
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: manual }),
      credentials: 'include'
    })
      .then(r => r.json())
      .then(j => {
        if (j?.ok) {
          setStatus('Login success — reloading...')
          window.location.reload()
        } else {
          setStatus('Login failed: ' + (j?.error || 'unknown'))
        }
      }).catch(err => setStatus('Login failed: ' + err?.message))
  }

  return (
    <div className="mt-4">
      <div className="p-4 border rounded-md bg-gray-50 dark:bg-gray-900">
        <div className="mb-2">This app detected you are not authenticated on the server. You can either ask the parent to send your token, or paste a token below to continue.</div>
        <div className="flex gap-2 items-center mb-2">
          <input value={manual} onChange={e => setManual(e.target.value)} placeholder="Paste token here" className="flex-1 border px-2 py-1 rounded" />
          <button onClick={submitManual} className="px-3 py-1 bg-blue-600 text-white rounded">Use token</button>
        </div>
        <div className="text-sm text-gray-600">Status: {status ?? 'waiting for token...'}</div>
        <div className="text-xs text-gray-400 mt-2">Tip: parent can postMessage({"type":"WHOP_TOKEN","token":"..."}) to the iframe to login automatically (origin must be whop.com or localhost).</div>
      </div>
    </div>
  )
}
