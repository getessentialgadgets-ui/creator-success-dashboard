import { useRef, useState } from 'react'

export default function TestParent() {
  const iframeRef = useRef(null)
  const [token, setToken] = useState('')

  function send() {
    if (!iframeRef.current) return
    iframeRef.current.contentWindow.postMessage({ type: 'WHOP_TOKEN', token }, '*')
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>PostMessage test parent</h2>
      <p>Enter a token and send it to the embedded iframe below.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input value={token} onChange={e => setToken(e.target.value)} placeholder="token" style={{ flex: 1 }} />
        <button onClick={send}>Send token to iframe</button>
      </div>
      <iframe ref={iframeRef} src="/dashboard/1" width="100%" height="600" />
    </div>
  )
}
