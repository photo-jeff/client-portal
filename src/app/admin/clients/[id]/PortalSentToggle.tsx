'use client'
import { useState } from 'react'

interface Props {
  clientId: string
  inviteSentAt: string | null
}

export function PortalSentToggle({ clientId, inviteSentAt }: Props) {
  const [sentAt, setSentAt] = useState(inviteSentAt)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    if (saving) return
    const next = !sentAt
    setSaving(true)
    // Optimistic
    setSentAt(next ? new Date().toISOString() : null)
    try {
      const res = await fetch(`/api/admin/client/${clientId}/portal-sent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sent: next }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setSentAt(json.invite_sent_at)
    } catch {
      // Revert on failure
      setSentAt(sentAt)
    } finally {
      setSaving(false)
    }
  }

  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={!!sentAt}
        onChange={toggle}
        disabled={saving}
        className="w-4 h-4 accent-[#535353] cursor-pointer"
      />
      <span className="text-sm text-[#535353]">
        Portal sent
        {sentAt && (
          <span className="text-[#aaa]">
            {' '}· {new Date(sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </span>
    </label>
  )
}
