'use client'
import { useState, useEffect } from 'react'
import { SectionCard } from '@/components/portal/SectionCard'

interface Props {
  slug: string
  daysUntil: number | null
  href: string
}

export function InvoiceCard({ slug, daysUntil, href }: Props) {
  const [outstanding, setOutstanding] = useState<number | null>(null)
  const [zohoPaid, setZohoPaid] = useState(false)

  useEffect(() => {
    fetch(`/api/portal/balance?slug=${slug}`)
      .then(r => r.json())
      .then(d => setOutstanding(typeof d.outstanding === 'number' ? d.outstanding : null))
      .catch(() => {/* leave null — no urgency shown */})

    fetch(`/api/portal/zoho-invoice?slug=${slug}`)
      .then(r => r.json())
      .then(d => { if (d.status === 'paid') setZohoPaid(true) })
      .catch(() => {/* ignore */})
  }, [slug])

  const hasBalance = !zohoPaid && outstanding !== null && outstanding > 0
  const isUrgent   = hasBalance && daysUntil !== null && daysUntil > 0 && daysUntil <= 42

  return (
    <SectionCard
      title="Invoices"
      description="View or pay your balance."
      href={href}
      urgent={isUrgent}
    />
  )
}
