'use client'
import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  clientId: string
  paymentsDisabled: boolean
  externalPaidAt: string | null
}

export function PaymentsToggle({ clientId, paymentsDisabled, externalPaidAt }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [paidPending, startPaidTransition] = useTransition()

  async function set(disabled: boolean) {
    await fetch(`/api/admin/client/${clientId}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled }),
    })
    startTransition(() => router.refresh())
  }

  async function setPaid(paid: boolean) {
    await fetch(`/api/admin/client/${clientId}/mark-paid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid }),
    })
    startPaidTransition(() => router.refresh())
  }

  const isPaid = !!externalPaidAt
  const paidDate = externalPaidAt
    ? new Date(externalPaidAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

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

      {/* Manual "paid" marker — only relevant when portal payment is off, i.e.
          the invoice was raised elsewhere and you're recording that it's paid. */}
      {paymentsDisabled && (
        <div className="pt-4 border-t border-[#f0ede8] space-y-3">
          <div>
            <span className="text-xs tracking-[0.1em] uppercase text-[#888] block mb-1">External invoice</span>
            <span className={`font-medium ${isPaid ? 'text-green-600' : 'text-[#919295]'}`}>
              {isPaid ? `Marked paid on ${paidDate}` : 'Not yet marked paid'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPaid(!isPaid)}
              disabled={paidPending}
              className={`text-xs tracking-[0.1em] uppercase px-4 py-2 border rounded transition-colors ${
                isPaid
                  ? 'bg-green-600 text-white border-green-600'
                  : 'border-[#e0ddd8] text-[#535353] hover:border-green-600 hover:text-green-600'
              }`}
            >
              {isPaid ? 'Paid ✓' : 'Mark as paid'}
            </button>
            {paidPending && <span className="text-xs text-[#aaa]">Saving…</span>}
          </div>
          <p className="text-xs text-[#aaa] leading-relaxed">
            Marks the separately-raised invoice as paid. The portal then shows the balance as
            <strong> Paid</strong> instead of &ldquo;an invoice will be sent separately&rdquo;. Toggle off to undo.
          </p>
        </div>
      )}
    </div>
  )
}
