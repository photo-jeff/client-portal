import { Divider } from '@/components/ui/Divider'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const MOCK_INVOICES = [
  {
    number: 'INV-2025-087',
    description: 'Booking deposit — Gold Collection',
    date: '15 January 2025',
    due: '1 February 2025',
    total: 500,
    balance: 0,
    status: 'paid' as const,
  },
  {
    number: 'INV-2025-142',
    description: 'Balance payment — Gold Collection',
    date: '1 December 2025',
    due: '1 March 2026',
    total: 1950,
    balance: 1950,
    status: 'sent' as const,
    paymentUrl: '#',
  },
]

export default function PreviewInvoices() {
  const totalBalance = MOCK_INVOICES.reduce((s, i) => s + i.balance, 0)

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/preview" className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#888] hover:text-[#1a1a1a] mb-8 transition-colors">
        <ChevronLeft size={14} /> Back
      </Link>
      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Invoices</h1>
        <Divider />
      </div>

      <div className="space-y-4">
        {MOCK_INVOICES.map(inv => (
          <div key={inv.number} className="bg-white border border-[#e0ddd8] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.1em] uppercase text-[#888]">Invoice {inv.number}</p>
                <p className="font-serif text-xl mt-0.5">£{inv.total.toLocaleString()}</p>
                <p className="text-xs text-[#aaa] mt-1">{inv.description}</p>
                <p className="text-xs text-[#aaa]">Due {inv.due}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs tracking-[0.08em] uppercase ${inv.status === 'paid' ? 'text-[#888]' : 'text-[#1a1a1a]'}`}>
                  {inv.status === 'paid' ? 'Paid' : 'Awaiting payment'}
                </span>
                {inv.balance > 0 && (
                  <div className="mt-3">
                    <a href={inv.paymentUrl ?? '#'} target="_blank" rel="noopener noreferrer">
                      <Button variant="filled" size="sm">
                        Pay £{inv.balance.toLocaleString()} <ExternalLink size={11} className="ml-1.5" />
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
            <p className="font-serif text-xl">£{totalBalance.toLocaleString()}</p>
          </div>
        )}
      </div>

      <div className="mt-8 bg-[#faf9f7] border border-[#e0ddd8] p-6">
        <p className="text-xs tracking-[0.1em] uppercase text-[#888] mb-2">Bank transfer</p>
        <p className="text-sm text-[#888]">
          You can also pay by bank transfer. Please use your invoice number as the reference and email us once sent.
        </p>
      </div>
    </div>
  )
}
