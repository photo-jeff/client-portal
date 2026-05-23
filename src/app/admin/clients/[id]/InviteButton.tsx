'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  clientId: string
  email: string | null
  inviteSentAt: string | null
}

export function InviteButton({ clientId, email, inviteSentAt }: Props) {
  const [sending, setSending] = useState(false)
  const [sentAt, setSentAt] = useState(inviteSentAt)
  const [error, setError] = useState<string | null>(null)

  async function send() {
    if (!email) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/client/${clientId}/send-invite`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to send')
      setSentAt(new Date().toISOString())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="sm" onClick={send} disabled={sending || !email}>
        {sending ? 'Sending…' : sentAt ? 'Resend portal invite' : 'Send portal invite'}
      </Button>
      {sentAt && (
        <span className="text-xs text-[#888]">
          Last sent {new Date(sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )}
      {error && <span className="text-xs text-red-500">{error}</span>}
      {!email && <span className="text-xs text-[#bbb]">No email address on file</span>}
    </div>
  )
}
