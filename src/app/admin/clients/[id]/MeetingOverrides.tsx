'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  clientId: string
  finalMeetingEnabled: boolean
  phoneCallEnabled: boolean
}

type ActiveMeeting = 'none' | 'final_meeting' | 'phone_call'

export function MeetingOverrides({ clientId, finalMeetingEnabled, phoneCallEnabled }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const current: ActiveMeeting =
    finalMeetingEnabled ? 'final_meeting' :
    phoneCallEnabled    ? 'phone_call'    :
                          'none'

  async function set(next: ActiveMeeting) {
    await fetch(`/api/admin/client/${clientId}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: next }),
    })
    startTransition(() => router.refresh())
  }

  const options: { value: ActiveMeeting; label: string }[] = [
    { value: 'none',          label: 'Off' },
    { value: 'final_meeting', label: 'Final Meeting Details' },
    { value: 'phone_call',    label: 'Phone Call' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => set(opt.value)}
            disabled={pending}
            className={`text-xs tracking-[0.1em] uppercase px-4 py-2 border rounded transition-colors ${
              current === opt.value
                ? opt.value === 'none'
                  ? 'bg-[#535353] text-white border-[#535353]'
                  : 'bg-green-600 text-white border-green-600'
                : 'border-[#e0ddd8] text-[#535353] hover:border-[#535353]'
            }`}
          >
            {opt.label}
          </button>
        ))}
        {pending && <span className="text-xs text-[#aaa] self-center">Saving…</span>}
      </div>
      <p className="text-xs text-[#aaa] leading-relaxed">
        Shows a booking card on the portal dashboard. Only one can be active at a time.
        Calendly URLs are set in{' '}
        <a href="/admin/meeting-settings" className="underline hover:text-[#535353]">
          Meeting Settings
        </a>.
      </p>
    </div>
  )
}
