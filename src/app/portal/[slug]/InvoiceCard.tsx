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

  useEffect(() => {
    fetch(`/api/portal/balance?slug=${slug}`)
      .then(r => r.json())
      .then(d => setOutstanding(typeof d.outstanding === 'number' ? d.outstanding : null))
      .catch(() => {/* leave null — no urgency shown */})
  }, [slug])

  const hasBalance = outstanding !== null && outstanding > 0
  const isUrgent   = hasBalance && daysUntil !== null && daysUntil > 0 && daysUntil <= 30

  return (
    <SectionCard
      title="Invoices"
      description="Your deposit and balance information."
      href={href}
      urgent={isUrgent}
    />
  )
}
