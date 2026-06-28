'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  clientId: string
  paymentsDisabled: boolean
}

export function PaymentsToggle({ clientId, paymentsDisabled }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  async function set(disabled: boolean) {
    await fetch(`/api/admin/client/${clientId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled }),
    })
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs tracking-[0.1em] uppercase text-[#888] block mb-1">Portal payment</span>
        <span className={`font-medium ${paymentsDisabled ? 'text-red-500' : 'text-green-600'}`}>
          {paymentsDisabled ? 'Off — cannot pay via portal' : 'On — can pay via portal'}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => set(false)}
          disabled={pending}
          className={`text-xs tracking-[0.1em] uppercase px-4 py-2 border rounded transition-colors ${
            !paymentsDisabled
              ? 'bg-green-600 text-white border-green-600'
              : 'border-[#e0ddd8] text-[#535353] hover:border-green-600 hover:text-green-600'
          }`}
        >
          On
        </button>
        <button
          onClick={() => set(true)}
          disabled={pending}
          className={`text-xs tracking-[0.1em] uppercase px-4 py-2 border rounded transition-colors ${
            paymentsDisabled
              ? 'bg-red-500 text-white border-red-500'
              : 'border-[#e0ddd8] text-[#535353] hover:border-red-500 hover:text-red-500'
          }`}
        >
          Off
        </button>
        {pending && <span className="text-xs text-[#aaa] self-center">Saving…</span>}
      </div>
      <p className="text-xs text-[#aaa] leading-relaxed">
        <strong>Off</strong> — hides the &ldquo;Pay Here&rdquo; button and bank-transfer details on the portal, and blocks
        invoice creation, for when you&rsquo;re raising the invoice elsewhere (e.g. through Sarah&rsquo;s business).
        The client still sees their balance with a note that an invoice will be sent separately.
      </p>
    </div>
  )
}
