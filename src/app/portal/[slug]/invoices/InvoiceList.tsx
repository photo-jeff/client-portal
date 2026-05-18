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
  status: 'outstanding' | 'none' | 'no-contact' | 'error'
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
      <p className="text-xs tracking-[0.1em] uppercase text-[#919295] mb-2">{label}</p>
      <div className="flex items-end justify-between gap-4">
        <p className="font-serif text-3xl leading-none">{value}</p>
        {status === 'paid' && (
          <div className="flex items-center gap-1.5 text-green-600 shrink-0">
            <CheckCircle size={15} />
            <span className="text-xs tracking-[0.08em] uppercase">Paid</span>
          </div>
        )}
        {status === 'outstanding' && (
          <div className="flex items-center gap-1.5 text-[#919295] shrink-0">
            <Clock size={15} />
            <span className="text-xs tracking-[0.08em] uppercase">Outstanding</span>
          </div>
        )}
      </div>
      {sub && <p className="text-xs text-[#b5b8ba] mt-2">{sub}</p>}
    </div>
  )
}

export function InvoiceList({ slug }: { slug: string }) {
  const [data, setData] = useState<BalanceData | undefined>(undefined)
  const [zoho, setZoho] = useState<ZohoData | undefined>(undefined)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(false)

  useEffect(() => {
    fetch(`/api/portal/balance?slug=${slug}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => setData({ total: null, outstanding: null }))

    fetch(`/api/portal/zoho-invoice?slug=${slug}`)
      .then(r => r.json())
      .then(d => setZoho(d))
      .catch(() => setZoho({ url: null, status: 'error' }))
  }, [slug])

  async function handlePay() {
    if (!zoho) return

    if (zoho.status === 'outstanding' && zoho.url) {
      window.open(zoho.url, '_blank')
      return
    }

    if (zoho.status === 'none') {
      setCreating(true)
      setCreateError(false)
      try {
        const res = await fetch(`/api/portal/zoho-invoice?slug=${slug}`, { method: 'POST' })
        if (!res.ok) throw new Error('Failed to create invoice')
        const { url } = await res.json()
        if (url) {
          // Update local state so a refresh shows the existing invoice
          setZoho({ url, status: 'outstanding' })
          window.open(url, '_blank')
        } else {
          setCreateError(true)
        }
      } catch {
        setCreateError(true)
      } finally {
        setCreating(false)
      }
    }
  }

  const loading = data === undefined
  const total = data?.total ?? null
  const outstanding = data?.outstanding ?? null
  const remaining = total !== null ? Math.max(0, total - DEPOSIT) : null

  const canPay = zoho?.status === 'outstanding' || zoho?.status === 'none'
  const zohoLoading = zoho === undefined

  return (
    <div className="space-y-4">

      {/* 1. Total cost */}
      <Box
        label="Total package cost"
        value={loading ? <span className="text-[#d0d3d6]">Loading…</span> : total !== null ? fmt(total) : <span className="text-[#d0d3d6]">—</span>}
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
        value={loading ? <span className="text-[#d0d3d6]">Loading…</span> : remaining !== null ? fmt(remaining) : <span className="text-[#d0d3d6]">—</span>}
        sub={remaining !== null ? 'Total package cost minus your deposit' : undefined}
      />

      {/* 4. Final balance outstanding */}
      <Box
        label="Final balance"
        value={
          loading
            ? <span className="text-[#d0d3d6]">Loading…</span>
            : outstanding !== null
            ? fmt(outstanding)
            : <span className="text-[#d0d3d6]">—</span>
        }
        sub={outstanding === 0 ? 'All paid — thank you!' : outstanding !== null ? 'Amount currently outstanding' : undefined}
        status={outstanding === 0 ? 'paid' : outstanding !== null && outstanding > 0 ? 'outstanding' : null}
      />

      {outstanding !== null && outstanding > 0 && (
        <div className="bg-[#faf9f7] border border-[#e0ddd8] p-5 space-y-4">

          {!zohoLoading && canPay && (
            <div className="space-y-2">
              <button
                onClick={handlePay}
                disabled={creating}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs tracking-[0.12em] uppercase font-medium px-6 py-3 transition-colors"
              >
                {creating ? 'Generating invoice…' : 'Pay Here →'}
              </button>
              {createError && (
                <p className="text-xs text-red-500">
                  Something went wrong generating your invoice — please pay by bank transfer below or contact Jeff directly.
                </p>
              )}
            </div>
          )}

          <div>
            <p className="text-xs tracking-[0.1em] uppercase text-[#919295] mb-2">How to pay</p>
            <p className="text-sm text-[#919295] leading-relaxed">
              {canPay
                ? 'Pay securely online using the button above, or by bank transfer using your names and wedding date as the reference.'
                : 'Please pay by bank transfer using your names and wedding date as the reference, then drop us an email to confirm.'}
            </p>
          </div>

        </div>
      )}

    </div>
  )
}
