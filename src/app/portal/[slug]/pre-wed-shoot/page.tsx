export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { Divider } from '@/components/ui/Divider'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PrewedBookingWidget } from './PrewedBookingWidget'

export default async function PrewedShootPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('*')
    .eq('portal_slug', slug)
    .single()

  if (!client) notFound()

  const shootAt = (client as Record<string, unknown>).prewedding_shoot_at as string | null ?? null
  const rescheduleUrl = (client as Record<string, unknown>).prewedding_reschedule_url as string | null ?? null

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/portal/${slug}`}
        className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#919295] hover:text-[#535353] mb-8 transition-colors"
      >
        <ChevronLeft size={14} /> Back
      </Link>

      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">Pre-Wedding Shoot</h1>
        <Divider />
        <p className="text-sm text-[#919295] mt-4 max-w-md mx-auto">
          {shootAt
            ? 'Your shoot is booked — details below.'
            : 'Choose a date and time that works for you. Your name and email are pre-filled.'}
        </p>
      </div>

      <PrewedBookingWidget
        shootAt={shootAt}
        rescheduleUrl={rescheduleUrl}
        partnerName={client.partner1_name ?? ''}
        clientEmail={client.email ?? null}
      />
    </div>
  )
}
