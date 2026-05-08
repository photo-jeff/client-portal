'use client'
import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Invoice } from '@/lib/types'

interface Props {
  clientId: string
  zohoContactId: string | null
}

function statusLabel(status: Invoice['status']) {
  const map = { draft: 'Draft', sent: 'Awaiting payment', paid: 'Paid', overdue: 'Overdue', void: 'Void' }
  return map[status] ?? status
}

function statusClass(status: Invoice['status']) {
  if (status === 'paid') return 'text-[#888]'
  if (status === 'overdue') return 'text-red-500'
  return 'text-[#1a1a1a]'
}

export function InvoiceList({ clientId, zohoContactId }: Props) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/invoices?clientId=${clientId}`)
      if (res.ok) {
        const data = await res.json()
        setInvoices(data)
      }
      setLoading(false)
    }
    load()
  }, [clientId])

  if (loading) {
    return (
      <div className="bg-white border border-[#e0ddd8] p-8 text-center text-sm text-[#888]">
        Loading invoices…
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white border border-[#e0ddd8] p-8 text-center text-sm text-[#888]">
        No invoices found.
      </div>
    )
  }

  const totalBalance = invoices.reduce((sum, inv) => sum + inv.balance, 0)
  const symbol = invoices[0]?.currency_symbol ?? '£'

  return (
    <div className="space-y-4">
      {invoices.map(inv => (
        <div key={inv.id} className="bg-white border border-[#e0ddd8] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.1em] uppercase text-[#888]">Invoice {inv.invoice_number}</p>
              <p className="font-serif text-xl mt-0.5">{symbol}{inv.total.toFixed(2)}</p>
              {inv.due_date && (
                <p className="text-xs text-[#aaa] mt-1">
                  Due {new Date(inv.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
            <div className="text-right">
              <span className={`text-xs tracking-[0.08em] uppercase ${statusClass(inv.status)}`}>
                {statusLabel(inv.status)}
              </span>
              {inv.balance > 0 && inv.payment_url && (
                <div className="mt-3">
                  <a href={inv.payment_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="filled" size="sm">
                      Pay {symbol}{inv.balance.toFixed(2)} <ExternalLink size={11} className="ml-1.5" />
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {totalBalance > 0 && (
        <div className="border border-[#1a1a1a] p-4 flex justify-between items-center">
          <p className="text-xs tracking-[0.1em] uppercase">Outstanding balance</p>
          <p className="font-serif text-xl">{symbol}{totalBalance.toFixed(2)}</p>
        </div>
      )}
    </div>
  )
}
