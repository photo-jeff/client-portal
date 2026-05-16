'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, Clock } from 'lucide-react'

interface Props {
  slug: string
}

export function InvoiceList({ slug }: Props) {
  const [outstanding, setOutstanding] = useState<number | null | undefined>(undefined)

  useEffect(() => {
    fetch(`/api/portal/balance?slug=${slug}`)
      .then(r => r.json())
      .then(d => setOutstanding(d.outstanding))
      .catch(() => setOutstanding(null))
  }, [slug])

  return (
    <div className="space-y-4">

      {/* Fixed deposit row */}
      <div className="bg-white border border-[#e0ddd8] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.1em] uppercase text-[#888] mb-1">Booking deposit</p>
            <p className="font-serif text-3xl">£600</p>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={16} />
            <span className="text-xs tracking-[0.08em] uppercase">Paid</span>
          </div>
        </div>
      </div>

      {/* Balance row */}
      <div className="bg-white border border-[#e0ddd8] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.1em] uppercase text-[#888] mb-1">Remaining balance</p>
            {outstanding === undefined ? (
              <p className="font-serif text-3xl text-[#ccc]">Loading…</p>
            ) : outstanding === null ? (
              <p className="font-serif text-3xl text-[#ccc]">—</p>
            ) : outstanding === 0 ? (
              <p className="font-serif text-3xl">£0</p>
            ) : (
              <p className="font-serif text-3xl">£{outstanding.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
            )}
          </div>
          <div className="text-right">
            {outstanding === undefined ? null
              : outstanding === 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={16} />
                  <span className="text-xs tracking-[0.08em] uppercase">Paid</span>
                </div>
              ) : outstanding !== null ? (
                <div className="flex items-center gap-2 text-[#888]">
                  <Clock size={16} />
                  <span className="text-xs tracking-[0.08em] uppercase">Outstanding</span>
                </div>
              ) : null}
          </div>
        </div>
      </div>

      {outstanding !== null && outstanding !== undefined && outstanding > 0 && (
        <div className="bg-[#faf9f7] border border-[#e0ddd8] p-5 space-y-1">
          <p className="text-xs tracking-[0.1em] uppercase text-[#888]">How to pay</p>
          <p className="text-sm text-[#888]">
            Please pay by bank transfer using your names and wedding date as the reference, then drop us an email to confirm.
          </p>
        </div>
      )}

    </div>
  )
}
