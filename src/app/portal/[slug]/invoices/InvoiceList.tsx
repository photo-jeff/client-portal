'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, Clock } from 'lucide-react'

const DEPOSIT = 600

interface BalanceData {
  total: number | null
  outstanding: number | null
}

interface ZohoData {
  url: string | null
}

function fmt(n: number) {
  return '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2 })
}

function Box({
  label,
  value,
  sub,
  status,
}: {
  label: string
  value: React.ReactNode
  sub?: string
  status?: 'paid' | 'outstanding' | null
}) {
  return (
    <div className="bg-white border border-[#e0ddd8] p-6">
      <p className="text-xs tracking-[0.1em] uppercase text-[#888] mb-2">{label}</p>
      <div className="flex items-end justify-between gap-4">
        <p className="font-serif text-3xl leading-none">{value}</p>
        {status === 'paid' && (
          <div className="flex items-center gap-1.5 text-green-600 shrink-0">
            <CheckCircle size={15} />
            <span className="text-xs tracking-[0.08em] uppercase">Paid</span>
          </div>
        )}
        {status === 'outstanding' && (
          <div className="flex items-center gap-1.5 text-[#888] shrink-0">
            <Clock size={15} />
            <span className="text-xs tracking-[0.08em] uppercase">Outstanding</span>
          </div>
        )}
      </div>
      {sub && <p className="text-xs text-[#aaa] mt-2">{sub}</p>}
    </div>
  )
}

export function InvoiceList({ slug }: { slug: string }) {
  const [data, setData] = useState<BalanceData | undefined>(undefined)
  const [zoho, setZoho] = useState<ZohoData | undefined>(undefined)

  useEffect(() => {
    fetch(`/api/portal/balance?slug=${slug}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData({ total: null, outstanding: null }))

    fetch(`/api/portal/zoho-invoice?slug=${slug}`)
      .then(r => r.json())
      .then(d => setZoho(d))
      .catch(() => setZoho({ url: null }))
  }, [slug])

  const loading = data === undefined
  const total = data?.total ?? null
  const outstanding = data?.outstanding ?? null

  // remaining = total - deposit (the "balance" portion they agreed to pay)
  const remaining = total !== null ? Math.max(0, total - DEPOSIT) : null

  return (
    <div className="space-y-4">

      {/* 1. Total cost */}
      <Box
        label="Total package cost"
        value={loading ? <span className="text-[#ccc]">Loading…</span> : total !== null ? fmt(total) : <span className="text-[#ccc]">—</span>}
      />

      {/* 2. Booking deposit */}
      <Box
        label="Booking deposit"
        value={fmt(DEPOSIT)}
        sub="Paid at time of booking"
        status="paid"
      />

      {/* 3. Remaining balance */}
      <Box
        label="Remaining balance"
        value={loading ? <span className="text-[#ccc]">Loading…</span> : remaining !== null ? fmt(remaining) : <span className="text-[#ccc]">—</span>}
        sub={remaining !== null ? `Total package cost minus your deposit` : undefined}
      />

      {/* 4. Final balance outstanding */}
      <Box
        label="Final balance"
        value={
          loading
            ? <span className="text-[#ccc]">Loading…</span>
            : outstanding !== null
            ? fmt(outstanding)
            : <span className="text-[#ccc]">—</span>
        }
        sub={outstanding === 0 ? 'All paid — thank you!' : outstanding !== null ? 'Amount currently outstanding' : undefined}
        status={outstanding === 0 ? 'paid' : outstanding !== null && outstanding > 0 ? 'outstanding' : null}
      />

      {outstanding !== null && outstanding > 0 && (
        <div className="bg-[#faf9f7] border border-[#e0ddd8] p-5 space-y-4">
          {zoho?.url && (
            <a
              href={zoho.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs tracking-[0.12em] uppercase font-medium px-6 py-3 transition-colors"
            >
              Pay Here →
            </a>
          )}
          <div>
            <p className="text-xs tracking-[0.1em] uppercase text-[#888] mb-2">How to pay</p>
            <p className="text-sm text-[#888] leading-relaxed">
              {zoho?.url
                ? 'Pay securely online using the button above, or by bank transfer using your names and wedding date as the reference.'
                : 'Please pay by bank transfer using your names and wedding date as the reference, then drop us an email to confirm.'}
            </p>
          </div>
        </div>
      )}

    </div>
  )
}
