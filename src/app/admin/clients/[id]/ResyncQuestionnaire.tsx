'use client'
import { useState } from 'react'

interface Props {
  clientId: string
  hasUrl: boolean
  hasAnswers: boolean
}

export function ResyncQuestionnaire({ clientId, hasUrl, hasAnswers }: Props) {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const disabled = status === 'syncing' || !hasUrl || !hasAnswers

  async function resync() {
    setStatus('syncing')
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/client/${clientId}/resync-questionnaire`, { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus('done')
        setMessage('Synced to VSCO ✓')
      } else {
        setStatus('error')
        setMessage(body.error ?? 'Sync failed')
      }
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Sync failed')
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={resync}
        disabled={disabled}
        className="text-xs tracking-[0.1em] uppercase px-4 py-2 border border-[#e0ddd8] text-[#535353] rounded transition-colors hover:border-[#535353] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === 'syncing' ? 'Syncing…' : 'Re-send to VSCO'}
      </button>
      {message && (
        <span className={`text-xs ${status === 'error' ? 'text-red-500' : 'text-green-600'}`}>
          {message}
        </span>
      )}
      {!hasUrl && (
        <span className="text-xs text-[#aaa]">No VSCO questionnaire URL set.</span>
      )}
      {hasUrl && !hasAnswers && (
        <span className="text-xs text-[#aaa]">No answers to sync yet.</span>
      )}
    </div>
  )
}
