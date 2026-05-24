'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  clientId: string
  override: string | null        // 'on' | 'off' | null
  shootAt: string | null
  isAutoEligible: boolean        // would show under normal package logic
}

export function PrewedOverride({ clientId, override, shootAt, isAutoEligible }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [lastAction, setLastAction] = useState<string | null>(null)

  async function act(action: 'on' | 'off' | 'reset') {
    setLastAction(action)
    await fetch(`/api/admin/client/${clientId}/prewedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    startTransition(() => router.refresh())
  }

  const formattedShootAt = shootAt
    ? new Date(shootAt).toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
      })
    : null

  // Describe current state
  const stateLabel =
    override === 'on'  ? 'Forced on'  :
    override === 'off' ? 'Forced off' :
    isAutoEligible     ? 'Auto (showing)' :
                         'Auto (hidden — not an album package)'

  const stateColour =
    override === 'on'  ? 'text-green-600' :
    override === 'off' ? 'text-red-500'   :
    isAutoEligible     ? 'text-green-600' :
                         'text-[#aaa]'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div>
          <span className="text-xs tracking-[0.1em] uppercase text-[#888] block mb-1">Visibility</span>
          <span className={`font-medium ${stateColour}`}>{stateLabel}</span>
        </div>
        <div>
          <span className="text-xs tracking-[0.1em] uppercase text-[#888] block mb-1">Booking</span>
          <span className={formattedShootAt ? 'text-[#1a1a1a]' : 'text-[#aaa]'}>
            {formattedShootAt ?? 'No booking'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => act('on')}
          disabled={pending}
          className={`text-xs tracking-[0.1em] uppercase px-4 py-2 border rounded transition-colors ${
            override === 'on'
              ? 'bg-green-600 text-white border-green-600'
              : 'border-[#e0ddd8] text-[#535353] hover:border-green-600 hover:text-green-600'
          }`}
        >
          On
        </button>
        <button
          onClick={() => act('off')}
          disabled={pending}
          className={`text-xs tracking-[0.1em] uppercase px-4 py-2 border rounded transition-colors ${
            override === 'off'
              ? 'bg-red-500 text-white border-red-500'
              : 'border-[#e0ddd8] text-[#535353] hover:border-red-500 hover:text-red-500'
          }`}
        >
          Off
        </button>
        <button
          onClick={() => act('reset')}
          disabled={pending}
          className="text-xs tracking-[0.1em] uppercase px-4 py-2 border border-[#e0ddd8] text-[#535353] hover:border-[#1a1a1a] hover:text-[#1a1a1a] rounded transition-colors"
        >
          Reset
        </button>
        {pending && (
          <span className="text-xs text-[#aaa] self-center">
            {lastAction === 'reset' ? 'Clearing booking…' : 'Saving…'}
          </span>
        )}
      </div>
      <p className="text-xs text-[#aaa] leading-relaxed">
        <strong>On</strong> — show for this client regardless of package (e.g. Download adding pre-wed as extra).<br />
        <strong>Off</strong> — hide regardless of package (e.g. Album couple who has opted out).<br />
        <strong>Reset</strong> — clear their booking so they can rebook from scratch.
      </p>
    </div>
  )
}
