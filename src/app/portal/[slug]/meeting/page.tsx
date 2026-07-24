import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Divider } from '@/components/ui/Divider'
import { MeetingBookingWidget } from './MeetingBookingWidget'

export const dynamic = 'force-dynamic'

const MEETING_CONFIG = {
  final_meeting: {
    title: 'Final Details Meeting',
    subtitle: 'A chance to go over everything before the big day.',
    urlKey: 'final_meeting_calendly_url',
    label: 'Final Details Meeting',
    atKey: 'final_meeting_at',
    rescheduleKey: 'final_meeting_reschedule_url',
  },
  phone_call: {
    title: 'Phone Call',
    subtitle: 'A quick call to answer any questions as the day approaches.',
    urlKey: 'phone_call_calendly_url',
    label: 'Phone Call',
    atKey: 'phone_call_at',
    rescheduleKey: 'phone_call_reschedule_url',
  },
}

export default async function MeetingPage({
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

  const finalMeetingEnabled = (client as Record<string, unknown>).final_meeting_enabled as boolean ?? false
  const phoneCallEnabled    = (client as Record<string, unknown>).phone_call_enabled    as boolean ?? false

  const meetingType = finalMeetingEnabled ? 'final_meeting' : phoneCallEnabled ? 'phone_call' : null
  if (!meetingType) notFound()

  const config = MEETING_CONFIG[meetingType]

  const { data: rows } = await admin
    .from('portal_settings')
    .select('value')
    .eq('key', config.urlKey)
    .single()

  const calendlyUrl = rows?.value ?? ''

  const meetingAt = (client as Record<string, unknown>)[config.atKey] as string | null ?? null
  const rescheduleUrl = (client as Record<string, unknown>)[config.rescheduleKey] as string | null ?? null

  const partnerName = `${client.partner1_name}${client.partner2_name ? ` & ${client.partner2_name}` : ''}`

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/portal/${slug}`}
        className="inline-flex items-center gap-2 text-xs tracking-[0.1em] uppercase text-[#919295] hover:text-[#535353] mb-8 transition-colors"
      >
        <ChevronLeft size={14} /> Back
      </Link>

      <div className="text-center mb-10">
        <h1 className="font-serif text-4xl mb-2">{config.title}</h1>
        <Divider />
        <p className="text-sm text-[#919295] mt-4 max-w-md mx-auto">{config.subtitle}</p>
      </div>

      <MeetingBookingWidget
        calendlyUrl={calendlyUrl}
        partnerName={partnerName}
        clientEmail={client.email ?? null}
        slug={slug}
        meetingType={meetingType}
        label={config.label}
        meetingAt={meetingAt}
        rescheduleUrl={rescheduleUrl}
      />
    </div>
  )
}
