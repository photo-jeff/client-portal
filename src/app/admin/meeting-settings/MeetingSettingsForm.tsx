'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

interface Props {
  initialFinalMeetingUrl: string
  initialPhoneCallUrl: string
}

export function MeetingSettingsForm({ initialFinalMeetingUrl, initialPhoneCallUrl }: Props) {
  const [finalUrl, setFinalUrl] = useState(initialFinalMeetingUrl)
  const [phoneUrl, setPhoneUrl] = useState(initialPhoneCallUrl)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await Promise.all([
        fetch('/api/admin/meeting-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'final_meeting_calendly_url', value: finalUrl }),
        }),
        fetch('/api/admin/meeting-settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'phone_call_calendly_url', value: phoneUrl }),
        }),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Failed to save — please try again')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs tracking-[0.1em] uppercase text-[#888] mb-2">
          Final Meeting Details — Calendly URL
        </label>
        <p className="text-xs text-[#bbb] mb-2">
          The Calendly link for your &quot;Final Meeting Details&quot; event type.
        </p>
        <input
          type="url"
          value={finalUrl}
          onChange={e => setFinalUrl(e.target.value)}
          placeholder="https://calendly.com/jeffoliverphotography/..."
          className="w-full px-4 py-3 text-sm border border-[#e0ddd8] rounded-lg bg-white focus:outline-none focus:border-[#c8c4be] font-mono"
        />
      </div>

      <div>
        <label className="block text-xs tracking-[0.1em] uppercase text-[#888] mb-2">
          Phone Call — Calendly URL
        </label>
        <p className="text-xs text-[#bbb] mb-2">
          The Calendly link for your &quot;Phone Call&quot; event type.
        </p>
        <input
          type="url"
          value={phoneUrl}
          onChange={e => setPhoneUrl(e.target.value)}
          placeholder="https://calendly.com/jeffoliverphotography/..."
          className="w-full px-4 py-3 text-sm border border-[#e0ddd8] rounded-lg bg-white focus:outline-none focus:border-[#c8c4be] font-mono"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="filled" size="sm" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        {saved && <span className="text-sm text-green-600">Saved ✓</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>

      <p className="text-xs text-[#bbb] leading-relaxed">
        To enable a meeting card for a specific couple, go to their client page and set the Meeting Booking toggle.
      </p>
    </div>
  )
}
